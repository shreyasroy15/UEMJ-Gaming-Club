import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Users, Trophy, Award, ArrowRight } from 'lucide-react';

const TeamCard = ({ team }) => {
  return (
    <div className="group relative flex flex-col rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/50 transition-all duration-300 overflow-hidden hover:shadow-xl hover:shadow-indigo-500/10">
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        {/* Header: Logo, Name, Tag */}
        <div className="flex items-start gap-3.5">
          <img
            src={team.logo || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=150&q=80'}
            alt={team.name}
            className="w-14 h-14 rounded-xl object-cover border border-slate-700 group-hover:border-indigo-400 transition-colors shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors truncate font-mono">
                {team.name}
              </h3>
              {team.tag && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                  {team.tag}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>{team.game}</span>
            </p>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              Captain: <span className="text-slate-300 font-semibold">{team.captain?.name || team.captain?.username || 'Active'}</span>
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-xl bg-slate-950/60 border border-slate-800/60 text-center">
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400">Wins</span>
            <span className="text-sm font-bold text-emerald-400 font-mono">{team.wins || 0}</span>
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400">Losses</span>
            <span className="text-sm font-bold text-rose-400 font-mono">{team.losses || 0}</span>
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400">Points</span>
            <span className="text-sm font-bold text-amber-400 font-mono">{team.points || 0}</span>
          </div>
        </div>

        {/* Members and Action */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>{team.members?.length || 1} Roster</span>
          </div>

          <Link
            to={`/teams/${team._id}`}
            className="flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            View Team <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TeamCard;
