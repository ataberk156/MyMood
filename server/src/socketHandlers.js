import {
  createRoom, joinRoom, removePlayerFromRoom,
  getRoom, getPlayerRoom, loadSettings, loadPrompts
} from './gameManager.js';
import { fetchMemes } from './memeService.js';

// ── Helpers ─────────────────────────────────────────────────────
function publicRoom(room) {
  return {
    code: room.code,
    state: room.state,
    currentRound: room.currentRound,
    totalRounds: room.totalRounds,
    settings: {
      minPlayers: room.settings.minPlayers,
      maxPlayers: room.settings.maxPlayers,
      totalRounds: room.settings.totalRounds,
      submissionTimer: room.settings.submissionTimer,
      votingTimer: room.settings.votingTimer
    },
    players: room.players.map(p => ({
      id: p.id,
      name: p.name,
      score: p.score,
      isHost: p.isHost,
      isConnected: p.isConnected,
      handSize: p.hand.length
    }))
  };
}

function pickPrompt(room) {
  const all = loadPrompts();
  if (!all || all.length === 0) return 'Hayatında en komik an hangisiydi?';
  const available = all.filter(p => !room.usedPrompts.includes(p));
  const pool = available.length > 0 ? available : all;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── Main export ──────────────────────────────────────────────────
export function handleSocketConnection(socket, io) {
  console.log(`[+] ${socket.id} bağlandı`);

  // ── CREATE ROOM ─────────────────────────────────────────────
  socket.on('room:create', ({ playerName }) => {
    if (!playerName || playerName.trim().length < 2) {
      socket.emit('error', { message: 'İsmin en az 2 karakter olmalı!' });
      return;
    }
    const { room, player } = createRoom(socket.id, playerName.trim());
    socket.join(room.code);
    socket.emit('room:created', { roomCode: room.code, player, room: publicRoom(room) });
  });

  // ── JOIN ROOM ────────────────────────────────────────────────
  socket.on('room:join', ({ roomCode, playerName }) => {
    if (!playerName || playerName.trim().length < 2) {
      socket.emit('room:error', { message: 'İsmin en az 2 karakter olmalı!' });
      return;
    }
    if (!roomCode) {
      socket.emit('room:error', { message: 'Oda kodu gerekli!' });
      return;
    }
    const result = joinRoom(roomCode.toUpperCase().trim(), socket.id, playerName.trim());
    if (result.error) {
      socket.emit('room:error', { message: result.error });
      return;
    }
    socket.join(result.room.code);
    socket.emit('room:joined', { roomCode: result.room.code, player: result.player, room: publicRoom(result.room) });
    socket.to(result.room.code).emit('room:player_joined', { room: publicRoom(result.room), newPlayer: result.player.name });
  });

  // ── START GAME ───────────────────────────────────────────────
  socket.on('game:start', async ({ roomCode }) => {
    const room = getRoom(roomCode);
    if (!room) return;
    if (room.host !== socket.id) {
      socket.emit('error', { message: 'Sadece oda sahibi oyunu başlatabilir!' });
      return;
    }
    const s = loadSettings();
    if (room.players.length < s.minPlayers) {
      socket.emit('error', { message: `En az ${s.minPlayers} oyuncu gerekli!` });
      return;
    }
    room.settings = s;
    room.totalRounds = s.handSize;  // her tur 1 meme harcar, toplam tur = el boyutu
    room.currentRound = 0;
    room.usedPrompts = [];
    room.players.forEach(p => { p.score = 0; p.hand = []; });

    // Oyun başlamadan önce her oyuncuya tam elini dağıt (bir daha kart verilmeyecek)
    for (const player of room.players) {
      player.hand = await fetchMemes(s.handSize);
    }

    io.to(roomCode).emit('game:started', { totalRounds: room.totalRounds, settings: room.settings });
    await startRound(roomCode, io);
  });

  // ── SUBMIT MEME ──────────────────────────────────────────────
  socket.on('game:submit_meme', ({ roomCode, meme }) => {
    const room = getRoom(roomCode);
    if (!room || room.state !== 'playing') return;
    if (room.submissions[socket.id]) {
      socket.emit('error', { message: 'Zaten bir meme seçtin!' });
      return;
    }
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;
    const memeIdx = player.hand.findIndex(m => m.url === meme.url);
    if (memeIdx === -1) {
      socket.emit('error', { message: 'Bu meme elinde yok!' });
      return;
    }

    room.submissions[socket.id] = meme;
    player.hand.splice(memeIdx, 1);

    const submitted = Object.keys(room.submissions).length;
    const total = room.players.length;
    io.to(roomCode).emit('round:player_submitted', { submittedCount: submitted, totalCount: total, playerName: player.name });

    if (submitted >= total) {
      clearTimeout(room.timers.submission);
      startVoting(roomCode, io);
    }
  });

  // ── VOTE ─────────────────────────────────────────────────────
  socket.on('game:vote', ({ roomCode, targetPlayerId }) => {
    const room = getRoom(roomCode);
    if (!room || room.state !== 'voting') return;
    if (targetPlayerId === socket.id) {
      socket.emit('error', { message: 'Kendine oy veremezsin!' });
      return;
    }
    if (!room.submissions[socket.id]) {
      socket.emit('error', { message: 'Oy kullanmak için önce meme seçmelisin!' });
      return;
    }
    if (room.votes[socket.id]) {
      socket.emit('error', { message: 'Zaten oy kullandın!' });
      return;
    }
    if (!room.submissions[targetPlayerId]) {
      socket.emit('error', { message: 'Geçersiz hedef!' });
      return;
    }

    room.votes[socket.id] = targetPlayerId;
    const voted = Object.keys(room.votes).length;
    const eligible = Object.keys(room.submissions).length;
    io.to(roomCode).emit('round:player_voted', { votedCount: voted, totalCount: eligible });

    if (voted >= eligible) {
      clearTimeout(room.timers.voting);
      endRound(roomCode, io);
    }
  });

  // ── CHAT ─────────────────────────────────────────────────────
  socket.on('chat:message', ({ roomCode, message }) => {
    const room = getRoom(roomCode);
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;
    const msg = String(message || '').trim().slice(0, 200);
    if (!msg) return;
    io.to(roomCode).emit('chat:message', {
      playerId: socket.id,
      playerName: player.name,
      message: msg,
      timestamp: Date.now()
    });
  });

  // ── WEBRTC SIGNALING ─────────────────────────────────────────
  socket.on('webrtc:join-voice', ({ roomCode }) => {
    const room = getRoom(roomCode);
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;
    socket.to(roomCode).emit('webrtc:peer-joined', { peerId: socket.id, peerName: player.name });
  });

  socket.on('webrtc:leave-voice', ({ roomCode }) => {
    socket.to(roomCode).emit('webrtc:peer-left', { peerId: socket.id });
  });

  socket.on('webrtc:offer', ({ targetId, offer }) => {
    socket.to(targetId).emit('webrtc:offer', { fromId: socket.id, offer });
  });

  socket.on('webrtc:answer', ({ targetId, answer }) => {
    socket.to(targetId).emit('webrtc:answer', { fromId: socket.id, answer });
  });

  socket.on('webrtc:ice-candidate', ({ targetId, candidate }) => {
    socket.to(targetId).emit('webrtc:ice-candidate', { fromId: socket.id, candidate });
  });

  // ── LEAVE ROOM ───────────────────────────────────────────────
  socket.on('room:leave', ({ roomCode }) => {
    handleLeave(socket, io, roomCode);
  });

  // ── DISCONNECT ───────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`[-] ${socket.id} ayrıldı`);
    const room = getPlayerRoom(socket.id);
    if (room) handleLeave(socket, io, room.code);
  });
}

