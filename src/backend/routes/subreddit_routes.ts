import express from 'express';
import { createSubreddit, getAllSubreddits, getSubredditById, updateSubreddit, deleteSubreddit, getSubredditByName, joinSubreddit, leaveSubreddit, changeMemberModeratorStatus, listSubredditMembers, getUserJoinedSubreddits, getPostBySubredditId, getUserJoinedSubredditsById } from '../controllers/subreddit_controller';
import { authenticateJWT } from '../middleware/auth_middleware';

const SubredditRouter = express.Router();

// Subreddit CRUD
SubredditRouter.post('/subreddits', authenticateJWT, createSubreddit);
SubredditRouter.get('/subreddits', getAllSubreddits);
SubredditRouter.get('/subreddits/:id', getSubredditById);
SubredditRouter.get('/subreddits/:id/posts', getPostBySubredditId);
SubredditRouter.put('/subreddits/:id', authenticateJWT, updateSubreddit);
SubredditRouter.delete('/subreddits/:id', authenticateJWT, deleteSubreddit);
SubredditRouter.get('/subreddits/r/:name', getSubredditByName);

// Subreddit Member Actions
SubredditRouter.post('/subreddits/:id/join', authenticateJWT, joinSubreddit);
SubredditRouter.post('/subreddits/:id/leave', authenticateJWT, leaveSubreddit);
SubredditRouter.get('/subreddits/:id/members', authenticateJWT, listSubredditMembers);
SubredditRouter.put('/subreddits/:id/members/:userId/moderator', authenticateJWT, changeMemberModeratorStatus);
SubredditRouter.get('/users/subreddits', authenticateJWT, getUserJoinedSubreddits);
SubredditRouter.get('/users/:id/subreddits', authenticateJWT, getUserJoinedSubredditsById);

export default SubredditRouter;

