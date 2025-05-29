import express from 'express';
import { createSubreddit, getAllSubreddits, getSubredditById, updateSubreddit, deleteSubreddit, getSubredditByName, joinSubreddit, leaveSubreddit } from '../controllers/subreddit_controller';
import { authenticateJWT } from '../middleware/auth_middleware';

const SubredditRouter = express.Router();

// Subreddit CRUD
SubredditRouter.get('/subreddits', getAllSubreddits);
SubredditRouter.get('/subreddits/:id', getSubredditById);
SubredditRouter.get('/subreddits/r/:name', getSubredditByName);
SubredditRouter.post('/subreddits', authenticateJWT, createSubreddit);
SubredditRouter.put('/subreddits/:id', authenticateJWT, updateSubreddit);
SubredditRouter.delete('/subreddits/:id', authenticateJWT, deleteSubreddit);

// Subreddit Member Actions
SubredditRouter.post('/subreddits/:id/join', authenticateJWT, joinSubreddit);
SubredditRouter.post('/subreddits/:id/leave', authenticateJWT, leaveSubreddit);

export default SubredditRouter;

