import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/pages/Home';
import PostDetail from './pages/pages/PostDetail';
import Login from './pages/pages/Login';
import Register from './pages/pages/Register';
import Search from './pages/pages/Search';
import Profile from './pages/pages/Profile';
import NotFound from './pages/pages/NotFound';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/post/:id" element={<PostDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/search" element={<Search />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<NotFound />} /> {/* For handling 404 */}
      </Routes>
    </Router>
  );
};

export default App;
