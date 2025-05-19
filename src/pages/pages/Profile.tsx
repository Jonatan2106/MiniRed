import React, { useState, useEffect } from 'react';
import { FaHome, FaCompass, FaFire } from 'react-icons/fa';
import { AiOutlinePlusCircle } from "react-icons/ai";
import Loading from './Loading';
import '../styles/profile.css';
import '../styles/main.css';

interface Post {
  post_id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
}

interface Comment {
  comment_id: string;
  post_id: string;
  post: Post;
  user_id: string;
  content: string;
  created_at: string;
}

interface Subreddit {
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

interface Vote {
  vote_id: string;
  user_id: string;
  kategori_id: string;
  kategori_type: "POST" | "COMMENT"; // Specifies whether the vote is for a post or a comment
  vote_type: boolean; // true for upvote, false for downvote
  created_at: string;
  post?: Post; // Optional, included if the vote is for a post
  comment?: Comment; // Optional, included if the vote is for a comment
}

interface OverviewItem {
  type: 'post' | 'comment' | 'upvoted' | 'downvoted';
  created_at: string;
  post_id?: string; // For posts and comments
  title?: string; // For posts
  content?: string; // For comments
  post?: Post; // For comments, upvoted, and downvoted items
  kategori_type?: 'POST' | 'COMMENT'; // For upvoted and downvoted items
}

const Profile = () => {
  const [users, setUsers] = useState<Map<string, User>>(new Map());
  const [user, setUser] = useState<{ username: string; profilePic: string; user_id?: string } | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [joinedSubreddits, setJoinedSubreddits] = useState<Subreddit[]>([]);
  const [activeTab, setActiveTab] = useState('Overview');
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [Downvoted, setDownVotes] = useState<Vote[]>([]);
  const [upvoted, setUpVotes] = useState<Vote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [postKarma, setPostKarma] = useState<number>(0);
  const [commentKarma, setCommentKarma] = useState<number>(0);
  const [openMenuPostId, setOpenMenuPostId] = useState<string | null>(null);

  const calculatePostKarma = (posts: Post[], userId: string): number => {
    return posts.filter((post) => post.user_id === userId).length;
  };

  const calculateCommentKarma = (comments: Comment[], userId: string): number => {
    return comments.filter((comment) => comment.user_id === userId).length;
  };

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
          setUser({ username: data.username, profilePic: data.profile_pic, user_id: data.user_id });
          const calculatedPostKarma = calculatePostKarma(posts, data.user_id);
          const calculatedCommentKarma = calculateCommentKarma(comments, data.user_id);
          setPostKarma(calculatedPostKarma);
          setCommentKarma(calculatedCommentKarma);
        })
        .catch((error) => console.error('Error fetching user data:', error));
    }

    fetch('http://localhost:5000/api/user/me/posts', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      }
    })
      .then(response => response.json())
      .then(data => setPosts(data))
      .catch(() => console.error('Error fetching posts'));

    fetch('http://localhost:5000/api/user/me/comments', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then(async (commentsData) => {
        // Fetch posts for each comment
        const commentsWithPosts = await Promise.all(
          commentsData.map(async (comment: Comment) => {
            const postResponse = await fetch(`http://localhost:5000/api/posts/${comment.post_id}`, {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            const post = await postResponse.json();
            return { ...comment, post }; // Merge post into comment
          })
        );
        setComments(commentsWithPosts);
      })
      .catch(() => console.error('Error fetching comments'));

    fetch('http://localhost:5000/api/users/subreddits', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      }
    })
      .then(response => response.json())
      .then(data => setJoinedSubreddits(data))
      .catch(() => console.error('Error fetching joined communities'));

    setIsLoading(false);
  }, []);

  // Fetch upvoted and downvoted votes in a separate effect
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('http://localhost:5000/api/user/me/upvoted', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      }
    })
      .then(response => response.json())
      .then(data => setUpVotes(data))
      .catch(() => console.error('Error fetching upvoted posts'));

    fetch('http://localhost:5000/api/user/me/downvoted', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      }
    })
      .then(response => response.json())
      .then(data => setDownVotes(data))
      .catch(() => console.error('Error fetching downvoted posts'));
  }, []);

  useEffect(() => {
    if (user && user.user_id) {
      setPostKarma(calculatePostKarma(posts, user.user_id));
      setCommentKarma(calculateCommentKarma(comments, user.user_id));
    }
  }, [posts, comments, user]);

  const handleTabClick = (tab: 'Overview' | 'Posts' | 'Comments' | 'Upvoted' | 'Downvoted'): void => {
    setActiveTab(tab);
  };

  const getOverviewData = (): OverviewItem[] => {
    const combinedData: OverviewItem[] = [
      ...posts.map((post) => ({ ...post, type: 'post' as 'post' })),
      ...comments.map((comment) => ({ ...comment, type: 'comment' as 'comment' })),
      ...upvoted.map((vote) => ({ ...vote, type: 'upvoted' as 'upvoted' })),
      ...Downvoted.map((vote) => ({ ...vote, type: 'downvoted' as 'downvoted' })),
    ];

    return combinedData.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  };

  const handleCreatePost = () => {
    window.location.href = '/create-post';
  };

  const handleCreateSubreddit = () => {
    window.location.href = '/create-subreddit';
  };

  // ...existing code...

  const handleDeletePost = async (postId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/posts/:id`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Hapus post dari state
        setPosts((prev) => prev.filter((post) => post.post_id !== postId));
        // Hapus semua comment yang terkait post ini dari state
        setComments((prev) => prev.filter((comment) => comment.post_id !== postId));
        alert('Post deleted successfully!');
      } else {
        alert('Failed to delete post.');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Error deleting post.');
    }
  };
  // ...existing code...

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    window.location.href = '/';
  };

  const toggleDropdown = () => {
    setDropdownOpen((prev) => !prev);
  };

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

        <div className="navbar-right">
          {isLoggedIn ? (
            <>
              <button className="create-post-btn" onClick={handleCreatePost}><AiOutlinePlusCircle className="icon" />Create Post</button>
              <div className="profile-menu">
                <img
                  src={user?.profilePic ? "http://localhost:5173" + user?.profilePic : "/default.png"}
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
        <div className="left-sidebar home">
          <h2 className="title">Navigation</h2>
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
          <h2 className="title">Communities</h2>
          <ul>
            <li>
              <AiOutlinePlusCircle className="icon" />
              <a href="/create-subreddit">Create a subreddit</a>
            </li>
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

        {/* Feed */}
        <div className="feed">
          <div className="profile-header">
            <div className="profile-avatar">
              <img
                src={
                  user?.profilePic ? "http://localhost:5173" + user?.profilePic : "/default.png"
                }
                alt={user?.username}
                className="avatar"
              />
            </div>
            <div className="profile-info">
              <h1 className="username">{user?.username || "Loading..."}</h1>
              <p className="user-handle">u/{user?.username}</p>
            </div>
          </div>

          {/* Profile Stats */}
          <div className="profile-stats">
            <div className="profile-stat-item">
              <h3>{postKarma}</h3>
              <p>Total Post</p>
            </div>
            <div className="profile-stat-item">
              <h3>{commentKarma}</h3>
              <p>Total Comment</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="profile-tabs">
            <button
              className={`tab ${activeTab === 'Overview' ? 'active' : ''}`}
              onClick={() => handleTabClick('Overview')}
            >
              Overview
            </button>
            <button
              className={`tab ${activeTab === 'Posts' ? 'active' : ''}`}
              onClick={() => handleTabClick('Posts')}
            >
              Posts
            </button>
            <button
              className={`tab ${activeTab === 'Comments' ? 'active' : ''}`}
              onClick={() => handleTabClick('Comments')}
            >
              Comments
            </button>
            <button
              className={`tab ${activeTab === 'Upvoted' ? 'active' : ''}`}
              onClick={() => handleTabClick('Upvoted')}
            >
              Upvoted
            </button>
            <button
              className={`tab ${activeTab === 'Downvoted' ? 'active' : ''}`}
              onClick={() => handleTabClick('Downvoted')}
            >
              Downvoted
            </button>
          </div>

          {/* Profile Content */}
          <div className="profile-content">
            {activeTab === 'Overview' && (
              <div>
                {getOverviewData().length > 0 ? (
                  getOverviewData().map((item, index) => (
                    <div
                      key={index}
                      className={`overview-item ${item.type}-item`}
                      onClick={() => {
                        if (item.type === 'post') {
                          window.location.href = `/post/${item.post_id}`;
                        } else if (item.type === 'comment') {
                          window.location.href = `/post/${item.post_id}`;
                        } else if (item.type === 'upvoted' && item.kategori_type === 'POST' && item.post) {
                          window.location.href = `/post/${item.post.post_id}`;
                        } else if (item.type === 'downvoted' && item.kategori_type === 'POST' && item.post) {
                          window.location.href = `/post/${item.post.post_id}`;
                        }
                      }}
                    >

                      {item.type === 'post' && (
                        <>
                          <p>
                            Post Title: <span className="font-semibold">{item.title}</span>
                          </p>
                          <p>{item.content}</p>
                        </>
                      )}
                      {item.type === 'comment' && (
                        <>
                          {/* <h2>Recent Commen</h2> */}
                          <p>
                            Commented: <span className="font-semibold">{item.content}</span>
                          </p>
                          <p>
                            On Post: <span className="font-semibold">{item.post?.content}</span>
                          </p>
                        </>
                      )}
                      {item.type === 'upvoted' && item.kategori_type === 'POST' && item.post && (
                        <p>
                          Upvoted on Post: <span className="font-semibold">{item.post.title}</span>
                        </p>
                      )}
                      {item.type === 'downvoted' && item.kategori_type === 'POST' && item.post && (
                        <p>
                          Downvoted on Post: <span className="font-semibold">{item.post.title}</span>
                        </p>
                      )}
                      <p className="text-sm">
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No activity available.</p>
                )}
              </div>
            )}
            {activeTab === 'Posts' && (
              <div>
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <div
                      key={post.post_id}
                      className="post-item"
                      onClick={() => {
                        window.location.href = `/post/${post.post_id}`;
                      }}
                      style={{ position: 'relative' }}
                    >
                      <p>
                        Post Title: <span className="font-semibold">{post.title}</span>
                      </p>
                      <p>{post.content}</p>
                      <p className="text-sm">
                        Posted on {new Date(post.created_at).toLocaleString()}
                      </p>
                      {/* Kebab Menu */}
                      {user?.user_id === post.user_id && (
                        <div
                          className="kebab-menu"
                          onMouseEnter={() => setOpenMenuPostId(post.post_id)}
                          onMouseLeave={() => setOpenMenuPostId(null)}
                          onClick={e => e.stopPropagation()}
                        >
                          <button>⋮</button>
                          {openMenuPostId === post.post_id && (
                            <div className="menu-options">
                              <button onClick={() => handleDeletePost(post.post_id)}> Edit </button>
                              <button onClick={() => handleDeletePost(post.post_id)}> Delete </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No posts available.</p>
                )}
              </div>
            )}


            {activeTab === 'Comments' && (
              <div>
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <div
                      key={comment.comment_id}
                      className="comment-item"
                      onClick={() => {
                        window.location.href = `/post/${comment.post_id}`;
                      }}
                    >
                      <p>Commented : {comment.content}</p>
                      <p>
                        On <span className="font-semibold">Post: {comment.post?.content}</span>
                      </p>
                      <p className="text-sm">
                        {new Date(comment.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p>No comments available.</p>
                )}
              </div>
            )}

            {activeTab === 'Upvoted' && (
              <div>
                {upvoted.length > 0 ? (
                  upvoted.map((vote) => (
                    <div
                      key={vote.vote_id}
                      className="vote-item"
                      onClick={() => {
                        if (vote.kategori_type === "POST" && vote.post) {
                          window.location.href = `/post/${vote.post.post_id}`;
                        } else if (vote.kategori_type === "COMMENT" && vote.comment) {
                          window.location.href = `/post/${vote.comment.post_id}`;
                        }
                      }}
                    >
                      {vote.kategori_type === "POST" && vote.post ? (
                        <p>
                          Upvoted on <span className="font-semibold">Post: {vote.post.title}</span>
                        </p>
                      ) : vote.kategori_type === "COMMENT" && vote.comment ? (
                        <p>
                          Upvoted on <span className="font-semibold">Comment: {vote.comment.content}</span>
                        </p>
                      ) : null}
                      <p className="text-sm">
                        {new Date(vote.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p>No upvoted items yet.</p>
                )}
              </div>
            )}

            {activeTab === 'Downvoted' && (
              <div>
                {Downvoted.length > 0 ? (
                  Downvoted.map((vote) => (
                    <div
                      key={vote.vote_id}
                      className="vote-item"
                      onClick={() => {
                        if (vote.kategori_type === "POST" && vote.post) {
                          window.location.href = `/post/${vote.post.post_id}`;
                        } else if (vote.kategori_type === "COMMENT" && vote.comment) {
                          window.location.href = `/post/${vote.comment.post_id}`;
                        }
                      }}
                    >
                      {vote.kategori_type === "POST" && vote.post ? (
                        <p>
                          Downvoted on <span className="font-semibold">Post: {vote.post.title}</span>
                        </p>
                      ) : vote.kategori_type === "COMMENT" && vote.comment ? (
                        <p>
                          Downvoted on <span className="font-semibold">Comment: {vote.comment.content}</span>
                        </p>
                      ) : null}
                      <p className="text-sm">
                        {new Date(vote.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p>No downvoted items yet.</p>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Right Sidebar */}
      </div>
    </div>
  );
};

export default Profile;
