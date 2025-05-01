import React, { useState, useEffect } from "react";
import { AiOutlinePlusCircle } from "react-icons/ai";
import "../styles/editprofile.css";
import "../styles/main.css"; 

interface User {
  user_id: string;
  username: string;
  profilePic: string;
}

const EditProfile = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    profilePic: null,
  });
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{
    username: string;
    profilePic: string;
  } | null>(null);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [users, setUsers] = useState<Map<string, User>>(new Map());
  const [popupType, setPopupType] = useState<'username' | 'email' | 'password' | 'propic' | null>(null);
  const [inputValue, setInputValue] = useState('');
  const closePopup = () => {
    setPopupType(null);
    setInputValue('');
  };

  const titles = {
    username: 'Username',
    email: 'Email',
    password: 'Password',
    propic: 'Profile Picture',
  };

  const descriptions = {
    username: 'Changing your username will affect your login.',
    email: 'Update your email address.',
    password: 'Changing your password will affect how you log in.',
    propic: 'Upload or change your profile picture.',
  };

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

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    window.location.href = "/";
  };

  const toggleDropdown = () => {
    setDropdownOpen((prev) => !prev);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalType(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // if (e.target.files) {
    //   setFormData({ ...formData, profilePic: e.target.files[0] });
    // }
  };

  const handleSubmit = () => {
    console.log("Form Data Submitted:", formData);
    closeModal();
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
                  src={user?.profilePic || "/default.png"}
                  className="profile-pic"
                  onClick={toggleDropdown}
                />
                {isDropdownOpen && (
                  <div className="dropdown-menu enhanced-dropdown">
                    <a href="/profile" className="dropdown-item">Profile</a>
                    <a href="/edit" className="dropdown-item">Edit</a>
                    <a onClick={handleLogout} className="dropdown-item logout">Logout</a>
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
            <div className="user" onClick={() => setPopupType('username')}>
              <div className="form-group">
                <h4>Username</h4>
                <p>If you change username, you will Login with new Username</p>
              </div>
              <div className="panah">
                <p>&gt;</p>
              </div>
            </div>

            <div className="email" onClick={() => setPopupType('email')}>
              <div className="form-group">
                <h4>Email</h4>
                <p>You can change your email here</p>
              </div>
              <div className="panah">
                <p>&gt;</p>
              </div>
            </div>

            <div className="password" onClick={() => setPopupType('password')}>
              <div className="form-group">
                <h4>Password</h4>
                <p>If you change Password, you will Login with new Password</p>
              </div>
              <div className="panah">
                <p>&gt;</p>
              </div>
            </div>

            <div className="propic" onClick={() => setPopupType('propic')}>
              <div className="form-group">
                <h4>Profile Picture</h4>
                <p>You can add or edit your Profile Picture in here</p>
              </div>
              <div className="panah">
                <p>&gt;</p>
              </div>
            </div>

            {popupType && (
              <div className="overlay" onClick={closePopup}>
                <div className="modal" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3>{titles[popupType]}</h3>
                  </div>
                  <p className="modal-subtext">{descriptions[popupType]}</p>

                  {popupType === 'propic' ? (
                    <input
                      type="file"
                      className="modal-input"
                    // onChange={(e) => alert(`Selected file: ${e.target.files[0].name}`)}
                    />
                  ) : (
                    <>
                      <input
                        className="modal-input"
                        type={popupType === 'password' ? 'password' : 'text'}
                        placeholder={modalType === 'email' ? 'Enter new email' : `Enter new ${titles[popupType]}`}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                      />
                    </>
                  )}

                  <div className="modal-actions">
                    <button className="cancel-btn" onClick={closePopup}>Cancel</button>
                    <button
                      className="save-btn"
                      onClick={() => {
                        alert(`Saved ${popupType}: ${inputValue}`);
                        closePopup();
                      }}
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Modal */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Edit {modalType}</h3>
              {modalType === "username" && (
                <input
                  type="text"
                  name="username"
                  placeholder="Enter new username"
                  value={formData.username}
                  onChange={handleInputChange}
                />
              )}
              {modalType === "email" && (
                <input
                  type="email"
                  name="email"
                  placeholder="Enter new email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              )}
              {modalType === "password" && (
                <input
                  type="password"
                  name="password"
                  placeholder="Enter new password"
                  value={formData.password}
                  onChange={handleInputChange}
                />
              )}
              {modalType === "profilePic" && (
                <input
                  type="file"
                  name="profilePic"
                  onChange={handleFileChange}
                />
              )}
              <div className="modal-actions">
                <button onClick={handleSubmit}>Save</button>
                <button onClick={closeModal}>Cancel</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default EditProfile;
