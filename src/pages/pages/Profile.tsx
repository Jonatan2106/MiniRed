import React, { useState, useEffect } from 'react';
import { fetchFromAPI } from '../../api/auth';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaUser, FaEdit, FaTrash, FaArrowUp, FaArrowDown, FaCommentAlt, FaEllipsisH } from 'react-icons/fa';
import Loading from './Loading';
import Navbar from '../component/Navbar';  // Import Navbar component

import '../styles/profile.css';
import '../styles/main.css';
import LeftSidebar from '../component/LeftSidebar';

interface Post {
  post_id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  votes?: Vote[]; // Add votes for karma calculation
}

interface Comment {
  comment_id: string;
  post_id: string;
  post?: Post;
  user_id: string;
  content: string;
  created_at: string;
  votes?: Vote[]; // Add votes for karma calculation
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
  kategori_type: "POST" | "COMMENT";
  vote_type: boolean;
  created_at: string;
  post?: Post;
  comment?: Comment;
}

interface OverviewItem {
  user_id: string;

  type: 'post' | 'comment' | 'upvoted' | 'downvoted';
  created_at: string;
  post_id?: string;
  title?: string;
  content?: string;
  post?: Post;
  kategori_type?: 'POST' | 'COMMENT';
  comment?: Comment;
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
  const navigate = useNavigate();
  const [isEditPostModalOpen, setIsEditPostModalOpen] = useState(false);
  const [currentEditingPost, setCurrentEditingPost] = useState<Post | null>(null);
  const [editPostContent, setEditPostContent] = useState('');
  const [editPostTitle, setEditPostTitle] = useState('');
  const [editModalError, setEditModalError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>(''); // For search functionality


  const calculatePostKarma = (posts: Post[]): number => {
    return posts.length;
  };


  const calculateCommentKarma = (comments: Comment[]): number => {
    return comments.length;
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      fetchFromAPI('/me', 'GET')
        .then((data) => {
          // Defensive: ensure all fields are arrays
          const postsArr = Array.isArray(data.posts) ? data.posts : [];
          const commentsArr = Array.isArray(data.comments) ? data.comments : [];
          const upvotedArr = Array.isArray(data.upvoted) ? data.upvoted : [];
          const downvotedArr = Array.isArray(data.downvoted) ? data.downvoted : [];
          const joinedSubsArr = Array.isArray(data.joinedSubreddits) ? data.joinedSubreddits : [];

          setUser({ username: data.username, profilePic: data.profile_pic, user_id: data.user_id });
          setPosts(postsArr);
          setComments(commentsArr);
          setUpVotes(upvotedArr);
          setDownVotes(downvotedArr);
          setJoinedSubreddits(joinedSubsArr.map((member: any) => member.subreddit || member).filter((sub: any) => !!sub));

          setPostKarma(calculatePostKarma(postsArr));
          setCommentKarma(calculateCommentKarma(commentsArr));
          setIsLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching user data:', error);
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      setPostKarma(calculatePostKarma(posts));
      setCommentKarma(calculateCommentKarma(comments));
    }
  }, [posts, comments, user]);

  const handleTabClick = (tab: 'Overview' | 'Posts' | 'Comments' | 'Upvoted' | 'Downvoted'): void => {
    setActiveTab(tab);
  };

  const getOverviewData = (): OverviewItem[] => {
    const combinedData: OverviewItem[] = [
      ...posts.map((post) => ({ ...post, type: 'post' as 'post' })),
      ...comments.map((comment) => ({ ...comment, type: 'comment' as 'comment' })),
      ...upvoted.map((vote) => ({ ...vote, type: 'upvoted' as 'upvoted', comment: vote.comment })),
      ...Downvoted.map((vote) => ({ ...vote, type: 'downvoted' as 'downvoted', comment: vote.comment })),
    ];
    return combinedData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  const handleDeletePost = async (postId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      await fetchFromAPI(`/posts/${postId}`, 'DELETE');

      setPosts((prev) => prev.filter((post) => post.post_id !== postId));

      setComments((prev) => prev.filter((comment) => comment.post_id !== postId));

      alert('Post deleted successfully!');
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Error deleting post.');
    }
  };

  const handleOpenEditModal = (post: Post) => {
    setCurrentEditingPost(post);
    setEditPostTitle(post.title);
    setEditPostContent(post.content);
    setEditModalError(null);
    setIsEditPostModalOpen(true);
  };

  const handleUpdatePost = async () => {
    try {
      if (!currentEditingPost) return;

      const token = localStorage.getItem('token');
      if (!token) {
        setEditModalError("You must be logged in to update your post.");
        return;
      }

      if (!editPostContent.trim()) {
        setEditModalError("Post content cannot be empty.");
        return;
      }

      const updateData = {
        title: editPostTitle,
        content: editPostContent
      };

      const response = await fetchFromAPI(`/posts/${currentEditingPost.post_id}`, 'PUT', updateData);

      setPosts(prev =>
        prev.map(post =>
          post.post_id === currentEditingPost.post_id
            ? { ...post, content: editPostContent }
            : post
        )
      );

      setIsEditPostModalOpen(false);
      setCurrentEditingPost(null);

      alert('Post updated successfully!');

    } catch (err: any) {
      console.error("Error updating post:", err.message);
      setEditModalError(err.message || "Failed to update post");
    }
  };

  // Navbar related handlers
  const toggleDropdown = () => {
    setDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    navigate('/login');
  };

  const handleCreatePost = () => {
    navigate('/create-post');
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="profile-page-container">
      {/* Add Navbar component */}
      <Navbar
        isLoggedIn={isLoggedIn}
        user={user}
        shouldHideSearch={false}
        shouldHideCreate={false}
        query={searchQuery}
        setQuery={setSearchQuery}
        isDropdownOpen={isDropdownOpen}
        toggleDropdown={toggleDropdown}
        handleLogout={handleLogout}
        handleCreatePost={handleCreatePost}
        handleSearch={handleSearch}
      />

      {/* FLEX CONTAINER FOR SIDEBAR + MAIN */}
      <div className="profile-flex-layout">
        {/* Sidebar */}
        <div className="left-sidebar profile-page">
          <LeftSidebar
            isProfilePage={true}
            joinedSubreddits={joinedSubreddits}
          />
        </div>

        {/* Main Content */}
        <div className="profile-content-wrapper">
          {/* Profile Header Card */}
          <div className="profile-card">
            <div className="profile-header">
              <div className="profile-avatar">
                <img
                  src={user?.profilePic ? "http://localhost:5173" + user?.profilePic : "/default.png"}
                  alt={user?.username}
                  className="avatar"
                />
              </div>
              <div className="profile-info">
                <h1 className="username">{user?.username || "Loading..."}</h1>
                <p className="user-handle">u/{user?.username}</p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="profile-stats-container">
              <div className="profile-stats">
                <div className="profile-stat-item">
                  <div className="stat-icon"><FaUser /></div>
                  <h3>{postKarma}</h3>
                  <p>Posts</p>
                </div>
                <div className="profile-stat-item">
                  <div className="stat-icon"><FaCommentAlt /></div>
                  <h3>{commentKarma}</h3>
                  <p>Comments</p>
                </div>
                <div className="profile-stat-item">
                  <div className="stat-icon"><FaArrowUp /></div>
                  <h3>{upvoted.length}</h3>
                  <p>Upvotes</p>
                </div>
                <div className="profile-stat-item">
                  <div className="stat-icon"><FaArrowDown /></div>
                  <h3>{Downvoted.length}</h3>
                  <p>Downvotes</p>
                </div>
              </div>
            </div>

            {/* Activity Navigation Tabs */}
            <div className="profile-tabs-container">
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
            </div>
          </div>

          {/* Content Sections */}
          <div className="profile-tab-content">
            {/* Overview Tab Content */}
            {activeTab === 'Overview' && (
              <div className="content-section">
                <h2 className="section-title">Activity Overview</h2>
                {getOverviewData().length > 0 ? (
                  getOverviewData().map((item, index) => {
                    // Determine post context for navigation and display
                    let postContext = null;
                    if (item.type === 'upvoted' || item.type === 'downvoted') {
                      if (item.kategori_type === 'POST' && item.post) {
                        postContext = item.post;
                      } else if (item.kategori_type === 'COMMENT' && item.comment) {
                        postContext = item.comment.post || null;
                      }
                    } else if (item.type === 'comment') {
                      postContext = item.post || null;
                    }
                    return (
                      <div
                        key={index}
                        className={`overview-item ${item.type}-item`}
                        onClick={() => {
                          if (item.type === 'post') {
                            navigate(`/post/${item.post_id}`);
                          } else if (item.type === 'comment') {
                            navigate(`/post/${item.post_id}`);
                          } else if ((item.type === 'upvoted' || item.type === 'downvoted') && postContext) {
                            navigate(`/post/${postContext.post_id}`);
                          }
                        }}
                      >
                        <div className="item-type-indicator">
                          {item.type === 'post' && <FaUser className="indicator-icon post-icon" />}
                          {item.type === 'comment' && <FaCommentAlt className="indicator-icon comment-icon" />}
                          {item.type === 'upvoted' && <FaArrowUp className="indicator-icon upvote-icon" />}
                          {item.type === 'downvoted' && <FaArrowDown className="indicator-icon downvote-icon" />}
                        </div>

                        <div className="item-content">
                          {item.type === 'post' && (
                            <>
                              <div className="item-header">
                                <h3 className="item-title">{item.title}</h3>

                                {/* Add edit and delete buttons for posts in Overview */}
                                {item.type === 'post' && user?.user_id && String(user.user_id) === String(item.user_id) && (
                                  <div
                                    className="post-actions"
                                    onClick={e => e.stopPropagation()}
                                  >
                                    {/* Buttons */}
                                  </div>
                                )}
                              </div>
                              <p className="item-body">{item.content}</p>
                            </>
                          )}
                          {item.type === 'comment' && (
                            <>
                              <p className="item-body">
                                <span className="action-label">Commented:</span> {item.content}
                              </p>
                              <p className="item-context">
                                on post: <span className="context-highlight">{item.post?.content}</span>
                              </p>
                            </>
                          )}
                          {(item.type === 'upvoted' || item.type === 'downvoted') && item.kategori_type === 'POST' && item.post && (
                            <>
                              <p className="item-body">
                                <span className="action-label">{item.type === 'upvoted' ? 'Upvoted' : 'Downvoted'} Post:</span> {item.post.title}
                              </p>
                            </>
                          )}
                          {(item.type === 'upvoted' || item.type === 'downvoted') && item.kategori_type === 'COMMENT' && item.comment && (
                            <>
                              <p className="item-body">
                                <span className="action-label">{item.type === 'upvoted' ? 'Upvoted Comment:' : 'Downvoted Comment:'}</span> {item.comment.content}
                              </p>
                              <p className="item-context">
                                on post: <span className="context-highlight">{item.comment.post?.title || item.comment.post?.content}</span>
                              </p>
                            </>
                          )}
                          <p className="activity-date">
                            {new Date(item.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <p>No activity yet. Start posting or interacting with content!</p>
                  </div>
                )}
              </div>
            )}

            {/* Posts Tab Content */}
            {activeTab === 'Posts' && (
              <div className="content-section">
                <h2 className="section-title">Your Posts</h2>
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <div
                      key={post.post_id}
                      className="post-item"
                      onClick={() => {
                        navigate(`/post/${post.post_id}`);
                      }}
                    >
                      <div className="post-header">
                        <h3 className="post-title">{post.title}</h3>

                        {user?.user_id === post.user_id && (
                          <div
                            className="post-actions-container"
                            onClick={e => e.stopPropagation()}
                          >
                            <button className="action-toggle-button">
                              <FaEllipsisH />
                            </button>
                            <div className="dropdown-actions">
                              <button
                                className="action-button edit-button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleOpenEditModal(post);
                                }}
                              >
                                <FaEdit /> Edit
                              </button>
                              <button
                                className="action-button delete-button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDeletePost(post.post_id);
                                }}
                              >
                                <FaTrash /> Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="post-content">{post.content}</p>
                      <p className="post-date">
                        Posted on {new Date(post.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">📝</div>
                    <p>You haven't created any posts yet.</p>
                    <a href="/create-post" className="empty-action-button">Create a Post</a>
                  </div>
                )}
              </div>
            )}

            {/* Comments Tab Content */}
            {activeTab === 'Comments' && (
              <div className="content-section">
                <h2 className="section-title">Your Comments</h2>
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <div
                      key={comment.comment_id}
                      className="comment-item"
                      onClick={() => {
                        navigate(`/post/${comment.post_id}`);
                      }}
                    >
                      <div className="comment-content">
                        <p className="comment-text">{comment.content}</p>
                        <div className="comment-context">
                          <span className="context-label">On post:</span>
                          <span className="context-title">{comment.post?.content}</span>
                        </div>
                      </div>
                      <p className="comment-date">
                        {new Date(comment.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">💬</div>
                    <p>You haven't made any comments yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* Upvoted Tab Content */}
            {activeTab === 'Upvoted' && (
              <div className="content-section">
                <h2 className="section-title">Content You've Upvoted</h2>
                {upvoted.length > 0 ? (
                  upvoted.map((vote) => {
                    const postContext = vote.post || vote.comment?.post || null;
                    return (
                      <div
                        key={vote.vote_id}
                        className="vote-item"
                        onClick={() => {
                          if (postContext) {
                            navigate(`/post/${postContext.post_id}`);
                          }
                        }}
                      >
                        <div className="vote-icon upvote">
                          <FaArrowUp />
                        </div>
                        <div className="vote-content">
                          {vote.kategori_type === "POST" && vote.post ? (
                            <>
                              <span className="vote-type">Post</span>
                              <p className="vote-text">{vote.post.title}</p>
                            </>
                          ) : vote.kategori_type === "COMMENT" && vote.comment ? (
                            <>
                              <span className="vote-type">Comment</span>
                              <p className="vote-text">{vote.comment.content}</p>
                              <p className="vote-context">on post: <span className="context-highlight">{vote.comment.post?.title || vote.comment.post?.content}</span></p>
                            </>
                          ) : null}
                        </div>
                        <p className="vote-date">
                          {new Date(vote.created_at).toLocaleString()}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">👍</div>
                    <p>You haven't upvoted any content yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* Downvoted Tab Content */}
            {activeTab === 'Downvoted' && (
              <div className="content-section">
                <h2 className="section-title">Content You've Downvoted</h2>
                {Downvoted.length > 0 ? (
                  Downvoted.map((vote) => {
                    const postContext = vote.post || vote.comment?.post || null;
                    return (
                      <div
                        key={vote.vote_id}
                        className="vote-item"
                        onClick={() => {
                          if (postContext) {
                            navigate(`/post/${postContext.post_id}`);
                          }
                        }}
                      >
                        <div className="vote-icon downvote">
                          <FaArrowDown />
                        </div>
                        <div className="vote-content">
                          {vote.kategori_type === "POST" && vote.post ? (
                            <>
                              <span className="vote-type">Post</span>
                              <p className="vote-text">{vote.post.title}</p>
                            </>
                          ) : vote.kategori_type === "COMMENT" && vote.comment ? (
                            <>
                              <span className="vote-type">Comment</span>
                              <p className="vote-text">{vote.comment.content}</p>
                              <p className="vote-context">on post: <span className="context-highlight">{vote.comment.post?.title || vote.comment.post?.content}</span></p>
                            </>
                          ) : null}
                        </div>
                        <p className="vote-date">
                          {new Date(vote.created_at).toLocaleString()}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">👎</div>
                    <p>You haven't downvoted any content yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Post Modal */}
      {isEditPostModalOpen && currentEditingPost && (
        <div className="overlay" onClick={() => setIsEditPostModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Post</h3>
            </div>
            <p className="modal-subtext">Update your post content below.</p>

            {/* Show title as read-only */}
            <div className="modal-field">
              <label>Post Title:</label>
              <div className="read-only-field">{editPostTitle}</div>
            </div>

            {/* Allow editing only the content */}
            <div className="modal-field">
              <label>Post Content:</label>
              <textarea
                className="modal-input"
                placeholder="Post Content"
                value={editPostContent}
                onChange={(e) => setEditPostContent(e.target.value)}
                rows={5}
              />
            </div>

            {editModalError && (
              <div className="modal-error">{editModalError}</div>
            )}

            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setIsEditPostModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="save-btn"
                onClick={handleUpdatePost}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;