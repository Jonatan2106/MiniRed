import { Request, Response } from 'express';
import { Post } from '../../../models/post';
import { Op } from 'sequelize';

export const searchPosts = async (req: Request, res: Response) => {
  const { q } = req.query;

  if (!q) {
    res.status(400).json({ message: 'Search keyword is required' });
  }
  else {
      try {
        const posts = await Post.findAll({
          where: {
            [Op.or]: [
              { title: { [Op.iLike]: `%${q}%` } },
              { content: { [Op.iLike]: `%${q}%` } }
            ]
          }
        });
        res.status(200).json(posts);
      } catch (err) {
        res.status(500).json({ message: 'An error occurred while searching for posts' });
      }
  }

};
