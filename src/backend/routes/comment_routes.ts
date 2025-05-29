import express from 'express';
import { addComment, updateComment, deleteComment} from '../controllers/comment_controller';
import { authenticateJWT } from '../middleware/auth_middleware';
import { controllerWrapper } from '../utils/controllerWrapper';

const CommentRouter = express.Router();

CommentRouter.post('/posts/:id/comments', authenticateJWT, controllerWrapper(addComment));
CommentRouter.put('/comments/:id', authenticateJWT, controllerWrapper(updateComment));
CommentRouter.delete('/comments/:id', authenticateJWT, controllerWrapper(deleteComment));

export default CommentRouter;
