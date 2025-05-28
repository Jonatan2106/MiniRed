import Loading from './Loading';

import React, { useState, useEffect } from 'react';
import { fetchFromAPI } from '../../api/auth';
import { useNavigate } from 'react-router-dom';

import '../styles/explore.css';
import '../styles/main.css';

interface Subreddit {
  subreddit_id: string;
  name: string;
  title: string;
  description: string;
  created_at: string;
  user: {
    user_id: string;
    username: string;
    profile_pic: string | null;
  };
  subreddit_members?: Array<{
    user_id: string;
    is_moderator: boolean;
    user: {
      user_id: string;
      username: string;
      profile_pic: string | null;
    };
  }>;
}

interface User {
  user_id: string;
  username: string;
  profilePic: string;
}

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
  const [user, setUser] = useState<User | null>(null);
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
        let currentUser: User | null = null;
        let userResponse: any = null;
        let subredditsResponse: any[] = [];
        if (token) {
          setIsLoggedIn(true);
          userResponse = await fetchFromAPI('/me', 'GET');
          currentUser = {
            user_id: userResponse.user_id,
            username: userResponse.username,
            profilePic: userResponse.profile_pic,
          };
          setUser(currentUser);
        }
        // Always fetch all subreddits (bundled with user and member info)
        subredditsResponse = await fetchFromAPI('/subreddits', 'GET');
        if (Array.isArray(subredditsResponse)) {
          setAllSubreddits(subredditsResponse);
          setFilteredSubreddits(subredditsResponse);
          // Build users map from bundled user info
          const userMap = new Map();
          subredditsResponse.forEach((sub: Subreddit) => {
            if (sub.user) {
              userMap.set(sub.user.user_id, {
                user_id: sub.user.user_id,
                username: sub.user.username,
                profilePic: sub.user.profile_pic,
              });
            }
            if (sub.subreddit_members) {
              sub.subreddit_members.forEach((member) => {
                if (member.user) {
                  userMap.set(member.user.user_id, {
                    user_id: member.user.user_id,
                    username: member.user.username,
                    profilePic: member.user.profile_pic,
                  });
                }
              });
            }
          });
          setUsers(userMap);
          // Derive joinedSubreddits for current user from /me response
          if (userResponse && userResponse.joinedSubreddits) {
            const joined = userResponse.joinedSubreddits
              .map((member: any) => member.subreddit)
              .filter((sub: any) => !!sub);
            setJoinedSubreddits(joined);
          } else {
            setJoinedSubreddits([]);
          }
        } else {
          setAllSubreddits([]);
          setFilteredSubreddits([]);
        }
      } catch (err) {
        setError('Failed to load data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    handleSearch();
  }, [debouncedQuery, allSubreddits]);

  const handleSearch = () => {
    const trimmedQuery = query.trim().toLowerCase();
    if (trimmedQuery === '') {
      setFilteredSubreddits(allSubreddits);
      return;
    }
    const filtered = allSubreddits.filter((subreddit) =>
      subreddit.name.toLowerCase().includes(trimmedQuery)
    );
    setFilteredSubreddits(filtered);
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
    return <Loading />;
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
                  <li key={subreddit.subreddit_id} onClick={() => navigate(`/r/${subreddit.name}`)} style={{ cursor: 'pointer' }}>
                    <div className="community-icon">{subreddit.name[0].toUpperCase()}</div>
                    <span>r/{subreddit.name}</span>
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
  const owner = subreddit.user?.username || users.get(subreddit.user?.user_id || '')?.username || 'Unknown';
  const createdAt = new Date(subreddit.created_at).toLocaleString();
  const navigate = useNavigate();
  const handleClick = () => {
    navigate(`/r/${subreddit.name}`);
  };
  const handleOwnerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (subreddit.user?.username) {
      navigate(`/u/${subreddit.user.username}`);
    }
  };
  const handleOwnerKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && subreddit.user?.username) {
      e.stopPropagation();
      navigate(`/u/${subreddit.user.username}`);
    }
  };
  return (
    <div
      className="subreddit-card"
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') handleClick();
      }}
      aria-label={`Go to r/${subreddit.name}`}
    >
      <div className="subreddit-title">r/{subreddit.name}</div>
      <div className="subreddit-desc">{subreddit.description}</div>
      <div className="subreddit-meta">
        Created by{' '}
        <span
          className="subreddit-owner"
          onClick={handleOwnerClick}
          tabIndex={0}
          onKeyDown={handleOwnerKeyDown}
          role="button"
          aria-label={`Go to u/${owner}`}
        >
          u/{owner}
        </span>{' '}
        on {createdAt}
      </div>
    </div>
  );
};

export default ExplorePage;