import { crudRouter } from '../utils/crudRouter.js';
// Anomaly: { clientId, tripId, type, detectedAt, details }
// type: 'speeding' | 'unauthorized_detour' | 'arrived_too_fast' | 'excessive_stop'
export default crudRouter('anomalies');
