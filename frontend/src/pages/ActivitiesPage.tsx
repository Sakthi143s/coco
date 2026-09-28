import React, { useState } from 'react';
import type { Activity } from '../types';
import { Bike, Search, ExternalLink, RefreshCw, User as UserIcon } from 'lucide-react';

interface ActivitiesPageProps {
  activities: Activity[];
  onRiderSelect: (riderId: string) => void;
  onRefresh: () => void;
}

export const ActivitiesPage: React.FC<ActivitiesPageProps> = ({
  activities,
  onRiderSelect,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filtered = activities.filter((act) => {
    const actName = act.activity_name || act.name || '';
    const riderName = act.rider_name || '';
    const stravaId = act.strava_activity_id || '';
    const matchesSearch =
      actName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      riderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stravaId.includes(searchTerm);
    const matchesType = typeFilter === 'all' || act.activity_type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Search & Filter Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-5 rounded-2xl border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search activity name, rider or Strava ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/60 transition-colors"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            {['all', 'Ride', 'EBikeRide', 'VirtualRide'].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                  typeFilter === t
                    ? 'bg-orange-500 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t === 'all' ? 'All Types' : t}
              </button>
            ))}
          </div>

          <button
            onClick={onRefresh}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all"
            title="Refresh Feed"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Activities Data Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <h3 className="font-bold text-lg text-white flex items-center gap-2">
            <Bike className="w-5 h-5 text-orange-500" /> Club Activity Log ({filtered.length})
          </h3>
          <span className="text-xs text-slate-400">Synced from Strava Webhooks & API</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs font-semibold text-slate-400 bg-slate-950/60 border-b border-slate-800 uppercase tracking-wider">
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Rider</th>
                <th className="py-3.5 px-4">Activity Name</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4 text-right">Distance</th>
                <th className="py-3.5 px-4 text-right">Elevation</th>
                <th className="py-3.5 px-4 text-right">Moving Time</th>
                <th className="py-3.5 px-4 text-right">Avg Speed</th>
                <th className="py-3.5 px-4 text-right">Calories</th>
                <th className="py-3.5 px-4 text-right">Strava</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Bike className="w-8 h-8 text-slate-600 mb-1" />
                      <span className="font-semibold text-slate-300">No Strava activities imported yet.</span>
                      <span className="text-xs text-slate-400">
                        Connect your Strava account to start importing activities.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((act) => (
                  <tr key={act.id} className="hover:bg-slate-900/50 transition-colors group">
                    <td className="py-3.5 px-4 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(act.start_date).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <div
                        onClick={() => onRiderSelect(act.rider_id)}
                        className="flex items-center gap-2.5 cursor-pointer"
                      >
                        {act.rider_avatar ? (
                          <img
                            src={act.rider_avatar}
                            alt={act.rider_name}
                            className="w-7 h-7 rounded-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-[9px] font-bold text-orange-400">
                            {act.rider_name ? act.rider_name.slice(0, 2).toUpperCase() : <UserIcon className="w-3 h-3" />}
                          </div>
                        )}
                        <span className="font-semibold text-white group-hover:text-orange-400 transition-colors">
                          {act.rider_name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white max-w-xs truncate">
                      {act.activity_name || act.name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-900 border border-slate-800 text-orange-400">
                        {act.activity_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-emerald-400 whitespace-nowrap">
                      {act.distance} <span className="text-xs text-slate-400 font-normal">km</span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-300 font-semibold whitespace-nowrap">
                      {act.elevation_gain} <span className="text-xs text-slate-400 font-normal">m</span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-400 font-medium whitespace-nowrap">
                      {Math.floor(act.moving_time / 3600)}h {Math.floor((act.moving_time % 3600) / 60)}m
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-amber-400 whitespace-nowrap">
                      {act.average_speed} <span className="text-xs text-slate-400 font-normal">km/h</span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-400 text-xs whitespace-nowrap">
                      {act.calories ? `${act.calories} kcal` : '--'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {act.strava_url && (
                        <a
                          href={act.strava_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-orange-500 hover:text-orange-400 font-semibold"
                        >
                          Strava <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
