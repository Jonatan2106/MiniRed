import express from 'express';
import { searchContent} from '../controllers/search_controller';
// import { authenticateJWT } from '../middleware/auth_middleware';

const SearchRouter = express.Router();

SearchRouter.get('/search', searchContent);

export default SearchRouter;
