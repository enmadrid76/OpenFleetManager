import { crudRouter } from '../utils/crudRouter.js';
import { readAll } from '../utils/jsonStore.js';

// Vehicle: { clientId, groupId, name, plate, odometerKm, maintenanceDueAtKm }
const router = crudRouter('vehicles');

// GET /api/vehicles/status/maintenance-due?clientId=...
// Vehicles whose odometer is within `withinKm` (default 500) of maintenanceDueAtKm, or past it.
router.get('/status/maintenance-due', async (req, res) => {
  const withinKm = Number(req.query.withinKm ?? 500);
  let vehicles = await readAll('vehicles');
  if (req.query.clientId) vehicles = vehicles.filter((v) => v.clientId === req.query.clientId);
  const due = vehicles.filter(
    (v) => v.maintenanceDueAtKm != null && v.odometerKm >= v.maintenanceDueAtKm - withinKm
  );
  res.json(due);
});

export default router;
