import express from 'express';
import { registerUser, loginUser, getCurrentUser, getUserById, getUserPosts, getUserComments, updateUserProfile, getAllUsers, getAllComments, getAllPosts, getAllUpVotes, getAllDownVotes } from '../controllers/user_controller';
import { authenticateJWT } from '../middleware/auth_middleware';

const UserRouter = express.Router();

UserRouter.post('/register', registerUser);
UserRouter.post('/login', loginUser);
UserRouter.get('/me', authenticateJWT, getCurrentUser);
UserRouter.get('/user/all', getAllUsers);
UserRouter.get('/user/:id', authenticateJWT, getUserById);
UserRouter.get('/user/:id/post', authenticateJWT, getUserPosts); 
UserRouter.get('/user/:id/comment', authenticateJWT, getUserComments);
UserRouter.put('/me', authenticateJWT, updateUserProfile);
UserRouter.get('/user/me/comments', authenticateJWT, getAllComments);
UserRouter.get('/user/me/posts', authenticateJWT, getAllPosts);
UserRouter.get('/user/me/upvoted', authenticateJWT, getAllUpVotes);
UserRouter.get('/user/me/downvoted', authenticateJWT, getAllDownVotes);

export default UserRouter;
