import Loading from './Loading';

import React, { useState, useEffect} from 'react';
import { TiArrowDownOutline, TiArrowUpOutline } from "react-icons/ti";
import { fetchFromAPI } from '../../api/auth';
import { fetchFromAPIWithoutAuth } from '../../api/noAuth';
import { useNavigate } from 'react-router-dom';

import '../styles/home.css';
import '../styles/main.css';

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

const Home = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [allSubreddits, setAllSubreddits] = useState<Subreddit[]>([]);
  const [joinedSubreddits, setJoinedSubreddits] = useState<Subreddit[]>([]);
  const [filteredSubreddits, setFilteredSubreddits] = useState<Subreddit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User>();
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [users, setUsers] = useState<Map<string, User>>(new Map());
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          setIsLoggedIn(true);
          const userResponse = await fetchFromAPI('/me', 'GET');
          setUser({ user_id: userResponse.user_id, username: userResponse.username, profilePic: userResponse.profile_pic });
          
          const subredditsResponse = await fetchFromAPI('/users/subreddits', 'GET');
          setJoinedSubreddits(subredditsResponse);
        }

        const postsResponse = await fetchFromAPIWithoutAuth('/posts', 'GET');
        setPosts(postsResponse);
        setSearchResults(postsResponse);

        const allSubredditsResponse = await fetchFromAPIWithoutAuth('/subreddits', 'GET');
        console.log('Fetched Subreddits:', allSubredditsResponse);

        if (Array.isArray(allSubredditsResponse)) {
          setAllSubreddits(allSubredditsResponse);
        } else {
          console.error('Invalid data format:', allSubredditsResponse);
        }

        const usersResponse = await fetchFromAPIWithoutAuth('/user/all', 'GET');
        const userMap = new Map();
        usersResponse.forEach((user: User) => {
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

  const handleSearch = () => {
    const trimmedQuery = query.trim().toLowerCase();

    if (trimmedQuery === '') {
      setSearchResults(posts);
      setFilteredSubreddits(allSubreddits);
      return;
    }

    const filteredPosts = posts.filter((post) =>
      post.title.toLowerCase().includes(trimmedQuery)
    );

    const filteredSubreddits = allSubreddits.filter((subreddit) =>
      subreddit.name.toLowerCase().includes(trimmedQuery)
    );

    setSearchResults(filteredPosts);
    setFilteredSubreddits(filteredSubreddits);
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
      {/* Main content */}
      <div className="main-content">

        {/* Feed */}
        <div className="feed">
          {/* Display matching communities */}
          {filteredSubreddits.length > 0 && (
            <>
              {filteredSubreddits.map((subreddit) => (
                <SubredditCard key={subreddit.subreddit_id} subreddit={subreddit} users={users} />
              ))}
            </>
          )}

          {/* Display matching posts */}
          {searchResults.length > 0 && (
            <>
              {searchResults.map((post) => (
                <PostCard key={post.post_id} post={post} users={users} current_user={user ?? { user_id: '', username: '', profilePic: '' }} />
              ))}
            </>
          )}

          {/* No results message */}
          {query && filteredSubreddits.length === 0 && searchResults.length === 0 && (
            <p className="text-gray-500">No results found for "{query}".</p>
          )}

          {/* Default posts when no query */}
          {!query && searchResults.length === 0 && (
            posts.map((post) => (
              <PostCard key={post.post_id} post={post} users={users} current_user={user ?? { user_id: '', username: '', profilePic: '' }} />
            ))
          )}
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

const SubredditCard = ({ subreddit, users }: { subreddit: Subreddit; users: Map<string, User> }) => {
  console.log("Subreddit data:", subreddit);
  const owner = users.get(subreddit.user_id)?.username;
  const createdAt = new Date(subreddit.created_at).toLocaleString();

  return (
    <div className="post-card">
      <a href={`/r/${subreddit.name}`} className="post-link">
        <div className="post-content">
          <div className="post-header">
            <span className="username">u/{owner}</span>
            <span className="timestamp">{createdAt}</span>
          </div>
          <h3>r/{subreddit.name}</h3>
          <p>{subreddit.description}</p>
        </div>
      </a>
    </div>
  );
};


const PostCard = ({ post, users, current_user }: { post: Post; users: Map<string, User>; current_user: User }) => {
  const [voteCount, setVoteCount] = useState<{ upvotes: number; downvotes: number, score: number }>({ upvotes: 0, downvotes: 0, score: 0 });
  const [commentCount, setCommentCount] = useState<number>(0);
  const [userVote, setUserVote] = useState<null | 'upvote' | 'downvote'>(null);
  const [voteId, setVoteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCommentCount();
    fetchVoteCount();

    const token = localStorage.getItem('token');
    if (token) {
      fetchFromAPI(`/posts/${post.post_id}/votes`, 'GET')
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            let voteUser = null;
            for (const vote of data) {
              if (vote.user_id == current_user.user_id) {
                voteUser = vote;
                break;
              }
            }
            setUserVote(voteUser.vote_type ? 'upvote' : 'downvote');
            setVoteId(voteUser.vote_id || null);
          }
        })
        .catch(error => {
          console.error('Error fetching user vote:', error);
        })
        .finally(() => setIsLoading(false));
    }
  }, [post.post_id]);

  const fetchVoteCount = () => {
    fetchFromAPIWithoutAuth(`/posts/${post.post_id}/votes/count`, 'GET')
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
    fetchFromAPIWithoutAuth(`/posts/${post.post_id}/comments/count`, 'GET')
      .then((data) => setCommentCount(data.commentCount))
      .catch((error) => console.error('Error fetching comment count:', error));
  };

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

      fetchVoteCount();
      setUserVote(type);
      setVoteId(data.vote.vote_id || null);
    } catch (error) {
      console.error('Error voting:', error);
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
      await fetchFromAPI(`/votes/${voteId}`, 'DELETE');

      fetchVoteCount();
      setUserVote(null);
      setVoteId(null);
      console.log('Vote successfully deleted');
    } catch (error) {
      if (error instanceof Error && error.message.includes('JSON')) {
        fetchVoteCount();
        setUserVote(null);
        setVoteId(null);
        console.log('Vote successfully deleted (empty response)');
      } else {
        console.error('Error canceling vote:', error);
      }
    }
  };

  return (
    <div className="post-card">
      {/* Upper part: clickable area */}
      <a href={`/post/${post.post_id}`} className="post-link">
        <div className="post-content">
          <div className="post-header">
            <a href={"http://localhost:5173/u/" + users.get(post.user_id)?.username} className="username">u/{users.get(post.user_id)?.username || "Unknown User"}</a>
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
              e.stopPropagation();
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
              e.stopPropagation();
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

export default Home;
