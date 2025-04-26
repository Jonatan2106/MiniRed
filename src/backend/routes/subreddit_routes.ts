import express from 'express';
import { createSubreddit, getAllSubreddits, getSubredditById } from '../controllers/subreddit_controller';
import { authenticateJWT } from '../middleware/auth_middleware';

const SubredditRouter = express.Router();

SubredditRouter.post('/subreddits', authenticateJWT, createSubreddit);
SubredditRouter.get('/subreddits', getAllSubreddits);
SubredditRouter.get('/subreddits/:id', getSubredditById);

export default SubredditRouter;
