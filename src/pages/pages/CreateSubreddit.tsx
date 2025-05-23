import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Loading from './Loading';
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
  const [user, setUser] = useState<{ userId: string; username: string; profilePic: string } | null>(null);
  const [subredditName, setSubredditName] = useState('');
  const [subredditTitle, setSubredditTitle] = useState('');
  const [subredditDescription, setSubredditDescription] = useState('');
  const [subredditPrivacy, setSubredditPrivacy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();


  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      fetch('http://localhost:5000/api/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          setUser({ userId: data.user_id, username: data.username, profilePic: data.profilePic });
        })
        .catch((error) => console.error('Error fetching user data:', error))
        .finally(() => setIsLoading(false));
    }
  }, []); 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    
    if (!subredditName || !subredditTitle || !subredditDescription) {
      setError('All fields are required.');
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/subreddits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user?.userId,
          name: subredditName,
          title: subredditTitle,
          description: subredditDescription,
          is_privated: subredditPrivacy,
        }),
      });

      if (response.ok) {
        const data = await response.json();
       
        navigate(`/r/${data.name}`);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to create subreddit.');
      }
    } catch (error) {
      console.error('Error creating subreddit:', error);
      setError('An error occurred while creating the subreddit.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="create-subreddit-wrapper">
      {/* Back Button */}
      <div className="create-subreddit-header">
        <h1>Create Subreddit</h1>
        <button className="subreddit-page-back-button" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>

      {/* Error Message */}
      {error && <div className="error-message">{error}</div>}

      {/* Form */}
      <div className="form-layout">
        <form className="create-subreddit-form" onSubmit={handleSubmit}>
          {/* Subreddit Name */}
          <div className="form-section">
            <label htmlFor="subredditName" className='label'>Subreddit Name</label>
            <input
              id="subredditName"
              type="text"
              placeholder="Enter subreddit name"
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
            <label htmlFor="subredditTitle" className='label'>Subreddit Title</label>
            <input
              id="subredditTitle"
              type="text"
              placeholder="Enter subreddit title"
              value={subredditTitle}
              onChange={(e) => setSubredditTitle(e.target.value)}
              maxLength={100}
              required
              className="subreddit-input"
            />
            <div
              className="character-counter"
              style={{ color: subredditTitle.length === 50 ? '#FF4500' : '#999' }}
            >
              {subredditTitle.length}/50
            </div>
          </div>

          {/* Subreddit Description */}
          <div className="form-section">
            <label htmlFor="subredditDescription" className='label'>Description</label>
            <textarea
              id="subredditDescription"
              placeholder="Enter subreddit description"
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

          {/* Privacy Options */}
          <div className="form-section privacy-options">
            <p className='label'>Set subreddit visibility</p>
            <label className="toggle-label">
              <span>{subredditPrivacy ? 'Private' : 'Public'}</span>
              <div
                className={`toggle-switch ${subredditPrivacy ? 'active' : ''}`}
                onClick={() => setSubredditPrivacy(!subredditPrivacy)}
              >
                <div className="toggle-knob"></div>
              </div>
            </label>
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button type="submit" className="submit-button" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Subreddit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSubreddit;