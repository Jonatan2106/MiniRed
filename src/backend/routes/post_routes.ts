import express from 'express';
import { getPosts, getPostById, createPost, updatePost, deletePost} from '../controllers/post_controller';
import { authenticateJWT } from '../middleware/auth_middleware';
import { controllerWrapper } from '../utils/controllerWrapper';

const PostRouter = express.Router();

PostRouter.get('/posts', controllerWrapper(getPosts));
PostRouter.get('/posts/:id', controllerWrapper(getPostById));
PostRouter.post('/posts', authenticateJWT, controllerWrapper(createPost));
PostRouter.put('/posts/:id', authenticateJWT, controllerWrapper(updatePost));
PostRouter.delete('/posts/:id', authenticateJWT, controllerWrapper(deletePost));

export default PostRouter;
