import React, { useState } from 'react';
import { fetchFromAPI } from '../../api/api';
import { useNavigate } from 'react-router-dom';
import { IoEyeOffSharp, IoEyeSharp  } from "react-icons/io5";
import '../styles/login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await fetchFromAPI('/login', 'POST', { username, password });
      const token = response.token;
      localStorage.setItem('token', token); // Store the JWT token in localStorage
      navigate('/'); // Redirect to home or profile after successful login
    } catch (error) {
      setError('Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-header">Login</h2>
        {error && <p className="error-message">{error}</p>}

        <input
          className="login-input-box"
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <div className="password-container">
          <input
            className="login-input-box"
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="eye-button"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <IoEyeSharp className='text-mode'/> : <IoEyeOffSharp  />}
          </button>
        </div>
        <button className="login-button" onClick={handleLogin}>Login</button>

        <p className="register-link">
          Don't have an account? <a href="/register">Register</a>
        </p>
        <button className="back-button" onClick={() => navigate('/')}>Back to Home</button>
      </div>
    </div>
  );
};

export default Login;