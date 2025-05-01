import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import '../styles/viewprofile.css';
import '../styles/home.css'; // Import styles for navbar and sidebars
import { FaHome, FaCompass, FaFire } from 'react-icons/fa';
import { AiOutlinePlusCircle } from 'react-icons/ai';

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
    subreddit_name?: string; // Add this to store the fetched subreddit name
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

    useEffect(() => {
        fetchUserProfile();
        checkLoginStatus();
    }, [username]);

    const checkLoginStatus = () => {
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
                    setCurrentUser({ username: data.username, profilePic: data.profilePic });
                })
                .catch((error) => console.error('Error fetching current user:', error));
        }
    };

    const fetchUserProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/user/all`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.ok) throw new Error('Failed to fetch user data');
            const users = await response.json();

            const userData = users.find((u: User) => u.username === username);
            if (!userData) throw new Error('User not found');

            setUser(userData);

            await fetchUserPosts(userData.user_id);
            await fetchUserComments(userData.user_id);
            await fetchJoinedCommunities(userData.user_id);
        } catch (error) {
            console.error(error);
            setError('Failed to load user profile.');
        }
    };

    const fetchUserPosts = async (user_id: string) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/user/${user_id}/post`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.ok) throw new Error('Failed to fetch user posts');
            const data: Post[] = await response.json();
            setPosts(data);

            // Calculate post karma
            const karma = await calculatePostKarma(data.map((post) => post.post_id));
            setPostKarma(karma);

            const subredditPromises = data.map((post) => fetchSubredditName(post.subreddit_id));
            const subredditNames = await Promise.all(subredditPromises);
            const postsWithSubredditNames = data.map((post, index) => ({
                ...post,
                subreddit_name: subredditNames[index],
            }));
            setPosts(postsWithSubredditNames);
        } catch (error) {
            console.error(error);
            setPosts([]);
        }
    };

    const fetchSubredditName = async (subreddit_id: string): Promise<string> => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/subreddits/${subreddit_id}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.ok) throw new Error('Failed to fetch subreddit name');
            const subreddit: Subreddit = await response.json();
            return subreddit.name;
        } catch (error) {
            console.error(error);
            return 'Unknown Subreddit';
        }
    };

    const fetchUserComments = async (user_id: string) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/user/${user_id}/comment`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.ok) throw new Error('Failed to fetch user comments');
            const data = await response.json();

            // Fetch post details for each comment's post_id
            const enrichedComments: Comment[] = await Promise.all(
                data.map(async (comment: any) => {
                    const postResponse = await fetch(`http://localhost:5000/api/posts/${comment.post_id}`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });
                    const post = postResponse.ok ? await postResponse.json() : { title: 'Unknown Post' };

                    return {
                        comment_id: comment.comment_id,
                        content: comment.content,
                        created_at: comment.created_at,
                        post: {
                            post_id: comment.post_id,
                            title: post.title || 'Unknown Post',
                            content: post.content || '',
                            image: post.image || null,
                            created_at: post.created_at || '',
                            subreddit_id: post.subreddit_id || '',
                            subreddit_name: post.subreddit_name || 'Unknown Subreddit',
                        },
                    };
                })
            );

            setComments(enrichedComments);

            // Calculate comment karma
            const karma = await calculateCommentKarma(enrichedComments.map((comment) => comment.comment_id));
            setCommentKarma(karma);
        } catch (error) {
            console.error(error);
            setComments([]);
        }
    };

    const calculatePostKarma = async (postIds: string[]): Promise<number> => {
        try {
            const token = localStorage.getItem('token');
            const karmaPromises = postIds.map(async (postId) => {
                const response = await fetch(`http://localhost:5000/api/posts/${postId}/votes/count`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (!response.ok) throw new Error('Failed to fetch post votes');
                const { score } = await response.json();
                return score;
            });
            const karmaValues = await Promise.all(karmaPromises);
            return karmaValues.reduce((total, score) => total + score, 0);
        } catch (error) {
            console.error(error);
            return 0;
        }
    };

    const calculateCommentKarma = async (commentIds: string[]): Promise<number> => {
        try {
            const token = localStorage.getItem('token');
            const karmaPromises = commentIds.map(async (commentId) => {
                const response = await fetch(`http://localhost:5000/api/comments/${commentId}/votes/count`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (!response.ok) throw new Error('Failed to fetch comment votes');
                const { score } = await response.json();
                return score;
            });
            const karmaValues = await Promise.all(karmaPromises);
            return karmaValues.reduce((total, score) => total + score, 0);
        } catch (error) {
            console.error(error);
            return 0;
        }
    };

    const fetchJoinedCommunities = async (user_id: string) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/users/${user_id}/subreddits`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.ok) throw new Error('Failed to fetch joined communities');
            const data: Subreddit[] = await response.json();

            // Filter out private communities
            const publicCommunities = data.filter((community) => !community.is_private);
            setJoinedCommunities(publicCommunities);
        } catch (error) {
            console.error(error);
            setJoinedCommunities([]);
        }
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

    if (!user) {
        return <div>Loading...</div>;
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
                                    src={currentUser?.profilePic || '/default.png'}
                                    className="profile-pic"
                                    alt={currentUser?.username}
                                    onClick={toggleDropdown} // Toggle dropdown on click
                                />
                                {isDropdownOpen && ( // Show dropdown only if `isDropdownOpen` is true
                                    <div className="dropdown-menu">
                                        <a href="/profile" className="dropdown-item">Profile</a>
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
                <div className="left-sidebar">
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
                            <img src={user.profilePic || '/default.png'} alt={user.username} className="view-profile-pic" />
                            <div className="view-profile-info">
                                <h1>{user.username}</h1>
                                <p>u/{user.username}</p>
                                <p>Joined {new Date(user.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>

                        {/* Profile Stats */}
                        <div className="view-profile-stats">
                            <div className='view-profile-stat-item'>
                                <h3>{postKarma}</h3>
                                <p>Post Karma</p>
                            </div>
                            <div className='view-profile-stat-item'>
                                <h3>{commentKarma}</h3>
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