import React from 'react';
import { 
  Users, 
  Bike, 
  MapPin, 
  Mountain, 
  Clock, 
  Calendar, 
  Trophy, 
  ArrowUpRight, 
  Filter,
  User as UserIcon,
  Zap
} from 'lucide-react';
import { MetricCard } from '../components/common/MetricCard';
import type { DashboardOverview, LeaderboardResponse, Activity } from '../types';

interface DashboardPageProps {
  overview: DashboardOverview | null;
  leaderboard: LeaderboardResponse | null;
  recentActivities: Activity[];
  onRiderSelect: (riderId: string) => void;
  onFilterChange: (timeframe: string) => void;
  selectedTimeframe: string;
  onConnectStrava?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  overview,
  leaderboard,
  recentActivities,
  onRiderSelect,
  onFilterChange,
  selectedTimeframe,
  onConnectStrava,
}) => {
  // Format moving time: if 0, show "0h" per Requirement 9
  const formattedMovingTime = overview?.moving_time_today_sec
    ? overview.moving_time_today_formatted
    : '0h';

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Timeframe Filter Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl glass-card border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
            <Filter className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Analytics Timeframe</h3>
            <p className="text-xs text-slate-400">Select active period for club performance aggregation</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
          {[
            { id: 'today', label: 'Today' },
            { id: 'week', label: 'This Week' },
            { id: 'month', label: 'This Month' },
            { id: 'year', label: 'This Year' },
            { id: 'all_time', label: 'All Time' },
          ].map((tf) => (
            <button
              key={tf.id}
              onClick={() => onFilterChange(tf.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedTimeframe === tf.id
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top Level Metric Grid (Requirement 9: 0 km, 0 m, 0 rides, 0h moving time) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Active Club Riders"
          value={overview?.total_active_riders ?? 0}
          unit="Riders"
          subtitle="Registered athletes"
          icon={Users}
          color="orange"
        />
        <MetricCard
          title="Rides Today"
          value={overview?.rides_today ?? 0}
          unit="Rides"
          subtitle="Recorded on Strava"
          icon={Bike}
          color="cyan"
        />
        <MetricCard
          title="Total Distance Today"
          value={overview?.distance_today_km ?? 0}
          unit="km"
          subtitle="Cumulative club distance"
          icon={MapPin}
          color="emerald"
        />
        <MetricCard
          title="Total Elevation Today"
          value={overview?.elevation_today_m ?? 0}
          unit="m"
          subtitle="Climbing elevation"
          icon={Mountain}
          color="purple"
        />
      </div>

      {/* Secondary Metrics: Moving Time, Weekly, Monthly */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="glass-card p-5 rounded-2xl flex items-center justify-between border border-slate-800">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Moving Time</span>
            <div className="text-xl font-extrabold text-white mt-1">
              {formattedMovingTime}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex items-center justify-between border border-slate-800">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Weekly Club Distance</span>
            <div className="text-xl font-extrabold text-white mt-1">
              {overview?.weekly_distance_km ?? 0} <span className="text-xs text-slate-400 font-normal">km</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex items-center justify-between border border-slate-800">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Monthly Club Distance</span>
            <div className="text-xl font-extrabold text-white mt-1">
              {overview?.monthly_distance_km ?? 0} <span className="text-xs text-slate-400 font-normal">km</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Trophy className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Today's Leaderboard + Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Leaderboard (2 cols) */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">Leaderboard</h3>
                <p className="text-xs text-slate-400">Rankings calculated directly from raw Strava metrics</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
              Live Updates
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs font-semibold text-slate-400 border-b border-slate-800 uppercase tracking-wider">
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Rider</th>
                  <th className="py-3 px-4 text-right">Distance</th>
                  <th className="py-3 px-4 text-right">Elevation</th>
                  <th className="py-3 px-4 text-right">Moving Time</th>
                  <th className="py-3 px-4 text-right">Avg Speed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {!leaderboard?.entries || leaderboard.entries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Trophy className="w-8 h-8 text-slate-600 mb-1" />
                        <span className="font-semibold text-slate-300">No rides yet.</span>
                        <span className="text-xs text-slate-400">
                          Connect your Strava account to start importing activities.
                        </span>
                        {onConnectStrava && (
                          <button
                            onClick={onConnectStrava}
                            className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-orange-400 hover:text-orange-300 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <Zap className="w-3.5 h-3.5" /> Connect Strava
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  leaderboard.entries.map((entry) => (
                    <tr
                      key={entry.rider_id}
                      onClick={() => onRiderSelect(entry.rider_id)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-bold">
                        <span
                          className={`w-7 h-7 rounded-lg inline-flex items-center justify-center text-xs ${
                            entry.rank === 1
                              ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md shadow-amber-500/30'
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
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {entry.rider_avatar ? (
                            <img
                              src={entry.rider_avatar}
                              alt={entry.rider_name}
                              className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-800"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-orange-400">
                              {entry.rider_name ? entry.rider_name.slice(0, 2).toUpperCase() : <UserIcon className="w-4 h-4" />}
                            </div>
                          )}
                          <span className="font-semibold text-white hover:text-orange-400 transition-colors">
                            {entry.rider_name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-emerald-400">
                        {entry.distance_km} <span className="text-xs text-slate-400 font-normal">km</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-200">
                        {entry.elevation_m} <span className="text-xs text-slate-400 font-normal">m</span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-300 font-medium">
                        {entry.moving_time_formatted}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-amber-400">
                        {entry.average_speed_kmh} <span className="text-xs text-slate-400 font-normal">km/h</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activities Stream (1 col) */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Bike className="w-5 h-5 text-orange-500" /> Recent Club Rides
              </h3>
              <span className="text-xs text-slate-400">Latest</span>
            </div>

            {recentActivities.length === 0 ? (
              <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                <Bike className="w-8 h-8 text-slate-600 mb-1" />
                <span className="font-semibold text-slate-300">No Strava activities imported yet.</span>
                <span className="text-xs text-slate-400">
                  Connect your Strava account to start importing activities.
                </span>
                {onConnectStrava && (
                  <button
                    onClick={onConnectStrava}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-orange-400 hover:text-orange-300 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Zap className="w-3.5 h-3.5" /> Connect Strava
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivities.slice(0, 5).map((act) => (
                  <div
                    key={act.id}
                    onClick={() => onRiderSelect(act.rider_id)}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-orange-500/40 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        {act.rider_avatar ? (
                          <img
                            src={act.rider_avatar}
                            alt={act.rider_name}
                            className="w-6 h-6 rounded-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[9px] font-bold text-orange-400">
                            {act.rider_name ? act.rider_name.slice(0, 2).toUpperCase() : <UserIcon className="w-3 h-3" />}
                          </div>
                        )}
                        <span className="text-xs font-bold text-slate-200 group-hover:text-orange-400 transition-colors">
                          {act.rider_name}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(act.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="text-sm font-semibold text-white mb-2 line-clamp-1">{act.activity_name || act.name}</div>

                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-bold text-emerald-400">{act.distance} km</span>
                      <span>{act.elevation_gain} m elev</span>
                      <span className="font-medium text-amber-400">{act.average_speed} km/h</span>
                      {act.strava_url && (
                        <a
                          href={act.strava_url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-orange-500 hover:text-orange-400 flex items-center gap-0.5"
                        >
                          Strava <ArrowUpRight className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
