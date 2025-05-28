import React from 'react';
import { useNavigate } from 'react-router-dom';
import './RightSidebar.css';

interface Subreddit {
  subreddit_id: string;
  name: string;
  title: string;
  description: string;
  created_at: string;
  user: {
    user_id: string;
    username: string;
    profile_pic: string | null;
  };
}

interface RightSidebarProps {
  joinedSubreddits: Subreddit[];
}

const RightSidebar: React.FC<RightSidebarProps> = ({ joinedSubreddits }) => {
  const navigate = useNavigate();

  return (
    <div className="right-sidebar">
      <div className="joined-communities">
        <h3>Joined Subreddits</h3>
        <ul>
          {joinedSubreddits.length > 0 ? (
            joinedSubreddits.map((subreddit) => (
              <li key={subreddit.subreddit_id}>
                <div className="community-icon">{subreddit.name[0].toUpperCase()}</div>
                <span
                  className="community-link"
                  onClick={() => navigate(`/r/${subreddit.name}`)}
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') navigate(`/r/${subreddit.name}`);
                  }}
                  aria-label={`Go to r/${subreddit.name}`}
                >
                  r/{subreddit.name}
                </span>
              </li>
            ))
          ) : (
            <li>No joined subreddit yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default RightSidebar;