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
    try {
        const { username, email, password } = req.body;
        const user_id = uuidv4();
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({ user_id, username, email, password: hashedPassword });
        res.status(201).json({ message: 'User registered successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to register user' });
    }
};

// POST /login - Login user and generate JWT token
export const loginUser = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        // Find the user by email
        const user = await User.findOne({ where: { username } });
        if (!user) {
            res.status(401).json({ message: 'Invalid credentials' });
        }
        else {

            // Compare the hashed password with the input password
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                res.status(401).json({ message: 'Invalid credentials' });
            }
            else {
                // Generate a JWT token
                const token = generateToken(user.user_id);

                // Send the token to the client
                res.json({ message: 'Login successful', token });
            }
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Login failed' });
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
        res.status(404).json({ message: 'User not found' });
        return;
    }

    // Fetch upvoted and downvoted content
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

    // Convert user to plain object and add upvoted/downvoted
    const userObj = user.toJSON();
    userObj.upvoted = upvoted;
    userObj.downvoted = downvoted;

    res.json(userObj);
};

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const posts = await User.findAll({
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
            order: [['created_at', 'DESC']],
        });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching posts', error: err });
    }
};

// GET /user/:id - get detail user
export const getUserById = async (req: Request, res: Response) => {
    try {
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
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch user' });
    }
};

