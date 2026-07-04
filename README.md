# Open Fleet Manager

Multi-tenant fleet management MVP: clients, vehicles, drivers, trips, real-time GPS tracking, anomaly detection, ElevenLabs voice guidance, and reporting.

See [requirements.md](./requirements.md) for the full spec.

## Structure

```
backend/    Node.js + Express API, JSON file storage
frontend/   React (Vite) + Tailwind CSS
```

## Quick start

```bash
# Terminal 1 — backend (http://localhost:3001)
cd backend
npm install
npm run dev

# Terminal 2 — frontend (http://localhost:5173)
cd frontend
npm install
npm run dev
```

The frontend dev server proxies `/api/*` to the backend.

## Environment

Copy `backend/.env.example` to `backend/.env` and add your ElevenLabs API key.
