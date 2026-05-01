import { useState } from 'react';

export default function RoundResults({ gs }) {
  const { roundResults, currentRound, totalRounds } = gs;
  const { roundWinnerName, results = [], scores = [], prompt } = roundResults || {};
  const [imgErrors, setImgErrors] = useState({});

  return (
    <div className="screen results-screen">
      <div className="results-container">
        {/* Round badge */}
        <div className="round-badge results-round">
          Tur {currentRound}/{totalRounds} Sonuçları
        </div>

        {/* Round winner */}
        {roundWinnerName ? (
          <div className="winner-announcement">
            <div className="winner-trophy">🏆</div>
            <h2 className="winner-name">{roundWinnerName} kazandı!</h2>
            <div className="winner-confetti">🎉 🎊 🎉</div>
          </div>
        ) : (
          <div className="winner-announcement">
            <h2>Berabere! Kimse oy almadı 😅</h2>
          </div>
        )}

        {/* Prompt */}
        <div className="results-prompt">
          <span className="prompt-label">Durum:</span> {prompt}
        </div>

        {/* Submitted memes with vote counts */}
        <div className="results-memes">
          {results.map(({ playerId, playerName, meme, votes, isWinner }) => (
            <div key={playerId} className={`result-card ${isWinner ? 'result-card--winner' : ''}`}>
              {isWinner && <div className="result-winner-tag">🏆 Kazanan</div>}
              <div className="meme-img-wrap">
                {imgErrors[playerId] ? (
                  <div className="meme-img-fallback">🖼️</div>
                ) : (
                  <img
                    src={meme.preview || meme.url}
                    alt={meme.title}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={() => setImgErrors(prev => ({ ...prev, [playerId]: true }))}
                  />
                )}
              </div>
              <div className="result-card-footer">
                <span className="result-player">{playerName}</span>
                <span className="result-votes">❤️ {votes} oy</span>
              </div>
            </div>
          ))}
        </div>

        {/* Scoreboard */}
        <div className="scoreboard">
          <h3>📊 Skor Tablosu</h3>
          <div className="score-list">
            {scores.map((p, i) => (
              <div key={p.id} className={`score-row ${i === 0 ? 'score-row--first' : ''}`}>
                <span className="score-rank">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
                <span className="score-name">{p.name}</span>
                <span className="score-points">{p.score} puan</span>
              </div>
            ))}
          </div>
        </div>

        <p className="next-round-hint">
          {currentRound < totalRounds ? '⏳ Sonraki tur başlıyor...' : '⏳ Oyun bitiyor...'}
        </p>
      </div>
    </div>
  );
}
