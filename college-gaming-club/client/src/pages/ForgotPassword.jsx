import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { useToast } from '../context/ToastContext';
import { Mail, ArrowLeft, Send } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await API.post('/auth/forgot-password', { email });
      if (res.data.success) {
        addToast(res.data.message || 'Reset token generated!', 'success');
        setResetToken(res.data.resetToken);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to process request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 p-8 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl shadow-2xl">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white font-mono">RECOVER PASSWORD</h2>
          <p className="text-xs text-slate-400">
            Enter your registered university email to receive a password reset token.
          </p>
        </div>

        {resetToken ? (
          <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/40 space-y-3 text-xs text-cyan-200">
            <p className="font-bold">Reset Token Generated:</p>
            <code className="block p-2 bg-slate-950 rounded border border-cyan-800 text-[11px] break-all font-mono">
              {resetToken}
            </code>
            <p className="text-slate-400">
              In development mode, token is returned directly. Use this token on the reset page.
            </p>
            <Link
              to={`/reset-password?token=${resetToken}`}
              className="block text-center py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
            >
              Proceed to Reset Password →
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Your Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@uemjgaming.club"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
            >
              {submitting ? 'Generating...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <div className="text-center pt-2">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
