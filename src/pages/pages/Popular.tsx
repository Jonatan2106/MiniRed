import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchFromAPI } from '../../api/auth';
import { fetchFromAPIWithoutAuth } from '../../api/noAuth';
import Loading from './Loading';
import LeftSidebar from '../component/LeftSidebar';
import Navbar from '../component/Navbar';
import RightSidebar from '../component/RightSidebar';
import '../styles/popular.css';
import '../styles/main.css';
import { TiArrowUpOutline, TiArrowDownOutline } from 'react-icons/ti';

interface Post {
    post_id: string;
    title: string;
    content: string;
    image: string | null;
    created_at: string;
    user: {
        user_id: string;
        username: string;
        profile_pic: string | null;
    };
    subreddit: {
        subreddit_id: string;
        name: string;
        title: string;
    };
    upvotes: number;
    downvotes: number;
    commentCount: number;
    votes: Array<{
        vote_id: string;
        user_id: string;
        vote_type: boolean;
    }>;
    comments?: Array<any>;
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
    subreddit_members?: Array<{
        user_id: string;
        is_moderator: boolean;
        user: {
            user_id: string;
            username: string;
            profile_pic: string | null;
        };
    }>;
}

const Popular = () => {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [posts, setPosts] = useState<Post[]>([]);
    const [joinedSubreddits, setJoinedSubreddits] = useState<Subreddit[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<any>();
    const [isLoading, setIsLoading] = useState(true);
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const [query, setQuery] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                let currentUser = null;
                let userResponse = null;
                const token = localStorage.getItem('token');
                if (token) {
                    setIsLoggedIn(true);
                    userResponse = await fetchFromAPI('/me', 'GET');
                    currentUser = { user_id: userResponse.user_id, username: userResponse.username, profile_pic: userResponse.profile_pic };
                    setUser(currentUser);
                }
                const postsResponse = await fetchFromAPIWithoutAuth('/posts', 'GET');
                postsResponse.sort((a: Post, b: Post) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
                setPosts(postsResponse);
                
                if (userResponse && userResponse.joinedSubreddits) {
                    const joined = userResponse.joinedSubreddits
                        .map((member: any) => member.subreddit)
                        .filter((sub: any) => !!sub);
                    setJoinedSubreddits(joined);
                } else {
                    setJoinedSubreddits([]);
                }
            } catch (err) {
                setError('Failed to load data. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const toggleDropdown = () => {
        setDropdownOpen((prev) => !prev);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        navigate('/');
    };

    const handleCreatePost = () => {
        navigate('/create-post');
    };

    const handleSearch = () => {
        if (query.trim()) {
            navigate(`/search?q=${encodeURIComponent(query.trim())}`);
        }
    };

    if (isLoading) {
        return <Loading />;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="home-wrapper">
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
            
            <div className="main-content">
                <LeftSidebar 
                    isProfilePage={true} 
                    joinedSubreddits={joinedSubreddits} 
                />
                
                {/* Feed */}
                <div className="feed">
                    {posts.map((post) => (
                        <PostCard key={post.post_id} post={post} current_user={user} />
                    ))}
                </div>
                
                <RightSidebar joinedSubreddits={joinedSubreddits} />
            </div>
        </div>
    );
};

// PostCard copied from Home page, with local vote state and navigation
const PostCard = ({ post, current_user }: { post: Post; current_user: any }) => {
    const [userVote, setUserVote] = useState<null | 'upvote' | 'downvote'>(null);
    const [voteId, setVoteId] = useState<string | null>(null);
    const [upvotes, setUpvotes] = useState<number>(post.upvotes);
    const [downvotes, setDownvotes] = useState<number>(post.downvotes);
    const navigate = useNavigate();

    useEffect(() => {
        if (post.votes && current_user) {
            const voteUser = post.votes.find((vote) => vote.user_id === current_user.user_id);
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

    // Guard for missing user or subreddit
    const username = post.user?.username || 'Unknown User';
    const userProfileUrl = post.user ? `/u/${post.user.username}` : '#';
    const subredditName = post.subreddit?.name || 'unknown';
    const subredditUrl = post.subreddit ? `/r/${post.subreddit.name}` : '#';

    return (
        <div className="post-card">
            {/* Upper part: clickable area */}
            <div className="post-link" onClick={() => navigate(`/post/${post.post_id}`)} style={{ cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}>
                <div className="post-content">
                    <div className="post-header">
                        <span
                            className="username"
                            style={{ cursor: 'pointer' }}
                            onClick={e => {
                                e.stopPropagation();
                                navigate(userProfileUrl);
                            }}
                        >
                            u/{username}
                        </span>
                        <span className="timestamp">{new Date(post.created_at).toLocaleString()}</span>
                        <span className="subreddit-link"
                            onClick={e => {
                                e.stopPropagation();
                                if (subredditName !== 'unknown') {
                                    navigate(subredditUrl);
                                }
                            }}
                        >
                            {subredditName !== 'unknown' && `r/${subredditName}`}
                        </span>
                    </div>
                    <h2>{post.title}</h2>
                    <p>
                        {post.content.length > 100
                            ? `${post.content.slice(0, 100)}...`
                            : post.content}
                    </p>
                    {post.image &&
                        <div className="post-image-container">
                            <img src={post.image} alt={post.title} className="post-image" />
                        </div>
                    }
                </div>
                <hr className='hr' />
            </div>
            {/* Bottom part: vote and comment section */}
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
                    <span className="vote-count">{Math.max(upvotes - downvotes, 0)}</span>
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
                    <span>{post.commentCount}</span> <span>Comments</span>
                </div>
            </div>
        </div>
    );
};

export default Popular;