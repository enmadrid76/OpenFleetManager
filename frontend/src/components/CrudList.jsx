// Minimal generic list + create form for a backend collection.
import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

export default function CrudList({ title, endpoint, fields }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({});

  const load = () => api.get(endpoint).then(setItems).catch(console.error);
  useEffect(() => { load(); }, [endpoint]);

  const create = async () => {
    await api.post(endpoint, form);
    setForm({});
    load();
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <div className="mb-6 flex flex-wrap gap-2">
        {fields.map((f) => (
          <input
            key={f.key}
            placeholder={f.label}
            value={form[f.key] ?? ''}
            onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
            className="rounded border px-3 py-2 text-sm"
          />
        ))}
        <button onClick={create} className="rounded bg-slate-900 px-4 py-2 text-sm text-white">Add</button>
      </div>
      <table className="w-full border-collapse bg-white text-sm shadow-sm">
        <thead>
          <tr className="border-b bg-slate-100 text-left">
            {fields.map((f) => <th key={f.key} className="p-2">{f.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b">
              {fields.map((f) => <td key={f.key} className="p-2">{String(item[f.key] ?? '')}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
