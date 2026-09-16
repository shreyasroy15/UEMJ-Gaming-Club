import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Gamepad2, Lock, Mail, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      addToast('Please provide email and password', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const res = await login(email, password);
      if (res.success) {
        addToast(`Welcome back, ${res.user.name}!`, 'success');
        let destination = from;
        if (destination === '/') {
          if (res.user.role === 'admin') destination = '/admin';
          else if (res.user.role === 'organizer') destination = '/organizer';
          else destination = '/dashboard';
        }
        navigate(destination, { replace: true });
      } else {
        addToast(res.message || 'Invalid credentials', 'error');
      }
    } catch (err) {
      addToast('An unexpected error occurred during login', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Demo account auto-fill
  const fillCredentials = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    addToast(`Loaded ${demoEmail.split('@')[0]} credentials`, 'info');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-8 rounded-3xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl shadow-2xl shadow-cyan-950/20">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-0.5 mx-auto flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Gamepad2 className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-mono">
            SIGN IN TO ARENA
          </h2>
          <p className="text-xs text-slate-400">
            Enter your college gaming credentials to access tournaments & rosters.
          </p>
        </div>

        {/* Demo Accounts Quick-Bar */}
        <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
          <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider text-center font-mono">
            ⚡ Quick Demo Auto-Fill:
          </span>
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => fillCredentials('rohit@uemjgaming.club', 'password123')}
              className="px-2 py-1.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/40 text-[10px] sm:text-[11px] font-bold transition-all truncate"
            >
              🎯 Student
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('shreyas@uemjgaming.club', 'password123')}
              className="px-2 py-1.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-900/40 text-[10px] sm:text-[11px] font-bold transition-all truncate"
            >
              ⚡ Organizer
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('admin@uemjgaming.club', 'admin123')}
              className="px-2 py-1.5 rounded-lg bg-fuchsia-950/40 border border-fuchsia-500/30 text-fuchsia-300 hover:bg-fuchsia-900/40 text-[10px] sm:text-[11px] font-bold transition-all truncate"
            >
              👑 Admin
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Email or Username
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@uemjgaming.club"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-300 uppercase">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-cyan-400 hover:underline"
              >
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {submitting ? 'Authenticating...' : 'Sign In'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center pt-2 text-xs text-slate-400">
          Don't have a player account yet?{' '}
          <Link to="/register" className="text-cyan-400 font-bold hover:underline">
            Register for Free
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
