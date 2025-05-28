import Loading from './Loading';
import Navbar from '../component/Navbar';
import ReactMarkdown from 'react-markdown';

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchFromAPI } from '../../api/auth';

import '../styles/createsubreddit.css';

interface Subreddit {
  subreddit_id: string;
  user_id: string;
  name: string;
  title: string;
  description: string;
  privated: boolean;
}

const CreateSubreddit = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [user, setUser] = useState<{ userId: string; username: string; profile_pic: string } | null>(null);
  const [subredditName, setSubredditName] = useState('');
  const [subredditTitle, setSubredditTitle] = useState('');
  const [subredditDescription, setSubredditDescription] = useState('');
  const [subredditPrivacy, setSubredditPrivacy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        
        setIsLoggedIn(true);
        const data = await fetchFromAPI('/me', 'GET');
        setUser({ 
          userId: data.user_id, 
          username: data.username, 
          profile_pic: data.profile_pic 
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subredditName || !subredditTitle || !subredditDescription) {
      setError('All fields are required.');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetchFromAPI('/subreddits', 'POST', {
        userId: user?.userId,
        name: subredditName,
        title: subredditTitle,
        description: subredditDescription,
        is_privated: subredditPrivacy,
      });

      if (response) {
        navigate(`/r/${response.name}`);
      } else {
        setError(response.message || 'Failed to create subreddit.');
      }
    } catch (error) {
      console.error('Error creating subreddit:', error);
      setError('An error occurred while creating the subreddit.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDropdown = () => {
    setDropdownOpen((prev) => !prev);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    navigate('/login');
  };

  const handleCreatePost = () => {
    navigate('/create-post');
  };

  const handleSearch = () => {
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="home-wrapper">
      <Navbar
        isLoggedIn={isLoggedIn}
        user={user}
        shouldHideSearch={true}
        shouldHideCreate={true}
        query={query}
        setQuery={setQuery}
        isDropdownOpen={isDropdownOpen}
        toggleDropdown={toggleDropdown}
        handleLogout={handleLogout}
        handleCreatePost={handleCreatePost}
        handleSearch={handleSearch}
      />

      <div className="main-content">
        <div className="feed">
          <div className="create-subreddit-wrapper">
            <div className="create-subreddit-header">
              <h1>Create a Community</h1>
              <button className="subreddit-page-back-button" onClick={() => navigate(-1)}>
                Back
              </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="form-layout">
              <form className="create-subreddit-form">
                {/* Subreddit Name */}
                <div className="form-section">
                  <label htmlFor="subredditName" className="form-label">Community Name</label>
                  <input
                    id="subredditName"
                    type="text"
                    placeholder="Enter community name (no spaces)"
                    value={subredditName}
                    onChange={(e) => setSubredditName(e.target.value)}
                    maxLength={50}
                    required
                    className="subreddit-input"
                  />
                  <div
                    className="character-counter"
                    style={{ color: subredditName.length === 50 ? '#FF4500' : '#999' }}
                  >
                    {subredditName.length}/50
                  </div>
                </div>

                {/* Subreddit Title */}
                <div className="form-section">
                  <label htmlFor="subredditTitle" className="form-label">Display Title</label>
                  <input
                    id="subredditTitle"
                    type="text"
                    placeholder="Enter display title for your community"
                    value={subredditTitle}
                    onChange={(e) => setSubredditTitle(e.target.value)}
                    maxLength={100}
                    required
                    className="subreddit-input"
                  />
                  <div
                    className="character-counter"
                    style={{ color: subredditTitle.length === 100 ? '#FF4500' : '#999' }}
                  >
                    {subredditTitle.length}/100
                  </div>
                </div>

                {/* Subreddit Description */}
                <div className="form-section">
                  <label htmlFor="subredditDescription" className="form-label">Description</label>
                  <textarea
                    id="subredditDescription"
                    placeholder="Describe what your community is about"
                    value={subredditDescription}
                    onChange={(e) => setSubredditDescription(e.target.value)}
                    maxLength={500}
                    required
                    className="subreddit-textarea"
                  ></textarea>
                  <div
                    className="character-counter"
                    style={{ color: subredditDescription.length === 500 ? '#FF4500' : '#999' }}
                  >
                    {subredditDescription.length}/500
                  </div>
                </div>
              </form>

              <div className="preview-pane">
                <div className="subreddit-preview">
                  <div className="subreddit-header">
                    <div className="subreddit-icon">
                      {subredditName ? subredditName[0].toUpperCase() : 'r/'}
                    </div>
                    <div>
                      <h3 className="subreddit-title">{subredditTitle || "Community Title"}</h3>
                      <p className="subreddit-name">r/{subredditName || "communityname"}</p>
                    </div>
                  </div>
                </div>
                
                <div className="markdown-preview">
                  <h3 className="markdown-preview-title">Live Preview</h3>
                  <div className="preview-content">
                    <h2 className="preview-subreddit-title">
                      {subredditTitle || "Your Community Title Will Appear Here"}
                    </h2>
                    <div className="markdown-content">
                      <ReactMarkdown>{subredditDescription || 'Your community description will appear here...'}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="button-container">
              <button 
                type="button" 
                onClick={handleSubmit} 
                className="submit-button"
                disabled={isLoading}
              >
                {isLoading ? "Creating..." : "Create Community"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateSubreddit;