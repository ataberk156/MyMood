export default function GameOver({ gs, leaveRoom }) {
  const { finalResults, player } = gs;
  const { winner, finalScores = [] } = finalResults || {};

  const isWinner = winner?.id === player?.id;

  return (
    <div className="screen gameover-screen">
      <div className="gameover-container">
        <div className="gameover-fireworks">🎆 🎇 🎆</div>

        <h1 className="gameover-title">Oyun Bitti!</h1>

        {winner ? (
          <div className="gameover-winner">
            <div className="gameover-trophy">🏆</div>
            <h2 className="gameover-winner-name">
              {isWinner ? '🎉 Tebrikler! Sen kazandın!' : `${winner.name} kazandı!`}
            </h2>
            <p className="gameover-winner-score">{winner.score} puan</p>
          </div>
        ) : (
          <div className="gameover-winner">
            <h2>Kimse puan alamadı 😅</h2>
          </div>
        )}

        {/* Final scoreboard */}
        <div className="scoreboard scoreboard--final">
          <h3>🏅 Final Sıralaması</h3>
          <div className="score-list">
            {finalScores.map((p, i) => (
              <div
                key={p.id}
                className={`score-row ${i === 0 ? 'score-row--first' : ''} ${p.id === player?.id ? 'score-row--self' : ''}`}
              >
                <span className="score-rank">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                </span>
                <span className="score-name">{p.name} {p.id === player?.id ? '(Sen)' : ''}</span>
                <span className="score-points">{p.score} puan</span>
              </div>
            ))}
          </div>
        </div>

        <div className="gameover-actions">
          <button className="btn btn-primary btn-lg" onClick={leaveRoom}>
            🏠 Ana Menüye Dön
          </button>
        </div>
      </div>
    </div>
  );
}
