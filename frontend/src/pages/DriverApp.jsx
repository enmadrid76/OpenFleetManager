// Driver-facing view (open on the phone):
// - register with a real phone number
// - receive trip info and voice guidance (ElevenLabs)
// - presence-check photos WITH a visible visual cue (transparency requirement)
// - GPS source: simulated trip data (for stationary prototype testing)
import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client.js';

export default function DriverApp() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [driver, setDriver] = useState(null);
  const [photoCue, setPhotoCue] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [playingAlertId, setPlayingAlertId] = useState(null);
  const [audioError, setAudioError] = useState('');
  const [audioStatus, setAudioStatus] = useState('Voice alerts are off.');
  const playedRef = useRef(new Set());

  const register = async () => {
    const d = await api.post('/drivers/register', { clientId: 'client_demo1', name, phoneNumber });
    setDriver(d);
  };

  const enableAudio = async () => {
    setAudioError('');
    setAudioEnabled(true);
    setAudioStatus('Voice alerts are on. Keep this page open while a trip is simulated.');

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const context = new AudioContext();
        if (context.state === 'suspended') await context.resume();
        await context.close();
      }
    } catch (err) {
      setAudioError(`Audio was enabled, but the browser reported: ${err.message}`);
    }
  };

  const markPlayed = async (alertId) => {
    await api.post(`/voice-alerts/${alertId}/played`, {}).catch(console.error);
    setAlerts((current) => current.filter((alert) => alert.id !== alertId));
  };

  const playVoiceAlert = (alert, { automatic = false } = {}) => {
    if (!alert.audioUrl) return;

    playedRef.current.add(alert.id);
    setPlayingAlertId(alert.id);
    setAudioError('');
    setAudioStatus(automatic ? 'Playing new anomaly alert.' : 'Playing selected alert.');

    const audio = new Audio(alert.audioUrl);
    audio.onended = async () => {
      setPlayingAlertId(null);
      setAudioStatus('Voice alerts are on. Waiting for the next anomaly.');
      await markPlayed(alert.id);
    };
    audio.onerror = () => {
      setPlayingAlertId(null);
      setAudioError('Voice alert audio could not be played.');
    };
    audio.play().catch((err) => {
      setPlayingAlertId(null);
      playedRef.current.delete(alert.id);
      setAudioError(`Browser blocked playback. Tap Play on the alert: ${err.message}`);
    });
  };

  useEffect(() => {
    if (!driver) return undefined;

    const loadAlerts = () => {
      api.get(`/voice-alerts?driverId=${driver.id}&unplayed=true`)
        .then(setAlerts)
        .catch((err) => setAudioError(err.message));
    };

    loadAlerts();
    const id = setInterval(loadAlerts, 2000);
    return () => clearInterval(id);
  }, [driver]);

  useEffect(() => {
    if (!audioEnabled) return;

    const nextAlert = alerts.find((alert) => alert.status === 'ready' && alert.audioUrl && !playedRef.current.has(alert.id));
    if (!nextAlert) return;

    playVoiceAlert(nextAlert, { automatic: true });
  }, [alerts, audioEnabled]);

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

          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Voice alerts</p>
                <p className="text-xs text-slate-500">{audioStatus}</p>
              </div>
              <span className={`rounded px-2 py-1 text-xs font-semibold ${audioEnabled ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                {audioEnabled ? 'On' : 'Off'}
              </span>
            </div>

            <button
              onClick={enableAudio}
              className={`w-full rounded py-2 text-sm font-semibold text-white hover:opacity-90 ${audioEnabled ? 'bg-green-600' : 'bg-indigo-600'}`}
            >
              {audioEnabled ? 'Voice alerts enabled' : 'Enable voice alerts'}
            </button>

            {audioError && <p className="mt-3 rounded bg-red-50 px-3 py-2 text-xs text-red-700">{audioError}</p>}

            <div className="mt-3 space-y-2">
              {alerts.length === 0 && <p className="text-xs text-slate-500">No pending anomaly alerts.</p>}
              {alerts.map((alert) => (
                <div key={alert.id} className="rounded border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800">{alert.anomalyType.replaceAll('_', ' ')}</p>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {playingAlertId === alert.id ? 'Playing' : alert.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{alert.text}</p>
                  {alert.status === 'ready' && alert.audioUrl && (
                    <button
                      type="button"
                      onClick={() => playVoiceAlert(alert)}
                      className="mt-3 w-full rounded border border-indigo-200 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                    >
                      Play alert
                    </button>
                  )}
                  {alert.status === 'text_only' && (
                    <p className="mt-2 text-xs text-amber-700">Audio was not generated because ElevenLabs is not configured on the running backend.</p>
                  )}
                  {alert.status === 'failed' && (
                    <p className="mt-2 text-xs text-red-700">{alert.error || 'Audio generation failed.'}</p>
                  )}
                </div>
              ))}
            </div>
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

          {/* TODO: active trip panel — receive trip details and stream simulated GPS while stationary */}
        </div>
      )}
    </div>
  );
}
