import { Request, Response } from 'express';
import { Subreddit } from '../../../models/subreddit';
import { SubredditMember } from '../../../models/subreddit_member';
import { Post } from '../../../models/post'; // Assuming you have a Post model defined
import { v4 } from 'uuid';
import { User } from '../../../models/user';
import { Vote } from '../../../models/vote';
import { Comment as CommentModel } from '../../../models/comment';

// POST /subreddits - Create a new subreddit/community
export const createSubreddit = async (req: Request, res: Response) => {
  const subreddit_id = v4();
  const { name, title, description } = req.body;
  const user_id = req.body.userId;

  const alreadyExists = await Subreddit.findOne({ where: { name } });
  if (alreadyExists) {
    return { message: 'Subreddit name already exists' };
  }
  else {
    const newSubreddit = await Subreddit.create({
      subreddit_id,
      user_id,
      name,
      title,
      description,
    });

    await SubredditMember.create({
      subreddit_id,
      user_id,
      joined_at: new Date(),
      is_moderator: true
    });

    return newSubreddit;
  }
};

// GET /subreddits - List all subreddits
export const getAllSubreddits = async (req: Request, res: Response) => {
  const subreddits = await Subreddit.findAll({
    include: [
      {
        model: User,
        attributes: ['user_id', 'username', 'profile_pic']
      },
      {
        model: SubredditMember,
        attributes: ['subreddit_id', 'user_id', 'is_moderator'],
        required: false,
        include: [
          {
            model: User,
            attributes: ['user_id', 'username', 'profile_pic']
          }
        ]
      },
      {
        model: Post,
        attributes: ['post_id'],
        required: false
      }
    ]
  });
  const result = subreddits.map((sub: any) => {
    const subJSON = sub.toJSON();
    subJSON.postCount = subJSON.posts ? subJSON.posts.length : 0;
    delete subJSON.posts;
    return subJSON;
  });
  return result;
};

// GET /subreddits/:id - Get subreddit details
export const getSubredditById = async (req: Request, res: Response) => {
  const subreddit = await Subreddit.findByPk(req.params.id, {
    include: [
      {
        model: User,
        attributes: ['user_id', 'username', 'profile_pic']
      },
      {
        model: SubredditMember,
        attributes: ['subreddit_id', 'user_id', 'is_moderator'],
        required: false,
        include: [
          {
            model: User,
            attributes: ['user_id', 'username', 'profile_pic']
          }
        ]
      },
      {
        model: Post,
        required: false,
        include: [
          {
            model: User,
            attributes: ['user_id', 'username', 'profile_pic']
          },
          {
            model: Vote,
            attributes: ['vote_id', 'user_id', 'vote_type'],
            required: false
          },
          {
            model: CommentModel,
            attributes: ['comment_id'],
            required: false
          }
        ]
      }
    ]
  });
  if (!subreddit) {
    return { message: 'Subreddit not found' };
  } else {
    const subJSON = subreddit.toJSON();

    if (subJSON.posts) {
      subJSON.posts = subJSON.posts.map((post: any) => {
        const upvotes = post.votes?.filter((v: any) => v.vote_type === true).length || 0;
        const downvotes = post.votes?.filter((v: any) => v.vote_type === false).length || 0;
        const commentCount = post.comments?.length || 0;
        return {
          ...post,
          upvotes,
          downvotes,
          commentCount
        };
      });
    }
    return subJSON;
  }
};

// PUT /subreddits/:id - Update a subreddit
export const updateSubreddit = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, title, description } = req.body;

  const subreddit = await Subreddit.findByPk(id);
  if (!subreddit) {
    return { message: 'Subreddit not found' };
  }
  else {
    await subreddit.update({ name, title, description });
    return subreddit;
  }
};

// DELETE /subreddits/:id - Delete a subreddit
export const deleteSubreddit = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user_id = req.body.userId;

  const subreddit = await Subreddit.findByPk(id);
  if (!subreddit) {
    return { message: 'Subreddit not found' };
  }

  if (subreddit.user_id !== user_id) {
    return { message: 'Only the creator can delete this subreddit' };
  }

  await Post.update({ subreddit_id: null }, { where: { subreddit_id: id } });

  await subreddit.destroy();
  return { message: 'Subreddit deleted successfully' };
};

// GET /subreddits/name/:name - Get subreddit by name
export const getSubredditByName = async (req: Request, res: Response) => {
  const { name } = req.params;
  const subreddit = await Subreddit.findOne({
    where: { name },
    include: [
      {
        model: User,
        attributes: ['user_id', 'username', 'profile_pic']
      },
      {
        model: SubredditMember,
        attributes: ['subreddit_id', 'user_id', 'is_moderator'],
        required: false,
        include: [
          {
            model: User,
            attributes: ['user_id', 'username', 'profile_pic']
          }
        ]
      },
      {
        model: Post,
        required: false,
        include: [
          {
            model: User,
            attributes: ['user_id', 'username', 'profile_pic']
          },
          {
            model: Vote,
            attributes: ['vote_id', 'user_id', 'vote_type'],
            required: false
          },
          {
            model: CommentModel,
            attributes: ['comment_id'],
            required: false,
            include: [
              {
                model: Vote,
                attributes: ['vote_id', 'user_id', 'vote_type'],
                required: false
              }
            ]
          }
        ]
      }
    ]
  });
  if (!subreddit) {
    return { message: 'Subreddit not found' };
  } else {
    const subJSON = subreddit.toJSON();
    // Bundle post info
    if (subJSON.posts) {
      subJSON.posts = subJSON.posts.map((post: any) => {
        const upvotes = post.votes?.filter((v: any) => v.vote_type === true).length || 0;
        const downvotes = post.votes?.filter((v: any) => v.vote_type === false).length || 0;
        const commentCount = post.comments?.length || 0;
        return {
          ...post,
          upvotes,
          downvotes,
          commentCount
        };
      });
    }
    return subJSON;
  }
};

// POST /subreddits/:id/join - Join a subreddit
export const joinSubreddit = async (req: Request, res: Response) => {
  const { id: subreddit_id } = req.params;
  const user_id = req.body.userId;

  const existingMember = await SubredditMember.findOne({ where: { subreddit_id, user_id } });
  if (existingMember) {
    return { message: 'Already joined' };
  }
  else {
    const newMember = await SubredditMember.create({
      subreddit_id,
      user_id,
      is_moderator: false
    });
    return newMember;
  }
};

// POST /subreddits/:id/leave - Leave a subreddit
export const leaveSubreddit = async (req: Request, res: Response) => {
  const { id: subreddit_id } = req.params;
  const user_id = req.body.userId;

  const subreddit = await Subreddit.findByPk(subreddit_id);
  if (!subreddit) {
    return { message: 'Subreddit not found' };
  }

  if (subreddit.user_id === user_id) {
    return { message: 'Subreddit creator cannot leave their own subreddit' };
  }

  const member = await SubredditMember.findOne({ where: { subreddit_id, user_id } });
  if (!member) {
    return { message: 'Not a member' };
  }
  else {
    await member.destroy();
    return { message: 'Left subreddit successfully' };
  }
};
