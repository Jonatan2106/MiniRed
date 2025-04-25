import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchFromAPI } from '../../api/api';

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
    <div>
      {post && (
        <>
          <h1>{post.title}</h1>
          <p>{post.content}</p>
          <h2>Comments</h2>
          {comments.map(comment => (
            <div key={comment.comment_id}>
              <p>{comment.content}</p>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default PostDetail;
