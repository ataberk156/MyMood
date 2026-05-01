import { useState, useEffect } from 'react';

const STATE_LABELS = {
  lobby: '🟡 Lobi',
  playing: '🟢 Oynuyor',
  voting: '🔵 Oylama',
  results: '🟠 Sonuçlar',
  gameover: '⚫ Bitti'
};

export default function RoomsOverview({ token }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/rooms', { headers: { 'x-admin-token': token } });
      const data = await res.json();
      setRooms(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2>🎮 Aktif Odalar</h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span className="badge">{rooms.length} oda</span>
          <button className="btn btn-ghost btn-sm" onClick={load}>🔄 Yenile</button>
        </div>
      </div>

      {loading ? (
        <p className="loading-text">⏳ Yükleniyor...</p>
      ) : rooms.length === 0 ? (
        <div className="admin-card">
          <p className="empty-text">Şu an aktif oda yok.</p>
        </div>
      ) : (
        <div className="rooms-grid">
          {rooms.map(room => (
            <div key={room.code} className="room-card admin-room-card">
              <div className="room-card-header">
                <span className="room-code">{room.code}</span>
                <span className="room-state">{STATE_LABELS[room.state] || room.state}</span>
              </div>
              <div className="room-card-body">
                <div className="room-stat">
                  👥 {room.playerCount} oyuncu
                </div>
                {room.totalRounds > 0 && (
                  <div className="room-stat">
                    🎯 Tur {room.currentRound}/{room.totalRounds}
                  </div>
                )}
              </div>
              {room.players && room.players.length > 0 && (
                <div className="room-players">
                  {room.players.map((p, i) => (
                    <span key={i} className="room-player-tag">
                      {p.isHost ? '👑' : '👤'} {p.name}
                      {room.state !== 'lobby' && <strong> ({p.score})</strong>}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
