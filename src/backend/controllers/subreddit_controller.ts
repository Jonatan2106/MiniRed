import { Request, Response } from 'express';
import { Subreddit } from '../../../models/subreddit';

// POST /subreddits - Create a new subreddit/community
export const createSubreddit = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;

    const newSubreddit = await Subreddit.create({ name, description });
    res.status(201).json(newSubreddit);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create subreddit' });
  }
};

// GET /subreddits - List all subreddits
export const getAllSubreddits = async (req: Request, res: Response) => {
  try {
    const subreddits = await Subreddit.findAll();
    res.json(subreddits);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch subreddits' });
  }
};

// GET /subreddits/:id - Get subreddit details
export const getSubredditById = async (req: Request, res: Response) => {
  try {
    const subreddit = await Subreddit.findByPk(req.params.id);
    if (!subreddit) { 
        res.status(404).json({ message: 'Subreddit not found' });
    }
    else {
        res.json(subreddit);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch subreddit' });
  }
};
