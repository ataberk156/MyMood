import { useState, useEffect } from 'react';
import CountdownTimer from './CountdownTimer.jsx';

export default function GamePhase({ gs, submitMeme }) {
  const { currentRound, totalRounds, currentPrompt, hand, submittedCount, totalCount, timeLimit } = gs;
  const [selected, setSelected] = useState(null);
  const [submittedUrl, setSubmittedUrl] = useState(null);

  // Reset state cleanly on each new round
  useEffect(() => {
    setSelected(null);
    setSubmittedUrl(null);
  }, [currentRound]);

  function handleSubmit() {
    if (!selected || submittedUrl) return;
    submitMeme(selected);
    setSubmittedUrl(selected.url);
    setSelected(null);
  }

  const hasSubmitted = !!submittedUrl;
  // Remove the used card from the visual hand
  const visualHand = hasSubmitted
    ? hand.filter(m => m.url !== submittedUrl)
    : hand;

  return (
    <div className="screen game-screen">
      {/* Header */}
      <div className="game-header">
        <div className="round-badge">🎮 Tur {currentRound}/{totalRounds}</div>
        <CountdownTimer key={currentRound} seconds={timeLimit} />
        <div className="submitted-badge">✅ {submittedCount}/{totalCount}</div>
      </div>

      {/* Prompt */}
      <div className="prompt-card">
        <div className="prompt-label">😂 Duruma en uygun meme'i seç:</div>
        <p className="prompt-text">{currentPrompt}</p>
      </div>

      {/* Status */}
      {hasSubmitted ? (
        <div className="submitted-message">
          🚀 Meme'in gönderildi! Diğerleri bekleniyor...
          <div className="waiting-dots"><span/><span/><span/></div>
        </div>
      ) : (
        <p className="select-hint">
          {selected ? '☝️ Seçili meme\'ini onayla!' : '👇 Elindeki meme\'lerden birini seç:'}
        </p>
      )}

      {/* Meme hand — always visible, submitted card removed */}
      <div className="meme-hand">
        {visualHand.map((meme) => (
          <MemeCard
            key={meme.url}
            meme={meme}
            selected={selected?.url === meme.url}
            disabled={hasSubmitted}
            onClick={() => !hasSubmitted && setSelected(prev => prev?.url === meme.url ? null : meme)}
          />
        ))}
        {visualHand.length === 0 && hasSubmitted && (
          <div className="hand-empty">🃏 Tüm kartlar oynadı!</div>
        )}
      </div>

      {/* Submit button */}
      {!hasSubmitted && (
        <div className="submit-area">
          <button
            className="btn btn-primary btn-lg"
            onClick={handleSubmit}
            disabled={!selected}
          >
            🚀 Bu Meme'i Gönder!
          </button>
        </div>
      )}
    </div>
  );
}

function MemeCard({ meme, selected, disabled, onClick }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className={`meme-card ${selected ? 'meme-card--selected' : ''} ${disabled ? 'meme-card--disabled' : ''}`}
      onClick={onClick}
    >
      {selected && <div className="meme-card-check">✓</div>}
      <div className="meme-img-wrap">
        {imgError ? (
          <div className="meme-img-fallback">🖼️<br />{meme.title}</div>
        ) : (
          <img
            src={meme.url}
            alt={meme.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        )}
      </div>
      <div className="meme-title">{meme.title}</div>
      <div className="meme-sub">r/{meme.subreddit}</div>
    </div>
  );
}
