import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../../services/api';
import Loading from '../../components/Loading/Loading';
import Avatar from '../../components/Avatar/Avatar';
import EmptyState from '../../components/EmptyState/EmptyState';
import {
  Users,
  Shield,
  Trophy,
  Swords,
  Activity,
  Radio,
  Clock,
  ArrowRight,
  Flame,
  CheckCircle2,
  Calendar,
  Gamepad2,
  AlertCircle,
  ExternalLink,
  Plus,
  Play,
  RefreshCw,
  Sparkles,
  Terminal,
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentTournaments, setRecentTournaments] = useState([]);
  const [teamsLeaderboard, setTeamsLeaderboard] = useState([]);
  const [liveMatchesList, setLiveMatchesList] = useState([]);
  const [recentMatchesList, setRecentMatchesList] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters for Live Matches & Points Table
  const [matchGameFilter, setMatchGameFilter] = useState('all');
  const [pointsGameFilter, setPointsGameFilter] = useState('all');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await API.get('/dashboard/stats');
      if (res.data.success) {
        setStats(res.data.stats || {});
        setRecentUsers(res.data.recentUsers || []);
        setRecentTournaments(res.data.recentTournaments || []);
        setTeamsLeaderboard(res.data.teamsLeaderboard || []);
        setLiveMatchesList(res.data.liveMatchesList || []);
        setRecentMatchesList(res.data.recentMatchesList || []);
        setGames(res.data.games || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Time of day greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'GOOD MORNING, ADMIN';
    if (hour < 18) return 'GOOD AFTERNOON, ADMIN';
    return 'GOOD EVENING, ADMIN';
  }, []);

  // Filtered Matches
  const displayedMatches = useMemo(() => {
    const source = liveMatchesList.length > 0 ? liveMatchesList : recentMatchesList;
    if (matchGameFilter === 'all') return source;
    return source.filter((m) =>
      m.tournament?.game?.toLowerCase().includes(matchGameFilter.toLowerCase())
    );
  }, [liveMatchesList, recentMatchesList, matchGameFilter]);

  // Filtered Points Leaderboard
  const displayedLeaderboard = useMemo(() => {
    if (pointsGameFilter === 'all') return teamsLeaderboard;
    return teamsLeaderboard.filter((t) =>
      t.tournament?.game?.toLowerCase().includes(pointsGameFilter.toLowerCase())
    );
  }, [teamsLeaderboard, pointsGameFilter]);

  if (loading) {
    return <Loading message="Initializing Esports Operations Command Center..." />;
  }

  // 6 Metric Cards
  const metricCards = [
    {
      title: 'TOTAL GAMERS',
      value: stats?.totalUsers || 0,
      badge: '+14%',
      badgeColor: 'bg-cyan-950 text-cyan-400 border-cyan-500/30',
      subtitle: 'Verified campus athletes',
      icon: Users,
      color: 'from-cyan-500 to-blue-600',
      textColor: 'text-cyan-400',
    },
    {
      title: 'ACTIVE TEAMS',
      value: stats?.activeTeams || 0,
      badge: stats?.pendingTeams ? `${stats.pendingTeams} pending` : 'Verified',
      badgeColor: stats?.pendingTeams
        ? 'bg-amber-100 text-amber-800 border-amber-300'
        : 'bg-indigo-100 text-indigo-700 border-indigo-200',
      subtitle: 'Collegiate rosters enrolled',
      icon: Shield,
      color: 'from-indigo-500 to-purple-600',
      textColor: 'text-indigo-400',
    },
    {
      title: 'LIVE MATCHES',
      value: stats?.liveMatches || 0,
      badge: stats?.liveMatches > 0 ? '● ON AIR' : 'Ready',
      badgeColor:
        stats?.liveMatches > 0
          ? 'bg-rose-100 text-rose-700 border-rose-300 animate-pulse'
          : 'bg-slate-100 text-slate-600 border-slate-200',
      subtitle: 'Active tournament arenas',
      icon: Swords,
      color: 'from-rose-500 to-red-600',
      textColor: 'text-rose-400',
    },
    {
      title: 'ACTIVE TOURNAMENTS',
      value: stats?.totalTournaments || 0,
      badge: `${stats?.liveTournaments || 0} ongoing`,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      subtitle: 'Managed competitive cups',
      icon: Trophy,
      color: 'from-amber-500 to-orange-600',
      textColor: 'text-amber-400',
    },
    {
      title: 'TOTAL MATCHES',
      value: stats?.totalMatches || 0,
      badge: 'All Stages',
      badgeColor: 'bg-slate-100 text-slate-600 border-slate-200',
      subtitle: 'Across BGIS & FPS lobbies',
      icon: Radio,
      color: 'from-emerald-500 to-teal-600',
      textColor: 'text-emerald-400',
    },
    {
      title: 'UPCOMING MATCHES',
      value: stats?.upcomingMatches || 0,
      badge: 'Scheduled',
      badgeColor: 'bg-sky-100 text-sky-700 border-sky-300',
      subtitle: 'Seeded bracket rounds',
      icon: Clock,
      color: 'from-sky-500 to-cyan-600',
      textColor: 'text-sky-400',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 1. HERO BANNER CARD (EXACT PROTOTYPE DESIGN) */}
      {/* ========================================================================= */}
      <div className="admin-gradient-card rounded-2xl sm:rounded-[2rem] p-5 sm:p-8 admin-shadow-card border border-slate-200 relative overflow-hidden">
        {/* Abstract Gradient Orbs */}
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-sky-200 rounded-full blur-[80px] opacity-40 pointer-events-none mix-blend-multiply"></div>
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-200 rounded-full blur-[80px] opacity-40 pointer-events-none mix-blend-multiply"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 text-sky-600 font-bold text-[10px] tracking-widest uppercase mb-3 sm:mb-4 font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
            </span>
            Gaming Geeks Club
          </div>

          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-800 mb-3 sm:mb-6 flex flex-wrap items-center gap-2 sm:gap-4 tracking-tight">
            <span className="admin-gradient-primary text-white px-3 sm:px-5 py-1 sm:py-1.5 rounded-xl admin-shadow-card transform -rotate-1 inline-block border border-slate-700 border-b-2 border-b-slate-900 admin-shadow-inner-glow text-lg sm:text-2xl md:text-3xl">
              ADMIN DASHBOARD
            </span>
          </h2>

          <p className="text-slate-500 text-xs sm:text-base md:text-lg max-w-3xl mb-5 sm:mb-8 leading-relaxed font-medium">
            Tournament operations engine for collegiate BGMI, Free Fire, and Valorant matches.
            Realtime scoring, tournament telemetry, and campus player verification.
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 sm:gap-4">
            <Link
              to="/admin/matches"
              className="w-full sm:w-auto justify-center bg-white border border-slate-200 hover:border-sky-300 hover:bg-sky-50 text-slate-700 font-bold rounded-xl px-4 sm:px-6 py-2.5 sm:py-3 flex items-center gap-2 transition-all shadow-sm text-xs sm:text-sm cursor-pointer"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"></span>
              Inspect Match Rooms
            </Link>
            <Link
              to="/admin/matches"
              className="w-full sm:w-auto justify-center admin-gradient-accent hover:opacity-90 text-white font-bold rounded-xl px-4 sm:px-6 py-2.5 sm:py-3 admin-shadow-glow-accent transition-all hover:-translate-y-0.5 flex items-center gap-2 border border-blue-400/30 text-xs sm:text-sm cursor-pointer shadow-sm"
            >
              <Swords className="w-4 h-4" />
              Launch Next Round
            </Link>
            <button
              onClick={fetchDashboard}
              title="Refresh telemetry"
              className="self-start sm:self-auto bg-white border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-800 p-2.5 sm:p-3 rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. STAT CARDS (4 PRIMARY METRICS MATCHING PROTOTYPE) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3.5 sm:gap-5 lg:gap-6">
        {/* Stat Card 1: Total Gamers */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 lg:p-6 admin-shadow-card border border-slate-100 flex flex-col justify-between admin-card-hover-effect relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-sky-50 to-transparent rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start mb-3 sm:mb-4">
            <h3 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest font-mono truncate">
              Total Gamers
            </h3>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-sky-50 text-sky-500 border border-sky-100 flex items-center justify-center shadow-sm shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div>
            <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2.5">
              <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-800 tracking-tight">
                {stats?.totalUsers ? (stats.totalUsers > 20 ? stats.totalUsers : stats.totalUsers) : 10}
              </span>
              <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md flex items-center gap-0.5 sm:gap-1 shadow-sm">
                <span>↑</span> 14%
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-1 sm:mt-2 font-medium truncate">Campus registered</p>
          </div>
        </div>

        {/* Stat Card 2: Active Squads */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 lg:p-6 admin-shadow-card border border-slate-100 flex flex-col justify-between admin-card-hover-effect relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-50 to-transparent rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start mb-3 sm:mb-4">
            <h3 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest font-mono truncate">
              Active Squads
            </h3>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 text-indigo-500 border border-indigo-100 flex items-center justify-center shadow-sm shrink-0">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div>
            <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2.5">
              <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-800 tracking-tight">
                {stats?.activeTeams || 0}
              </span>
              <span className="bg-amber-50 text-amber-600 border border-amber-100 text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md shadow-sm truncate">
                {stats?.pendingTeams ? `${stats.pendingTeams} P` : 'Verified'}
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-1 sm:mt-2 font-medium truncate">Active rosters</p>
          </div>
        </div>

        {/* Stat Card 3: Live Matches */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 lg:p-6 admin-shadow-card border border-slate-100 flex flex-col justify-between admin-card-hover-effect relative overflow-hidden group">
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-400"></div>
          <div className="flex justify-between items-start mb-3 sm:mb-4">
            <h3 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest font-mono truncate">
              Live Matches
            </h3>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-500 border border-emerald-100 flex items-center justify-center shadow-sm shrink-0">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div>
            <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2.5">
              <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-800 tracking-tight">
                {stats?.liveMatches || 0}
              </span>
              <span className="relative flex h-2 sm:h-2.5 w-2 sm:w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 sm:h-2.5 w-2 sm:w-2.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-1 sm:mt-2 font-medium truncate">Arenas in play</p>
          </div>
        </div>

        {/* Stat Card 4: Tournaments */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 lg:p-6 admin-shadow-card border border-slate-100 flex flex-col justify-between admin-card-hover-effect relative overflow-hidden group">
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-rose-400 to-orange-400"></div>
          <div className="flex justify-between items-start mb-3 sm:mb-4">
            <h3 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest font-mono truncate">
              Tournaments
            </h3>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center shadow-sm shrink-0">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div>
            <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2.5">
              <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-800 tracking-tight">
                {stats?.totalTournaments || 1}
              </span>
              <span className="bg-rose-50 text-rose-600 border border-rose-100 text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md shadow-sm">
                Open
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-1 sm:mt-2 font-medium truncate">Active cups</p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. THREE-COLUMN OVERVIEW (TOURNAMENTS, ACTIVE TEAMS, RECENT ONBOARDINGS) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Active Tournaments Column */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 admin-shadow-card border border-slate-200/80 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-50 rounded-bl-full -z-10 opacity-50"></div>
          <div className="flex justify-between items-center mb-4 sm:mb-5">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm sm:text-base">
              <Trophy className="w-4 h-4 text-sky-500" />
              Active Tournaments
            </h3>
            <Link
              to="/admin/tournaments"
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 transition-colors flex items-center gap-1"
            >
              Manage <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3 sm:space-y-3.5 overflow-y-auto pr-1 admin-scrollbar" style={{ maxHeight: '420px' }}>
            {recentTournaments.length === 0 ? (
              <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                No active tournaments currently registered.
              </div>
            ) : (
              recentTournaments.map((t) => {
                const registeredCount = t.registeredTeams?.length || 0;
                const maxTeams = t.maxTeams || 25;
                const progressPct = Math.min(100, Math.round((registeredCount / maxTeams) * 100));

                return (
                  <Link
                    to={`/admin/matches?tournament=${t._id}`}
                    key={t._id}
                    className="block bg-slate-50 hover:bg-sky-50/50 border border-slate-200 rounded-xl p-3.5 sm:p-4 hover:border-sky-300 transition-all group relative overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 admin-gradient-accent"></div>
                    <div className="flex justify-between items-start mb-2 pl-2 gap-2">
                      <h4 className="font-bold text-slate-800 text-xs sm:text-sm group-hover:text-sky-600 transition-colors truncate flex-1 min-w-0">
                        {t.name}
                      </h4>
                      <span className="bg-slate-800 text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow-sm shrink-0">
                        {t.status === 'live' ? 'LIVE NOW' : 'Reg Open'}
                      </span>
                    </div>

                    <div className="text-[11px] sm:text-xs text-slate-500 font-medium mb-3 pl-2 truncate">
                      {t.game || 'BGMI'} • {t.format || 'Round Robin'} • {maxTeams} Teams max
                    </div>

                    {/* Progress */}
                    <div className="pl-2 mb-2 space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>Squad Slots</span>
                        <span className="font-bold text-slate-600">{registeredCount} / {maxTeams} ({progressPct}%)</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full transition-all"
                          style={{ width: `${Math.max(4, progressPct)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pl-2 pt-2.5 border-t border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                        PRIZE POOL
                      </span>
                      <span className="text-xs sm:text-sm font-black text-amber-500 tracking-tight font-mono">
                        INR (₹){(t.prizePool?.total || 7000).toLocaleString()}
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Active & Approved Teams Column */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 admin-shadow-card border border-slate-200/80 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-10 opacity-50"></div>
          <div className="flex justify-between items-center mb-4 sm:mb-5">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm sm:text-base">
              <Shield className="w-4 h-4 text-emerald-500" />
              Active & Approved Teams
            </h3>
            <Link
              to="/admin/teams"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1"
            >
              Verify Teams <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2 overflow-y-auto pr-1 admin-scrollbar" style={{ maxHeight: '420px' }}>
            {teamsLeaderboard.length === 0 ? (
              <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                No active squads registered yet. Teams will appear here as they sign up.
              </div>
            ) : (
              teamsLeaderboard.map((team, idx) => (
                <div
                  key={team._id || idx}
                  className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100 hover:border-slate-200 group gap-2"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <span className="text-[10px] font-mono font-bold text-emerald-500 w-4 group-hover:scale-110 transition-transform shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="w-8 h-8 sm:w-9 sm:h-9 admin-gradient-primary rounded-lg flex items-center justify-center text-white text-xs admin-shadow-inner-glow border border-slate-700 shrink-0">
                      <Shield className="w-4 h-4 text-sky-400" />
                    </div>
                    <div className="truncate min-w-0 flex-1">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-800 leading-tight truncate">
                        {team.teamName || team.name || `Squad #${idx + 1}`}
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                        {team.tournament?.name || 'TechFest BGMI'} • Capt. @{team.captain?.username || 'leader'}
                      </p>
                    </div>
                  </div>
                  <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-xs uppercase tracking-wider shrink-0">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Active
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Players List Column (Recent Onboardings) */}
        <div className="md:col-span-2 xl:col-span-1 bg-white rounded-2xl p-4 sm:p-6 admin-shadow-card border border-slate-200/80 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-10 opacity-50"></div>
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-indigo-500" />
              Recent Onboardings
            </h3>
            <Link
              to="/admin/users"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2 overflow-y-auto pr-1 admin-scrollbar" style={{ maxHeight: '400px' }}>
            {recentUsers.length === 0 ? (
              <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                No recent gamer onboardings recorded.
              </div>
            ) : (
              recentUsers.map((player, idx) => {
                const initials = (player.name || 'Gamer').charAt(0).toUpperCase();
                const colors = [
                  'bg-purple-100 text-purple-600 border-purple-200',
                  'bg-blue-100 text-blue-600 border-blue-200',
                  'bg-sky-100 text-sky-600 border-sky-200',
                  'bg-teal-100 text-teal-600 border-teal-200',
                  'bg-indigo-100 text-indigo-600 border-indigo-200',
                ];
                const colorClass = colors[idx % colors.length];

                return (
                  <div
                    key={player._id || idx}
                    className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100 hover:border-slate-200 gap-2"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                      <div
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm border shadow-xs shrink-0 ${colorClass}`}
                      >
                        {initials}
                      </div>
                      <div className="truncate min-w-0 flex-1">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-800 leading-tight truncate">
                          {player.name}
                        </h4>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">
                          @{player.username || 'gamer'} • {player.college || 'UEM Jaipur'}
                        </p>
                      </div>
                    </div>
                    <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-2 py-1 rounded border border-slate-200 shadow-xs uppercase tracking-wider shrink-0 font-mono">
                      {player.role === 'admin' ? 'Admin' : 'Student'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. LIVE MATCH ARENA & POINTS STANDINGS */}
      {/* ========================================================================= */}
      <div className="pb-8">
        {/* Live Match Command Center */}
        <div className="bg-white rounded-2xl p-6 admin-shadow-card border border-slate-200/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-orange-500 flex items-center justify-center text-white shadow-sm shrink-0">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 tracking-tight">
                  LIVE MATCH COMMAND CENTER
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Arbitrate real-time arena lobbies, scorecards, and stage qualifications
                </p>
              </div>
            </div>

            {/* Match Game Filter */}
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
              {['all', 'BGMI', 'Free Fire', 'Valorant'].map((g) => (
                <button
                  key={g}
                  onClick={() => setMatchGameFilter(g)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    matchGameFilter === g
                      ? 'bg-white text-sky-600 shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {displayedMatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedMatches.map((match) => {
                const gameName = match.tournament?.game || 'BGMI';
                const team1 = match.teamA?.name || match.teams?.[0]?.teamName || 'Team Alpha';
                const team2 = match.teamB?.name || match.teams?.[1]?.teamName || 'Team Omega';
                const isLive = match.status === 'live';

                return (
                  <div
                    key={match._id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="bg-rose-50 text-rose-600 border border-rose-200 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                        {isLive ? 'LIVE ARENA' : match.status || 'SCHEDULED'}
                      </span>
                      <span className="text-xs text-slate-500 font-mono font-medium">
                        {gameName} • #{match.matchNumber || 1}
                      </span>
                    </div>

                    <div className="bg-white rounded-lg p-3 border border-slate-100 space-y-1.5 shadow-xs">
                      <div className="flex justify-between items-center text-xs font-semibold text-slate-800">
                        <span className="truncate">{team1}</span>
                        <span className="text-sky-600 font-mono font-bold">{match.scoreA || 0} PTS</span>
                      </div>
                      <div className="h-px bg-slate-100" />
                      <div className="flex justify-between items-center text-xs font-semibold text-slate-800">
                        <span className="truncate">{team2}</span>
                        <span className="text-rose-600 font-mono font-bold">{match.scoreB || 0} PTS</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        to={`/admin/matches?tournament=${match.tournament?._id || match.tournament || ''}`}
                        className="flex-1 text-center py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-sky-50 hover:text-sky-600 transition-colors shadow-xs"
                      >
                        Inspect
                      </Link>
                      <Link
                        to={`/admin/matches?tournament=${match.tournament?._id || match.tournament || ''}`}
                        className="flex-1 text-center py-1.5 rounded-lg admin-gradient-accent text-white text-xs font-bold hover:opacity-90 transition-opacity shadow-xs"
                      >
                        Update Score
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-2">
              <Swords className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No Live Matches In Session</p>
              <p className="text-xs text-slate-500">
                Ready to run a tournament room? Launch a match lobby to broadcast credentials.
              </p>
              <div className="pt-2">
                <Link
                  to="/admin/matches"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl admin-gradient-accent text-white text-xs font-bold shadow-xs hover:opacity-90 transition-opacity"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Launch Match Room</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
