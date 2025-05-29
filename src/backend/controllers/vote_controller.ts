import { Request, Response } from 'express';
import { Vote } from '../../../models/vote';
import { v4 } from 'uuid';

// POST /posts/:id/votes - Upvote/downvote a post
export const voteOnPost = async (req: Request, res: Response) => {
  const post_id = req.params.id;
  const { vote_type } = req.body; 
  const user_id = req.body.userId;

  const existingVote = await Vote.findOne({
    where: {
      kategori_id: post_id,
      kategori_type: 'POST',
      user_id: user_id,
    },
  });

  if (existingVote) {
   
    existingVote.vote_type = vote_type;
    await existingVote.save();
    
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
    return { message: 'Vote updated', vote: existingVote, upvotes, downvotes, score };
  } else {
    
    const newVote = await Vote.create({
      vote_id: v4(),
      user_id,
      kategori_id: post_id,
      kategori_type: 'POST',
      vote_type,
    });
    
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
    return { message: 'Vote created', vote: newVote, upvotes, downvotes, score };
  }
};

// POST /comments/:id/votes - Upvote/downvote a comment
export const voteOnComment = async (req: Request, res: Response) => {
  const comment_id = req.params.id;
  const { vote_type } = req.body;
  const user_id = req.body.userId;

  const existingVote = await Vote.findOne({
    where: {
      kategori_id: comment_id,
      kategori_type: 'COMMENT',
      user_id: user_id,
    },
  });

  if (existingVote) {
    
    existingVote.vote_type = vote_type;
    await existingVote.save();
    
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
    return { message: 'Vote updated', vote: existingVote, upvotes, downvotes, score };
  } else {
    
    const newVote = await Vote.create({
      vote_id: v4(),
      user_id,
      kategori_id: comment_id,
      kategori_type: 'COMMENT',
      vote_type,
    });

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
    return { message: 'Vote created', vote: newVote, upvotes, downvotes, score };
  }
};

// DELETE /votes/:id - Delete a vote
export const deleteVote = async (req: Request, res: Response) => {
  const { id } = req.params; // vote_id

  const vote = await Vote.findByPk(id);
  if (!vote) {
    return { message: 'Vote not found' };
  }
  const kategori_id = vote.kategori_id;
  const kategori_type = vote.kategori_type;
  
  await vote.destroy();

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
  return { message: 'Vote deleted', upvotes, downvotes, score };
};