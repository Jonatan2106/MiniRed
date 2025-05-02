import React from 'react';
import '../styles/main.css';

const Loading = () => {
  return (
    <div className="loading-screen">
      <div className="spinner"></div>
      <p>Loading...</p>
    </div>
  );
};

export default Loading;