import express from 'express';
import { createSubreddit, getAllSubreddits, getSubredditById, updateSubreddit, deleteSubreddit, getSubredditByName } from '../controllers/subreddit_controller';
import { authenticateJWT } from '../middleware/auth_middleware';

const SubredditRouter = express.Router();

SubredditRouter.post('/subreddits', authenticateJWT, createSubreddit);
SubredditRouter.get('/subreddits', getAllSubreddits);
SubredditRouter.get('/subreddits/:id', getSubredditById);
SubredditRouter.put('/subreddits/:id', authenticateJWT, updateSubreddit);
SubredditRouter.delete('/subreddits/:id', authenticateJWT, deleteSubreddit);
SubredditRouter.get('/subreddits/name/:name', getSubredditByName);

export default SubredditRouter;
