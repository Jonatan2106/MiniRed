import express from 'express';
import { getPosts, getPostById, createPost, updatePost, deletePost} from '../controllers/post_controller';

const PostRouter = express.Router();

PostRouter.get('/posts', getPosts);
PostRouter.get('/posts/:id', getPostById);
PostRouter.post('/posts', createPost);
PostRouter.put('/posts/:id', updatePost);
PostRouter.delete('/posts/:id', deletePost);

export default PostRouter;
