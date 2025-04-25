import React, { useState, useEffect } from 'react';
import '../styles/home.css';
import '../styles/main.css';

// Define the Post type
interface Post {
  post_id: string;
  title: string;
  content: string;
}

const Home = () => {
  const [posts, setPosts] = useState<Post[]>([]); // Define the type for posts

  useEffect(() => {
    // Example of fetching posts from the backend API
    fetch('/api/posts')
      .then(response => response.json())
      .then(data => setPosts(data));
  }, []);

  return (
    <div className="home-container">
      <h1 className="home-header">Posts</h1>
      {posts.map(post => (
        <div key={post.post_id} className="post-card">
          <h2>{post.title}</h2>
          <p>{post.content}</p>
          <a href={`/post/${post.post_id}`}>Read more</a>
        </div>
      ))}
      <button className="load-more-btn">Load more</button>
    </div>
  );
};

export default Home;
