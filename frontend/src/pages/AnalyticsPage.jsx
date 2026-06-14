import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, BarChart2, TrendingUp, Clock, Download,
  Monitor, Smartphone, Tablet, HelpCircle, Calendar,
  ExternalLink, Activity
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { analyticsService } from '../services/services';
import { ChartSkeleton, EmptyState, ErrorState } from '../components/ui/Skeletons';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd'];

const deviceIcon = (d) => {
  if (d === 'mobile') return Smartphone;
  if (d === 'tablet') return Tablet;
  if (d === 'desktop') return Monitor;
  return HelpCircle;
};

const CustomAreaTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-xl text-sm"
      style={{ background: 'rgba(15,15,26,0.97)', border: '1px solid rgba(99,102,241,0.3)', color: '#e2e8f0' }}>
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <p className="font-semibold text-indigo-300">{payload[0].value} clicks</p>
    </div>
  );
};

export default function AnalyticsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(30);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await analyticsService.getLinkAnalytics(id, days);
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [id, days]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const handleExport = async () => {
    try {
      const res = await analyticsService.exportAnalytics(id);
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${id}-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Analytics exported!');
    } catch {
      toast.error('Export failed — no visits to export yet');
    }
  };

  const getHealthColor = (badge) => {
    const map = { Excellent: '#22c55e', Good: '#84cc16', Fair: '#eab308', Poor: '#f97316', Critical: '#ef4444' };
    return map[badge] || '#94a3b8';
  };

  if (loading) {
    return (
      <div className="page-bg min-h-screen p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="h-8 skeleton w-32 rounded-lg mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="stat-card">
                <div className="skeleton h-6 w-24 rounded mb-2" />
                <div className="skeleton h-8 w-16 rounded" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ChartSkeleton height={240} />
            <ChartSkeleton height={240} />
          </div>
        </div>
      </div>
    );
  }

  if (error) return (
    <div className="page-bg min-h-screen flex items-center justify-center">
      <ErrorState message={error} onRetry={fetchAnalytics} />
    </div>
  );

  const { link, summary, charts, recentVisits } = data;
  const healthColor = getHealthColor(summary.healthBadge);

  return (
    <div className="page-bg min-h-screen">
      <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/06 transition-all"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {link.title || link.shortCode}
              </h1>
              <a
                href={link.shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-0.5"
              >
                {link.shortUrl} <ExternalLink size={12} />
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Day range selector */}
            <div className="flex gap-1">
              {[7, 30, 90].map(d => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    days === d
                      ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                      : 'text-slate-500 hover:text-slate-300 border border-transparent'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
            <button onClick={handleExport} className="btn-secondary flex items-center gap-2 text-sm px-3 py-2">
              <Download size={14} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Clicks', value: summary.totalClicks?.toLocaleString(), icon: TrendingUp, color: '#6366f1' },
            { label: `Clicks (${days}d)`, value: summary.clicksInRange, icon: Activity, color: '#8b5cf6' },
            { label: 'Avg / Day', value: summary.avgClicksPerDay, icon: BarChart2, color: '#a78bfa' },
            { label: 'Best Day', value: summary.bestPerformingDay, icon: Calendar, color: '#f59e0b' },
          ].map(({ label, value, icon: Icon, color }, i) => (
            <motion.div
              key={label}
              className="stat-card"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                <Icon size={16} style={{ color }} />
              </div>
              <p className="text-2xl font-bold text-white mb-0.5">{value ?? '—'}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </motion.div>
          ))}
        </div>

        {/* Health + last visit row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <motion.div className="stat-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <p className="text-xs text-slate-500 mb-2">Link Health Score</p>
            <div className="flex items-center gap-3">
              <p className="text-3xl font-bold text-white">{summary.healthScore}</p>
              <span className="badge" style={{ background: `${healthColor}18`, color: healthColor, border: `1px solid ${healthColor}30` }}>
                {summary.healthBadge}
              </span>
            </div>
            <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: healthColor }}
                initial={{ width: 0 }}
                animate={{ width: `${summary.healthScore}%` }}
                transition={{ duration: 0.8, delay: 0.5 }}
              />
            </div>
          </motion.div>
          <motion.div className="stat-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
            <p className="text-xs text-slate-500 mb-2">Last Click</p>
            <p className="text-xl font-semibold text-white">
              {summary.lastVisit
                ? format(new Date(summary.lastVisit), 'MMM d, yyyy h:mm a')
                : 'No visits yet'}
            </p>
          </motion.div>
        </div>

        {/* Daily Trend Chart */}
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-base font-semibold text-white mb-5">
            Daily Click Trend — Last {days} Days
          </h2>
          {charts.dailyTrends.length === 0 || charts.dailyTrends.every(d => d.clicks === 0) ? (
            <EmptyState icon={BarChart2} title="No clicks yet" description="Clicks will appear here as people visit your link" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={charts.dailyTrends}>
                <defs>
                  <linearGradient id="clickGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: 'rgba(148,163,184,0.6)' }}
                  tickFormatter={d => format(new Date(d), 'MMM d')}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 10, fill: 'rgba(148,163,184,0.6)' }} />
                <Tooltip content={<CustomAreaTooltip />} />
                <Area type="monotone" dataKey="clicks" stroke="#6366f1" strokeWidth={2} fill="url(#clickGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Day of week + Device breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Day of week */}
          <motion.div
            className="glass-card p-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <h2 className="text-base font-semibold text-white mb-5">Clicks by Day of Week</h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={charts.dayOfWeekData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: 'rgba(148,163,184,0.6)' }}
                  tickFormatter={d => d.slice(0, 3)}
                />
                <YAxis tick={{ fontSize: 10, fill: 'rgba(148,163,184,0.6)' }} />
                <Tooltip content={<CustomAreaTooltip />} />
                <Bar dataKey="clicks" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Device breakdown */}
          <motion.div
            className="glass-card p-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-base font-semibold text-white mb-5">Device Breakdown</h2>
            {charts.deviceBreakdown.every(d => d.count === 0) ? (
              <EmptyState icon={Monitor} title="No device data yet" description="Device info will appear when people click your link" />
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={160}>
                  <PieChart>
                    <Pie
                      data={charts.deviceBreakdown.filter(d => d.count > 0)}
                      dataKey="count"
                      nameKey="device"
                      cx="50%" cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      strokeWidth={0}
                    >
                      {charts.deviceBreakdown.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val, name) => [val, name]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2.5">
                  {charts.deviceBreakdown.filter(d => d.count > 0).map((d, i) => {
                    const Icon = deviceIcon(d.device);
                    const total = charts.deviceBreakdown.reduce((s, x) => s + x.count, 0);
                    return (
                      <div key={d.device} className="flex items-center gap-2">
                        <Icon size={14} style={{ color: COLORS[i % COLORS.length] }} />
                        <span className="text-sm text-slate-400 capitalize flex-1">{d.device}</span>
                        <span className="text-sm font-medium text-white">{d.count}</span>
                        <span className="text-xs text-slate-600">
                          {total > 0 ? Math.round(d.count / total * 100) : 0}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Hour of day heatmap */}
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <h2 className="text-base font-semibold text-white mb-5">Clicks by Hour of Day</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={charts.hourOfDayData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 9, fill: 'rgba(148,163,184,0.5)' }}
                tickFormatter={h => h.split(':')[0]}
                interval={3}
              />
              <YAxis tick={{ fontSize: 10, fill: 'rgba(148,163,184,0.6)' }} />
              <Tooltip content={<CustomAreaTooltip />} />
              <Bar dataKey="clicks" fill="#a78bfa" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Recent visits */}
        {recentVisits.length > 0 && (
          <motion.div
            className="glass-card p-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h2 className="text-base font-semibold text-white mb-5">Recent Visits</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left py-2 px-3 text-xs text-slate-500 font-medium">Date & Time</th>
                    <th className="text-left py-2 px-3 text-xs text-slate-500 font-medium">Device</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {recentVisits.map((v, i) => {
                    const Icon = deviceIcon(v.device);
                    return (
                      <tr key={i} className="hover:bg-white/02 transition-colors">
                        <td className="py-2.5 px-3 text-slate-300">
                          {v.visitedAt ? format(new Date(v.visitedAt), 'MMM d, yyyy h:mm a') : '—'}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2 text-slate-400 capitalize">
                            <Icon size={13} />
                            {v.device}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
