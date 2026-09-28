import React from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

interface DistanceChartProps {
  data: Array<{ date: string; distance?: number; elevation?: number }>;
  title?: string;
  metricKey?: 'distance' | 'elevation';
  color?: string;
}

export const DistanceChart: React.FC<DistanceChartProps> = ({
  data,
  title = "Distance Progression (km)",
  metricKey = "distance",
  color = "#FC5200"
}) => {
  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-800">
      <h4 className="text-sm font-bold text-white mb-4">{title}</h4>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${metricKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                <stop offset="95%" stopColor={color} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#090d16',
                borderColor: '#1e293b',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '12px'
              }}
            />
            <Area
              type="monotone"
              dataKey={metricKey}
              stroke={color}
              strokeWidth={3}
              fillOpacity={1}
              fill={`url(#grad-${metricKey})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
