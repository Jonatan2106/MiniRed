import { Router } from 'express';
import { searchPosts } from '../controllers/search_controller';

const SearchRouter = Router();

// Search for posts by keyword
SearchRouter.get('/search', searchPosts);

export default SearchRouter;
