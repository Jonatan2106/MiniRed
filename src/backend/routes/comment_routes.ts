import express from 'express';
import { getComment, addComment, updateComment, deleteComment} from '../controllers/comment_controller';
import { authenticateJWT } from '../middleware/auth_middleware';

const CommentRouter = express.Router();

CommentRouter.get('/posts/:id/comments', getComment);
CommentRouter.post('/posts/:id/comments',authenticateJWT, addComment);
CommentRouter.put('/comments/:id', authenticateJWT, updateComment);
CommentRouter.delete('/comments/:id', authenticateJWT, deleteComment);

export default CommentRouter;
