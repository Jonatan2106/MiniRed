import { Request, Response } from 'express';
import { Post } from '../../../models/post';
import { Comment } from '../../../models/comment';
import { v4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    const { subreddit_id, title, content, image } = req.body;
    const post_id = v4();
    const user_id = req.body.userId;

    let imagePath: string | null = null;

    if (image) {
      const matches = image.match(/^data:(.+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        res.status(400).json({ message: 'Invalid image format' });
      }

      const mimeType = matches[1];
      const base64Data = matches[2];
      const extension = mimeType.split('/')[1];
      const fileName = `${post_id}.${extension}`;
      const savePath = path.join(__dirname, '../../../public/uploads', fileName);

      const uploadDir = path.join(__dirname, '../../../public/uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      fs.writeFileSync(savePath, Buffer.from(base64Data, 'base64'));
      imagePath = `/uploads/${fileName}`;
    }

    const newPost = await Post.create({
      post_id,
      user_id,
      subreddit_id,
      title,
      content,
      image: imagePath, // Save path instead of raw binary
    });

    res.status(201).json(newPost);
  } catch (err) {
    console.error('Error creating post:', err);
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

export const getPostCommentsCount = async (req: Request, res: Response) => {
  try {
    const postId = req.params.id;

    const commentCount = await Comment.count({
      where: {
        post_id: postId,
      },
    });

    res.json({ commentCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch comment count' });
  }
};
