import React, { useState, useEffect } from 'react';
import { Trophy, Award, Mountain, MapPin, Zap, Flame, User as UserIcon } from 'lucide-react';
import type { LeaderboardResponse } from '../types';
import { api } from '../services/api';

interface LeaderboardPageProps {
  onRiderSelect: (riderId: string) => void;
}

export const LeaderboardPage: React.FC<LeaderboardPageProps> = ({ onRiderSelect }) => {
  const [timeframe, setTimeframe] = useState<string>('today');
  const [category, setCategory] = useState<string>('distance');
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchBoard = async () => {
    try {
      setLoading(true);
      const data = await api.getLeaderboard(timeframe, category);
      setLeaderboard(data);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoard();
  }, [timeframe, category]);

  const categories = [
    { id: 'distance', label: 'Distance', icon: MapPin },
    { id: 'elevation', label: 'Elevation', icon: Mountain },
    { id: 'longest_ride', label: 'Longest Ride', icon: Award },
    { id: 'most_active', label: 'Most Active', icon: Flame },
  ];

  const timeframes = [
    { id: 'today', label: 'Daily' },
    { id: 'week', label: 'Weekly' },
    { id: 'month', label: 'Monthly' },
    { id: 'all_time', label: 'All Time' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Category Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = category === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`p-4 rounded-2xl border transition-all flex items-center gap-3.5 text-left ${
                isActive
                  ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/10 border-orange-500/60 shadow-lg shadow-orange-500/10'
                  : 'glass-card border-slate-800 hover:border-slate-700'
              }`}
            >
              <div
                className={`p-2.5 rounded-xl ${
                  isActive ? 'bg-orange-500 text-white' : 'bg-slate-900 text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className={`text-sm font-bold ${isActive ? 'text-white' : 'text-slate-300'}`}>
                  {cat.label}
                </div>
                <div className="text-[11px] text-slate-400">Rankings</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Leaderboard Table Container */}
      <div className="glass-card rounded-2xl border border-slate-800 p-6">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-xl text-white capitalize">
                {timeframe} {category.replace('_', ' ')} Leaderboard
              </h3>
              <p className="text-xs text-slate-400">
                Transparent ranking algorithm calculated directly from verified database records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            {timeframes.map((tf) => (
              <button
                key={tf.id}
                onClick={() => setTimeframe(tf.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  timeframe === tf.id
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="py-16 text-center text-orange-500 font-semibold flex items-center justify-center gap-2">
            <Zap className="w-5 h-5 animate-bounce" /> Calculating rankings...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs font-semibold text-slate-400 border-b border-slate-800 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Rank</th>
                  <th className="py-3.5 px-4">Rider</th>
                  <th className="py-3.5 px-4 text-right">Total Distance</th>
                  <th className="py-3.5 px-4 text-right">Total Elevation</th>
                  <th className="py-3.5 px-4 text-right">Longest Ride</th>
                  <th className="py-3.5 px-4 text-right">Rides Logged</th>
                  <th className="py-3.5 px-4 text-right">Moving Time</th>
                  <th className="py-3.5 px-4 text-right">Avg Speed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {!leaderboard?.entries || leaderboard.entries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Trophy className="w-8 h-8 text-slate-600 mb-1" />
                        <span className="font-semibold text-slate-300">No rides yet.</span>
                        <span className="text-xs text-slate-400">
                          Connect your Strava account to start importing activities.
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  leaderboard.entries.map((entry) => (
                    <tr
                      key={entry.rider_id}
                      onClick={() => onRiderSelect(entry.rider_id)}
                      className="hover:bg-slate-900/60 cursor-pointer transition-colors"
                    >
                      <td className="py-4 px-4 font-bold">
                        <span
                          className={`w-8 h-8 rounded-xl inline-flex items-center justify-center text-xs ${
                            entry.rank === 1
                              ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/30'
                              : entry.rank === 2
                              ? 'bg-slate-300 text-slate-950 font-bold'
                              : entry.rank === 3
                              ? 'bg-amber-700/80 text-white font-bold'
                              : 'text-slate-400 bg-slate-900 border border-slate-800'
                          }`}
                        >
                          #{entry.rank}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {entry.rider_avatar ? (
                            <img
                              src={entry.rider_avatar}
                              alt={entry.rider_name}
                              className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-800"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-orange-400">
                              {entry.rider_name ? entry.rider_name.slice(0, 2).toUpperCase() : <UserIcon className="w-4 h-4" />}
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-white hover:text-orange-400 transition-colors">
                              {entry.rider_name}
                            </span>
                            {entry.strava_athlete_id && (
                              <div className="text-[10px] text-orange-400">Strava Synced</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right font-extrabold text-emerald-400">
                        {entry.distance_km} <span className="text-xs text-slate-400 font-normal">km</span>
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-purple-400">
                        {entry.elevation_m} <span className="text-xs text-slate-400 font-normal">m</span>
                      </td>
                      <td className="py-4 px-4 text-right text-slate-200 font-semibold">
                        {entry.max_single_distance_km} <span className="text-xs text-slate-400 font-normal">km</span>
                      </td>
                      <td className="py-4 px-4 text-right text-slate-300 font-bold">
                        {entry.ride_count} rides
                      </td>
                      <td className="py-4 px-4 text-right text-slate-400">
                        {entry.moving_time_formatted}
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-amber-400">
                        {entry.average_speed_kmh} <span className="text-xs text-slate-400 font-normal">km/h</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
