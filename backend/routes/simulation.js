import { Router } from 'express';
import { findById } from '../utils/jsonStore.js';
import { runTripSimulation } from '../services/gpsSimulator.js';

const router = Router();

// POST /api/simulation/trips/:id
// body: { durationSeconds: 30 | 60, withAnomalies: boolean }
// Replays a simulated GPS track through the same pipeline as real pings,
// so anomaly detection and ElevenLabs voice alerts fire exactly as in production.
router.post('/trips/:id', async (req, res) => {
  const trip = await findById('trips', req.params.id);
  if (!trip) return res.status(404).json({ error: 'Not found' });

  const { durationSeconds = 30, withAnomalies = false } = req.body;
  runTripSimulation(trip, { durationSeconds, withAnomalies }); // fire and forget
  res.json({ started: true, tripId: trip.id, durationSeconds, withAnomalies });
});

export default router;
