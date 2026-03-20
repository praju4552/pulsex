import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingCart, User as UserIcon, LogOut } from 'lucide-react';
import { XPulseLogo } from '../XPulseIcon';
import { ThemeToggle } from '../ThemeToggle';

const NAV_LINKS = [
  { to: '/prototyping', label: 'Home' },
  { to: '/prototyping/3d-printing', label: '3D Printing' },
  { to: '/prototyping/pcb-printing', label: 'PCB Printing' },
  { to: '/prototyping/pcb-design', label: 'PCB Design' },
  { to: '/prototyping/laser-cutting', label: 'Laser Cutting' },
  { to: '/prototyping/sem-tem', label: 'SEM/TEM' },
  { to: '/prototyping/project-dev', label: 'Project Dev' },
];

export function PrototypingHeader() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('prototypingUser') || 'null');

  const handleLogout = () => {
    localStorage.removeItem('prototypingUser');
    localStorage.removeItem('prototypingToken');
    window.location.reload();
  };

  return (
    <header className="sticky top-0 z-50 bg-bg-secondary/90 backdrop-blur-xl border-b border-border-glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <XPulseLogo textClassName="text-lg font-bold tracking-tighter uppercase text-text-primary" iconClassName="w-8 h-8" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const active = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    active
                      ? 'bg-[#00cc55]/20 text-[#00cc55]'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-100'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            
            {/* Theme Toggle & Cart Icon Link */}
            <div className="w-px h-5 bg-surface-100 mx-2" />
            <ThemeToggle className="scale-90" />
            
            <div className="w-px h-5 bg-surface-100 mx-2" />
            <Link 
              to="/prototyping/cart" 
              className={`p-2 rounded-lg transition-colors flex items-center relative ${
                location.pathname === '/prototyping/cart' 
                  ? 'bg-[#00cc55]/20 text-[#00cc55]' 
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-100'
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
              {/* Optional unread badge */ }
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#00cc55] rounded-full border border-[#080c09]" />
            </Link>

            <div className="w-px h-5 bg-surface-100 mx-2" />
            
            {user ? (
              <div className="flex items-center gap-2">
                <Link 
                  to="/prototyping/account"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-100 border border-border-glass hover:bg-surface-100 transition-all group"
                >
                  <div className="w-6 h-6 rounded-full bg-[#00cc55]/20 flex items-center justify-center group-hover:bg-[#00cc55]/30 transition-all">
                    <UserIcon className="w-3.5 h-3.5 text-[#00cc55]" />
                  </div>
                  <span className="text-[10px] font-bold text-text-primary uppercase tracking-wider truncate max-w-[80px]">
                    {user.name.split(' ')[0]}
                  </span>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="p-1 hover:text-red-400 text-text-muted transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <Link 
                to="/prototyping/auth" 
                className="px-4 py-2 bg-[#00cc55] hover:bg-[#00cc55]/90 text-black text-[10px] font-black uppercase tracking-wider rounded-lg transition-all"
              >
                Login
              </Link>
            )}
          </nav>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen(!open)}
            className="lg:hidden p-2 text-text-secondary hover:text-text-primary"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {open && (
          <nav className="lg:hidden pb-4 space-y-1">
            {NAV_LINKS.map((link) => {
              const active = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-[#00cc55]/20 text-[#00cc55]'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-100'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            {/* Mobile Extras (Cart, Theme, Auth) */}
            <div className="border-t border-border-glass pt-3 mt-2 space-y-3 px-3">
              <div className="flex items-center justify-between text-text-secondary">
                <span className="text-sm">Theme</span>
                <ThemeToggle className="scale-90" />
              </div>

              <Link 
                to="/prototyping/cart" 
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 py-2 text-text-secondary hover:text-text-primary transition-colors"
              >
                <ShoppingCart className="w-5 h-5 text-[#00cc55]" />
                <span className="text-sm font-medium">Cart</span>
              </Link>

              {user ? (
                <div className="flex items-center justify-between pt-2 border-t border-border-glass">
                  <Link 
                    to="/prototyping/account"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#00cc55]/20 flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-[#00cc55]" />
                    </div>
                    <span className="text-sm font-medium text-text-primary truncate">
                      {user.name}
                    </span>
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-1 text-xs text-red-500 hover:text-red-400"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <Link 
                  to="/prototyping/auth" 
                  onClick={() => setOpen(false)}
                  className="block w-full text-center py-2.5 bg-[#00cc55] hover:bg-[#00cc55]/90 text-black text-xs font-black uppercase tracking-wider rounded-lg transition-all"
                >
                  Login
                </Link>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
