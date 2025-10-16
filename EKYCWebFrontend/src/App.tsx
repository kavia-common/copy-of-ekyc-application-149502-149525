import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Register } from './pages/Register';
import { Login } from './pages/Login';
import { BankDetails } from './pages/BankDetails';

/**
 * PUBLIC_INTERFACE
 * App - Entry component wiring up routes and navbar.
 * - Routes: / (home), /register, /login, /bank
 * - Shows a simple navbar with links and current auth token status.
 */
export const App: React.FC = () => {
  const [token, setToken] = useState<string>('');

  return (
    <BrowserRouter>
      <nav style={{ padding: 12, borderBottom: '1px solid #ddd', marginBottom: 16 }}>
        <Link to="/" style={{ marginRight: 12 }}>Home</Link>
        <Link to="/register" style={{ marginRight: 12 }}>Register</Link>
        <Link to="/login" style={{ marginRight: 12 }}>Login</Link>
        <Link to="/bank">Bank Details</Link>
        <span style={{ float: 'right', fontSize: 12, color: '#555' }}>
          {token ? 'Logged in' : 'Not logged in'} | API Docs: <a href="/docs" target="_blank" rel="noreferrer">Swagger UI</a>
        </span>
      </nav>
      <Routes>
        <Route path="/" element={
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <h2>Welcome to EKYC Web Frontend</h2>
            <p>Use the links above to Register, Login, or manage Bank Details.</p>
            <ul>
              <li><Link to="/register">Go to Register</Link></li>
              <li><Link to="/login">Go to Login</Link></li>
              <li><Link to="/bank">Go to Bank Details</Link></li>
            </ul>
            <p>API documentation is available at <a href="/docs" target="_blank" rel="noreferrer">/docs</a>.</p>
          </div>
        } />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login onLoggedIn={(t) => setToken(t)} />} />
        <Route path="/bank" element={token ? <BankDetails token={token} /> : <Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
