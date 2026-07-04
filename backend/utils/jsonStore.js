// Tiny JSON-file data store. One file per collection under backend/data/.
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { nanoid } from 'nanoid';

const dataDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');
const fileFor = (collection) => path.join(dataDir, `${collection}.json`);

export async function readAll(collection) {
  try {
    return JSON.parse(await readFile(fileFor(collection), 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

export async function writeAll(collection, items) {
  await writeFile(fileFor(collection), JSON.stringify(items, null, 2));
}

export async function findById(collection, id) {
  return (await readAll(collection)).find((x) => x.id === id) ?? null;
}

export async function insert(collection, item) {
  const items = await readAll(collection);
  const record = { id: nanoid(10), createdAt: new Date().toISOString(), ...item };
  items.push(record);
  await writeAll(collection, items);
  return record;
}

export async function update(collection, id, patch) {
  const items = await readAll(collection);
  const idx = items.findIndex((x) => x.id === id);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...patch, id, updatedAt: new Date().toISOString() };
  await writeAll(collection, items);
  return items[idx];
}

export async function remove(collection, id) {
  const items = await readAll(collection);
  const next = items.filter((x) => x.id !== id);
  if (next.length === items.length) return false;
  await writeAll(collection, next);
  return true;
}
