import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';

const emptyVehicle = {
  clientId: '',
  groupId: '',
  name: '',
  plate: '',
  odometerKm: '',
  maintenanceDueAtKm: '',
};

function toNumberOrNull(value) {
  if (value === '' || value == null) return null;
  return Number(value);
}

function normalizeVehicle(values) {
  return {
    clientId: values.clientId,
    groupId: values.groupId || null,
    name: values.name.trim(),
    plate: values.plate.trim(),
    odometerKm: toNumberOrNull(values.odometerKm),
    maintenanceDueAtKm: toNumberOrNull(values.maintenanceDueAtKm),
  };
}

function vehicleToForm(vehicle, fallbackClientId = '') {
  return {
    clientId: vehicle.clientId || fallbackClientId,
    groupId: vehicle.groupId || '',
    name: vehicle.name || '',
    plate: vehicle.plate || '',
    odometerKm: vehicle.odometerKm ?? '',
    maintenanceDueAtKm: vehicle.maintenanceDueAtKm ?? '',
  };
}

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [clients, setClients] = useState([]);
  const [fleets, setFleets] = useState([]);
  const [form, setForm] = useState(emptyVehicle);
  const [editingId, setEditingId] = useState(null);
  const [editing, setEditing] = useState(emptyVehicle);
  const [error, setError] = useState('');

  const clientById = useMemo(
    () => Object.fromEntries(clients.map((client) => [client.id, client])),
    [clients],
  );

  const fleetById = useMemo(
    () => Object.fromEntries(fleets.map((fleet) => [fleet.id, fleet])),
    [fleets],
  );

  const load = () => Promise.all([api.get('/vehicles'), api.get('/clients'), api.get('/vehicle-groups')])
    .then(([vehicleItems, clientItems, fleetItems]) => {
      setVehicles(vehicleItems);
      setClients(clientItems);
      setFleets(fleetItems);
      setForm((current) => ({
        ...current,
        clientId: current.clientId || clientItems[0]?.id || '',
      }));
    })
    .catch((err) => setError(err.message));

  useEffect(() => { load(); }, []);

  const fleetOptionsForClient = (clientId) => fleets.filter((fleet) => fleet.clientId === clientId);

  const validate = (values) => {
    if (!values.clientId) return 'Choose a client.';
    if (!values.name.trim()) return 'Vehicle name is required.';
    if (!values.plate.trim()) return 'Plate is required.';
    if (values.odometerKm !== '' && Number.isNaN(Number(values.odometerKm))) return 'Odometer must be a number.';
    if (values.maintenanceDueAtKm !== '' && Number.isNaN(Number(values.maintenanceDueAtKm))) return 'Maintenance due must be a number.';
    return '';
  };

  const createVehicle = async (event) => {
    event.preventDefault();
    const message = validate(form);
    if (message) {
      setError(message);
      return;
    }

    setError('');
    await api.post('/vehicles', normalizeVehicle(form));
    setForm({ ...emptyVehicle, clientId: form.clientId });
    await load();
  };

  const startEdit = (vehicle) => {
    setEditingId(vehicle.id);
    setEditing(vehicleToForm(vehicle, clients[0]?.id));
    setError('');
  };

  const saveEdit = async (vehicleId) => {
    const message = validate(editing);
    if (message) {
      setError(message);
      return;
    }

    setError('');
    await api.put(`/vehicles/${vehicleId}`, normalizeVehicle(editing));
    setEditingId(null);
    setEditing(emptyVehicle);
    await load();
  };

  const deleteVehicle = async (vehicleId) => {
    setError('');
    await api.delete(`/vehicles/${vehicleId}`);
    if (editingId === vehicleId) setEditingId(null);
    await load();
  };

  const renderClientSelect = (value, onChange) => (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
    >
      <option value="">Choose client</option>
      {clients.map((client) => (
        <option key={client.id} value={client.id}>{client.name}</option>
      ))}
    </select>
  );

  const renderFleetSelect = (clientId, value, onChange) => (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
    >
      <option value="">No fleet</option>
      {fleetOptionsForClient(clientId).map((fleet) => (
        <option key={fleet.id} value={fleet.id}>{fleet.name}</option>
      ))}
    </select>
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">Vehicles</h2>
        <p className="mt-1 text-sm text-slate-500">Manage vehicles and assign each one to a client fleet.</p>
      </div>

      <form onSubmit={createVehicle} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Create vehicle</h3>
          <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
            Create
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <label className="block text-sm font-medium text-slate-700">
            Client
            <div className="mt-1">
              {renderClientSelect(form.clientId, (clientId) => setForm({ ...form, clientId, groupId: '' }))}
            </div>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Fleet
            <div className="mt-1">
              {renderFleetSelect(form.clientId, form.groupId, (groupId) => setForm({ ...form, groupId }))}
            </div>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Vehicle name
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Truck 12"
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Plate
            <input
              value={form.plate}
              onChange={(event) => setForm({ ...form, plate: event.target.value })}
              placeholder="P123-456"
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Odometer (km)
            <input
              value={form.odometerKm}
              onChange={(event) => setForm({ ...form, odometerKm: event.target.value })}
              placeholder="12000"
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Maintenance due at (km)
            <input
              value={form.maintenanceDueAtKm}
              onChange={(event) => setForm({ ...form, maintenanceDueAtKm: event.target.value })}
              placeholder="15000"
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
            <th className="p-2">Fleet</th>
            <th className="p-2">Name</th>
            <th className="p-2">Plate</th>
            <th className="p-2">Odometer</th>
            <th className="p-2">Maintenance due</th>
            <th className="p-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((vehicle) => {
            const isEditing = editingId === vehicle.id;
            return (
              <tr key={vehicle.id} className="border-b align-top">
                <td className="p-2">
                  {isEditing
                    ? renderClientSelect(editing.clientId, (clientId) => setEditing({ ...editing, clientId, groupId: '' }))
                    : clientById[vehicle.clientId]?.name ?? vehicle.clientId ?? '-'}
                </td>
                <td className="p-2">
                  {isEditing
                    ? renderFleetSelect(editing.clientId, editing.groupId, (groupId) => setEditing({ ...editing, groupId }))
                    : fleetById[vehicle.groupId]?.name ?? '-'}
                </td>
                <td className="p-2">
                  {isEditing ? (
                    <input value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} className="w-full rounded border border-slate-300 px-2 py-1 text-sm" />
                  ) : vehicle.name ?? '-'}
                </td>
                <td className="p-2">
                  {isEditing ? (
                    <input value={editing.plate} onChange={(event) => setEditing({ ...editing, plate: event.target.value })} className="w-full rounded border border-slate-300 px-2 py-1 text-sm" />
                  ) : vehicle.plate ?? '-'}
                </td>
                <td className="p-2">
                  {isEditing ? (
                    <input value={editing.odometerKm} onChange={(event) => setEditing({ ...editing, odometerKm: event.target.value })} className="w-full rounded border border-slate-300 px-2 py-1 text-sm" />
                  ) : vehicle.odometerKm ?? '-'}
                </td>
                <td className="p-2">
                  {isEditing ? (
                    <input value={editing.maintenanceDueAtKm} onChange={(event) => setEditing({ ...editing, maintenanceDueAtKm: event.target.value })} className="w-full rounded border border-slate-300 px-2 py-1 text-sm" />
                  ) : vehicle.maintenanceDueAtKm ?? '-'}
                </td>
                <td className="p-2 text-right">
                  {isEditing ? (
                    <div className="flex justify-end gap-2">
                      <button onClick={() => saveEdit(vehicle.id)} className="rounded bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-500">
                        Save
                      </button>
                      <button onClick={() => setEditingId(null)} className="rounded border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2">
                      <button onClick={() => startEdit(vehicle)} className="rounded border border-indigo-200 px-3 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50">
                        Edit
                      </button>
                      <button onClick={() => deleteVehicle(vehicle.id)} className="rounded border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50">
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
      {vehicles.length === 0 && <p className="text-sm text-slate-500">No vehicles yet. Create one above.</p>}
    </div>
  );
}
