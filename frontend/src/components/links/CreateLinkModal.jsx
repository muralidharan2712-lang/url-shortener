import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Link2, Tag, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { linkService } from '../../services/services';
import toast from 'react-hot-toast';

const EXPIRY_OPTIONS = [
  { value: 'never', label: 'Never expires' },
  { value: '1h', label: '1 Hour' },
  { value: '24h', label: '24 Hours' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: '1y', label: '1 Year' },
];

export default function CreateLinkModal({ isOpen, onClose, onCreated, initialData = null }) {
  const [form, setForm] = useState({
    originalUrl: '',
    alias: '',
    title: '',
    expiryOption: 'never',
    tags: '',
  });
  const [errors, setErrors] = useState({});
  const [aliasStatus, setAliasStatus] = useState(null); // null | 'checking' | 'available' | 'taken'
  const [loading, setLoading] = useState(false);
  const aliasTimeout = useRef(null);
  const isEdit = !!initialData;

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setForm({
          originalUrl: initialData.originalUrl || '',
          alias: initialData.alias || '',
          title: initialData.title || '',
          expiryOption: initialData.expiryOption || 'never',
          tags: (initialData.tags || []).join(', '),
        });
      } else {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setForm({ originalUrl: '', alias: '', title: '', expiryOption: 'never', tags: '' });
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setErrors({});
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAliasStatus(null);
    }
  }, [isOpen, initialData]);

  const checkAlias = (value) => {
    if (!value || (initialData && value === initialData.alias)) {
      setAliasStatus(null);
      return;
    }
    setAliasStatus('checking');
    clearTimeout(aliasTimeout.current);
    aliasTimeout.current = setTimeout(async () => {
      try {
        const res = await linkService.checkAlias(value);
        setAliasStatus(res.data.available ? 'available' : 'taken');
      } catch {
        setAliasStatus(null);
      }
    }, 500);
  };

  const validate = () => {
    const e = {};
    if (!form.originalUrl.trim()) e.originalUrl = 'URL is required';
    else {
      try { new URL(form.originalUrl); }
      catch { e.originalUrl = 'Enter a valid URL (include https://)'; }
    }
    if (form.alias && !/^[a-z0-9\-_]+$/.test(form.alias)) {
      e.alias = 'Only lowercase letters, numbers, hyphens and underscores';
    }
    if (aliasStatus === 'taken') e.alias = 'This alias is already taken';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        originalUrl: form.originalUrl.trim(),
        alias: form.alias.trim() || undefined,
        title: form.title.trim() || undefined,
        expiryOption: form.expiryOption,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      };
      let result;
      if (isEdit) {
        result = await linkService.updateLink(initialData._id, payload);
        toast.success('Link updated successfully!');
      } else {
        result = await linkService.createLink(payload);
        toast.success('Link created successfully!');
      }
      onCreated?.(result.data.data.link);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} link`;
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="modal-overlay absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-lg glass-strong rounded-2xl p-6 z-10 shadow-2xl"
            style={{ boxShadow: '0 0 0 1px rgba(249,115,22,0.2), 0 40px 80px rgba(0,0,0,0.6)' }}
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
                  <Link2 size={16} className="text-white" />
                </div>
                <h2 className="text-lg font-semibold text-white">
                  {isEdit ? 'Edit Link' : 'Create Short Link'}
                </h2>
              </div>
              <button onClick={onClose} className="text-slate-500 hover:text-slate-200 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Original URL */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Destination URL <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.originalUrl}
                  onChange={(e) => setForm(f => ({ ...f, originalUrl: e.target.value }))}
                  placeholder="https://example.com/your-long-url"
                  className={`input-field ${errors.originalUrl ? 'border-red-500/50 bg-red-500/5' : ''}`}
                />
                {errors.originalUrl && (
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle size={11} /> {errors.originalUrl}
                  </p>
                )}
              </div>

              {/* Custom alias */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Custom Alias <span className="text-slate-600 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={form.alias}
                    onChange={(e) => {
                      const v = e.target.value.toLowerCase();
                      setForm(f => ({ ...f, alias: v }));
                      checkAlias(v);
                    }}
                    placeholder="my-custom-link"
                    className={`input-field pr-10 ${errors.alias ? 'border-red-500/50' : aliasStatus === 'available' ? 'border-green-500/40' : ''}`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {aliasStatus === 'checking' && <Loader2 size={14} className="text-slate-500 animate-spin" />}
                    {aliasStatus === 'available' && <CheckCircle size={14} className="text-green-400" />}
                    {aliasStatus === 'taken' && <AlertCircle size={14} className="text-red-400" />}
                  </div>
                </div>
                {errors.alias && <p className="text-red-400 text-xs mt-1">{errors.alias}</p>}
                {aliasStatus === 'available' && !errors.alias && (
                  <p className="text-green-400 text-xs mt-1">✓ Alias is available</p>
                )}
                {aliasStatus === 'taken' && (
                  <p className="text-red-400 text-xs mt-1">✗ This alias is already taken</p>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Title <span className="text-slate-600 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Descriptive title for your link"
                  className="input-field"
                />
              </div>

              {/* Tags + Expiry in a row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    <Tag size={12} className="inline mr-1" />Tags
                  </label>
                  <input
                    type="text"
                    value={form.tags}
                    onChange={(e) => setForm(f => ({ ...f, tags: e.target.value }))}
                    placeholder="tag1, tag2"
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    <Clock size={12} className="inline mr-1" />Expires
                  </label>
                  <select
                    value={form.expiryOption}
                    onChange={(e) => setForm(f => ({ ...f, expiryOption: e.target.value }))}
                    className="input-field text-sm"
                    style={{ appearance: 'none' }}
                  >
                    {EXPIRY_OPTIONS.map(o => (
                      <option key={o.value} value={o.value} style={{ background: '#0f0f1a' }}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className="btn-secondary flex-1">
                  Cancel
                </button>
                <motion.button
                  type="submit"
                  disabled={loading || aliasStatus === 'checking' || aliasStatus === 'taken'}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                  whileHover={{ scale: loading ? 1 : 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      {isEdit ? 'Saving…' : 'Creating…'}
                    </>
                  ) : (
                    isEdit ? 'Save Changes' : 'Create Link'
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
