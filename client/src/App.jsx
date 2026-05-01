import { useEffect, useState, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import socket from './socket.js';
import Home from './components/Home.jsx';
import Lobby from './components/Lobby.jsx';
import GamePhase from './components/GamePhase.jsx';
import VotingPhase from './components/VotingPhase.jsx';
import RoundResults from './components/RoundResults.jsx';
import GameOver from './components/GameOver.jsx';
import AdminApp from './components/admin/AdminApp.jsx';
import Chat from './components/Chat.jsx';
import VoiceChat from './components/VoiceChat.jsx';

const INITIAL_STATE = {
  phase: 'home',       // home | lobby | playing | voting | round_results | game_over
  roomCode: null,
  player: null,        // { id, name, isHost }
  players: [],
  hand: [],
  currentRound: 0,
  totalRounds: 0,
  currentPrompt: null,
  submissions: [],     // voting phase: [{ playerId, playerName, meme }]
  submittedCount: 0,
  totalCount: 0,
  votedCount: 0,
  roundResults: null,  // { roundWinnerName, results, scores, round, totalRounds, prompt }
  finalResults: null,  // { winner, finalScores }
  timeLimit: 60,
  votingTimeLimit: 30,
  error: null,
  toast: null
};

export default function App() {
  const [gs, setGs] = useState(INITIAL_STATE);
  const [chatMessages, setChatMessages] = useState([]);

  const update = useCallback((patch) => setGs(prev => ({ ...prev, ...patch })), []);

  const showToast = useCallback((msg, type = 'info') => {
    update({ toast: { msg, type } });
    setTimeout(() => setGs(prev => ({ ...prev, toast: null })), 3500);
  }, [update]);

  // ── Socket events ─────────────────────────────────────────────
  useEffect(() => {
    socket.connect();

    socket.on('connect', () => console.log('Socket bağlandı'));
    socket.on('disconnect', () => showToast('Sunucu bağlantısı kesildi!', 'error'));

    socket.on('error', ({ message }) => showToast(message, 'error'));
    socket.on('room:error', ({ message }) => showToast(message, 'error'));

    socket.on('room:created', ({ roomCode, player, room }) => {
      update({
        phase: 'lobby',
        roomCode,
        player,
        players: room.players,
        totalRounds: room.settings?.totalRounds || 5
      });
    });

    socket.on('room:joined', ({ roomCode, player, room }) => {
      update({
        phase: 'lobby',
        roomCode,
        player,
        players: room.players,
        totalRounds: room.settings?.totalRounds || 5
      });
    });

    socket.on('room:player_joined', ({ room, newPlayer }) => {
      update({ players: room.players });
      showToast(`${newPlayer} odaya katıldı! 🎉`, 'success');
    });

    socket.on('room:player_left', ({ playerId, room }) => {
      setGs(prev => {
        const leaving = prev.players.find(p => p.id === playerId);
        return { ...prev, players: room.players };
      });
    });

    socket.on('game:started', ({ totalRounds, settings }) => {
      update({ totalRounds, timeLimit: settings.submissionTimer, votingTimeLimit: settings.votingTimer });
      showToast('Oyun başlıyor! 🚀', 'success');
    });

    socket.on('round:start', ({ round, totalRounds, prompt, hand, timeLimit, players }) => {
      update({
        phase: 'playing',
        currentRound: round,
        totalRounds,
        currentPrompt: prompt,
        hand,
        players,
        submittedCount: 0,
        totalCount: players.length,
        timeLimit
      });
    });

    socket.on('round:player_submitted', ({ submittedCount, totalCount, playerName }) => {
      update({ submittedCount, totalCount });
    });

    socket.on('round:voting_start', ({ prompt, submissions, timeLimit }) => {
      update({
        phase: 'voting',
        currentPrompt: prompt,
        submissions,
        votedCount: 0,
        votingTimeLimit: timeLimit
      });
    });

    socket.on('round:player_voted', ({ votedCount, totalCount }) => {
      update({ votedCount, totalCount });
    });

    socket.on('round:results', (data) => {
      update({ phase: 'round_results', roundResults: data, players: data.scores });
    });

    socket.on('game:over', (data) => {
      update({ phase: 'game_over', finalResults: data });
    });

    socket.on('chat:message', (msg) => {
      setChatMessages(prev => [...prev, msg].slice(-100));
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('error');
      socket.off('room:error');
      socket.off('room:created');
      socket.off('room:joined');
      socket.off('room:player_joined');
      socket.off('room:player_left');
      socket.off('game:started');
      socket.off('round:start');
      socket.off('round:player_submitted');
      socket.off('round:voting_start');
      socket.off('round:player_voted');
      socket.off('round:results');
      socket.off('game:over');
      socket.off('chat:message');
      socket.disconnect();
    };
  }, [update, showToast]);

  // ── Actions ───────────────────────────────────────────────────
  const createRoom = (playerName) => socket.emit('room:create', { playerName });
  const joinRoom = (roomCode, playerName) => socket.emit('room:join', { roomCode, playerName });
  const startGame = () => socket.emit('game:start', { roomCode: gs.roomCode });
  const submitMeme = (meme) => socket.emit('game:submit_meme', { roomCode: gs.roomCode, meme });
  const vote = (targetPlayerId) => socket.emit('game:vote', { roomCode: gs.roomCode, targetPlayerId });
  const leaveRoom = () => {
    socket.emit('room:leave', { roomCode: gs.roomCode });
    setGs(INITIAL_STATE);
    setChatMessages([]);
  };

  const gameProps = { gs, createRoom, joinRoom, startGame, submitMeme, vote, leaveRoom, chatMessages };

  return (
    <>
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="*" element={
          <GameView gs={gs} {...gameProps} />
        } />
      </Routes>

      {/* Toast notification */}
      {gs.toast && (
        <div className={`toast toast-${gs.toast.type}`}>
          {gs.toast.msg}
        </div>
      )}
    </>
  );
}

function GameView({ gs, chatMessages, ...props }) {
  const inRoom = gs.phase !== 'home';

  let screen;
  switch (gs.phase) {
    case 'lobby':         screen = <Lobby gs={gs} {...props} />; break;
    case 'playing':       screen = <GamePhase gs={gs} {...props} />; break;
    case 'voting':        screen = <VotingPhase gs={gs} {...props} />; break;
    case 'round_results': screen = <RoundResults gs={gs} {...props} />; break;
    case 'game_over':     screen = <GameOver gs={gs} {...props} />; break;
    default:              screen = <Home gs={gs} {...props} />;
  }

  return (
    <>
      {screen}
      {inRoom && gs.roomCode && (
        <div className="comms-bar">
          <Chat
            roomCode={gs.roomCode}
            playerName={gs.player?.name}
            messages={chatMessages}
          />
          <VoiceChat roomCode={gs.roomCode} />
        </div>
      )}
    </>
  );
}
