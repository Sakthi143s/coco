import React, { useState, useEffect } from 'react';
import { Target, Calendar, Award, CheckCircle2, Zap } from 'lucide-react';
import type { Challenge } from '../types';
import { api } from '../services/api';

interface ChallengesPageProps {
  onRiderSelect: (riderId: string) => void;
}

export const ChallengesPage: React.FC<ChallengesPageProps> = ({ onRiderSelect }) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const fetchChallenges = async () => {
    try {
      const data = await api.getChallenges();
      setChallenges(data);
    } catch (err) {
      console.error('Failed to fetch challenges:', err);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  const handleJoin = async (challengeId: string) => {
    try {
      setJoiningId(challengeId);
      const riders = await api.getRiders();
      if (riders.length > 0) {
        await api.joinChallenge(challengeId, riders[0].id);
        await fetchChallenges();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Info */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/20">
            <Target className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">Apex Velo Club Challenges</h2>
            <p className="text-xs text-slate-400">Push your boundaries, hit group mileage goals, and earn digital badges</p>
          </div>
        </div>

        <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-3.5 py-1.5 rounded-full border border-orange-500/20">
          {challenges.length} Active Challenges
        </span>
      </div>

      {/* Challenge Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {challenges.map((c) => (
          <div key={c.id} className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-lg border border-orange-500/20">
                  {c.challenge_type} Challenge
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Ends {new Date(c.end_date).toLocaleDateString()}
                </span>
              </div>

              <h3 className="text-lg font-bold text-white mb-2">{c.title}</h3>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">{c.description}</p>

              {/* Goal Metric */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 mb-6 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block font-semibold uppercase">Target Threshold</span>
                  <span className="text-xl font-black text-white">
                    {c.target_value} {c.challenge_type === 'distance' ? 'km' : 'm elevation'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Award className="w-5 h-5" />
                </div>
              </div>

              {/* Top Leaderboards in Challenge */}
              <div className="space-y-3 mb-6">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Top Participants ({c.participant_count})
                </span>

                {c.top_participants.map((p) => {
                  const pct = Math.min(100, Math.round((p.progress / c.target_value) * 100));
                  return (
                    <div
                      key={p.rider_id}
                      onClick={() => onRiderSelect(p.rider_id)}
                      className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 cursor-pointer hover:border-orange-500/40 transition-all"
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-2">
                          <img
                            src={p.rider_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                            alt={p.rider_name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <span className="font-bold text-white">{p.rider_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-orange-400">{p.progress} / {c.target_value}</span>
                          {p.completed && (
                            <span className="text-emerald-400 flex items-center gap-0.5 text-[10px] font-bold">
                              <CheckCircle2 className="w-3 h-3" /> Done
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            p.completed ? 'bg-emerald-500' : 'bg-gradient-to-r from-orange-500 to-amber-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => handleJoin(c.id)}
              disabled={joiningId === c.id}
              className="w-full bg-slate-900 hover:bg-orange-500 text-white hover:text-white border border-slate-800 text-xs font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 text-orange-500" />
              {joiningId === c.id ? 'Joining Challenge...' : 'Join Challenge'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
