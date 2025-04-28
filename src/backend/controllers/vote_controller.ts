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
      res.json({ message: 'Vote updated', vote: existingVote });
    } else {
      // Create a new vote
      const newVote = await Vote.create({
        vote_id: v4(),
        user_id,
        kategori_id: post_id,
        kategori_type: 'POST',
        vote_type,
      });
      res.status(201).json({ message: 'Vote created', vote: newVote });
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
      res.json({ message: 'Vote updated', vote: existingVote });
    } else {
      // Create a new vote
      const newVote = await Vote.create({
        vote_id: v4(),
        user_id,
        kategori_id: comment_id,
        kategori_type: 'COMMENT',
        vote_type,
      });
      res.status(201).json({ message: 'Vote created', vote: newVote });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to vote on comment' });
  }
};


// PUT /votes/:id - Update a vote
export const updateVote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // vote_id
    const { vote_type } = req.body;

    const vote = await Vote.findByPk(id);
    if (!vote) {
      res.status(404).json({ message: 'Vote not found' });
    }
    else {
      vote.vote_type = vote_type;
      await vote.save();
      res.json(vote);
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update vote' });
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

    // Delete the vote
    await vote.destroy();

    // Send a 204 No Content status to indicate successful deletion
    res.status(204).send(); // Ensure the response is sent
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete vote' });
  }
};


// GET /posts/:id/votes/count - Get total votes for a post
export const getPostVotesCount = async (req: Request, res: Response) => {
  try {
    const postId = req.params.id;

    const upvotes = await Vote.count({
      where: {
        kategori_id: postId,
        kategori_type: 'POST',
        vote_type: true, // true = upvote
      },
    });

    const downvotes = await Vote.count({
      where: {
        kategori_id: postId,
        kategori_type: 'POST',
        vote_type: false, // false = downvote
      },
    });

    res.json({ upvotes, downvotes, score: upvotes - downvotes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch post votes' });
  }
};

// GET /comments/:id/votes/count - Get total votes for a comment
export const getCommentVotesCount = async (req: Request, res: Response) => {
  try {
    const commentId = req.params.id;

    const upvotes = await Vote.count({
      where: {
        kategori_id: commentId,
        kategori_type: 'COMMENT',
        vote_type: true,
      },
    });

    const downvotes = await Vote.count({
      where: {
        kategori_id: commentId,
        kategori_type: 'COMMENT',
        vote_type: false,
      },
    });

    res.json({ upvotes, downvotes, score: upvotes - downvotes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch comment votes' });
  }
};

// GET /posts/:id/votes - Get all votes for a post
export const getVotesForPost = async (req: Request, res: Response) => {
  try {
    const postId = req.params.id;

    // Get all votes related to this post (both upvotes and downvotes)
    const votes = await Vote.findAll({
      where: {
        kategori_id: postId,
        kategori_type: 'POST',
      },
    });

    if (!votes || votes.length === 0) {
      res.status(404).json({ message: 'No votes found for this post' });
    }
    else {
      res.json(votes);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch votes for this post' });
  }
};

// GET /comments/:id/votes - Get all votes for a comment
export const getVotesForComment = async (req: Request, res: Response) => {
  try {
    const commentId = req.params.id;

    // Get all votes related to this comment (both upvotes and downvotes)
    const votes = await Vote.findAll({
      where: {
        kategori_id: commentId,
        kategori_type: 'COMMENT',
      },
    });

    if (!votes || votes.length === 0) {
      res.status(404).json({ message: 'No votes found for this comment' });
    }
    else {
      res.json(votes);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch votes for this comment' });
  }
};

// GET /posts/:id/votes/upvotes - Get all upvotes for a post
export const getUpvotesForPost = async (req: Request, res: Response) => {
  try {
    const postId = req.params.id;

    const upvotes = await Vote.findAll({
      where: {
        kategori_id: postId,
        kategori_type: 'POST',
        vote_type: true,  // true means upvote
      },
    });

    if (!upvotes || upvotes.length === 0) {
      res.status(404).json({ message: 'No upvotes found for this post' });
    }
    else {
      res.json(upvotes);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch upvotes for this post' });
  }
};

// GET /posts/:id/votes/downvotes - Get all downvotes for a post
export const getDownvotesForPost = async (req: Request, res: Response) => {
  try {
    const postId = req.params.id;

    const downvotes = await Vote.findAll({
      where: {
        kategori_id: postId,
        kategori_type: 'POST',
        vote_type: false,  // false means downvote
      },
    });

    if (!downvotes || downvotes.length === 0) {
      res.status(404).json({ message: 'No downvotes found for this post' });
    }
    else {
      res.json(downvotes);
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch downvotes for this post' });
  }
};

// GET /posts/:id/votes/user/:userId - Get all votes for a post by a user
export const getVotesByUserForPost = async (req: Request, res: Response) => {
  try {
    const postId = req.params.id;
    const userId = req.params.userId;

    const userVotes = await Vote.findAll({
      where: {
        kategori_id: postId,
        kategori_type: 'POST',
        user_id: userId,
      },
    });

    if (!userVotes || userVotes.length === 0) {
      res.status(404).json({ message: 'No votes found for this post by the user' });
    }
    else {
      res.json(userVotes);
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch votes by user for this post' });
  }
};
