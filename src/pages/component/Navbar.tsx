import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AiOutlinePlusCircle } from 'react-icons/ai';
import './Navbar.css';

interface NavbarProps {
  isLoggedIn: boolean;
  user: { username: string; profile_pic?: string } | null;
  shouldHideSearch: boolean;
  shouldHideCreate: boolean;
  query: string;
  setQuery: React.Dispatch<React.SetStateAction<string>>;
  isDropdownOpen: boolean;
  toggleDropdown: () => void;
  handleLogout: () => void;
  handleCreatePost: () => void;
  handleSearch: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
  isLoggedIn,
  user,
  shouldHideSearch,
  shouldHideCreate,
  query,
  setQuery,
  isDropdownOpen,
  toggleDropdown,
  handleLogout,
  handleCreatePost,
  handleSearch
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showSearch, setShowSearch] = useState(false);
  
  useEffect(() => {
    const currentPath = location.pathname;
    const isHomePage = currentPath === '/'; 
    const isExplorePage = currentPath === '/explore';
    const isSubredditPage = currentPath.startsWith('/r/');
    
    setShowSearch(isHomePage || isExplorePage || isSubredditPage);
  }, [location.pathname]);
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <div className="logo">
          <a className="app-title" href="/">MiniRed</a>
        </div>
      </div>
      
      {showSearch && !shouldHideSearch && (
        <div className="navbar-center">
          <input
            className="search-input"
            type="text"
            placeholder="Search Reddit"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          {query && (
            <button
              className="clear-button"
              onClick={() => {
                setQuery('');
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
  );
};

export default Navbar;