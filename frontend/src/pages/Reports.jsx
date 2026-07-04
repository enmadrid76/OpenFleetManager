// Two-tier reporting entry point.
// Admin: cross-client overview with drill-down. Client: own data only.
import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

export default function Reports() {
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    api.get('/reports/admin/overview').then(setOverview).catch(console.error);
  }, []);

  if (!overview) return <p className="text-slate-500">Loading…</p>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Reports — Admin Overview</h2>
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {Object.entries(overview.totals).map(([k, v]) => (
          <div key={k} className="rounded-lg border bg-white p-4 text-center shadow-sm">
            <div className="text-2xl font-bold">{v}</div>
            <div className="text-xs uppercase text-slate-500">{k}</div>
          </div>
        ))}
      </div>
      <table className="w-full border-collapse bg-white text-sm shadow-sm">
        <thead>
          <tr className="border-b bg-slate-100 text-left">
            <th className="p-2">Client</th>
            <th className="p-2">Vehicles</th>
            <th className="p-2">Drivers</th>
            <th className="p-2">Trips</th>
            <th className="p-2">Anomalies</th>
            <th className="p-2">Total cost</th>
          </tr>
        </thead>
        <tbody>
          {overview.perClient.map((row) => (
            <tr key={row.client.id} className="border-b">
              <td className="p-2 font-medium">{row.client.name}</td>
              <td className="p-2">{row.vehicles}</td>
              <td className="p-2">{row.drivers}</td>
              <td className="p-2">{row.trips}</td>
              <td className="p-2">{row.anomalies}</td>
              <td className="p-2">${row.totalCost.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* TODO: client-scoped views — vehicle drill-down (trips, mileage, maintenance)
          and driver drill-down (trips, performance, score, anomaly count) via
          /api/reports/clients/:clientId/vehicles/:vehicleId and .../drivers/:driverId */}
    </div>
  );
}
