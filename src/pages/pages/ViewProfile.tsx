import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FaHome, FaCompass, FaFire } from 'react-icons/fa';
import { AiOutlinePlusCircle } from 'react-icons/ai';
import Loading from './Loading';
import '../styles/viewprofile.css';
import '../styles/home.css';

interface User {
    user_id: string;
    username: string;
    profilePic: string;
    postKarma: number;
    commentKarma: number;
    created_at: string;
}

interface Post {
    post_id: string;
    title: string;
    content: string;
    image: string | null;
    created_at: string;
    subreddit_id: string;
    subreddit_name?: string;
}

interface Comment {
    comment_id: string;
    content: string;
    created_at: string;
    post: Post;
}

interface Subreddit {
    subreddit_id: string;
    name: string;
    is_private: boolean;
    created_at: string;
}

const ViewProfile = () => {
    const { username } = useParams<{ username: string }>();
    const [user, setUser] = useState<User | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);
    const [activeTab, setActiveTab] = useState<'Overview' | 'Posts' | 'Comments'>('Overview');
    const [error, setError] = useState<string | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [currentUser, setCurrentUser] = useState<{ username: string; profilePic: string } | null>(null);
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const [postKarma, setPostKarma] = useState<number>(0);
    const [commentKarma, setCommentKarma] = useState<number>(0);
    const [joinedCommunities, setJoinedCommunities] = useState<Subreddit[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);

                const token = localStorage.getItem('token');
                if (token) {
                    await fetchCurrentUser(token);
                }

                const userData = await fetchUserProfile(username ?? '', token);
                setUser(userData);

                const [postsData, commentsData, communitiesData] = await Promise.all([
                    fetchUserPosts(userData.user_id, token),
                    fetchUserComments(userData.user_id, token),
                    fetchJoinedCommunities(userData.user_id, token),
                ]);

                setPosts(postsData);
                setComments(commentsData);
                setJoinedCommunities(communitiesData.filter((community) => !community.is_private));

                const postKarma = await calculatePostKarma(postsData.map((post) => post.post_id), token);
                const commentKarma = await calculateCommentKarma(commentsData.map((comment) => comment.comment_id), token);

                setPostKarma(postKarma);
                setCommentKarma(commentKarma);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to load user profile.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [username]);

    const fetchCurrentUser = async (token: string) => {
        const response = await fetch('http://localhost:5000/api/me', {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setCurrentUser({ username: data.username, profilePic: data.profile_pic });
        setIsLoggedIn(true);
    };

    const fetchUserProfile = async (username: string, token: string | null): Promise<User> => {
        const response = await fetch('http://localhost:5000/api/user/all', {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch user data');
        const users = await response.json();
        const user = users.find((u: User) => u.username === username);
        if (!user) throw new Error('User not found');
        return user;
    };

    const fetchUserPosts = async (userId: string, token: string | null): Promise<Post[]> => {
        const response = await fetch(`http://localhost:5000/api/user/${userId}/post`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Failed to fetch user posts');

        const posts = await response.json();

        const postsWithSubreddit = await Promise.all(
            posts.map(async (post: any) => {
                const subredditResponse = await fetch(`http://localhost:5000/api/subreddits/${post.subreddit_id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!subredditResponse.ok) {
                    console.error(`Failed to fetch subreddit for post ${post.post_id}`);
                    return { ...post, subreddit_name: 'Unknown Subreddit' };
                }

                const subreddit = await subredditResponse.json();
                console.log('Subreddit:', subreddit.name); // Debugging line
                return { ...post, subreddit_name: subreddit.name, subreddit: subreddit };
            })
        );

        return postsWithSubreddit;
    };

    const fetchUserComments = async (userId: string, token: string | null): Promise<Comment[]> => {
        const response = await fetch(`http://localhost:5000/api/user/${userId}/comment`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Failed to fetch user comments');

        const comments = await response.json();

        const commentsWithPost = await Promise.all(
            comments.map(async (comment: any) => {
                const postResponse = await fetch(`http://localhost:5000/api/posts/${comment.post_id}`, {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!postResponse.ok) {
                    console.error(`Failed to fetch post for comment ${comment.comment_id}`);
                    return { ...comment, post: { title: 'Unknown Post' } };
                }

                const post = await postResponse.json();
                return { ...comment, post };
            })
        );

        return commentsWithPost;
    };

    const fetchJoinedCommunities = async (userId: string, token: string | null): Promise<Subreddit[]> => {
        const response = await fetch(`http://localhost:5000/api/users/${userId}/subreddits`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch joined communities');
        return response.json();
    };

    const calculatePostKarma = async (postIds: string[], token: string | null): Promise<number> => {
        const karmaPromises = postIds.map(async (postId) => {
            const response = await fetch(`http://localhost:5000/api/posts/${postId}/votes/count`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Failed to fetch post votes');
            const { score } = await response.json();
            return score;
        });
        const karmaValues = await Promise.all(karmaPromises);
        return karmaValues.reduce((total, score) => total + score, 0);
    };

    const calculateCommentKarma = async (commentIds: string[], token: string | null): Promise<number> => {
        const karmaPromises = commentIds.map(async (commentId) => {
            const response = await fetch(`http://localhost:5000/api/comments/${commentId}/votes/count`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Failed to fetch comment votes');
            const { score } = await response.json();
            return score;
        });
        const karmaValues = await Promise.all(karmaPromises);
        return karmaValues.reduce((total, score) => total + score, 0);
    };

    const handleTabClick = (tab: 'Overview' | 'Posts' | 'Comments') => {
        setActiveTab(tab);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        window.location.href = '/';
    };

    const toggleDropdown = () => {
        setDropdownOpen((prev) => !prev);
    };

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    if (isLoading) {
        return <Loading />;
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
                    <input
                        className="search-input"
                        type="text"
                        placeholder="Search Reddit"
                    />
                    <button className="search-button">Search</button>
                </div>
                <div className="navbar-right">
                    {isLoggedIn ? (
                        <>
                            <button className="create-post-btn"><AiOutlinePlusCircle className="icon" />Create Post</button>
                            <div className="profile-menu">
                                <img
                                    src={
                                        currentUser?.profilePic ? "http://localhost:5173"+currentUser?.profilePic : '/default.png'
                                    }
                                    className="profile-pic"
                                    alt={currentUser?.username}
                                    onClick={toggleDropdown} // Toggle dropdown on click
                                />
                                {isDropdownOpen && ( // Show dropdown only if `isDropdownOpen` is true
                                    <div className="dropdown-menu">
                                        <a href="/profile" className="dropdown-item">{currentUser?.username}</a>
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

            {/* Main Content */}
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

                {/* Profile Content */}
                <div className="feed">
                    <div className="view-profile-container">
                        {/* Profile Header */}
                        <div className="view-profile-header">
                            <img src={user?.profilePic || '/default.png'} alt={user?.username} className="view-profile-pic" />
                            <div className="view-profile-info">
                                <h1>{user?.username}</h1>
                                <p>u/{user?.username}</p>
                                <p>Joined {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}</p>
                            </div>
                        </div>

                        {/* Profile Stats */}
                        <div className="view-profile-stats">
                            <div className='view-profile-stat-item'>
                                <h3>{postKarma > 0 ? postKarma : 0}</h3>
                                <p>Post Karma</p>
                            </div>
                            <div className='view-profile-stat-item'>
                                <h3>{commentKarma > 0 ? commentKarma : 0}</h3>
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
                                            <a href={"http://localhost:5173/post/" + post.post_id} key={post.post_id}>
                                                <div className="view-profile-post-item">
                                                    {post.subreddit_name != "Unknown Subreddit" &&
                                                        <p className="view-profile-text-sm">Posted in r/{post.subreddit_name}</p>
                                                    }
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
                                                <h3>Commented on:</h3>
                                                <p className="comment-post-title">
                                                    {comment.post && comment.post.title ? `${comment.post.title}` : 'Unknown Post'}
                                                </p>
                                                <p className="comment-content">{comment.content}</p>
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
                                            <a href={"http://localhost:5173/post/" + post.post_id} key={post.post_id}>
                                                <div className="view-profile-post-item">
                                                    {post.subreddit_name != "Unknown Subreddit" &&
                                                        <p className="view-profile-text-sm">Posted in r/{post.subreddit_name}</p>
                                                    }
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
                                                <h3>Commented on:</h3>
                                                <p className="comment-post-title">
                                                    {comment.post && comment.post.title ? `${comment.post.title}` : 'Unknown Post'}
                                                </p>
                                                <p className="comment-content">{comment.content}</p>
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

                {/* Right Sidebar */}
                <div className="right-sidebar">
                    <div className="joined-communities">
                        <h3>Joined Communities</h3>
                        <ul>
                            {joinedCommunities.length > 0 ? (
                                joinedCommunities.map((community) => (
                                    <li key={community.subreddit_id}>
                                        <div className="community-icon">{community.name[0].toUpperCase()}</div>
                                        <a href={`/r/${community.name}`}>r/{community.name}</a>
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

export default ViewProfile;