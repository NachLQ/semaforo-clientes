import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import PanelPage from './pages/PanelPage.jsx';
import ClientePage from './pages/ClientePage.jsx';
import NuevoClientePage from './pages/NuevoClientePage.jsx';
import RevisionPage from './pages/RevisionPage.jsx';

function NavItem({ to, icono, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-semibold ${
          isActive ? 'text-slate-900' : 'text-slate-400'
        }`
      }
    >
      <span className="text-xl">{icono}</span>
      {children}
    </NavLink>
  );
}

export default function App() {
  return (
    <div className="mx-auto min-h-screen max-w-3xl pb-20">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🚦</span>
          <h1 className="text-lg font-extrabold tracking-tight text-slate-900">Semáforo de Clientes</h1>
        </div>
      </header>

      <main className="px-4 py-4">
        <Routes>
          <Route path="/" element={<Navigate to="/panel" replace />} />
          <Route path="/panel" element={<PanelPage />} />
          <Route path="/clientes/nuevo" element={<NuevoClientePage />} />
          <Route path="/clientes/:id" element={<ClientePage />} />
          <Route path="/revision" element={<RevisionPage />} />
          <Route path="*" element={<Navigate to="/panel" replace />} />
        </Routes>
      </main>

      <nav className="fixed bottom-0 left-1/2 z-10 flex w-full max-w-3xl -translate-x-1/2 border-t border-slate-200 bg-white">
        <NavItem to="/panel" icono="📊">Panel</NavItem>
        <NavItem to="/clientes/nuevo" icono="➕">Nuevo</NavItem>
        <NavItem to="/revision" icono="🗓️">Revisión</NavItem>
      </nav>
    </div>
  );
}
