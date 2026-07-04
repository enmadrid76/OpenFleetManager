import { Router } from 'express';
import { readAll } from '../utils/jsonStore.js';

const router = Router();

// Tier 1 — application owner: high-level, cross-client, drill-down enabled
// GET /api/reports/admin/overview
router.get('/admin/overview', async (req, res) => {
  const [clients, vehicles, drivers, trips, anomalies] = await Promise.all([
    readAll('clients'), readAll('vehicles'), readAll('drivers'), readAll('trips'), readAll('anomalies'),
  ]);
  const perClient = clients.map((c) => ({
    client: c,
    vehicles: vehicles.filter((v) => v.clientId === c.id).length,
    drivers: drivers.filter((d) => d.clientId === c.id).length,
    trips: trips.filter((t) => t.clientId === c.id).length,
    anomalies: anomalies.filter((a) => a.clientId === c.id).length,
    totalCost: trips.filter((t) => t.clientId === c.id).reduce((s, t) => s + (t.cost ?? 0), 0),
  }));
  res.json({ totals: { clients: clients.length, vehicles: vehicles.length, drivers: drivers.length, trips: trips.length }, perClient });
});

// Tier 2 — client-scoped: live dispatch (real-time trip status)
// GET /api/reports/clients/:clientId/dispatch
router.get('/clients/:clientId/dispatch', async (req, res) => {
  const trips = (await readAll('trips')).filter(
    (t) => t.clientId === req.params.clientId && t.status === 'in_progress'
  );
  res.json(trips);
});

// Client vehicle report with drill-down
// GET /api/reports/clients/:clientId/vehicles/:vehicleId
router.get('/clients/:clientId/vehicles/:vehicleId', async (req, res) => {
  const { clientId, vehicleId } = req.params;
  const [vehicles, trips] = await Promise.all([readAll('vehicles'), readAll('trips')]);
  const vehicle = vehicles.find((v) => v.id === vehicleId && v.clientId === clientId);
  if (!vehicle) return res.status(404).json({ error: 'Not found' });
  const vehicleTrips = trips.filter((t) => t.vehicleId === vehicleId);
  const gpsKm = vehicleTrips.reduce((s, t) => s + (t.distanceKm ?? 0), 0);
  res.json({
    vehicle,
    recentTrips: vehicleTrips.slice(-20).reverse(),
    mileage: { odometerKm: vehicle.odometerKm, gpsMeasuredKm: gpsKm, discrepancyKm: null /* computed vs baseline */ },
    maintenance: { dueAtKm: vehicle.maintenanceDueAtKm, kmRemaining: vehicle.maintenanceDueAtKm != null ? vehicle.maintenanceDueAtKm - vehicle.odometerKm : null },
  });
});

// Client driver report with drill-down
// GET /api/reports/clients/:clientId/drivers/:driverId
router.get('/clients/:clientId/drivers/:driverId', async (req, res) => {
  const { clientId, driverId } = req.params;
  const [drivers, trips, anomalies] = await Promise.all([readAll('drivers'), readAll('trips'), readAll('anomalies')]);
  const driver = drivers.find((d) => d.id === driverId && d.clientId === clientId);
  if (!driver) return res.status(404).json({ error: 'Not found' });
  const driverTrips = trips.filter((t) => t.driverId === driverId);
  const driverAnomalies = anomalies.filter((a) => driverTrips.some((t) => t.id === a.tripId));
  res.json({
    driver,
    recentTrips: driverTrips.slice(-20).reverse(),
    performance: { score: driver.score ?? 100, tripCount: driverTrips.length, anomalyCount: driverAnomalies.length },
    anomalies: driverAnomalies,
  });
});

export default router;
