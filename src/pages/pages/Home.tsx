import Loading from './Loading';
import LeftSidebar from '../component/LeftSidebar';
import Navbar from '../component/Navbar';
import RightSidebar from '../component/RightSidebar';

import React, { useState, useEffect } from 'react';
import { TiArrowDownOutline, TiArrowUpOutline } from "react-icons/ti";
import { fetchFromAPI } from '../../api/auth';
import { fetchFromAPIWithoutAuth } from '../../api/noAuth';
import { useNavigate } from 'react-router-dom';

import '../styles/home.css';
import '../styles/main.css';

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
  type?: string; // Add type property for sorting
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
  type?: string; // Add type property for sorting
}

interface ContentItem extends Partial<Post>, Partial<Subreddit> {
  type: 'post' | 'subreddit';
  created_at: string;
}

interface User {
  user_id: string;
  username: string;
  profilePic: string;
}

const Home = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [allSubreddits, setAllSubreddits] = useState<Subreddit[]>([]);
  const [joinedSubreddits, setJoinedSubreddits] = useState<Subreddit[]>([]);
  const [mixedContent, setMixedContent] = useState<ContentItem[]>([]);
  const [filteredContent, setFilteredContent] = useState<ContentItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>();
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        let userResponse = null;
        let currentUser = null;
        if (token) {
          setIsLoggedIn(true);
          userResponse = await fetchFromAPI('/me', 'GET');
          currentUser = { user_id: userResponse.user_id, username: userResponse.username, profile_pic: userResponse.profile_pic };
          setUser(currentUser);
        } else {
          setUser(null);
        }

        const postsResponse = await fetchFromAPIWithoutAuth('/posts', 'GET');
        const allSubredditsResponse = await fetchFromAPIWithoutAuth('/subreddits', 'GET');
        
        // Add type property to each item
        const typedPosts = postsResponse.map((post: Post) => ({ ...post, type: 'post' }));
        const typedSubreddits = allSubredditsResponse.map((subreddit: Subreddit) => ({ ...subreddit, type: 'subreddit' }));
        
        setPosts(typedPosts);
        setAllSubreddits(typedSubreddits);

        // Combine and sort posts and subreddits by creation date
        const combined = [...typedPosts, ...typedSubreddits].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        setMixedContent(combined);
        setFilteredContent(combined);

        // Derive joinedSubreddits from /me response (user.joinedSubreddits)
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

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    handleSearch();
  }, [debouncedQuery]);

  const handleCreatePost = () => {
    navigate('/create-post');
  };

  // handleSearch filters the mixed content
  const handleSearch = () => {
    const trimmedQuery = query.trim().toLowerCase();
    if (trimmedQuery === '') {
      setFilteredContent(mixedContent);
      return;
    }
    
    const filtered = mixedContent.filter(item => {
      if (item.type === 'post') {
        return item.title?.toLowerCase().includes(trimmedQuery);
      } else if (item.type === 'subreddit') {
        return item.name?.toLowerCase().includes(trimmedQuery) || 
               item.description?.toLowerCase().includes(trimmedQuery);
      }
      return false;
    });
    
    setFilteredContent(filtered);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    navigate('/');
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
      {/* Add Navbar component */}
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
        {/* Add LeftSidebar component */}
        <LeftSidebar 
          isProfilePage={true} 
          joinedSubreddits={joinedSubreddits} 
        />
        
        {/* Feed */}
        <div className="feed">
          {filteredContent.length > 0 ? (
            filteredContent.map((item) => {
              if (item.type === 'post') {
                return <PostCard key={`post-${item.post_id}`} post={item as Post} current_user={user} />;
              } else if (item.type === 'subreddit') {
                return <SubredditCard key={`sub-${item.subreddit_id}`} subreddit={item as Subreddit} />;
              }
              return null;
            })
          ) : (
            <div className="no-results">
              {query ? (
                <p className="text-gray-500">No results found for "{query}".</p>
              ) : (
                <p className="text-gray-500">No content available.</p>
              )}
            </div>
          )}
        </div>
        
        {/* Right Sidebar */}
        <RightSidebar joinedSubreddits={joinedSubreddits} />
      </div>
    </div>
  );
};

// SubredditCard now uses bundled user info and unique design
const SubredditCard = ({ subreddit }: { subreddit: Subreddit }) => {
  const owner = subreddit.user?.username;
  const createdAt = new Date(subreddit.created_at).toLocaleString();
  const navigate = useNavigate();
  const handleClick = () => {
    navigate(`/r/${subreddit.name}`);
  };
  const handleOwnerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (subreddit.user?.username) {
      navigate(`/u/${subreddit.user.username}`);
    }
  };
  return (
    <div
      className="subreddit-card"
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') handleClick();
      }}
      aria-label={`Go to r/${subreddit.name}`}
    >
      <div className="subreddit-title">r/{subreddit.name}</div>
      <div className="subreddit-desc">{subreddit.description}</div>
      <div className="subreddit-meta">
        Created by{' '}
        <span
          className="subreddit-owner"
          onClick={handleOwnerClick}
        >
          u/{owner}
        </span>{' '}
        on {createdAt}
      </div>
    </div>
  );
};

// PostCard now uses bundled user, subreddit, votes, and commentCount
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
                if (subredditName !== "unknown") {
                  navigate(subredditUrl);
                }
              }}
            >
              {subredditName !== "unknown" ? `r/${subredditName}` : ""}
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

export default Home;