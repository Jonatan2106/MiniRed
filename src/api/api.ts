// src/api/api.ts
const API_URL = 'http://localhost:5000/api';  // Replace with your backend URL

export const fetchFromAPI = async (endpoint: string, method: string = 'GET', body: any = null) => {
  const headers = {
    'Content-Type': 'application/json',
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

  return await response.json();
};
