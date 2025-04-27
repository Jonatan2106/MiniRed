// import { Request, Response, NextFunction } from 'express';
// import { verifyToken } from '../utils/jwt_helper';
// // import jwt from 'jsonwebtoken';
// import { UUIDTypes } from 'uuid';

// interface JwtPayloadWithUserId {
//     userId: string | UUIDTypes;
// }

// export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
//     const token = req.headers['authorization']?.split(' ')[1];  // Token from 'Authorization: Bearer token'

//     if (!token) {
//         res.status(403).json({ message: 'No token provided' });
//     }
//     else {
//         const decoded = verifyToken(token);

//         if (!decoded) {
//             res.status(401).json({ message: 'Invalid or expired token' });
//         }
//         else {
//             // const { userId } = decoded as JwtPayloadWithUserId;
//             const { userId } = decoded as JwtPayloadWithUserId;
//             req.body.userId = userId;  // Store the userId in req.body

//             next(); // Continue to the next middleware or route handler
//         }
//     }
// };

import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt_helper';
import { UUIDTypes } from 'uuid';

interface JwtPayloadWithUserId {
  userId: string | UUIDTypes;
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  // Get the token from the Authorization header
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    // No token provided, send error and proceed
    res.status(403).json({ message: 'No token provided' });
    return; // Exit the middleware if there's no token
  }

  // Verify the token using your custom verifyToken function
  const decoded = verifyToken(token);

  if (!decoded) {
    // Invalid or expired token, send error and proceed
    res.status(401).json({ message: 'Invalid or expired token' });
    return; // Exit the middleware if the token is invalid
  }

  // Extract userId from the decoded JWT payload
  const { userId } = decoded as JwtPayloadWithUserId;

  // Store userId in req.body so it can be used in the next middleware or route handler
  req.body.userId = userId;

  // Call next to pass control to the next middleware or route handler
  next();
};
