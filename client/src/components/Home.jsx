import { useState } from 'react';

export default function Home({ createRoom, joinRoom }) {
  const [mode, setMode] = useState(null); // null | 'create' | 'join'
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    createRoom(name.trim());
    setTimeout(() => setLoading(false), 3000);
  }

  function handleJoin(e) {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;
    setLoading(true);
    joinRoom(code.trim().toUpperCase(), name.trim());
    setTimeout(() => setLoading(false), 3000);
  }

  return (
    <div className="home-screen">
      <div className="home-content">
        <div className="logo-area">
          <div className="logo-emoji">😂</div>
          <h1 className="game-title">Meme Savaşları</h1>
          <p className="game-subtitle">Arkadaşlarınla oyna · En iyi meme'i seç · Kazan!</p>
        </div>

        {!mode && (
          <div className="home-buttons">
            <button className="btn btn-primary btn-lg" onClick={() => setMode('create')}>
              🏠 Oda Oluştur
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => setMode('join')}>
              🚀 Odaya Katıl
            </button>
            <a href="/admin" className="btn btn-ghost btn-sm admin-link">
              ⚙️ Admin Paneli
            </a>
          </div>
        )}

        {mode === 'create' && (
          <div className="card form-card">
            <h2>🏠 Yeni Oda Oluştur</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Oyuncu Adın</label>
                <input
                  className="input"
                  type="text"
                  placeholder="Adını gir..."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  maxLength={20}
                  autoFocus
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setMode(null)}>← Geri</button>
                <button type="submit" className="btn btn-primary" disabled={!name.trim() || loading}>
                  {loading ? '⏳ Oluşturuluyor...' : '✅ Oluştur'}
                </button>
              </div>
            </form>
          </div>
        )}

        {mode === 'join' && (
          <div className="card form-card">
            <h2>🚀 Odaya Katıl</h2>
            <form onSubmit={handleJoin}>
              <div className="form-group">
                <label>Oyuncu Adın</label>
                <input
                  className="input"
                  type="text"
                  placeholder="Adını gir..."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  maxLength={20}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Oda Kodu</label>
                <input
                  className="input input-code"
                  type="text"
                  placeholder="XYZABC"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  maxLength={6}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setMode(null)}>← Geri</button>
                <button type="submit" className="btn btn-secondary" disabled={!name.trim() || !code.trim() || loading}>
                  {loading ? '⏳ Katılınıyor...' : '🚀 Katıl'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="how-to-play">
          <h3>Nasıl Oynanır?</h3>
          <div className="steps">
            <div className="step"><span>1</span><p>Oda oluştur veya koda göre katıl</p></div>
            <div className="step"><span>2</span><p>Her turda ekrana gelen duruma en uygun meme'i seç</p></div>
            <div className="step"><span>3</span><p>Oyuncular birbirlerinin meme'lerini oyluyor</p></div>
            <div className="step"><span>4</span><p>En çok oy alan kazanır! 🏆</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}
