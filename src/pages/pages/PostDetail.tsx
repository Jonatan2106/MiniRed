import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchFromAPI } from '../../api/api';
import '../styles/postdetail.css';
import '../styles/main.css';

const PostDetail = () => {
  const { id } = useParams();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);

  useEffect(() => {
    const fetchPostAndComments = async () => {
      try {
        const postResponse = await fetchFromAPI(`/posts/${id}`);
        setPost(postResponse);

        const commentsResponse = await fetchFromAPI(`/posts/${id}/comments`);
        setComments(commentsResponse);
      } catch (error) {
        console.error("Error fetching post or comments", error);
      }
    };

    fetchPostAndComments();
  }, [id]);

  return (
    <div className="post-detail-container">
      {post && (
        <>
          <h1 className="post-detail-header">{post.title}</h1>
          <p className="post-detail-content">{post.content}</p>

          <div className="comment-section">
            <h2 className="comment-header">Comments</h2>
            {comments.map(comment => (
              <div key={comment.comment_id} className="comment-card">
                <p className="comment-content">{comment.content}</p>
                <p className="comment-author">By {comment.author}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default PostDetail;
