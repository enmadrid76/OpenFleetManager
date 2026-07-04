// Trips list with trip creation, destination picking, and simulation controls.
import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api/client.js';

const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const emptyLocation = { label: '', lat: '', lng: '' };
const defaultForm = {
  clientId: '',
  driverId: '',
  vehicleId: '',
  category: 'delivery',
  origin: { ...emptyLocation },
  destination: { ...emptyLocation },
  stops: [],
};

function formatLocation(location, fallback = 'Select location') {
  if (!location?.label && !location?.lat) return fallback;
  if (location?.lat && location?.lng) return `${location.label || 'Pinned location'} (${Number(location.lat).toFixed(5)}, ${Number(location.lng).toFixed(5)})`;
  return location.label;
}

function cleanLocation(location) {
  return {
    label: location.label?.trim() || `${location.lat}, ${location.lng}`,
    lat: Number(location.lat),
    lng: Number(location.lng),
  };
}

function hasValidCoordinates(location) {
  return location?.lat !== '' &&
    location?.lng !== '' &&
    location?.lat != null &&
    location?.lng != null &&
    !Number.isNaN(Number(location.lat)) &&
    !Number.isNaN(Number(location.lng));
}

function parseMapsCoordinates(value) {
  const text = value.trim();
  const atMatch = text.match(/@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);
  if (atMatch) return { lat: atMatch[1], lng: atMatch[2] };

  const bangMatch = text.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (bangMatch) return { lat: bangMatch[1], lng: bangMatch[2] };

  const pairMatch = text.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
  if (pairMatch) return { lat: pairMatch[1], lng: pairMatch[2] };

  return null;
}

function loadGoogleMaps() {
  if (!googleMapsApiKey) return Promise.reject(new Error('Missing VITE_GOOGLE_MAPS_API_KEY'));
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (window.googleMapsPromise) return window.googleMapsPromise;

  window.googleMapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = () => reject(new Error('Google Maps failed to load'));
    document.head.appendChild(script);
  });

  return window.googleMapsPromise;
}

function InteractiveMap({ draft, lat, lng, onPick }) {
  const nodeRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const geocoderRef = useRef(null);
  const [status, setStatus] = useState(googleMapsApiKey ? 'Loading map...' : 'Add VITE_GOOGLE_MAPS_API_KEY to enable the map.');

  const fallbackCenter = useMemo(() => ({ lat: 13.6929, lng: -89.2182 }), []);

  useEffect(() => {
    let active = true;

    loadGoogleMaps()
      .then((maps) => {
        if (!active || !nodeRef.current) return;

        const center = lat && lng
          ? { lat: Number(lat), lng: Number(lng) }
          : fallbackCenter;

        geocoderRef.current = new maps.Geocoder();
        mapRef.current = new maps.Map(nodeRef.current, {
          center,
          zoom: lat && lng ? 15 : 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });

        markerRef.current = new maps.Marker({
          map: mapRef.current,
          position: lat && lng ? center : null,
          draggable: true,
        });

        mapRef.current.addListener('click', (event) => {
          const picked = { lat: event.latLng.lat(), lng: event.latLng.lng() };
          markerRef.current.setPosition(picked);
          reverseGeocode(picked);
        });

        markerRef.current.addListener('dragend', (event) => {
          const picked = { lat: event.latLng.lat(), lng: event.latLng.lng() };
          reverseGeocode(picked);
        });

        setStatus('Click the map or drag the marker to choose the exact point.');
      })
      .catch((err) => setStatus(err.message));

    return () => { active = false; };
  }, [fallbackCenter]);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current || !lat || !lng) return;
    const position = { lat: Number(lat), lng: Number(lng) };
    markerRef.current.setPosition(position);
    mapRef.current.panTo(position);
  }, [lat, lng]);

  const reverseGeocode = (position) => {
    const next = {
      label: draft,
      lat: position.lat.toFixed(6),
      lng: position.lng.toFixed(6),
    };

    if (!geocoderRef.current) {
      onPick(next);
      return;
    }

    geocoderRef.current.geocode({ location: position }, (results, geocoderStatus) => {
      onPick({
        ...next,
        label: draft || (geocoderStatus === 'OK' && results[0]?.formatted_address) || '',
      });
    });
  };

  const findAddress = () => {
    if (!draft.trim() || !geocoderRef.current || !mapRef.current || !markerRef.current) return;

    setStatus('Finding location...');
    geocoderRef.current.geocode({ address: draft }, (results, geocoderStatus) => {
      if (geocoderStatus !== 'OK' || !results[0]) {
        setStatus('Location was not found. Try a more specific name or paste coordinates.');
        return;
      }

      const place = results[0];
      const position = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };

      mapRef.current.fitBounds(place.geometry.viewport);
      markerRef.current.setPosition(position);
      onPick({
        label: place.formatted_address || draft,
        lat: position.lat.toFixed(6),
        lng: position.lng.toFixed(6),
      });
      setStatus('Location found. Adjust the marker if needed.');
    });
  };

  return (
    <div className="flex min-h-[320px] flex-col gap-2">
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={findAddress}
          disabled={!draft.trim() || !googleMapsApiKey}
          className="rounded border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
        >
          Find on map
        </button>
      </div>
      <div ref={nodeRef} className="min-h-[320px] flex-1 rounded border border-slate-200" />
      <p className="text-xs text-slate-500">{status}</p>
    </div>
  );
}

