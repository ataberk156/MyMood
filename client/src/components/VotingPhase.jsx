import { useState } from 'react';
import CountdownTimer from './CountdownTimer.jsx';

export default function VotingPhase({ gs, vote }) {
  const { currentPrompt, submissions, votedCount, totalCount, votingTimeLimit, player } = gs;
  const [myVote, setMyVote] = useState(null);

  const mySubmission = submissions.find(s => s.playerId === player?.id);
  const canVote = !!mySubmission;

  function handleVote(targetPlayerId) {
    if (myVote || !canVote || targetPlayerId === player?.id) return;
    setMyVote(targetPlayerId);
    vote(targetPlayerId);
  }

  return (
    <div className="screen voting-screen">
      {/* Header */}
      <div className="game-header">
        <div className="round-badge voting-badge">🗳️ Oylama</div>
        <CountdownTimer key={`voting-${currentPrompt}`} seconds={votingTimeLimit} />
        <div className="submitted-badge">{votedCount}/{totalCount} oyladı</div>
      </div>

      {/* Prompt */}
      <div className="prompt-card prompt-card--voting">
        <div className="prompt-label">Hangi meme bu durumu en iyi anlatıyor?</div>
        <p className="prompt-text">{currentPrompt}</p>
      </div>

      {!canVote && (
        <div className="no-vote-notice">
          ⚠️ Meme göndermediğin için oy kullanamazsın.
        </div>
      )}

      {myVote && (
        <div className="voted-notice">
          ✅ Oyunu kullandın! Sonuçlar bekleniyor...
          <div className="waiting-dots"><span/><span/><span/></div>
        </div>
      )}

      {/* Submissions grid */}
      <div className="voting-grid">
        {submissions.map(({ playerId, playerName, meme }) => {
          const isMine = playerId === player?.id;
          const isVotedFor = myVote === playerId;
          const cantVote = isMine || !!myVote || !canVote;

          return (
            <VotingCard
              key={playerId}
              meme={meme}
              playerName={playerName}
              isMine={isMine}
              isVotedFor={isVotedFor}
              disabled={cantVote}
              onVote={() => handleVote(playerId)}
            />
          );
        })}
      </div>
    </div>
  );
}

function VotingCard({ meme, playerName, isMine, isVotedFor, disabled, onVote }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className={`voting-card
        ${isVotedFor ? 'voting-card--voted' : ''}
        ${isMine ? 'voting-card--mine' : ''}
        ${!disabled ? 'voting-card--clickable' : ''}
      `}
      onClick={disabled ? undefined : onVote}
    >
      {isVotedFor && <div className="voting-card-check">❤️</div>}
      {isMine && <div className="voting-card-mine-badge">Senin 👀</div>}
      <div className="meme-img-wrap">
        {imgError ? (
          <div className="meme-img-fallback">🖼️<br />{meme.title}</div>
        ) : (
          <img
            src={meme.preview || meme.url}
            alt={meme.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        )}
      </div>
      <div className="voting-card-info">
        <span className="meme-title">{meme.title}</span>
        {!isMine && !disabled && !isVotedFor && (
          <button className="btn btn-vote">❤️ Oy Ver</button>
        )}
        {isMine && <span className="meme-sub">Bu senin meme'in</span>}
      </div>
    </div>
  );
}
