import React, { useEffect, useState } from 'react';
import { fetchFromAPI } from '../../api/api';

const Home = () => {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetchFromAPI('/posts');
        setPosts(response);
      } catch (error) {
        console.error("Error fetching posts", error);
      }
    };

    fetchPosts();
  }, []);

  return (
    <div>
      <h1>Posts</h1>
      {posts.map(post => (
        <div key={post.post_id}>
          <h2>{post.title}</h2>
          <p>{post.content}</p>
          <a href={`/post/${post.post_id}`}>Read more</a>
        </div>
      ))}
    </div>
  );
};

export default Home;
