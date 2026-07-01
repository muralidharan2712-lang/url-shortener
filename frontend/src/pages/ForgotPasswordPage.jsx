import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Mail, Zap, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';
import { authService } from '../services/services';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const validate = () => {
    if (!email.trim()) { setError('Email is required.'); return false; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Enter a valid email address.'); return false; }
    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await authService.forgotPassword(email.trim());
      setSubmitted(true);
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
      toast.error(msg);
      setError(msg);
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
          <h1 className="text-3xl font-bold text-[#f8fafc] mb-2 tracking-tight">Forgot Password</h1>
          <p className="text-[#94a3b8]">
            {submitted
              ? "Check your inbox for the reset link."
              : "Enter your email and we'll send you a reset link."}
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

          {submitted ? (
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
              <h2 className="text-lg font-bold text-[#f8fafc] mb-2">Email Sent!</h2>
              <p className="text-[#94a3b8] text-sm mb-6 leading-relaxed">
                If <span className="text-orange-400 font-medium">{email}</span> is registered,
                you'll receive a reset link shortly. Check your spam folder if you don't see it.
              </p>
              <p className="text-[#64748b] text-xs mb-4">The link expires in 1 hour.</p>
              <Link
                to="/login"
                className="btn-primary w-full flex items-center justify-center gap-2 py-3"
              >
                <ArrowLeft size={16} />
                Back to Login
              </Link>
            </motion.div>
          ) : (
            /* ── Form state ── */
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#94a3b8] mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#484f58]" />
                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    placeholder="you@example.com"
                    className={`input-field pl-10 ${error ? 'border-red-500/50 bg-red-500/5' : ''}`}
                    autoComplete="email"
                    autoFocus
                  />
                </div>
                {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
              </div>

              <motion.button
                type="submit"
                id="forgot-submit"
                disabled={loading}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Send Reset Link
                  </>
                )}
              </motion.button>
            </form>
          )}

          {!submitted && (
            <div className="mt-6 pt-5 border-t border-white/[0.05]">
              <p className="text-center text-[#94a3b8] text-sm">
                Remember your password?{' '}
                <Link to="/login" className="text-orange-500 hover:text-orange-400 font-medium transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
