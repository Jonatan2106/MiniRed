import express from 'express';
import { registerUser, loginUser, getCurrentUser, getUserByUsername, updateUserProfile, deleteUser, verifyPassword, checkUsername } from '../controllers/user_controller';
import { authenticateJWT } from '../middleware/auth_middleware';
import { controllerWrapper } from '../utils/controllerWrapper';

const UserRouter = express.Router();

UserRouter.post('/register', controllerWrapper(registerUser));
UserRouter.post('/login', controllerWrapper(loginUser));
UserRouter.get('/me', authenticateJWT, controllerWrapper(getCurrentUser));
UserRouter.get('/user/:username', controllerWrapper(getUserByUsername));
UserRouter.put('/me', authenticateJWT, controllerWrapper(updateUserProfile));
UserRouter.delete('/me', authenticateJWT, controllerWrapper(deleteUser));
UserRouter.post('/verify-password', authenticateJWT, controllerWrapper(verifyPassword));
UserRouter.get('/check-username', authenticateJWT, controllerWrapper(checkUsername));

export default UserRouter;
