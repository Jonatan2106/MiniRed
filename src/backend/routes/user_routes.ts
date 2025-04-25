import express from 'express';
import { registerUser, loginUser, getCurrentUser, getUserById, getUserPosts, getUserComments, updateUserProfile } from '../controllers/user_controller';
import { authenticateJWT } from '../middleware/auth_middleware';

const UserRouter = express.Router();

UserRouter.post('/register', registerUser);
UserRouter.post('/login', loginUser);
UserRouter.get('/me', authenticateJWT, getCurrentUser);
UserRouter.get('/user/:id', getUserById);
UserRouter.get('/user/:id/post', getUserPosts); 
UserRouter.get('/user/:id/comment', getUserComments);
UserRouter.put('/user/me', updateUserProfile);

export default UserRouter;
