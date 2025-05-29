import { Request, Response } from 'express';
import { Vote } from '../../../models/vote';
import { v4 } from 'uuid';

// POST /posts/:id/votes - Upvote/downvote a post
export const voteOnPost = async (req: Request, res: Response) => {
  try {
    const post_id = req.params.id;
    const { vote_type } = req.body; // true or false
    const user_id = req.body.userId;

    // Check if user already voted on this post
    const existingVote = await Vote.findOne({
      where: {
        kategori_id: post_id,
        kategori_type: 'POST',
        user_id: user_id,
      },
    });

    if (existingVote) {
      // Update the existing vote
      existingVote.vote_type = vote_type;
      await existingVote.save();
      // Get updated vote count
      const upvotes = await Vote.count({
        where: {
          kategori_id: post_id,
          kategori_type: 'POST',
          vote_type: true,
        },
      });
      const downvotes = await Vote.count({
        where: {
          kategori_id: post_id,
          kategori_type: 'POST',
          vote_type: false,
        },
      });
      const score = upvotes - downvotes;
      res.json({ message: 'Vote updated', vote: existingVote, upvotes, downvotes, score });
    } else {
      // Create a new vote
      const newVote = await Vote.create({
        vote_id: v4(),
        user_id,
        kategori_id: post_id,
        kategori_type: 'POST',
        vote_type,
      });
      // Get updated vote count
      const upvotes = await Vote.count({
        where: {
          kategori_id: post_id,
          kategori_type: 'POST',
          vote_type: true,
        },
      });
      const downvotes = await Vote.count({
        where: {
          kategori_id: post_id,
          kategori_type: 'POST',
          vote_type: false,
        },
      });
      const score = upvotes - downvotes;
      res.status(201).json({ message: 'Vote created', vote: newVote, upvotes, downvotes, score });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to vote on post' });
  }
};

// POST /comments/:id/votes - Upvote/downvote a comment
export const voteOnComment = async (req: Request, res: Response) => {
  try {
    const comment_id = req.params.id;
    const { vote_type } = req.body; // true or false
    const user_id = req.body.userId;

    // Check if user already voted on this comment
    const existingVote = await Vote.findOne({
      where: {
        kategori_id: comment_id,
        kategori_type: 'COMMENT',
        user_id: user_id,
      },
    });

    if (existingVote) {
      // Update the existing vote
      existingVote.vote_type = vote_type;
      await existingVote.save();
      // Get updated vote count
      const upvotes = await Vote.count({
        where: {
          kategori_id: comment_id,
          kategori_type: 'COMMENT',
          vote_type: true,
        },
      });
      const downvotes = await Vote.count({
        where: {
          kategori_id: comment_id,
          kategori_type: 'COMMENT',
          vote_type: false,
        },
      });
      const score = upvotes - downvotes;
      res.json({ message: 'Vote updated', vote: existingVote, upvotes, downvotes, score });
    } else {
      // Create a new vote
      const newVote = await Vote.create({
        vote_id: v4(),
        user_id,
        kategori_id: comment_id,
        kategori_type: 'COMMENT',
        vote_type,
      });
      // Get updated vote count
      const upvotes = await Vote.count({
        where: {
          kategori_id: comment_id,
          kategori_type: 'COMMENT',
          vote_type: true,
        },
      });
      const downvotes = await Vote.count({
        where: {
          kategori_id: comment_id,
          kategori_type: 'COMMENT',
          vote_type: false,
        },
      });
      const score = upvotes - downvotes;
      res.status(201).json({ message: 'Vote created', vote: newVote, upvotes, downvotes, score });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to vote on comment' });
  }
};

// DELETE /votes/:id - Delete a vote
export const deleteVote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // vote_id

    const vote = await Vote.findByPk(id);
    if (!vote) {
      res.status(404).json({ message: 'Vote not found' });
      return; // Make sure to stop execution after sending the response
    }
    const kategori_id = vote.kategori_id;
    const kategori_type = vote.kategori_type;
    // Delete the vote
    await vote.destroy();
    // Get updated vote count
    const upvotes = await Vote.count({
      where: {
        kategori_id,
        kategori_type,
        vote_type: true,
      },
    });
    const downvotes = await Vote.count({
      where: {
        kategori_id,
        kategori_type,
        vote_type: false,
      },
    });
    const score = upvotes - downvotes;
    res.json({ message: 'Vote deleted', upvotes, downvotes, score });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete vote' });
  }
};