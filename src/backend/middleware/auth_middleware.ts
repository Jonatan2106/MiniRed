import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt_helper';
import jwt from 'jsonwebtoken';

interface JwtPayloadWithUserId extends jwt.JwtPayload {
    userId: string; // or string | number depending on your userId type
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers['authorization']?.split(' ')[1];  // Token from 'Authorization: Bearer token'

    if (!token) {
        res.status(403).json({ message: 'No token provided' });
    }
    else {
        const decoded = verifyToken(token);
        if (!decoded) {
            res.status(401).json({ message: 'Invalid or expired token' });
        }
        else {
            req.body.user_ID = decoded.userId;  // Store the userId in req.body
            next();
        }
    }
};

