// src/api/api.ts
const API_URL = 'http://172.16.202.41:5000/api';  // Replace with your backend URL

export const fetchFromAPI = async (endpoint: string, method: string, body: any = null) => {
  const token = localStorage.getItem('token'); // 🔥 get token from storage

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }), // 🔥 if token exists, add Authorization header
  };

  const config: RequestInit = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, config);

  if (!response.ok) {
    throw new Error('Network response was not ok');
  }

  if (method.toUpperCase() === 'DELETE') {
    try {
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    } catch (e) {
      // Return null for empty responses
      return null;
    }
  }

  return await response.json();
};