// src/api/api.ts
const API_URL = 'http://172.16.202.41:5000/api';  // Replace with your backend URL

export const fetchFromAPIWithoutAuth = async (endpoint: string, method: string, body: any = null) => {
  const headers: HeadersInit = {
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