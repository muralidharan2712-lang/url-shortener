import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BarChart2, Link2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { linkService } from '../services/services';
import { useEffect } from 'react';
import { EmptyState, ErrorState, ChartSkeleton } from '../components/ui/Skeletons';
import toast from 'react-hot-toast';
import CreateLinkModal from '../components/links/CreateLinkModal';

const getHealthColor = (badge) => {
  const map = { Excellent: '#22c55e', Good: '#84cc16', Fair: '#eab308', Poor: '#f97316', Critical: '#ef4444' };
  return map[badge] || '#94a3b8';
};

export default function AnalyticsListPage() {
  const navigate = useNavigate();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await linkService.getLinks({ limit: 50, sortBy: 'clickCount', sortOrder: 'desc' });
      setLinks(res.data.data.links);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load links');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLinks(); }, [fetchLinks]);

  if (loading) return (
    <div className="page-bg min-h-screen p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="skeleton h-8 w-40 rounded-lg mb-6" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => <ChartSkeleton key={i} height={80} />)}
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-bg min-h-screen">
      <div className="max-w-4xl mx-auto p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Analytics</h1>
            <p className="text-slate-500 text-sm mt-1">Click a link to see detailed analytics</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
            <Plus size={16} />
            New Link
          </button>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={fetchLinks} />
        ) : links.length === 0 ? (
          <EmptyState
            icon={BarChart2}
            title="No links to analyze"
            description="Create links and start driving traffic to see analytics here"
            action={
              <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 px-5 py-2.5">
                <Plus size={16} />Create a link
              </button>
            }
          />
        ) : (
          <div className="space-y-3">
            {links.map((link, i) => {
              const hColor = getHealthColor(link.healthBadge);
              return (
                <motion.div
                  key={link._id}
                  className="glass-card p-5 cursor-pointer hover:border-indigo-500/40"
                  onClick={() => navigate(`/analytics/${link._id}`)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ scale: 1.005 }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(99,102,241,0.12)' }}>
                      <BarChart2 size={16} className="text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {link.title || link.shortCode}
                      </p>
                      <p className="text-xs text-slate-600 truncate">{link.shortUrl}</p>
                    </div>
                    <div className="flex items-center gap-6 flex-shrink-0">
                      <div className="text-center">
                        <p className="text-lg font-bold text-white">{link.clickCount?.toLocaleString() || 0}</p>
                        <p className="text-xs text-slate-500">clicks</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div className="h-full rounded-full" style={{ width: `${link.healthScore}%`, background: hColor }} />
                        </div>
                        <span className="text-xs font-medium" style={{ color: hColor }}>{link.healthBadge}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
      <CreateLinkModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => fetchLinks()}
      />
    </div>
  );
}
