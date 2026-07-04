import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import clientsRouter from './routes/clients.js';
import vehiclesRouter from './routes/vehicles.js';
import vehicleGroupsRouter from './routes/vehicleGroups.js';
import driversRouter from './routes/drivers.js';
import tripsRouter from './routes/trips.js';
import anomaliesRouter from './routes/anomalies.js';
import simulationRouter from './routes/simulation.js';
import reportsRouter from './routes/reports.js';
import voiceAlertsRouter from './routes/voiceAlerts.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/clients', clientsRouter);
app.use('/api/vehicles', vehiclesRouter);
app.use('/api/vehicle-groups', vehicleGroupsRouter);
app.use('/api/drivers', driversRouter);
app.use('/api/trips', tripsRouter);
app.use('/api/anomalies', anomaliesRouter);
app.use('/api/simulation', simulationRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/voice-alerts', voiceAlertsRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`OpenFleetManager API on http://localhost:${PORT}`));
