import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
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
import { ProtectedRoute } from './utils/protected_route';
import { FaHome, FaCompass, FaFire } from 'react-icons/fa';
import { fetchFromAPI } from './api/auth';
import Loading from './pages/pages/Loading';
import './App.css';
import { AiOutlinePlusCircle } from "react-icons/ai";


// Komponen AppContent dengan UI dari EditProfile.tsx
const AppContent = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState(''); 
  const [posts, setPosts] = useState<any[]>([]); 
  const [allSubreddits, setAllSubreddits] = useState<any[]>([]); 
  const [searchResults, setSearchResults] = useState<any[]>([]); 
  const [filteredSubreddits, setFilteredSubreddits] = useState<any[]>([]); 
    type User = {
    user_id: string;
    username: string;
    profile_pic?: string;
  };
  const [user, setUser] = useState<User | null>(null);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [profile_pic, setProfilePic] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const isCreatePostPage = location.pathname === '/create-post';
  const [joinedSubreddits, setJoinedSubreddits] = useState<any[]>([]);
  const isProfilePage = location.pathname === '/profile';
  const isEditProfilePage = location.pathname === '/edit'; 
  const isCreateSubredditPage = location.pathname === '/create-subreddit';
  const shouldHideCreate = isCreatePostPage || isEditProfilePage || isCreateSubredditPage;
  const shouldHideSearch = isCreatePostPage || isProfilePage || isEditProfilePage || isCreateSubredditPage;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
      fetchFromAPI('/me', 'GET')
        .then((data) => {
          setUser(data);
          setProfilePic(data.profile_pic || '');

          // Fetch joined subreddits if on profile page
          if (isProfilePage && data.user_id) {
            fetchJoinedSubreddits(data.user_id);
          }
        })
        .catch((err) => {
          console.error("Error fetching user data:", err);
          localStorage.removeItem('token');
          setIsLoggedIn(false);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchJoinedSubreddits = async (userId: string) => {
    try {
      const communities = await fetchFromAPI(`/users/${userId}/subreddits`, 'GET');
      setJoinedSubreddits(communities);
    } catch (error) {
      console.error('Failed to fetch joined communities:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    navigate("/");
  };

  const toggleDropdown = () => {
    setDropdownOpen((prev) => !prev);
  };

  const handleCreatePost = () => {
    navigate('/create-post');
  };

  const handleSearch = () => {
    const trimmedQuery = query.trim().toLowerCase();

    if (trimmedQuery === '') {
      setSearchResults(posts);
      setFilteredSubreddits(allSubreddits);
      return;
    }

    const filteredPosts = posts.filter((post) =>
      post.title.toLowerCase().includes(trimmedQuery)
    );

    const filteredSubs = allSubreddits.filter((subreddit) =>
      subreddit.name.toLowerCase().includes(trimmedQuery)
    );

    setSearchResults(filteredPosts);
    setFilteredSubreddits(filteredSubs);
  };

  if (error) return <div>Error: {error}</div>;
  if (isLoading) return <Loading />;

  return (
    <div className="home-wrapper">
      {/* Navbar - berdasarkan EditProfile.tsx line 210-222 */}
      <nav className="navbar">
        <div className="navbar-left">
          <div className="logo">
            <a className="app-title" href="/">MiniRed</a>
          </div>
        </div>
        
        {!shouldHideSearch && (
        <div className="navbar-center">
          <input
            className="search-input"
            type="text"
            placeholder="Search Reddit"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="search-button" onClick={handleSearch}>
            Search
          </button>
          {query && (
            <button
              className="clear-button"
              onClick={() => {
                setQuery('');
                setSearchResults(posts);
                setFilteredSubreddits(allSubreddits);
              }}
            >
              Clear
            </button>
          )}
        </div>
        )}
        <div className="navbar-right">
          {isLoggedIn ? (
            <>
            {!shouldHideCreate && (
              <button className="create-post-btn" onClick={handleCreatePost}>
                <AiOutlinePlusCircle className="icon" />Create Post
              </button>
              )}
              <div className="profile-menu">
                <img
                  src={user?.profile_pic ? `http://localhost:5173${user.profile_pic}` : "/default.png"}
                  className="profile-pic"
                  onClick={toggleDropdown}
                  alt={user?.username}
                />
                {isDropdownOpen && (
                  <div className="dropdown-menu enhanced-dropdown">
                    <a href="/profile" className="dropdown-item">{user?.username}</a>
                    <a href="/edit" className="dropdown-item">Edit</a>
                    <a onClick={handleLogout} className="dropdown-item logout">Logout</a>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="auth-buttons">
                <a className="nav-link login-button" href="/login">Login</a>
                <a className="nav-link register-button" href="/register">Register</a>
              </div>
            </>
          )}
        </div>
      </nav>

      {/* Main content */}
      <div className="main-content">
        {/* Left Sidebar */}
        {isProfilePage ? (
          <div className="left-sidebar home">
            <h2 className="title">Menu</h2>
            <ul>
              <li><FaHome className="icon" /><a href="/">Home</a></li>
              <li><FaCompass className="icon" /><a href="/explore">Explore</a></li>
              <li><FaFire className="icon" /><a href="/popular">Popular</a></li>
            </ul>
            <h2 className="title">Communities</h2>
            <ul>
              <li>
                <AiOutlinePlusCircle className="icon" />
                <a href="/create-subreddit">Create a subreddit</a>
              </li>
              {joinedSubreddits.length > 0 ? (
                joinedSubreddits.map((subreddit) => (
                  <li key={subreddit.subreddit_id}>
                    <div className="community-icon">{subreddit.name[0].toUpperCase()}</div>
                    <a href={`/r/${subreddit.name}`}>r/{subreddit.name}</a>
                  </li>
                ))
              ) : (
                <li>No joined communities yet.</li>
              )}
            </ul>
          </div>
        ) : (
          <div className="left-sidebar">
            <h2 className="title">Menu</h2>
            <ul>
              <li><FaHome className="icon" /><a href="/">Home</a></li>
              <li><FaCompass className="icon" /><a href="/explore">Explore</a></li>
              <li><FaFire className="icon" /><a href="/popular">Popular</a></li>
            </ul>
          </div>
        )}

        {/* Content Area dengan Routes */}
        <div className="content-area">
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

// Router utama dalam App
const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/*" element={<AppContent />} />
      </Routes>
    </Router>
  );
};

export default App;
