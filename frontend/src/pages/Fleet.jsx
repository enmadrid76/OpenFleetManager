import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';

const emptyForm = { clientId: '', name: '', description: '' };

export default function Fleet() {
  const [clients, setClients] = useState([]);
  const [fleets, setFleets] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [editing, setEditing] = useState(emptyForm);
  const [error, setError] = useState('');

  const clientById = useMemo(
    () => Object.fromEntries(clients.map((client) => [client.id, client])),
    [clients],
  );

  const load = () => Promise.all([api.get('/clients'), api.get('/vehicle-groups')])
    .then(([clientItems, fleetItems]) => {
      setClients(clientItems);
      setFleets(fleetItems);
      setForm((current) => ({
        ...current,
        clientId: current.clientId || clientItems[0]?.id || '',
      }));
    })
    .catch((err) => setError(err.message));

  useEffect(() => { load(); }, []);

  const validate = (values) => {
    if (!values.clientId) return 'Choose a client.';
    if (!values.name.trim()) return 'Fleet name is required.';
    return '';
  };

  const createFleet = async (event) => {
    event.preventDefault();
    const message = validate(form);
    if (message) {
      setError(message);
      return;
    }

    setError('');
    await api.post('/vehicle-groups', {
      clientId: form.clientId,
      name: form.name.trim(),
      description: form.description.trim(),
    });
    setForm({ ...emptyForm, clientId: form.clientId });
    await load();
  };

  const startEdit = (fleet) => {
    setEditingId(fleet.id);
    setEditing({
      clientId: fleet.clientId || clients[0]?.id || '',
      name: fleet.name || '',
      description: fleet.description || '',
    });
    setError('');
  };

  const saveEdit = async (fleetId) => {
    const message = validate(editing);
    if (message) {
      setError(message);
      return;
    }

    setError('');
    await api.put(`/vehicle-groups/${fleetId}`, {
      clientId: editing.clientId,
      name: editing.name.trim(),
      description: editing.description.trim(),
    });
    setEditingId(null);
    setEditing(emptyForm);
    await load();
  };

  const deleteFleet = async (fleetId) => {
    setError('');
    await api.delete(`/vehicle-groups/${fleetId}`);
    if (editingId === fleetId) setEditingId(null);
    await load();
  };

  const clientOptions = (
    <>
      <option value="">Choose client</option>
      {clients.map((client) => (
        <option key={client.id} value={client.id}>{client.name}</option>
      ))}
    </>
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">Fleet</h2>
        <p className="mt-1 text-sm text-slate-500">Manage client fleets used to organize vehicles.</p>
      </div>

      <form onSubmit={createFleet} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Create fleet</h3>
          <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
            Create
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-[minmax(180px,1fr)_minmax(180px,1fr)_minmax(220px,2fr)]">
          <label className="block text-sm font-medium text-slate-700">
            Client
            <select
              value={form.clientId}
              onChange={(event) => setForm({ ...form, clientId: event.target.value })}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            >
              {clientOptions}
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Fleet name
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Downtown delivery"
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Notes
            <input
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="Route, region, or usage"
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
        </div>

        {error && <p className="mt-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </form>

      <table className="w-full border-collapse bg-white text-sm shadow-sm">
        <thead>
          <tr className="border-b bg-slate-100 text-left">
            <th className="p-2">Client</th>
            <th className="p-2">Fleet name</th>
            <th className="p-2">Notes</th>
            <th className="p-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {fleets.map((fleet) => {
            const isEditing = editingId === fleet.id;
            return (
              <tr key={fleet.id} className="border-b align-top">
                <td className="p-2">
                  {isEditing ? (
                    <select
                      value={editing.clientId}
                      onChange={(event) => setEditing({ ...editing, clientId: event.target.value })}
                      className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                    >
                      {clientOptions}
                    </select>
                  ) : (
                    clientById[fleet.clientId]?.name ?? fleet.clientId ?? '-'
                  )}
                </td>
                <td className="p-2">
                  {isEditing ? (
                    <input
                      value={editing.name}
                      onChange={(event) => setEditing({ ...editing, name: event.target.value })}
                      className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                    />
                  ) : (
                    fleet.name ?? '-'
                  )}
                </td>
                <td className="p-2">
                  {isEditing ? (
                    <input
                      value={editing.description}
                      onChange={(event) => setEditing({ ...editing, description: event.target.value })}
                      className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                    />
                  ) : (
                    fleet.description || '-'
                  )}
                </td>
                <td className="p-2 text-right">
                  {isEditing ? (
                    <div className="flex justify-end gap-2">
                      <button onClick={() => saveEdit(fleet.id)} className="rounded bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-500">
                        Save
                      </button>
                      <button onClick={() => setEditingId(null)} className="rounded border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2">
                      <button onClick={() => startEdit(fleet)} className="rounded border border-indigo-200 px-3 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50">
                        Edit
                      </button>
                      <button onClick={() => deleteFleet(fleet.id)} className="rounded border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50">
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {fleets.length === 0 && <p className="text-sm text-slate-500">No fleets yet. Create one above.</p>}
    </div>
  );
}
