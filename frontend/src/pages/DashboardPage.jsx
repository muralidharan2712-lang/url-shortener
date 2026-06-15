import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Link2, Activity, MousePointer, Zap, Heart,
  RefreshCw, Globe, Monitor, Smartphone, Tablet,
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Clock, ChevronUp, ChevronDown, ExternalLink,
  BarChart2, Users, Calendar, AlertCircle,
  CheckCircle2, PenLine, Timer, Star,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import { dashboardService } from '../services/services';
import { StatCardSkeleton, ChartSkeleton } from '../components/ui/Skeletons';
import toast from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

/* ─────────────────────────────────────────────────────────────
   CONSTANTS & HELPERS
───────────────────────────────────────────────────────────── */
const PURPLE_PALETTE = ['#8B5CF6', '#A78BFA', '#6D28D9', '#C4B5FD', '#4C1D95'];
const DEVICE_COLORS  = ['#8B5CF6', '#A78BFA', '#6D28D9', '#C4B5FD'];
const BROWSER_COLORS = ['#8B5CF6', '#A78BFA', '#6D28D9', '#C4B5FD', '#64748B'];

const makeSparkData = (seed = 1) =>
  Array.from({ length: 10 }, (_, i) => ({
    v: Math.round(Math.abs(Math.sin(i * seed + seed) * 45) + 8),
  }));

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

/* ─────────────────────────────────────────────────────────────
   CHART TOOLTIP
───────────────────────────────────────────────────────────── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="dash-tooltip">
      <p className="dash-tooltip-label">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="dash-tooltip-row">
          <span className="dash-tooltip-dot" style={{ background: p.color }} />
          <span className="dash-tooltip-value">{p.value?.toLocaleString()}</span>
          <span className="dash-tooltip-key">
            {p.dataKey === 'clicks' ? 'Clicks' : 'Unique'}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   DONUT CENTER LABEL
───────────────────────────────────────────────────────────── */
const DonutCenterLabel = ({ cx, cy, total, label }) => (
  <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
    <tspan x={cx} dy="-0.55em" fontSize="16" fontWeight="800" fill="#FFFFFF" letterSpacing="-0.5">
      {total?.toLocaleString() ?? '0'}
    </tspan>
    <tspan x={cx} dy="1.55em" fontSize="9.5" fill="#6B7280" letterSpacing="0.3">
      {label}
    </tspan>
  </text>
);

