import express from 'express';
import { voteOnPost, voteOnComment } from '../controllers/vote_controller';

const VoteRouter = express.Router();

// Vote on a post
VoteRouter.post('/posts/:id/votes', voteOnPost);

// Vote on a comment
VoteRouter.post('/comments/:id/votes', voteOnComment);

export default VoteRouter;
