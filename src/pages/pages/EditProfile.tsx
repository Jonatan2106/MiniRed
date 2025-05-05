import React, { useState, useEffect } from "react";
import { FaHome, FaCompass, FaFire } from 'react-icons/fa';
import Loading from './Loading';
import "../styles/editprofile.css";
import "../styles/main.css";

interface User {
  user_id: string;
  username: string;
  profilePic: string;
}

const EditProfile = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    username: string;
    email: string;
    password: string;
    profilePic: string | File; // Allow both string and File
  }>({
    username: "",
    email: "",
    password: "",
    profilePic: "",
  });
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{
    username: string;
    email: string;
    password: string;
    profilePic: string;
  } | null>(null);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
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
    username: 'Changing your username will affect your log in.',
    email: 'Update your email address.',
    password: 'Changing your password will affect how you log in.',
    propic: 'Upload or change your profile picture.',
  };

  // Inside the Home component
  useEffect(() => {
    try {
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
            setUser({
              username: data.username,
              email: data.email,
              password: data.password,
              profilePic: data.profilePic,
            });
            setFormData({
              username: data.username,
              email: data.email,
              password: data.password,
              profilePic: data.profilePic,
            });
          })
          .catch((error) => console.error("Error fetching user data:", error))
          .finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
      if (popupType && inputValue !== "") {
        setFormData((prev) => ({
          ...prev,
          [popupType === "propic" ? "profilePic" : popupType]: inputValue,
        }));
      }
    } catch (error) {
      console.error("Error in useEffect:", error);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    window.location.href = "/";
  };

  const toggleDropdown = () => {
    setDropdownOpen((prev) => !prev);
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("You must be logged in to update your profile.");
        return;
      }

      const payload = new FormData();
      payload.append("username", formData.username);
      payload.append("email", formData.email);
      payload.append("password", formData.password);
      if (formData.profilePic instanceof File) {
        payload.append("profilePic", formData.profilePic);
      }

      const response = await fetch("http://localhost:5000/api/me", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: payload,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile.");
      }

      const updatedUser = await response.json();
      setUser(updatedUser.user || updatedUser);
      setFormData({
        username: updatedUser.username,
        email: updatedUser.email,
        password: updatedUser.password,
        profilePic: updatedUser.profilePic,
      });
      setPopupType(null);
      setInputValue('');
      setError(null);
    } catch (error: any) {
      console.error("Error updating profile:", error.message);
      setError(error.message || "Unexpected error");
    }
  };


  if (error) {
    return <div>Error: {error}</div>;
  }

  if (isLoading) {
    return <Loading />;
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
          {isLoggedIn && (
            <>
              <div className="profile-menu">
                <img
                  src={user?.profilePic || "/default.png"}
                  className="profile-pic"
                  onClick={toggleDropdown}
                />
                {isDropdownOpen && (
                  <div className="dropdown-menu">
                    <a href="/profile" className="dropdown-item">{user?.username}</a>
                    <a href="/edit" className="dropdown-item">Edit</a>
                    <a onClick={handleLogout} className="dropdown-item logout">Logout</a>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </nav>

      {/* Main content */}
      <div className="main-content">
        {/* Left Sidebar */}
        <div className="left-sidebar">
          <h2 className="title">Menu</h2>
          <ul>
            <li>
              <FaHome className="icon" />
              <a href="/">Home</a>
            </li>
            <li>
              <FaCompass className="icon" />
              <a href="/explore">Explore</a>
            </li>
            <li>
              <FaFire className="icon" />
              <a href="/popular">Popular</a>
            </li>
          </ul>
        </div>

        {/* Edit Profile Section */}
        <div className="edit-profile-wrapper">
          <h3>Edit Profile</h3>
          <div className="profile-form">
            <div className="user" onClick={() => setPopupType('username')}>
              <div className="form-group">
                <h4>Username</h4>
                <p>Change your username. This will affect your log in.</p>
              </div>
              <div className="panah">&gt;</div>
            </div>

            <div className="email" onClick={() => setPopupType('email')}>
              <div className="form-group">
                <h4>Email</h4>
                <p>Update your email address.</p>
              </div>
              <div className="panah">&gt;</div>
            </div>

            <div className="password" onClick={() => setPopupType('password')}>
              <div className="form-group">
                <h4>Password</h4>
                <p>Change your password. This will affect your log in.</p>
              </div>
              <div className="panah">&gt;</div>
            </div>

            <div className="propic" onClick={() => setPopupType('propic')}>
              <div className="form-group">
                <h4>Profile Picture</h4>
                <p>Upload or change your profile picture.</p>
              </div>
              <div className="panah">&gt;</div>
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
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setFormData((prev) => ({
                            ...prev,
                            profilePic:  user?.profilePic || "", // Assign the File object
                          }));
                        }
                      }}
                    />
                  ) : (
                    <input
                      className="modal-input"
                      type={popupType === 'password' ? 'password' : 'text'}
                      placeholder={`Enter new ${titles[popupType]}`}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                    />
                  )}

                  <div className="modal-actions">
                    <button className="cancel-btn" onClick={closePopup}>Cancel</button>
                    <button
                      className="save-btn"
                      onClick={handleSubmit}
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
