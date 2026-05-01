import { useState } from 'react';

export default function Lobby({ gs, startGame, leaveRoom }) {
  const { roomCode, players, player } = gs;
  const [copied, setCopied] = useState(false);

  function copyCode() {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const minPlayers = 2;
  const canStart = player?.isHost && players.length >= minPlayers;

  return (
    <div className="screen lobby-screen">
      <div className="lobby-container">
        <h1 className="lobby-title">🎮 Bekleme Odası</h1>

        <div className="room-code-card">
          <p className="room-code-label">Oda Kodu</p>
          <div className="room-code-display">
            <span className="room-code">{roomCode}</span>
            <button className="btn btn-ghost btn-sm" onClick={copyCode}>
              {copied ? '✅ Kopyalandı!' : '📋 Kopyala'}
            </button>
          </div>
          <p className="room-code-hint">Bu kodu arkadaşlarınla paylaş!</p>
        </div>

        <div className="players-section">
          <h2 className="section-title">
            Oyuncular <span className="player-count">({players.length})</span>
          </h2>
          <div className="players-list">
            {players.map(p => (
              <div key={p.id} className={`player-card ${p.id === player?.id ? 'player-card--self' : ''}`}>
                <div className="player-avatar">
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <span className="player-name">{p.name}</span>
                {p.isHost && <span className="badge badge-host">👑 Host</span>}
                {p.id === player?.id && <span className="badge badge-you">Sen</span>}
              </div>
            ))}
            {Array.from({ length: Math.max(0, 6 - players.length) }).map((_, i) => (
              <div key={`empty-${i}`} className="player-card player-card--empty">
                <div className="player-avatar player-avatar--empty">?</div>
                <span className="player-name">Bekleniyor...</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lobby-actions">
          {player?.isHost ? (
            <>
              {!canStart && (
                <p className="hint-text">En az {minPlayers} oyuncu gerekli ({players.length}/{minPlayers})</p>
              )}
              <button
                className="btn btn-primary btn-lg"
                onClick={startGame}
                disabled={!canStart}
              >
                🚀 Oyunu Başlat!
              </button>
            </>
          ) : (
            <p className="hint-text waiting-text">
              ⏳ Host oyunu başlatmayı bekliyorsunuz...
            </p>
          )}
          <button className="btn btn-danger btn-sm" onClick={leaveRoom}>
            🚪 Odadan Çık
          </button>
        </div>
      </div>
    </div>
  );
}
