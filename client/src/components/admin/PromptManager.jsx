import { useState, useEffect } from 'react';

export default function PromptManager({ token }) {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newText, setNewText] = useState('');
  const [editIdx, setEditIdx] = useState(null);
  const [editText, setEditText] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const headers = { 'Content-Type': 'application/json', 'x-admin-token': token };

  function notify(msg, isError = false) {
    if (isError) { setError(msg); setTimeout(() => setError(''), 3000); }
    else { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); }
  }

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/prompts', { headers: { 'x-admin-token': token } });
      const data = await res.json();
      setPrompts(Array.isArray(data) ? data : []);
    } catch { notify('Yüklenirken hata oluştu!', true); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!newText.trim()) return;
    try {
      const res = await fetch('/api/admin/prompts', { method: 'POST', headers, body: JSON.stringify({ text: newText }) });
      const data = await res.json();
      if (res.ok) { setPrompts(data.prompts); setNewText(''); notify('Metin eklendi! ✅'); }
      else notify(data.error, true);
    } catch { notify('Hata oluştu!', true); }
  }

  async function handleEdit(idx) {
    if (!editText.trim()) return;
    try {
      const res = await fetch(`/api/admin/prompts/${idx}`, { method: 'PUT', headers, body: JSON.stringify({ text: editText }) });
      const data = await res.json();
      if (res.ok) { setPrompts(data.prompts); setEditIdx(null); notify('Güncellendi! ✅'); }
      else notify(data.error, true);
    } catch { notify('Hata oluştu!', true); }
  }

  async function handleDelete(idx) {
    if (!window.confirm('Bu metni silmek istediğine emin misin?')) return;
    try {
      const res = await fetch(`/api/admin/prompts/${idx}`, { method: 'DELETE', headers });
      const data = await res.json();
      if (res.ok) { setPrompts(data.prompts); notify('Silindi! 🗑️'); }
      else notify(data.error, true);
    } catch { notify('Hata oluştu!', true); }
  }

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2>📝 Oyun Metinleri</h2>
        <span className="badge">{prompts.length} metin</span>
      </div>

      {error && <div className="admin-alert admin-alert--error">{error}</div>}
      {success && <div className="admin-alert admin-alert--success">{success}</div>}

      {/* Add new prompt */}
      <div className="admin-card">
        <h3>Yeni Metin Ekle</h3>
        <form onSubmit={handleAdd} className="add-form">
          <input
            className="input"
            type="text"
            placeholder="Örn: Sabah alarmın çaldığında..."
            value={newText}
            onChange={e => setNewText(e.target.value)}
            maxLength={200}
          />
          <button type="submit" className="btn btn-primary" disabled={!newText.trim()}>
            ➕ Ekle
          </button>
        </form>
      </div>

      {/* Prompt list */}
      <div className="admin-card">
        <h3>Mevcut Metinler</h3>
        {loading ? (
          <p className="loading-text">⏳ Yükleniyor...</p>
        ) : prompts.length === 0 ? (
          <p className="empty-text">Henüz metin yok. Yukardaki formdan ekle!</p>
        ) : (
          <div className="prompt-list">
            {prompts.map((text, i) => (
              <div key={i} className="prompt-item">
                {editIdx === i ? (
                  <div className="prompt-edit">
                    <input
                      className="input"
                      type="text"
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      maxLength={200}
                      autoFocus
                    />
                    <div className="prompt-edit-actions">
                      <button className="btn btn-primary btn-sm" onClick={() => handleEdit(i)}>💾 Kaydet</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditIdx(null)}>✕ İptal</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="prompt-num">{i + 1}.</span>
                    <span className="prompt-text-item">{text}</span>
                    <div className="prompt-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => { setEditIdx(i); setEditText(text); }}>✏️</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(i)}>🗑️</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
