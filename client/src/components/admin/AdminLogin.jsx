import { useState } from 'react';

export default function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (res.ok) {
        onLogin(data.token);
      } else {
        setError(data.error || 'Giriş başarısız!');
      }
    } catch {
      setError('Sunucuya bağlanılamadı!');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-screen">
      <div className="admin-login-card">
        <div className="admin-logo">⚙️</div>
        <h1>Admin Paneli</h1>
        <p className="admin-subtitle">Meme Savaşları Yönetim Paneli</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Şifre</label>
            <input
              className="input"
              type="password"
              placeholder="Admin şifresi..."
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={!password || loading}>
            {loading ? '⏳ Giriş yapılıyor...' : '🔐 Giriş Yap'}
          </button>
        </form>

        <a href="/" className="btn btn-ghost btn-sm admin-back-btn">← Oyuna Dön</a>
        <p className="admin-hint">Varsayılan şifre: <code>admin123</code></p>
      </div>
    </div>
  );
}
