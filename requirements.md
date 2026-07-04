# Open Fleet Manager — Requirements

**Project:** Open Fleet Manager (MVP / Hackathon prototype)
**Repo:** https://github.com/enmadrid76/OpenFleetManager
**Date:** 2026-07-04

---

## 1. Overview

Open Fleet Manager is a multi-tenant SaaS-style web application for managing vehicle fleets. It handles clients (companies), their vehicles, drivers, and trips, with real-time GPS trip tracking, route optimization, anomaly detection, driver voice guidance (ElevenLabs), and multi-level reporting.

---

## 2. Data Model

### 2.1 Client (top-level / tenant entity)
- Company name
- Contact number
- Address
- Other contact details as needed
- Parent entity: all vehicles, drivers, vehicle groups, and trips belong to a client
- Each client has access to **their own data exclusively**

### 2.2 Vehicle
- Belongs to one client
- May belong to one **vehicle group** (fleet) for organizational purposes
- **Current odometer value** (km)
- **Scheduled maintenance threshold**: maintenance due within a configurable number of kilometers; the system flags vehicles due for service
- Odometer vs. GPS cross-check: the system compares actual GPS-measured kilometers traveled on trips against reported odometer values to detect discrepancies

### 2.3 Vehicle Group ("Fleet")
- Belongs to one client
- Groups vehicles for **organizational purposes only** (no permission implications)
- Example: "Delivery fleet", "Executive transport fleet"

### 2.4 Driver
- Belongs to one client
- One driver at a time is associated with a vehicle (via trips)
- Registers with a **phone number**
- Performance tracking: recent trips, performance scores, anomaly counts

### 2.5 Trip
A trip associates **one driver + one vehicle** with journey parameters:
- Date
- Start time / end time
- Origin and destination
- **Stops**: an ordered list of intermediate locations (waypoints)
- Distance
- Cost
- Status: `pending` → `in_progress` → `completed` (or `cancelled`)
- Notes
- **Category**: `people_transportation` or `package_delivery`

### 2.6 Anomaly (trip log entries)
Logged per trip for post-trip review. Types:
- **Speeding** (if derivable from phone GPS data)
- **Unauthorized detour** (deviation from planned/optimized route)
- **Arrived too fast** (final destination reached implausibly quickly)
- **Excessive stop duration** (stops that are too long)

---

## 3. Functional Requirements

### 3.1 Route Optimization
- Stops are provided as a list of locations; the application **optimizes the itinerary** (stop order and path) based on conditions such as road, traffic, and weather.

### 3.2 Real-Time GPS Trip Tracking
- Trips are tracked in real time using the **driver's cell phone GPS**.
- GPS-measured distance is compared against the vehicle's reported odometer to identify discrepancies.

### 3.3 Driver Presence Check (transparent, non-invasive)
- Drivers mount their phone on the dashboard facing them.
- The app **periodically takes a photo** — purpose is a *presence check* (confirm someone is actively driving / engaged), **not** facial recognition or identity verification.
- **Transparency requirement:** the phone displays a **visual cue** whenever a picture is taken, so the driver is always aware of monitoring.

### 3.4 Voice Guidance (ElevenLabs)
- When the driver **deviates from the planned/optimal route**, deviation is **detected automatically** from current GPS location.
- The phone delivers **verbal advice via ElevenLabs** to correct the situation (e.g., guidance back onto the route).
- Anomaly detection also triggers vocal guidance to the driver.

### 3.5 Anomaly Handling
- No push alerts to dispatch; instead:
  - **Live dispatch dashboard**: real-time status of all active trips for a client
  - **Anomaly log**: all anomalies recorded per trip for later review
  - **Voice alert** to the driver via ElevenLabs

### 3.6 Reporting (two tiers)
**Tier 1 — Application owner (admin):**
- High-level reporting **across all clients**, with drill-down into any client

**Tier 2 — Client:**
- Access to own data only
- Live dispatch dashboard (real-time trip status)
- Vehicle reports: all vehicles → drill into one vehicle → recent trips, mileage, maintenance situation
- Driver reports: all drivers → drill into one driver → recent trips, performance, scores, anomaly count
- Money/cost tracking and reporting

### 3.7 Trip Simulation (demo/testing)
- In the trips dashboard, a **button on the right side** launches a trip simulation
- Two speed options: complete simulated trip in **~30 seconds** or **~1 minute**
- Toggle: simulate **with or without anomalies**

### 3.8 Real-Device Driver Prototype Test
- The app owner can **register as a driver with a real phone number**
- The prototype sends trip information and delivers **actual ElevenLabs vocal feedback on the real phone**
- GPS input for this test comes from the **simulated trip** (not the phone's real GPS), since the tester is stationary

---

## 4. Tech Stack (MVP)

| Layer | Choice |
|---|---|
| Architecture | Split frontend / backend, run locally |
| Backend | Node.js + Express |
| Frontend | React (Vite) + Tailwind CSS |
| Storage | Local JSON files (no database) |
| Text-to-speech | ElevenLabs API |
| Collaboration | GitHub repo (enmadrid76/OpenFleetManager) |

---

## 5. Out of Scope (MVP)

- Real database (JSON files only)
- Facial recognition / driver identity verification
- Dispatch push notifications
- Production auth/security hardening
