import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';

const Home = () => {
  const { user, isAuthenticated } = useAuth();
  const [runningTournaments, setRunningTournaments] = useState([]);
  const [allTournaments, setAllTournaments] = useState([]);
  const [myTournaments, setMyTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomeData();
  }, [user]);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      const [tournamentsRes, teamsRes] = await Promise.all([
        API.get('/tournaments'),
        isAuthenticated ? API.get('/teams') : Promise.resolve({ data: { teams: [] } }),
      ]);

      const tournaments = tournamentsRes.data.tournaments || [];
      setAllTournaments(tournaments);

      // Filter active/currently running tournaments (status 'live' or 'ongoing')
      const running = tournaments.filter(
        (t) => t.status === 'live' || t.status === 'ongoing'
      );
      setRunningTournaments(running);

      if (isAuthenticated && user) {
        // Find tournaments where user's team is registered
        const userSquads = (teamsRes.data.teams || []).filter(
          (tm) =>
            (tm.captain?._id || tm.captain) === user._id ||
            tm.members?.some((m) => (m.user?._id || m.user) === user._id)
        );
        const userSquadIds = userSquads.map((s) => s._id.toString());

        const registeredIn = tournaments.filter((t) =>
          t.registeredTeams?.some((r) => r.team && userSquadIds.includes((r.team._id || r.team).toString()))
        );
        setMyTournaments(registeredIn);
      }
    } catch (err) {
      console.error('Failed to load home page data:', err);
    } finally {
      setLoading(false);
    }
  };

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
    <div className="min-h-screen py-4 sm:py-8 px-3.5 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* 1. USER PROFILE / DASHBOARD SECTION (AUTHENTICATED) OR WELCOME BANNER (VISITOR) */}
      {isAuthenticated ? (
        <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/70 border border-slate-800 p-4 sm:p-6 md:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-16 w-80 h-80 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
            <div className="flex items-center gap-3.5 sm:gap-6 min-w-0 flex-1">
              <div className="relative shrink-0">
                <img
                  src={
                    user?.avatar ||
                    'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=300&q=80'
                  }
                  alt={user?.name}
                  className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-cyan-400 shadow-xl shadow-cyan-500/20"
                />
                <div className="absolute -bottom-1.5 -right-1.5 sm:-bottom-2 sm:-right-2 px-1.5 sm:px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 text-[9px] sm:text-[10px] font-black tracking-wider text-slate-950 uppercase shadow-md">
                  LVL {level}
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl min-[420px]:text-2xl sm:text-3xl font-black text-white font-mono tracking-tight truncate">
                    {user?.name?.toUpperCase()}
                  </h1>
                  <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 font-mono shrink-0">
                    {user?.role === 'admin' ? 'Arena Admin' : 'Collegiate Athlete'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 flex items-center gap-1.5 sm:gap-2 truncate">
                  <span className="font-mono text-cyan-400 shrink-0">@{user?.username}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-600 shrink-0" />
                  <span className="text-slate-300 truncate">{user?.college || 'University of Engineering & Management (UEM)'}</span>
                </p>

                {/* XP Progress Bar */}
                <div className="mt-2.5 sm:mt-3 flex items-center gap-2.5 sm:gap-3 max-w-sm">
                  <div className="flex-1 bg-slate-800/80 rounded-full h-2 sm:h-2.5 overflow-hidden border border-slate-700/60">
                    <div
                      className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-fuchsia-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(12, xpPercentage)}%` }}
                    />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-mono font-bold text-cyan-300 shrink-0">
                    {xp} / {nextLevelXp} XP
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <Link
                to="/tournaments"
                className="flex-1 sm:flex-none justify-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-1.5 text-center"
              >
                <Trophy className="w-4 h-4 text-slate-950 shrink-0" />
                <span>Tournaments</span>
              </Link>
              <Link
                to="/points-table"
                className="flex-1 sm:flex-none justify-center px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-400 font-bold text-xs transition-all flex items-center gap-1.5 text-center"
              >
                <BarChart3 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Points Table</span>
              </Link>
            </div>
          </div>
        </section>
      ) : (
        /* Visitor Welcome Header */
        <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/80 border border-slate-800 p-5 sm:p-8 md:p-12 shadow-2xl text-center md:text-left">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 -mb-20 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
            <div className="max-w-2xl space-y-3 sm:space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-semibold">
                <Sparkles className="w-3.5 h-3.5" /> UEM JAIPUR ESPORTS ARENA
              </div>
              <h1 className="text-2xl min-[420px]:text-3xl sm:text-5xl font-black text-white font-mono tracking-tight leading-tight">
                COLLEGE GAMING CLUB
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-slate-300 leading-relaxed">
                Official collegiate home for BGMI, Free Fire, and Valorant.
                Compete in varsity leagues, check live standings on the Points Table, and claim campus glory.
              </p>
              <div className="flex flex-col min-[480px]:flex-row items-stretch min-[480px]:items-center gap-2.5 sm:gap-3 pt-2 justify-center md:justify-start">
                <Link
                  to="/register"
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 text-center"
                >
                  <Gamepad2 className="w-4 h-4 shrink-0" /> Join the Club as a College Student
                </Link>
                <Link
                  to="/login"
                  className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider transition-all text-center"
                >
                  Sign In
                </Link>
              </div>
            </div>

            <div className="hidden lg:flex flex-col gap-3 p-5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 w-72 shrink-0">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 font-mono text-cyan-400 font-bold">
                <span>CAMPUS HIGHLIGHTS</span>
                <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400">Main Titles</span>
                <span className="font-bold text-white">BGMI & Free Fire</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400">Active Tournaments</span>
                <span className="font-bold text-white font-mono">{allTournaments.length}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Live Games Now</span>
                <span className="font-bold text-rose-400 font-mono">{runningTournaments.length}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. BASIC DASHBOARD STATISTICS */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
        <div className="p-3.5 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">
              {isAuthenticated ? 'My Tournaments' : 'Tournaments'}
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-xl sm:text-2xl md:text-3xl font-black text-white font-mono">
              {isAuthenticated ? myTournaments.length : allTournaments.length}
            </span>
            <span className="text-[10px] sm:text-[11px] text-cyan-400 font-semibold font-mono">Arenas</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 truncate">Collegiate registrations</p>
        </div>

        <div className="p-3.5 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">
              Matches Played
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Swords className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-xl sm:text-2xl md:text-3xl font-black text-white font-mono">
              {matchesPlayed}
            </span>
            <span className="text-[10px] sm:text-[11px] text-indigo-400 font-semibold font-mono">Rounds</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 truncate">Across campus scrims</p>
        </div>

        <div className="p-3.5 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">
              Victories
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-xl sm:text-2xl md:text-3xl font-black text-white font-mono">
              {wins}
            </span>
            <span className="text-[10px] sm:text-[11px] text-emerald-400 font-semibold font-mono">
              {winRate}% WR
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 truncate">Collegiate win ratio</p>
        </div>

        <div className="p-3.5 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">
              Club Rank XP
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-xl sm:text-2xl md:text-3xl font-black text-white font-mono">
              {xp}
            </span>
            <span className="text-[10px] sm:text-[11px] text-amber-400 font-semibold font-mono">Tier II</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 truncate">Earned via varsity events</p>
        </div>
      </section>

      {/* 3. CURRENTLY RUNNING TOURNAMENTS / GAMES (LIVE / ONGOING) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
              CURRENTLY RUNNING TOURNAMENTS / GAMES
            </h2>
          </div>
          <Link
            to="/tournaments"
            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono transition-colors"
          >
            All Tournaments <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {runningTournaments.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center space-y-3">
            <Gamepad2 className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-200 font-mono">
              No Tournaments Currently Running
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              There are no live or ongoing matches at this exact moment. Check upcoming tournament schedules or view open registrations.
            </p>
            <div className="pt-2">
              <Link
                to="/tournaments"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors"
              >
                Browse Upcoming Tournaments <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {runningTournaments.map((t) => (
              <div
                key={t._id}
                className="group rounded-2xl bg-slate-900/70 border border-rose-500/30 overflow-hidden shadow-xl hover:border-rose-500/60 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="relative h-48 w-full bg-slate-950 overflow-hidden">
                  <img
                    src={t.banner}
                    alt={t.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-950/90 text-rose-400 border border-rose-500/50 backdrop-blur-md flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                      LIVE / ONGOING
                    </span>
                  </div>

                  {/* Game Tag */}
                  <div className="absolute top-3 right-3">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-950/90 text-cyan-300 border border-cyan-500/40 backdrop-blur-md font-mono">
                      {t.game}
                    </span>
                  </div>

                  {/* Title over banner bottom */}
                  <div className="absolute bottom-3 left-4 right-4">
                    <h3 className="text-lg font-black text-white font-mono drop-shadow truncate">
                      {t.name}
                    </h3>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <p className="text-xs text-slate-300 line-clamp-2">
                    {t.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-800 text-slate-400 font-mono">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{new Date(t.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{t.registeredTeams?.length || 0} / {t.maxTeams} Teams</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      to={`/tournaments/${t.slug || t._id}`}
                      className="flex-1 text-center py-2.5 px-4 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 text-rose-200 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>Watch & Arena Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. QUICK PORTAL HUBS */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-2 sm:pt-4">
        <Link
          to="/tournaments"
          className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-cyan-950/30 to-slate-900 border border-cyan-500/30 hover:border-cyan-500/60 transition-all group flex items-center justify-between gap-3"
        >
          <div className="space-y-1 min-w-0">
            <span className="text-[10px] uppercase font-mono font-bold text-cyan-400">Campus Competitions</span>
            <h3 className="text-base sm:text-lg font-black text-white font-mono group-hover:text-cyan-300 transition-colors truncate">
              AVAILABLE TOURNAMENTS
            </h3>
            <p className="text-xs text-slate-400 line-clamp-2">
              Browse open registrations, prize pools, and register your team squad.
            </p>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:translate-x-1 transition-transform shrink-0">
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </Link>

        <Link
          to="/points-table"
          className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-amber-950/30 to-slate-900 border border-amber-500/30 hover:border-amber-500/60 transition-all group flex items-center justify-between gap-3"
        >
          <div className="space-y-1 min-w-0">
            <span className="text-[10px] uppercase font-mono font-bold text-amber-400">Official Standings</span>
            <h3 className="text-base sm:text-lg font-black text-white font-mono group-hover:text-amber-300 transition-colors truncate">
              ESPORTS POINTS TABLE
            </h3>
            <p className="text-xs text-slate-400 line-clamp-2">
              View BGMI, Free Fire, and collegiate team points and match victories.
            </p>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:translate-x-1 transition-transform shrink-0">
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </Link>
      </section>
    </div>
  );
};

export default Home;
