import { useState, useEffect } from 'react';

export default function GameSettings({ token }) {
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState({});
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const headers = { 'Content-Type': 'application/json', 'x-admin-token': token };

  function notify(msg, isError = false) {
    if (isError) { setError(msg); setTimeout(() => setError(''), 4000); }
    else { setSuccess(msg); setTimeout(() => setSuccess(''), 4000); }
  }

  useEffect(() => {
    fetch('/api/admin/settings', { headers: { 'x-admin-token': token } })
      .then(r => r.json())
      .then(data => { setSettings(data); setForm(data); setLoading(false); })
      .catch(() => { notify('Ayarlar yüklenemedi!', true); setLoading(false); });
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', { method: 'PUT', headers, body: JSON.stringify(form) });
      const data = await res.json();
      if (res.ok) { setSettings(data); setForm(data); notify('Ayarlar kaydedildi! ✅'); }
      else notify(data.error, true);
    } catch { notify('Kaydetme hatası!', true); }
    setSaving(false);
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) {
      notify('Yeni şifreler eşleşmiyor!', true);
      return;
    }
    if (pwForm.newPassword.length < 4) {
      notify('Şifre en az 4 karakter olmalı!', true);
      return;
    }
    try {
      const res = await fetch('/api/admin/password', {
        method: 'PUT', headers,
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
      });
      const data = await res.json();
      if (res.ok) { setPwForm({ currentPassword: '', newPassword: '', confirm: '' }); notify('Şifre değiştirildi! ✅'); }
      else notify(data.error, true);
    } catch { notify('Hata oluştu!', true); }
  }

  if (loading) return <div className="admin-section"><p className="loading-text">⏳ Yükleniyor...</p></div>;

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2>⚙️ Oyun Ayarları</h2>
      </div>

      {error && <div className="admin-alert admin-alert--error">{error}</div>}
      {success && <div className="admin-alert admin-alert--success">{success}</div>}

      {/* Game settings form */}
      <div className="admin-card">
        <h3>Oyun Parametreleri</h3>
        <form onSubmit={handleSave} className="settings-form">
          <div className="settings-grid">
            <SettingField
              label="Toplam Tur Sayısı"
              hint="1 - 20 arası"
              type="number"
              value={form.totalRounds || ''}
              onChange={v => setForm(f => ({ ...f, totalRounds: Number(v) }))}
              min={1} max={20}
            />
            <SettingField
              label="Meme Gönderim Süresi (sn)"
              hint="10 - 300 arası"
              type="number"
              value={form.submissionTimer || ''}
              onChange={v => setForm(f => ({ ...f, submissionTimer: Number(v) }))}
              min={10} max={300}
            />
            <SettingField
              label="Oylama Süresi (sn)"
              hint="10 - 120 arası"
              type="number"
              value={form.votingTimer || ''}
              onChange={v => setForm(f => ({ ...f, votingTimer: Number(v) }))}
              min={10} max={120}
            />
            <SettingField
              label="Sonuç Ekranı Süresi (sn)"
              hint="3 - 15 arası"
              type="number"
              value={form.resultsTimer || ''}
              onChange={v => setForm(f => ({ ...f, resultsTimer: Number(v) }))}
              min={3} max={15}
            />
            <SettingField
              label="Minimum Oyuncu"
              hint="2 - 10 arası"
              type="number"
              value={form.minPlayers || ''}
              onChange={v => setForm(f => ({ ...f, minPlayers: Number(v) }))}
              min={2} max={10}
            />
            <SettingField
              label="Maksimum Oyuncu"
              hint="2 - 12 arası"
              type="number"
              value={form.maxPlayers || ''}
              onChange={v => setForm(f => ({ ...f, maxPlayers: Number(v) }))}
              min={2} max={12}
            />
            <SettingField
              label="El Büyüklüğü (kart sayısı)"
              hint="3 - 10 arası"
              type="number"
              value={form.handSize || ''}
              onChange={v => setForm(f => ({ ...f, handSize: Number(v) }))}
              min={3} max={10}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? '⏳ Kaydediliyor...' : '💾 Ayarları Kaydet'}
          </button>
        </form>
      </div>

      {/* Password change */}
      <div className="admin-card">
        <h3>🔐 Admin Şifresi Değiştir</h3>
        <form onSubmit={handlePasswordChange} className="settings-form">
          <div className="form-group">
            <label>Mevcut Şifre</label>
            <input
              className="input"
              type="password"
              value={pwForm.currentPassword}
              onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
              placeholder="Mevcut şifre..."
            />
          </div>
          <div className="form-group">
            <label>Yeni Şifre</label>
            <input
              className="input"
              type="password"
              value={pwForm.newPassword}
              onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
              placeholder="Yeni şifre (min 4 karakter)..."
            />
          </div>
          <div className="form-group">
            <label>Yeni Şifre (Tekrar)</label>
            <input
              className="input"
              type="password"
              value={pwForm.confirm}
              onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
              placeholder="Yeni şifreyi tekrar gir..."
            />
          </div>
          <button
            type="submit"
            className="btn btn-secondary"
            disabled={!pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirm}
          >
            🔑 Şifreyi Değiştir
          </button>
        </form>
      </div>
    </div>
  );
}

function SettingField({ label, hint, type, value, onChange, min, max }) {
  return (
    <div className="form-group">
      <label>{label}</label>
      {hint && <span className="field-hint">{hint}</span>}
      <input
        className="input"
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        min={min}
        max={max}
      />
    </div>
  );
}
