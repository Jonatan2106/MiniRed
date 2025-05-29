import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt_helper';
import { UUIDTypes } from 'uuid';
import { middlewareWrapper } from '../utils/middlewareWrapper';

interface JwtPayloadWithUserId {
    userId: string | UUIDTypes;
}

export const Authentication = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return next({ status: 403, message: 'No token provided' });
    }
    else {
        const decoded = verifyToken(token);

        if (!decoded) {
            return next({ status: 401, message: 'Invalid or expired token' });
        }
        else {
            const { userId } = decoded as JwtPayloadWithUserId;

            if (!req.body) {
                req.body = {};
            }

            req.body.userId = userId;
            
        }
    }
};

export const authenticateJWT = middlewareWrapper(Authentication);

