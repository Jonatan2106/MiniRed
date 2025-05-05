import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response } from 'express';
import { User } from '../../../models/user';
import { Comment } from '../../../models/comment';
import { Post } from '../../../models/post';
import { generateToken } from '../utils/jwt_helper';
import { Vote } from '../../../models/vote'; // Assuming you have a Vote model defined
import { Subreddit } from '../../../models/subreddit';
import { c } from 'vite/dist/node/moduleRunnerTransport.d-DJ_mE5sf';

// POST /register - Register a new user
export const registerUser = async (req: Request, res: Response) => {
    try {
        const { username, email, password } = req.body;
        const user_id = uuidv4();
        // Hash the password before saving to the database
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({ user_id, username, email, password: hashedPassword });
        res.status(201).json({ message: 'User registered successfully!', user: newUser });
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
    const user = await User.findByPk(req.body.userId);
    res.json(user);  // Assuming user info is in req.body (from middleware)
};

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const posts = await User.findAll();
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching posts', error: err });
    }
};

// GET /user/:id - get detail user
export const getUserById = async (req: Request, res: Response) => {
    try {
        const user = await User.findByPk(req.params.id);
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
        const { userId, username, email, password, profilePic } = req.body;
        if (!userId) {
            return;
        }
        const user = await User.findByPk(userId);
        if (!user) {
            return;
        }
        
        if (username !== undefined || username !== "") {
            user.username = username;
        }
        else {
            user.username = user.username;
        }
        if (email !== undefined || email !== "") {
            user.email = email;
        }
        else {
            user.email = user.email;
        }
        if (password !== undefined) {
            console.log("password", password);
            const hashedPassword = await bcrypt.hash(password, 10);
            user.password = hashedPassword;
        }
        else {
            user.password = user.password;
        }
        if (profilePic !== undefined || profilePic !== "") {
            user.profile_pic = profilePic;
        }
        else {
            user.profile_pic = user.profile_pic;
        }
        console.log(user);
        await user.save();
        console.log(user);
        res.status(200).json({ message: 'User profile updated successfully', user });
    } catch (error) {
        console.error(error);
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