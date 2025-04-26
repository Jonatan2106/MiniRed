import express from 'express';
import { getCommentsByPost, addComment, updateComment, deleteComment, getCommentById } from '../controllers/comment_controller';
import { authenticateJWT } from '../middleware/auth_middleware';

const CommentRouter = express.Router();

CommentRouter.get('/posts/:id/comments', getCommentsByPost);
CommentRouter.post('/posts/:id/comments', authenticateJWT, addComment);
CommentRouter.put('/comments/:id', authenticateJWT, updateComment);
CommentRouter.delete('/comments/:id', authenticateJWT, deleteComment);
CommentRouter.get("/comments/:id", getCommentById);

export default CommentRouter;
