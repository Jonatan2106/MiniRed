import express from 'express';
import { voteOnPost, voteOnComment } from '../controllers/vote_controller';

const VoteRouter = express.Router();

VoteRouter.post('/posts/:id/votes', voteOnPost);
VoteRouter.post('/comments/:id/votes', voteOnComment);

export default VoteRouter;