// ── Game flow helpers ────────────────────────────────────────────
function startRound(roomCode, io) {
  const room = getRoom(roomCode);
  if (!room) return;

  room.currentRound++;
  room.submissions = {};
  room.votes = {};
  room.state = 'playing';

  const prompt = pickPrompt(room);
  room.currentPrompt = prompt;
  room.usedPrompts.push(prompt);

  // Kart dağıtımı oyun başında yapıldı; burada sadece mevcut eli gönder
  for (const player of room.players) {
    io.to(player.id).emit('round:start', {
      round: room.currentRound,
      totalRounds: room.totalRounds,
      prompt,
      hand: player.hand,
      timeLimit: room.settings.submissionTimer,
      players: room.players.map(p => ({ id: p.id, name: p.name, score: p.score, isHost: p.isHost }))
    });
  }

  // Submission timer
  room.timers.submission = setTimeout(() => {
    startVoting(roomCode, io);
  }, room.settings.submissionTimer * 1000);
}

function startVoting(roomCode, io) {
  const room = getRoom(roomCode);
  if (!room) return;
  clearTimeout(room.timers.submission);

  if (Object.keys(room.submissions).length === 0) {
    endRound(roomCode, io);
    return;
  }

  room.state = 'voting';

  const entries = Object.entries(room.submissions).map(([pid, meme]) => ({
    playerId: pid,
    playerName: room.players.find(p => p.id === pid)?.name || '?',
    meme
  }));
  // Shuffle to reduce position bias
  entries.sort(() => Math.random() - 0.5);

  io.to(roomCode).emit('round:voting_start', {
    prompt: room.currentPrompt,
    submissions: entries,
    timeLimit: room.settings.votingTimer
  });

  room.timers.voting = setTimeout(() => {
    endRound(roomCode, io);
  }, room.settings.votingTimer * 1000);
}

