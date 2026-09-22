import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../services/api';
import skullAnimation from '../../assets/skull laughed.svg';
import {
  Gamepad2,
  MapPin,
  Mail,
  Check,
  Vote,
  Sparkles,
  Loader2,
} from 'lucide-react';

const getPollVoterId = () => {
  if (typeof window === 'undefined') return 'voter_ssr';
  let id = localStorage.getItem('uemj_gaming_poll_voter_id');
  if (!id) {
    id = 'voter_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
    localStorage.setItem('uemj_gaming_poll_voter_id', id);
  }
  return id;
};

const GAME_METADATA = {
  BGMI: {
    tag: 'Battle Royale',
    barColor: 'from-amber-500 to-orange-500',
    accentBorder: 'hover:border-amber-400/40',
    activeBg: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
    glow: 'shadow-[0_0_12px_rgba(245,158,11,0.15)]',
  },
  Valorant: {
    tag: 'Tactical 5v5',
    barColor: 'from-rose-500 to-red-500',
    accentBorder: 'hover:border-rose-400/40',
    activeBg: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
    glow: 'shadow-[0_0_12px_rgba(244,63,94,0.15)]',
  },
  'Free Fire Max': {
    tag: 'Survival Royale',
    barColor: 'from-purple-500 to-indigo-500',
    accentBorder: 'hover:border-purple-400/40',
    activeBg: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
    glow: 'shadow-[0_0_12px_rgba(168,85,247,0.15)]',
  },
};

