import { Request, Response } from 'express';
import { Comment } from '../../../models/comment';
import { Post } from '../../../models/post';
import { User } from '../../../models/user';
import { v4 } from 'uuid';

//1. Get comments for a post
export const getComment = async (req: Request, res: Response) => {
    try {
        const post_id = req.params.id;

        const post = await Post.findByPk(post_id);

        if (!post) {
            res.status(404).json({ message: "Post not found" });
        }

        const comments = await Comment.findAll({
            where: { 
                post_id: post_id, 
                parent_comment_id: null 
            }, 
            include: [
                {
                    model: User,
                    attributes: ['user_id', 'username'],
                },
                {
                    model: Comment,
                    as: 'replies',
                    include: [
                        {
                            model: User,
                            attributes: ['user_id', 'username'],
                        }
                    ]
                }
            ],
            order: [['created_at', 'ASC']]
        });

        res.status(200).json({ comments });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to get comment' });
    }
};

export const addComment = async (req: Request, res: Response) => {
    try {
        const post_id = req.params.id;
        const { content, parent_comment_id, userId } = req.body;

        // Find the post by ID
        const post = await Post.findByPk(post_id);
        if (!post) {
            res.status(404).json({ message: "Post not found" });
        }

        // Check if parent comment exists, if any
        if (parent_comment_id) {
            const parentComment = await Comment.findByPk(parent_comment_id);
            if (!parentComment) {
                res.status(404).json({ message: "Parent comment not found" });
            }
        }

        // Generate a new comment ID
        const comment_id = v4();

        // Create the new comment in the database
        const newComment = await Comment.create({
            comment_id,
            post_id,
            user_id: userId,
            parent_comment_id: parent_comment_id || null,
            content,
            created_at: new Date(),
            updated_at: new Date(),
        });

        // Fetch the user data (username) for the given userId using Sequelize
        const user = await User.findByPk(userId);
        if (!user) {
            res.status(404).json({ message: "User not found" });
        }
        else {
            // Respond with the newly created comment, including the username
            res.status(201).json({
                message: "Comment added successfully",
                comment: { ...newComment.toJSON(), user: { username: user.username }},
            });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to add comment' });
    }
};


//3. Update a comment
export const updateComment = async (req: Request, res: Response) => {
    try {
        const comment = await Comment.findByPk(req.params.id);
        if (comment) {
            await comment.update(req.body);
            res.json(comment);
        } else {
            res.status(404).json({ message: 'Comment not found' });
        }        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update comment' });

    }
};

//4, Delete a comment
export const deleteComment = async (req: Request, res: Response) => {
    try {
        
        const comment = await Comment.findByPk(req.params.id);

        if (comment) {
            await comment.destroy();
            res.status(204).send();
        } else {
            res.status(404).json({message: 'Comment not found'});
        }
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to delete comment' });
    }
};