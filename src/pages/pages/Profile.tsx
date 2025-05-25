import Loading from './Loading';

import React, { useState, useEffect } from 'react';
import { fetchFromAPI } from '../../api/auth';
import { useNavigate } from 'react-router-dom';

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
  kategori_type: "POST" | "COMMENT";
  vote_type: boolean;
  created_at: string;
  post?: Post;
  comment?: Comment;
}

interface OverviewItem {
  type: 'post' | 'comment' | 'upvoted' | 'downvoted';
  created_at: string;
  post_id?: string;
  title?: string;
  content?: string;
  post?: Post;
  kategori_type?: 'POST' | 'COMMENT';
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
      fetchFromAPI('/me', 'GET')
        .then((data) => {
          setUser({ username: data.username, profilePic: data.profile_pic, user_id: data.user_id });
          const calculatedPostKarma = calculatePostKarma(posts, data.user_id);
          const calculatedCommentKarma = calculateCommentKarma(comments, data.user_id);
          setPostKarma(calculatedPostKarma);
          setCommentKarma(calculatedCommentKarma);
        })
        .catch((error) => console.error('Error fetching user data:', error));
    }

    fetchFromAPI('/user/me/posts', 'GET')
      .then(data => setPosts(data))
      .catch(() => console.error('Error fetching posts'));

    fetchFromAPI('/user/me/comments', 'GET')
      .then(async (commentsData) => {
        const commentsWithPosts = await Promise.all(
          commentsData.map(async (comment: Comment) => {
            const postResponse = await fetchFromAPI(`/posts/${comment.post_id}`, 'GET')
            const post = await postResponse;
            return { ...comment, post };
          })
        );
        setComments(commentsWithPosts);
      })
      .catch(() => console.error('Error fetching comments'));

    fetchFromAPI('/users/subreddits', 'GET')
      .then(data => setJoinedSubreddits(data))
      .catch(() => console.error('Error fetching joined communities'));

    fetchFromAPI('/posts:id', 'PUT')
      .then(data => setPosts(data))
      .catch(() => console.error('Error fetching posts'));

    setIsLoading(false);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetchFromAPI('/user/me/upvoted', 'GET')
      .then(data => setUpVotes(data))
      .catch(() => console.error('Error fetching upvoted posts'));

    fetchFromAPI('/user/me/downvoted', 'GET')
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

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="home-wrapper">
      {/* Main content */}
      <div className="main-content">
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
                          navigate(`/post/${item.post_id}`);
                        } else if (item.type === 'comment') {
                          navigate(`/post/${item.post_id}`);
                        } else if (item.type === 'upvoted' && item.kategori_type === 'POST' && item.post) {
                          navigate(`/post/${item.post.post_id}`);
                        } else if (item.type === 'downvoted' && item.kategori_type === 'POST' && item.post) {
                          navigate(`/post/${item.post.post_id}`);
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
                        navigate(`/post/${post.post_id}`);
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
                              <button onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditModal(post);
                              }}>
                                Edit
                              </button>
                              <button
                                style={{ color: 'white' }}
                                onClick={() => handleDeletePost(post.post_id)}
                              >
                                Delete
                              </button>
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
                        navigate(`/post/${comment.post_id}`);
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
                          navigate(`/post/${vote.post.post_id}`);
                        } else if (vote.kategori_type === "COMMENT" && vote.comment) {
                          navigate(`/post/${vote.comment.post_id}`);
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
                          navigate(`/post/${vote.post.post_id}`);
                        } else if (vote.kategori_type === "COMMENT" && vote.comment) {
                          navigate(`/post/${vote.comment.post_id}`);
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

      {isEditPostModalOpen && currentEditingPost && (
        <div className="overlay" onClick={() => setIsEditPostModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Post</h3>
            </div>
            <p className="modal-subtext">Update your post content.</p>

            {/* Show title as read-only */}
            <div className="modal-field">
              <label>Post Title:</label>
              <div className="read-only-field">{editPostTitle}</div>
            </div>

            {/* Allow editing only the content */}
            <textarea
              className="modal-input"
              placeholder="Post Content"
              value={editPostContent}
              onChange={(e) => setEditPostContent(e.target.value)}
              rows={5}
            />

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
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;