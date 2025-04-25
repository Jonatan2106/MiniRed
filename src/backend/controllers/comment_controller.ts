import { Request, Response } from 'express';
import { Comment } from '../../../models/comment';

// GET /posts/:id/comments - Get comments for a post
export const getCommentsByPost = async (req: Request, res: Response) => {
  try {
    const postId = req.params.id;
    const comments = await Comment.findAll({ where: { post_id: postId } });
    res.json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch comments' });
  }
};

// POST /posts/:id/comments - Add a new comment
export const addComment = async (req: Request, res: Response) => {
  try {
    const postId = req.params.id;
    const { content } = req.body;

    const newComment = await Comment.create({
      post_id: postId,
      content,
      user_id: req.body.user_id,  // Assume the user is in req.body (from authentication middleware)
    });
    res.status(201).json(newComment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to add comment' });
  }
};

// PUT /comments/:id - Update a comment
export const updateComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const comment = await Comment.findByPk(id);
    if (!comment) { 
        res.status(404).json({ message: 'Comment not found' });
    }
    else {
        comment.content = content;
        await comment.save();
        res.json(comment);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update comment' });
  }
};

// DELETE /comments/:id - Delete a comment
export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findByPk(id);
    if (!comment) { 
        res.status(404).json({ message: 'Comment not found' });
    }
    else {
        await comment.destroy();
        res.status(204).send();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete comment' });
  }
};
