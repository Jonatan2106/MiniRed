import React, { useState } from 'react';
import { fetchFromAPI } from '../../api/api'; 
import { useNavigate } from 'react-router-dom';
import '../styles/register.css';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      setError("Passwords don't match!");
      return;
    }

    try {
      const response = await fetchFromAPI('/register', 'POST', { username, email, password });
      // Handle response (e.g., redirect to login page)
      console.log(response); // On success, maybe redirect or show a success message
      navigate('/');
    } catch (error) {
      console.error('Registration failed', error);
      setError('Registration failed. Please try again.');
    }
  };

  return (
    <div className="register-container">
      <h1>Register</h1>

      {error && <p className="error-message">{error}</p>}

      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="register-input"
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="register-input"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="register-input"
      />
      <input
        type="password"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        className="register-input"
      />
      <button onClick={handleRegister} className="register-button">Register</button>
    </div>
  );
};

export default Register;