import React from 'react';

interface BadgeProps {
  type: 'active' | 'inactive' | 'connected' | 'disconnected' | 'admin' | 'member';
}

export const Badge: React.FC<BadgeProps> = ({ type }) => {
  const styles = {
    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    inactive: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    connected: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    disconnected: 'bg-slate-800 text-slate-400 border-slate-700',
    admin: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    member: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
  };

  const labels = {
    active: 'Active',
    inactive: 'Inactive',
    connected: 'Strava Sync',
    disconnected: 'No Strava',
    admin: 'Admin',
    member: 'Member'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${styles[type]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        type === 'active' || type === 'connected' ? 'bg-current animate-pulse' : 'bg-current'
      }`} />
      {labels[type]}
    </span>
  );
};
