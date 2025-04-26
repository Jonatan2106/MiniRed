import express from 'express';
import { voteOnPost, voteOnComment } from '../controllers/vote_controller';
import { authenticateJWT } from '../middleware/auth_middleware';

const VoteRouter = express.Router();

VoteRouter.post('/posts/:id/votes', authenticateJWT, voteOnPost);
VoteRouter.post('/comments/:id/votes', authenticateJWT, voteOnComment);

export default VoteRouter;
