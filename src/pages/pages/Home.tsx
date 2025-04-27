import React, { useState, useEffect } from 'react';
import '../styles/home.css';
import '../styles/main.css';

interface Post {
  post_id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
}

export interface Subreddit {
  subreddit_id: string;
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

const Home = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [joinedSubreddits, setJoinedSubreddits] = useState<Subreddit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ username: string; profilePic: string } | null>(null);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [users, setUsers] = useState<Map<string, User>>(new Map());

  // Inside the Home component
  useEffect(() => {
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
          setUser({ username: data.username, profilePic: data.profilePic });
        })
        .catch((error) => console.error('Error fetching user data:', error));
    }

    fetch('http://localhost:5000/api/posts')
      .then(response => response.json())
      .then(data => setPosts(data))
      .catch((error) => setError('Error fetching posts'));

    fetch('http://localhost:5000/api/users/subreddits', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      }
    })
      .then(response => response.json())
      .then(data => {
        setJoinedSubreddits(data);
      })
      .catch((error) => console.error('Error fetching joined communities:', error));

    fetch('http://localhost:5000/api/user/all')
      .then(response => response.json())
      .then((data) => {
        const userMap = new Map();
        data.forEach((user: User) => {
          userMap.set(user.user_id, user);
        });
        setUsers(userMap);
      })
      .catch((error) => console.error('Error fetching users:', error));
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

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="home-wrapper">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-left">
          <div className="logo">MiniRed</div>
        </div>
        <div className="navbar-center">
          <input className="search-input" type="text" placeholder="Search Reddit" />
        </div>
        <div className="navbar-right">
          {isLoggedIn ? (
            <>
              <button className="create-post-btn" onClick={handleCreatePost}>Create Post</button>
              <div className="profile-menu">
                <img
                  src={user?.profilePic || "/default-profile.png"}
                  className="profile-pic"
                  onClick={toggleDropdown}
                  alt={user?.username}
                />
                {isDropdownOpen && (
                  <div className="dropdown-menu">
                    <a href="/profile">Profile</a>
                    <a href="/edit">Edit</a>
                    <a onClick={handleLogout}>Logout</a>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button className="create-post-btn" onClick={handleCreatePost}>Create Post</button>
              <a className="nav-link" href="/login">Login</a>
              <a className="nav-link" href="/register">Register</a>
            </>
          )}
        </div>
      </nav>

      {/* Main content */}
      <div className="main-content">
        {/* Left Sidebar */}
        <div className="left-sidebar">
          <h2>Navigation</h2>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/popular">Popular</a></li>
          </ul>
        </div>

        {/* Feed */}
        <div className="feed">
          {posts.map((post) => (
            <PostCard key={post.post_id} post={post} users={users} />
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
  const [voteCount, setVoteCount] = useState<{ upvotes: number; downvotes: number }>({ upvotes: 0, downvotes: 0 });
  const [commentCount, setCommentCount] = useState<number>(0);
  const [userVote, setUserVote] = useState<null | 'upvote' | 'downvote'>(null);

  useEffect(() => {
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
          if (data.vote === 'upvote' || data.vote === 'downvote') {
            setUserVote(data.vote);
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
        });
      })
      .catch((error) => console.error('Error fetching vote count:', error));
  };

  const fetchCommentCount = () => {
    fetch(`http://localhost:5000/api/posts/${post.post_id}/comments/count`)
      .then((response) => response.json())
      .then((data: CommentCount) => setCommentCount(data.count))
      .catch((error) => console.error('Error fetching comment count:', error));
  };

  const handleVote = async (type: 'upvote' | 'downvote') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to vote.');
        return;
      }

      const voteType = type === 'upvote' ? true : false;

      const response = await fetch(`http://localhost:5000/api/posts/${post.post_id}/votes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ vote_type: voteType }),
      });

      if (response.ok) {
        fetchVoteCount(); // Refresh vote counts
        setUserVote(type); // Set the user vote locally
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to vote.');
      }
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  return (
    <div className="post-card">
      <div className="post-header">
        <span className="username">{users.get(post.user_id)?.username || "Unknown User"}</span>
        <span className="timestamp">{new Date(post.created_at).toLocaleString()}</span>
      </div>

      <a href={`/post/${post.post_id}`} className="post-link">
        <h2>{post.title}</h2>
        <p>{post.content}</p>
      </a>

      <div className="post-footer">
        <div className="vote-section">
          <button
            className={`vote-button ${userVote === 'upvote' ? 'upvoted' : ''}`}
            onClick={() => handleVote('upvote')}
          >
            ↑
          </button>

          {/* Display total upvotes */}
          <span className="vote-count">{voteCount.upvotes}</span>

          <button
            className={`vote-button ${userVote === 'downvote' ? 'downvoted' : ''}`}
            onClick={() => handleVote('downvote')}
          >
            ↓
          </button>

          {/* Display total downvotes */}
          <span className="vote-count">{voteCount.downvotes}</span>
        </div>

        <div className="comment-count">
          <span>{commentCount}</span> <span>Comments</span>
        </div>
      </div>
    </div>
  );
};



export default Home;
