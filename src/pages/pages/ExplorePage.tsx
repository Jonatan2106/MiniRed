import Loading from './Loading';
import LeftSidebar from '../component/LeftSidebar';
import Navbar from '../component/Navbar';
import RightSidebar from '../component/RightSidebar';

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

  const handleCreatePost = () => {
    navigate('/create-post');
  };

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="home-wrapper">
      <Navbar
        isLoggedIn={isLoggedIn}
        user={user}
        shouldHideSearch={false}
        shouldHideCreate={false}
        query={query}
        setQuery={setQuery}
        isDropdownOpen={isDropdownOpen}
        toggleDropdown={toggleDropdown}
        handleLogout={handleLogout}
        handleCreatePost={handleCreatePost}
        handleSearch={handleSearch}
      />

      <div className="main-content">
        <LeftSidebar
          isProfilePage={true}
          joinedSubreddits={joinedSubreddits}
        />

        {/* Feed */}
        <div className="feed">
          {/* Display matching subreddits */}
          {filteredSubreddits.length > 0 ? (
            filteredSubreddits.map((subreddit) => (
              <SubredditCard key={subreddit.subreddit_id} subreddit={subreddit} users={users} />
            ))
          ) : (
            <div className="no-results-ui">
              <img src="/404.jpg" alt="No results" className="no-results-img" />
              <div className="no-results-text">
                <h2>No results found</h2>
                {query && <p>We couldn't find anything for "<span className="no-results-query">{query}</span>".</p>}
                <p>Try searching with different keywords or check your spelling.</p>
              </div>
            </div>
          )}
        </div>

        <RightSidebar joinedSubreddits={joinedSubreddits} />
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