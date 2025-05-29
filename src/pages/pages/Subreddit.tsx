import Loading from './Loading';

import React, { useState, useEffect } from 'react';
import { TiArrowDownOutline, TiArrowUpOutline } from "react-icons/ti";
import { useNavigate, useParams } from 'react-router-dom';
import { fetchFromAPI } from '../../api/auth';
import { fetchFromAPIWithoutAuth } from '../../api/noAuth';
import RightSidebar from '../component/RightSidebar';

import '../styles/subreddit.css';
import '../styles/main.css';
import LeftSidebar from '../component/LeftSidebar';
import Navbar from '../component/Navbar';

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
    created_at: string;
    user: {
        user_id: string;
        username: string;
        profile_pic: string | null;
    };
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
    const [posts, setPosts] = useState<any[]>([]);
    const [joinedSubreddits, setJoinedSubreddits] = useState<Subreddit[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<{ user_id: string; username: string; profilePic: string } | null>(null);
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const { subredditName } = useParams<{ subredditName: string }>();
    const [subreddit, setSubreddit] = useState<any>(null);
    const [isMember, setIsMember] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const [query, setQuery] = useState('');
    const navigate = useNavigate();
    const [bannerPic, setBannerPic] = useState<string>(() => {
        return `/banner_${Math.floor(Math.random() * 3) + 1}.jpg`;
    });

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            let joinedSubs: Subreddit[] = [];
            let currentUser: any = null;
            if (token) {
                setIsLoggedIn(true);
                const userResponse = await fetchFromAPI('/me', 'GET');
                setUser({ user_id: userResponse.user_id, username: userResponse.username, profilePic: userResponse.profile_pic });
                if (Array.isArray(userResponse.joinedSubreddits)) {
                    joinedSubs = userResponse.joinedSubreddits.map((member: any) => member.subreddit || member).filter((sub: any) => !!sub);
                    setJoinedSubreddits(joinedSubs);
                } else {
                    setJoinedSubreddits([]);
                }
                currentUser = userResponse;
            }

            // Use the new bundled subreddit API
            const subredditResponse = await fetchFromAPIWithoutAuth(`/subreddits/r/${subredditName}`, 'GET');
            if (subredditResponse) {
                setSubreddit(subredditResponse);
                setPosts(subredditResponse.posts || []);
                if (token) {
                    // Check membership from subredditResponse.members
                    const isUserMember = subredditResponse.members?.some((m: any) => m.user_id === currentUser?.user_id);
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

    const useDebounce = (value: string, delay: number) => {
        const [debouncedValue, setDebouncedValue] = useState(value);

        useEffect(() => {
            const handler = setTimeout(() => {
                setDebouncedValue(value);
            }, delay);

            return () => {
                clearTimeout(handler);
            };
        }, [value, delay]);

        return debouncedValue;
    };

    // Remove mixedContent and setFilteredContent logic, and filter posts directly
    const handleSearch = () => {
        const trimmedQuery = query.trim().toLowerCase();
        if (!trimmedQuery) {
            setPosts(subreddit?.posts || []);
            return;
        }
        const filtered = (subreddit?.posts || []).filter((post: any) =>
            post.title?.toLowerCase().includes(trimmedQuery) ||
            post.content?.toLowerCase().includes(trimmedQuery)
        );
        setPosts(filtered);
    };

    const debouncedQuery = useDebounce(query, 300);
    useEffect(() => {
        handleSearch();
    }, [debouncedQuery, subreddit]);

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (isLoading) {
        return <Loading />;
    }

    return (
        <div className="subreddit-wrapper">

            {/* Navbar */}
            <Navbar
                isLoggedIn={isLoggedIn}
                user={user}
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

            {/* Main content */}
            <div className="main-content subreddit-page">
                <LeftSidebar
                    isProfilePage={true}
                    joinedSubreddits={joinedSubreddits}
                />
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
                                                    onClick={() => navigate(`/edit-subreddit/${subreddit?.subreddit_id}`)}
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
                        {posts.length > 0 ? (
                            posts.map((post) => (
                                <PostCard key={post.post_id} post={post} current_user={user} />
                            ))
                        ) : (
                            <div className="no-results-ui">
                                <img src="/404.jpg" alt="No results" className="no-results-img" />
                                <div className="no-results-text">
                                    <h2>No results found</h2>
                                    {query && <p>We couldn't find anything for "<span className="no-results-query">{query}</span>".</p>}
                                    <p>Try searching with different keywords or check your spelling.</p>
                                </div>
                            </div>
                        )}
                    </div>

                </div>

                {/* Right Sidebar */}
                <RightSidebar joinedSubreddits={joinedSubreddits} />
            </div>
        </div>
    );
};

const PostCard = ({ post, current_user }: { post: any, current_user: any }) => {
    const [userVote, setUserVote] = useState<null | 'upvote' | 'downvote'>(null);
    const [voteId, setVoteId] = useState<string | null>(null);
    const [upvotes, setUpvotes] = useState<number>(post.upvotes);
    const [downvotes, setDownvotes] = useState<number>(post.downvotes);
    const navigate = useNavigate();

    useEffect(() => {
        if (post.votes && current_user) {
            const voteUser = post.votes.find((vote: any) => vote.user_id === current_user.user_id);
            if (voteUser) {
                setUserVote(voteUser.vote_type ? 'upvote' : 'downvote');
                setVoteId(voteUser.vote_id || null);
            } else {
                setUserVote(null);
                setVoteId(null);
            }
        }
        setUpvotes(post.upvotes);
        setDownvotes(post.downvotes);
    }, [post.votes, post.upvotes, post.downvotes, current_user]);

    const handleVote = async (type: 'upvote' | 'downvote') => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        if (userVote === type) {
            await handleCancelVote();
            return;
        }
        const voteType = type === 'upvote' ? true : false;
        try {
            const data = await fetchFromAPI(`/posts/${post.post_id}/votes`, 'POST', { vote_type: voteType });
            setUserVote(type);
            setVoteId(data.vote.vote_id || null);
            setUpvotes(typeof data.upvotes === 'number' ? data.upvotes : upvotes);
            setDownvotes(typeof data.downvotes === 'number' ? data.downvotes : downvotes);
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Failed to vote.');
        }
    };

    const handleCancelVote = async () => {
        if (!voteId) return;
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        try {
            const data = await fetchFromAPI(`/votes/${voteId}`, 'DELETE');
            setUpvotes(typeof data.upvotes === 'number' ? data.upvotes : upvotes);
            setDownvotes(typeof data.downvotes === 'number' ? data.downvotes : downvotes);
            setUserVote(null);
            setVoteId(null);
        } catch (error) {
            setUserVote(null);
            setVoteId(null);
        }
    };

    const username = post.user?.username || 'Unknown User';
    const userProfileUrl = post.user ? `/u/${post.user.username}` : '#';

    return (
        <div className="post-card">
            <a href={`/post/${post.post_id}`} className="post-link">
                <div className="post-content">
                    <div className="post-header">
                        <a href={userProfileUrl} className="username">
                            u/{username}
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
                            <img src={post.image} alt={post.title} className="post-image" />
                        </div>
                    }
                </div>
                <hr className='hr' />
            </a>
            <div className="post-footer">
                <div className="vote-section">
                    <button
                        className={`vote-button ${userVote === 'upvote' ? 'upvoted' : ''} up`}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleVote('upvote');
                        }}
                    >
                        <TiArrowUpOutline className={`arrow ${userVote === 'upvote' ? 'upvoted-arrow' : ''}`} />
                    </button>
                    <span className="vote-count">{Math.max(0, upvotes - downvotes)}</span>
                    <button
                        className={`vote-button ${userVote === 'downvote' ? 'downvoted' : ''} down`}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleVote('downvote');
                        }}
                    >
                        <TiArrowDownOutline className={`arrow ${userVote === 'downvote' ? 'downvoted-arrow' : ''}`} />
                    </button>
                </div>
                <div className="comment-count">
                    <span>{post.commentCount ?? 0}</span> <span>Comments</span>
                </div>
            </div>
        </div>
    );
};

export default SubredditPage;
