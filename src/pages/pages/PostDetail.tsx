import Loading from './Loading';
import Navbar from '../component/Navbar';

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchFromAPI } from '../../api/auth';
import { TiArrowDownOutline, TiArrowUpOutline } from "react-icons/ti";
import { fetchFromAPIWithoutAuth } from '../../api/noAuth';

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
  replies: Comment[];
  upvotes?: number;
  downvotes?: number;
  score?: number;
  currentUserVote?: 'upvote' | 'downvote' | null;
}

const PostDetail = () => {
  const { id } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState<string>('');
  const [replyContent, setReplyContent] = useState<{ [key: string]: string }>({});
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [user, setUser] = useState<{ user_id: string; username: string; profilePic: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  const navigate = useNavigate();
  
  // Navbar related state
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (token) {
          setIsLoggedIn(true);
          const data = await fetchFromAPI('/me', 'GET');
          setUser({ user_id: data.user_id, username: data.username, profilePic: data.profile_pic });
        } else {
          setUser(null);
        }
        await fetchPost();
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Only fetch the post (with comments bundled)
  const fetchPost = async () => {
    try {
      const postResponse = await fetchFromAPIWithoutAuth(`/posts/${id}`, 'GET');
      setPost(postResponse);
      // Use comments from the post response
      if (postResponse.comments) {
        // If comments are flat, nest them; if already nested, just set
        const nested = Array.isArray(postResponse.comments) && postResponse.comments.length > 0 && postResponse.comments[0].replies === undefined
          ? nestComments(postResponse.comments)
          : postResponse.comments;
        setComments(nested);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error('Error fetching post', error);
      setComments([]);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment) return;

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetchFromAPI(`/posts/${id}/comments`, 'POST', { content: newComment, parent_comment_id: null });

      if (response) {
        setNewComment('');
        await fetchPost();
      } else {
        showAlert('Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      showAlert('An error occurred while adding your comment.');
    }
  };

  const handleReply = async (e: React.FormEvent, parentCommentId: string) => {
    e.preventDefault();
    const content = replyContent[parentCommentId];
    if (!content) return;

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetchFromAPI(`/posts/${id}/comments`, 'POST', { content, parent_comment_id: parentCommentId });
      if (response) {
        const newReply = response.comment;

        const updatedComments = addReplyToComment(comments, parentCommentId, newReply);
        setComments(updatedComments);
        setReplyContent({ ...replyContent, [parentCommentId]: '' });
        await fetchPost();
      } else {
        showAlert('Failed to add reply');
      }
    } catch (error) {
      console.error('Error adding reply:', error);
      showAlert('An error occurred while adding your reply.');
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

  const showAlert = (message: string, type: 'success' | 'error' = 'success') => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ ...alert, show: false }), 2500);
  };

  // Navbar handler functions
  const toggleDropdown = () => {
    setDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    navigate('/login');
  };

  const handleCreatePost = () => {
    navigate('/create-post');
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="post-detail-page">
      {/* Navbar component */}
      <Navbar
        isLoggedIn={isLoggedIn}
        user={user ? { username: user.username, profile_pic: user.profilePic } : null}
        shouldHideSearch={false}
        shouldHideCreate={false}
        query={searchQuery}
        setQuery={setSearchQuery}
        isDropdownOpen={isDropdownOpen}
        toggleDropdown={toggleDropdown}
        handleLogout={handleLogout}
        handleCreatePost={handleCreatePost}
        handleSearch={handleSearch}
      />
      
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
                    fetchPostAndComments={fetchPost}
                    currentUser={user}
                    showAlert={showAlert}
                  />
                ))
              ) : (
                <p>No comments yet</p>
              )}
            </div>
          </>
        )}

        {alert.show && (
          <div className={`custom-alert ${alert.type}`}>
            {alert.message}
          </div>
        )}
      </div>
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
  showAlert
}: {
  comment: Comment;
  replyContent: { [key: string]: string };
  setReplyContent: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  handleReply: (e: React.FormEvent, parentCommentId: string) => void;
  fetchPostAndComments: () => Promise<void>;
  currentUser: { user_id: string; username: string; profilePic: string } | null;
  showAlert: (msg: string, type?: 'success' | 'error') => void;
}) => {
  // Use backend-provided vote info if available
  const [userVote, setUserVote] = useState<null | 'upvote' | 'downvote'>(comment.currentUserVote ?? null);
  const [voteCount, setVoteCount] = useState<number>(typeof comment.score === 'number' ? comment.score : 0);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  const [voteId, setVoteId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Remove per-comment fetches for vote count and user vote
  useEffect(() => {
    setUserVote(comment.currentUserVote ?? null);
    setVoteCount(typeof comment.score === 'number' ? comment.score : 0);
  }, [comment.currentUserVote, comment.score]);

  const handleVote = async (type: 'upvote' | 'downvote') => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      if (userVote === type) {
        await handleCancelVote();
      } else {
        const voteType = type === 'upvote' ? true : false;
        const data = await fetchFromAPI(`/comments/${comment.comment_id}/votes`, 'POST', {
          vote_type: voteType
        });
        setVoteCount(typeof data.score === 'number' ? data.score : 0);
        setUserVote(type);
        setVoteId(data.vote.vote_id || null);
      }
    } catch (error) {
      console.error('Error voting:', error);
      showAlert('Failed to vote.');
    }
  };

  const handleEditComment = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      await fetchFromAPI(`/comments/${comment.comment_id}`, 'PUT', {
        content: editedContent
      });

      showAlert('Comment updated successfully.');
      setShowEditPopup(false);
      fetchPostAndComments();
    } catch (error) {
      console.error('Error editing comment:', error);
      showAlert('Failed to update comment.');
    }
  };

  const handleDeleteComment = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      await fetchFromAPI(`/comments/${comment.comment_id}`, 'DELETE');

      showAlert('Comment deleted successfully.');
      setShowDeletePopup(false);
      fetchPostAndComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
      showAlert('Failed to delete comment.');
    }
  };

  const handleCancelVote = async () => {
    if (!voteId) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const data = await fetchFromAPI(`/votes/${voteId}`, 'DELETE');
      setVoteCount(typeof data.score === 'number' ? data.score : 0);
      setUserVote(null);
      setVoteId(null);
    } catch (error) {
      console.error('Error canceling vote:', error);
      showAlert('Failed to cancel vote.');
    }
  };

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
              e.stopPropagation();
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
              e.stopPropagation();
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
              showAlert={showAlert}
            />
          ))}
        </div>
      )}
    </div>
  );
};
