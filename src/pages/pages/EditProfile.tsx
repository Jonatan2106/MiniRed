import Loading from './Loading';

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

  useEffect(() => {
    console.log("Updated User:", user);
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
    }

    if (popupType && inputValue !== "") {
      setFormData((prev) => ({
        ...prev,
        [popupType === "propic" ? "profilePic" : popupType]: inputValue,
      }));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);

    navigate('/');
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

      if (popupType !== 'delete') {
        if (!currentPassword) {
          setModalError("Please enter your current password.");
          return;
        }
        const verifyRes = await fetchFromAPI(`/verify-password`, 'POST', { password: currentPassword });
        if (!verifyRes) {
          setModalError("Current password is incorrect.");
          return;
        }
      }

      if (popupType === "email" && !inputValue.includes("@")) {
        setModalError("Please enter a valid email address!");
        return;
      }

      if (popupType === "username") {
        const checkRes = await fetchFromAPI(`/check-username?username=${encodeURIComponent(inputValue)}`, 'GET');
        if (checkRes.exists) {
          setModalError("Username is already taken.");
          return;
        }
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

      setUser(response.user || response);
      setFormData((prev) => ({
        ...prev,
        ...payload,
      }));
      closePopup();
      setError(null);
      setCurrentPassword('');
      alert("Profile updated successfully!");
    } catch (err: any) {
      console.error("Error updating profile:", err.message);
      setModalError(err.message || "Unexpected error");
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
    }
  };

  const resetModalState = () => {
    setInputValue('');
    setCurrentPassword('');
    setModalError(null);
    setImage(null);
  };

  const openPopup = async (type: typeof popupType) => {
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
      <div className="main-content">
        <div className="edit-profile-wrapper">
          <h3>Edit Profile</h3>
          <div className="profile-form">
            <div className="user" onClick={() => openPopup('username')}>
              <div className="form-group"><h4>Username</h4><p>{descriptions.username}</p></div>
              <div className="panah">&gt;</div>
            </div>

            <div className="email" onClick={() => openPopup('email')}>
              <div className="form-group"><h4>Email</h4><p>{descriptions.email}</p></div>
              <div className="panah">&gt;</div>
            </div>

            <div className="password" onClick={() => openPopup('password')}>
              <div className="form-group"><h4>Password</h4><p>{descriptions.password}</p></div>
              <div className="panah">&gt;</div>
            </div>

            <div className="propic" onClick={() => openPopup('propic')}>
              <div className="form-group"><h4>Profile Picture</h4><p>{descriptions.propic}</p></div>
              <div className="panah">&gt;</div>
            </div>

            <div className="delete" onClick={() => openPopup('delete')}>
              <div className="form-group"><h4>Delete Profile</h4><p>{descriptions.delete}</p></div>
              <div className="panah">&gt;</div>
            </div>

            {popupType && (
              <div className="overlay" onClick={closePopup}>
                <div className="modal" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header"><h3>{titles[popupType]}</h3></div>
                  <p className="modal-subtext">{descriptions[popupType]}</p>

                  {popupType === 'delete' ? (
                    <>
                      <p className="modal-warning">Are you sure? This action cannot be undone.</p>
                      <div className="modal-actions">
                        <button className="cancel-btn" onClick={closePopup}>Cancel</button>
                        <button className="delete-btn" onClick={handleDelete}>Delete</button>
                      </div>
                    </>
                  ) : popupType === 'propic' ? (
                    <>
                      <div className="profile-pic-preview-container">
                        {formData.profilePic instanceof File ? (
                          <img
                            src={URL.createObjectURL(formData.profilePic)}
                            alt="Profile Preview"
                            className="profile-pic-preview"
                          />
                        ) : (
                          <img
                            src={formData.profilePic || "/default.png"}
                            alt="Default Profile"
                            className="profile-pic-preview"
                          />
                        )}
                      </div>
                      <input
                        type="file"
                        className="modal-input"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            const file = e.target.files[0];
                            setFormData((prev) => ({
                              ...prev,
                              profilePic: file,
                            }));
                            setImage(file);
                          }
                        }}
                      />
                      {/* Current password input for propic */}
                      <input
                        className="modal-input"
                        type="password"
                        placeholder="Enter current password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                    </>
                  ) : (
                    <>
                      <input
                        className="modal-input"
                        type={popupType === 'password' ? 'password' : 'text'}
                        placeholder={`Enter new ${titles[popupType]}`}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                      />
                      {/* Current password input for username, email, password */}
                      <input
                        className="modal-input"
                        type="password"
                        placeholder="Enter current password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                    </>
                  )}

                  {popupType !== 'delete' && (
                    <>
                      {modalError && (
                        <div className="modal-error">{modalError}</div>
                      )}
                      <div className="modal-actions">
                        <button className="cancel-btn" onClick={closePopup}>Cancel</button>
                        <button className="save-btn" onClick={handleSubmit}>Save</button>
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
  );
};

export default EditProfile;
