import React, { useState, useEffect } from 'react';
import { FaHome, FaCompass, FaFire } from 'react-icons/fa';
import { AiOutlinePlusCircle } from "react-icons/ai";
import '../styles/explore.css';
import '../styles/main.css';
import Loading from './Loading';
import { fetchFromAPI } from '../../api/auth';
import { fetchFromAPIWithoutAuth } from '../../api/noAuth';
import { useNavigate } from 'react-router-dom';

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
    const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          setIsLoggedIn(true);
          const userResponse = await fetchFromAPI('/me', 'GET');
          setUser({ user_id: userResponse.user_id, username: userResponse.username, profilePic: userResponse.profile_pic });
        }

        const allSubredditsResponse = await fetchFromAPI('/subreddits', 'GET');
        console.log('Fetched Subreddits:', allSubredditsResponse);

        if (Array.isArray(allSubredditsResponse)) {
          setAllSubreddits(allSubredditsResponse); // Set all subreddits for filtering
          setFilteredSubreddits(allSubredditsResponse); // Default to showing all subreddits
        } else {
          console.error('Invalid data format:', allSubredditsResponse);
        }

        const subredditsResponse = await fetchFromAPI('/users/subreddits', 'GET');
        setJoinedSubreddits(subredditsResponse);

        const usersResponse = await fetchFromAPIWithoutAuth('/user/all', 'GET');
        const userMap = new Map();
        usersResponse.forEach((user: User) => {
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
    navigate('/');
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
      {/* Main content */}
      <div className="main-content">
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