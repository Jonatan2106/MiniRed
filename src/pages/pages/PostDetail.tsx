import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchFromAPI } from '../../api/api';
import '../styles/postdetail.css';
import '../styles/main.css';

interface Post {
  post_id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
}

export interface Subreddit {
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
  user: {
    username: string;
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

  useEffect(() => {
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
  }, [id]);

  const fetchPostAndComments = async () => {
    try {
      const postResponse = await fetchFromAPI(`/posts/${id}`);
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
          user: c.user,
          replies: [],
        };
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

  return (
    <div className="post-detail-container">
      {post && (
        <>
          <h1 className="post-detail-header">{post.title}</h1>
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
}: {
  comment: Comment;
  replyContent: { [key: string]: string };
  setReplyContent: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  handleReply: (e: React.FormEvent, parentCommentId: string) => void;
}) => (
  <div className="comment-card">
    <p className="comment-content">{comment.content}</p>
    <p className="comment-author">By {comment.user.username}</p>

    <div className="reply-section">
      <textarea
        value={replyContent[comment.comment_id] || ''}
        onChange={(e) =>
          setReplyContent({ ...replyContent, [comment.comment_id]: e.target.value })
        }
        placeholder="Reply to this comment..."
        className="reply-input"
      />
      <button onClick={(e) => handleReply(e, comment.comment_id)}>Reply</button>
    </div>

    {comment.replies && comment.replies.length > 0 && (
      <div className="replies-section">
        {comment.replies.map((reply) => (
          <Comment
            key={reply.comment_id}
            comment={reply}
            replyContent={replyContent}
            setReplyContent={setReplyContent}
            handleReply={handleReply}
          />
        ))}
      </div>
    )}
  </div>
);
