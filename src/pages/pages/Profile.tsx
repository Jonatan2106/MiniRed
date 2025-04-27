import React, { useState, useEffect } from 'react';
import '../styles/profile.css';
import '../styles/main.css';

const Profile = () => {
  interface Post {
    id: string;
    title: string;
    body: string;
  }

  interface Comment {
    id: string;
    text: string;
  }

  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]); // State for comments
  const [upvoted, setUpvoted] = useState<Post[]>([]); // State for upvoted posts
  const [downvoted, setDownvoted] = useState<Post[]>([]); // State for downvoted posts
  const [joinedSubreddits, setJoinedSubreddits] = useState<{ subreddit_id: string; name: string }[]>([]);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('Posts'); // Track active tab

  useEffect(() => {
    // Fetch posts
    fetch('http://localhost:5000/api/posts')
      .then(response => response.json())
      .then(data => setPosts(data))
      // .catch(() => setError('Error fetching posts'));

    // Fetch comments (assuming there’s an endpoint for comments)
    fetch('http://localhost:5000/api/comments')
      .then(response => response.json())
      .then(data => setComments(data))
      // .catch(() => setError('Error fetching comments'));

    // Fetch upvoted posts (assuming an endpoint for upvoted posts)
    fetch('http://localhost:5000/api/upvoted')
      .then(response => response.json())
      .then(data => setUpvoted(data))
      // .catch(() => setError('Error fetching upvoted posts'));

    // Fetch downvoted posts (assuming an endpoint for downvoted posts)
    fetch('http://localhost:5000/api/downvoted')
      .then(response => response.json())
      .then(data => setDownvoted(data))
      // .catch(() => setError('Error fetching downvoted posts'));

    // Fetch joined communities
    fetch('http://localhost:5000/api/users/subreddits', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      }
    })
    .then(response => response.json())
    .then(data => setJoinedSubreddits(data))
    .catch(() => console.error('Error fetching joined communities'));
  }, []);

  const handleTabClick = (tab: 'Overview' | 'Posts' | 'Comments' | 'Upvoted' | 'Downvoted'): void => {
    setActiveTab(tab);
  };

  return (
    <div className="main-content">
      {/* Left Sidebar */}
      <aside className="left-sidebar">
        <div className="sidebar-section">
          <h2>Menu</h2>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/popular">Popular</a></li>
          </ul>
        </div>
        <div className="sidebar-section">
          <h2>Communities</h2>
          <ul>
            <li><a href="/create-community">Create a community</a></li>
            {joinedSubreddits.length > 0 ? (
              joinedSubreddits.map((subreddit) => (
                <li key={subreddit.subreddit_id}>
                  <a href={`/r/${subreddit.name}`}>r/{subreddit.name}</a>
                </li>
              ))
            ) : (
              <li>No joined communities yet.</li>
            )}
          </ul>
        </div>
      </aside>

      {/* Feed Area */}
      <main className="feed">
        <div className="profile-header">
          <div className="profile-avatar"></div>
          <div className="profile-info">
            <h1 className="username">Few-Television-2765</h1>
            <p className="user-handle">u/Few-Television-2765</p>
          </div>
        </div>

        <div className="profile-tabs">
          <button
            className={`tab ${activeTab === 'Overview' ? 'active' : ''}`}
            onClick={() => handleTabClick('Overview')}
          >
            Overview
          </button>
          <button
            className={`tab ${activeTab === 'Posts' ? 'active' : ''}`}
            onClick={() => handleTabClick('Posts')}
          >
            Posts
          </button>
          <button
            className={`tab ${activeTab === 'Comments' ? 'active' : ''}`}
            onClick={() => handleTabClick('Comments')}
          >
            Comments
          </button>
          <button
            className={`tab ${activeTab === 'Upvoted' ? 'active' : ''}`}
            onClick={() => handleTabClick('Upvoted')}
          >
            Upvoted
          </button>
          <button
            className={`tab ${activeTab === 'Downvoted' ? 'active' : ''}`}
            onClick={() => handleTabClick('Downvoted')}
          >
            Downvoted
          </button>
        </div>

        <div className="profile-content">
          {error && <p>{error}</p>}
          
          {activeTab === 'Overview' && <p>Welcome to the profile overview!</p>}
          {activeTab === 'Posts' && (
            <div>
              {posts.length > 0 ? (
                posts.map(post => (
                  <div key={post.id} className="post-item">
                    <h3>{post.title}</h3>
                    <p>{post.body}</p>
                  </div>
                ))
              ) : (
                <p>No posts available.</p>
              )}
            </div>
          )}
          {activeTab === 'Comments' && (
            <div>
              {comments.length > 0 ? (
                comments.map(comment => (
                  <div key={comment.id} className="comment-item">
                    <p>{comment.text}</p>
                  </div>
                ))
              ) : (
                <p>No comments available.</p>
              )}
            </div>
          )}
          {activeTab === 'Upvoted' && (
            <div>
              {upvoted.length > 0 ? (
                upvoted.map(post => (
                  <div key={post.id} className="post-item">
                    <h3>{post.title}</h3>
                    <p>{post.body}</p>
                  </div>
                ))
              ) : (
                <p>No upvoted posts available.</p>
              )}
            </div>
          )}
          {activeTab === 'Downvoted' && (
            <div>
              {downvoted.length > 0 ? (
                downvoted.map(post => (
                  <div key={post.id} className="post-item">
                    <h3>{post.title}</h3>
                    <p>{post.body}</p>
                  </div>
                ))
              ) : (
                <p>No downvoted posts available.</p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Profile;
