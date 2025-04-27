import { Request, Response } from 'express';
import { Post } from '../../../models/post';
import { v4 } from 'uuid';

// 1. List all posts
export const getPosts = async (req: Request, res: Response) => {
  try {
    const posts = await Post.findAll();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching posts', error: err });
  }
};

// 2. Get a single post by ID
export const getPostById = async (req: Request, res: Response) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (post) {
      res.json(post);
    } else {
      res.status(404).json({ message: 'Post not found' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error fetching post', error: err });
  }
};

// 3. Create a new post
export const createPost = async (req: Request, res: Response) => {
  try {
    // const newPost = await Post.create(req.body);

    const { subreddit_id, title, content, image } = req.body
    const post_id = v4();
    const user_id = req.body.userId;

    const newPost = await Post.create({post_id, user_id, subreddit_id, title, content, image});
    res.status(201).json(newPost);
  } catch (err) {
    res.status(500).json({ message: 'Error creating post', error: err });
  }
};

// 4. Update a post by ID
export const updatePost = async (req: Request, res: Response) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (post) {
      await post.update(req.body);
      res.json(post);
    } else {
      res.status(404).json({ message: 'Post not found' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error updating post', error: err });
  }
};

// 5. Delete a post by ID
export const deletePost = async (req: Request, res: Response) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (post) {
      await post.destroy();
      res.status(204).send();
    } else {
      res.status(404).json({ message: 'Post not found' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error deleting post', error: err });
  }
};
