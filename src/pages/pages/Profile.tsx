import React, { useState, useEffect } from 'react';
import '../styles/profile.css';
import '../styles/main.css';

interface Post {
  post_id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
}

interface Comment {
  comment_id: string;
  post_id: string;
  user_id: string;
  content: string;
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

const Profile = () => {
  const [users, setUsers] = useState<Map<string, User>>(new Map());
  const [user, setUser] = useState<{ username: string; profilePic: string } | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [joinedSubreddits, setJoinedSubreddits] = useState<Subreddit[]>([]);
  const [activeTab, setActiveTab] = useState('Posts');
  const [isDropdownOpen, setDropdownOpen] = useState(false);

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

    fetch('http://localhost:5000/api/user/me/posts')
      .then(response => response.json())
      .then(data => setPosts(data))
      .catch(() => console.error('Error fetching posts'));

    fetch('http://localhost:5000/api/user/me/comments')
      .then(response => response.json())
      .then(data => setComments(data))
      .catch(() => console.error('Error fetching comments'));

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

  const handleCreatePost = () => {
    window.location.href = '/create-post';
  };

  const handleCreateSubreddit = () => {
    window.location.href = '/create-subreddit';
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    window.location.href = '/';
  };

  const toggleDropdown = () => {
    setDropdownOpen((prev) => !prev);
  };

  return (
    <div className="home-wrapper">
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

      {/* Main content */}
      <div className="main-content">
        {/* Left Sidebar */}
        <div className="left-sidebar">
          <h2 className="title">Navigation</h2>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/popular">Popular</a></li>
          </ul>
          <h2 className="title">Communities</h2>
          <ul>
            <li><a href="/create-subreddit">Create a subreddit</a></li>
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

        {/* Feed */}
        <div className="feed">
          <div className="profile-header">
            <div className="profile-avatar"></div>
            <div className="profile-info">
              <h1 className="username">{user?.username || "Loading..."}</h1>
              <p className="user-handle">u/{user?.username}</p>
            </div>
          </div>

          {/* Tabs */}
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

          {/* Profile Content */}
          <div className="profile-content">
            {activeTab === 'Overview' && <p>Welcome to your profile overview!</p>}

            {activeTab === 'Posts' && (
              <div>
                {posts.length > 0 ? (
                  posts.map(post => (
                    <div key={post.post_id} className="post-item">
                      <h3>{post.title}</h3>
                      <p>{post.content}</p>
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
                    <div key={comment.comment_id} className="comment-item">
                      <p>{comment.content}</p>
                    </div>
                  ))
                ) : (
                  <p>No comments available.</p>
                )}
              </div>
            )}

            {activeTab === 'Upvoted' && (
              <p>You haven't upvoted any posts yet.</p>
            )}
            {activeTab === 'Downvoted' && (
              <p>You haven't downvoted any posts yet.</p>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
      </div>
    </div>
  );
};

export default Profile;
