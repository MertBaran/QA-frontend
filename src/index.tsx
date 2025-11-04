import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { GoogleOAuthProvider } from '@react-oauth/google';

const container = document.getElementById('root');
if (container) {
  const root = ReactDOM.createRoot(container);
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const app = (
    <GoogleOAuthProvider clientId={clientId}>
      <App />
    </GoogleOAuthProvider>
  );
  
  // StrictMode only in development to help detect issues
  // Note: Disabled to prevent double API requests in development
  // Uncomment if you want to test for potential issues:
  // root.render(isDevelopment ? <React.StrictMode>{app}</React.StrictMode> : app);
  
  root.render(app);
}
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
