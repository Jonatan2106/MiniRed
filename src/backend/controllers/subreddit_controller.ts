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
  try {
    const subreddit_id = v4();
    const { name, title, description } = req.body;
    const user_id = req.body.userId;

    const alreadyExists = await Subreddit.findOne({ where: { name } });
    if (alreadyExists) {
      res.status(400).json({ message: 'Subreddit name already exists' });
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

      res.status(201).json(newSubreddit);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create subreddit' });
  }
};

// GET /subreddits - List all subreddits
export const getAllSubreddits = async (req: Request, res: Response) => {
  try {
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
    // Add postCount for each subreddit
    const result = subreddits.map((sub: any) => {
      const subJSON = sub.toJSON();
      subJSON.postCount = subJSON.posts ? subJSON.posts.length : 0;
      delete subJSON.posts;
      return subJSON;
    });
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch subreddits' });
  }
};

// GET /subreddits/:id - Get subreddit details
export const getSubredditById = async (req: Request, res: Response) => {
  try {
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
      res.status(404).json({ message: 'Subreddit not found' });
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
      res.json(subJSON);
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
    const { name, title, description } = req.body;

    const subreddit = await Subreddit.findByPk(id);
    if (!subreddit) {
      res.status(404).json({ message: 'Subreddit not found' });
    }
    else {
      await subreddit.update({ name, title, description });
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
    const user_id = req.body.userId;

    const subreddit = await Subreddit.findByPk(id);
    if (!subreddit) {
      res.status(404).json({ message: 'Subreddit not found' });
      return;
    }

    if (subreddit.user_id !== user_id) {
      res.status(403).json({ message: 'Only the creator can delete this subreddit' });
      return;
    }

    await subreddit.destroy();
    res.json({ message: 'Subreddit deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete subreddit' });
  }
};

// GET /subreddits/name/:name - Get subreddit by name
export const getSubredditByName = async (req: Request, res: Response) => {
  try {
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
      res.status(404).json({ message: 'Subreddit not found' });
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
      res.status(200).json(subJSON);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch subreddit' });
  }
};

// POST /subreddits/:id/join - Join a subreddit
export const joinSubreddit = async (req: Request, res: Response) => {
  try {
    const { id: subreddit_id } = req.params;
    const user_id = req.body.userId;

    const existingMember = await SubredditMember.findOne({ where: { subreddit_id, user_id } });
    if (existingMember) {
      res.status(400).json({ message: 'Already joined' });
    }
    else {
      const newMember = await SubredditMember.create({
        subreddit_id,
        user_id,
        is_moderator: false
      });
      res.status(201).json(newMember);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to join subreddit' });
  }
};

// POST /subreddits/:id/leave - Leave a subreddit
export const leaveSubreddit = async (req: Request, res: Response) => {
  try {
    const { id: subreddit_id } = req.params;
    const user_id = req.body.userId;

    const subreddit = await Subreddit.findByPk(subreddit_id);
    if (!subreddit) {
      res.status(404).json({ message: 'Subreddit not found' });
      return;
    }

    if (subreddit.user_id === user_id) {
      res.status(400).json({ message: 'Subreddit creator cannot leave their own subreddit' });
      return;
    }

    const member = await SubredditMember.findOne({ where: { subreddit_id, user_id } });
    if (!member) {
      res.status(404).json({ message: 'Not a member' });
    }
    else {
      await member.destroy();
      res.json({ message: 'Left subreddit successfully' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to leave subreddit' });
  }
};
