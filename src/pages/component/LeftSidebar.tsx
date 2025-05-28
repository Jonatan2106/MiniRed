import React from 'react';
import { FaHome, FaCompass, FaFire } from 'react-icons/fa';
import { AiOutlinePlusCircle } from 'react-icons/ai';
import { useNavigate, useLocation } from 'react-router-dom';
import './LeftSidebar.css';

interface LeftSidebarProps {
  isProfilePage: boolean;
  joinedSubreddits: any[];
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ isProfilePage, joinedSubreddits }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <>
      {isProfilePage ? (
        <div className="left-sidebar home">
          <h2 className="title">Menu</h2>
          <ul>
            <li
              className={location.pathname === '/' ? 'active' : ''}
              onClick={() => navigate('/')}
              style={{ cursor: 'pointer' }}
            >
              <FaHome className="icon" /><span>Home</span>
            </li>
            <li
              className={location.pathname === '/explore' ? 'active' : ''}
              onClick={() => navigate('/explore')}
              style={{ cursor: 'pointer' }}
            >
              <FaCompass className="icon" /><span>Explore</span>
            </li>
            <li
              className={location.pathname === '/popular' ? 'active' : ''}
              onClick={() => navigate('/popular')}
              style={{ cursor: 'pointer' }}
            >
              <FaFire className="icon" /><span>Popular</span>
            </li>
          </ul>
          
          <h2 className="title">Subreddits</h2>
          <ul>
            <li>
              <AiOutlinePlusCircle className="icon" />
              <a href="/create-subreddit">Create a subreddit</a>
            </li>
            {joinedSubreddits.length > 0 ? (
              joinedSubreddits.map((subreddit) => (
                <li key={subreddit.subreddit_id}>
                  <div className="community-icon">{subreddit.name[0].toUpperCase()}</div>
                  <a href={`/r/${subreddit.name}`}>r/{subreddit.name}</a>
                </li>
              ))
            ) : (
              <li>No joined subreddit yet.</li>
            )}
          </ul>
        </div>
      ) : (
        <div className="left-sidebar">
          <h2 className="title">Menu</h2>
          <ul>
            <li><FaHome className="icon" /><a href="/">Home</a></li>
            <li><FaCompass className="icon" /><a href="/explore">Explore</a></li>
            <li><FaFire className="icon" /><a href="/popular">Popular</a></li>
          </ul>
        </div>
      )}
    </>
  );
};

export default LeftSidebar;