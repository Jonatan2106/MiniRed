import React, { useState } from 'react';
import { fetchFromAPI } from '../../api/api';
import { useNavigate } from 'react-router-dom';
import '../styles/createsubreddit.css';

const CreateSubreddit = () => {
    const [subredditName, setSubredditName] = useState('');
    const [subredditTitle, setTitle] = useState('');
    const [subredditDescription, setDescription] = useState('');
    const [subredditPrivacy, setPrivated] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubredditCreation = async () => {
        try {
            const response = await fetchFromAPI('/subreddits', 'POST', {
                subredditName,
                subredditTitle,
                subredditDescription,
                subredditPrivacy,
            });
            console.log(response);
            navigate('/');
        } catch (error) {
            console.error('Subreddit creation failed', error);
            setError('Failed to create subreddit. Please try again.');
        }
    };

    return (
        <div className="subreddit-container">
            {/* Back Button */}
            <button className="back-button" onClick={() => navigate(-1)}>
                Back
            </button>

            <div className="subreddit-box">
                <h2>Create a Subreddit</h2>

                {error && <p className="error-message">{error}</p>}

                <div className="form-group">
                    <label htmlFor="subredditName">Subreddit Name</label>
                    <input
                        id="subredditName"
                        type="text"
                        placeholder="Enter subreddit name"
                        value={subredditName}
                        onChange={(e) => setSubredditName(e.target.value)}
                        className="subreddit-input"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="subredditTitle">Subreddit Title</label>
                    <input
                        id="subredditTitle"
                        type="text"
                        placeholder="Enter subreddit title"
                        value={subredditTitle}
                        onChange={(e) => setTitle(e.target.value)}
                        className="subreddit-input"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="subredditDescription">Description</label>
                    <textarea
                        id="subredditDescription"
                        placeholder="Enter subreddit description"
                        value={subredditDescription}
                        onChange={(e) => setDescription(e.target.value)}
                        className="subreddit-textarea"
                    />
                </div>

                <div className="form-group privacy-options">
                    <label>
                        <input
                            type="radio"
                            name="privacy"
                            value="false"
                            checked={!subredditPrivacy}
                            onChange={() => setPrivated(false)}
                        />
                        Public
                    </label>
                    <label>
                        <input
                            type="radio"
                            name="privacy"
                            value="true"
                            checked={subredditPrivacy}
                            onChange={() => setPrivated(true)}
                        />
                        Private
                    </label>
                </div>

                <button onClick={handleSubredditCreation} className="subreddit-button">
                    Create Subreddit
                </button>
            </div>
        </div>
    );
};

export default CreateSubreddit;