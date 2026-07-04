import { Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import Clients from './pages/Clients.jsx';
import Fleet from './pages/Fleet.jsx';
import Vehicles from './pages/Vehicles.jsx';
import Drivers from './pages/Drivers.jsx';
import Trips from './pages/Trips.jsx';
import Reports from './pages/Reports.jsx';
import DriverApp from './pages/DriverApp.jsx';

const navItems = [
  { to: '/', label: 'Dispatch' },
  { to: '/clients', label: 'Clients' },
  { to: '/fleet', label: 'Fleet' },
  { to: '/vehicles', label: 'Vehicles' },
  { to: '/drivers', label: 'Drivers' },
  { to: '/trips', label: 'Trips' },
  { to: '/reports', label: 'Reports' },
  { to: '/driver-app', label: 'Driver App' },
];

export default function App() {
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <aside className="w-56 shrink-0 bg-slate-900 text-slate-100 p-4">
        <h1 className="text-lg font-bold mb-6">Open Fleet Manager</h1>
        <nav className="space-y-1">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `block rounded px-3 py-2 text-sm ${isActive ? 'bg-slate-700 font-semibold' : 'hover:bg-slate-800'}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/fleet" element={<Fleet />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/drivers" element={<Drivers />} />
          <Route path="/trips" element={<Trips />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/driver-app" element={<DriverApp />} />
        </Routes>
      </main>
    </div>
  );
}
