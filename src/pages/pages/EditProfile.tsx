import React, { useState, useEffect } from 'react';
import '../styles/editprofile.css';

const EditProfile = () => {
  const [user, setUser] = useState<{ username: string; email: string; profilePic: string } | null>(null);
  const [newUsername, setNewUsername] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [newProfilePic, setNewProfilePic] = useState<File | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('http://localhost:5000/api/users/profile', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          setUser({ username: data.username, email: data.email, profilePic: data.profilePic });
          setNewUsername(data.username);  // pre-fill the username
          setNewEmail(data.email);        // pre-fill the email
        })
        .catch((error) => console.error('Error fetching user data:', error));
    }
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setNewProfilePic(event.target.files[0]);
    }
  };

  const handleSaveChanges = () => {
    const token = localStorage.getItem('token');
    if (token) {
      const formData = new FormData();
      formData.append('username', newUsername);
      formData.append('email', newEmail);
      if (newPassword) {
        formData.append('password', newPassword);  // Add password if provided
      }
      if (newProfilePic) {
        formData.append('profilePic', newProfilePic);  // Add profile picture if provided
      }

      fetch('http://localhost:5000/api/me', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          alert('Profile updated!');
          window.location.href = '/';  // Redirect to homepage after saving
        })
        .catch((error) => console.error('Error updating profile:', error));
    }
  };

  return (
    <div className="edit-profile-wrapper">
      <h2>Edit Profile</h2>
      <div className="profile-form">
        <div className="form-group">
          <a>Username:</a>
        </div>
        
        <div className="form-group">
          <a>Email:</a>
        </div>

        <div className="form-group">
          <a>Password:</a>
        </div>

        <div className="form-group">
          <a>Profile Picture:</a>
        </div>

        <button onClick={handleSaveChanges} className="save-btn">Save Changes</button>
      </div>
    </div>
  );
};

export default EditProfile;
