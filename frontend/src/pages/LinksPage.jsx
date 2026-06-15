import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Star, Copy, Edit2, BarChart2, Link2, Download,
  ChevronLeft, ChevronRight, Activity, ChevronDown, AlignJustify, Filter
} from 'lucide-react';
import { linkService } from '../services/services';
import CreateLinkModal from '../components/links/CreateLinkModal';
import QRModal from '../components/links/QRModal';
import { EmptyState, ErrorState } from '../components/ui/Skeletons';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'disabled', label: 'Disabled' },
];

const getStatusBadge = (link) => {
  if (link.isExpired) return { label: 'Expired', cls: 'badge-orange' };
  if (link.status === 'disabled') return { label: 'Disabled', cls: 'badge-gray' };
  return { label: 'Active', cls: 'badge-active' };
};

const LinkIcon = ({ url, alias }) => {
  const colors = {
    youtube: '#ea580c',
    instagram: '#fb923c',
    twitter: '#f97316',
    github: '#8b949e',
    google: '#f97316',
    facebook: '#fb923c',
    linkedin: '#f97316',
  };

  const getColor = () => {
    const str = (url || alias || '').toLowerCase();
    for (const [k, v] of Object.entries(colors)) {
      if (str.includes(k)) return v;
    }
    return '#f97316';
  };

  const getInitial = () => {
    const str = alias || url || '?';
    return str[0].toUpperCase();
  };

  return (
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center text-[#0d1117] text-xs font-bold flex-shrink-0"
      style={{ background: getColor() }}
    >
      {getInitial()}
    </div>
  );
};

const DarkStatCard = ({ icon: Icon, label, value, trend, trendVal, iconColor, iconBg, delay }) => (
  <motion.div
    className="dark-card p-5"
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay }}
  >
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border border-white/5"
        style={{ background: iconBg }}>
        <Icon size={20} style={{ color: iconColor }} />
      </div>
      <div className="flex-1">
        <p className="text-xs text-[#8b949e] font-medium mb-1 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-[#f8fafc] tracking-tight">{value ?? '—'}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${trend === 'up' ? 'text-orange-400 bg-orange-500/10' : 'text-red-400 bg-red-400/10'}`}>
            {trend === 'up' ? '↑' : '↓'} {trendVal}
          </span>
        </div>
      </div>
    </div>
  </motion.div>
);

const SkeletonRow = () => (
  <tr className="border-b border-white/[0.05]">
    {[2, 6, 2, 1.5, 1.5, 2].map((w, i) => (
      <td key={i} className="px-5 py-4">
        <div className={`skeleton h-4 w-${Math.round(w * 10)} rounded`} style={{ width: `${w * 10}%`, minWidth: 32, maxWidth: 160 }} />
      </td>
    ))}
  </tr>
);

export default function LinksPage() {
  const navigate = useNavigate();
  const [links, setLinks] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [sortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [editLink, setEditLink] = useState(null);
  const [qrLink, setQrLink] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const searchTimeout = useRef(null);

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await linkService.getLinks({
        page, limit: 10, search, status, sortBy, sortOrder,
      });
      setLinks(res.data.data.links);
      setPagination(res.data.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load links');
    } finally {
      setLoading(false);
    }
  }, [page, search, status, sortBy, sortOrder]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLinks();
  }, [fetchLinks]);

  const handleSearch = (val) => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
    }, 400);
  };

  const copyLink = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Copied!');
    } catch {
      toast.error('Copy failed');
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === links.length && links.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(links.map(l => l._id)));
    }
  };

  const getPageNumbers = () => {
    const total = pagination.pages;
    const cur = page;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (cur <= 4) return [1, 2, 3, 4, 5, '...', total];
    if (cur >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    return [1, '...', cur - 1, cur, cur + 1, '...', total];
  };

  return (
    <div className="min-h-screen bg-[#0d1117] p-5 md:p-7">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#f8fafc] tracking-tight">Links Directory</h1>
            <p className="text-[#8b949e] text-sm mt-1">
              Manage, track, and optimize your shortened URLs.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-secondary">
              <Download size={16} />
              Export
            </button>
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <Plus size={16} />
              New Link
            </button>
          </div>
        </div>

        {/* ── Stat Cards ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <DarkStatCard
            icon={Link2} label="Total Links"
            value={pagination.total || 0}
            trend="up" trendVal="12.5%"
            iconBg="rgba(249,115,22,0.12)" iconColor="#f97316"
            delay={0}
          />
          <DarkStatCard
            icon={Activity} label="Active Links"
            value={links.filter(l => !l.isExpired && l.status !== 'disabled').length || 0}
            trend="up" trendVal="8.2%"
            iconBg="rgba(251,146,60,0.12)" iconColor="#fb923c"
            delay={0.05}
          />
          <DarkStatCard
            icon={BarChart2} label="Total Clicks"
            value={links.reduce((s, l) => s + (l.clickCount || 0), 0).toLocaleString()}
            trend="up" trendVal="15.3%"
            iconBg="rgba(249,115,22,0.1)" iconColor="#f97316"
            delay={0.1}
          />
          <DarkStatCard
            icon={Star} label="Favorite Links"
            value={links.filter(l => l.isFavorite).length || 0}
            trend="up" trendVal="6.1%"
            iconBg="rgba(234,88,12,0.12)" iconColor="#ea580c"
            delay={0.15}
          />
        </div>

        {/* ── Toolbar ──────────────────────────────────────────── */}
        <div className="dark-card p-4 flex flex-col md:flex-row items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#484f58]" />
            <input
              type="text"
              placeholder="Search by alias, URL or tags..."
              className="input-field pl-11"
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto thin-scroll pb-1 md:pb-0">
            {/* Filter Toggle */}
            <button className="btn-secondary flex-shrink-0">
              <Filter size={14} />
              Filters
            </button>
            
            {/* Status */}
            <div className="relative flex-shrink-0">
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                className="input-field pr-10 appearance-none bg-[#161b22] border-white/[0.08]"
              >
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b949e] pointer-events-none" />
            </div>

            {/* Sort Toggle */}
            <button
              onClick={() => setSortOrder(v => v === 'desc' ? 'asc' : 'desc')}
              className="btn-secondary px-3 flex-shrink-0"
              title={sortOrder === 'desc' ? 'Descending' : 'Ascending'}
            >
              <AlignJustify size={14} />
            </button>
          </div>
        </div>

        {/* ── Table ────────────────────────────────────────────── */}
        <div className="dark-card overflow-hidden shadow-2xl border border-white/[0.05]">
          {error ? (
            <div className="p-12">
              <ErrorState message={error} onRetry={fetchLinks} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-dark">
                <thead>
                  <tr>
                    <th className="w-12 px-5 py-4">
                      <input
                        type="checkbox"
                        className="custom-check"
                        checked={selectedIds.size === links.length && links.length > 0}
                        onChange={toggleAll}
                      />
                    </th>
                    <th>Link Details</th>
                    <th>Target URL</th>
                    <th>Engagement</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <>{[...Array(6)].map((_, i) => <SkeletonRow key={i} />)}</>
                  ) : links.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-20">
                        <EmptyState
                          icon={Link2}
                          title={search ? 'No matches found' : 'No links created yet'}
                          description={search ? 'Try adjusting your search or filters.' : 'Create your first short link to start tracking.'}
                          action={!search && (
                            <button onClick={() => setShowCreate(true)} className="btn-primary mt-2">
                              <Plus size={16} /> Create Link
                            </button>
                          )}
                        />
                      </td>
                    </tr>
                  ) : (
                    <AnimatePresence mode="sync">
                      {links.map((link, i) => {
                        const badge = getStatusBadge(link);
                        const isSelected = selectedIds.has(link._id);

                        return (
                          <motion.tr
                            key={link._id}
                            className={`border-b border-white/[0.03] transition-colors ${isSelected ? 'bg-orange-500/10' : 'hover:bg-white/[0.02]'}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2, delay: i * 0.03 }}
                          >
                            <td className="w-12 px-5 py-4">
                              <input
                                type="checkbox"
                                className="custom-check"
                                checked={isSelected}
                                onChange={() => toggleSelect(link._id)}
                              />
                            </td>

                            <td className="px-5 py-4 min-w-[220px]">
                              <div className="flex items-center gap-3">
                                <LinkIcon url={link.originalUrl} alias={link.title || link.shortCode} />
                                <div>
                                  <p className="text-sm font-semibold text-[#f8fafc] mb-0.5 truncate max-w-[180px]">
                                    {link.title || link.shortCode}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <a
                                      href={link.shortUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-orange-500 hover:text-orange-400 font-medium"
                                    >
                                      {link.shortUrl?.replace('https://', '')}
                                    </a>
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <span className="text-xs text-[#8b949e] truncate max-w-[200px] block" title={link.originalUrl}>
                                {link.originalUrl}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-[#f8fafc]">
                                  {link.clickCount?.toLocaleString() || 0}
                                </span>
                                <span className="text-[10px] text-[#484f58] uppercase tracking-wider">Clicks</span>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <span className={`badge ${badge.cls}`}>{badge.label}</span>
                            </td>

                            <td className="px-5 py-4">
                              <span className="text-sm text-[#8b949e]">
                                {link.createdAt ? format(new Date(link.createdAt), 'MMM d, yyyy') : '—'}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => copyLink(link.shortUrl)}
                                  className="p-2 rounded-lg text-[#8b949e] hover:text-[#f8fafc] hover:bg-white/5 transition-all"
                                  title="Copy Link"
                                >
                                  <Copy size={16} />
                                </button>
                                <button
                                  onClick={() => navigate(`/analytics/${link._id}`)}
                                  className="p-2 rounded-lg text-[#8b949e] hover:text-orange-400 hover:bg-orange-500/10 transition-all"
                                  title="Analytics"
                                >
                                  <BarChart2 size={16} />
                                </button>
                                <button
                                  onClick={() => setEditLink(link)}
                                  className="p-2 rounded-lg text-[#8b949e] hover:text-[#f8fafc] hover:bg-white/5 transition-all"
                                  title="Edit"
                                >
                                  <Edit2 size={16} />
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Pagination ─────────────────────────────────────── */}
          {pagination.pages > 1 && !loading && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.05] bg-[#0d1117]">
              <p className="text-xs text-[#8b949e]">
                Showing <span className="text-[#f8fafc] font-medium">{(page - 1) * 10 + 1}</span> to <span className="text-[#f8fafc] font-medium">{Math.min(page * 10, pagination.total)}</span> of <span className="text-[#f8fafc] font-medium">{pagination.total}</span>
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrev}
                  className="p-2 rounded-lg text-[#8b949e] hover:text-[#f8fafc] hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={16} />
                </button>

                {getPageNumbers().map((num, i) =>
                  num === '...' ? (
                    <span key={`dot-${i}`} className="w-8 text-center text-[#484f58] text-sm">…</span>
                  ) : (
                    <button
                      key={num}
                      onClick={() => setPage(num)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                        page === num
                          ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                          : 'text-[#8b949e] hover:text-[#f8fafc] hover:bg-white/10'
                      }`}
                    >
                      {num}
                    </button>
                  )
                )}

                <button
                  onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                  disabled={!pagination.hasNext}
                  className="p-2 rounded-lg text-[#8b949e] hover:text-[#f8fafc] hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────── */}
      <CreateLinkModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => fetchLinks()}
      />
      <CreateLinkModal
        isOpen={!!editLink}
        initialData={editLink}
        onClose={() => setEditLink(null)}
        onCreated={() => { fetchLinks(); setEditLink(null); }}
      />
      <QRModal
        isOpen={!!qrLink}
        link={qrLink}
        onClose={() => setQrLink(null)}
      />
    </div>
  );
}
