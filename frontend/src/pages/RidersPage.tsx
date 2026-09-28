import React, { useState } from 'react';
import { 
  Search, 
  Eye, 
  UserX, 
  Trash2, 
  Zap,
  Users as UsersIcon,
  User as UserIcon
} from 'lucide-react';
import type { Rider } from '../types';
import { Badge } from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';

interface RidersPageProps {
  riders: Rider[];
  onSelectRider: (riderId: string) => void;
  onToggleStatus: (riderId: string, currentStatus: 'active' | 'inactive') => void;
  onRemoveRider: (riderId: string) => void;
  onConnectStrava: () => void;
}

export const RidersPage: React.FC<RidersPageProps> = ({
  riders,
  onSelectRider,
  onToggleStatus,
  onRemoveRider,
  onConnectStrava,
}) => {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const filteredRiders = riders.filter((rider) => {
    const name = rider.name || rider.full_name || '';
    const email = rider.email || '';
    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rider.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || rider.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const isOwner = currentUser?.role === 'OWNER';

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Actions & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-5 rounded-2xl border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search by name, email or rider ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/60 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            {(['all', 'active', 'inactive'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                  statusFilter === st
                    ? 'bg-slate-800 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <button
            onClick={onConnectStrava}
            className="bg-[#FC5200] hover:bg-[#e04800] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2"
          >
            <Zap className="w-4 h-4" /> Connect Strava
          </button>
        </div>
      </div>

      {/* Riders Data Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <h3 className="font-bold text-lg text-white">Club Rider Directory ({filteredRiders.length})</h3>
          <span className="text-xs text-slate-400">Synced club roster</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs font-semibold text-slate-400 bg-slate-950/60 border-b border-slate-800 uppercase tracking-wider">
                <th className="py-3.5 px-4">Rider</th>
                <th className="py-3.5 px-4">Internal ID</th>
                <th className="py-3.5 px-4">Strava Athlete ID</th>
                <th className="py-3.5 px-4">Connection</th>
                <th className="py-3.5 px-4">Joined Date</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {filteredRiders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <UsersIcon className="w-8 h-8 text-slate-600 mb-1" />
                      <span className="font-semibold text-slate-300">No riders connected.</span>
                      <span className="text-xs text-slate-400">
                        Connect your Strava account to start importing activities.
                      </span>
                      <button
                        onClick={onConnectStrava}
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-orange-400 hover:text-orange-300 bg-orange-500/10 border border-orange-500/20 px-3.5 py-2 rounded-xl transition-colors"
                      >
                        <Zap className="w-3.5 h-3.5" /> Connect Strava
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRiders.map((rider) => {
                  const avatar = rider.avatar_url || rider.profile_image;
                  const name = rider.name || rider.full_name || 'Rider';
                  return (
                    <tr key={rider.id} className="hover:bg-slate-900/50 transition-colors group">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {avatar ? (
                            <img
                              src={avatar}
                              alt={name}
                              className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-800"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-orange-400">
                              {name ? name.slice(0, 2).toUpperCase() : <UserIcon className="w-4 h-4" />}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-white group-hover:text-orange-400 transition-colors">
                              {name}
                            </div>
                            <div className="text-xs text-slate-400">{rider.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono text-xs text-slate-400">{rider.id.slice(0, 8)}...</td>
                      <td className="py-4 px-4 font-mono text-xs text-slate-300">
                        {rider.strava_athlete_id ? (
                          <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded text-orange-400 font-semibold">
                            #{rider.strava_athlete_id}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">Not Linked</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <Badge type={rider.strava_connection_status === 'connected' ? 'connected' : 'disconnected'} />
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-400">
                        {new Date(rider.joined_date).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4">
                        <Badge type={rider.role === 'OWNER' || rider.role === 'admin' ? 'admin' : 'member'} />
                      </td>
                      <td className="py-4 px-4">
                        <Badge type={rider.status === 'active' ? 'active' : 'inactive'} />
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onSelectRider(rider.id)}
                            title="View Detailed Analytics"
                            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-orange-400 hover:border-orange-500/40 transition-all"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {isOwner && (
                            <>
                              <button
                                onClick={() => onToggleStatus(rider.id, rider.status)}
                                title={rider.status === 'active' ? 'Disable Rider' : 'Enable Rider'}
                                className={`p-2 rounded-lg border transition-all ${
                                  rider.status === 'active'
                                    ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-amber-500/10'
                                    : 'bg-slate-900 border-slate-800 text-emerald-400 hover:bg-emerald-500/10'
                                }`}
                              >
                                <UserX className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => onRemoveRider(rider.id)}
                                title="Remove Rider from Club (Owner only)"
                                className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
