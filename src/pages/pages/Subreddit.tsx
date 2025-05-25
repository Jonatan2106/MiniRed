import React, { useState, useEffect, use } from 'react';
import { FaHome, FaCompass, FaFire } from 'react-icons/fa';
import { TiArrowDownOutline, TiArrowUpOutline } from "react-icons/ti";
import { AiOutlinePlusCircle } from 'react-icons/ai';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import Loading from './Loading';
import '../styles/subreddit.css';
import '../styles/main.css';
import { fetchFromAPI } from '../../api/auth';
import { fetchFromAPIWithoutAuth } from '../../api/noAuth';

interface Post {
    post_id: string;
    user_id: string;
    title: string;
    content: string;
    image: string | null;
    created_at: string;
}

interface Subreddit {
    subreddit_id: string;
    user_id: string;
    name: string;
    title: string;
    description: string;
}

interface User {
    user_id: string;
    username: string;
    profilePic: string;
}

interface VoteCount {
    upvotes: number;
    downvotes: number;
    score: number;
}

interface CommentCount {
    count: number;
}

const SubredditPage = () => {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [posts, setPosts] = useState<Post[]>([]);
    const [joinedSubreddits, setJoinedSubreddits] = useState<Subreddit[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<{ user_id: string; username: string; profilePic: string } | null>(null);
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const [users, setUsers] = useState<Map<string, User>>(new Map());
    const { subredditName } = useParams<{ subredditName: string }>();
    const [subreddit, setSubreddit] = useState<Subreddit | null>(null);
    const [isMember, setIsMember] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const [bannerPic, setBannerPic] = useState<string>(() => {
        return `/banner_${Math.floor(Math.random() * 3) + 1}.jpg`;
    });

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                setIsLoggedIn(true);

                // Fetch user data
                const userResponse = await fetchFromAPI('/me', 'GET');
                setUser({ user_id: userResponse.user_id, username: userResponse.username, profilePic: userResponse.profile_pic });

                // Fetch joined subreddits
                const joinedSubredditsResponse = await fetchFromAPI('/users/subreddits', 'GET');
                setJoinedSubreddits(joinedSubredditsResponse);
            }

            // Fetch all users
            const usersResponse = await fetchFromAPI('/user/all', 'GET');
            const userMap = new Map();
            usersResponse.forEach((user: User) => {
                userMap.set(user.user_id, user);
            });
            setUsers(userMap);

            // Fetch subreddit data
            const subredditResponse = await fetchFromAPIWithoutAuth(`/subreddits/r/${subredditName}`, 'GET');
            if (subredditResponse) {
                setSubreddit(subredditResponse);

                // Fetch posts for the subreddit
                const postsResponse = await fetchFromAPIWithoutAuth(`/subreddits/${subredditResponse.subreddit_id}/posts`, 'GET');
                setPosts(postsResponse);

                // Check membership status
                if (token) {
                    const membershipResponse = await fetchFromAPI('/users/subreddits', 'GET');
                    const isUserMember = membershipResponse.some(
                        (joinedSubreddit: Subreddit) => joinedSubreddit.subreddit_id === membershipResponse.subreddit_id
                    );
                    setIsMember(isUserMember);
                }
            } else {
                setError('Subreddit not found');
            }
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load data. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [subredditName]);

    const handleJoinSubreddit = async () => {
        try {
            const response = await fetchFromAPI(`/subreddits/${subreddit?.subreddit_id}/join`, 'POST');
            if (response) {
                setIsMember(true);
                fetchData();
            } else {
                console.error('Failed to join subreddit');
            }
        } catch (error) {
            console.error('Error joining subreddit:', error);
        }
    };

    const handleLeaveSubreddit = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetchFromAPI(`/subreddits/${subreddit?.subreddit_id}/leave`, 'POST');
            if (response) {
                setIsMember(false);
                fetchData();
            } else {
                console.error('Failed to leave subreddit');
            }
        } catch (error) {
            console.error('Error leaving subreddit:', error);
        }
    };

    const handleCreatePost = () => {
        navigate('/create-post'); 
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
        return <div>Error: {error}</div>;
    }

    if (isLoading) {
        return <Loading />;
    }

    return (
        <div className="subreddit-wrapper">
            {/* Main content */}
            <div className="main-content">
                {/* Subreddit Header */}
                <div className="main-feed">
                    <div className="subreddit-page-wrapper">
                        <div className="subreddit-page-header-container">
                            <div className="subreddit-page-header">
                                <div className="subreddit-page-banner">
                                    <img
                                        src={bannerPic}
                                        alt="Subreddit Banner"
                                        className="subreddit-page-banner-image"
                                    />
                                </div>
                                <div className="subreddit-page-header-content">
                                    <div className="subreddit-page-icon">{subreddit?.name[0].toUpperCase()}</div>
                                    <div className="subreddit-page-details">
                                        <h1 className="subreddit-page-title">{subreddit?.title}</h1>
                                        <p className="subreddit-page-name">r/{subreddit?.name}</p>
                                        <p className="subreddit-page-description">{subreddit?.description}</p>
                                    </div>
                                    {isLoggedIn && (
                                        <>
                                            {user?.user_id === subreddit?.user_id ? (
                                                <button
                                                    className="subreddit-page-edit-button"
                                                    onClick={() => window.location.href = `/edit-subreddit/${subreddit?.subreddit_id}`}
                                                >
                                                    Edit Subreddit
                                                </button>
                                            ) : (
                                                <button
                                                    className="subreddit-page-join-button"
                                                    onClick={isMember ? handleLeaveSubreddit : handleJoinSubreddit}
                                                >
                                                    {isMember ? 'Leave' : 'Join'}
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feed */}
                    <div className="feed">
                        {posts.map((post) => (
                            <PostCard key={post.post_id} post={post} users={users} />
                        ))}
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="right-sidebar subreddit">
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

const PostCard = ({ post, users }: { post: Post; users: Map<string, User> }) => {
    const [voteCount, setVoteCount] = useState<{ upvotes: number; downvotes: number, score: number }>({ upvotes: 0, downvotes: 0, score: 0 });
    const [commentCount, setCommentCount] = useState<number>(0);
    const [userVote, setUserVote] = useState<null | 'upvote' | 'downvote'>(null);
    const [voteId, setVoteId] = useState<string | null>(null); // Store the voteId

    useEffect(() => {
        fetchCommentCount();
        fetchVoteCount(); // fetch vote counts

        const token = localStorage.getItem('token');
        if (token) {
            fetch(`http://localhost:5000/api/posts/${post.post_id}/votes`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
                .then(response => response.json())
                .then(data => {
                    if (Array.isArray(data) && data.length > 0) {
                        const vote = data[0]; // Assuming one vote per post per user
                        setUserVote(vote.vote_type ? 'upvote' : 'downvote');
                        setVoteId(vote.vote_id || null);
                    }
                })
                .catch(error => {
                    console.error('Error fetching user vote:', error);
                });
        }
    }, [post.post_id]);

    const fetchVoteCount = () => {
        fetch(`http://localhost:5000/api/posts/${post.post_id}/votes/count`)
            .then((response) => response.json())
            .then((data) => {
                setVoteCount({
                    upvotes: data.upvotes,
                    downvotes: data.downvotes,
                    score: data.score
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

    const handleVote = async (type: 'upvote' | 'downvote') => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Please login to vote.');
                return;
            }

            if (userVote === type) {
                // If the user clicks the same vote again, cancel/delete the vote
                await handleCancelVote();
            } else {
                // Otherwise, cast the new vote
                const voteType = type === 'upvote' ? true : false;

                const response = await fetch(`http://localhost:5000/api/posts/${post.post_id}/votes`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ vote_type: voteType }),
                });

                const data = await response.json();
                // console.log(data); // Log the response to ensure we're getting the expected structure

                if (response.ok) {
                    fetchVoteCount(); // Refresh vote counts
                    setUserVote(type); // Set the user vote locally

                    // Correctly using vote_id from the response
                    setVoteId(data.vote.vote_id || null); // Use vote_id (not voteId)
                } else {
                    alert(data.message || 'Failed to vote.');
                }
            }
        } catch (error) {
            console.error('Error voting:', error);
        }
    };

    // Handle canceling the vote
    const handleCancelVote = async () => {
        if (!voteId) return;

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Please login to cancel your vote.');
                return;
            }

            const response = await fetch(`http://localhost:5000/api/votes/${voteId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                console.log('Vote successfully deleted');
                fetchVoteCount(); // Refresh vote counts
                setUserVote(null); // Remove the user's vote
                setVoteId(null); // Reset the voteId
            } else {
                const errorData = await response.json();
                console.error('Failed to cancel vote:', errorData.message);
                alert(errorData.message || 'Failed to cancel vote.');
            }

        } catch (error) {
            console.error('Error canceling vote:', error);
        }
    };

    return (
        <div className="post-card">
            {/* Upper part: clickable area */}
            <a href={`/post/${post.post_id}`} className="post-link">
                <div className="post-content">
                    <div className="post-header">
                        <a href={`/u/${users.get(post.user_id)?.username || "unknown"}`} className="username">
                            u/{users.get(post.user_id)?.username || "Unknown User"}
                        </a>
                        <span className="timestamp">{new Date(post.created_at).toLocaleString()}</span>
                    </div>
                    <h2>{post.title}</h2>
                    <p>
                        {post.content.length > 100
                            ? `${post.content.slice(0, 100)}...`
                            : post.content
                        }
                    </p>
                    {post.image &&
                        <div className="post-image-container">
                            {post.image && <img src={post.image} alt={post.title} className="post-image" />}
                        </div>
                    }
                </div>
                <hr className='hr' />
            </a>

            {/* Bottom part: vote and comment section */}
            <div className="post-footer">
                <div className="vote-section">
                    <button
                        className={`vote-button ${userVote === 'upvote' ? 'upvoted' : ''} up`}
                        onClick={(e) => {
                            e.stopPropagation();  // Prevent redirect on button click
                            handleVote('upvote');
                        }}
                    >
                        <TiArrowUpOutline className={`arrow ${userVote === 'upvote' ? 'upvoted-arrow' : ''}`} />
                    </button>

                    {/* Display total upvotes */}
                    <span className="vote-count">{voteCount.score > 0 ? voteCount.score : 0}</span>

                    <button
                        className={`vote-button ${userVote === 'downvote' ? 'downvoted' : ''} down`}
                        onClick={(e) => {
                            e.stopPropagation();  // Prevent redirect on button click
                            handleVote('downvote');
                        }}
                    >
                        <TiArrowDownOutline className={`arrow ${userVote === 'downvote' ? 'downvoted-arrow' : ''}`} />
                    </button>
                </div>

                <div className="comment-count">
                    <span>{commentCount}</span> <span>Comments</span>
                </div>
            </div>
        </div>
    );

};

export default SubredditPage;
