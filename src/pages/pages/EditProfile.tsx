import React, { useState, useEffect } from "react";
import "../styles/editprofile.css";

interface Post {
  post_id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
}

interface User {
  user_id: string;
  username: string;
  profilePic: string;
}

export interface Subreddit {
  subreddit_id: string;
  name: string;
  title: string;
  description: string;
}

const EditProfile = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [joinedSubreddits, setJoinedSubreddits] = useState<Subreddit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{
    username: string;
    profilePic: string;
  } | null>(null);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [users, setUsers] = useState<Map<string, User>>(new Map());

  // Inside the Home component
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
      fetch("http://localhost:5000/api/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          setUser({ username: data.username, profilePic: data.profilePic });
        })
        .catch((error) => console.error("Error fetching user data:", error));
    }

    fetch("http://localhost:5000/api/posts")
      .then((response) => response.json())
      .then((data) => setPosts(data))
      .catch((error) => setError("Error fetching posts"));

    fetch("http://localhost:5000/api/users/subreddits", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        setJoinedSubreddits(data);
      })
      .catch((error) =>
        console.error("Error fetching joined communities:", error)
      );

    fetch("http://localhost:5000/api/user/all")
      .then((response) => response.json())
      .then((data) => {
        const userMap = new Map();
        data.forEach((user: User) => {
          userMap.set(user.user_id, user);
        });
        setUsers(userMap);
      })
      .catch((error) => console.error("Error fetching users:", error));
  }, []);

  const handleCreatePost = () => {
    window.location.href = "/create-post";
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    window.location.href = "/";
  };

  const toggleDropdown = () => {
    setDropdownOpen((prev) => !prev);
  };

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="home-wrapper">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-left">
          <div className="logo">
            <a className="app-title" href="/">MiniRed</a>
          </div>
        </div>
        <div className="navbar-right">
          {isLoggedIn ? (
            <>
              <div className="profile-menu">
                <img
                  src={user?.profilePic || "/default-profile.png"}
                  className="profile-pic"
                  onClick={toggleDropdown}
                  alt={user?.username.toUpperCase()}
                />
                {isDropdownOpen && (
                  <div className="dropdown-menu">
                    <a href="/profile">Profile</a>
                    <a onClick={handleLogout}>Logout</a>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <a className="nav-link" href="/login">
                Login
              </a>
              <a className="nav-link" href="/register">
                Register
              </a>
            </>
          )}
        </div>
      </nav>

      {/* Main content */}
      <div className="main-content">
        {/* Left Sidebar */}
        <div className="left-sidebar">
          <h2 className="title">Navigation</h2>
          <ul>
            <li>
              <a href="/">Home</a>
            </li>
            <li>
              <a href="/popular">Popular</a>
            </li>
          </ul>
        </div>

        {/* Main Sidebar */}
        <div className="edit-profile-wrapper">
          <h3>Edit Profile</h3>
          <div className="profile-form">
            <div className="user">
              <div className="form-group">
                <h4>Username</h4>
                <p>If you change username, you will Login with new Username</p>
              </div>
              <div className="panah">
                <p>&gt;</p>
              </div>
            </div>
            <div className="email">
              <div className="form-group">
                <h4>Email</h4>
                <p>You can change your email here</p>
              </div>
              <div className="panah">
                <p>&gt;</p>
              </div>
            </div>
            <div className="password">
              <div className="form-group">
                <h4>Password</h4>
                <p>If you change Password, you will Login with new Password</p>
              </div>
              <div className="panah">
                <p>&gt;</p>
              </div>
            </div>
            <div className="propic">
              <div className="form-group">
                <h4>Profile Picture</h4>
                <p>You can add or edit your Profile Picture in here</p>
              </div>
              <div className="panah">
                <p>&gt;</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
