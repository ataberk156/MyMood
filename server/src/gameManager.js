import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');

if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

// ── In-memory room storage ──────────────────────────────────────
const rooms = new Map();

// ── Settings helpers ────────────────────────────────────────────
export function loadSettings() {
  const file = path.join(DATA_DIR, 'settings.json');
  if (existsSync(file)) {
    try { return JSON.parse(readFileSync(file, 'utf8')); } catch { /* fall through */ }
  }
  const defaults = {
    totalRounds: 5,
    submissionTimer: 60,
    votingTimer: 30,
    resultsTimer: 6,
    minPlayers: 2,
    maxPlayers: 6,
    handSize: 5,
    adminPassword: 'admin123'
  };
  writeFileSync(file, JSON.stringify(defaults, null, 2));
  return defaults;
}

export function saveSettings(settings) {
  writeFileSync(path.join(DATA_DIR, 'settings.json'), JSON.stringify(settings, null, 2));
}

// ── Prompts helpers ─────────────────────────────────────────────
export function loadPrompts() {
  const file = path.join(DATA_DIR, 'prompts.json');
  if (existsSync(file)) {
    try { return JSON.parse(readFileSync(file, 'utf8')); } catch { /* fall through */ }
  }
  return [];
}

export function savePrompts(prompts) {
  writeFileSync(path.join(DATA_DIR, 'prompts.json'), JSON.stringify(prompts, null, 2));
}

// ── Room code generator ─────────────────────────────────────────
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ── Room CRUD ───────────────────────────────────────────────────
export function createRoom(hostSocketId, hostName) {
  let code;
  do { code = generateCode(); } while (rooms.has(code));

  const player = {
    id: hostSocketId,
    name: hostName,
    score: 0,
    hand: [],
    isHost: true,
    isConnected: true
  };

  rooms.set(code, {
    code,
    host: hostSocketId,
    players: [player],
    state: 'lobby',      // lobby | playing | voting | results | gameover
    currentRound: 0,
    totalRounds: 0,
    currentPrompt: null,
    usedPrompts: [],
    submissions: {},     // { socketId: memeObj }
    votes: {},           // { voterSocketId: targetSocketId }
    timers: {},
    settings: loadSettings()
  });

  return { room: rooms.get(code), player };
}

export function joinRoom(roomCode, socketId, playerName) {
  const room = rooms.get(roomCode);
  if (!room) return { error: 'Oda bulunamadı! Kodu kontrol et.' };
  if (room.state !== 'lobby') return { error: 'Oyun zaten başlamış!' };

  const s = loadSettings();
  if (room.players.length >= s.maxPlayers) {
    return { error: `Oda dolu! (Maksimum ${s.maxPlayers} oyuncu)` };
  }
  if (room.players.find(p => p.name.toLowerCase() === playerName.toLowerCase())) {
    return { error: 'Bu isim zaten kullanılıyor, farklı bir isim seç!' };
  }

  const player = { id: socketId, name: playerName, score: 0, hand: [], isHost: false, isConnected: true };
  room.players.push(player);
  return { room, player };
}

export function removePlayerFromRoom(roomCode, socketId) {
  const room = rooms.get(roomCode);
  if (!room) return null;

  const idx = room.players.findIndex(p => p.id === socketId);
  if (idx === -1) return null;

  const wasHost = room.players[idx].isHost;
  room.players.splice(idx, 1);

  if (room.players.length === 0) {
    clearAllTimers(room);
    rooms.delete(roomCode);
    return { deleted: true };
  }

  if (wasHost) {
    room.players[0].isHost = true;
    room.host = room.players[0].id;
  }

  return { room, wasHost };
}

export function getRoom(roomCode) {
  return rooms.get(roomCode) || null;
}

export function getPlayerRoom(socketId) {
  for (const room of rooms.values()) {
    if (room.players.find(p => p.id === socketId)) return room;
  }
  return null;
}

export function getAllRooms() {
  return Array.from(rooms.values()).map(r => ({
    code: r.code,
    playerCount: r.players.length,
    players: r.players.map(p => ({ name: p.name, score: p.score, isHost: p.isHost })),
    state: r.state,
    currentRound: r.currentRound,
    totalRounds: r.totalRounds
  }));
}

function clearAllTimers(room) {
  Object.values(room.timers).forEach(t => clearTimeout(t));
  room.timers = {};
}
