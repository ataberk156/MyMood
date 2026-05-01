import express from 'express';
import { loadSettings, saveSettings, loadPrompts, savePrompts, getAllRooms } from './gameManager.js';

const router = express.Router();

// Simple in-memory session store
const sessions = new Set();

function genToken() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function auth(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ error: 'Yetkisiz erişim!' });
  }
  next();
}

// ── Auth ─────────────────────────────────────────────────────────
router.post('/login', (req, res) => {
  const { password } = req.body || {};
  if (!password) return res.status(400).json({ error: 'Şifre gerekli!' });
  const settings = loadSettings();
  if (password !== settings.adminPassword) {
    return res.status(401).json({ error: 'Yanlış şifre!' });
  }
  const token = genToken();
  sessions.add(token);
  setTimeout(() => sessions.delete(token), 24 * 60 * 60 * 1000); // 24h TTL
  res.json({ token });
});

router.post('/logout', auth, (req, res) => {
  sessions.delete(req.headers['x-admin-token']);
  res.json({ success: true });
});

router.get('/me', auth, (req, res) => {
  res.json({ authenticated: true });
});

// ── Settings ─────────────────────────────────────────────────────
router.get('/settings', auth, (req, res) => {
  const { adminPassword, ...rest } = loadSettings();
  res.json(rest);
});

router.put('/settings', auth, (req, res) => {
  const updates = req.body || {};
  if (updates.totalRounds !== undefined && (updates.totalRounds < 1 || updates.totalRounds > 20)) {
    return res.status(400).json({ error: 'Tur sayısı 1-20 arası olmalı!' });
  }
  if (updates.minPlayers !== undefined && (updates.minPlayers < 2 || updates.minPlayers > 10)) {
    return res.status(400).json({ error: 'Minimum oyuncu 2-10 arası olmalı!' });
  }
  if (updates.maxPlayers !== undefined && (updates.maxPlayers < 2 || updates.maxPlayers > 12)) {
    return res.status(400).json({ error: 'Maksimum oyuncu 2-12 arası olmalı!' });
  }
  if (updates.submissionTimer !== undefined && (updates.submissionTimer < 10 || updates.submissionTimer > 300)) {
    return res.status(400).json({ error: 'Gönderim süresi 10-300 saniye arası olmalı!' });
  }
  if (updates.votingTimer !== undefined && (updates.votingTimer < 10 || updates.votingTimer > 120)) {
    return res.status(400).json({ error: 'Oylama süresi 10-120 saniye arası olmalı!' });
  }

  const current = loadSettings();
  // Don't allow overwriting adminPassword via this endpoint
  const { adminPassword, ...safeUpdates } = updates;
  const merged = { ...current, ...safeUpdates };
  saveSettings(merged);
  const { adminPassword: _, ...result } = merged;
  res.json(result);
});

router.put('/password', auth, (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  const settings = loadSettings();
  if (currentPassword !== settings.adminPassword) {
    return res.status(401).json({ error: 'Mevcut şifre yanlış!' });
  }
  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: 'Yeni şifre en az 4 karakter olmalı!' });
  }
  settings.adminPassword = newPassword;
  saveSettings(settings);
  res.json({ success: true });
});

// ── Prompts ───────────────────────────────────────────────────────
router.get('/prompts', auth, (req, res) => {
  res.json(loadPrompts());
});

router.post('/prompts', auth, (req, res) => {
  const { text } = req.body || {};
  if (!text || text.trim().length < 3) {
    return res.status(400).json({ error: 'Metin en az 3 karakter olmalı!' });
  }
  const prompts = loadPrompts();
  const trimmed = text.trim();
  if (prompts.includes(trimmed)) {
    return res.status(400).json({ error: 'Bu metin zaten mevcut!' });
  }
  prompts.push(trimmed);
  savePrompts(prompts);
  res.json({ prompts });
});

router.put('/prompts/:index', auth, (req, res) => {
  const idx = parseInt(req.params.index, 10);
  const { text } = req.body || {};
  if (!text || text.trim().length < 3) {
    return res.status(400).json({ error: 'Metin en az 3 karakter olmalı!' });
  }
  const prompts = loadPrompts();
  if (isNaN(idx) || idx < 0 || idx >= prompts.length) {
    return res.status(404).json({ error: 'Metin bulunamadı!' });
  }
  prompts[idx] = text.trim();
  savePrompts(prompts);
  res.json({ prompts });
});

router.delete('/prompts/:index', auth, (req, res) => {
  const idx = parseInt(req.params.index, 10);
  const prompts = loadPrompts();
  if (isNaN(idx) || idx < 0 || idx >= prompts.length) {
    return res.status(404).json({ error: 'Metin bulunamadı!' });
  }
  prompts.splice(idx, 1);
  savePrompts(prompts);
  res.json({ prompts });
});

// ── Rooms (read-only overview) ────────────────────────────────────
router.get('/rooms', auth, (req, res) => {
  res.json(getAllRooms());
});

export default router;
