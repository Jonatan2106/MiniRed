import { Request, Response } from "express";
import { Op } from "sequelize";
import { Post } from "../../../models/post";
import { Comment } from "../../../models/comment";
import { User } from "../../../models/user";

export const searchContent = async (req: Request, res: Response) => {
    try {
        const keyword = req.query.keyword as string;

        if (!keyword) {
            res.status(400).json({ message: "Keyword is required" });
        }

        const posts = await Post.findAll({
            where: {
                content: {
                    [Op.iLike]: `%${keyword}%`  
                }
            },
            include: [
                {
                    model: User,
                    attributes: ["user_id", "username"]
                }
            ]
        });

            const comments = await Comment.findAll({
            where: {
                content: {
                    [Op.iLike]: `%${keyword}%`
                }
            },
            include: [
                {
                    model: User,
                    attributes: ["user_id", "username"]
                },
                {
                    model: Post,
                    attributes: ["post_id", "title"]
                }
            ]
        });

        res.status(200).json({ posts, comments });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to search content" });
    }
};
