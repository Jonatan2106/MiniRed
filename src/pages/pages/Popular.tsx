import React, { useState, useEffect } from 'react';
import '../styles/popular.css';
import '../styles/main.css';
import Loading from './Loading';
import { fetchFromAPI } from '../../api/auth';
import { fetchFromAPIWithoutAuth } from '../../api/noAuth';

interface Post {
    post_id: string;
    user_id: string;
    title: string;
    content: string;
    image: string | null;
    created_at: string;
    score: number;
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

const Popular = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [joinedSubreddits, setJoinedSubreddits] = useState<Subreddit[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<User>();
    const [users, setUsers] = useState<Map<string, User>>(new Map());
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (token) {
                    const subredditsResponse = await fetchFromAPI('/users/subreddits', 'GET');
                    setJoinedSubreddits(subredditsResponse);
                }

                const postsResponse = await fetchFromAPIWithoutAuth('/posts/by-votes', 'GET');
                setPosts(postsResponse);

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
                    {posts.map((post) => (
                        <PostCard key={post.post_id} post={post} users={users} current_user={user ?? { user_id: '', username: '', profilePic: '' }} />
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

const PostCard = ({ post, users, current_user }: { post: Post; users: Map<string, User>; current_user: User }) => {
    const [voteCount, setVoteCount] = useState<{ upvotes: number; downvotes: number; score: number }>({ upvotes: 0, downvotes: 0, score: 0 });
    const [commentCount, setCommentCount] = useState<number>(0);
    const [userVote, setUserVote] = useState<null | 'upvote' | 'downvote'>(null);
    const [voteId, setVoteId] = useState<string | null>(null);

    useEffect(() => {
        fetchCommentCount();
        fetchVoteCount();

        const token = localStorage.getItem('token');
        if (token) {
            fetchFromAPI(`/posts/${post.post_id}/votes`, 'GET')
                .then((data) => {
                    if (Array.isArray(data) && data.length > 0) {
                        const vote = data.find((v: any) => v.user_id === current_user.user_id);
                        if (vote) {
                            setUserVote(vote.vote_type ? 'upvote' : 'downvote');
                            setVoteId(vote.vote_id || null);
                        }
                    }
                })
                .catch((error) => console.error('Error fetching user vote:', error));
        }
    }, [post.post_id]);

    const fetchVoteCount = () => {
        fetchFromAPIWithoutAuth(`/posts/${post.post_id}/votes/count`, 'GET')
            .then((data) => {
                setVoteCount({
                    upvotes: data.upvotes,
                    downvotes: data.downvotes,
                    score: data.score,
                });
            })
            .catch((error) => console.error('Error fetching vote count:', error));
    };

    const fetchCommentCount = () => {
        fetchFromAPIWithoutAuth(`/posts/${post.post_id}/comments/count`, 'GET')
            .then((data) => setCommentCount(data.commentCount))
            .catch((error) => console.error('Error fetching comment count:', error));
    };

    return (
        <div className="post-card">
            <a href={`/post/${post.post_id}`} className="post-link">
                <div className="post-content">
                    <div className="post-header">
                        <a href={`/u/${users.get(post.user_id)?.username}`} className="username">
                            u/{users.get(post.user_id)?.username || 'Unknown User'}
                        </a>
                        <span className="timestamp">{new Date(post.created_at).toLocaleString()}</span>
                    </div>
                    <h2>{post.title}</h2>
                    <p>{post.content.length > 100 ? `${post.content.slice(0, 100)}...` : post.content}</p>
                    {post.image && (
                        <div className="post-image-container">
                            <img src={post.image} alt={post.title} className="post-image" />
                        </div>
                    )}
                </div>
                <hr className="hr" />
            </a>
            <div className="post-footer">
                <div className="vote-section">
                </div>
                <div className="comment-count">
                    <span>{commentCount}</span> <span>Comments</span>
                </div>
            </div>
        </div>
    );
};

export default Popular;