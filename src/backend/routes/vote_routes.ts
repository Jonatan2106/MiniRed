import express from 'express';
import { voteOnPost, voteOnComment, deleteVote } from '../controllers/vote_controller';
import { authenticateJWT } from '../middleware/auth_middleware';

const VoteRouter = express.Router();

VoteRouter.post('/posts/:id/votes', authenticateJWT, voteOnPost);
VoteRouter.post('/comments/:id/votes', authenticateJWT, voteOnComment);
VoteRouter.delete('/votes/:id', authenticateJWT, deleteVote);

export default VoteRouter;
