import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App'; // Import App correctly

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

