import { Request, Response } from 'express';
import { Subreddit } from '../../../models/subreddit';
import { SubredditMember } from '../../../models/subreddit_member';
import { Post } from '../../../models/post'; // Assuming you have a Post model defined
import { v4 } from 'uuid';

// POST /subreddits - Create a new subreddit/community
export const createSubreddit = async (req: Request, res: Response) => {
  try {
    const subreddit_id = v4();
    const { name, title, description, is_privated } = req.body;
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
        is_privated
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
      res.status(200).json(subreddit);
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

// PUT /subreddits/:id/members/:userId/moderator - Change member's moderator status
export const changeMemberModeratorStatus = async (req: Request, res: Response) => {
  try {
    const { id: subreddit_id, userId: target_user_id } = req.params;
    const { is_moderator } = req.body; // is_moderator will be set to true/false
    const requester_id = req.body.userId;

    // Check if subreddit exists
    const subreddit = await Subreddit.findByPk(subreddit_id);
    if (!subreddit) {
      res.status(404).json({ message: 'Subreddit not found' });
    } else {
      // Check if requester is creator or moderator
      if (subreddit.user_id !== requester_id) {
        // Not creator, check if requester is a moderator
        const requesterMember = await SubredditMember.findOne({ where: { subreddit_id, user_id: requester_id } });
        if (!requesterMember || !requesterMember.is_moderator) {
          res.status(403).json({ message: 'Only creator or moderators can change member status' });
        } else {
          // Safe to update target member
          const targetMember = await SubredditMember.findOne({ where: { subreddit_id, user_id: target_user_id } });
          if (!targetMember) {
            res.status(404).json({ message: 'Target member not found' });
          } else {
            // Corrected: Update the is_moderator field
            await targetMember.update({ is_moderator });
            res.json({ message: `Member updated successfully`, member: targetMember });
          }
        }
      } else {
        // Creator, safe to update target member
        const targetMember = await SubredditMember.findOne({ where: { subreddit_id, user_id: target_user_id } });
        if (!targetMember) {
          res.status(404).json({ message: 'Target member not found' });
        } else {
          // Corrected: Update the is_moderator field
          await targetMember.update({ is_moderator });
          res.json({ message: `Member updated successfully`, member: targetMember });
        }
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to change moderator status' });
  }
};

// POST /subreddits/:id/leave - Leave a subreddit
export const leaveSubreddit = async (req: Request, res: Response) => {
  try {
    const { id: subreddit_id } = req.params;
    const user_id = req.body.userId;

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

// GET /subreddits/:id/members - List all members in subreddit
export const listSubredditMembers = async (req: Request, res: Response) => {
  try {
    const { id: subreddit_id } = req.params;
    const members = await SubredditMember.findAll({ where: { subreddit_id } });
    res.json(members);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch subreddit members' });
  }
};

export const getUserJoinedSubreddits = async (req: Request, res: Response) => {
  try {
    console.log(req.body.userId)
    const user_id = req.body.userId;

    const memberships = await SubredditMember.findAll({
      where: { user_id },
      include: {
        model: Subreddit
      }
    });

    // Extract subreddit details from memberships
    const subredditList = memberships.map(membership => membership.subreddit);
    res.json(subredditList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch joined subreddits' });
  }
};

export const getUserJoinedSubredditsById = async (req: Request, res: Response) => {
  try {
    const user_id = req.params.id;

    const memberships = await SubredditMember.findAll({
      where: { user_id },
      include: {
        model: Subreddit,
        attributes: ['subreddit_id', 'name', 'title', 'description']
      }
    });

    // Extract subreddit details from memberships
    const subredditList = memberships.map(membership => membership.subreddit);
    res.json(subredditList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch joined subreddits' });
  }
};

export const getPostBySubredditId = async (req: Request, res: Response) => {
  try {
    const { id: subreddit_id } = req.params;

    if (!subreddit_id) {
      res.status(400).json({ message: 'Subreddit ID is required' });
    }

    // Fetch posts where subreddit_id matches
    const posts = await Post.findAll({ where: { subreddit_id } });

    res.json(posts);
  } catch (err) {
    console.error('Error fetching posts by subreddit ID:', err);
    res.status(500).json({ message: 'Error fetching posts', error: err });
  }
};  
