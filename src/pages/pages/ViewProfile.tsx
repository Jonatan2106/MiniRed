import Loading from './Loading';

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
    const navigate = useNavigate();

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
        const response = await fetchFromAPI('/me', 'GET');
        setCurrentUser({ username: response.username, profilePic: response.profile_pic });
        setIsLoggedIn(true);
    };

    const fetchUserProfile = async (username: string, token: string | null): Promise<User> => {
        const response = await fetchFromAPIWithoutAuth('/user/all', 'GET');
        if (!response) throw new Error('Failed to fetch user data');
        const user = response.find((u: User) => u.username === username);
        if (!user) throw new Error('User not found');
        return user;
    };

    const fetchUserPosts = async (userId: string, token: string | null): Promise<Post[]> => {
        const response = await fetchFromAPI(`/user/${userId}/post`, 'GET');

        if (!response) throw new Error('Failed to fetch user posts');

        const posts = await response;

        const postsWithSubreddit = await Promise.all(
            posts.map(async (post: any) => {
                try {
                    const subreddit = await fetchFromAPI(`/subreddits/${post.subreddit_id}`, 'GET');
                    console.log('Subreddit:', subreddit.name); 
                    return { ...post, subreddit_name: subreddit.name, subreddit: subreddit };
                } catch (error) {
                    console.error(`Failed to fetch subreddit for post ${post.post_id}:`, error);
                    return { ...post, subreddit_name: 'Unknown Subreddit' };
                }
            })
        );

        return postsWithSubreddit;
    };

    const fetchUserComments = async (userId: string, token: string | null): Promise<Comment[]> => {
        try {
            const comments = await fetchFromAPI(`/user/${userId}/comment`, 'GET');

            const commentsWithPost = await Promise.all(
                comments.map(async (comment: any) => {
                    try {
                        const post = await fetchFromAPI(`/posts/${comment.post_id}`, 'GET');
                        return { ...comment, post };
                    } catch (error) {
                        console.error(`Failed to fetch post for comment ${comment.comment_id}:`, error);
                        return { ...comment, post: { title: 'Unknown Post' } };
                    }
                })
            );

            return commentsWithPost;
        } catch (error) {
            console.error('Failed to fetch user comments:', error);
            throw new Error('Failed to fetch user comments');
        }
    };

    const fetchJoinedCommunities = async (userId: string, token: string | null): Promise<Subreddit[]> => {
        try {
            const communities = await fetchFromAPI(`/users/${userId}/subreddits`, 'GET');
            return communities;
        } catch (error) {
            console.error('Failed to fetch joined communities:', error);
            throw new Error('Failed to fetch joined communities');
        }
    };

    const calculatePostKarma = async (postIds: string[], token: string | null): Promise<number> => {
        const karmaPromises = postIds.map(async (postId) => {
            try {
                const voteData = await fetchFromAPI(`/posts/${postId}/votes/count`, 'GET');
                return voteData.score;
            } catch (error) {
                console.error(`Failed to fetch votes for post ${postId}:`, error);
                return 0; 
            }
        });

        const karmaValues = await Promise.all(karmaPromises);
        return karmaValues.reduce((total, score) => total + score, 0);
    };

    const calculateCommentKarma = async (commentIds: string[], token: string | null): Promise<number> => {
        const karmaPromises = commentIds.map(async (commentId) => {
            try {
                const voteData = await fetchFromAPI(`/comments/${commentId}/votes/count`, 'GET');
                return voteData.score;
            } catch (error) {
                console.error(`Failed to fetch votes for comment ${commentId}:`, error);
                return 0; 
            }
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
        navigate('/');
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
            {/* Main Content */}
            <div className="main-content">
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