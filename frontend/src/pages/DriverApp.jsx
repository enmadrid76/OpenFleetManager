// Driver-facing view (open on the phone):
// - register with a real phone number
// - receive trip info and voice guidance (ElevenLabs)
// - presence-check photos WITH a visible visual cue (transparency requirement)
// - GPS source: simulated trip data (for stationary prototype testing)
import { useState } from 'react';
import { api } from '../api/client.js';

export default function DriverApp() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [driver, setDriver] = useState(null);
  const [photoCue, setPhotoCue] = useState(false);

  const register = async () => {
    const d = await api.post('/drivers/register', { clientId: 'client_demo1', name, phoneNumber });
    setDriver(d);
  };

  // Demo of the transparent presence check: flashes a visible cue when a "photo" is taken.
  const takePresencePhoto = () => {
    setPhotoCue(true);
    setTimeout(() => setPhotoCue(false), 1500);
    // TODO: capture via getUserMedia and attach to the active trip
  };

  return (
    <div className="mx-auto max-w-sm">
      <h2 className="text-xl font-bold mb-4">Driver App</h2>

      {!driver ? (
        <div className="space-y-3 rounded-lg border bg-white p-4 shadow-sm">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="w-full rounded border px-3 py-2 text-sm" />
          <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="Phone number" className="w-full rounded border px-3 py-2 text-sm" />
          <button onClick={register} className="w-full rounded bg-slate-900 py-2 text-sm font-semibold text-white">Register as driver</button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <p className="font-semibold">Registered: {driver.name}</p>
            <p className="text-sm text-slate-500">{driver.phoneNumber}</p>
          </div>

          <div className={`relative rounded-lg border p-4 shadow-sm transition-colors ${photoCue ? 'border-amber-400 bg-amber-50' : 'bg-white'}`}>
            <p className="text-sm font-medium">Presence check</p>
            <p className="text-xs text-slate-500 mb-3">A visible cue is always shown when a photo is taken.</p>
            {photoCue && (
              <div className="mb-3 rounded bg-amber-200 px-3 py-2 text-center text-xs font-bold text-amber-900">
                📷 Photo being taken
              </div>
            )}
            <button onClick={takePresencePhoto} className="w-full rounded bg-indigo-600 py-2 text-sm font-semibold text-white">
              Trigger presence check (demo)
            </button>
          </div>

          {/* TODO: active trip panel — receive trip details, play ElevenLabs
              voice guidance audio, and stream simulated GPS while stationary */}
        </div>
      )}
    </div>
  );
}
