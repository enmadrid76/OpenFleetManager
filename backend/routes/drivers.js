import { crudRouter } from '../utils/crudRouter.js';
import { readAll, insert } from '../utils/jsonStore.js';

// Driver: { clientId, name, phoneNumber, score }
const router = crudRouter('drivers');

// POST /api/drivers/register — register a driver by real phone number
// (used for the real-device prototype test)
router.post('/register', async (req, res) => {
  const { clientId, name, phoneNumber } = req.body;
  if (!phoneNumber) return res.status(400).json({ error: 'phoneNumber is required' });
  const existing = (await readAll('drivers')).find((d) => d.phoneNumber === phoneNumber);
  if (existing) return res.json(existing);
  const driver = await insert('drivers', { clientId, name, phoneNumber, score: 100 });
  res.status(201).json(driver);
});

export default router;
