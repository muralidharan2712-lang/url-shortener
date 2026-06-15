import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Link2, BarChart2,
  LogOut, Zap, Menu, X, Bell, ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/links',     icon: Link2,           label: 'Links'     },
  { to: '/analytics', icon: BarChart2,        label: 'Analytics' },
];

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  /* ── Sidebar ── */
  const Sidebar = ({ mobile = false }) => (
    <div
      className="flex flex-col h-full border-r"
      style={{
        width: 210,
        background: 'rgba(7, 7, 15, 0.99)',
        borderColor: 'rgba(139, 92, 246, 0.11)',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-5 py-5 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(139,92,246,0.11)' }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}
        >
          <Zap size={16} className="text-white" />
        </div>
        <span className="text-[1.05rem] font-bold gradient-text tracking-wide">
          LinkPulse
        </span>
        {mobile && (
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto text-gray-500 hover:text-white transition-colors"
          >
            <X size={17} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive =
            location.pathname === to || location.pathname.startsWith(to + '/');

          return (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              style={{ textDecoration: 'none' }}
            >
              <motion.div
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
                className={`sidebar-link relative overflow-hidden ${isActive ? 'active' : ''}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav-bg"
                    className="absolute inset-0 rounded-lg"
                    style={{
                      background: 'rgba(139,92,246,0.12)',
                      border: '1px solid rgba(139,92,246,0.22)',
                    }}
                    initial={false}
                    transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                  />
                )}
                <Icon size={17} className="flex-shrink-0 relative z-10" />
                <span className="truncate relative z-10 text-[13px] font-medium">
                  {label}
                </span>
              </motion.div>
            </NavLink>
          );
        })}
      </nav>

      {/* User section */}
      <div
        className="px-3 pb-4 pt-3 flex-shrink-0"
        style={{ borderTop: '1px solid rgba(139,92,246,0.09)' }}
      >
        <div
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl cursor-pointer transition-colors"
          style={{ ':hover': { background: 'rgba(255,255,255,0.03)' } }}
          onClick={() => setUserMenuOpen(v => !v)}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold truncate text-white leading-tight">
              {user?.name}
            </p>
            <p className="text-[10px] truncate leading-tight" style={{ color: '#6B7280' }}>
              {user?.email}
            </p>
          </div>
          <ChevronDown
            size={13}
            className="flex-shrink-0 transition-transform duration-200"
            style={{
              color: '#6B7280',
              transform: userMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </div>

        <AnimatePresence>
          {userMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.97 }}
              transition={{ duration: 0.14 }}
              className="mt-1.5 rounded-xl overflow-hidden shadow-2xl"
              style={{
                background: 'rgba(14, 10, 28, 0.98)',
                border: '1px solid rgba(139,92,246,0.14)',
              }}
            >
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-[12px] font-semibold transition-colors text-red-400 hover:bg-red-500/10"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  /* ── Top Navbar ── */
  const TopNav = () => (
    <header
      className="h-14 flex items-center gap-4 px-5 flex-shrink-0 sticky top-0 z-20"
      style={{
        background: 'rgba(7, 7, 15, 0.93)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(139, 92, 246, 0.09)',
      }}
    >
      {/* Mobile menu btn */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden text-gray-500 hover:text-white transition-colors"
      >
        <Menu size={20} />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-sm relative hidden sm:block">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search links, tags..."
          className="w-full pl-9 pr-4 py-2 text-[12px] rounded-lg outline-none transition-all"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(139,92,246,0.12)',
            color: '#D1D5DB',
            fontFamily: 'Inter, sans-serif',
          }}
          onFocus={e => {
            e.target.style.border = '1px solid rgba(139,92,246,0.35)';
            e.target.style.background = 'rgba(139,92,246,0.04)';
          }}
          onBlur={e => {
            e.target.style.border = '1px solid rgba(139,92,246,0.12)';
            e.target.style.background = 'rgba(255,255,255,0.03)';
          }}
        />
      </div>

      <div className="flex items-center gap-2.5 ml-auto">
        {/* Notification bell */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all"
          style={{ color: '#6B7280' }}
        >
          <Bell size={17} />
          <span
            className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full"
            style={{ background: '#8B5CF6' }}
          />
        </motion.button>

        {/* Create New Link button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/links')}
          className="btn-primary hidden sm:flex text-[12px] px-3.5 py-2"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Create New Link
        </motion.button>
      </div>
    </header>
  );

  return (
    <div className="flex min-h-screen text-[#f8fafc]" style={{ background: '#07070f' }}>
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-30 bg-black/75 backdrop-blur-sm md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed top-0 left-0 h-full z-40 md:hidden shadow-2xl"
            initial={{ x: -220 }}
            animate={{ x: 0 }}
            exit={{ x: -220 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          >
            <Sidebar mobile />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col flex-shrink-0" style={{ width: 210 }}>
        <div className="sticky top-0 h-screen overflow-hidden">
          <Sidebar />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Background glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse, rgba(109,40,217,0.18) 0%, transparent 70%)',
            filter: 'blur(100px)',
            opacity: 0.5,
          }}
        />

        <TopNav />

        {/* Page content */}
        <main className="flex-1 overflow-auto thin-scroll relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
