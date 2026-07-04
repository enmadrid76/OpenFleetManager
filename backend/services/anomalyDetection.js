// Anomaly detection over incoming GPS pings.
// Types: speeding | unauthorized_detour | arrived_too_fast | excessive_stop
import { haversineKm } from './routeOptimization.js';

const SPEED_LIMIT_KMH = 110;          // MVP: single global threshold
const DETOUR_THRESHOLD_KM = 1.5;      // distance from planned route to count as detour
const STOP_RADIUS_KM = 0.05;          // ~50m: considered "not moving"
const MAX_STOP_MINUTES = 15;
const MIN_PLAUSIBLE_TRIP_MINUTES = 5; // arriving faster than this => arrived_too_fast

export async function checkForAnomalies(trip, latestPoint) {
  const anomalies = [];
  const track = trip.gpsTrack ?? [];
  if (track.length < 2) return anomalies;

  const prev = track[track.length - 2];
  const dtHours = (new Date(latestPoint.ts) - new Date(prev.ts)) / 3.6e6;
  const distKm = haversineKm(prev, latestPoint);

  // 1. Speeding (derived from consecutive GPS points)
  if (dtHours > 0) {
    const speedKmh = distKm / dtHours;
    if (speedKmh > SPEED_LIMIT_KMH) {
      anomalies.push({ type: 'speeding', detectedAt: latestPoint.ts, details: { speedKmh: Math.round(speedKmh) } });
    }
  }

  // 2. Unauthorized detour (deviation from planned route: origin -> stops -> destination)
  const plannedPoints = [trip.origin, ...(trip.stops ?? []), trip.destination].filter((p) => p?.lat != null);
  if (plannedPoints.length) {
    const minDist = Math.min(...plannedPoints.map((p) => haversineKm(p, latestPoint)));
    if (minDist > DETOUR_THRESHOLD_KM) {
      anomalies.push({ type: 'unauthorized_detour', detectedAt: latestPoint.ts, details: { kmOffRoute: +minDist.toFixed(2) } });
    }
  }

  // 3. Excessive stop (stationary too long)
  let stationaryStart = null;
  for (let i = track.length - 1; i > 0; i--) {
    if (haversineKm(track[i - 1], track[i]) < STOP_RADIUS_KM) stationaryStart = track[i - 1].ts;
    else break;
  }
  if (stationaryStart) {
    const stopMinutes = (new Date(latestPoint.ts) - new Date(stationaryStart)) / 6e4;
    if (stopMinutes > MAX_STOP_MINUTES) {
      anomalies.push({ type: 'excessive_stop', detectedAt: latestPoint.ts, details: { stopMinutes: Math.round(stopMinutes) } });
    }
  }

  // 4. Arrived too fast (checked when near destination)
  if (trip.destination?.lat != null && haversineKm(latestPoint, trip.destination) < STOP_RADIUS_KM * 2) {
    const elapsedMinutes = (new Date(latestPoint.ts) - new Date(track[0].ts)) / 6e4;
    if (elapsedMinutes < MIN_PLAUSIBLE_TRIP_MINUTES) {
      anomalies.push({ type: 'arrived_too_fast', detectedAt: latestPoint.ts, details: { elapsedMinutes: +elapsedMinutes.toFixed(1) } });
    }
  }

  return anomalies;
}
