import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Link2, BarChart2, QrCode, Settings,
  LogOut, Zap, Menu, X, Bell, Sun, Moon,
  Globe, FileText, FolderOpen, Megaphone, Server,
  Users, KeyRound, HelpCircle, Rocket, ChevronDown
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/links', icon: Link2, label: 'Links' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/qr-codes', icon: QrCode, label: 'QR Codes' },
  { to: '/bio-pages', icon: FileText, label: 'Bio Pages' },
  { to: '/projects', icon: FolderOpen, label: 'Projects' },
  { to: '/campaigns', icon: Megaphone, label: 'Campaigns' },
  { to: '/custom-domains', icon: Globe, label: 'Custom Domains' },
  { to: '/team', icon: Users, label: 'Team' },
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/api-keys', icon: KeyRound, label: 'API Keys' },
  { to: '/support', icon: HelpCircle, label: 'Support' },
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
        width: 220,
        background: 'rgba(8, 8, 18, 0.98)',
        borderColor: 'rgba(139, 92, 246, 0.12)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: '1px solid rgba(139,92,246,0.12)' }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}>
          <Zap size={16} className="text-white" />
        </div>
        <span className="text-lg font-bold gradient-text tracking-wide">
          LinkPulse
        </span>
        {mobile && (
          <button onClick={() => setMobileOpen(false)} className="ml-auto text-gray-400">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto thin-scroll">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isReal = ['/dashboard', '/links', '/analytics'].includes(to);
          const isActive = location.pathname === to || location.pathname.startsWith(to + '/');

          const linkContent = (
            <motion.div
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              className={`sidebar-link relative overflow-hidden ${isActive ? 'active' : ''}`}
            >
              {isActive && (
                <motion.div
                  layoutId="active-nav-bg"
                  className="absolute inset-0 rounded-lg"
                  style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.22)' }}
                  initial={false}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <Icon size={18} className="flex-shrink-0 relative z-10" />
              <span className="truncate relative z-10">{label}</span>
            </motion.div>
          );

          if (isReal) {
            return (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                style={{ textDecoration: 'none' }}
              >
                {linkContent}
              </NavLink>
            );
          }

          return (
            <div key={to} onClick={() => toast('Coming soon!')}>
              {linkContent}
            </div>
          );
        })}
      </nav>

      {/* Upgrade banner */}
      <div className="px-4 pb-4">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="rounded-xl p-4"
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(109,40,217,0.06))',
            border: '1px solid rgba(139,92,246,0.2)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Rocket size={14} style={{ color: '#A78BFA' }} />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#A78BFA' }}>
              Pro Plan
            </span>
          </div>
          <p className="text-xs mb-3 leading-relaxed" style={{ color: 'rgba(167,139,250,0.7)' }}>
            Unlock advanced features, custom domains and more.
          </p>
          <button
            onClick={() => toast('Upgrade feature coming soon!')}
            className="w-full text-xs font-bold py-2 rounded-lg transition-all text-white"
            style={{
              background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
              boxShadow: '0 2px 12px rgba(139,92,246,0.3)',
            }}
          >
            Upgrade Now 🚀
          </button>
        </motion.div>
      </div>

      {/* User section */}
      <div className="px-4 pb-5 pt-3" style={{ borderTop: '1px solid rgba(139,92,246,0.1)' }}>
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all hover:bg-white/05"
          onClick={() => setUserMenuOpen(v => !v)}
        >
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate text-white">
              {user?.name}
            </p>
            <p className="text-xs truncate text-gray-500">
              {user?.email}
            </p>
          </div>
          <ChevronDown size={14} className="text-gray-500" />
        </div>

        <AnimatePresence>
          {userMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="mt-2 rounded-xl overflow-hidden bg-[#161b22] border border-white/[0.08] shadow-2xl"
            >
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm transition-all text-red-400 hover:bg-red-500/10 font-medium"
              >
                <LogOut size={16} />
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
    <header className="h-16 flex items-center gap-4 px-6 flex-shrink-0 sticky top-0 z-20"
      style={{
        background: 'rgba(8, 8, 18, 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(139, 92, 246, 0.1)',
      }}
    >
      {/* Mobile menu btn */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden text-gray-400 hover:text-white transition-colors"
      >
        <Menu size={22} />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-md relative hidden sm:block">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search links, projects, tags..."
          className="w-full pl-10 pr-12 py-2.5 text-sm rounded-xl outline-none transition-all bg-white/[0.03] border border-white/[0.08] text-gray-200 placeholder-gray-500 focus:border-orange-500/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-orange-500/20"
          style={{ fontFamily: 'Inter, sans-serif' }}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold px-1.5 py-0.5 rounded text-gray-500 bg-white/05 border border-white/10 uppercase tracking-wider">
          Ctrl K
        </span>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {/* Notification bell */}
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-all text-gray-400 hover:bg-white/05 hover:text-white border border-transparent hover:border-white/10"
        >
          <Bell size={18} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-orange-500 rounded-full border-2 border-[#0d1117]" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/links')}
          className="btn-primary ml-2 hidden sm:flex"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Create New Link
        </motion.button>

      </div>
    </header>
  );

  return (
    <div className="flex min-h-screen text-[#f8fafc]" style={{ background: '#080810' }}>
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-30 bg-black/80 backdrop-blur-sm md:hidden"
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
            initial={{ x: -250 }}
            animate={{ x: 0 }}
            exit={{ x: -250 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <Sidebar mobile />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col flex-shrink-0" style={{ width: 220 }}>
        <div className="sticky top-0 h-screen overflow-hidden">
          <Sidebar />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Background glow effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full pointer-events-none opacity-40 blur-[140px]"
          style={{ background: 'radial-gradient(ellipse, rgba(109,40,217,0.25) 0%, transparent 70%)' }}
        />
        
        <TopNav />

        {/* Page content */}
        <main className="flex-1 overflow-auto thin-scroll relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
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
