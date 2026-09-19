import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading/Loading';
import {
  Trophy,
  Gamepad2,
  Swords,
  Award,
  Zap,
  Shield,
  Calendar,
  ArrowRight,
  Radio,
  Sparkles,
  Users,
  BarChart3,
  Clock,
  Flame,
  ChevronRight,
  Crown
} from 'lucide-react';

// Fallback local assets
import bgmiFallbackBanner from '../assets/game-warrior-gh-pages/img/slider-2.jpg';

const Home = () => {
  const { user, isAuthenticated } = useAuth();
  const [runningTournaments, setRunningTournaments] = useState([]);
  const [allTournaments, setAllTournaments] = useState([]);
  const [myTournaments, setMyTournaments] = useState([]);
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Leaderboard active game tab
  const [leaderboardGame, setLeaderboardGame] = useState('BGMI');

  useEffect(() => {
    fetchHomeData();
  }, [user]);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      const [tournamentsRes, teamsRes, matchesRes] = await Promise.all([
        API.get('/tournaments').catch(() => ({ data: { tournaments: [] } })),
        API.get('/teams').catch(() => ({ data: { teams: [] } })),
        API.get('/matches').catch(() => ({ data: { matches: [] } })),
      ]);

      const tournamentsList = tournamentsRes.data?.tournaments || [];
      const teamsList = teamsRes.data?.teams || [];
      const matchesList = matchesRes.data?.matches || [];

      setAllTournaments(tournamentsList);
      setTeams(teamsList);
      setMatches(matchesList);

      // Filter active / live / ongoing tournaments
      const running = tournamentsList.filter(
        (t) => t.status === 'live' || t.status === 'ongoing'
      );
      setRunningTournaments(running);

      if (isAuthenticated && user) {
        // Find tournaments where user's squad is registered
        const userSquads = teamsList.filter(
          (tm) =>
            (tm.captain?._id || tm.captain) === user._id ||
            tm.members?.some((m) => (m.user?._id || m.user) === user._id)
        );
        const userSquadIds = userSquads.map((s) => s._id?.toString());

        const registeredIn = tournamentsList.filter((t) =>
          t.registeredTeams?.some(
            (r) => r.team && userSquadIds.includes((r.team._id || r.team).toString())
          )
        );
        setMyTournaments(registeredIn);
      }
    } catch (err) {
      console.error('Failed to load home page data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Top leaderboard teams filtered by active tab
  const filteredLeaderboardTeams = useMemo(() => {
    return teams
      .filter((t) => t.game?.toLowerCase().includes(leaderboardGame.toLowerCase()))
      .sort((a, b) => (b.points || 0) - (a.points || 0))
      .slice(0, 5);
  }, [teams, leaderboardGame]);

  // Live or upcoming matches
  const activeMatches = useMemo(() => {
    return matches.filter((m) => m.status === 'live' || m.status === 'scheduled');
  }, [matches]);

  // Active titles list
  const activeGameTitles = useMemo(() => {
    const titles = Array.from(new Set(allTournaments.map((t) => t.game).filter(Boolean)));
    return titles.length > 0 ? titles.join(' & ') : 'BGMI & Free Fire';
  }, [allTournaments]);

  if (loading) {
    return <Loading message="Loading collegiate arena..." />;
  }

  // Stats calculation for authenticated student
  const xp = user?.clubXP || 150;
  const level = user?.level || 1;
  const nextLevelXp = level * 500;
  const xpPercentage = Math.min(100, Math.round((xp % 500) / 5));
  const stats = user?.stats || {};
  const matchesPlayed = stats.matchesPlayed || myTournaments.length * 2 || 0;
  const wins = stats.wins || (matchesPlayed > 0 ? Math.floor(matchesPlayed * 0.65) : 0);
  const winRate = matchesPlayed > 0 ? Math.round((wins / matchesPlayed) * 100) : 0;

  return (
    <div className="relative min-h-screen text-slate-100 overflow-x-hidden">
      {/* ========================================================= */}
      {/* 1. CINEMATIC LAYERED ESPORTS GAMING BACKGROUND */}
      {/* ========================================================= */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Base dark canvas */}
        <div className="absolute inset-0 bg-[#07090e]" />

        {/* Ambient stadium lighting */}
        <div
          className="absolute inset-0 bg-cover bg-top opacity-30 mix-blend-screen"
          style={{
            backgroundImage: "url('/assets/gaming-hero-bg.png')",
          }}
        />

        {/* Left Side: BGMI Soldier Character - CRYSTAL CLEAR & VIBRANT (shifted down 10px) */}
        <div
          className="absolute top-[42px] -left-10 sm:left-0 w-[340px] sm:w-[420px] lg:w-[480px] xl:w-[540px] h-[520px] bg-no-repeat bg-contain pointer-events-none transition-all duration-700 opacity-30 md:opacity-95"
          style={{
            backgroundImage: "url('/assets/bgmi-feathered.png')",
            filter: 'drop-shadow(0 15px 35px rgba(0,0,0,0.9)) drop-shadow(0 0 35px rgba(245,158,11,0.2))',
          }}
        />

        {/* Right Side: Free Fire Character - CRYSTAL CLEAR & VIBRANT (shifted down 10px) */}
        <div
          className="absolute top-[42px] -right-10 sm:right-0 w-[340px] sm:w-[420px] lg:w-[480px] xl:w-[540px] h-[520px] bg-no-repeat bg-contain bg-right-top pointer-events-none transition-all duration-700 opacity-30 md:opacity-95"
          style={{
            backgroundImage: "url('/assets/ff-feathered.png')",
            filter: 'drop-shadow(0 15px 35px rgba(0,0,0,0.9)) drop-shadow(0 0 35px rgba(6,182,212,0.22))',
          }}
        />

        {/* Center ambient lighting to emphasize depth */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_20%,rgba(6,182,212,0.1),transparent_70%)]" />

        {/* Soft bottom blend to transition smoothly into the rest of the page */}
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#080a10] via-[#080a10]/90 to-transparent" />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 space-y-6 sm:space-y-8 pb-12 pt-2 sm:pt-4">

        {/* CONTAINER FOR HOMEPAGE BODY */}
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
          
          {/* ========================================================= */}
          {/* 3. HERO SECTION (OPEN ESPORTS ARENA DESIGN) */}
          {/* ========================================================= */}
          <section className="relative py-8 sm:py-14 md:py-16 text-center">
            {/* Ambient central backdrop glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-64 bg-cyan-500/10 blur-3xl pointer-events-none rounded-full" />
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-36 bg-indigo-500/10 blur-2xl pointer-events-none rounded-full" />

            <div className="relative z-10 max-w-3xl mx-auto space-y-4 sm:space-y-5">
              {/* College Sub-heading */}
              <div className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-mono font-bold tracking-[0.25em] text-cyan-400 uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                <span>— UNIVERSITY OF ENGINEERING & MANAGEMENT, JAIPUR —</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl min-[480px]:text-4xl sm:text-6xl md:text-7xl font-black font-mono tracking-tight text-white leading-none drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
                UEMJ <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 drop-shadow-[0_0_25px_rgba(6,182,212,0.4)]">GAMING CLUB</span>
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-lg md:text-xl font-mono text-slate-200 font-medium tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                {activeGameTitles} Campus Championships
              </p>

              {/* Core Pillars */}
              <div className="flex items-center justify-center gap-3 sm:gap-6 pt-1 text-[11px] sm:text-xs font-mono font-semibold text-slate-300 uppercase tracking-widest flex-wrap drop-shadow">
                <span className="flex items-center gap-1.5 text-amber-400">
                  <Trophy className="w-3.5 h-3.5" /> COMPETE
                </span>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <Users className="w-3.5 h-3.5" /> CONNECT
                </span>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1.5 text-indigo-400">
                  <Sparkles className="w-3.5 h-3.5" /> BE LEGENDARY
                </span>
              </div>

              {/* Primary Call to Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 pt-2">
                <Link
                  to="/tournaments"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs uppercase tracking-wider font-mono shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.03] active:scale-[0.98] transition-all"
                >
                  <Trophy className="w-4 h-4 text-slate-950" />
                  <span>View Tournaments</span>
                  <ArrowRight className="w-4 h-4 text-slate-950" />
                </Link>

                <Link
                  to="/points-table"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-slate-950/70 hover:bg-slate-900/80 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 font-bold text-xs uppercase tracking-wider font-mono shadow-lg shadow-cyan-500/15 hover:shadow-cyan-500/30 hover:scale-[1.03] active:scale-[0.98] backdrop-blur-md transition-all"
                >
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  <span>Points Table</span>
                </Link>
              </div>

              {/* Authenticated Student Athlete Pill Strip */}
              {isAuthenticated && user && (
                <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-left bg-slate-950/80 backdrop-blur-md p-3.5 rounded-2xl border border-slate-800/60 shadow-xl max-w-xl mx-auto">
                  <div className="flex items-center gap-3">
                    <img
                      src={user?.avatar || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=300&q=80'}
                      alt={user?.name}
                      className="w-10 h-10 rounded-xl object-cover border border-cyan-400/60"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white font-mono">{user?.name}</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500 text-slate-950">
                          LVL {level}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {myTournaments.length} Arenas Registered • {xp} XP
                      </div>
                    </div>
                  </div>

                  <div className="w-full sm:w-48 space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>XP Progress</span>
                      <span className="text-cyan-400">{xpPercentage}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 rounded-full"
                        style={{ width: `${Math.max(10, xpPercentage)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ========================================================= */}
          {/* 4. BASIC STATS OVERVIEW */}
          {/* ========================================================= */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md hover:border-cyan-500/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                  {isAuthenticated ? 'My Tournaments' : 'Total Arenas'}
                </span>
                <Trophy className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="mt-2 text-2xl font-black text-white font-mono">
                {isAuthenticated ? myTournaments.length : allTournaments.length}
              </div>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">Collegiate registrations</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md hover:border-indigo-500/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                  Registered Teams
                </span>
                <Users className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="mt-2 text-2xl font-black text-white font-mono">
                {teams.length}
              </div>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">Campus squads formed</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md hover:border-emerald-500/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                  Live & Ongoing
                </span>
                <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
              </div>
              <div className="mt-2 text-2xl font-black text-rose-400 font-mono">
                {runningTournaments.length}
              </div>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">Active competitions</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md hover:border-amber-500/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                  Varsity Titles
                </span>
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-2 text-2xl font-black text-white font-mono">
                {new Set(allTournaments.map((t) => t.game)).size || 2}
              </div>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">Supported esports</p>
            </div>
          </section>

          {/* ========================================================= */}
          {/* 5. FEATURED TOURNAMENT CARDS (MATCHES REFERENCE STYLE) */}
          {/* ========================================================= */}
          <section className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm sm:text-base font-bold text-white font-mono uppercase tracking-wider">
                  Featured Esports Arenas
                </h2>
              </div>
              <Link
                to="/tournaments"
                className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
              >
                <span>All Tournaments</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {allTournaments.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center space-y-2">
                <Gamepad2 className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-slate-200 font-mono">No Tournaments Available Yet</h3>
                <p className="text-xs text-slate-400">
                  New campus tournament brackets are being scheduled by the committee.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                {allTournaments.slice(0, 4).map((t, idx) => {
                  const isBGMI = t.game?.toLowerCase().includes('bgmi') || idx % 2 === 0;
                  const isFreeFire = t.game?.toLowerCase().includes('free fire');
                  const isLive = t.status === 'live' || t.status === 'ongoing';
                  const isRegistrationOpen = t.status === 'registration-open';

                  const accentBorder = isBGMI
                    ? 'border-amber-500/40 hover:border-amber-400 shadow-amber-500/10'
                    : 'border-cyan-500/40 hover:border-cyan-400 shadow-cyan-500/10';
                  const titleColor = isBGMI ? 'text-amber-400' : 'text-cyan-400';
                  const tagBg = isBGMI
                    ? 'bg-amber-950/80 text-amber-300 border-amber-500/30'
                    : 'bg-cyan-950/80 text-cyan-300 border-cyan-500/30';

                  // Smart artwork fallback to extracted reference cards
                  const cardFallback = isBGMI
                    ? '/assets/bgmi-card-art.png'
                    : isFreeFire
                    ? '/assets/ff-card-art.png'
                    : bgmiFallbackBanner;

                  return (
                    <Link
                      key={t._id}
                      to={`/tournaments/${t.slug || t._id}`}
                      className={`group relative rounded-2xl overflow-hidden bg-slate-900/80 border ${accentBorder} flex flex-col justify-between transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-0.5`}
                    >
                      {/* Banner Area with Reference Overlay Treatment */}
                      <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-slate-950">
                        <img
                          src={t.banner || cardFallback}
                          alt={t.name}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 opacity-85 group-hover:opacity-95"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = cardFallback;
                          }}
                        />

                        {/* Cinematic Gradients */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/40 to-transparent" />

                        {/* Top Badges */}
                        <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider font-mono border ${tagBg}`}>
                            {t.game || 'ESPORTS'}
                          </span>

                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono tracking-wider uppercase bg-slate-950/90 border border-slate-800 text-white backdrop-blur-md">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isLive
                                  ? 'bg-emerald-400 animate-pulse'
                                  : isRegistrationOpen
                                  ? 'bg-cyan-400'
                                  : 'bg-amber-400'
                              }`}
                            />
                            {isLive ? 'LIVE NOW' : isRegistrationOpen ? 'REGISTRATION OPEN' : t.status?.toUpperCase()}
                          </span>
                        </div>

                        {/* Title Info */}
                        <div className="absolute bottom-3.5 left-3.5 right-3.5 space-y-1">
                          <div className={`text-[10px] font-mono font-bold uppercase tracking-widest ${titleColor}`}>
                            {t.game?.toUpperCase()} CHAMPIONSHIP
                          </div>
                          <h3 className="text-base sm:text-lg font-black text-white font-mono truncate group-hover:text-cyan-200 transition-colors">
                            {t.name}
                          </h3>
                        </div>
                      </div>

                      {/* Card Bottom Stats Bar (Matches Reference Image) */}
                      <div className="p-3.5 sm:p-4 bg-slate-950/95 border-t border-slate-800/80 grid grid-cols-4 gap-2 text-center text-[10px] sm:text-xs font-mono">
                        <div className="space-y-0.5">
                          <div className="flex items-center justify-center gap-1 text-slate-400">
                            <Shield className="w-3 h-3 text-cyan-400 shrink-0" />
                            <span className="font-bold text-white text-xs sm:text-sm">
                              {t.registeredTeams?.length || 0}
                            </span>
                          </div>
                          <div className="text-[9px] text-slate-500 uppercase">Teams</div>
                        </div>

                        <div className="space-y-0.5 border-l border-slate-800/80">
                          <div className="flex items-center justify-center gap-1 text-slate-400">
                            <Users className="w-3 h-3 text-indigo-400 shrink-0" />
                            <span className="font-bold text-white text-xs sm:text-sm">{t.maxTeams || 16}</span>
                          </div>
                          <div className="text-[9px] text-slate-500 uppercase">Max Cap</div>
                        </div>

                        <div className="space-y-0.5 border-l border-slate-800/80">
                          <div className="flex items-center justify-center gap-1 text-slate-400">
                            <Calendar className="w-3 h-3 text-amber-400 shrink-0" />
                            <span className="font-bold text-white text-xs sm:text-sm truncate">
                              {new Date(t.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <div className="text-[9px] text-slate-500 uppercase">Date</div>
                        </div>

                        <div className="space-y-0.5 border-l border-slate-800/80 flex flex-col justify-center">
                          <span className={`text-[10px] font-bold uppercase truncate ${titleColor}`}>
                            {t.format || 'Standard'}
                          </span>
                          <span className="text-[9px] text-slate-500">Format</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* ========================================================= */}
          {/* 6. CURRENT MATCHES / LIVE STATUS */}
          {/* ========================================================= */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                </span>
                <span className="text-xs font-bold text-rose-400 font-mono uppercase tracking-wider">
                  LIVE MATCHES
                </span>
                <span className="text-slate-600 hidden sm:inline">•</span>
                <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                  Ongoing Collegiate Rounds
                </span>
              </div>

              <Link
                to="/tournaments"
                className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
              >
                <span>View All Matches</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {activeMatches.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span>No matches currently running.</span>
                </div>
                <span className="text-[11px] text-slate-500">
                  Scores and rounds update automatically as match results post.
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2.5">
                {activeMatches.map((m) => (
                  <div
                    key={m._id}
                    className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-3 text-xs font-mono backdrop-blur-sm"
                  >
                    <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 text-[10px] font-bold">
                      {m.tournament?.game || 'ESPORTS'}
                    </span>
                    <span className="font-semibold text-white">{m.round || 'Round 1'}</span>
                    <span className="text-slate-400 text-[11px]">Match {m.matchNumber || 1}</span>
                    <span
                      className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        m.status === 'live' ? 'text-rose-400 bg-rose-950/60' : 'text-amber-400 bg-amber-950/60'
                      }`}
                    >
                      {m.status === 'live' ? '● LIVE' : '● SCHEDULED'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ========================================================= */}
          {/* 7. LEADERBOARD PREVIEW (TOP SQUADS FROM BACKEND) */}
          {/* ========================================================= */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-white font-mono font-bold text-sm sm:text-base uppercase tracking-wide">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  <span>Leaderboard Preview</span>
                </div>
                <p className="text-xs text-slate-400 font-mono">
                  Top Performing Campus Teams
                </p>
              </div>

              {/* Game Selector & Full Table Link */}
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <div className="p-1 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-1 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => setLeaderboardGame('BGMI')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      leaderboardGame === 'BGMI'
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    BGMI
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeaderboardGame('Free Fire')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      leaderboardGame === 'Free Fire'
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Free Fire
                  </button>
                </div>

                <Link
                  to="/points-table"
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 transition-all"
                >
                  <span>View Full Table</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Standings Grid */}
            <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4 sm:p-5 backdrop-blur-md">
              {filteredLeaderboardTeams.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 font-mono">
                  No {leaderboardGame} team standings recorded yet. Points update as varsity matches conclude.
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredLeaderboardTeams.map((team, idx) => {
                    const rank = idx + 1;
                    const badgeStyle =
                      rank === 1
                        ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                        : rank === 2
                        ? 'text-slate-300 bg-slate-400/10 border-slate-400/30'
                        : rank === 3
                        ? 'text-amber-600 bg-amber-600/10 border-amber-600/30'
                        : 'text-slate-400 bg-slate-800/40 border-slate-800';

                    return (
                      <div
                        key={team._id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs font-mono hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`w-7 h-7 rounded-lg border flex items-center justify-center font-bold text-xs shrink-0 ${badgeStyle}`}>
                            {rank === 1 ? <Crown className="w-4 h-4 text-amber-400" /> : rank}
                          </span>
                          <div className="min-w-0">
                            <div className="text-white font-bold truncate">{team.name}</div>
                            {team.tag && (
                              <span className="text-[10px] text-slate-400 font-normal">[{team.tag}]</span>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-black text-amber-400 text-sm">{team.points || 0}</span>
                          <span className="text-[10px] text-slate-500 ml-1">pts</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* ========================================================= */}
          {/* 8. QUICK PORTAL HUBS */}
          {/* ========================================================= */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-2">
            <Link
              to="/tournaments"
              className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-cyan-950/30 to-slate-900 border border-cyan-500/30 hover:border-cyan-500/60 transition-all group flex items-center justify-between gap-3 shadow-lg"
            >
              <div className="space-y-1 min-w-0">
                <span className="text-[10px] uppercase font-mono font-bold text-cyan-400">Campus Competitions</span>
                <h3 className="text-base sm:text-lg font-black text-white font-mono group-hover:text-cyan-300 transition-colors truncate">
                  AVAILABLE TOURNAMENTS
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2">
                  Browse open registrations, battle arena rules, and register your team squad.
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:translate-x-1 transition-transform shrink-0">
                <ArrowRight className="w-5 h-5" />
              </div>
            </Link>

            <Link
              to="/points-table"
              className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-amber-950/30 to-slate-900 border border-amber-500/30 hover:border-amber-500/60 transition-all group flex items-center justify-between gap-3 shadow-lg"
            >
              <div className="space-y-1 min-w-0">
                <span className="text-[10px] uppercase font-mono font-bold text-amber-400">Official Standings</span>
                <h3 className="text-base sm:text-lg font-black text-white font-mono group-hover:text-amber-300 transition-colors truncate">
                  ESPORTS POINTS TABLE
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2">
                  View varsity team points, match victories, kill statistics, and rankings.
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:translate-x-1 transition-transform shrink-0">
                <ArrowRight className="w-5 h-5" />
              </div>
            </Link>
          </section>

        </div>
      </div>
    </div>
  );
};

export default Home;
