import { Request, Response } from 'express';
import { Post } from '../../../models/post';
import { User } from '../../../models/user';
import { Subreddit } from '../../../models/subreddit';
import { Vote } from '../../../models/vote';
import { Comment } from '../../../models/comment';
import { v4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. List all posts
export const getPosts = async (req: Request, res: Response) => {
  const posts = await Post.findAll({
    include: [
      { model: User, attributes: ['user_id', 'username', 'profile_pic'] },
      { model: Subreddit, attributes: ['subreddit_id', 'name', 'title'] },
      {
        model: Vote,
        attributes: ['vote_id', 'user_id', 'vote_type'],
        required: false
      },
      {
        model: Comment,
        attributes: ['comment_id', 'user_id', 'content', 'created_at', 'parent_comment_id'],
        include: [
          { model: User, attributes: ['user_id', 'username', 'profile_pic'] },
          {
            model: Vote,
            attributes: ['vote_id', 'user_id', 'vote_type'],
            required: false
          }
        ],
        required: false
      }
    ],
    order: [['created_at', 'DESC']],
  });

  const bundledPosts = posts.map(post => {
    const postJSON = post.toJSON();
    postJSON.upvotes = postJSON.votes?.filter((v: any) => v.vote_type === true).length || 0;
    postJSON.downvotes = postJSON.votes?.filter((v: any) => v.vote_type === false).length || 0;
    postJSON.commentCount = postJSON.comments?.length || 0;
    return postJSON;
  });

  return bundledPosts;
};

// 2. Get a single post by ID
export const getPostById = async (req: Request, res: Response) => {
  const post = await Post.findByPk(req.params.id, {
    include: [
      { model: User, attributes: ['user_id', 'username', 'profile_pic'] },
      { model: Subreddit, attributes: ['subreddit_id', 'name', 'title'] },
      {
        model: Vote,
        attributes: ['vote_id', 'user_id', 'vote_type'],
        required: false
      },
      {
        model: Comment,
        attributes: ['comment_id', 'user_id', 'content', 'created_at', 'parent_comment_id'],
        include: [
          { model: User, attributes: ['user_id', 'username', 'profile_pic'] },
          {
            model: Vote,
            attributes: ['vote_id', 'user_id', 'vote_type'],
            required: false
          }
        ],
        required: false
      }
    ]
  });

  if (!post) {
    return { message: 'Post not found' };
  }

  const postJSON = post.toJSON();
  postJSON.upvotes = postJSON.votes?.filter((v: any) => v.vote_type === true).length || 0;
  postJSON.downvotes = postJSON.votes?.filter((v: any) => v.vote_type === false).length || 0;
  postJSON.commentCount = postJSON.comments?.length || 0;

  return postJSON;
};

// 3. Create a new post
export const createPost = async (req: Request, res: Response) => {
  const { subreddit_id, title, content, image } = req.body;
  const post_id = v4();
  const user_id = req.body.userId;

  let imagePath: string | null = null;

  if (image) {
    const matches = image.match(/^data:(.+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return { message: 'Invalid image format' };
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
    image: imagePath,
  });

  return newPost;
};


// 4. Update a post by ID
export const updatePost = async (req: Request, res: Response) => {
    const post = await Post.findByPk(req.params.id);
    if (post) {
      const { content } = req.body;

      post.content = content;
      await post.save();

      return post;
    } else {
      return { message: 'Post not found' };
    }
};

// 5. Delete a post by ID
export const deletePost = async (req: Request, res: Response) => {
    const post = await Post.findByPk(req.params.id);
    if (post) {
      await Vote.destroy({
        where: {
          kategori_id: req.params.id,
        },
      });
      await post.destroy();
      return { message: 'Post deleted successfully' };
    } else {
      return { message: 'Post not found' };
    }
};
