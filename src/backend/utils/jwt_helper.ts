import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key'; // Make sure to set this in .env

// Generate a JWT token
export const generateToken = (userId: string) => {
    return jwt.sign({ userId }, SECRET_KEY, { expiresIn: '1h' }); // Token expires in 1 hour
};


// Verify a JWT token
export const verifyToken = (token: string): jwt.JwtPayload | null => {
    try {
        return jwt.verify(token, SECRET_KEY) as jwt.JwtPayload;  // Add your token's payload type here if necessary
    } catch (err) {
        return null;
    }
};
