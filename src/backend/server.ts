import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Sequelize } from 'sequelize-typescript';
import { Comment } from '../../models/comment';
import { Post } from '../../models/post';
import { SubredditMember } from '../../models/subreddit_member';
import { Subreddit } from '../../models/subreddit';
import { User } from '../../models/user';
import { Vote } from '../../models/vote';
import PostRouter from './routes/post_routes';
import userRouter from './routes/user_routes';
import voteRouter from './routes/vote_routes';
import subredditRouter from './routes/subreddit_routes';
import commentRouter from './routes/comment_routes';
import { authenticateJWT } from './middleware/auth_middleware';

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 5000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
// app.use(cors({ origin: ['http://172.16.202.41:5173', 'http://localhost:5173'] }));
app.use(cors({ origin: '*' }));

// Sequelize setup
const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD, 
    models: [Comment, Post, SubredditMember, Subreddit, User, Vote], 
  });

// Test database connection
sequelize.authenticate()
  .then(() => console.log('Database connected successfully!'))
  .catch(err => {
    console.error('Database connection failed. Please check the credentials and database server:', err);
    process.exit(1);
  });

// API routes
app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// Prefix all post routes with '/api'
app.use('/api', PostRouter);
app.use('/api', userRouter);
app.use('/api', voteRouter);
app.use('/api', subredditRouter); 
app.use('/api', commentRouter);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on http://${process.env.DB_HOST}:${port}`);
  console.log(`You can also access it at http://localhost:${port}`);
});