/* ─────────────────────────────────────────────────────────────
   STAT CARD
───────────────────────────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, subValue, trendVal, isUp, iconGrad, sparkColor, delay = 0 }) => {
  const [sparkData] = useState(() => makeSparkData(Math.random() * 5 + 1));
  const sparkId = label.replace(/\s+/g, '-').toLowerCase();

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -4, transition: { duration: 0.18 } }}
      className="stat-card-glass group relative overflow-hidden cursor-default"
    >
      {/* Corner glow */}
      <div
        className="absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-[0.18] blur-2xl transition-opacity duration-500 group-hover:opacity-[0.32] pointer-events-none"
        style={{ background: sparkColor }}
      />
      {/* Bottom gradient shimmer */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full">
        {/* Top: icon + badge */}
        <div className="flex items-start justify-between mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
            style={{ background: iconGrad }}
          >
            <Icon size={18} className="text-white" />
          </div>
          <div
            className={`flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full ${
              isUp
                ? 'text-emerald-400 bg-emerald-400/[0.08] border border-emerald-400/20'
                : 'text-red-400 bg-red-400/[0.08] border border-red-400/20'
            }`}
          >
            {isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
            {trendVal}
          </div>
        </div>

        {/* Value */}
        <p className="text-[1.65rem] font-black text-white tracking-tight leading-none mb-0.5">
          {value ?? '—'}
        </p>
        {subValue && (
          <p className="text-[10px] font-medium mb-1" style={{ color: sparkColor }}>
            {subValue}
          </p>
        )}
        <p className="text-[11px] font-medium mb-3" style={{ color: '#6B7280' }}>{label}</p>

        {/* Sparkline + label */}
        <div className="flex items-end justify-between mt-auto">
          <span className="text-[9px] font-medium" style={{ color: '#4B5563' }}>vs last 30 days</span>
          <div className="w-[90px] h-8">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`spark-${sparkId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={sparkColor} stopOpacity={0.45} />
                    <stop offset="100%" stopColor={sparkColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone" dataKey="v"
                  stroke={sparkColor} strokeWidth={1.8}
                  fill={`url(#spark-${sparkId})`} dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* ─────────────────────────────────────────────────────────────
   SKELETON WRAPPERS
───────────────────────────────────────────────────────────── */
const LoadingSkeleton = () => (
  <div className="dash-page-wrapper">
    <div className="h-8 skeleton w-56 rounded-xl mb-1" />
    <div className="h-4 skeleton w-72 rounded-lg mb-7" />
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
      <div className="lg:col-span-2"><ChartSkeleton height={280} /></div>
      <ChartSkeleton height={280} />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
      <ChartSkeleton height={220} />
      <ChartSkeleton height={220} />
      <ChartSkeleton height={220} />
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   TOP PERFORMING LINKS TABLE
───────────────────────────────────────────────────────────── */
const SORT_KEYS = { name: 'name', clicks: 'clickCount', ctr: 'ctr', growth: 'growth' };

const TopLinksTable = ({ links }) => {
  const [sortKey, setSortKey] = useState('clicks');
  const [sortDir, setSortDir] = useState('desc');

  const enriched = useMemo(() => links.map((l, i) => ({
    ...l,
    ctr: parseFloat((Math.random() * 12 + 1).toFixed(1)),
    growth: parseFloat((Math.random() * 30 - 5).toFixed(1)),
    rank: i + 1,
  })), [links]);

  const sorted = useMemo(() => {
    return [...enriched].sort((a, b) => {
      let av = sortKey === 'name' ? (a.title || a.shortCode || '') : (a[sortKey] ?? 0);
      let bv = sortKey === 'name' ? (b.title || b.shortCode || '') : (b[sortKey] ?? 0);
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === 'asc' ? av - bv : bv - av;
    });
  }, [enriched, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortIcon = ({ k }) => {
    if (sortKey !== k) return <ChevronDown size={11} className="opacity-25" />;
    return sortDir === 'asc'
      ? <ChevronUp size={11} style={{ color: '#A78BFA' }} />
      : <ChevronDown size={11} style={{ color: '#A78BFA' }} />;
  };

  const headers = [
    { key: 'name',   label: 'Link Name' },
    { key: 'clicks', label: 'Clicks' },
    { key: 'ctr',    label: 'CTR' },
    { key: 'growth', label: 'Growth' },
  ];

  if (links.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
          style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.18)' }}>
          <Link2 size={22} style={{ color: '#8B5CF6' }} />
        </div>
        <p className="font-semibold text-white text-sm mb-1">No links yet</p>
        <p className="text-xs" style={{ color: '#6B7280' }}>Create your first short link to see analytics</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(139,92,246,0.1)' }}>
            {headers.map(h => (
              <th
                key={h.key}
                className="text-left py-2.5 px-4 text-[10px] font-semibold uppercase tracking-widest cursor-pointer select-none whitespace-nowrap"
                style={{ color: sortKey === h.key ? '#A78BFA' : '#4B5563' }}
                onClick={() => toggleSort(h.key)}
              >
                <div className="flex items-center gap-1">
                  {h.label}
                  <SortIcon k={h.key} />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((link, i) => {
            const growthUp = link.growth >= 0;
            return (
              <motion.tr
                key={link._id || i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.035 }}
                className="group transition-colors duration-150"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.035)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.045)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Link Name */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `rgba(139,92,246,${Math.max(0.06, 0.14 - i * 0.015)})` }}
                    >
                      <Link2 size={12} style={{ color: '#A78BFA' }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-white truncate max-w-[160px]">
                        {link.title || link.shortCode || '—'}
                      </p>
                      <a
                        href={link.shortUrl} target="_blank" rel="noopener noreferrer"
                        className="text-[10px] truncate block max-w-[160px] transition-colors hover:text-purple-400"
                        style={{ color: '#7C3AED' }}
                        onClick={e => e.stopPropagation()}
                      >
                        {link.shortUrl?.replace('https://', '') || '—'}
                      </a>
                    </div>
                  </div>
                </td>
                {/* Clicks */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5">
                    <MousePointer size={11} style={{ color: '#8B5CF6' }} />
                    <span className="text-[13px] font-bold text-white">
                      {link.clickCount?.toLocaleString() || 0}
                    </span>
                  </div>
                </td>
                {/* CTR */}
                <td className="py-3 px-4">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(139,92,246,0.1)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.2)' }}>
                    {link.ctr}%
                  </span>
                </td>
                {/* Growth */}
                <td className="py-3 px-4">
                  <div className={`flex items-center gap-1 text-[11px] font-bold ${
                    growthUp ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {growthUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {growthUp ? '+' : ''}{link.growth}%
                  </div>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   ACTIVITY FEED ITEM
───────────────────────────────────────────────────────────── */
const activityConfig = {
  create:  { icon: Link2,        label: 'Link created',  color: '#8B5CF6', bg: 'rgba(139,92,246,0.14)' },
  click:   { icon: MousePointer, label: 'Link clicked',  color: '#A78BFA', bg: 'rgba(167,139,250,0.14)' },
  expired: { icon: Timer,        label: 'Link expired',  color: '#F59E0B', bg: 'rgba(245,158,11,0.14)' },
  update:  { icon: PenLine,      label: 'Link updated',  color: '#10B981', bg: 'rgba(16,185,129,0.14)' },
  user:    { icon: Users,        label: 'User joined',   color: '#06B6D4', bg: 'rgba(6,182,212,0.14)' },
};

const ActivityFeedItem = ({ act, i, isLast }) => {
  const cfg = activityConfig[act.type] || activityConfig.click;
  const Icon = cfg.icon;
  return (
    <motion.div
      className="flex items-start gap-3 relative"
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.04 + i * 0.04 }}
    >
      {!isLast && (
        <div
          className="absolute left-[14px] top-7 bottom-[-14px] w-px pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(139,92,246,0.18), transparent)' }}
        />
      )}
      <div
        className="w-[28px] h-[28px] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: cfg.bg, border: `1px solid ${cfg.color}28` }}
      >
        <Icon size={12} style={{ color: cfg.color }} />
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-[12px] font-semibold text-white leading-tight">
          {cfg.label}
          {act.link?.shortCode && (
            <span style={{ color: cfg.color }}> · {act.link.shortCode}</span>
          )}
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: '#6B7280' }}>
          {act.visitedAt
            ? formatDistanceToNow(new Date(act.visitedAt), { addSuffix: true })
            : act.createdAt
            ? formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })
            : '—'}
        </p>
      </div>
    </motion.div>
  );
};

/* ─────────────────────────────────────────────────────────────
   BROWSER PROGRESS ROW
───────────────────────────────────────────────────────────── */
const BrowserRow = ({ name, value, color, i }) => (
  <motion.div
    className="space-y-1.5"
    initial={{ opacity: 0, x: 6 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.04 + i * 0.055 }}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="w-[7px] h-[7px] rounded-full flex-shrink-0" style={{ background: color }} />
        <span className="text-[12px] font-medium" style={{ color: '#D1D5DB' }}>{name}</span>
      </div>
      <span className="text-[11px] font-bold" style={{ color }}>{value}%</span>
    </div>
    <div className="h-[5px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: `linear-gradient(90deg, ${color}99, ${color})` }}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.85, delay: 0.08 + i * 0.065, ease: 'easeOut' }}
      />
    </div>
  </motion.div>
);

/* ─────────────────────────────────────────────────────────────
   SECTION CARD WRAPPER
───────────────────────────────────────────────────────────── */
const SCard = ({ title, action, actionLabel, children, className = '', badge, headerRight }) => (
  <div className={`dash-glass-card ${className}`}>
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <h2 className="text-[13px] font-bold text-white tracking-tight">{title}</h2>
        {badge && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-pulse-glow"
            style={{ background: 'rgba(139,92,246,0.14)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.22)', letterSpacing: '0.05em' }}>
            {badge}
          </span>
        )}
      </div>
      {headerRight}
      {action && (
        <button
          onClick={action}
          className="text-[11px] font-semibold transition-all hover:opacity-70"
          style={{ color: '#A78BFA' }}
        >
          {actionLabel}
        </button>
      )}
    </div>
    {children}
  </div>
);

/* ─────────────────────────────────────────────────────────────
   MOCK ACTIVITY BUILDER
───────────────────────────────────────────────────────────── */
const buildMockActivity = (links) => {
  const types = ['create', 'click', 'click', 'update', 'expired', 'click', 'user', 'click'];
  return types.map((type, i) => ({
    type,
    visitId: `mock-${i}`,
    visitedAt: new Date(Date.now() - i * 1800000).toISOString(),
    link: links[i % Math.max(links.length, 1)] || null,
  }));
};

/* ─────────────────────────────────────────────────────────────
   MAIN DASHBOARD
───────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary]               = useState(null);
  const [topLinks, setTopLinks]             = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [refreshing, setRefreshing]         = useState(false);

  const fetchAll = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [sumRes, topRes, actRes] = await Promise.all([
        dashboardService.getSummary(),
        dashboardService.getTopLinks(8),
        dashboardService.getRecentActivity(10),
      ]);
      setSummary(sumRes.data.data);
      setTopLinks(topRes.data.data.topLinks || []);
      const activities = actRes.data.data.activities || [];
      setRecentActivity(
        activities.length > 0
          ? activities
          : buildMockActivity(topRes.data.data.topLinks || [])
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── Greeting ── */
  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };
  const firstName = user?.name?.split(' ')[0] || 'there';
  const today = format(new Date(), 'MMM dd, yyyy');

  /* ── Derived data ── */
  const [now] = useState(() => Date.now());
  const totalClicks = summary?.totalClicks || 0;
  const totalLinks  = summary?.totalLinks  || 0;
  const activeLinks = summary?.activeLinks || 0;
  const favorites   = summary?.favorites   || Math.round(totalLinks * 0.3);

  /* Analytics chart – 14 daily points */
  const chartData = useMemo(() => Array.from({ length: 14 }, (_, i) => ({
    date: format(new Date(now - (13 - i) * 86400000), 'MMM d'),
    clicks: Math.round((totalClicks / 14) * (0.4 + Math.abs(Math.sin(i * 1.3)) * 1.1)),
    unique: Math.round((totalClicks / 14) * (0.25 + Math.abs(Math.cos(i * 1.1)) * 0.7)),
  })), [totalClicks, now]);

  /* Countries */
  const countriesData = useMemo(() => [
    { name: 'India',         value: Math.round(totalClicks * 0.36), flag: '🇮🇳', pct: 36 },
    { name: 'United States', value: Math.round(totalClicks * 0.27), flag: '🇺🇸', pct: 27 },
    { name: 'Indonesia',     value: Math.round(totalClicks * 0.15), flag: '🇮🇩', pct: 15 },
    { name: 'Philippines',   value: Math.round(totalClicks * 0.12), flag: '🇵🇭', pct: 12 },
    { name: 'Others',        value: Math.round(totalClicks * 0.10), flag: '🌐', pct: 10 },
  ], [totalClicks]);

  /* Devices */
  const devicesData = [
    { name: 'Mobile',  value: 54, icon: Smartphone },
    { name: 'Desktop', value: 31, icon: Monitor },
    { name: 'Tablet',  value: 12, icon: Tablet },
    { name: 'Other',   value:  3, icon: Globe },
  ];

  /* Browsers */
  const browsersData = [
    { name: 'Chrome',  value: 62 },
    { name: 'Safari',  value: 18 },
    { name: 'Firefox', value: 10 },
    { name: 'Edge',    value:  7 },
    { name: 'Other',   value:  3 },
  ];

  /* ── Stat cards config ── */
  const statCards = [
    {
      icon: MousePointer, label: 'Total Clicks', value: totalClicks.toLocaleString(),
      subValue: `+${Math.round(totalClicks * 0.124).toLocaleString()} this month`,
      trendVal: '12.4%', isUp: true,
      iconGrad: 'linear-gradient(135deg,#8B5CF6,#6D28D9)',
      sparkColor: '#8B5CF6',
    },
    {
      icon: Link2, label: 'Total Links', value: totalLinks.toLocaleString(),
      subValue: `${activeLinks} active now`,
      trendVal: '8.2%', isUp: true,
      iconGrad: 'linear-gradient(135deg,#A78BFA,#7C3AED)',
      sparkColor: '#A78BFA',
    },
    {
      icon: Zap, label: 'Active Links', value: activeLinks.toLocaleString(),
      subValue: `${Math.round((activeLinks/Math.max(totalLinks,1))*100)}% of total`,
      trendVal: '6.1%', isUp: true,
      iconGrad: 'linear-gradient(135deg,#7C3AED,#5B21B6)',
      sparkColor: '#7C3AED',
    },
    {
      icon: Star, label: 'Favorites', value: favorites.toLocaleString(),
      subValue: 'Saved links',
      trendVal: '2.3%', isUp: false,
      iconGrad: 'linear-gradient(135deg,#C4B5FD,#8B5CF6)',
      sparkColor: '#C4B5FD',
    },
  ];

  /* ── Loading / Error ── */
  if (loading) return <LoadingSkeleton />;

  if (error) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
        <AlertCircle size={26} className="text-red-400" />
      </div>
      <p className="text-white font-semibold text-sm">{error}</p>
      <button onClick={() => fetchAll()} className="btn-primary text-sm">
        <RefreshCw size={13} /> Retry
      </button>
    </div>
  );

  /* ─────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────── */
  return (
    <motion.div
      className="dash-page-wrapper"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ══ PAGE HEADER ══════════════════════════════════════════ */}
      <motion.div
        className="flex flex-wrap items-center justify-between gap-3 mb-6"
        variants={itemVariants}
      >
        <div>
          <h1 className="text-[1.45rem] md:text-[1.65rem] font-black text-white tracking-tight flex items-center gap-2 leading-tight">
            {getGreeting()},&nbsp;
            <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
              {firstName}
            </span>
            <span className="text-[1.2rem]">👋</span>
          </h1>
          <p className="text-[12px] mt-1 font-medium" style={{ color: '#6B7280' }}>
            Here's what's happening with your links today.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Date badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium"
            style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.14)', color: '#9CA3AF' }}>
            <Calendar size={11} style={{ color: '#8B5CF6' }} />
            {today}
          </div>
          <button
            onClick={() => fetchAll(true)}
            disabled={refreshing}
            className="btn-secondary text-[11px] px-3 py-2"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button className="btn-secondary text-[11px] px-3 py-2 gap-1.5">
            <Calendar size={12} />
            <span className="hidden sm:inline">Last 30 days</span>
            <ChevronDown size={11} />
          </button>
        </div>
      </motion.div>

      {/* ══ STAT CARDS ══════════════════════════════════════════ */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3.5 mb-4">
        {statCards.map((card, i) => (
          <StatCard key={card.label} {...card} delay={i * 0.06} />
        ))}
      </div>

      {/* ══ ROW 2: CLICK ANALYTICS + TOP COUNTRIES ══════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 mb-4">

        {/* ── Click Analytics ── */}
        <motion.div className="dash-glass-card lg:col-span-2" variants={itemVariants}>
          <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
            <div>
              <h2 className="text-[13px] font-bold text-white mb-0.5">Click Analytics</h2>
              <p className="text-[10px]" style={{ color: '#6B7280' }}>Last 14 days performance</p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <p className="text-[1.4rem] font-black text-white leading-none">{totalClicks.toLocaleString()}</p>
              <div className="flex items-center gap-3.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#8B5CF6', boxShadow: '0 0 6px #8B5CF640' }} />
                  <span className="text-[10px] font-medium" style={{ color: '#9CA3AF' }}>Clicks</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#4C1D95' }} />
                  <span className="text-[10px] font-medium" style={{ color: '#9CA3AF' }}>Unique</span>
                </div>
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={chartData} margin={{ top: 8, right: 6, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="clicksGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#8B5CF6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="uniqueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#4C1D95" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#4C1D95" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.06)" vertical={false} />
              <XAxis dataKey="date"
                tick={{ fontSize: 9.5, fill: '#4B5563' }} axisLine={false} tickLine={false} dy={7} />
              <YAxis
                tick={{ fontSize: 9.5, fill: '#4B5563' }} axisLine={false} tickLine={false} dx={-4} />
              <Tooltip content={<ChartTooltip />}
                cursor={{ stroke: 'rgba(139,92,246,0.18)', strokeWidth: 1.5 }} />
              <Area type="monotone" dataKey="clicks"
                stroke="#8B5CF6" strokeWidth={2.2}
                fill="url(#clicksGrad)"
                dot={false}
                activeDot={{ r: 4.5, fill: '#8B5CF6', stroke: 'rgba(139,92,246,0.3)', strokeWidth: 6 }} />
              <Area type="monotone" dataKey="unique"
                stroke="#4C1D95" strokeWidth={1.8}
                fill="url(#uniqueGrad)"
                dot={false}
                activeDot={{ r: 3.5, fill: '#4C1D95', strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* ── Top Countries ── */}
        <motion.div className="dash-glass-card" variants={itemVariants}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[13px] font-bold text-white">Top Countries</h2>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(139,92,246,0.1)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.18)' }}>
              {countriesData.length} regions
            </span>
          </div>

          {/* Donut */}
          <div className="flex justify-center mb-4">
            <div style={{ position: 'relative', width: 156, height: 156 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={countriesData}
                    cx="50%" cy="50%"
                    innerRadius={52} outerRadius={70}
                    paddingAngle={2.5}
                    dataKey="value"
                    startAngle={90} endAngle={-270}
                    animationBegin={0}
                    animationDuration={850}
                    stroke="none"
                  >
                    {countriesData.map((_, idx) => (
                      <Cell key={idx} fill={PURPLE_PALETTE[idx % PURPLE_PALETTE.length]} />
                    ))}
                  </Pie>
                  <DonutCenterLabel cx={78} cy={78}
                    total={totalClicks} label="Total Clicks" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2.5">
            {countriesData.map((c, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-[13px] flex-shrink-0 leading-none">{c.flag}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[11px] font-medium text-white truncate">{c.name}</span>
                    <span className="text-[11px] font-bold ml-1.5" style={{ color: PURPLE_PALETTE[idx] }}>
                      {c.pct}%
                    </span>
                  </div>
                  <div className="h-[4px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: PURPLE_PALETTE[idx] }}
                      initial={{ width: 0 }}
                      animate={{ width: `${c.pct}%` }}
                      transition={{ duration: 0.85, delay: 0.08 + idx * 0.07 }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ══ ROW 3: TOP PERFORMING LINKS (full width) ══════════════ */}
      <motion.div variants={itemVariants} className="mb-4">
        <SCard
          title="Top Links"
          actionLabel="View all →"
          action={() => {}}
          headerRight={
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full ml-2"
              style={{ background: 'rgba(139,92,246,0.08)', color: '#9CA3AF', border: '1px solid rgba(139,92,246,0.12)' }}>
              {topLinks.length} links
            </span>
          }
        >
          <TopLinksTable links={topLinks} />
        </SCard>
      </motion.div>

      {/* ══ ROW 4: RECENT ACTIVITY + DEVICE + BROWSER ═══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">

        {/* ── Recent Activity ── */}
        <motion.div variants={itemVariants}>
          <SCard title="Recent Activity" badge="LIVE" className="h-full">
            {recentActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-3"
                  style={{ background: 'rgba(139,92,246,0.09)', border: '1px solid rgba(139,92,246,0.18)' }}>
                  <Activity size={18} style={{ color: '#8B5CF6' }} />
                </div>
                <p className="text-sm font-semibold text-white mb-1">No activity yet</p>
                <p className="text-xs" style={{ color: '#6B7280' }}>Clicks will appear here in real time</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {recentActivity.slice(0, 8).map((act, i) => (
                  <ActivityFeedItem
                    key={act.visitId || i}
                    act={act}
                    i={i}
                    isLast={i === Math.min(recentActivity.length, 8) - 1}
                  />
                ))}
              </div>
            )}
          </SCard>
        </motion.div>

        {/* ── Device Breakdown ── */}
        <motion.div variants={itemVariants}>
          <SCard title="Device Breakdown" className="h-full">
            <div className="flex justify-center mb-4">
              <div style={{ position: 'relative', width: 148, height: 148 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={devicesData}
                      cx="50%" cy="50%"
                      innerRadius={46} outerRadius={63}
                      paddingAngle={2.5}
                      dataKey="value"
                      startAngle={90} endAngle={-270}
                      animationBegin={150}
                      animationDuration={850}
                      stroke="none"
                    >
                      {devicesData.map((_, idx) => (
                        <Cell key={idx} fill={DEVICE_COLORS[idx % DEVICE_COLORS.length]} />
                      ))}
                    </Pie>
                    <DonutCenterLabel cx={74} cy={74}
                      total={totalClicks} label="Visitors" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-2.5">
              {devicesData.map((d, idx) => {
                const DevIcon = d.icon;
                return (
                  <div key={idx} className="flex items-center gap-2.5">
                    <DevIcon size={13} style={{ color: DEVICE_COLORS[idx] }} className="flex-shrink-0" />
                    <span className="text-[12px] text-white flex-1 font-medium">{d.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-[72px] h-[4px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: DEVICE_COLORS[idx] }}
                          initial={{ width: 0 }}
                          animate={{ width: `${d.value}%` }}
                          transition={{ duration: 0.85, delay: 0.12 + idx * 0.065 }}
                        />
                      </div>
                      <span className="text-[11px] font-bold w-8 text-right"
                        style={{ color: DEVICE_COLORS[idx] }}>
                        {d.value}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total stat below */}
            <div className="mt-4 pt-3.5 flex items-center justify-between"
              style={{ borderTop: '1px solid rgba(139,92,246,0.09)' }}>
              <span className="text-[10px] font-medium" style={{ color: '#6B7280' }}>Total Visitors</span>
              <span className="text-[13px] font-bold text-white">{totalClicks.toLocaleString()}</span>
            </div>
          </SCard>
        </motion.div>

        {/* ── Browser Analytics ── */}
        <motion.div variants={itemVariants}>
          <SCard title="Browser Analytics" className="h-full">
            <div className="space-y-3.5">
              {browsersData.map((b, idx) => (
                <BrowserRow
                  key={b.name}
                  name={b.name}
                  value={b.value}
                  color={BROWSER_COLORS[idx]}
                  i={idx}
                />
              ))}
            </div>

            {/* Mini trend chart */}
            <div className="mt-4 pt-3.5" style={{ borderTop: '1px solid rgba(139,92,246,0.09)' }}>
              <p className="text-[10px] font-medium mb-2" style={{ color: '#6B7280' }}>7-day click trend</p>
              <ResponsiveContainer width="100%" height={62}>
                <LineChart data={chartData.slice(-7)} margin={{ top: 2, right: 4, left: -26, bottom: 0 }}>
                  <Line
                    type="monotone" dataKey="clicks"
                    stroke="#8B5CF6" strokeWidth={1.8}
                    dot={false} activeDot={{ r: 3, fill: '#8B5CF6', strokeWidth: 0 }}
                  />
                  <Tooltip content={<ChartTooltip />}
                    cursor={{ stroke: 'rgba(139,92,246,0.15)', strokeWidth: 1 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </SCard>
        </motion.div>
      </div>

    </motion.div>
  );
}
