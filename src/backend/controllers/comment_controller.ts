import e, { Request, Response } from 'express';
import { Comment } from '../../../models/comment';
import { Post } from '../../../models/post';
import { User } from '../../../models/user';
import { Vote } from '../../../models/vote';
import { v4 } from 'uuid';

export const addComment = async (req: Request, res: Response) => {
    const post_id = req.params.id;
    const { content, parent_comment_id, userId } = req.body;

    const post = await Post.findByPk(post_id);
    if (!post) {
        return { message: "Post not found" };
    } else {
        if (parent_comment_id) {
            const parentComment = await Comment.findByPk(parent_comment_id);
            if (!parentComment) {
                return { message: "Parent comment not found" };
            } else {
                const comment_id = v4();

                const newComment = await Comment.create({
                    comment_id,
                    post_id,
                    user_id: userId,
                    parent_comment_id: parent_comment_id || null,
                    content,
                    created_at: new Date(),
                    updated_at: new Date(),
                });

                const user = await User.findByPk(userId);
                if (!user) {
                    return { message: "User not found" };
                } else {
                    return {
                        message: "Comment added successfully",
                        comment: { ...newComment.toJSON(), user: { username: user.username } },
                    };
                }
            }
        } else {
            const comment_id = v4();

            const newComment = await Comment.create({
                comment_id,
                post_id,
                user_id: userId,
                parent_comment_id: null,
                content,
                created_at: new Date(),
                updated_at: new Date(),
            });

            const user = await User.findByPk(userId);
            if (!user) {
                return { message: "User not found" };
            } else {
                return {
                    message: "Comment added successfully",
                    comment: { ...newComment.toJSON(), user: { username: user.username } },
                };
            }
        }
    }
};

//3. Update a comment
export const updateComment = async (req: Request, res: Response) => {
    const comment = await Comment.findByPk(req.params.id);
    if (comment) {
        await comment.update(req.body);
        return comment;
    } else {
        return { message: 'Comment not found' };
    }
};

//4, Delete a comment
export const deleteComment = async (req: Request, res: Response) => {
    const comment = await Comment.findByPk(req.params.id);
    if (comment) {
        await Vote.destroy({
            where: {
                kategori_id: req.params.id,
            },
        });
        await comment.destroy();
        return { message: 'Comment deleted successfully' };
    } else {
        return { message: 'Comment not found' };
    }
};



