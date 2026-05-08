import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  CheckSquare,
  Settings,
  Truck,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/lancamentos', icon: FileText, label: 'Lançamentos' },
  { to: '/plano-contas', icon: BookOpen, label: 'Plano & Conferência' },
  { to: '/configuracoes', icon: Settings, label: 'Configurações' },
];

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex flex-col items-center px-6 py-6 border-b border-slate-700/50 bg-slate-900/50">
        <div className="w-56 h-auto flex items-center justify-center mb-3 transition-transform hover:scale-105 duration-300">
          <img 
            src="/logo.jpg" 
            alt="Rio Log" 
            className="w-full h-full object-contain rounded-lg shadow-2xl" 
          />
        </div>
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <span className="text-emerald-400 text-[10px] uppercase font-bold tracking-[0.2em]">
            Sistema Financeiro
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-slate-700">
        <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-700 hover:text-white w-full transition-all duration-150">
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 h-screen fixed left-0 top-0 z-40 shadow-xl">
        <SidebarContent />
      </aside>

      {/* Mobile toggle button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 text-white rounded-lg shadow-lg"
        onClick={() => setMobileOpen(!mobileOpen)}
        id="sidebar-toggle"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`md:hidden fixed left-0 top-0 h-screen w-64 bg-slate-900 z-50 shadow-2xl transform transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="pt-14">
          <SidebarContent />
        </div>
      </aside>
    </>
  );
}
