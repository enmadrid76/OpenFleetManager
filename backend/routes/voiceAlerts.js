import { Router } from 'express';
import { createReadStream } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { findById, readAll, update } from '../utils/jsonStore.js';

const router = Router();
const dataDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');
const audioDir = path.join(dataDir, 'voice-alert-audio');

function publicAlert(alert) {
  const { audioPath, ...rest } = alert;
  return rest;
}

// GET /api/voice-alerts?driverId=...&unplayed=true
router.get('/', async (req, res) => {
  const { driverId, unplayed } = req.query;
  let alerts = await readAll('voiceAlerts');

  if (driverId) alerts = alerts.filter((alert) => alert.driverId === driverId);
  if (unplayed === 'true') alerts = alerts.filter((alert) => !alert.playedAt);

  alerts.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  res.json(alerts.map(publicAlert));
});

// GET /api/voice-alerts/:id/audio
router.get('/:id/audio', async (req, res) => {
  const alert = await findById('voiceAlerts', req.params.id);
  if (!alert?.audioPath || alert.status !== 'ready') return res.status(404).json({ error: 'Audio not found' });

  res.type('audio/mpeg');
  createReadStream(path.join(audioDir, alert.audioPath)).on('error', () => {
    res.status(404).end();
  }).pipe(res);
});

// POST /api/voice-alerts/:id/played
router.post('/:id/played', async (req, res) => {
  const alert = await update('voiceAlerts', req.params.id, { playedAt: new Date().toISOString() });
  if (!alert) return res.status(404).json({ error: 'Not found' });
  res.json(publicAlert(alert));
});

export default router;
