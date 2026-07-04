// Trip simulator: replays a synthetic GPS track through the real ping pipeline,
// so anomaly detection and voice alerts behave exactly as with a live phone.
// Used by the dashboard "Simulate trip" button (30s or 60s, with/without anomalies)
// and for the stationary real-phone prototype test.
import { findById, update, insert } from '../utils/jsonStore.js';
import { checkForAnomalies } from './anomalyDetection.js';
import { sendVoiceAlert } from './voiceAlerts.js';

function interpolate(a, b, t) {
  return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
}

function buildPath(trip, withAnomalies) {
  const waypoints = [trip.origin, ...(trip.stops ?? []), trip.destination].filter((p) => p?.lat != null);
  if (waypoints.length < 2) return [];
  const points = [];
  const SEGMENT_STEPS = 10;
  for (let i = 0; i < waypoints.length - 1; i++) {
    for (let s = 0; s <= SEGMENT_STEPS; s++) {
      points.push(interpolate(waypoints[i], waypoints[i + 1], s / SEGMENT_STEPS));
    }
  }
  if (withAnomalies) {
    // Inject a detour bulge mid-trip (~2km offset) to trigger 'unauthorized_detour'
    const mid = Math.floor(points.length / 2);
    for (let i = mid; i < Math.min(mid + 3, points.length); i++) {
      points[i] = { lat: points[i].lat + 0.02, lng: points[i].lng + 0.02 };
    }
  }
  return points;
}

export async function runTripSimulation(trip, { durationSeconds = 30, withAnomalies = false }) {
  const path = buildPath(trip, withAnomalies);
  if (!path.length) return;

  await update('trips', trip.id, { status: 'in_progress', gpsTrack: [] });
  const intervalMs = (durationSeconds * 1000) / path.length;

  for (const [i, point] of path.entries()) {
    await new Promise((r) => setTimeout(r, intervalMs));
    const current = await findById('trips', trip.id);
    if (!current || current.status === 'cancelled') return;

    // Timestamps are compressed: pretend each tick is 1 simulated minute,
    // so speed/stop math produces realistic values during a 30-60s replay.
    const ts = new Date(Date.now() + i * 60_000).toISOString();
    const gpsTrack = [...(current.gpsTrack ?? []), { ...point, ts }];
    const updated = await update('trips', trip.id, { gpsTrack });

    const anomalies = await checkForAnomalies(updated, { ...point, ts });
    for (const anomaly of anomalies) {
      await insert('anomalies', { clientId: trip.clientId, tripId: trip.id, ...anomaly });
      await sendVoiceAlert(trip, anomaly);
    }
  }

  await update('trips', trip.id, { status: 'completed' });
}
