import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchFromAPI } from '../../api/api';
import { TiArrowDownOutline, TiArrowUpOutline } from "react-icons/ti";
import Loading from './Loading';
import '../styles/postdetail.css';
import '../styles/main.css';

interface Post {
  post_id: string;
  user_id: string;
  title: string;
  content: string;
  image?: string;
  created_at: string;
}

interface Subreddit {
  subreddit_id: string;
  name: string;
  title: string;
  description: string;
}

interface User {
  user_id: string;
  username: string;
  profilePic: string;
}

interface Comment {
  comment_id: string;
  content: string;
  created_at: string;
  user: {
    user_id: string;
    username: string;
    profilePic: string;
  };
  replies: Comment[]; // Recursive
}

const PostDetail = () => {
  const { id } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);  // Ensure this is always an empty array
  const [newComment, setNewComment] = useState<string>('');
  const [replyContent, setReplyContent] = useState<{ [key: string]: string }>({});
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [user, setUser] = useState<{ username: string; profilePic: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        setIsLoggedIn(true);
        fetch('http://localhost:5000/api/me', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
          .then((response) => response.json())
          .then((data) => {
            setUser({ username: data.username, profilePic: data.profilePic });
          })
          .catch((error) => console.error('Error fetching user data:', error));
      }

      fetchPostAndComments();
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    finally {
      setIsLoading(false);
    }

  }, [id]);

  const fetchPostAndComments = async () => {
    try {
      const postResponse = await fetchFromAPI(`/posts/${id}`);
      console.log(postResponse.image)
      setPost(postResponse);

      const commentsResponse = await fetchFromAPI(`/posts/${id}/comments`);

      const rawComments = commentsResponse;

      const cleanedComments = rawComments.map((c: any) => c.comment ? c.comment : c);

      const nested = nestComments(cleanedComments);
      setComments(nested); // Clear and set the new state
    } catch (error) {
      console.error('Error fetching post or comments', error);
      setComments([]); // Reset comments on error
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment) return;

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to comment.');
      return;
    }

    try {
      const response = await fetch(`/api/posts/${id}/comments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment, parent_comment_id: null }),
      });

      if (response.ok) {
        setNewComment('');
        await fetchPostAndComments(); // ✅ Refetch to rebuild threaded structure
      } else {
        alert('Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('An error occurred while adding your comment.');
    }
  };

  const handleReply = async (e: React.FormEvent, parentCommentId: string) => {
    e.preventDefault();
    const content = replyContent[parentCommentId];
    if (!content) return;

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to reply.');
      return;
    }

    try {
      const response = await fetch(`/api/posts/${id}/comments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, parent_comment_id: parentCommentId }),
      });

      if (response.ok) {
        const newReply = await response.json();
        console.log("API Response for new reply:", newReply);

        const updatedComments = addReplyToComment(comments, parentCommentId, newReply.comment);
        setComments(updatedComments);
        setReplyContent({ ...replyContent, [parentCommentId]: '' });
        await fetchPostAndComments(); // Refetch to rebuild threaded structure
      } else {
        alert('Failed to add reply');
      }
    } catch (error) {
      console.error('Error adding reply:', error);
      alert('An error occurred while adding your reply.');
    }
  };

  function nestComments(flatComments: any[]): Comment[] {
    const commentMap: { [key: string]: Comment } = {};
    const rootComments: Comment[] = [];

    flatComments.forEach((c) => {
      if (!commentMap[c.comment_id]) {
        commentMap[c.comment_id] = {
          comment_id: c.comment_id,
          content: c.content,
          created_at: c.created_at,
          user: c.user,
          replies: [],
        };
        console.log("TIMESTAMP:", c.created_at);
      }
    });

    flatComments.forEach((c) => {
      if (c.parent_comment_id && commentMap[c.parent_comment_id]) {
        const parent = commentMap[c.parent_comment_id];
        const isDuplicate = parent.replies.some((reply) => reply.comment_id === c.comment_id);
        if (!isDuplicate) {
          parent.replies.push(commentMap[c.comment_id]);
        }
      } else {
        rootComments.push(commentMap[c.comment_id]);
      }
    });

    return rootComments;
  }

  const addReplyToComment = (
    commentsList: Comment[],
    parentId: string,
    newReply: Comment
  ): Comment[] => {
    console.log("Adding reply to comments:", commentsList);
    console.log("Parent ID:", parentId);
    console.log("New Reply:", newReply);

    return commentsList.map((comment) => {
      if (comment.comment_id === parentId) {
        const isDuplicate = comment.replies.some(
          (reply) => reply.comment_id === newReply.comment_id
        );
        if (!isDuplicate) {
          console.log("Adding new reply to parent:", parentId);
          return { ...comment, replies: [...(comment.replies || []), newReply] };
        } else {
          console.log("Duplicate reply detected, skipping.");
        }
      }
      if (comment.replies) {
        return { ...comment, replies: addReplyToComment(comment.replies, parentId, newReply) };
      }
      return comment;
    });
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="post-detail-container">
      <button className="back-button" onClick={() => navigate(-1)}>
        Back
      </button>
      {post && (
        <>
          <h1 className="post-detail-header">{post.title}</h1>

          {/* Display the image if it exists */}
          {post.image && (
            <div className="post-image-container">
              <img
                src={`http://localhost:5173${post.image}`}
                alt="Post"
                className="post-image"
              />
            </div>
          )}

          <p className="post-detail-content">{post.content}</p>

          <div className="add-comment-section">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="new-comment-input"
            />
            <button onClick={(e) => handleAddComment(e)}>Submit Comment</button>
          </div>

          <div className="comment-section">
            <h2 className="comment-header">Comments</h2>
            {comments.length > 0 ? (
              comments.map((comment) => (
                <Comment
                  key={comment.comment_id}
                  comment={comment}
                  replyContent={replyContent}
                  setReplyContent={setReplyContent}
                  handleReply={handleReply}
                  fetchPostAndComments={fetchPostAndComments}
                  currentUser={user}
                />
              ))
            ) : (
              <p>No comments yet</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PostDetail;

const Comment = ({
  comment,
  replyContent,
  setReplyContent,
  handleReply,
  fetchPostAndComments,
  currentUser,
}: {
  comment: Comment;
  replyContent: { [key: string]: string };
  setReplyContent: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  handleReply: (e: React.FormEvent, parentCommentId: string) => void;
  fetchPostAndComments: () => Promise<void>;
  currentUser: { username: string; profilePic: string } | null;
}) => {
  const [userVote, setUserVote] = useState<null | 'upvote' | 'downvote'>(null);
  const [voteCount, setVoteCount] = useState<number>(0);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  const [voteId, setVoteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      fetchVoteCount();
      fetchUserVote();
    } catch (error) {
      console.error('Error fetching vote data:', error);
    }
    finally {
      setIsLoading(false);
    }
  }, []);

  const fetchVoteCount = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/comments/${comment.comment_id}/votes/count`);
      const data = await response.json();
      setVoteCount(data.score); // Update the vote count
    } catch (error) {
      console.error('Error fetching vote count:', error);
    }
  };

  const fetchUserVote = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:5000/api/comments/${comment.comment_id}/votes`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const vote = data[0]; // Assuming one vote per comment per user
        setUserVote(vote.vote_type ? 'upvote' : 'downvote');
        setVoteId(vote.vote_id || null);
      }
    } catch (error) {
      console.error('Error fetching user vote:', error);
    }
  };

  const handleVote = async (type: 'upvote' | 'downvote') => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to vote.');
      return;
    }

    try {
      if (userVote === type) {
        // Cancel the vote
        await handleCancelVote();
      } else {
        // Cast a new vote
        const voteType = type === 'upvote' ? true : false;

        const response = await fetch(`http://localhost:5000/api/comments/${comment.comment_id}/votes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ vote_type: voteType }),
        });

        const data = await response.json();
        if (response.ok) {
          fetchVoteCount(); // Refresh the vote count
          setUserVote(type); // Update the user's vote locally
          setVoteId(data.vote.vote_id || null); // Store the vote ID
        } else {
          alert(data.message || 'Failed to vote.');
        }
      }
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleEditComment = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to edit your comment.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/comments/${comment.comment_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: editedContent }), // Use the updated content
      });

      if (response.ok) {
        alert('Comment updated successfully.');
        setShowEditPopup(false);
        fetchPostAndComments(); // Refresh comments
      } else {
        alert('Failed to update comment.');
      }
    } catch (error) {
      console.error('Error editing comment:', error);
    }
  };

  const handleDeleteComment = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to delete your comment.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/comments/${comment.comment_id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('Comment deleted successfully.');
        setShowDeletePopup(false);
        fetchPostAndComments(); // Refresh comments
      } else {
        alert('Failed to delete comment.');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleCancelVote = async () => {
    if (!voteId) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to cancel your vote.');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/votes/${voteId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchVoteCount(); // Refresh the vote count
        setUserVote(null); // Reset the user's vote
        setVoteId(null); // Clear the vote ID
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to cancel vote.');
      }
    } catch (error) {
      console.error('Error canceling vote:', error);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="comment-card">
      <div className="comment-header">
        <div className="comment-author-section">
          {/* Author Profile Picture */}
          <img
            src={comment.user.profilePic || '/default.png'}
            alt={`${comment.user.username}'s profile`}
            className="comment-author-profile-pic"
          />
          {/* Author Name (Clickable) */}
          <a href={"http://localhost:5173/u/" + (comment.user)?.username} className="comment-author">
            {comment.user.username}
          </a>
        </div>
        <p className="comment-timestamp">{new Date(comment.created_at).toLocaleString()}</p>
      </div>
      <p className="comment-content">{comment.content}</p>

      {/* Kebab Menu */}
      {currentUser?.username === comment.user.username && (
        <div
          className="kebab-menu"
          onMouseEnter={() => setShowMenu(true)}
          onMouseLeave={() => setShowMenu(false)}
        >
          <button>⋮</button>
          {showMenu && (
            <div className="menu-options">
              <button onClick={() => setShowEditPopup(true)}>Edit</button>
              <button onClick={() => setShowDeletePopup(true)}>Delete</button>
            </div>
          )}
        </div>
      )}

      {/* Reply and Vote Section */}
      <div className="reply-vote-section">
        <textarea
          value={replyContent[comment.comment_id] || ''}
          onChange={(e) =>
            setReplyContent({ ...replyContent, [comment.comment_id]: e.target.value })
          }
          placeholder="Reply to this comment..."
          className="reply-input"
        />
        <div className="reply-vote-buttons">
          <button className="reply-button" onClick={(e) => handleReply(e, comment.comment_id)}>
            Reply
          </button>
          <button
            className={`vote-button ${userVote === 'upvote' ? 'upvoted' : ''} up`}
            onClick={(e) => {
              e.stopPropagation();  // Prevent redirect on button click
              handleVote('upvote');
            }}
          >
            <TiArrowUpOutline className={`arrow ${userVote === 'upvote' ? 'upvoted-arrow' : ''}`} />
          </button>

          {/* Display total upvotes */}
          <span className="vote-count">{voteCount > 0 ? voteCount : 0}</span>

          <button
            className={`vote-button ${userVote === 'downvote' ? 'downvoted' : ''} down`}
            onClick={(e) => {
              e.stopPropagation();  // Prevent redirect on button click
              handleVote('downvote');
            }}
          >
            <TiArrowDownOutline className={`arrow ${userVote === 'downvote' ? 'downvoted-arrow' : ''}`} />
          </button>
        </div>
      </div>

      {/* Edit Popup */}
      {showEditPopup && (
        <div className="popup">
          <div className="popup-content">
            <h3>Edit Comment</h3>
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="edit-input"
            />
            <button onClick={() => {
              setEditedContent(comment.content);
              setShowEditPopup(false)
            }
            }>Cancel</button>
            <button onClick={handleEditComment}>Edit</button>
          </div>
        </div>
      )}

      {/* Delete Popup */}
      {showDeletePopup && (
        <div className="popup">
          <div className="popup-content">
            <h3>Are you sure you want to delete this comment?</h3>
            <button onClick={() => setShowDeletePopup(false)}>Cancel</button>
            <button onClick={handleDeleteComment}>Delete</button>
          </div>
        </div>
      )}

      {/* Replies Section */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="replies-section">
          {comment.replies.map((reply) => (
            <Comment
              key={reply.comment_id}
              comment={reply}
              replyContent={replyContent}
              setReplyContent={setReplyContent}
              handleReply={handleReply}
              fetchPostAndComments={fetchPostAndComments}
              currentUser={currentUser}
            />
          ))}
        </div>
      )}
    </div>
  );
};
