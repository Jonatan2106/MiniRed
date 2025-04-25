import express from 'express';
import { createSubreddit, getAllSubreddits, getSubredditById } from '../controllers/subreddit_controller';

const SubredditRouter = express.Router();

SubredditRouter.post('/subreddits', createSubreddit);
SubredditRouter.get('/subreddits', getAllSubreddits);
SubredditRouter.get('/subreddits/:id', getSubredditById);

export default SubredditRouter;