function endRound(roomCode, io) {
  const room = getRoom(roomCode);
  if (!room) return;
  clearTimeout(room.timers.submission);
  clearTimeout(room.timers.voting);

  // Tally votes
  const tally = {};
  for (const targetId of Object.values(room.votes)) {
    tally[targetId] = (tally[targetId] || 0) + 1;
  }

  let roundWinnerId = null;
  let maxVotes = 0;
  for (const [pid, count] of Object.entries(tally)) {
    if (count > maxVotes) { maxVotes = count; roundWinnerId = pid; }
  }

  if (roundWinnerId) {
    const winner = room.players.find(p => p.id === roundWinnerId);
    if (winner) winner.score += maxVotes;
  }

  const results = Object.entries(room.submissions).map(([pid, meme]) => ({
    playerId: pid,
    playerName: room.players.find(p => p.id === pid)?.name || '?',
    meme,
    votes: tally[pid] || 0,
    isWinner: pid === roundWinnerId
  })).sort((a, b) => b.votes - a.votes);

  room.state = 'results';

  io.to(roomCode).emit('round:results', {
    roundWinnerId,
    roundWinnerName: room.players.find(p => p.id === roundWinnerId)?.name || null,
    round: room.currentRound,
    totalRounds: room.totalRounds,
    prompt: room.currentPrompt,
    results,
    scores: room.players.map(p => ({ id: p.id, name: p.name, score: p.score })).sort((a, b) => b.score - a.score)
  });

  const delay = (room.settings.resultsTimer || 6) * 1000;
  if (room.currentRound >= room.totalRounds) {
    room.timers.results = setTimeout(() => endGame(roomCode, io), delay);
  } else {
    room.timers.results = setTimeout(() => startRound(roomCode, io), delay);
  }
}

function endGame(roomCode, io) {
  const room = getRoom(roomCode);
  if (!room) return;
  room.state = 'gameover';

  const finalScores = room.players
    .map(p => ({ id: p.id, name: p.name, score: p.score }))
    .sort((a, b) => b.score - a.score);

  io.to(roomCode).emit('game:over', { winner: finalScores[0] || null, finalScores });
}

function handleLeave(socket, io, roomCode) {
  const result = removePlayerFromRoom(roomCode, socket.id);
  if (!result) return;
  socket.leave(roomCode);
  if (result.deleted) return;

  io.to(roomCode).emit('room:player_left', {
    playerId: socket.id,
    room: publicRoom(result.room)
  });
}
