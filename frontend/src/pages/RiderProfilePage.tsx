import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, 
  Bike, 
  MapPin, 
  Mountain, 
  Clock, 
  Gauge, 
  Award, 
  Zap, 
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import type { RiderAnalytics } from '../types';
import { api } from '../services/api';
import { MetricCard } from '../components/common/MetricCard';
import { Badge } from '../components/common/Badge';
import { DistanceChart } from '../components/analytics/DistanceChart';
import { WeeklyDistanceChart } from '../components/analytics/WeeklyDistanceChart';
import { FrequencyChart } from '../components/analytics/FrequencyChart';

interface RiderProfilePageProps {
  riderId: string;
  onBack: () => void;
}

export const RiderProfilePage: React.FC<RiderProfilePageProps> = ({ riderId, onBack }) => {
  const [analytics, setAnalytics] = useState<RiderAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await api.getRiderAnalytics(riderId);
      setAnalytics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [riderId]);

  const handleSyncStrava = async () => {
    try {
      setSyncing(true);
      await api.syncRiderActivities(riderId);
      await fetchAnalytics();
    } catch (err) {
      console.error('Failed to sync Strava activities', err);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-3 text-orange-500 font-semibold">
          <RefreshCw className="w-6 h-6 animate-spin" /> Loading Rider Profile...
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-8 text-center glass-card rounded-2xl border border-slate-800">
        <p className="text-slate-400">Rider analytics profile could not be loaded.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-xl">
          Back to Roster
        </button>
      </div>
    );
  }

  const { rider } = analytics;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Back Button & Top Profile Banner */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <button
            onClick={onBack}
            className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {(rider.avatar_url || rider.profile_image) ? (
            <img
              src={rider.avatar_url || rider.profile_image}
              alt={rider.name || rider.full_name}
              className="w-16 h-16 rounded-2xl object-cover ring-4 ring-orange-500/20"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg font-bold text-orange-400">
              {(rider.name || rider.full_name || 'R').slice(0, 2).toUpperCase()}
            </div>
          )}

          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-white">{rider.full_name}</h2>
              <Badge type={rider.strava_connection_status === 'connected' ? 'connected' : 'disconnected'} />
              <Badge type={rider.status === 'active' ? 'active' : 'inactive'} />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Member since {new Date(rider.joined_date).toLocaleDateString()} • Strava ID: #{rider.strava_athlete_id || 'N/A'}
            </p>
          </div>
        </div>

        <button
          onClick={handleSyncStrava}
          disabled={syncing}
          className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-bold px-5 py-3 rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing with Strava...' : 'Sync Strava Activities'}
        </button>
      </div>

      {/* Overview Rider Stat Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Total Rides"
          value={analytics.total_rides}
          unit="Rides"
          subtitle="All-time recorded"
          icon={Bike}
          color="orange"
        />
        <MetricCard
          title="Total Distance"
          value={analytics.total_distance_km}
          unit="km"
          subtitle="Cumulative distance"
          icon={MapPin}
          color="emerald"
        />
        <MetricCard
          title="Total Elevation"
          value={analytics.total_elevation_m}
          unit="m"
          subtitle="Climbing gain"
          icon={Mountain}
          color="purple"
        />
        <MetricCard
          title="Total Time"
          value={analytics.total_moving_time_formatted}
          subtitle="In the saddle"
          icon={Clock}
          color="cyan"
        />
      </div>

      {/* Performance Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Speed</span>
            <div className="text-2xl font-black text-amber-400 mt-1">
              {analytics.average_speed_kmh} <span className="text-xs text-slate-400 font-normal">km/h</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Gauge className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Longest Single Ride</span>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              {analytics.longest_ride_km} <span className="text-xs text-slate-400 font-normal">km</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Distance per Ride</span>
            <div className="text-2xl font-black text-cyan-400 mt-1">
              {analytics.avg_distance_per_ride_km} <span className="text-xs text-slate-400 font-normal">km</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Zap className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DistanceChart
          data={analytics.distance_over_time}
          title="Distance Over Time (km)"
          metricKey="distance"
          color="#FC5200"
        />
        <DistanceChart
          data={analytics.elevation_trend}
          title="Elevation Climbing Trend (m)"
          metricKey="elevation"
          color="#a855f7"
        />
        <WeeklyDistanceChart
          data={analytics.weekly_distance}
          title="Weekly Distance Output (km)"
          dataKey="week"
          color="#10b981"
        />
        <FrequencyChart data={analytics.ride_frequency} />
      </div>

      {/* Rider Activity History Table */}
      <div className="glass-card rounded-2xl border border-slate-800 p-6">
        <h3 className="text-lg font-bold text-white mb-4">Activity History Log</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs font-semibold text-slate-400 border-b border-slate-800 uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Activity</th>
                <th className="py-3 px-4 text-right">Distance</th>
                <th className="py-3 px-4 text-right">Elevation</th>
                <th className="py-3 px-4 text-right">Moving Time</th>
                <th className="py-3 px-4 text-right">Avg Speed</th>
                <th className="py-3 px-4 text-right">Strava</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {analytics.recent_activities.map((act) => (
                <tr key={act.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="py-3.5 px-4 text-xs text-slate-400">
                    {new Date(act.start_date).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-white">{act.activity_name}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-emerald-400">{act.distance} km</td>
                  <td className="py-3.5 px-4 text-right text-slate-300">{act.elevation_gain} m</td>
                  <td className="py-3.5 px-4 text-right text-slate-400">
                    {Math.floor(act.moving_time / 3600)}h {Math.floor((act.moving_time % 3600) / 60)}m
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-amber-400">{act.average_speed} km/h</td>
                  <td className="py-3.5 px-4 text-right">
                    {act.strava_url && (
                      <a
                        href={act.strava_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-orange-500 hover:text-orange-400 font-semibold"
                      >
                        View <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
