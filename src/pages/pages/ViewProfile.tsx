import Loading from './Loading';
import LeftSidebar from '../component/LeftSidebar';
import Navbar from '../component/Navbar';

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchFromAPI } from '../../api/auth';
import { fetchFromAPIWithoutAuth } from '../../api/noAuth';
import { useNavigate } from 'react-router-dom';

import '../styles/viewprofile.css';
import '../styles/home.css';

interface User {
    user_id: string;
    username: string;
    email: string;
    profile_pic: string | null;
    created_at: string;
}

interface Post {
    post_id: string;
    title: string;
    content: string;
    created_at: string;
    votes?: any[];
    image?: string;
}

interface Comment {
    comment_id: string;
    content: string;
    created_at: string;
    votes?: any[];
    post_id?: string;
    post_title?: string; // Added post_title for linking to post title
}

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
}

const ViewProfile = () => {
    const { username } = useParams<{ username: string }>();
    const [user, setUser] = useState<User | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);
    const [activeTab, setActiveTab] = useState<'Overview' | 'Posts' | 'Comments'>('Overview');
    const [error, setError] = useState<string | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [currentUser, setCurrentUser] = useState<{ username: string; profile_pic: string } | null>(null);
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const [joinedCommunities, setJoinedCommunities] = useState<Subreddit[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [isPicModalOpen, setPicModalOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const token = localStorage.getItem('token');
                if (token) {
                    const me = await fetchFromAPI('/me', 'GET');
                    setCurrentUser({ username: me.username, profile_pic: me.profile_pic });
                    setIsLoggedIn(true);
                }
                // Fetch bundled profile
                const bundle = await fetchFromAPIWithoutAuth(`/user/${username}`, 'GET');
                setUser({
                    user_id: bundle.user_id,
                    username: bundle.username,
                    email: bundle.email,
                    profile_pic: bundle.profile_pic,
                    created_at: bundle.created_at,
                });
                setPosts(bundle.posts || []);
                setComments(bundle.comments || []);
                // Flatten joinedSubreddits to just the subreddit object
                setJoinedCommunities(
                    (bundle.joinedSubreddits || [])
                        .map((j: any) => j.subreddit)
                        .filter((s: any) => !!s)
                );
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to load user profile.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [username]);

    const handleTabClick = (tab: 'Overview' | 'Posts' | 'Comments') => {
        setActiveTab(tab);
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

    const handleSearch = () => {
        if (query.trim()) {
            navigate(`/search?q=${encodeURIComponent(query.trim())}`);
        }
    };

    const openPicModal = () => setPicModalOpen(true);
    const closePicModal = () => setPicModalOpen(false);

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    if (isLoading) {
        return <Loading />;
    }

    return (
        <div className="home-wrapper">
            <Navbar
                isLoggedIn={isLoggedIn}
                user={currentUser}
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

            <div className="main-content view-profile">
                <LeftSidebar
                    isProfilePage={true}
                    joinedSubreddits={joinedCommunities}
                />

                {/* Profile Content */}
                <div className="feed">
                    <div className="view-profile-container">
                        {/* Profile Header */}
                        <div className="view-profile-header">
                            <img
                                src={user?.profile_pic || '/default.png'}
                                alt={user?.username}
                                className="view-profile-pic"
                                style={{ cursor: 'pointer' }}
                                onClick={openPicModal}
                            />
                            <div className="view-profile-info">
                                <h1>{user?.username}</h1>
                                <p>u/{user?.username}</p>
                                <p>Joined {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}</p>
                            </div>
                        </div>

                        {/* Profile Stats */}
                        <div className="view-profile-stats">
                            <div className='view-profile-stat-item'>
                                <h3>{posts.length}</h3>
                                <p>Post Karma</p>
                            </div>
                            <div className='view-profile-stat-item'>
                                <h3>{comments.length}</h3>
                                <p>Comment Karma</p>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="view-profile-tabs">
                            <button
                                className={`view-profile-tab ${activeTab === 'Overview' ? 'active' : ''}`}
                                onClick={() => handleTabClick('Overview')}
                            >
                                Overview
                            </button>
                            <button
                                className={`view-profile-tab ${activeTab === 'Posts' ? 'active' : ''}`}
                                onClick={() => handleTabClick('Posts')}
                            >
                                Posts
                            </button>
                            <button
                                className={`view-profile-tab ${activeTab === 'Comments' ? 'active' : ''}`}
                                onClick={() => handleTabClick('Comments')}
                            >
                                Comments
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="view-profile-content">
                            {activeTab === 'Overview' && (
                                <>
                                    <h2>Recent Posts</h2>
                                    {posts.length > 0 ? (
                                        posts.map((post) => (
                                            <a href={`/post/${post.post_id}`} key={post.post_id}>
                                                <div className="view-profile-post-item">
                                                    <h3>{post.title}</h3>
                                                    <p>
                                                        {post.content.length > 100
                                                            ? `${post.content.slice(0, 100)}...`
                                                            : post.content}
                                                    </p>
                                                    {post.image && (
                                                        <div className="post-image-container">
                                                            <img src={post.image} alt={post.title} className="post-image" />
                                                        </div>
                                                    )}
                                                </div>
                                            </a>
                                        ))
                                    ) : (
                                        <p>No posts yet.</p>
                                    )}
                                    <h2>Recent Comments</h2>
                                    {comments.length > 0 ? (
                                        comments.map((comment) => (
                                            <div key={comment.comment_id} className="view-profile-comment-item">
                                                <h3>Commented:</h3>
                                                <p className="comment-content">{comment.content}</p>
                                                {comment.post_title && (
                                                    <div className="comment-post-title">on post <span>{comment.post_title}</span></div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <p>No comments yet.</p>
                                    )}
                                </>
                            )}
                            {activeTab === 'Posts' && (
                                <>
                                    {posts.length > 0 ? (
                                        posts.map((post) => (
                                            <a href={`/post/${post.post_id}`} key={post.post_id}>
                                                <div className="view-profile-post-item">
                                                    <h3>{post.title}</h3>
                                                    <p>
                                                        {post.content.length > 100
                                                            ? `${post.content.slice(0, 100)}...`
                                                            : post.content}
                                                    </p>
                                                    {post.image && (
                                                        <div className="post-image-container">
                                                            <img src={post.image} alt={post.title} className="post-image" />
                                                        </div>
                                                    )}
                                                </div>
                                            </a>
                                        ))
                                    ) : (
                                        <p>No posts yet.</p>
                                    )}
                                </>
                            )}
                            {activeTab === 'Comments' && (
                                <>
                                    {comments.length > 0 ? (
                                        comments.map((comment) => (
                                            <div key={comment.comment_id} className="view-profile-comment-item">
                                                <h3>Commented:</h3>
                                                <p className="comment-content">{comment.content}</p>
                                                {comment.post_title && (
                                                    <div className="comment-post-title">on post <span>{comment.post_title}</span></div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <p>No comments yet.</p>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {isPicModalOpen && (
                <div className="profile-pic-modal-overlay" onClick={closePicModal}>
                    <div className="profile-pic-modal-content" onClick={e => e.stopPropagation()}>
                        <img
                            src={user?.profile_pic || '/default.png'}
                            alt={user?.username}
                            className="profile-pic-modal-img"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ViewProfile;