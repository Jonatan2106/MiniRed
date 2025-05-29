import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response } from 'express';
import { User } from '../../../models/user';
import { Comment } from '../../../models/comment';
import { Post } from '../../../models/post';
import { generateToken } from '../utils/jwt_helper';
import { Vote } from '../../../models/vote';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Subreddit } from '../../../models/subreddit';
import { SubredditMember } from '../../../models/subreddit_member';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// POST /register - Register a new user
export const registerUser = async (req: Request, res: Response) => {
    const { username, email, password } = req.body;
    const user_id = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({ user_id, username, email, password: hashedPassword });
    return { message: 'User registered successfully!' };
};

// POST /login - Login user and generate JWT token
export const loginUser = async (req: Request, res: Response) => {
    const { username, password } = req.body;

    const user = await User.findOne({ where: { username } });
    if (!user) {
        return { message: 'Invalid credentials' };
    }
    else {
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return { message: 'Invalid credentials' };
        }
        else {
            const token = generateToken(user.user_id);
            return { message: 'Login successful', token };
        }
    }
};

// GET /me - Get the logged-in user's details
export const getCurrentUser = async (req: Request, res: Response) => {
    const user = await User.findByPk(req.body.userId, {
        attributes: ['user_id', 'username', 'email', 'profile_pic', 'created_at'],
        include: [
            {
                model: Post,
                attributes: ['post_id', 'title', 'content', 'created_at'],
                order: [['created_at', 'DESC']],
                include: [
                    {
                        model: Vote,
                        attributes: ['vote_id', 'vote_type', 'kategori_type'],
                        required: false
                    }
                ]
            },
            {
                model: Comment,
                attributes: ['comment_id', 'content', 'created_at', 'post_id'],
                order: [['created_at', 'DESC']],
                include: [
                    {
                        model: Vote,
                        attributes: ['vote_id', 'vote_type', 'kategori_type'],
                        required: false
                    },
                    {
                        model: Post,
                        attributes: ['post_id', 'title', 'content', 'created_at'],
                        required: false
                    }
                ]
            },
            {
                model: SubredditMember,
                as: 'joinedSubreddits',
                include: [
                    {
                        model: Subreddit,
                        attributes: ['subreddit_id', 'name', 'title', 'description']
                    }
                ]
            }
        ]
    });
    if (!user) {
        return { message: 'User not found' };
    }

    const upvoted = await Vote.findAll({
        where: { user_id: req.body.userId, vote_type: true },
        include: [
            {
                model: Post,
                required: false,
                attributes: ['post_id', 'title', 'content', 'created_at'],
            },
            {
                model: Comment,
                required: false,
                attributes: ['comment_id', 'content', 'created_at', 'post_id'],
                include: [
                    {
                        model: Post,
                        attributes: ['post_id', 'title', 'content', 'created_at'],
                        required: false
                    }
                ]
            },
        ],
        order: [['created_at', 'DESC']],
    });
    const downvoted = await Vote.findAll({
        where: { user_id: req.body.userId, vote_type: false },
        include: [
            {
                model: Post,
                required: false,
                attributes: ['post_id', 'title', 'content', 'created_at'],
            },
            {
                model: Comment,
                required: false,
                attributes: ['comment_id', 'content', 'created_at', 'post_id'],
                include: [
                    {
                        model: Post,
                        attributes: ['post_id', 'title', 'content', 'created_at'],
                        required: false
                    }
                ]
            },
        ],
        order: [['created_at', 'DESC']],
    });

    const userObj = user.toJSON();
    userObj.upvoted = upvoted;
    userObj.downvoted = downvoted;
    return userObj;
};

// GET /user/:id - get detail user
export const getUserById = async (req: Request, res: Response) => {
    const user = await User.findByPk(req.params.id, {
        attributes: ['user_id', 'username', 'email', 'profile_pic', 'created_at'],
        include: [
            {
                model: Post,
                attributes: ['post_id', 'title', 'content', 'created_at'],
                order: [['created_at', 'DESC']],
                include: [
                    {
                        model: Vote,
                        attributes: ['vote_id', 'vote_type', 'kategori_type'],
                        required: false
                    }
                ]
            },
            {
                model: Comment,
                attributes: ['comment_id', 'content', 'created_at'],
                order: [['created_at', 'DESC']],
                include: [
                    {
                        model: Vote,
                        attributes: ['vote_id', 'vote_type', 'kategori_type'],
                        required: false
                    }
                ]
            },
            {
                model: SubredditMember,
                as: 'joinedSubreddits',
                include: [
                    {
                        model: Subreddit,
                        attributes: ['subreddit_id', 'name', 'title', 'description']
                    }
                ]
            }
        ],
    });
    if (user) {
        return user;
    } else {
        return { message: 'User not found' };
    }
};

