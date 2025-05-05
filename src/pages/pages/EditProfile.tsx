import React, { useState, useEffect } from "react";
import { FaHome, FaCompass, FaFire } from 'react-icons/fa';
import Loading from './Loading';
import "../styles/editprofile.css";
import "../styles/main.css";

const EditProfile = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    profilePic: "" as string | File,
  });

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<null | {
    username: string;
    email: string;
    password: string;
    profilePic: string;
  }>(null);

  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [popupType, setPopupType] = useState<'username' | 'email' | 'password' | 'propic' | 'delete' | null>(null);
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
    delete: 'Delete Profile'
  };

  const descriptions = {
    username: 'Changing your username will affect your log in.',
    email: 'Update your email address.',
    password: 'Changing your password will affect how you log in.',
    propic: 'Upload or change your profile picture.',
    delete: 'Deleting your profile will remove all your data permanently.'
  };

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
        .then((res) => res.json())
        .then((data) => {
          setUser(data);
          setFormData({
            username: data.username,
            email: data.email,
            password: "",
            profilePic: data.profilePic,
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

      const updatedFormData = { ...formData };
      if (popupType && popupType !== 'propic' && popupType !== 'delete') {
        updatedFormData[popupType] = inputValue;
      }

      const payload = {
        username: updatedFormData.username,
        email: updatedFormData.email,
        password: updatedFormData.password,
        profilePic: typeof updatedFormData.profilePic === "string" || File ? updatedFormData.profilePic : null,
      };

      const response = await fetch("http://localhost:5000/api/me", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
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
        password: "",
        profilePic: updatedUser.profilePic,
      });
      closePopup();
      setError(null);
    } catch (err: any) {
      console.error("Error updating profile:", err.message);
      setError(err.message || "Unexpected error");
    }
  };


  const handleDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("You must be logged in to delete your profile.");
        return;
      }

      const res = await fetch("http://localhost:5000/api/me", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete account.");
      }

      localStorage.removeItem("token");
      window.location.href = "/";
    } catch (err: any) {
      console.error("Error deleting profile:", err.message);
      setError(err.message || "Unexpected error");
    }
  };

  if (error) return <div>Error: {error}</div>;
  if (isLoading) return <Loading />;

  return (
    <div className="home-wrapper">
      <nav className="navbar">
        <div className="navbar-left">
          <div className="logo">
            <a className="app-title" href="/">MiniRed</a>
          </div>
        </div>
        <div className="navbar-right">
          {isLoggedIn && (
            <div className="profile-menu">
              <img
                src={
                  formData.profilePic instanceof File
                    ? URL.createObjectURL(formData.profilePic)
                    : formData.profilePic || "/default.png"
                }
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
          )}
        </div>
      </nav>

      <div className="main-content">
        <div className="left-sidebar">
          <h2 className="title">Menu</h2>
          <ul>
            <li><FaHome className="icon" /><a href="/">Home</a></li>
            <li><FaCompass className="icon" /><a href="/explore">Explore</a></li>
            <li><FaFire className="icon" /><a href="/popular">Popular</a></li>
          </ul>
        </div>

        <div className="edit-profile-wrapper">
          <h3>Edit Profile</h3>
          <div className="profile-form">
            <div className="user" onClick={() => setPopupType('username')}>
              <div className="form-group"><h4>Username</h4><p>{descriptions.username}</p></div>
              <div className="panah">&gt;</div>
            </div>

            <div className="email" onClick={() => setPopupType('email')}>
              <div className="form-group"><h4>Email</h4><p>{descriptions.email}</p></div>
              <div className="panah">&gt;</div>
            </div>

            <div className="password" onClick={() => setPopupType('password')}>
              <div className="form-group"><h4>Password</h4><p>{descriptions.password}</p></div>
              <div className="panah">&gt;</div>
            </div>

            <div className="propic" onClick={() => setPopupType('propic')}>
              <div className="form-group"><h4>Profile Picture</h4><p>{descriptions.propic}</p></div>
              <div className="panah">&gt;</div>
            </div>

            <div className="delete" onClick={() => setPopupType('delete')}>
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
                      <input
                        type="file"
                        className="modal-input"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            setFormData((prev) => ({
                              ...prev,
                              // profilePic: e.target.files[0],
                            }));
                          }
                        }}
                      />
                      {formData.profilePic instanceof File && (
                        <img
                          src={URL.createObjectURL(formData.profilePic)}
                          alt="Preview"
                          className="profile-preview"
                        />
                      )}
                    </>
                  ) : (
                    <input
                      className="modal-input"
                      type={popupType === 'password' ? 'password' : 'text'}
                      placeholder={`Enter new ${titles[popupType]}`}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                    />
                  )}

                  {popupType !== 'delete' && (
                    <div className="modal-actions">
                      <button className="cancel-btn" onClick={closePopup}>Cancel</button>
                      <button className="save-btn" onClick={handleSubmit}>Save</button>
                    </div>
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
