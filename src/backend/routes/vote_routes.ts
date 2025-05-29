import express from 'express';
import { voteOnPost, voteOnComment, deleteVote } from '../controllers/vote_controller';
import { authenticateJWT } from '../middleware/auth_middleware';
import { controllerWrapper } from '../utils/controllerWrapper';

const VoteRouter = express.Router();

VoteRouter.post('/posts/:id/votes', authenticateJWT, controllerWrapper(voteOnPost));
VoteRouter.post('/comments/:id/votes', authenticateJWT, controllerWrapper(voteOnComment));
VoteRouter.delete('/votes/:id', authenticateJWT, controllerWrapper(deleteVote));

export default VoteRouter;
