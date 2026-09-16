import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Calendar, Users, ArrowRight, ShieldCheck, Clock } from 'lucide-react';

const TournamentCard = ({ tournament, onRegisterClick }) => {
  const isRegistrationOpen =
    tournament.status === 'upcoming' &&
    new Date() < new Date(tournament.registrationDeadline) &&
    tournament.registeredTeams?.length < tournament.maxTeams;

  const statusColors = {
    upcoming: 'bg-cyan-950/80 text-cyan-400 border-cyan-500/40',
    live: 'bg-rose-950/80 text-rose-400 border-rose-500/40 animate-pulse',
    completed: 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40',
    cancelled: 'bg-slate-800 text-slate-400 border-slate-700',
  };

  return (
    <div className="group relative flex flex-col rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/50 transition-all duration-300 overflow-hidden hover:shadow-xl hover:shadow-cyan-500/10">
      {/* Banner & Badges */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-950">
        <img
          src={tournament.banner}
          alt={tournament.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/60" />

        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border backdrop-blur-md ${
              statusColors[tournament.status] || statusColors.upcoming
            }`}
          >
            {tournament.status === 'live' ? '● LIVE NOW' : tournament.status}
          </span>
        </div>

        {/* Game Tag */}
        <div className="absolute top-3 right-3">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-950/80 text-slate-200 border border-slate-700 backdrop-blur-md">
            {tournament.game}
          </span>
        </div>

        {/* Prize Pool Tag */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950/90 border border-amber-500/40 text-amber-300 text-xs font-bold backdrop-blur-md">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>{tournament.prizePool?.currency || '₹'} {tournament.prizePool?.total?.toLocaleString()}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-1 font-mono">
            {tournament.name}
          </h3>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {tournament.description}
          </p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 my-4 py-3 border-y border-slate-800/80 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{new Date(tournament.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              {tournament.registeredTeams?.length || 0} / {tournament.maxTeams} Teams
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{tournament.format}</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{tournament.entryFee === 0 ? 'Free Entry' : `Fee: ₹${tournament.entryFee}`}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <Link
            to={`/tournaments/${tournament.slug || tournament._id}`}
            className="flex-1 text-center py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors flex items-center justify-center gap-1.5"
          >
            View Details <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          {isRegistrationOpen && onRegisterClick && (
            <button
              onClick={() => onRegisterClick(tournament)}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-xs font-bold text-white transition-all shadow-md shadow-cyan-500/20"
            >
              Register
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TournamentCard;
