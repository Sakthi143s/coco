import React, { useState } from 'react';
import { Flame, ShieldCheck, Zap, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { signInWithGoogle, loading, error, clearError, isConfigured } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLocalError(null);
    clearError();
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setLocalError(err.message || 'Failed to authenticate with Google');
    } finally {
      setSubmitting(false);
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 sm:px-6 relative overflow-hidden font-sans">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md glass-card border border-slate-800/80 rounded-3xl p-8 sm:p-10 shadow-2xl relative z-10 backdrop-blur-xl animate-fadeIn">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-600 via-amber-500 to-yellow-400 flex items-center justify-center shadow-xl shadow-orange-500/25 mb-4">
            <Flame className="w-8 h-8 text-white animate-pulse" />
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            CycleClub <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">Analytics</span>
          </h1>
          
          <p className="text-sm text-slate-400 mt-2 font-medium">
            Cycling performance intelligence for your club.
          </p>
        </div>

        {/* Error Notification Banner */}
        {displayError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-3 animate-fadeIn">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-rose-200">Authentication Notice</div>
              <div className="mt-1 leading-relaxed">{displayError}</div>
            </div>
            <button
              onClick={() => {
                setLocalError(null);
                clearError();
              }}
              className="text-rose-400 hover:text-white text-xs font-bold px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Supabase Setup Banner (if not yet configured) */}
        {!isConfigured && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-amber-300">Supabase Configuration Required</div>
              <div className="mt-1 text-slate-400 leading-relaxed">
                To enable live Google Sign-In, please configure <code className="text-amber-400 font-mono">VITE_SUPABASE_URL</code> and <code className="text-amber-400 font-mono">VITE_SUPABASE_ANON_KEY</code> in <code className="text-slate-300 font-mono">frontend/.env</code>.
              </div>
            </div>
          </div>
        )}

        {/* Primary Action: Continue with Google */}
        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            disabled={submitting || loading}
            className="w-full h-12 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-2xl shadow-lg shadow-white/5 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {submitting || loading ? (
              <RefreshCw className="w-5 h-5 animate-spin text-orange-600" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            )}
            <span className="text-sm">
              {submitting ? 'Redirecting to Google...' : loading ? 'Restoring session...' : 'Continue with Google'}
            </span>
          </button>
        </div>

        {/* Feature Highlights Footer */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Authenticated club analytics backed by Supabase & OAuth</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <Zap className="w-4 h-4 text-orange-500 shrink-0" />
            <span>Direct synchronization with official Strava v3 API</span>
          </div>
        </div>
      </div>

      {/* Footer Copyright */}
      <footer className="mt-8 text-xs text-slate-400 text-center relative z-10">
        CycleClub Analytics • Real-Time Club Performance Intelligence
      </footer>
    </div>
  );
};
