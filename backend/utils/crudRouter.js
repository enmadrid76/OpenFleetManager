// Generic Express CRUD router over a JSON collection.
// Supports ?clientId= filtering for multi-tenant scoping.
import { Router } from 'express';
import { readAll, findById, insert, update, remove } from './jsonStore.js';

export function crudRouter(collection) {
  const router = Router();

  router.get('/', async (req, res) => {
    let items = await readAll(collection);
    if (req.query.clientId) items = items.filter((x) => x.clientId === req.query.clientId);
    res.json(items);
  });

  router.get('/:id', async (req, res) => {
    const item = await findById(collection, req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  });

  router.post('/', async (req, res) => {
    res.status(201).json(await insert(collection, req.body));
  });

  router.put('/:id', async (req, res) => {
    const item = await update(collection, req.params.id, req.body);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  });

  router.delete('/:id', async (req, res) => {
    const ok = await remove(collection, req.params.id);
    if (!ok) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  });

  return router;
}
