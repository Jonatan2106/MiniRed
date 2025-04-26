import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response } from 'express';
import { User } from '../../../models/user';
import { generateToken } from '../utils/jwt_helper';

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
        const { email, password } = req.body;

        // Find the user by email
        const user = await User.findOne({ where: { email } });
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
        const user = await User.findByPk(req.params.id, { include: ['post'] });
        if (user) {
            res.json(user.posts);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch user posts' });
    }
};

// GET /user/:id/comments - get user comments
export const getUserComments = async (req: Request, res: Response) => {
    try {
        const user = await User.findByPk(req.params.id, { include: ['comment'] });
        if (user) {
            res.json(user.comments);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch user comments' });
    }
}

// PUT /user/me - update user profile
export const updateUserProfile = async (req: Request, res: Response) => {
    try {
        const user = await User.findByPk(req.body.user.id); // Assuming user ID is in req.body.user
        if (user) {
            const { username, email, password } = req.body;
            if (password) {
                // Hash the new password before saving to the database
                const hashedPassword = await bcrypt.hash(password, 10);
                user.password = hashedPassword;
            }
            user.username = username || user.username;
            user.email = email || user.email;
            await user.save();
            res.json({ message: 'User profile updated successfully!', user });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update user profile' });
    }
}