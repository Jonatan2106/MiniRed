import e, { Request, Response } from 'express';
import { Comment } from '../../../models/comment';
import { Post } from '../../../models/post';
import { User } from '../../../models/user';
import { Vote } from '../../../models/vote';
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
            },
            include: [
                {
                    model: User,
                    attributes: ['user_id', 'username'],
                },
            ],
            order: [['created_at', 'ASC']], // Order comments by creation date
        });

        // Prepare the final flattened response
        const flattenedComments: any[] = [];

        // Loop through the comments and flatten the structure
        for (const comment of comments) {
            // Fetch the user for the current comment asynchronously
            const user = await User.findByPk(comment.user_id);
            const username = user ? user.username : 'Unknown User';

            // Flatten the comment and add it to the array
            flattenedComments.push({
                comment: {
                    comment_id: comment.comment_id,
                    user_id: comment.user_id,
                    post_id: comment.post_id,
                    parent_comment_id: comment.parent_comment_id,
                    content: comment.content,
                    created_at: comment.created_at,
                    updated_at: comment.updated_at,
                    user: {
                        user_id: comment.user_id,
                        username: username,
                    },
                }
            });

            // If the comment is a reply, it should be included on the same level
            if (comment.parent_comment_id) {
                flattenedComments.push({
                    comment_id: comment.comment_id,
                    user_id: comment.user_id,
                    post_id: comment.post_id,
                    parent_comment_id: comment.parent_comment_id,
                    content: comment.content,
                    created_at: comment.created_at,
                    updated_at: comment.updated_at,
                    user: {
                        user_id: comment.user_id,
                        username: username,
                    },
                });
            }
        }

        // Respond with the flattened comments
        res.status(200).json(flattenedComments);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to get comments' });
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
        } else {
            // Check if parent comment exists (for replies)
            if (parent_comment_id) {
                const parentComment = await Comment.findByPk(parent_comment_id);
                if (!parentComment) {
                    res.status(404).json({ message: "Parent comment not found" });
                } else {
                    // Generate a new comment ID
                    const comment_id = v4();

                    // Create the new comment in the database
                    const newComment = await Comment.create({
                        comment_id,
                        post_id,
                        user_id: userId,
                        parent_comment_id: parent_comment_id || null, // Set parent comment if it's a reply
                        content,
                        created_at: new Date(),
                        updated_at: new Date(),
                    });

                    // Fetch the user data (username) for the given userId using Sequelize
                    const user = await User.findByPk(userId);
                    if (!user) {
                        res.status(404).json({ message: "User not found" });
                    } else {
                        // Respond with the newly created comment, including the username
                        res.status(201).json({
                            message: "Comment added successfully",
                            comment: { ...newComment.toJSON(), user: { username: user.username } },
                        });
                    }
                }
            } else {
                // Handle the case where parent_comment_id is not provided (top-level comment)
                const comment_id = v4();

                const newComment = await Comment.create({
                    comment_id,
                    post_id,
                    user_id: userId,
                    parent_comment_id: null, // Top-level comment has no parent
                    content,
                    created_at: new Date(),
                    updated_at: new Date(),
                });

                const user = await User.findByPk(userId);
                if (!user) {
                    res.status(404).json({ message: "User not found" });
                } else {
                    res.status(201).json({
                        message: "Comment added successfully",
                        comment: { ...newComment.toJSON(), user: { username: user.username } },
                    });
                }
            }
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
            await Vote.destroy({
                where: {
                    kategori_id: req.params.id,
                },
            });
            await comment.destroy();
            res.status(204).send();
        } else {
            res.status(404).json({ message: 'Comment not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to delete comment' });
    }
};