function LocationPicker({ target, location, onSave, onClose }) {
  const [draft, setDraft] = useState(location?.label || '');
  const [lat, setLat] = useState(location?.lat ?? '');
  const [lng, setLng] = useState(location?.lng ?? '');
  const [mapsValue, setMapsValue] = useState('');

  const mapQuery = useMemo(() => {
    if (lat && lng) return `${lat},${lng}`;
    return draft || 'San Salvador, El Salvador';
  }, [draft, lat, lng]);

  const pasteMapsValue = (value) => {
    setMapsValue(value);
    const coords = parseMapsCoordinates(value);
    if (coords) {
      setLat(coords.lat);
      setLng(coords.lng);
      if (!draft) setDraft(value);
    }
  };

  const pickMapPoint = (point) => {
    setLat(point.lat);
    setLng(point.lng);
    if (point.label && !draft.trim()) setDraft(point.label);
  };

  const canSave = hasValidCoordinates({ lat, lng });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="grid max-h-[92vh] w-full max-w-5xl grid-rows-[auto_minmax(260px,1fr)_auto] overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Pick {target}</h3>
            <p className="text-sm text-slate-500">Click the map, paste a Google Maps link, or enter coordinates.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-slate-300 px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <div className="grid min-h-0 gap-4 p-5 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Location name
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Warehouse, customer, stop name"
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Google Maps link or coordinates
              <textarea
                value={mapsValue}
                onChange={(e) => pasteMapsValue(e.target.value)}
                placeholder="Paste a Maps URL, @13.6929,-89.2182, or 13.6929,-89.2182"
                rows={4}
                className="mt-1 w-full resize-none rounded border border-slate-300 px-3 py-2 text-sm"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-medium text-slate-700">
                Latitude
                <input
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="13.6929"
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Longitude
                <input
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder="-89.2182"
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
            </div>

            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Open in Google Maps
            </a>
          </div>

          <InteractiveMap
            draft={draft}
            lat={lat}
            lng={lng}
            onPick={pickMapPoint}
          />
        </div>

        <div className="flex items-center justify-end gap-3 border-t bg-slate-50 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={() => onSave(cleanLocation({ label: draft, lat, lng }))}
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Save location
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Trips() {
  const [trips, setTrips] = useState([]);
  const [clients, setClients] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [duration, setDuration] = useState(30);
  const [withAnomalies, setWithAnomalies] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [picker, setPicker] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => api.get('/trips').then(setTrips).catch(console.error);

  useEffect(() => {
    load();
    Promise.all([api.get('/clients'), api.get('/drivers'), api.get('/vehicles')])
      .then(([clientItems, driverItems, vehicleItems]) => {
        setClients(clientItems);
        setDrivers(driverItems);
        setVehicles(vehicleItems);
        setForm((current) => ({
          ...current,
          clientId: current.clientId || clientItems[0]?.id || '',
          driverId: current.driverId || driverItems[0]?.id || '',
          vehicleId: current.vehicleId || vehicleItems[0]?.id || '',
        }));
      })
      .catch(console.error);

    const id = setInterval(load, 2000);
    return () => clearInterval(id);
  }, []);

  const simulate = (tripId) =>
    api.post(`/simulation/trips/${tripId}`, { durationSeconds: duration, withAnomalies });

  const setLocation = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const setStop = (index, value) => setForm((current) => ({
    ...current,
    stops: current.stops.map((stop, stopIndex) => (stopIndex === index ? value : stop)),
  }));

  const savePicker = (location) => {
    if (picker.type === 'stop') setStop(picker.index, location);
    else setLocation(picker.type, location);
    setPicker(null);
  };

  const addStop = () => setForm((current) => ({ ...current, stops: [...current.stops, { ...emptyLocation }] }));
  const removeStop = (index) => setForm((current) => ({
    ...current,
    stops: current.stops.filter((_, stopIndex) => stopIndex !== index),
  }));

  const createTrip = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.clientId || !form.driverId) {
      setError('Choose a client and driver before creating the trip.');
      return;
    }

    if (!hasValidCoordinates(form.origin) || !hasValidCoordinates(form.destination)) {
      setError('Choose both an origin and destination with coordinates.');
      return;
    }

    setSaving(true);
    try {
      await api.post('/trips', {
        clientId: form.clientId,
        driverId: form.driverId,
        vehicleId: form.vehicleId || null,
        category: form.category,
        status: 'pending',
        origin: cleanLocation(form.origin),
        destination: cleanLocation(form.destination),
        stops: form.stops.filter((stop) => stop.lat && stop.lng).map(cleanLocation),
        gpsTrack: [],
      });
      setForm({
        ...defaultForm,
        clientId: form.clientId,
        driverId: form.driverId,
        vehicleId: form.vehicleId,
      });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const badge = {
    pending: 'bg-slate-100 text-slate-600',
    in_progress: 'bg-green-100 text-green-700',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-xl font-bold">Trips</h2>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <label>
            Duration:{' '}
            <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="rounded border px-2 py-1">
              <option value={30}>30 seconds</option>
              <option value={60}>1 minute</option>
            </select>
          </label>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={withAnomalies} onChange={(e) => setWithAnomalies(e.target.checked)} />
            With anomalies
          </label>
        </div>
      </div>

      <form onSubmit={createTrip} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Add trip</h3>
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {saving ? 'Saving...' : 'Create trip'}
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <label className="block text-sm font-medium text-slate-700">
            Client
            <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm">
              <option value="">Choose client</option>
              {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Driver
            <select value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })} className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm">
              <option value="">Choose driver</option>
              {drivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.name}</option>)}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Vehicle
            <select value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm">
              <option value="">Unassigned</option>
              {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.plateNumber ?? vehicle.id}</option>)}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Category
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm">
              <option value="delivery">Delivery</option>
              <option value="pickup">Pickup</option>
              <option value="maintenance">Maintenance</option>
              <option value="other">Other</option>
            </select>
          </label>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {[
            ['origin', 'Origin'],
            ['destination', 'Destination'],
          ].map(([key, label]) => (
            <div key={key} className="rounded border border-slate-200 p-3">
              <div className="mb-2 text-sm font-semibold text-slate-700">{label}</div>
              <div className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate text-sm text-slate-600">{formatLocation(form[key])}</span>
                <button
                  type="button"
                  onClick={() => setPicker({ type: key, label, location: form[key] })}
                  className="shrink-0 rounded border border-indigo-200 px-3 py-1.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
                >
                  Open map
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-700">Stops</h4>
            <button type="button" onClick={addStop} className="rounded border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Add stop
            </button>
          </div>
          <div className="space-y-2">
            {form.stops.map((stop, index) => (
              <div key={index} className="flex items-center gap-2 rounded border border-slate-200 p-3">
                <span className="min-w-0 flex-1 truncate text-sm text-slate-600">{formatLocation(stop, `Stop ${index + 1}`)}</span>
                <button
                  type="button"
                  onClick={() => setPicker({ type: 'stop', index, label: `Stop ${index + 1}`, location: stop })}
                  className="rounded border border-indigo-200 px-3 py-1.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
                >
                  Open map
                </button>
                <button type="button" onClick={() => removeStop(index)} className="rounded border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50">
                  Remove
                </button>
              </div>
            ))}
            {form.stops.length === 0 && <p className="text-sm text-slate-500">No intermediate stops.</p>}
          </div>
        </div>

        {error && <p className="mt-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </form>

      <table className="w-full border-collapse bg-white text-sm shadow-sm">
        <thead>
          <tr className="border-b bg-slate-100 text-left">
            <th className="p-2">Route</th>
            <th className="p-2">Stops</th>
            <th className="p-2">Category</th>
            <th className="p-2">Driver</th>
            <th className="p-2">Vehicle</th>
            <th className="p-2">Status</th>
            <th className="p-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {trips.map((t) => (
            <tr key={t.id} className="border-b">
              <td className="p-2">{t.origin?.label ?? '-'} {'->'} {t.destination?.label ?? '-'}</td>
              <td className="p-2">{t.stops?.length ?? 0}</td>
              <td className="p-2">{t.category ?? '-'}</td>
              <td className="p-2">{drivers.find((driver) => driver.id === t.driverId)?.name ?? t.driverId ?? '-'}</td>
              <td className="p-2">{vehicles.find((vehicle) => vehicle.id === t.vehicleId)?.plateNumber ?? t.vehicleId ?? '-'}</td>
              <td className="p-2">
                <span className={`rounded px-2 py-0.5 text-xs ${badge[t.status] ?? badge.pending}`}>{t.status ?? 'pending'}</span>
              </td>
              <td className="p-2 text-right">
                <button
                  onClick={() => simulate(t.id)}
                  className="rounded bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-500"
                >
                  Simulate
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {trips.length === 0 && <p className="mt-4 text-slate-500">No trips yet. Create one above.</p>}

      {picker && (
        <LocationPicker
          target={picker.label}
          location={picker.location}
          onSave={savePicker}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}