// GET /user/:id/posts - get user posts
export const getUserPosts = async (req: Request, res: Response) => {
    try {
        const userId = req.params.id;

        const posts = await Post.findAll({
            where: { user_id: userId },
            include: [
                {
                    model: User,
                    attributes: ['user_id', 'username'],
                },
            ],
            order: [['created_at', 'DESC']],
        });

        res.status(200).json(posts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch user posts' });
    }
};

// GET /user/:id/comments - get user comments
export const getUserComments = async (req: Request, res: Response) => {
    try {
        const userId = req.params.id;

        const comments = await Comment.findAll({
            where: { user_id: userId },
            include: [
                {
                    model: User,
                    attributes: ['user_id', 'username'],
                },
            ],
            order: [['created_at', 'DESC']],
        });

        res.status(200).json(comments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch user comments' });
    }
}

// PUT /me - update user profile
export const updateUserProfile = async (req: Request, res: Response) => {
    try {
        const { userId, username, email, password, newPassword, currentPassword, profilePic } = req.body;
        let imagePath: string | null = null;

        if (profilePic) {
            const matches = profilePic.match(/^data:(.+);base64,(.+)$/);
            if (!matches || matches.length !== 3) {
                res.status(400).json({ message: 'Invalid image format' });
                return;
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
            res.status(400).json({ message: 'User ID is required' });
            return;
        }

        const user = await User.findByPk(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        if (currentPassword) {
            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isCurrentPasswordValid) {
                res.status(401).json({ message: 'Current password is incorrect' });
                return;
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
            console.log('Updating password with:', passwordToUpdate);
            const hashedPassword = await bcrypt.hash(passwordToUpdate, 10);
            user.password = hashedPassword;
            console.log('Password hashed and updated');
        }

        console.log('Image path:', imagePath);
        if (imagePath) {
            user.profile_pic = imagePath;
        }
        await user.save();
        res.status(200).json({
            message: 'User profile updated successfully',
            user: {
            userId: user.user_id,
            username: user.username,
            email: user.email,
            profilePic: user.profile_pic
            }
        });

    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ message: 'Failed to update user profile' });
    }
};

// Get all posts from the logged-in user
export const getAllPosts = async (req: Request, res: Response) => {
    try {
        const userId = req.body.userId; // Get user_id from the request (token payload)

        const posts = await Post.findAll({
            where: { user_id: userId },
            include: [
                {
                    model: User,
                    attributes: ['user_id', 'username'],
                },
            ],
            order: [['created_at', 'DESC']],
        });

        res.status(200).json(posts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to get user posts' });
    }
};

// Get all comments from the logged-in user
export const getAllComments = async (req: Request, res: Response) => {
    try {
        const userId = req.body.userId; // Get user_id from the request (token payload)

        const comments = await Comment.findAll({
            where: { user_id: userId },
            include: [
                {
                    model: User,
                    attributes: ['user_id', 'username'],
                },
            ],
            order: [['created_at', 'DESC']],
        });

        res.status(200).json(comments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to get user comments' });
    }
};
// Get all downvotes from the logged-in user
export const getAllDownVotes = async (req: Request, res: Response) => {
    try {
        const userId = req.body.userId; // Get user_id from the request (token payload)

        const downVotes = await Vote.findAll({
            where: { user_id: userId, vote_type: false }, // false = downvote
            include: [
                {
                    model: Post,
                    required: false, // Include only if the vote is related to a post
                    attributes: ['post_id', 'title', 'content', 'created_at'],
                },
                {
                    model: Comment,
                    required: false, // Include only if the vote is related to a comment
                    attributes: ['comment_id', 'content', 'created_at'],
                },
            ],
            order: [['created_at', 'DESC']],
        });

        res.status(200).json(downVotes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to get user downvotes' });
    }
};

// Get all upvotes from the logged-in user
export const getAllUpVotes = async (req: Request, res: Response) => {
    try {
        const userId = req.body.userId; // Get user_id from the request (token payload)

        const upVotes = await Vote.findAll({
            where: { user_id: userId, vote_type: true }, // true = upvote
            include: [
                {
                    model: Post,
                    required: false, // Include only if the vote is related to a post
                    attributes: ['post_id', 'title', 'content', 'created_at'],
                },
                {
                    model: Comment,
                    required: false, // Include only if the vote is related to a comment
                    attributes: ['comment_id', 'content', 'created_at'],
                },
            ],
            order: [['created_at', 'DESC']],
        });

        res.status(200).json(upVotes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to get user upvotes' });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const userId = req.body.userId;

        // Find the user by ID
        const user = await User.findByPk(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return
        }

        // Delete the user
        await user.destroy();

        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to delete user' });
    }
}

export const verifyPassword = async (req: Request, res: Response) => {
    try {
        const { password: password } = req.body;
        const userId = req.body.userId;
        console.log('User ID:', userId);
        console.log('Password:', password);
        if (!userId || !password) {
            res.status(400).json({ message: 'User ID and password are required' })
            return;
        }

        const user = await User.findByPk(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' })
            return;
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            res.status(200).json({ message: 'Password verified' })
            return;
        } else {
            res.status(401).json({ message: 'Incorrect password' })
            return;
        }
    } catch (error) {
        console.error('Error verifying password:', error);
        res.status(500).json({ message: 'Failed to verify password' });
    }
};

// GET /check-username?username=... - Check if username exists
export const checkUsername = async (req: Request, res: Response) => {
    try {
        const { username } = req.query;
        if (!username || typeof username !== 'string') {
            res.status(400).json({ message: 'Username is required' });
        }
        const user = await User.findOne({ where: { username } });
        if (user) {
            res.json({ exists: true });
        } else {
            res.json({ exists: false });
        }
    } catch (error) {
        console.error('Error checking username:', error);
        res.status(500).json({ message: 'Failed to check username' });
    }
};

// GET /user/:username - Get bundled user profile by username
export const getUserByUsername = async (req: Request, res: Response) => {
    try {
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
            res.status(404).json({ message: 'User not found' });
            return;
        }
        // Convert to plain object
        const userObj = user.toJSON();
        // For each comment, flatten post_id and post title
        if (userObj.comments) {
            userObj.comments = userObj.comments.map((c: any) => ({
                ...c,
                post_id: c.post ? c.post.post_id : undefined,
                post_title: c.post ? c.post.title : undefined
            }));
        }
        res.json(userObj);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch bundled user profile' });
    }
};