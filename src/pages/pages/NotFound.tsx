import { useNavigate } from 'react-router-dom';

import '../styles/notfound.css';
import '../styles/main.css';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <img
          src="/404.jpg"
          alt="Page Not Found"
          className="not-found-image"
        />
        <h1 className='error-code'>404</h1>
        <h1>Oops! Page Not Found</h1>
        <p>
          Sorry, we couldn’t find the page you were looking for. It might have been removed, renamed, or didn’t exist in the first place.
        </p>
        <button className="not-found-button" onClick={() => navigate('/')}>
          Go Back to Home
        </button>
      </div>
    </div>
  );
};

export default NotFound;