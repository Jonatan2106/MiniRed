import React, { useState, useEffect, use } from 'react';
import { FaHome, FaCompass, FaFire } from 'react-icons/fa';
import { TiArrowDownOutline, TiArrowUpOutline } from "react-icons/ti";
import { AiOutlinePlusCircle } from "react-icons/ai";
import '../styles/home.css';
import '../styles/main.css';
import Loading from './Loading';

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
  const [joinedSubreddits, setJoinedSubreddits] = useState<Subreddit[]>([]);
  const [allSubreddits, setAllSubreddits] = useState<Subreddit[]>([]);
  const [filteredSubreddits, setFilteredSubreddits] = useState<Subreddit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User>();
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [users, setUsers] = useState<Map<string, User>>(new Map());
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Inside the Home component
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
          setUser({ user_id: userData.user_id, username: userData.username, profilePic: userData.profile_pic });
        }

        const postsResponse = await fetch('http://localhost:5000/api/posts');
        const postsData = await postsResponse.json();
        setPosts(postsData);
        setSearchResults(postsData);


        const allSubredditsResponse = await fetch('http://localhost:5000/api/subreddits', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        const allSubredditsData = await allSubredditsResponse.json();
        console.log('Fetched Subreddits:', allSubredditsData);

        if (Array.isArray(allSubredditsData)) {
          setAllSubreddits(allSubredditsData); // Set all subreddits for filtering
        } else {
          console.error('Invalid data format:', allSubredditsData);
        }

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
        setIsLoading(false); // Ensure loading is stopped in all cases
      }
    };

    fetchData();
  }, []); // Fetch data on component mount and when allSubreddits or posts change

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
    window.location.href = '/create-post';
  };

  const handleSearch = () => {
    const trimmedQuery = query.trim().toLowerCase();

    if (trimmedQuery === '') {
      // Reset to show all posts and subreddits if the query is empty
      setSearchResults(posts);
      setFilteredSubreddits(allSubreddits);
      return;
    }

    // Filter posts based on the query matching the title
    const filteredPosts = posts.filter((post) =>
      post.title.toLowerCase().includes(trimmedQuery)
    );

    // Filter subreddits based on the query matching the name
    const filteredSubreddits = allSubreddits.filter((subreddit) =>
      subreddit.name.toLowerCase().includes(trimmedQuery)
    );

    setSearchResults(filteredPosts);
    setFilteredSubreddits(filteredSubreddits);
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
    return <Loading />; // Show loading screen
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
          <input
            className="search-input"
            type="text"
            placeholder="Search Reddit"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="search-button" onClick={handleSearch}>
            Search
          </button>
          {query && (
            <button
              className="clear-button"
              onClick={() => {
                setQuery('');
                setSearchResults(posts);
                setFilteredSubreddits(allSubreddits);
              }}
            >
              Clear
            </button>
          )}
        </div>
        <div className="navbar-right">
          {isLoggedIn ? (
            <>
              <button className="create-post-btn" onClick={handleCreatePost}><AiOutlinePlusCircle className="icon" />Create Post</button>
              <div className="profile-menu">
                <img
                  src={user?.profilePic ? "http://localhost:5173"+user?.profilePic : "/default.png"}
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

            <>
              <div className="auth-buttons">
                <a className="nav-link login-button" href="/login">Login</a>
                <a className="nav-link register-button" href="/register">Register</a>
              </div>
            </>
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
              <FaHome className="icon" /> {/* Home icon */}
              <a href="/">Home</a>
            </li>
            <li>
              <FaCompass className="icon" /> {/* Explore icon */}
              
              <a href="/explore">Explore</a>
            </li>
            <li>
              <FaFire className="icon" /> {/* Popular icon */}
              <a href="/popular">Popular</a>
            </li>
          </ul>
        </div>

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
        .finally(() => setIsLoading(false)); // Stop loading after fetching user vote
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
        window.location.href = '/login';
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
        window.location.href = '/login';  
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
