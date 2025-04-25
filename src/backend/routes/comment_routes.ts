import express from 'express';
import { getCommentsByPost, addComment, updateComment, deleteComment } from '../controllers/comment_controller';

const CommentRouter = express.Router();

CommentRouter.get('/posts/:id/comments', getCommentsByPost);
CommentRouter.post('/posts/:id/comments', addComment);
CommentRouter.put('/comments/:id', updateComment);
CommentRouter.delete('/comments/:id', deleteComment);

export default CommentRouter;
