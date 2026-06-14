import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Filter, SortAsc, SortDesc, Star, Copy, Trash2,
  Edit2, QrCode, ExternalLink, BarChart2, Link2, Download,
  ChevronLeft, ChevronRight, RefreshCw, Copy as DuplicateIcon,
  Clock, Activity, Tag
} from 'lucide-react';
import { linkService } from '../services/services';
import CreateLinkModal from '../components/links/CreateLinkModal';
import QRModal from '../components/links/QRModal';
import { LinkCardSkeleton, EmptyState, ErrorState } from '../components/ui/Skeletons';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Date Created' },
  { value: 'clickCount', label: 'Click Count' },
  { value: 'lastVisitedAt', label: 'Last Visited' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'disabled', label: 'Disabled' },
];

const getStatusBadge = (link) => {
  if (link.isExpired) return { label: 'Expired', cls: 'badge-red' };
  if (link.status === 'disabled') return { label: 'Disabled', cls: 'badge-gray' };
  return { label: 'Active', cls: 'badge-green' };
};

const getHealthColor = (badge) => {
  const map = { Excellent: '#22c55e', Good: '#84cc16', Fair: '#eab308', Poor: '#f97316', Critical: '#ef4444' };
  return map[badge] || '#94a3b8';
};

export default function LinksPage() {
  const navigate = useNavigate();
  const [links, setLinks] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [editLink, setEditLink] = useState(null);
  const [qrLink, setQrLink] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [favoritingId, setFavoritingId] = useState(null);
  const [duplicatingId, setDuplicatingId] = useState(null);
  const searchTimeout = useRef(null);

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await linkService.getLinks({
        page, limit: 12, search, status, sortBy, sortOrder,
      });
      setLinks(res.data.data.links);
      setPagination(res.data.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load links');
    } finally {
      setLoading(false);
    }
  }, [page, search, status, sortBy, sortOrder]);

  useEffect(() => { fetchLinks(); }, [fetchLinks]);

  const handleSearch = (val) => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
    }, 400);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this link and all its analytics?')) return;
    setDeletingId(id);
    try {
      await linkService.deleteLink(id);
      toast.success('Link deleted');
      fetchLinks();
    } catch {
      toast.error('Failed to delete link');
    } finally {
      setDeletingId(null);
    }
  };

  const handleFavorite = async (link) => {
    setFavoritingId(link._id);
    try {
      await linkService.toggleFavorite(link._id);
      toast.success(link.isFavorite ? 'Removed from favorites' : 'Added to favorites ⭐');
      fetchLinks();
    } catch {
      toast.error('Failed to update favorite');
    } finally {
      setFavoritingId(null);
    }
  };

  const handleDuplicate = async (id) => {
    setDuplicatingId(id);
    try {
      await linkService.duplicateLink(id);
      toast.success('Link duplicated!');
      fetchLinks();
    } catch {
      toast.error('Failed to duplicate link');
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleExport = async () => {
    try {
      const res = await linkService.exportLinks();
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `linkpulse-export-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV exported!');
    } catch {
      toast.error('Export failed');
    }
  };

  const copyLink = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Copied!');
    } catch {
      toast.error('Copy failed');
    }
  };

  return (
    <div className="page-bg min-h-screen">
      <div className="max-w-7xl mx-auto p-6 md:p-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">My Links</h1>
            <p className="text-slate-500 text-sm mt-1">
              {pagination.total} link{pagination.total !== 1 ? 's' : ''} total
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExport} className="btn-secondary flex items-center gap-2 text-sm px-3 py-2">
              <Download size={14} />
              Export CSV
            </button>
            <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
              <Plus size={16} />
              Create Link
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card p-4 mb-5 flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search links…"
              className="input-field pl-9 py-2 text-sm"
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          {/* Status filter */}
          <div className="flex gap-1">
            {STATUS_OPTIONS.map(o => (
              <button
                key={o.value}
                onClick={() => { setStatus(o.value); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  status === o.value
                    ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                    : 'text-slate-500 hover:text-slate-300 border border-transparent'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              className="input-field py-1.5 text-xs w-auto"
              style={{ appearance: 'none' }}
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value} style={{ background: '#0f0f1a' }}>{o.label}</option>
              ))}
            </select>
            <button
              onClick={() => setSortOrder(v => v === 'desc' ? 'asc' : 'desc')}
              className="btn-secondary p-2"
              title={sortOrder === 'desc' ? 'Descending' : 'Ascending'}
            >
              {sortOrder === 'desc' ? <SortDesc size={14} /> : <SortAsc size={14} />}
            </button>
            <button onClick={fetchLinks} className="btn-secondary p-2" title="Refresh">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Content */}
        {error ? (
          <ErrorState message={error} onRetry={fetchLinks} />
        ) : loading ? (
          <div className="grid grid-cols-1 gap-4">
            {[...Array(6)].map((_, i) => <LinkCardSkeleton key={i} />)}
          </div>
        ) : links.length === 0 ? (
          <EmptyState
            icon={Link2}
            title={search ? 'No links found' : 'No links yet'}
            description={search ? 'Try a different search term or filter' : 'Create your first short link to get started'}
            action={
              !search && (
                <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 px-5 py-2.5">
                  <Plus size={16} />
                  Create your first link
                </button>
              )
            }
          />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${page}-${search}-${status}`}
              className="space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {links.map((link, i) => {
                const statusBadge = getStatusBadge(link);
                const healthColor = getHealthColor(link.healthBadge);
                return (
                  <motion.div
                    key={link._id}
                    className="glass-card p-4 hover:border-indigo-500/30"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)' }}>
                        <Link2 size={16} className="text-indigo-400" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-semibold text-white truncate max-w-xs">
                            {link.title || link.shortCode}
                          </span>
                          <span className={`badge ${statusBadge.cls}`}>{statusBadge.label}</span>
                          {link.isFavorite && <Star size={12} className="text-amber-400" fill="currentColor" />}
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          <a
                            href={link.shortUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
                          >
                            {link.shortUrl}
                            <ExternalLink size={10} />
                          </a>
                          <button onClick={() => copyLink(link.shortUrl)} className="text-slate-600 hover:text-slate-300 transition-colors">
                            <Copy size={11} />
                          </button>
                        </div>

                        <p className="text-xs text-slate-600 truncate mb-3">{link.originalUrl}</p>

                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Activity size={11} />
                            <span>{link.clickCount?.toLocaleString() || 0} clicks</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Clock size={11} />
                            <span>{format(new Date(link.createdAt), 'MMM d, yyyy')}</span>
                          </div>
                          {link.healthBadge && (
                            <div className="flex items-center gap-1.5">
                              <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                <div className="h-full rounded-full" style={{ width: `${link.healthScore}%`, background: healthColor }} />
                              </div>
                              <span className="text-xs font-medium" style={{ color: healthColor }}>{link.healthBadge}</span>
                            </div>
                          )}
                          {link.tags?.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap">
                              {link.tags.slice(0, 3).map(t => (
                                <span key={t} className="badge badge-purple text-xs">{t}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* Analytics */}
                        <button
                          onClick={() => navigate(`/analytics/${link._id}`)}
                          className="p-2 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
                          title="View Analytics"
                        >
                          <BarChart2 size={15} />
                        </button>
                        {/* QR Code */}
                        <button
                          onClick={() => setQrLink(link)}
                          className="p-2 rounded-lg text-slate-500 hover:text-violet-400 hover:bg-violet-500/10 transition-all"
                          title="View QR Code"
                        >
                          <QrCode size={15} />
                        </button>
                        {/* Favorite */}
                        <button
                          onClick={() => handleFavorite(link)}
                          disabled={favoritingId === link._id}
                          className={`p-2 rounded-lg transition-all ${
                            link.isFavorite
                              ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
                              : 'text-slate-500 hover:text-amber-400 hover:bg-amber-500/10'
                          }`}
                          title={link.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          <Star size={15} fill={link.isFavorite ? 'currentColor' : 'none'} />
                        </button>
                        {/* Duplicate */}
                        <button
                          onClick={() => handleDuplicate(link._id)}
                          disabled={duplicatingId === link._id}
                          className="p-2 rounded-lg text-slate-500 hover:text-green-400 hover:bg-green-500/10 transition-all"
                          title="Duplicate"
                        >
                          <DuplicateIcon size={15} />
                        </button>
                        {/* Edit */}
                        <button
                          onClick={() => setEditLink(link)}
                          className="p-2 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                          title="Edit"
                        >
                          <Edit2 size={15} />
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(link._id)}
                          disabled={deletingId === link._id}
                          className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-xs text-slate-600">
              Page {pagination.page} of {pagination.pages} · {pagination.total} links
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={!pagination.hasPrev}
                className="btn-secondary px-3 py-2 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                      page === p
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-500 hover:text-white hover:bg-white/06'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={!pagination.hasNext}
                className="btn-secondary px-3 py-2 disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
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
