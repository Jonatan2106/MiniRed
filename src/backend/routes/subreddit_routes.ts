import express from 'express';
import { createSubreddit, getAllSubreddits, getSubredditById, updateSubreddit, deleteSubreddit, getSubredditByName, joinSubreddit, leaveSubreddit } from '../controllers/subreddit_controller';
import { authenticateJWT } from '../middleware/auth_middleware';
import { controllerWrapper } from '../utils/controllerWrapper';

const SubredditRouter = express.Router();

// Subreddit CRUD
SubredditRouter.get('/subreddits', controllerWrapper(getAllSubreddits));
SubredditRouter.get('/subreddits/:id', controllerWrapper(getSubredditById));
SubredditRouter.get('/subreddits/r/:name', controllerWrapper(getSubredditByName));
SubredditRouter.post('/subreddits', authenticateJWT, controllerWrapper(createSubreddit));
SubredditRouter.put('/subreddits/:id', authenticateJWT, controllerWrapper(updateSubreddit));
SubredditRouter.delete('/subreddits/:id', authenticateJWT, controllerWrapper(deleteSubreddit));

// Subreddit Member Actions
SubredditRouter.post('/subreddits/:id/join', authenticateJWT, controllerWrapper(joinSubreddit));
SubredditRouter.post('/subreddits/:id/leave', authenticateJWT, controllerWrapper(leaveSubreddit));

export default SubredditRouter;

