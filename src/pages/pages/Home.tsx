import React, { useState, useEffect } from 'react';
import '../styles/home.css';
import '../styles/main.css';

// Define types
interface Post {
  post_id: string;
  title: string;
  content: string;
}

export interface Subreddit {
  subreddit_id: string;
  name: string;
  title: string;
  description: string;
}

const Home = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [joinedSubreddits, setJoinedSubreddits] = useState<Subreddit[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch posts
    fetch('http://localhost:5000/api/posts')
      .then(response => response.json())
      .then(data => setPosts(data))
      .catch((error) => setError('Error fetching posts'));

    // Fetch joined communities
    console.log(localStorage.getItem('token'))
    fetch('http://localhost:5000/api/users/subreddits', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      }
    })
    .then(response => response.json())
    .then(data => {
      console.log('Joined Subreddits:', data);
      setJoinedSubreddits(data);
    })
    .catch((error) => console.error('Error fetching joined communities:', error));    
  }, []);

  const handleCreatePost = () => {
    window.location.href = '/create-post'; // Change if using React Router
  };

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="home-wrapper">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-left">
          <div className="logo">MyReddit</div>
        </div>
        <div className="navbar-center">
          <input className="search-input" type="text" placeholder="Search Reddit" />
        </div>
        <div className="navbar-right">
          <button className="create-post-btn" onClick={handleCreatePost}>Create Post</button>
          <a className="nav-link" href="/login">Login</a>
          <a className="nav-link" href="/register">Register</a>
        </div>
      </nav>

      {/* Main content */}
      <div className="main-content">
        {/* Left Sidebar */}
        <div className="left-sidebar">
          <h2>Navigation</h2>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/popular">Popular</a></li>
          </ul>
        </div>

        {/* Feed */}
        <div className="feed">
          {posts.map(post => (
            <div key={post.post_id} className="post-card">
              <h2>{post.title}</h2>
              <p>{post.content}</p>
              <a className="read-more-link" href={`/post/${post.post_id}`}>Read more</a>
            </div>
          ))}
        </div>

        {/* Right Sidebar */}
        <div className="right-sidebar">
          <div className="joined-communities">
            <h3>Joined Communities</h3>
            <ul>
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
        </div>
      </div>
    </div>
  );
};

export default Home;