const Footer = ({ isCompact = false }) => {
  const currentYear = new Date().getFullYear();

  // Poll state
  const [pollData, setPollData] = useState({
    title: 'WHAT SHOULD WE PLAY NEXT?',
    totalVotes: 0,
    userVotedGame: null,
    options: [
      { game: 'BGMI', count: 0, percentage: 0 },
      { game: 'Valorant', count: 0, percentage: 0 },
      { game: 'Free Fire Max', count: 0, percentage: 0 },
    ],
  });
  const [votingFor, setVotingFor] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const fetchPollResults = async () => {
    try {
      const voterId = getPollVoterId();
      const res = await API.get(`/polls?voterId=${voterId}`);
      if (res.data?.success && res.data?.data) {
        setPollData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load poll results:', err);
    }
  };

  useEffect(() => {
    fetchPollResults();
  }, []);

  const handleVote = async (game) => {
    if (votingFor) return;
    try {
      setVotingFor(game);
      const voterId = getPollVoterId();
      const res = await API.post('/polls/vote', { game, voterId });
      if (res.data?.success && res.data?.data) {
        setPollData((prev) => ({
          ...prev,
          totalVotes: res.data.data.totalVotes,
          userVotedGame: res.data.data.userVotedGame,
          options: res.data.data.options,
        }));
        setFeedback(`Vote locked for ${game}!`);
        setTimeout(() => setFeedback(null), 3500);
      }
    } catch (err) {
      console.error('Failed to submit poll vote:', err);
      setFeedback('Error recording vote. Please try again.');
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setVotingFor(null);
    }
  };

  return (
    <footer className="relative z-20 overflow-hidden bg-[#030610]/20 backdrop-blur-sm border-t border-cyan-500/40 text-slate-200 shadow-[0_-15px_50px_rgba(0,0,0,0.4)] mt-auto">
      {/* Ambient background glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-96 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-24 bg-gradient-to-t from-cyan-950/20 to-transparent pointer-events-none" />

      {/* Animated Skull Cyber Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center z-0 select-none">
        <div className="relative w-full max-w-3xl h-full flex items-center justify-center">
          <img
            src={skullAnimation}
            alt="Cyber Skull Laughed Animation"
            className="w-full max-h-[380px] object-contain opacity-60 sm:opacity-75 mix-blend-screen scale-110 sm:scale-125 filter drop-shadow-[0_0_50px_rgba(6,182,212,0.6)] transition-all duration-700"
            loading="eager"
          />
        </div>

        {/* Soft Vignette Depth Mask so foreground text and poll remain crisp */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#020306]/30 via-transparent to-[#040714]/20 pointer-events-none" />
      </div>

      {/* Cyber Grid Accent Line on Top Border */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 relative z-10 space-y-8">
        {/* ========================================================================= */}
        {/* DIRECTORY SECTION */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Col 1: Official Brand Identity & Club HQ */}
          <div className="space-y-4">
            <Link to="/" className="inline-flex flex-col group">
              <span className="font-black text-sm tracking-wider text-white font-mono uppercase group-hover:text-cyan-300 transition-colors">
                UEMJ GAMING CLUB
              </span>
              <span className="text-[10px] font-mono text-cyan-400/90 tracking-widest uppercase">
                GAMING GEEKS • UEM JAIPUR
              </span>
            </Link>

            <p className="text-xs text-slate-400 leading-relaxed">
              The official esports organization of University of Engineering & Management, Jaipur. Organizing state-tier tournaments, scouting competitive squads, and celebrating digital gaming culture.
            </p>

            <div className="space-y-2 pt-1 text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                <p className="text-slate-300">UEM Jaipur, Sikar Road, Rajasthan</p>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
                <a
                  href="mailto:gaminggeeks@uem.edu.in"
                  className="hover:text-cyan-300 transition-colors text-slate-300 truncate"
                >
                  gaminggeeks@uem.edu.in
                </a>
              </div>
            </div>
          </div>

          {/* Col 2: Esports Arenas & Community Poll */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h4 className="text-xs font-bold text-white tracking-widest uppercase font-mono flex items-center gap-2">
                <Gamepad2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>WHAT SHOULD WE PLAY NEXT?</span>
              </h4>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
                <span className="text-[10px] font-mono font-semibold text-cyan-300 bg-cyan-950/70 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                  {pollData.totalVotes} {pollData.totalVotes === 1 ? 'VOTE' : 'VOTES'}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 font-mono flex items-center justify-between">
              <span>Cast your vote for the next campus tournament:</span>
              {feedback && (
                <span className="text-cyan-300 font-bold text-[10px] animate-pulse">
                  {feedback}
                </span>
              )}
            </p>

            {/* Poll Interactive Game Cards */}
            <div className="space-y-2 pt-1 font-mono">
              {['BGMI', 'Valorant', 'Free Fire Max'].map((gameName) => {
                const option = pollData.options?.find((o) => o.game === gameName) || {
                  game: gameName,
                  count: 0,
                  percentage: 0,
                };
                const isSelected = pollData.userVotedGame === gameName;
                const isLoadingThis = votingFor === gameName;
                const meta = GAME_METADATA[gameName] || GAME_METADATA.BGMI;

                return (
                  <button
                    key={gameName}
                    type="button"
                    onClick={() => handleVote(gameName)}
                    disabled={votingFor !== null}
                    className={`w-full text-left relative overflow-hidden rounded-xl border p-3 transition-all duration-300 group cursor-pointer backdrop-blur-md ${
                      isSelected
                        ? `border-cyan-400/60 bg-cyan-950/20 ${meta.glow} shadow-lg shadow-cyan-500/10`
                        : 'border-white/8 bg-white/[0.04] hover:border-cyan-500/40 hover:bg-white/[0.08] hover:shadow-md hover:shadow-cyan-500/5'
                    }`}
                  >
                    {/* Background Progress Bar Fill */}
                    <div
                      className={`absolute left-0 top-0 bottom-0 bg-gradient-to-r ${meta.barColor} opacity-10 transition-all duration-700 pointer-events-none`}
                      style={{ width: `${option.percentage}%` }}
                    />

                    <div className="relative z-10 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold transition-colors ${
                            isSelected
                              ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                              : 'text-white group-hover:text-cyan-300'
                          }`}
                        >
                          {gameName}
                        </span>
                        <span className="text-[9px] text-slate-400 bg-black/40 px-1.5 py-0.5 rounded border border-white/5 hidden min-[360px]:inline">
                          {meta.tag}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-300">
                          {option.percentage}%
                        </span>
                        <span className="text-[10px] text-slate-500">
                          ({option.count})
                        </span>

                        <span
                          className={`ml-1 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border transition-all ${
                            isSelected
                              ? 'bg-cyan-500 text-black border-cyan-400 shadow-sm font-black'
                              : 'bg-white/5 text-slate-400 border-white/10 group-hover:border-cyan-500/40 group-hover:text-cyan-300'
                          }`}
                        >
                          {isLoadingThis ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : isSelected ? (
                            <>
                              <Check className="w-3 h-3 stroke-[3]" />
                              VOTED
                            </>
                          ) : (
                            'VOTE'
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Thin dynamic progress track underneath */}
                    <div className="relative z-10 w-full h-1 bg-white/10 rounded-full overflow-hidden mt-2.5">
                      <div
                        className={`h-full bg-gradient-to-r ${meta.barColor} transition-all duration-700 rounded-full`}
                        style={{ width: `${option.percentage}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1">
              <span>Click any game to register or switch your vote</span>
              {pollData.userVotedGame && (
                <span className="text-cyan-400/90 font-semibold">
                  You voted for: {pollData.userVotedGame}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BOTTOM COPYRIGHT & DEV CREDITS */}
        {/* ========================================================================= */}
        <div className="border-t border-white/10 pt-6 mt-6 flex items-center justify-center text-xs text-slate-500 font-mono text-center">
          <p>
            © {currentYear} <span className="text-slate-300 font-bold">UEM Jaipur Gaming Geeks Club</span>. Designed & Maintained by{' '}
            <a
              href="https://github.com/sanglap1221"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-300 font-bold hover:text-cyan-300 transition-colors underline decoration-cyan-500/40 hover:decoration-cyan-400"
            >
              Sanglap Ghosh
            </a>{' '}
            &{' '}
            <a
              href="https://github.com/shreyasroy15"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-300 font-bold hover:text-cyan-300 transition-colors underline decoration-cyan-500/40 hover:decoration-cyan-400"
            >
              Shreyas Roy
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
