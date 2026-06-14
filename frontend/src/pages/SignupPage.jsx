import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, User, Zap, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

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
    { label: 'Weak', color: '#f97316' },
    { label: 'Fair', color: '#eab308' },
    { label: 'Strong', color: '#22c55e' },
    { label: 'Very Strong', color: '#06b6d4' },
  ];
  return { score, ...levels[Math.min(score, 5)] };
};

const requirements = [
  { test: (p) => p.length >= 8, label: '8+ characters' },
  { test: (p) => /[A-Z]/.test(p), label: 'Uppercase letter' },
  { test: (p) => /[0-9]/.test(p), label: 'Number' },
  { test: (p) => /[^A-Za-z0-9]/.test(p), label: 'Special character' },
];

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showRequirements, setShowRequirements] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    else if (form.name.trim().length < 2) e.name = 'Name must be at least 2 characters';
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await signup(form.name.trim(), form.email, form.password);
      toast.success('Account created! Welcome to LinkPulse 🚀');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Signup failed. Please try again.';
      toast.error(msg);
      setErrors({ submit: msg });
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength(form.password);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: '#0a0a0f' }}>
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #8b5cf6, transparent 70%)' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #6366f1, transparent 70%)' }} />
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${4 + (i % 3) * 2}px`,
              height: `${4 + (i % 3) * 2}px`,
              background: i % 2 === 0 ? '#6366f1' : '#a78bfa',
              left: `${5 + i * 12}%`,
              top: `${15 + (i % 4) * 20}%`,
              opacity: 0.25,
            }}
            animate={{ y: [-12, 12, -12], opacity: [0.15, 0.4, 0.15] }}
            transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.2 }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md px-4 py-8">
        {/* Logo */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <Zap size={20} className="text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">LinkPulse</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Create your account</h1>
          <p className="text-slate-400">Start shortening links for free, no credit card needed</p>
        </motion.div>

        {/* Card */}
        <motion.div
          className="glass-strong rounded-2xl p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Full name</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="John Doe"
                  className={`input-field pl-10 ${errors.name ? 'border-red-500/50 bg-red-500/5' : ''}`}
                  autoComplete="name"
                />
              </div>
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="you@example.com"
                  className={`input-field pl-10 ${errors.email ? 'border-red-500/50 bg-red-500/5' : ''}`}
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                  onFocus={() => setShowRequirements(true)}
                  placeholder="Create a strong password"
                  className={`input-field pl-10 pr-10 ${errors.password ? 'border-red-500/50 bg-red-500/5' : ''}`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}

              {/* Strength bar */}
              {form.password && (
                <motion.div className="mt-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="h-1.5 flex-1 rounded-full transition-all duration-400"
                        style={{ background: i <= strength.score ? strength.color : 'rgba(255,255,255,0.08)' }}
                      />
                    ))}
                  </div>
                  {strength.label && <p className="text-xs" style={{ color: strength.color }}>{strength.label}</p>}
                </motion.div>
              )}

              {/* Requirements */}
              {(showRequirements || form.password) && (
                <motion.div
                  className="mt-3 grid grid-cols-2 gap-1.5"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  {requirements.map((req, i) => {
                    const met = req.test(form.password);
                    return (
                      <div key={i} className="flex items-center gap-1.5">
                        <CheckCircle
                          size={12}
                          style={{ color: met ? '#22c55e' : 'rgba(148,163,184,0.4)', flexShrink: 0 }}
                        />
                        <span className="text-xs" style={{ color: met ? '#4ade80' : 'rgba(148,163,184,0.6)' }}>
                          {req.label}
                        </span>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.99 }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account…
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight size={16} />
                </>
              )}
            </motion.button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
