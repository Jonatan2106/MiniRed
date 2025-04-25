import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { User } from '../../../models/user';
import { generateToken } from '../utils/jwt_helper';

// POST /register - Register a new user
export const registerUser = async (req: Request, res: Response) => {
    try {
        const { username, email, password } = req.body;

        // Hash the password before saving to the database
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({ username, email, password: hashedPassword });
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
                const token = generateToken(user.id);

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
export const getCurrentUser = (req: Request, res: Response) => {
    res.json(req.body.user);  // Assuming user info is in req.body (from middleware)
};
