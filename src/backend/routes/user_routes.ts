import express from 'express';
import { registerUser, loginUser, getCurrentUser } from '../controllers/user_controller';
import { authenticateJWT } from '../middleware/auth_middleware';

const UserRouter = express.Router();

UserRouter.post('/register', registerUser);
UserRouter.post('/login', loginUser);
UserRouter.get('/me', authenticateJWT, getCurrentUser);

export default UserRouter;
