import { RefreshCw, LogOut, Zap, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  activeTab: string;
  onRefresh?: () => void;
  isSyncing?: boolean;
  onSyncStrava?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onRefresh, isSyncing, onSyncStrava }) => {
  const { user, signOut } = useAuth();

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Club Performance Dashboard';
      case 'riders': return 'Rider Directory & Management';
      case 'activities': return 'Club Activities Feed';
      case 'leaderboard': return 'Club Leaderboards & Rankings';
      case 'challenges': return 'Active Club Challenges';
      case 'analytics': return 'Deep Performance Analytics';
      case 'settings': return 'System Settings & Integration';
      default: return 'Overview';
    }
  };

  return (
    <header className="h-20 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h2 className="text-xl font-bold text-white capitalize">{getTitle()}</h2>
        <p className="text-xs text-slate-400">Live club synchronization powered by Strava Engine</p>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {user?.strava_connected && onSyncStrava && (
          <button
            onClick={onSyncStrava}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FC5200] hover:bg-[#e04800] text-xs font-bold text-white transition-all shadow-md shadow-orange-500/20 disabled:opacity-50"
            title="Sync your real Strava activities"
          >
            <Zap className={`w-3.5 h-3.5 ${isSyncing ? 'animate-bounce' : ''}`} />
            <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync Strava'}</span>
          </button>
        )}

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-all disabled:opacity-50"
            title="Refresh dashboard metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-orange-500' : ''}`} />
            <span className="hidden sm:inline">{isSyncing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        )}

        <div className="h-6 w-px bg-slate-800"></div>

        {/* Real Authenticated User Profile */}
        <div className="flex items-center gap-3">
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name || 'User'}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-orange-500/40"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-orange-400">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : <UserIcon className="w-4 h-4" />}
            </div>
          )}

          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-white max-w-[140px] truncate">
              {user?.name || 'Club Athlete'}
            </div>
            <div className="text-[10px] text-orange-400 font-semibold uppercase tracking-wider">
              {user?.role === 'OWNER' ? 'Club Owner' : 'Club Member'}
            </div>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={signOut}
            title="Sign out of CycleClub"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-all ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
