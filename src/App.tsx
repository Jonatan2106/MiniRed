// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'; // Import Router & Routes
import './App.css'; // Import your CSS file
import Home from './pages/pages/Home'; // Make sure you create this file later
import PostDetail from './pages/pages/PostDetail';// Make sure you create this file later
import Login from './pages/pages/Login';
import Search from './pages/pages/Search';

const App = () => {
  return (
    <Router> {/* Wrap everything with Router */}
      <Routes> {/* Define the routes here */}
        <Route path="/" element={<Home />} /> {/* Home route */}
        <Route path="/post/:id" element={<PostDetail />} /> {/* Post detail route */}
        <Route path="/search" element={<Search />} /> {/* Profile route */}
        <Route path="/login" element={<Login />} /> {/* Profile route */}
      </Routes>
    </Router>
  );
};

export default App;
