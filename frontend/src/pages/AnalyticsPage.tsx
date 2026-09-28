import React from 'react';
import { BarChart3, Zap, Mountain, MapPin } from 'lucide-react';
import { DistanceChart } from '../components/analytics/DistanceChart';
import type { Activity } from '../types';

interface AnalyticsPageProps {
  activities: Activity[];
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ activities }) => {
  // Aggregate daily data for club cumulative distance
  const dailyMap: { [key: string]: { distance: number; elevation: number } } = {};
  activities.forEach((act) => {
    const d = act.start_date.split('T')[0];
    if (!dailyMap[d]) dailyMap[d] = { distance: 0, elevation: 0 };
    dailyMap[d].distance += act.distance;
    dailyMap[d].elevation += act.elevation_gain;
  });

  const timeSeriesData = Object.keys(dailyMap)
    .sort()
    .slice(-20)
    .map((date) => ({
      date,
      distance: Math.round(dailyMap[date].distance),
      elevation: Math.round(dailyMap[date].elevation)
    }));

  const totalClubDistance = Math.round(activities.reduce((acc, a) => acc + a.distance, 0));
  const totalClubElevation = Math.round(activities.reduce((acc, a) => acc + a.elevation_gain, 0));
  const totalMovingHours = Math.round(activities.reduce((acc, a) => acc + a.moving_time, 0) / 3600);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Overview Card */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
            <BarChart3 className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">Club Macro Analytics</h2>
            <p className="text-xs text-slate-400">Aggregated performance trends, mileage progression & elevation gains</p>
          </div>
        </div>

        <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-3.5 py-1.5 rounded-full border border-cyan-500/20">
          Last 30 Days Trend
        </span>
      </div>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Club Distance</span>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              {totalClubDistance.toLocaleString()} <span className="text-xs text-slate-400 font-normal">km</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <MapPin className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Elevation Gain</span>
            <div className="text-2xl font-black text-purple-400 mt-1">
              {totalClubElevation.toLocaleString()} <span className="text-xs text-slate-400 font-normal">m</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Mountain className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Saddle Time</span>
            <div className="text-2xl font-black text-amber-400 mt-1">
              {totalMovingHours} <span className="text-xs text-slate-400 font-normal">hours</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Zap className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DistanceChart
          data={timeSeriesData}
          title="Daily Club Distance Progression (km)"
          metricKey="distance"
          color="#06b6d4"
        />
        <DistanceChart
          data={timeSeriesData}
          title="Daily Club Climbing Trend (m)"
          metricKey="elevation"
          color="#a855f7"
        />
      </div>
    </div>
  );
};
