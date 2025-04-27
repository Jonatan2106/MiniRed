import express from 'express';
import { voteOnPost, voteOnComment, updateVote, deleteVote, getCommentVotesCount, getPostVotesCount, getVotesForPost, getVotesForComment, getUpvotesForPost, getDownvotesForPost, getVotesByUserForPost } from '../controllers/vote_controller';
import { authenticateJWT } from '../middleware/auth_middleware';

const VoteRouter = express.Router();

VoteRouter.post('/posts/:id/votes', authenticateJWT, voteOnPost);
VoteRouter.get('/posts/:id/votes/count', authenticateJWT, getPostVotesCount);
VoteRouter.post('/comments/:id/votes', authenticateJWT, voteOnComment);
VoteRouter.get('/comments/:id/votes/count', authenticateJWT, getCommentVotesCount);
VoteRouter.put('/votes/:id', authenticateJWT, updateVote);
VoteRouter.delete('/votes/:id', authenticateJWT, deleteVote);
VoteRouter.get('/posts/:id/votes', authenticateJWT, getVotesForPost);
VoteRouter.get('/comments/:id/votes', authenticateJWT, getVotesForComment);
VoteRouter.get('/posts/:id/votes/upvotes', authenticateJWT, getUpvotesForPost);
VoteRouter.get('/posts/:id/votes/downvotes', authenticateJWT, getDownvotesForPost);
VoteRouter.get('/posts/:id/votes/user/:userId', authenticateJWT, getVotesByUserForPost);


export default VoteRouter;
