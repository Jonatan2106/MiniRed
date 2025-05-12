import React, { useState, useEffect } from 'react';
import { FaHome, FaCompass, FaFire } from 'react-icons/fa';
import { TiArrowDownOutline, TiArrowUpOutline } from "react-icons/ti";
import { AiOutlinePlusCircle } from "react-icons/ai";
import '../styles/popular.css';
import '../styles/main.css';
import Loading from './Loading';

interface Post {
    post_id: string;
    user_id: string;
    title: string;
    content: string;
    image: string | null;
    created_at: string;
    score: number;
}

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

const Popular = () => {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [posts, setPosts] = useState<Post[]>([]);
    const [joinedSubreddits, setJoinedSubreddits] = useState<Subreddit[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<User>();
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const [users, setUsers] = useState<Map<string, User>>(new Map());
    const [isLoading, setIsLoading] = useState(true);

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
                    setUser({ user_id: userData.user_id, username: userData.username, profilePic: userData.profilePic });
                }

                const postsResponse = await fetch('http://localhost:5000/api/posts');
                const postsData = await postsResponse.json();

                const sortedPosts = postsData.sort((a: Post, b: Post) => b.score - a.score);

                setPosts(sortedPosts); // Update the state with sorted posts

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
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleCreatePost = () => {
        window.location.href = '/create-post';
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
        return <Loading />;
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
                    <h1>Judul disini</h1>
                </div>
                <div className="navbar-right">
                    {isLoggedIn ? (
                        <>
                            <button className="create-post-btn" onClick={handleCreatePost}><AiOutlinePlusCircle className="icon" />Create Post</button>
                            <div className="profile-menu">
                                <img
                                    src={user?.profilePic ? user?.profilePic : "/default.png"}
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
                    {posts.map((post) => (
                        <PostCard key={post.post_id} post={post} users={users} current_user={user ?? { user_id: '', username: '', profilePic: '' }} />
                    ))}
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

const PostCard = ({ post, users, current_user }: { post: Post; users: Map<string, User>; current_user: User }) => {
    const [voteCount, setVoteCount] = useState<{ upvotes: number; downvotes: number; score: number }>({ upvotes: 0, downvotes: 0, score: 0 });
    const [commentCount, setCommentCount] = useState<number>(0);
    const [userVote, setUserVote] = useState<null | 'upvote' | 'downvote'>(null);
    const [voteId, setVoteId] = useState<string | null>(null);

    useEffect(() => {
        fetchCommentCount();
        fetchVoteCount();

        const token = localStorage.getItem('token');
        if (token) {
            fetch(`http://localhost:5000/api/posts/${post.post_id}/votes`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
                .then((response) => response.json())
                .then((data) => {
                    if (Array.isArray(data) && data.length > 0) {
                        const vote = data.find((v: any) => v.user_id === current_user.user_id);
                        if (vote) {
                            setUserVote(vote.vote_type ? 'upvote' : 'downvote');
                            setVoteId(vote.vote_id || null);
                        }
                    }
                })
                .catch((error) => console.error('Error fetching user vote:', error));
        }
    }, [post.post_id]);

    const fetchVoteCount = () => {
        fetch(`http://localhost:5000/api/posts/${post.post_id}/votes/count`)
            .then((response) => response.json())
            .then((data) => {
                setVoteCount({
                    upvotes: data.upvotes,
                    downvotes: data.downvotes,
                    score: data.score,
                });
            })
            .catch((error) => console.error('Error fetching vote count:', error));
    };

    const fetchCommentCount = () => {
        fetch(`http://localhost:5000/api/posts/${post.post_id}/comments/count`)
            .then((response) => response.json())
            .then((data) => setCommentCount(data.commentCount))
            .catch((error) => console.error('Error fetching comment count:', error));
    };

    return (

        <div className="post-card">
            <a href={`/post/${post.post_id}`} className="post-link">
                <div className="post-content">
                    <div className="post-header">
                        <a href={`/u/${users.get(post.user_id)?.username}`} className="username">
                            u/{users.get(post.user_id)?.username || 'Unknown User'}
                        </a>
                        <span className="timestamp">{new Date(post.created_at).toLocaleString()}</span>
                    </div>
                    <h2>{post.title}</h2>
                    <p>{post.content.length > 100 ? `${post.content.slice(0, 100)}...` : post.content}</p>
                    {post.image && (
                        <div className="post-image-container">
                            <img src={post.image} alt={post.title} className="post-image" />
                        </div>
                    )}
                </div>
                <hr className="hr" />
            </a>
            <div className="post-footer">
                <div className="vote-section">
                    <span className="vote-count">Score: {voteCount.score}</span>
                </div>
                <div className="comment-count">
                    <span>{commentCount}</span> <span>Comments</span>
                </div>
            </div>
        </div>
    );
};

export default Popular;