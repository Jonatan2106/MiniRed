import React, { useState } from 'react';
import { fetchFromAPI } from '../../api/api';
import { useNavigate } from 'react-router-dom';
import '../styles/createsubreddit.css';

const CreateSubreddit = () => {
    const [subredditName, setSubredditName] = useState('');
    const [subredditTitle, setTitle] = useState('');
    const [subredditDescription, setDescription] = useState('');
    const [subredditPrivacy, setPrivated] = useState(false); // Default to not private (false)
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubredditCreation = async () => {
        try {
            const response = await fetchFromAPI('/register', 'POST', { 
                subredditName, 
                subredditTitle, 
                subredditDescription,
                subredditPrivacy // Include privacy in request
            });
            console.log(response);
            navigate('/');
        } catch (error) {
            console.error('Registration failed', error);
            setError('Registration failed. Please try again.');
        }
    };

    return (
        <div className="register-container">
            <div className="register-box">
                <h2>Create a Subreddit</h2>

                {error && <p className="error-message">{error}</p>}

                <input
                    type="text"
                    placeholder="Subreddit Name"
                    value={subredditName}
                    onChange={(e) => setSubredditName(e.target.value)}
                    className="register-input"
                />
                <input
                    type="text"
                    placeholder="Subreddit Title"
                    value={subredditTitle}
                    onChange={(e) => setTitle(e.target.value)}
                    className="register-input"
                />
                <input
                    type="text"
                    placeholder="Description"
                    value={subredditDescription}
                    onChange={(e) => setDescription(e.target.value)}
                    className="register-input"
                />

                {/* Radio Buttons for Privacy */}
                <div className="privacy-options">
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

                <button onClick={handleSubredditCreation} className="register-button">
                    Create Subreddit
                </button>
            </div>
        </div>
    );
};

export default CreateSubreddit;
