import React from 'react';
import { Trophy, Swords, CheckCircle2 } from 'lucide-react';

const TournamentBracket = ({ matches = [], onMatchClick }) => {
  if (!matches || matches.length === 0) {
    return (
      <div className="text-center py-12 px-4 rounded-2xl bg-slate-900/40 border border-slate-800">
        <Swords className="w-10 h-10 text-slate-500 mx-auto mb-3" />
        <p className="text-slate-300 font-semibold font-mono">Brackets have not been generated yet.</p>
        <p className="text-xs text-slate-500 mt-1">
          Once registration closes, the elimination brackets will appear here.
        </p>
      </div>
    );
  }

  // Group matches by round
  const rounds = {};
  matches.forEach((match) => {
    const rName = match.round || 'Round 1';
    if (!rounds[rName]) rounds[rName] = [];
    rounds[rName].push(match);
  });

  const roundNames = Object.keys(rounds);

  return (
    <div className="w-full space-y-2">
      <div className="md:hidden flex items-center justify-center gap-1.5 text-[11px] text-cyan-400/80 font-mono py-1 px-2 rounded-lg bg-slate-900/60 border border-slate-800">
        <span>← Swipe horizontally to explore brackets →</span>
      </div>
      <div className="w-full overflow-x-auto pb-4 touch-pan-x">
        <div className="flex gap-4 sm:gap-8 min-w-[650px] sm:min-w-[700px] items-stretch justify-start p-2">
        {roundNames.map((roundName, rIdx) => (
          <div key={roundName} className="flex-1 flex flex-col space-y-4">
            {/* Round Title Header */}
            <div className="text-center py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
              <span className="text-xs font-black uppercase tracking-wider text-cyan-400 font-mono flex items-center justify-center gap-1.5">
                {roundName.toLowerCase().includes('final') && <Trophy className="w-3.5 h-3.5 text-amber-400" />}
                {roundName}
              </span>
            </div>

            {/* Matches in Round */}
            <div className="flex-1 flex flex-col justify-around gap-6">
              {rounds[roundName].map((match) => {
                const isTeamAWinner = match.winner && match.teamA && match.winner._id === match.teamA._id;
                const isTeamBWinner = match.winner && match.teamB && match.winner._id === match.teamB._id;

                return (
                  <div
                    key={match._id}
                    onClick={() => onMatchClick && onMatchClick(match)}
                    className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                      match.status === 'live'
                        ? 'bg-rose-950/40 border-rose-500/50 shadow-lg shadow-rose-900/10'
                        : match.status === 'completed'
                        ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                        : 'bg-slate-900/50 border-slate-800/80 hover:border-cyan-500/40'
                    }`}
                  >
                    {/* Match Status indicator */}
                    <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 mb-2">
                      <span className="font-mono">MATCH #{match.matchNumber}</span>
                      {match.status === 'live' && (
                        <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 uppercase tracking-wider animate-pulse">
                          ● LIVE
                        </span>
                      )}
                      {match.status === 'completed' && (
                        <span className="text-emerald-400 flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Finished
                        </span>
                      )}
                    </div>

                    {/* Team A */}
                    <div
                      className={`flex items-center justify-between p-2 rounded-lg ${
                        isTeamAWinner ? 'bg-cyan-950/60 border border-cyan-500/40 font-bold' : 'bg-slate-950/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <img
                          src={match.teamA?.teamLogo || match.teamA?.logo || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=100&q=80'}
                          alt={match.teamA?.teamName || match.teamA?.name || 'TBD'}
                          className="w-5 h-5 rounded-md object-cover"
                        />
                        <span className={`text-xs truncate ${isTeamAWinner ? 'text-cyan-300' : 'text-slate-200'}`}>
                          {match.teamA?.teamName || match.teamA?.name || 'TBD'}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold px-1 text-slate-300">
                        {match.scoreA ?? 0}
                      </span>
                    </div>

                    {/* VS Separator */}
                    <div className="text-center my-1 text-[10px] font-mono text-slate-500">VS</div>

                    {/* Team B */}
                    <div
                      className={`flex items-center justify-between p-2 rounded-lg ${
                        isTeamBWinner ? 'bg-cyan-950/60 border border-cyan-500/40 font-bold' : 'bg-slate-950/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <img
                          src={match.teamB?.teamLogo || match.teamB?.logo || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=100&q=80'}
                          alt={match.teamB?.teamName || match.teamB?.name || 'TBD'}
                          className="w-5 h-5 rounded-md object-cover"
                        />
                        <span className={`text-xs truncate ${isTeamBWinner ? 'text-cyan-300' : 'text-slate-200'}`}>
                          {match.teamB?.teamName || match.teamB?.name || 'TBD'}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold px-1 text-slate-300">
                        {match.scoreB ?? 0}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);
};

export default TournamentBracket;
