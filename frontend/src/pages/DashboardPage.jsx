import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Link2, TrendingUp, Activity, Star, Clock, Award,
  ExternalLink, Copy, BarChart2, Heart, RefreshCw
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { dashboardService } from '../services/services';
import { StatCardSkeleton, ChartSkeleton, EmptyState, ErrorState, LoadingSpinner } from '../components/ui/Skeletons';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

const StatCard = ({ icon: Icon, label, value, sub, color, delay = 0 }) => (
  <motion.div
    className="stat-card"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
  >
    <div className="flex items-center justify-between mb-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center"
        style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
        <Icon size={20} style={{ color }} />
      </div>
    </div>
    <p className="text-3xl font-bold text-white mb-1">{value ?? '—'}</p>
    <p className="text-sm font-medium text-slate-400">{label}</p>
    {sub && <p className="text-xs text-slate-600 mt-1">{sub}</p>}
  </motion.div>
);

const getHealthColor = (badge) => {
  const map = {
    Excellent: '#22c55e', Good: '#84cc16', Fair: '#eab308',
    Poor: '#f97316', Critical: '#ef4444',
  };
  return map[badge] || '#94a3b8';
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-xl text-sm"
      style={{ background: 'rgba(15,15,26,0.95)', border: '1px solid rgba(99,102,241,0.3)', color: '#e2e8f0' }}>
      <p className="text-slate-400 mb-1">{label}</p>
      <p className="font-semibold text-indigo-300">{payload[0].value} clicks</p>
    </div>
  );
};

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  } catch {
    toast.error('Failed to copy');
  }
};

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [topLinks, setTopLinks] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [sumRes, topRes, actRes, favRes, healthRes] = await Promise.all([
        dashboardService.getSummary(),
        dashboardService.getTopLinks(5),
        dashboardService.getRecentActivity(10),
        dashboardService.getFavorites(),
        dashboardService.getHealth(),
      ]);
      setSummary(sumRes.data.data);
      setTopLinks(topRes.data.data.topLinks);
      setRecentActivity(actRes.data.data.activities);
      setFavorites(favRes.data.data.favorites);
      setHealth(healthRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) {
    return (
      <div className="page-bg p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="h-8 skeleton w-48 rounded-lg mb-2" />
          <div className="h-4 skeleton w-64 rounded mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
            {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2"><ChartSkeleton height={280} /></div>
            <div><ChartSkeleton height={280} /></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) return (
    <div className="page-bg min-h-screen flex items-center justify-center">
      <ErrorState message={error} onRetry={() => fetchAll()} />
    </div>
  );

  const healthColor = getHealthColor(summary?.healthBadge);

  return (
    <div className="page-bg min-h-screen">
      <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-500 mt-1 text-sm">Your link performance overview</p>
          </div>
          <button
            onClick={() => fetchAll(true)}
            disabled={refreshing}
            className="btn-secondary flex items-center gap-2 text-sm px-4 py-2"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          <StatCard icon={Link2} label="Total Links" value={summary?.totalLinks} color="#6366f1" delay={0} />
          <StatCard icon={TrendingUp} label="Total Clicks" value={summary?.totalClicks?.toLocaleString()} color="#8b5cf6" delay={0.05} />
          <StatCard icon={Activity} label="Active Links" value={summary?.activeLinks} sub={`${summary?.expiredLinks} expired`} color="#22c55e" delay={0.1} />
          <StatCard icon={Star} label="Favorites" value={summary?.favoriteLinks} color="#f59e0b" delay={0.15} />
        </div>

        {/* Weekly stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <motion.div className="stat-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <p className="text-slate-500 text-sm mb-1">New links this week</p>
            <p className="text-2xl font-bold text-white">{summary?.newLinksThisWeek ?? 0}</p>
          </motion.div>
          <motion.div className="stat-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <p className="text-slate-500 text-sm mb-1">Clicks this week</p>
            <p className="text-2xl font-bold text-white">{summary?.clicksThisWeek ?? 0}</p>
          </motion.div>
          <motion.div className="stat-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <p className="text-slate-500 text-sm mb-1">Avg Health Score</p>
            <div className="flex items-center gap-3">
              <p className="text-2xl font-bold text-white">{summary?.avgHealthScore ?? 0}</p>
              <span
                className="badge text-xs"
                style={{
                  background: `${healthColor}18`,
                  color: healthColor,
                  border: `1px solid ${healthColor}30`,
                }}
              >
                {summary?.healthBadge || '—'}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Main content: top links + recent activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top performing links */}
          <motion.div
            className="glass-card p-6 lg:col-span-2"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <div className="flex items-center gap-2 mb-5">
              <Award size={18} className="text-indigo-400" />
              <h2 className="text-base font-semibold text-white">Top Performing Links</h2>
            </div>
            {topLinks.length === 0 ? (
              <EmptyState
                icon={Link2}
                title="No links yet"
                description="Create your first link to start tracking performance"
              />
            ) : (
              <div className="space-y-3">
                {topLinks.map((link, i) => (
                  <motion.div
                    key={link._id}
                    className="flex items-center gap-3 p-3 rounded-xl transition-all"
                    style={{ background: 'rgba(255,255,255,0.03)' }}
                    whileHover={{ background: 'rgba(99,102,241,0.06)' }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.05 }}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">
                        {link.title || link.originalUrl}
                      </p>
                      <p className="text-xs text-slate-600 truncate">{link.shortUrl}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-sm font-semibold text-indigo-300">
                        {link.clickCount?.toLocaleString()} clicks
                      </span>
                      <button
                        onClick={() => copyToClipboard(link.shortUrl)}
                        className="text-slate-600 hover:text-slate-300 transition-colors"
                        title="Copy link"
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Recent activity */}
          <motion.div
            className="glass-card p-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-2 mb-5">
              <Clock size={18} className="text-violet-400" />
              <h2 className="text-base font-semibold text-white">Recent Activity</h2>
            </div>
            {recentActivity.length === 0 ? (
              <EmptyState
                icon={Activity}
                title="No activity yet"
                description="Visits will appear here as people click your links"
              />
            ) : (
              <div className="space-y-2.5 overflow-y-auto thin-scroll max-h-80">
                {recentActivity.map((act, i) => (
                  <motion.div
                    key={act.visitId}
                    className="flex items-start gap-3 p-2.5 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.02)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.45 + i * 0.04 }}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: 'rgba(139,92,246,0.15)' }}>
                      <Activity size={12} className="text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-300 truncate">
                        {act.link?.title || act.link?.shortCode || 'Unknown link'}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-600 capitalize">{act.device}</span>
                        <span className="text-slate-700">·</span>
                        <span className="text-xs text-slate-600">
                          {act.visitedAt ? format(new Date(act.visitedAt), 'MMM d, h:mm a') : '—'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Favorites */}
        {favorites.length > 0 && (
          <motion.div
            className="glass-card p-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center gap-2 mb-5">
              <Heart size={18} className="text-rose-400" />
              <h2 className="text-base font-semibold text-white">Favorite Links</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {favorites.map((link, i) => (
                <motion.div
                  key={link._id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] hover:border-indigo-500/30 transition-all"
                  style={{ background: 'rgba(255,255,255,0.02)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.55 + i * 0.05 }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(245,158,11,0.12)' }}>
                    <Star size={14} className="text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">
                      {link.title || link.shortCode}
                    </p>
                    <p className="text-xs text-slate-600">{link.clickCount} clicks</p>
                  </div>
                  <button
                    onClick={() => window.open(link.shortUrl, '_blank')}
                    className="text-slate-600 hover:text-slate-300 transition-colors"
                  >
                    <ExternalLink size={14} />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Health overview */}
        {health && health.links.length > 0 && (
          <motion.div
            className="glass-card p-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
          >
            <div className="flex items-center gap-2 mb-5">
              <BarChart2 size={18} className="text-emerald-400" />
              <h2 className="text-base font-semibold text-white">Health Overview</h2>
            </div>
            <div className="flex flex-wrap gap-4 mb-5">
              {Object.entries(health.distribution).map(([badge, count]) => {
                const color = getHealthColor(badge);
                return (
                  <div key={badge} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                    <span className="text-sm text-slate-400">{badge}: <span className="text-white font-medium">{count}</span></span>
                  </div>
                );
              })}
            </div>
            <div className="space-y-2">
              {health.links.slice(0, 5).map((link) => {
                const hColor = getHealthColor(link.healthBadge);
                return (
                  <div key={link.id} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-300 truncate">{link.title || link.shortCode}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${link.healthScore}%`, background: hColor }}
                        />
                      </div>
                      <span className="text-xs font-medium w-8 text-right" style={{ color: hColor }}>
                        {link.healthScore}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
