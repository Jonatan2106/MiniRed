import { Request, Response } from 'express';
import { Subreddit } from '../../../models/subreddit';
import { v4 } from 'uuid';

// POST /subreddits - Create a new subreddit/community
export const createSubreddit = async (req: Request, res: Response) => {
  try {
    const subreddit_id = v4();
    const { name, title, description, is_privated } = req.body;

    const newSubreddit = await Subreddit.create({ 
      subreddit_id,
      name, 
      title,
      description,
      is_privated 
    });
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

// PUT /subreddits/:id - Update a subreddit
export const updateSubreddit = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, title, description, is_privated } = req.body;

    const subreddit = await Subreddit.findByPk(id);
    if (!subreddit) {
      res.status(404).json({ message: 'Subreddit not found' });
    }
    else {
      await subreddit.update({ name, title, description, is_privated });
      res.json(subreddit);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update subreddit' });
  }
};

// DELETE /subreddits/:id - Delete a subreddit
export const deleteSubreddit = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const subreddit = await Subreddit.findByPk(id);
    if (!subreddit) {
      res.status(404).json({ message: 'Subreddit not found' });
    }
    else {
      await subreddit.destroy();
      res.json({ message: 'Subreddit deleted successfully' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete subreddit' });
  }
};

// GET /subreddits/name/:name - Get subreddit by name
export const getSubredditByName = async (req: Request, res: Response) => {
  try {
    const { name } = req.params;

    const subreddit = await Subreddit.findOne({ where: { name } });
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
