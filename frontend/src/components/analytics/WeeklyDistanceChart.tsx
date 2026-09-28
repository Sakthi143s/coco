import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

interface WeeklyDistanceChartProps {
  data: Array<{ week?: string; month?: string; distance: number }>;
  title?: string;
  dataKey?: string;
  color?: string;
}

export const WeeklyDistanceChart: React.FC<WeeklyDistanceChartProps> = ({
  data,
  title = "Weekly Distance (km)",
  dataKey = "week",
  color = "#10b981"
}) => {
  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-800">
      <h4 className="text-sm font-bold text-white mb-4">{title}</h4>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey={dataKey} stroke="#64748b" fontSize={11} tickLine={false} />
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
            <Bar dataKey="distance" fill={color} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
