import { crudRouter } from '../utils/crudRouter.js';
import { findById, update, insert } from '../utils/jsonStore.js';
import { optimizeRoute } from '../services/routeOptimization.js';
import { checkForAnomalies } from '../services/anomalyDetection.js';
import { sendVoiceAlert } from '../services/voiceAlerts.js';

// Trip: {
//   clientId, vehicleId, driverId,
//   date, startTime, endTime,
//   origin, destination,
//   stops: [{ label, lat, lng }],            // ordered after optimization
//   category: 'people_transportation' | 'package_delivery',
//   distanceKm, cost, notes,
//   status: 'pending' | 'in_progress' | 'completed' | 'cancelled',
//   gpsTrack: [{ lat, lng, ts }]
// }
const router = crudRouter('trips');

// POST /api/trips/:id/optimize — reorder stops based on road/traffic/weather conditions
router.post('/:id/optimize', async (req, res) => {
  const trip = await findById('trips', req.params.id);
  if (!trip) return res.status(404).json({ error: 'Not found' });
  const optimizedStops = await optimizeRoute(trip);
  const updated = await update('trips', trip.id, { stops: optimizedStops });
  res.json(updated);
});

// POST /api/trips/:id/gps — real-time GPS ping from the driver's phone
// body: { lat, lng, ts }
router.post('/:id/gps', async (req, res) => {
  const trip = await findById('trips', req.params.id);
  if (!trip) return res.status(404).json({ error: 'Not found' });

  const point = { ...req.body, ts: req.body.ts ?? new Date().toISOString() };
  const gpsTrack = [...(trip.gpsTrack ?? []), point];
  const updated = await update('trips', trip.id, { gpsTrack });

  // Detect anomalies + route deviation on every ping
  const anomalies = await checkForAnomalies(updated, point);
  for (const anomaly of anomalies) {
    await insert('anomalies', { clientId: trip.clientId, tripId: trip.id, ...anomaly });
    await sendVoiceAlert(trip, anomaly); // ElevenLabs vocal guidance to the driver
  }

  res.json({ ok: true, anomalies });
});

export default router;
