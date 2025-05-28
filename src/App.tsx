import Home from './pages/pages/Home';
import PostDetail from './pages/pages/PostDetail';
import Login from './pages/pages/Login';
import Register from './pages/pages/Register';
import Search from './pages/pages/Search';
import Profile from './pages/pages/Profile';
import NotFound from './pages/pages/NotFound';
import EditProfile from './pages/pages/EditProfile';
import CreateSubreddit from './pages/pages/CreateSubreddit';
import SubredditPage from './pages/pages/Subreddit';
import CreatePost from './pages/pages/CreatePost';
import ViewProfile from './pages/pages/ViewProfile';
import EditSubreddit from './pages/pages/EditSubreddit';
import ExplorePage from './pages/pages/ExplorePage';
import Popular from './pages/pages/Popular';
import Loading from './pages/pages/Loading';
import Navbar from './pages/component/Navbar';
import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from './utils/protected_route';
import { fetchFromAPI } from './api/auth';
import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/explore" element={<ExplorePage />} />
      <Route path="/popular" element={<Popular />} />
      <Route path="/r/:subredditName" element={<SubredditPage />} />
      <Route path="/post/:id" element={<PostDetail />} />
      <Route path="/search" element={<Search />} />
      <Route path="/u/:username" element={
        <ProtectedRoute>
          <ViewProfile />
        </ProtectedRoute>
      } />
      <Route path="/create-subreddit" element={
        <ProtectedRoute>
          <CreateSubreddit />
        </ProtectedRoute>
      } />
      <Route path="/create-post" element={
        <ProtectedRoute>
          <CreatePost />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />
      <Route path="/edit" element={
        <ProtectedRoute>
          <EditProfile />
        </ProtectedRoute>
      } />
      <Route path="/edit-subreddit/:subredditId" element={
        <ProtectedRoute>
          <EditSubreddit />
        </ProtectedRoute>
      } />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;