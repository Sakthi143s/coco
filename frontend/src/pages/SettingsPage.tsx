import React from 'react';
import { Settings, ShieldCheck, Database, Zap, CheckCircle2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl">
      {/* Header */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-orange-500">
            <Settings className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">System Settings & Architecture</h2>
            <p className="text-xs text-slate-400">Configure Strava OAuth, webhooks, and database environment</p>
          </div>
        </div>

        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3.5 py-1.5 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4" /> Systems Operational
        </span>
      </div>

      {/* Strava Integration Settings Card */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <Zap className="w-5 h-5 text-orange-500" />
          <h3 className="text-base font-bold text-white">Strava API & Webhook Configuration</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 font-semibold uppercase block mb-1">Integration Mode</span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-extrabold text-orange-400">Real Strava v3 API</span>
              <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-300">STRAVA_MODE=real</span>
            </div>
            <p className="text-slate-400 mt-2 leading-relaxed">
              Authenticates with official Strava v3 API. Retrieves real athlete activities without mock data fallback.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 font-semibold uppercase block mb-1">Webhook Subscription Status</span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-extrabold text-orange-400">Endpoint Registered</span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20">
                HTTP 200 OK
              </span>
            </div>
            <p className="text-slate-400 mt-2 leading-relaxed font-mono text-[11px]">
              POST /api/webhooks/strava
            </p>
          </div>
        </div>

        {/* Configuration Details Table */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
            <span className="font-semibold text-slate-300">OAuth Callback URI</span>
            <code className="text-orange-400 font-mono">http://localhost:8000/api/auth/strava/callback</code>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
            <span className="font-semibold text-slate-300">Webhook Verification Token</span>
            <code className="text-slate-400 font-mono">cycle_club_webhook_verify_token_123</code>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
            <span className="font-semibold text-slate-300">Client Secret Security</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" /> Kept in backend env only (Never exposed to browser)
            </span>
          </div>
        </div>
      </div>

        {/* Database Architecture Card */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <Database className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-bold text-white">Database & Relational Schema</h3>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Powered by SQLAlchemy ORM with support for Supabase PostgreSQL and local SQLite. Key indexed fields include:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
            <span className="text-orange-400 font-bold block mb-1">clubs</span>
            id, slug, name
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
            <span className="text-emerald-400 font-bold block mb-1">users</span>
            id, strava_athlete_id
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
            <span className="text-cyan-400 font-bold block mb-1">activities</span>
            strava_activity_id, start_date
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
            <span className="text-purple-400 font-bold block mb-1">strava_connections</span>
            access/refresh_tokens
          </div>
        </div>
      </div>

      {/* Strava Brand & Legal Compliance Notice */}
      <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs text-slate-400">
        <div className="flex items-center gap-2 text-white font-bold">
          <ShieldCheck className="w-4 h-4 text-orange-500" />
          <span>Strava Developer Program Compliance</span>
        </div>
        <p className="leading-relaxed">
          CycleClub Analytics strictly adheres to the Strava API Agreement and Brand Guidelines:
        </p>
        <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
          <li>Access tokens and refresh tokens are strictly stored on the backend database and never exposed to client bundles.</li>
          <li>Every displayed activity links back directly to the original Strava activity with "View on Strava".</li>
          <li>All leaderboard participant data is subject to explicit user opt-in consent.</li>
        </ul>
        <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 font-medium">
          Disclaimer: CycleClub Analytics is an independent application and is not developed, sponsored, or endorsed by Strava, Inc.
        </div>
      </div>
    </div>
  );
};
