import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Lock, Zap, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { authService } from '../services/services';

const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (password.length >= 12) score++;
  const levels = [
    { label: '', color: '' },
    { label: 'Very Weak', color: '#ef4444' },
    { label: 'Weak', color: '#ea580c' },
    { label: 'Fair', color: '#f97316' },
    { label: 'Strong', color: '#f97316' },
    { label: 'Very Strong', color: '#fb923c' },
  ];
  return { score, ...levels[Math.min(score, 5)] };
};

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  const strength = getPasswordStrength(form.password);

  const validate = () => {
    const e = {};
    if (!form.password) e.password = 'Password is required.';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters.';
    if (!form.confirmPassword) e.confirmPassword = 'Please confirm your password.';
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (!token) {
      toast.error('Invalid reset link. Please request a new one.');
      return;
    }
    setLoading(true);
    try {
      await authService.resetPassword(token, form.password);
      setSuccess(true);
      toast.success('Password reset successfully!');
      setTimeout(() => navigate('/login', { replace: true }), 3000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reset password. The link may have expired.';
      toast.error(msg);
      setErrors({ submit: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0d1117]">
      {/* Background glows — same as LoginPage */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #f97316, transparent 70%)' }} />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #ea580c, transparent 70%)' }} />
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: i % 2 === 0 ? '#f97316' : '#ea580c',
              left: `${10 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
              opacity: 0.3,
            }}
            animate={{ y: [-10, 10, -10], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.3)]"
              style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
            >
              <Zap size={24} className="text-white" />
            </div>
            <span className="text-3xl font-bold gradient-text tracking-tight">LinkPulse</span>
          </div>
          <h1 className="text-3xl font-bold text-[#f8fafc] mb-2 tracking-tight">Reset Password</h1>
          <p className="text-[#94a3b8]">
            {success ? 'Redirecting you to login…' : 'Choose a strong new password for your account.'}
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          className="dark-card p-8 shadow-2xl relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Top border highlight */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-orange-500/50 to-transparent opacity-50" />

          {success ? (
            /* ── Success state ── */
            <motion.div
              className="text-center py-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.3)' }}
              >
                <CheckCircle2 size={32} className="text-orange-500" />
              </div>
              <h2 className="text-lg font-bold text-[#f8fafc] mb-2">Password Updated!</h2>
              <p className="text-[#94a3b8] text-sm mb-2 leading-relaxed">
                Your password has been reset successfully. You'll be redirected to login shortly.
              </p>
              <p className="text-[#64748b] text-xs">Redirecting in 3 seconds…</p>
            </motion.div>
          ) : (
            /* ── Form state ── */
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Token invalid error */}
              {errors.submit && (
                <div
                  className="flex items-start gap-2.5 p-3 rounded-lg"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
                >
                  <AlertCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">{errors.submit}</p>
                </div>
              )}

              {/* New password */}
              <div>
                <label className="block text-sm font-medium text-[#94a3b8] mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#484f58]" />
                  <input
                    id="reset-password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => { setForm(f => ({ ...f, password: e.target.value })); setErrors({}); }}
                    placeholder="••••••••"
                    className={`input-field pl-10 pr-10 ${errors.password ? 'border-red-500/50 bg-red-500/5' : ''}`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#484f58] hover:text-[#94a3b8] transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs mt-1.5">{errors.password}</p>}

                {/* Password strength bar */}
                {form.password && (
                  <motion.div className="mt-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="flex gap-1.5 mb-1.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className="h-1 flex-1 rounded-full transition-all duration-300"
                          style={{ background: i <= strength.score ? strength.color : 'rgba(255,255,255,0.05)' }}
                        />
                      ))}
                    </div>
                    {strength.label && (
                      <p className="text-xs font-medium" style={{ color: strength.color }}>{strength.label}</p>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-sm font-medium text-[#94a3b8] mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#484f58]" />
                  <input
                    id="reset-confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={(e) => { setForm(f => ({ ...f, confirmPassword: e.target.value })); setErrors({}); }}
                    placeholder="••••••••"
                    className={`input-field pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500/50 bg-red-500/5' : ''}`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#484f58] hover:text-[#94a3b8] transition-colors"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-400 text-xs mt-1.5">{errors.confirmPassword}</p>
                )}
              </div>

              <motion.button
                type="submit"
                id="reset-submit"
                disabled={loading}
                className="btn-primary w-full mt-2 py-3"
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Resetting…
                  </>
                ) : (
                  'Reset Password'
                )}
              </motion.button>
            </form>
          )}

          {!success && (
            <div className="mt-6 pt-5 border-t border-white/[0.05]">
              <p className="text-center text-[#94a3b8] text-sm">
                Link expired?{' '}
                <Link to="/forgot-password" className="text-orange-500 hover:text-orange-400 font-medium transition-colors">
                  Request a new one
                </Link>
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
