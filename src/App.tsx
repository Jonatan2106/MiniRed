import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
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
import { ProtectedRoute } from './utils/protected_route';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/r/:subredditName" element={<SubredditPage />} />
        <Route path="/u/:username" element={
          <ProtectedRoute>
            <ViewProfile />
          </ProtectedRoute>
        } />
        <Route path="/post/:id" element={<PostDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/search" element={<Search />} />
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
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default App;
