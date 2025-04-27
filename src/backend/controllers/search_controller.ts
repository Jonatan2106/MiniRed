import { Request, Response } from "express";
import { Op } from "sequelize";
import { Post } from "../../../models/post";
import { User } from "../../../models/user";

export const searchContent = async (req: Request, res: Response) => {
    try {
        const keyword = req.query.q as string;

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

        res.status(200).json({ posts });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to search content" });
    }
};