// PUT /me - update user profile
export const updateUserProfile = async (req: Request, res: Response) => {
    const { userId, username, email, password, newPassword, currentPassword, profilePic } = req.body;
    let imagePath: string | null = null;

    if (profilePic) {
        const matches = profilePic.match(/^data:(.+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            return { message: 'Invalid image format' };
        }

        const mimeType = matches[1];
        const base64Data = matches[2];
        const extension = mimeType.split('/')[1];
        const fileName = `${userId}.${extension}`;
        const savePath = path.join(__dirname, '../../../public/uploads', fileName);
        imagePath = `/uploads/${fileName}`;

        const uploadDir = path.join(__dirname, '../../../public/uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        fs.writeFileSync(savePath, Buffer.from(base64Data, 'base64'));
    }

    if (!userId) {
        return { message: 'User ID is required' };
    }

    const user = await User.findByPk(userId);
    if (!user) {
        return { message: 'User not found' };
    }

    if (currentPassword) {
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return { message: 'Current password is incorrect' };
        }
    }

    if (username && username.trim() !== "") {
        user.username = username;
    }

    if (email && email.trim() !== "") {
        user.email = email;
    }

    const passwordToUpdate = newPassword || password; // Prioritize newPassword
    if (passwordToUpdate && passwordToUpdate.trim() !== "") {
        const hashedPassword = await bcrypt.hash(passwordToUpdate, 10);
        user.password = hashedPassword;
    }

    if (imagePath) {
        user.profile_pic = imagePath;
    }
    await user.save();
    return {
        message: 'User profile updated successfully',
        user : {
            user_id: user.user_id,
            username: user.username,
            email: user.email,
            profile_pic: user.profile_pic,
            created_at: user.created_at
        }
    };
};

export const deleteUser = async (req: Request, res: Response) => {
    const userId = req.body.userId;

    const user = await User.findByPk(userId);
    if (!user) {
        return { message: 'User not found' };
    }

    await user.destroy();

    return { message: 'User deleted successfully' };
}

export const verifyPassword = async (req: Request, res: Response) => {
    const { password: password } = req.body;
    const userId = req.body.userId;

    if (!userId || !password) {
        return { message: 'User ID and password are required' };
    }

    const user = await User.findByPk(userId);
    if (!user) {
        return { message: 'User not found' };
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
        return { message: 'Password verified' };
    } else {
        return { message: 'Incorrect password' };
    }
};

// GET /check-username?username=... - Check if username exists
export const checkUsername = async (req: Request, res: Response) => {
    const { username } = req.query;
    if (!username || typeof username !== 'string') {
        return { message: 'Username is required' };
    }
    const user = await User.findOne({ where: { username } });
    if (user) {
        return { exists: true };
    } else {
        return { exists: false };
    }
};

// GET /user/:username - Get bundled user profile by username
export const getUserByUsername = async (req: Request, res: Response) => {
    const { username } = req.params;
    const user = await User.findOne({
        where: { username },
        attributes: ['user_id', 'username', 'email', 'profile_pic', 'created_at'],
        include: [
            {
                model: Post,
                attributes: ['post_id', 'title', 'content', 'image', 'created_at'],
                order: [['created_at', 'DESC']],
                include: [
                    {
                        model: Vote,
                        attributes: ['vote_id', 'vote_type', 'kategori_type'],
                        required: false
                    }
                ]
            },
            {
                model: Comment,
                attributes: ['comment_id', 'content', 'created_at'],
                order: [['created_at', 'DESC']],
                include: [
                    {
                        model: Vote,
                        attributes: ['vote_id', 'vote_type', 'kategori_type'],
                        required: false
                    },
                    {
                        model: Post,
                        attributes: ['post_id', 'title'], // include post title
                        required: false
                    }
                ]
            },
            {
                model: SubredditMember,
                as: 'joinedSubreddits',
                include: [
                    {
                        model: Subreddit,
                        attributes: ['subreddit_id', 'name', 'title', 'description']
                    }
                ]
            }
        ],
        order: [['created_at', 'DESC']],
    });
    if (!user) {
        return { message: 'User not found' };
    }
    const userObj = user.toJSON();
    if (userObj.comments) {
        userObj.comments = userObj.comments.map((c: any) => ({
            ...c,
            post_id: c.post ? c.post.post_id : undefined,
            post_title: c.post ? c.post.title : undefined
        }));
    }
    return userObj;
};