import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  color?: 'orange' | 'cyan' | 'emerald' | 'purple' | 'amber';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  subtitle,
  icon: Icon,
  trend,
  color = 'orange'
}) => {
  const colorMap = {
    orange: 'from-orange-500/20 to-amber-500/5 text-orange-500 border-orange-500/20',
    cyan: 'from-cyan-500/20 to-blue-500/5 text-cyan-400 border-cyan-500/20',
    emerald: 'from-emerald-500/20 to-teal-500/5 text-emerald-400 border-emerald-500/20',
    purple: 'from-purple-500/20 to-indigo-500/5 text-purple-400 border-purple-500/20',
    amber: 'from-amber-500/20 to-yellow-500/5 text-amber-400 border-amber-500/20'
  };

  return (
    <div className="glass-card glass-card-hover p-5 rounded-2xl relative overflow-hidden group">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
        <div className={`p-2.5 rounded-xl bg-gradient-to-br border ${colorMap[color]} group-hover:scale-110 transition-transform`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="flex items-baseline gap-1.5 mb-1">
        <span className="text-2xl font-extrabold text-white tracking-tight">{value}</span>
        {unit && <span className="text-xs font-semibold text-slate-400">{unit}</span>}
      </div>

      <div className="flex items-center justify-between text-xs">
        {subtitle && <span className="text-slate-500 font-medium">{subtitle}</span>}
        {trend && (
          <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            {trend}
          </span>
        )}
      </div>
    </div>
  );
};
