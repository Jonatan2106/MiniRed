import React, { useState } from 'react';
import { fetchFromAPI } from '../../api/api';
import '../styles/login.css';
import '../styles/main.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      const response = await fetchFromAPI('/login', 'POST', { username, password });
      const token = response.token;
      localStorage.setItem('token', token);  // Store the JWT token in localStorage
      // Redirect to home or profile after successful login
    } catch (error) {
      setError('Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h1 className="login-header">Login</h1>
        <input
          className="login-input"
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          className="login-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="login-button" onClick={handleLogin}>Login</button>
        {error && <p className="login-error">{error}</p>}
      </div>
    </div>
  );
};

export default Login;
