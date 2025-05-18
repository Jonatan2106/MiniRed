import express from 'express';
import { getPosts, getPostById, createPost, updatePost, deletePost, getPostCommentsCount, getPostsByVotes} from '../controllers/post_controller';
import { authenticateJWT } from '../middleware/auth_middleware';

const PostRouter = express.Router();

PostRouter.get('/posts/by-votes', getPostsByVotes);
PostRouter.get('/posts', getPosts);
PostRouter.get('/posts/:id', getPostById);
PostRouter.get('/posts/:id/comments/count', getPostCommentsCount);
PostRouter.post('/posts', authenticateJWT, createPost);
PostRouter.put('/posts/:id', authenticateJWT, updatePost);
PostRouter.delete('/posts/:id', authenticateJWT, deletePost);

export default PostRouter;
