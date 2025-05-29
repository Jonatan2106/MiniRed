import express from 'express';
import { getPosts, getPostById, createPost, updatePost, deletePost} from '../controllers/post_controller';
import { authenticateJWT } from '../middleware/auth_middleware';

const PostRouter = express.Router();

PostRouter.get('/posts', getPosts);
PostRouter.get('/posts/:id', getPostById);
PostRouter.post('/posts', authenticateJWT, createPost);
PostRouter.put('/posts/:id', authenticateJWT, updatePost);
PostRouter.delete('/posts/:id', authenticateJWT, deletePost);

export default PostRouter;
