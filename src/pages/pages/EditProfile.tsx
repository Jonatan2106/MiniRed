import Loading from './Loading';
import Navbar from '../component/Navbar';

import React, { useState, useEffect } from "react";
import { User } from "../../../models/user";
import { fetchFromAPI } from "../../api/auth";
import { useNavigate } from 'react-router-dom';

import "../styles/editprofile.css";
import "../styles/main.css";

const EditProfile = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [image, setImage] = useState<File | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<null | User>(null);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [popupType, setPopupType] = useState<'username' | 'email' | 'password' | 'propic' | 'delete' | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [profile_pic, setProfilePic] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    profilePic: "" as string | File,
  });

  const closePopup = () => {
    setPopupType(null);
    setInputValue('');
    setModalError(null);
  };

  const titles = {
    username: 'Username',
    email: 'Email',
    password: 'Password',
    propic: 'Profile Picture',
    delete: 'Delete Profile'
  };

  const descriptions = {
    username: 'Changing your username will affect your log in.',
    email: 'Update your email address.',
    password: 'Changing your password will affect how you log in.',
    propic: 'Upload or change your profile picture.',
    delete: 'Deleting your profile will remove all your data permanently and cannot be reversed.'
  };

  // Icons for each card
  const icons = {
    username: '👤',
    email: '✉️',
    password: '🔒',
    propic: '📷',
    delete: '🗑️'
  };

  useEffect(() => {
    setProfilePic(user?.profile_pic || '');
  }, [user]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
      fetchFromAPI(`/me`, 'GET')
        .then((data) => {
          setUser(data);
          setFormData({
            username: data.username,
            email: data.email,
            password: data.password,
            profilePic: data.profile_pic,
          });
        })
        .catch((err) => console.error("Error fetching user data:", err))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
      navigate('/login');
    }

    if (popupType && inputValue !== "") {
      setFormData((prev) => ({
        ...prev,
        [popupType === "propic" ? "profilePic" : popupType]: inputValue,
      }));
    }
  }, []);

  useEffect(() => {
    // Auto-hide success message after 3 seconds
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    navigate('/');
  };

  const toggleDropdown = () => {
    setDropdownOpen((prev) => !prev);
  };
  
  const handleCreatePost = () => {
    navigate('/create-post');
  };
  
  const handleSearch = () => {
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("You must be logged in to update your profile.");
        return;
      }

      if (popupType !== 'delete') {
        if (!currentPassword) {
          setModalError("Please enter your current password.");
          setIsLoading(false);
          return;
        }
        const verifyRes = await fetchFromAPI(`/verify-password`, 'POST', { password: currentPassword });
        if (verifyRes.message === "Incorrect password") {
          setModalError("Current password is incorrect.");
          setIsLoading(false);
          return;
        }
      }

      if (popupType === "email" && !inputValue.includes("@")) {
        setModalError("Please enter a valid email address!");
        setIsLoading(false);
        return;
      }

      if (popupType === "username") {
        if (inputValue.trim() === "") {
          setModalError("Username cannot be empty.");
          setIsLoading(false);
          return;
        }
        
        const checkRes = await fetchFromAPI(`/check-username?username=${encodeURIComponent(inputValue)}`, 'GET');
        if (checkRes.exists && inputValue !== user?.username) {
          setModalError("Username is already taken.");
          setIsLoading(false);
          return;
        }
      }

      if (popupType === "password" && inputValue.length < 6) {
        setModalError("Password must be at least 6 characters long.");
        setIsLoading(false);
        return;
      }

      const payload: { [key: string]: any } = { currentPassword: currentPassword };

      if (popupType === 'propic' && image) {
        payload.profilePic = await toBase64(image);
      } else if (popupType === 'username') {
        payload.username = inputValue;
      } else if (popupType === 'email') {
        payload.email = inputValue;
      } else if (popupType === 'password') {
        payload.newPassword = inputValue;
      }

      const response = await fetchFromAPI(`/me`, 'PUT', payload);

      setUser(response.user);
      setFormData((prev) => ({
        ...prev,
        ...payload,
      }));
      closePopup();
      setError(null);
      setCurrentPassword('');
      setSuccessMessage(
        `Your ${
          popupType === 'propic'
            ? 'profile picture'
            : popupType && titles[popupType]
              ? titles[popupType].toLowerCase()
              : ''
        } has been updated successfully!`
      );
    } catch (err: any) {
      console.error("Error updating profile:", err.message);
      setModalError(err.message || "Unexpected error");
    } finally {
      setIsLoading(false);
    }
  };

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("You must be logged in to delete your profile.");
        return;
      }

      const res = await fetchFromAPI(`/me`, 'DELETE');
      localStorage.removeItem("token");
      navigate('/');
    } catch (err: any) {
      console.error("Error deleting profile:", err.message);
      setError(err.message || "Unexpected error");
    } finally {
      setIsLoading(false);
    }
  };

  const resetModalState = () => {
    setInputValue('');
    setCurrentPassword('');
    setModalError(null);
    setImage(null);
  };

  const openPopup = async (type: typeof popupType) => {
    setActiveCard(type as string);
    resetModalState();
    setPopupType(type);
    if (type === 'username' || type === 'email' || type === 'password') {
      const res = await fetchFromAPI(`/me`, 'GET');
      setUser(res);
      if (type === 'username') setInputValue(res.username);
      if (type === 'email') setInputValue(res.email);
    }
  };

  if (error) return <div>Error: {error}</div>;
  if (isLoading) return <Loading />;

  return (
    <div className="home-wrapper">
      <Navbar
        isLoggedIn={isLoggedIn}
        user={user}
        shouldHideSearch={true}
        shouldHideCreate={true}
        query={query}
        setQuery={setQuery}
        isDropdownOpen={isDropdownOpen}
        toggleDropdown={toggleDropdown}
        handleLogout={handleLogout}
        handleCreatePost={handleCreatePost}
        handleSearch={handleSearch}
      />
      
      <div className="main-content">
        <div className="feed">
          <div className="edit-profile-wrapper">
            <div className="edit-profile-header">
              <h1>Edit Profile</h1>
              <button className="profile-page-back-button" onClick={() => navigate(-1)}>
                Back
              </button>
            </div>
            
            {successMessage && (
              <div className="success-message">
                <div className="success-icon">✓</div>
                <div className="success-text">{successMessage}</div>
              </div>
            )}
            
            <div className="profile-form">
              <div 
                className={`form-card ${activeCard === 'username' ? 'active' : ''}`} 
                onClick={() => openPopup('username')}
                onMouseEnter={() => setActiveCard('username')}
                onMouseLeave={() => setActiveCard(null)}
              >
                <div className="form-card-icon">{icons.username}</div>
                <div className="form-card-content">
                  <h4 className="form-card-title">Username</h4>
                  <p className="form-card-description">{descriptions.username}</p>
                  <p className="form-card-value">{user?.username}</p>
                </div>
                <div className="form-card-arrow">&rarr;</div>
              </div>

              <div 
                className={`form-card ${activeCard === 'email' ? 'active' : ''}`} 
                onClick={() => openPopup('email')}
                onMouseEnter={() => setActiveCard('email')}
                onMouseLeave={() => setActiveCard(null)}
              >
                <div className="form-card-icon">{icons.email}</div>
                <div className="form-card-content">
                  <h4 className="form-card-title">Email</h4>
                  <p className="form-card-description">{descriptions.email}</p>
                  <p className="form-card-value">{user?.email}</p>
                </div>
                <div className="form-card-arrow">&rarr;</div>
              </div>

              <div 
                className={`form-card ${activeCard === 'password' ? 'active' : ''}`} 
                onClick={() => openPopup('password')}
                onMouseEnter={() => setActiveCard('password')}
                onMouseLeave={() => setActiveCard(null)}
              >
                <div className="form-card-icon">{icons.password}</div>
                <div className="form-card-content">
                  <h4 className="form-card-title">Password</h4>
                  <p className="form-card-description">{descriptions.password}</p>
                  <p className="form-card-value">••••••••</p>
                </div>
                <div className="form-card-arrow">&rarr;</div>
              </div>

              <div 
                className={`form-card ${activeCard === 'propic' ? 'active' : ''}`} 
                onClick={() => openPopup('propic')}
                onMouseEnter={() => setActiveCard('propic')}
                onMouseLeave={() => setActiveCard(null)}
              >
                <div className="form-card-icon">{icons.propic}</div>
                <div className="form-card-content">
                  <h4 className="form-card-title">Profile Picture</h4>
                  <p className="form-card-description">{descriptions.propic}</p>
                </div>
                <div className="form-card-preview">
                  <img 
                    src={user?.profile_pic ? `${import.meta.env.VITE_URL}${user.profile_pic}` : "/default.png"}
                    alt="Profile" 
                    className="form-card-profile-pic"
                  />
                </div>
                <div className="form-card-arrow">&rarr;</div>
              </div>

              <div 
                className={`form-card delete-card ${activeCard === 'delete' ? 'active' : ''}`} 
                onClick={() => openPopup('delete')}
                onMouseEnter={() => setActiveCard('delete')}
                onMouseLeave={() => setActiveCard(null)}
              >
                <div className="form-card-icon">{icons.delete}</div>
                <div className="form-card-content">
                  <h4 className="form-card-title">Delete Profile</h4>
                  <p className="form-card-description">{descriptions.delete}</p>
                </div>
                <div className="form-card-arrow">&rarr;</div>
              </div>

              {popupType && (
                <div className="overlay" onClick={closePopup}>
                  <div className="modal" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                      <div className="modal-icon">{icons[popupType]}</div>
                      <h3>{titles[popupType]}</h3>
                    </div>
                    <p className="modal-subtext">{descriptions[popupType]}</p>

                    {popupType === 'delete' ? (
                      <>
                        <div className="modal-warning">
                          <div className="warning-icon">⚠️</div>
                          <p>Are you sure you want to delete your account? This action cannot be undone.</p>
                        </div>
                        <div className="modal-actions">
                          <button className="cancel-btn" onClick={closePopup}>Cancel</button>
                          <button 
                            className="delete-btn" 
                            onClick={handleDelete}
                            disabled={isLoading}
                          >
                            {isLoading ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </>
                    ) : popupType === 'propic' ? (
                      <>
                        <div className="profile-pic-preview-container">
                          {image ? (
                            <img
                              src={URL.createObjectURL(image)}
                              alt="Profile Preview"
                              className="profile-pic-preview"
                            />
                          ) : (
                            <img
                              src={user?.profile_pic ? `${import.meta.env.VITE_URL}${user.profile_pic}` : "/default.png"}
                              alt="Default Profile"
                              className="profile-pic-preview"
                            />
                          )}
                        </div>
                        <div className="file-upload-container">
                          <label className="file-upload-btn" htmlFor="profile-pic-upload">
                            Choose Image
                          </label>
                          <input
                            id="profile-pic-upload"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files.length > 0) {
                                const file = e.target.files[0];
                                setImage(file);
                              }
                            }}
                            style={{ display: 'none' }}
                          />
                          {image && (
                            <span className="file-name">{image.name}</span>
                          )}
                        </div>
                        <div className="password-input-container">
                          <div className="input-icon">🔒</div>
                          <input
                            className="modal-input with-icon"
                            type="password"
                            placeholder="Enter current password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="input-container">
                          <div className="input-icon">
                            {popupType === 'username' ? '👤' : popupType === 'email' ? '✉️' : '🔑'}
                          </div>
                          <input
                            className="modal-input with-icon"
                            type={popupType === 'password' ? 'password' : 'text'}
                            placeholder={`Enter new ${titles[popupType]}`}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                          />
                        </div>
                        <div className="password-input-container">
                          <div className="input-icon">🔒</div>
                          <input
                            className="modal-input with-icon"
                            type="password"
                            placeholder="Enter current password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                          />
                        </div>
                      </>
                    )}

                    {popupType !== 'delete' && (
                      <>
                        {modalError && (
                          <div className="modal-error">
                            <div className="error-icon">⚠️</div>
                            <p>{modalError}</p>
                          </div>
                        )}
                        <div className="modal-actions">
                          <button className="cancel-btn" onClick={closePopup}>Cancel</button>
                          <button 
                            className="save-btn" 
                            onClick={handleSubmit}
                            disabled={isLoading}
                          >
                            {isLoading ? "Saving..." : "Save"}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
