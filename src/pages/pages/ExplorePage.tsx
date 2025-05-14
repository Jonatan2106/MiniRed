import React, { useState, useEffect } from 'react';
import { FaHome, FaCompass, FaFire } from 'react-icons/fa';
import { AiOutlinePlusCircle } from "react-icons/ai";
import '../styles/explore.css';
import '../styles/main.css';
import Loading from './Loading';

interface Subreddit {
  subreddit_id: string;
  user_id: string;
  name: string;
  title: string;
  description: string;
  created_at: string;
}

interface User {
  user_id: string;
  username: string;
  profilePic: string;
}

// Debounce hook (copied from Home.tsx)
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};

const ExplorePage = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [joinedSubreddits, setJoinedSubreddits] = useState<Subreddit[]>([]);
  const [allSubreddits, setAllSubreddits] = useState<Subreddit[]>([]);
  const [filteredSubreddits, setFilteredSubreddits] = useState<Subreddit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User>();
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [users, setUsers] = useState<Map<string, User>>(new Map());
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          setIsLoggedIn(true);
          const userResponse = await fetch('http://localhost:5000/api/me', {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const userData = await userResponse.json();
          setUser({ user_id: userData.user_id, username: userData.username, profilePic: userData.profile_pic });
        }

        const allSubredditsResponse = await fetch('http://localhost:5000/api/subreddits', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        const allSubredditsData = await allSubredditsResponse.json();
        console.log('Fetched Subreddits:', allSubredditsData);

        if (Array.isArray(allSubredditsData)) {
          setAllSubreddits(allSubredditsData); // Set all subreddits for filtering
          setFilteredSubreddits(allSubredditsData); // Default to showing all subreddits
        } else {
          console.error('Invalid data format:', allSubredditsData);
        }

        const subredditsResponse = await fetch('http://localhost:5000/api/users/subreddits', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const subredditsData = await subredditsResponse.json();
        setJoinedSubreddits(subredditsData);

        const usersResponse = await fetch('http://localhost:5000/api/user/all');
        const usersData = await usersResponse.json();
        const userMap = new Map();
        usersData.forEach((user: User) => {
          userMap.set(user.user_id, user);
        });
        setUsers(userMap);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setIsLoading(false); // Ensure loading is stopped in all cases
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    handleSearch();
  }, [debouncedQuery]);

  const handleSearch = () => {
    const trimmedQuery = query.trim().toLowerCase();
    if (trimmedQuery === '') {
      setFilteredSubreddits(allSubreddits);
      return;
    }
    const filteredSubreddits = allSubreddits.filter((subreddit) =>
      subreddit.name.toLowerCase().includes(trimmedQuery)
    );
    setFilteredSubreddits(filteredSubreddits);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    window.location.href = '/';
  };

  const toggleDropdown = () => {
    setDropdownOpen((prev) => !prev);
  };

  if (isLoading) {
    return <Loading />; // Show loading screen
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="home-wrapper">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-left">
          <div className="logo">
            <a className="app-title" href="/">MiniRed</a>
          </div>
        </div>
        <div className="navbar-center">
          <input
            className="search-input"
            type="text"
            placeholder="Search Subreddits"
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
                setFilteredSubreddits(allSubreddits);
              }}
            >
              Clear
            </button>
          )}
        </div>
        <div className="navbar-right">
          {isLoggedIn ? (
            <>
              <button className="create-post-btn"><AiOutlinePlusCircle className="icon" />Create Post</button>
              <div className="profile-menu">
                <img
                  src={user?.profilePic ? "http://localhost:5173"+user?.profilePic : "/default.png"}
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
            <div className="auth-buttons">
              <a className="nav-link login-button" href="/login">Login</a>
              <a className="nav-link register-button" href="/register">Register</a>
            </div>
          )}
        </div>
      </nav>

      {/* Main content */}
      <div className="main-content">
        {/* Left Sidebar */}
        <div className="left-sidebar home">
          <h2 className="title">Menu</h2>
          <ul>
            <li>
              <FaHome className="icon" />
              <a href="/">Home</a>
            </li>
            <li>
              <FaCompass className="icon" />
              <a href="/explore">Explore</a>
            </li>
            <li>
              <FaFire className="icon" />
              <a href="/popular">Popular</a>
            </li>
          </ul>
        </div>

        {/* Feed */}
        <div className="feed">
          {/* Display matching subreddits */}
          {filteredSubreddits.length > 0 ? (
            filteredSubreddits.map((subreddit) => (
              <SubredditCard key={subreddit.subreddit_id} subreddit={subreddit} users={users} />
            ))
          ) : (
            <p className="text-gray-500">No subreddits found.</p>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="right-sidebar">
          <div className="joined-communities">
            <h3>Joined Communities</h3>
            <ul>
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
        </div>
      </div>
    </div>
  );
};

const SubredditCard = ({ subreddit, users }: { subreddit: Subreddit; users: Map<string, User> }) => {
  const owner = users.get(subreddit.user_id)?.username;
  const createdAt = new Date(subreddit.created_at).toLocaleString();

  return (
    <div className="post-card">
      <a href={`/r/${subreddit.name}`} className="post-link">
        <div className="post-content">
          <div className="post-header">
            <span className="username">u/{owner}</span>
            <span className="timestamp">{createdAt}</span>
          </div>
          <h3>r/{subreddit.name}</h3>
          <p>{subreddit.description}</p>
        </div>
      </a>
    </div>
  );
};

export default ExplorePage;