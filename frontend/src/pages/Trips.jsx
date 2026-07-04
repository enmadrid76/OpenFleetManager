// Trips list with the "Simulate" button on the right side of each row:
// choose 30s or 60s duration, with or without anomalies.
import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

export default function Trips() {
  const [trips, setTrips] = useState([]);
  const [duration, setDuration] = useState(30);
  const [withAnomalies, setWithAnomalies] = useState(false);

  const load = () => api.get('/trips').then(setTrips).catch(console.error);
  useEffect(() => { load(); const id = setInterval(load, 2000); return () => clearInterval(id); }, []);

  const simulate = (tripId) =>
    api.post(`/simulation/trips/${tripId}`, { durationSeconds: duration, withAnomalies });

  const badge = {
    pending: 'bg-slate-100 text-slate-600',
    in_progress: 'bg-green-100 text-green-700',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Trips</h2>
        <div className="flex items-center gap-3 text-sm">
          <label>
            Duration:{' '}
            <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="rounded border px-2 py-1">
              <option value={30}>30 seconds</option>
              <option value={60}>1 minute</option>
            </select>
          </label>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={withAnomalies} onChange={(e) => setWithAnomalies(e.target.checked)} />
            With anomalies
          </label>
        </div>
      </div>

      <table className="w-full border-collapse bg-white text-sm shadow-sm">
        <thead>
          <tr className="border-b bg-slate-100 text-left">
            <th className="p-2">Route</th>
            <th className="p-2">Category</th>
            <th className="p-2">Driver</th>
            <th className="p-2">Vehicle</th>
            <th className="p-2">Status</th>
            <th className="p-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {trips.map((t) => (
            <tr key={t.id} className="border-b">
              <td className="p-2">{t.origin?.label ?? '—'} → {t.destination?.label ?? '—'}</td>
              <td className="p-2">{t.category ?? '—'}</td>
              <td className="p-2">{t.driverId ?? '—'}</td>
              <td className="p-2">{t.vehicleId ?? '—'}</td>
              <td className="p-2">
                <span className={`rounded px-2 py-0.5 text-xs ${badge[t.status] ?? badge.pending}`}>{t.status ?? 'pending'}</span>
              </td>
              <td className="p-2 text-right">
                <button
                  onClick={() => simulate(t.id)}
                  className="rounded bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-500"
                >
                  Simulate
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {trips.length === 0 && <p className="mt-4 text-slate-500">No trips yet. Create one via POST /api/trips (form UI: TODO).</p>}
    </div>
  );
}
