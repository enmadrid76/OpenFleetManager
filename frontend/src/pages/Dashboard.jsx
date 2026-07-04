// Live dispatch dashboard: real-time status of in-progress trips for a client.
// Polls the backend every 2s (upgrade path: WebSocket/SSE).
import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

const CLIENT_ID = 'client_demo1'; // MVP: hardcoded demo client

export default function Dashboard() {
  const [trips, setTrips] = useState([]);

  useEffect(() => {
    const load = () => api.get(`/reports/clients/${CLIENT_ID}/dispatch`).then(setTrips).catch(console.error);
    load();
    const id = setInterval(load, 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Live Dispatch</h2>
      {trips.length === 0 && <p className="text-slate-500">No trips in progress.</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {trips.map((t) => (
          <div key={t.id} className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="flex justify-between">
              <span className="font-semibold">{t.origin?.label ?? 'Origin'} → {t.destination?.label ?? 'Destination'}</span>
              <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">in progress</span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {t.category} · GPS points: {t.gpsTrack?.length ?? 0}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
