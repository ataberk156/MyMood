import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './AdminLogin.jsx';
import AdminDashboard from './AdminDashboard.jsx';

const TOKEN_KEY = 'mg_admin_token';

export default function AdminApp() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));

  async function verifyToken(t) {
    try {
      const res = await fetch('/api/admin/me', { headers: { 'x-admin-token': t } });
      if (!res.ok) {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      }
    } catch {
      // server unreachable - keep token, verify again on next request
    }
  }

  useEffect(() => {
    if (token) verifyToken(token);
  }, []);

  function handleLogin(t) {
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
  }

  function handleLogout() {
    fetch('/api/admin/logout', { method: 'POST', headers: { 'x-admin-token': token } }).catch(() => {});
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }

  if (!token) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return (
    <Routes>
      <Route path="*" element={<AdminDashboard token={token} onLogout={handleLogout} />} />
    </Routes>
  );
}
