import express from 'express';
import { registerUser, loginUser, getCurrentUser, getUserByUsername, updateUserProfile, deleteUser, verifyPassword, checkUsername } from '../controllers/user_controller';
import { authenticateJWT } from '../middleware/auth_middleware';

const UserRouter = express.Router();

UserRouter.post('/register', registerUser);
UserRouter.post('/login', loginUser);
UserRouter.get('/me', authenticateJWT, getCurrentUser);
UserRouter.get('/user/:username', getUserByUsername);
UserRouter.put('/me', authenticateJWT, updateUserProfile);
UserRouter.delete('/me', authenticateJWT, deleteUser);
UserRouter.post('/verify-password', authenticateJWT, verifyPassword);
UserRouter.get('/check-username', authenticateJWT, checkUsername);

export default UserRouter;
