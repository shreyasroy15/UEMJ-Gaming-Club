import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, ArrowRight, Users } from 'lucide-react';

const GameCard = ({ game, tournamentCount = 0 }) => {
  return (
    <div className="group relative rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/50 transition-all duration-300 overflow-hidden hover:shadow-xl hover:shadow-cyan-500/10 flex flex-col justify-between">
      {/* Background Image & Overlay */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-950">
        <img
          src={game.banner || game.logo}
          alt={game.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-75 group-hover:opacity-95"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

        {/* Platform tag */}
        <div className="absolute top-3 right-3">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-950/80 text-cyan-400 border border-cyan-500/30 backdrop-blur-md">
            {game.platform}
          </span>
        </div>
      </div>

      {/* Info Content */}
      <div className="p-5 flex-1 flex flex-col justify-between -mt-6 relative z-10">
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {game.genre}
          </span>
          <h3 className="text-xl font-black text-white group-hover:text-cyan-400 transition-colors font-mono mt-0.5">
            {game.name}
          </h3>
          <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
            {game.description}
          </p>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>{tournamentCount || game.tournamentCount || 0} Tournaments</span>
          </div>

          <Link
            to={`/tournaments?game=${encodeURIComponent(game.name)}`}
            className="flex items-center gap-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            View Tournaments <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default GameCard;
