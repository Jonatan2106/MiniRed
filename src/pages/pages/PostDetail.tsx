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

const PostDetail = () => {
  const { id } = useParams();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState<string>('');
  const [replyContent, setReplyContent] = useState<{ [key: string]: string }>({});
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ username: string; profilePic: string } | null>(null);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [users, setUsers] = useState<Map<string, User>>(new Map());

  // Inside the Home component
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

    fetch('http://localhost:5000/api/user/all')
      .then(response => response.json())
      .then((data) => {
        const userMap = new Map();
        data.forEach((user: User) => {
          userMap.set(user.user_id, user);
        });
        setUsers(userMap);
      })
      .catch((error) => console.error('Error fetching users:', error));
  }, []);

  const handleCreatePost = () => {
    window.location.href = '/create-post';
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    window.location.href = '/';
  };

  const toggleDropdown = () => {
    setDropdownOpen((prev) => !prev);
  };

  if (error) {
    return <div>Error: {error}</div>;
  }

  // Fetch post and comments on initial load
  useEffect(() => {
    const fetchPostAndComments = async () => {
      try {
        const postResponse = await fetchFromAPI(`/posts/${id}`);
        setPost(postResponse);

        const commentsResponse = await fetchFromAPI(`/posts/${id}/comments`);
        setComments(commentsResponse.comments);
      } catch (error) {
        console.error('Error fetching post or comments', error);
      }
    };

    fetchPostAndComments();
  }, [id]);

  // Handle adding a new comment
  const handleAddComment = async () => {
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
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment, parent_comment_id: null }),
      });

      if (response.ok) {
        const newCommentResponse = await response.json();
        setComments((prevComments) => [...prevComments, newCommentResponse.comment]);
        setNewComment('');
      } else {
        alert('Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('An error occurred while adding your comment.');
    }
  };

  // Handle replying to a comment
  const handleReply = async (parentCommentId: string) => {
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
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          parent_comment_id: parentCommentId,
        }),
      });

      if (response.ok) {
        const newReply = await response.json();
        setComments((prevComments) =>
          prevComments.map((comment) =>
            comment.comment_id === parentCommentId
              ? { ...comment, replies: [...comment.replies, newReply.comment] }
              : comment
          )
        );
        setReplyContent({ ...replyContent, [parentCommentId]: '' });
      } else {
        alert('Failed to add reply');
      }
    } catch (error) {
      console.error('Error adding reply:', error);
      alert('An error occurred while adding your reply.');
    }
  };

  return (
    <div>
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-left">
          <div className="logo">
            <a className="app-title" href="/">MiniRed</a>
          </div>
        </div>
        <div className="navbar-center">
          <input className="search-input" type="text" placeholder="Search Reddit" />
        </div>
        <div className="navbar-right">
          {isLoggedIn ? (
            <>
              <button className="create-post-btn" onClick={handleCreatePost}>Create Post</button>
              <div className="profile-menu">
                <img
                  src={user?.profilePic || "/default-profile.png"}
                  className="profile-pic"
                  onClick={toggleDropdown}
                  alt={user?.username}
                />
                {isDropdownOpen && (
                  <div className="dropdown-menu">
                    <a href="/profile">Profile</a>
                    <a href="/edit">Edit</a>
                    <a onClick={handleLogout}>Logout</a>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button className="create-post-btn" onClick={handleCreatePost}>Create Post</button>
              <a className="nav-link" href="/login">Login</a>
              <a className="nav-link" href="/register">Register</a>
            </>
          )}
        </div>
      </nav>

      {/* Post Detail */}
      <div className="post-detail-container">
        {post && (
          <>
            <h1 className="post-detail-header">{post.title}</h1>
            <p className="post-detail-content">{post.content}</p>

            {/* Add a new comment */}
            <div className="add-comment-section">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="new-comment-input"
              ></textarea>
              <button onClick={handleAddComment}>Submit Comment</button>
            </div>

            <div className="comment-section">
              <h2 className="comment-header">Comments</h2>
              {comments.map((comment) => (
                <div key={comment.comment_id} className="comment-card">
                  <p className="comment-content">{comment.content}</p>
                  <p className="comment-author">By {comment.user.username}</p>

                  {/* Nested replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="replies-section">
                      {comment.replies.map((reply: any) => (
                        <div key={reply.comment_id} className="reply-card">
                          <p className="reply-content">{reply.content}</p>
                          <p className="reply-author">By {reply.user.username}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply input */}
                  <div className="reply-section">
                    <textarea
                      value={replyContent[comment.comment_id] || ''}
                      onChange={(e) =>
                        setReplyContent({
                          ...replyContent,
                          [comment.comment_id]: e.target.value,
                        })
                      }
                      placeholder="Reply to this comment..."
                      className="reply-input"
                    ></textarea>
                    <button onClick={() => handleReply(comment.comment_id)}>Reply</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PostDetail;
