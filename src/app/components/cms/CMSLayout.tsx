import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Cpu, PencilRuler, Box, Zap,
  Microscope, Lightbulb, Users, LogOut, Menu, X, Settings, CreditCard
} from 'lucide-react';
import { useState, useEffect } from 'react';

const NAV = [
  { to: '/cms/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/cms/pcb-printing',  icon: Cpu,             label: 'PCB Printing' },
  { to: '/cms/3d-printing',   icon: Box,             label: '3D Printing' },
  { to: '/cms/laser-cutting', icon: Zap,             label: 'Laser Cutting' },
  { to: '/cms/pcb-design-inquiries', icon: PencilRuler, label: 'PCB Design' },
  { to: '/cms/sem-tem',       icon: Microscope,      label: 'SEM / TEM' },
  { to: '/cms/project-dev',   icon: Lightbulb,       label: 'Project Dev' },
  { to: '/cms/users',         icon: Users,           label: 'Users' },
  { to: '/cms/payments',      icon: CreditCard,      label: 'Payments Log' },
  { to: '/cms/pricing',       icon: Settings,        label: 'Pricing Settings' },
];

export default function CMSLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const token = sessionStorage.getItem('cms_token');
  const adminData = sessionStorage.getItem('cms_admin');
  const admin = adminData ? JSON.parse(adminData) : null;
  const adminEmail = admin?.email || 'admin@pulsex';

  useEffect(() => {
    if (!token) {
      navigate('/prototyping/auth');
    }
  }, [token, navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem('cms_token');
    sessionStorage.removeItem('cms_admin');
    navigate('/prototyping/auth');
  };

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
      isActive
        ? 'bg-[#00cc55]/15 text-[#00cc55] shadow-[inset_0_0_12px_rgba(0,204,85,0.08)]'
        : 'text-gray-400 hover:text-white hover:bg-white/5'
    }`;

  if (!token) return null;

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-[#111] border-r border-[#222] flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="px-5 py-5 border-b border-[#222] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00cc55] animate-pulse" />
            <span className="text-sm font-black text-white tracking-tight">PULSE X <span className="text-[#00cc55]">CMS</span></span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400"><X className="w-5 h-5" /></button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} className={linkCls} onClick={() => setSidebarOpen(false)}>
              <n.icon className="w-4 h-4 flex-shrink-0" />
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-[#222]">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 rounded-xl w-full text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-[#0a0a0a]/90 backdrop-blur border-b border-[#222] px-6 py-3 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-400"><Menu className="w-5 h-5" /></button>
          <span className="text-xs text-gray-500 font-mono">{adminEmail}</span>
        </header>
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
