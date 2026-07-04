// Route optimization: reorder trip stops based on road, traffic, and weather conditions.
// MVP: nearest-neighbor ordering by straight-line distance.
// TODO (hackathon stretch): plug in a real routing API (OSRM/Google/Mapbox) + traffic/weather signals.

function haversineKm(a, b) {
  const R = 6371, toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export async function optimizeRoute(trip) {
  const stops = [...(trip.stops ?? [])];
  if (stops.length < 2 || !trip.origin?.lat) return stops;

  const ordered = [];
  let current = trip.origin;
  while (stops.length) {
    stops.sort((s1, s2) => haversineKm(current, s1) - haversineKm(current, s2));
    const next = stops.shift();
    ordered.push(next);
    current = next;
  }
  return ordered;
}

export { haversineKm };
