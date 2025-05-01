import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import imageCompression from 'browser-image-compression';
import '../styles/createpost.css';

interface Subreddit {
    subreddit_id: string;
    name: string;
    title: string;
    description: string;
}

const CreatePost = () => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [subreddits, setSubreddits] = useState<Subreddit[]>([]);
    const [selectedSubreddit, setSelectedSubreddit] = useState<string>('none');
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchJoinedSubreddits = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:5000/api/users/subreddits', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const data = await response.json();
                setSubreddits(data);
            } catch (error) {
                console.error('Error fetching joined subreddits:', error);
            }
        };

        fetchJoinedSubreddits();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title || !content) {
            setError('Title and content are required.');
            return;
        }

        let imageBase64 = null;
        if (image) {
            imageBase64 = await toBase64(image);
        }

        const token = localStorage.getItem('token');

        const postData = {
            title,
            content,
            subreddit_id: selectedSubreddit !== 'none' ? selectedSubreddit : null,
            image: imageBase64,
        };

        try {
            const response = await fetch('http://localhost:5000/api/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(postData),
            });

            if (response.ok) {
                const data = await response.json();
                navigate(
                    selectedSubreddit !== 'none'
                        ? `/r/${subreddits.find((sub) => sub.subreddit_id === selectedSubreddit)?.name}`
                        : '/'
                );
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to create post.');
            }
        } catch (error) {
            console.error('Error creating post:', error);
            setError('An error occurred while creating the post.');
        }
    };

    const toBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
        });


    const selected = subreddits.find((sub) => sub.subreddit_id === selectedSubreddit);

    return (
        <div className="create-post-wrapper">
            <div className="create-post-header">
                <h1>Create Post</h1>
                <button className="post-page-back-button" onClick={() => navigate(-1)}>
                    Back
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="form-layout">
                <form className="create-post-form" onSubmit={handleSubmit}>
                    <div className="form-section">
                        <label htmlFor="subreddit">Posting to</label>
                        <select
                            id="subreddit"
                            value={selectedSubreddit}
                            onChange={(e) => setSelectedSubreddit(e.target.value)}
                            className="subreddit-select"
                        >
                            <option value="none">None</option>
                            {subreddits.map((subreddit) => (
                                <option key={subreddit.subreddit_id} value={subreddit.subreddit_id}>
                                    {subreddit.title} (r/{subreddit.name})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-section">
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Title"
                            maxLength={300}
                            required
                            className="title-input"
                        />
                        <div
                            className="character-counter"
                            style={{ color: title.length === 300 ? '#FF4500' : '#999' }}
                        >
                            {title.length}/300
                        </div>
                    </div>

                    <div className="form-section">
                        <textarea
                            id="content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Place your content here..."
                            maxLength={10000}
                            required
                            className="content-textarea"
                        ></textarea>
                        <div
                            className="character-counter"
                            style={{ color: title.length === 10000 ? '#FF4500' : '#999' }}
                        >
                            {content.length}/10000
                        </div>
                    </div>

                    <div className="form-section">
                        <label htmlFor="image" className="image-label">
                            Drag and Drop or upload media (optional)
                        </label>
                        <div
                            className={`drag-drop-area ${image ? 'has-image' : ''}`}
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                    setImage(e.dataTransfer.files[0]);
                                    e.dataTransfer.clearData();
                                }
                            }}
                            onClick={() => document.getElementById('image')?.click()}
                        >
                            {!image ? (
                                <p>Drag and drop an image here, or click to upload</p>
                            ) : (
                                <div className="image-preview">
                                    <img src={URL.createObjectURL(image)} alt="Preview" />
                                    <button
                                        type="button"
                                        className="remove-image-button"
                                        onClick={() => setImage(null)}
                                    >
                                        Remove
                                    </button>
                                </div>
                            )}
                            <input
                                type="file"
                                id="image"
                                accept="image/*"
                                onChange={(e) => setImage(e.target.files ? e.target.files[0] : null)}
                                className="image-input"
                            />
                        </div>
                    </div>
                </form>

                <div className="preview-pane">
                    {selected && (
                        <div className="subreddit-preview">
                            <div className="subreddit-header">
                                <div className="subreddit-icon">{selected.name[0].toUpperCase()}</div>
                                <div>
                                    <h3 className="subreddit-title">{selected.title}</h3>
                                    <p className="subreddit-name">r/{selected.name}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="markdown-preview">
                        <h3 className="markdown-preview-title">Live Preview</h3>
                        {title && <h2 className="preview-title">{title}</h2>}
                        {image && (
                            <div className="image-preview">
                                <img src={URL.createObjectURL(image)} alt="Post Preview" />
                            </div>
                        )}
                        <div className="markdown-content">
                            <ReactMarkdown>{content || 'Start typing to see a preview...'}</ReactMarkdown>
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" className="submit-button" onClick={handleSubmit}>
                        Post
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreatePost;