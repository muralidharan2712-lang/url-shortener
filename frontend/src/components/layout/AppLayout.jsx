import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Link2, BarChart2, QrCode, Settings,
  LogOut, Zap, ChevronLeft, ChevronRight, Menu, X,
  User, Bell
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/links', icon: Link2, label: 'My Links' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
];

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className="flex min-h-screen" style={{ background: '#0a0a0f' }}>
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`fixed top-0 left-0 h-full z-40 flex flex-col
          md:relative md:translate-x-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={{
          background: 'rgba(10, 10, 20, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <AnimatePresence mode="wait">
            {!collapsed ? (
              <motion.div
                key="full"
                className="flex items-center gap-2.5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  <Zap size={16} className="text-white" />
                </div>
                <span className="text-lg font-bold gradient-text">LinkPulse</span>
              </motion.div>
            ) : (
              <motion.div
                key="icon"
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Zap size={16} className="text-white" />
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={() => setCollapsed(v => !v)}
            className="hidden md:flex w-6 h-6 items-center justify-center rounded-md text-slate-500 hover:text-slate-300 hover:bg-white/05 transition-all"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto thin-scroll">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center' : ''}`
              }
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="truncate"
                >
                  {label}
                </motion.span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-white/[0.06]">
          {!collapsed ? (
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-slate-500 hover:text-red-400 transition-colors p-1"
                title="Logout"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                {initials}
              </div>
              <button
                onClick={handleLogout}
                className="text-slate-500 hover:text-red-400 transition-colors"
                title="Logout"
              >
                <LogOut size={15} />
              </button>
            </div>
          )}
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile) */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/[0.06]"
          style={{ background: 'rgba(10,10,20,0.95)', backdropFilter: 'blur(20px)' }}>
          <button
            onClick={() => setMobileOpen(true)}
            className="text-slate-400 hover:text-white"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <Zap size={14} className="text-white" />
            </div>
            <span className="font-bold gradient-text">LinkPulse</span>
          </div>
          <div className="w-8" />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto thin-scroll">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
