import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Activity, 
  Trophy, 
  Target, 
  BarChart3, 
  Settings,
  Flame,
  Zap,
  CheckCircle2,
  Unlink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  stravaStatus: boolean;
  onConnectStrava: () => void;
  onDisconnectStrava?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  stravaStatus,
  onConnectStrava,
  onDisconnectStrava,
}) => {
  const { user } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'riders', label: 'Riders', icon: Users },
    { id: 'activities', label: 'Activities', icon: Activity },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'challenges', label: 'Challenges', icon: Target },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900/90 backdrop-blur-xl border-r border-slate-800/80 flex flex-col justify-between h-screen sticky top-0 z-30">
      <div>
        {/* Brand Logo Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 via-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Flame className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5">
              CycleClub <span className="text-orange-500 text-xs font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/20">PRO</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              {user?.club_name || 'Apex Velo Chapter'}
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/20 font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Strava Integration Footer Card */}
      <div className="p-4 border-t border-slate-800/80">
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Strava</span>
            </div>
            {stravaStatus && (
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold">
                Active
              </span>
            )}
          </div>

          <p className="text-xs text-slate-400 mb-3 leading-relaxed">
            {stravaStatus
              ? 'Connected to Strava v3. Sync rides directly into club leaderboards.'
              : 'Connect your Strava account to start importing your real activities.'}
          </p>

          {stravaStatus ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> Strava Linked
              </div>
              {onDisconnectStrava && (
                <button
                  onClick={onDisconnectStrava}
                  className="w-full text-[11px] text-slate-400 hover:text-rose-400 py-1 flex items-center justify-center gap-1 transition-colors"
                  title="Disconnect Strava (keeps imported activities)"
                >
                  <Unlink className="w-3 h-3" /> Disconnect Strava
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={onConnectStrava}
              className="w-full bg-[#FC5200] hover:bg-[#e04800] text-white text-xs font-bold py-2 px-3 rounded-lg shadow-md transition-all flex items-center justify-center gap-2"
            >
              Connect Strava
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
