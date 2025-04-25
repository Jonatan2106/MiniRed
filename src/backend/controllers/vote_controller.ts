import { Request, Response } from 'express';
import { Vote } from '../../../models/vote';

// POST /posts/:id/votes - Upvote/downvote a post
export const voteOnPost = async (req: Request, res: Response) => {
  try {
    const postId = req.params.id;
    const { vote_type } = req.body;  // Assuming vote_type is a boolean

    const newVote = await Vote.create({
      post_id: postId,
      user_id: req.body.user_id,  // Assume the user is in req.body
      vote_type,
      kategori_type: 'POST',
    });

    res.status(201).json(newVote);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to vote on post' });
  }
};

// POST /comments/:id/votes - Upvote/downvote a comment
export const voteOnComment = async (req: Request, res: Response) => {
  try {
    const commentId = req.params.id;
    const { vote_type } = req.body;

    const newVote = await Vote.create({
      comment_id: commentId,
      user_id: req.body.user_id,  // Assume the user is in req.body
      vote_type,
      kategori_type: 'COMMENT',
    });

    res.status(201).json(newVote);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to vote on comment' });
  }
};
