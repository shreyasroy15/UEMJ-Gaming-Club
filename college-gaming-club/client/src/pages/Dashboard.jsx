import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading/Loading';
import TournamentCard from '../components/TournamentCard/TournamentCard';
import {
  Trophy,
  Swords,
  Shield,
  Zap,
  Award,
  Calendar,
  Clock,
  ArrowRight,
  Sparkles,
  Users,
  ChevronRight,
  Flame,
  CheckCircle2,
  ExternalLink,
  Target,
  Gamepad2,
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tournaments, setTournaments] = useState([]);
  const [myTournaments, setMyTournaments] = useState([]);
  const [myTeams, setMyTeams] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [tournRes, teamsRes, matchRes, annRes] = await Promise.allSettled([
          API.get('/tournaments'),
          API.get('/teams'),
          API.get('/matches'),
          API.get('/announcements'),
        ]);

        const allTournaments =
          tournRes.status === 'fulfilled' ? tournRes.value.data.tournaments || [] : [];
        const allTeams =
          teamsRes.status === 'fulfilled' ? teamsRes.value.data.teams || [] : [];
        const allMatches =
          matchRes.status === 'fulfilled' ? matchRes.value.data.matches || [] : [];
        const allAnnouncements =
          annRes.status === 'fulfilled' ? annRes.value.data.announcements || [] : [];

        // Filter user's teams
        const userTeams = allTeams.filter((t) =>
          t.members?.some((m) => (m.user?._id || m.user) === user?._id)
        );
        setMyTeams(userTeams);

        const userTeamIds = userTeams.map((t) => t._id.toString());

        // Filter tournaments player is registered for
        const registeredTourneys = allTournaments.filter((tourney) =>
          tourney.registeredTeams?.some((reg) =>
            userTeamIds.includes((reg.team?._id || reg.team).toString())
          )
        );
        setMyTournaments(registeredTourneys);

        // Recommended open tournaments
        const openTourneys = allTournaments.filter(
          (t) => t.status === 'upcoming' || t.status === 'registration_open' || t.status === 'ongoing'
        );
        setTournaments(openTourneys.slice(0, 3));

        // Upcoming matches for user's teams
        const myUpcoming = allMatches.filter((m) => {
          const t1Id = (m.team1?._id || m.team1)?.toString();
          const t2Id = (m.team2?._id || m.team2)?.toString();
          return (userTeamIds.includes(t1Id) || userTeamIds.includes(t2Id)) && m.status !== 'completed';
        });
        setUpcomingMatches(myUpcoming.length > 0 ? myUpcoming : allMatches.slice(0, 2));

        setAnnouncements(allAnnouncements.slice(0, 4));
      } catch (err) {
        console.error('Error fetching student dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  if (loading) {
    return <Loading message="Loading collegiate arena dashboard..." />;
  }

  const xp = user?.clubXP || 150;
  const level = user?.level || 1;
  const nextLevelXp = level * 500;
  const xpPercentage = Math.min(100, Math.round((xp % 500) / 5));

  const stats = user?.stats || {};
  const matchesPlayed = stats.matchesPlayed || myTournaments.length * 2 || 0;
  const wins = stats.wins || (matchesPlayed > 0 ? Math.floor(matchesPlayed * 0.65) : 0);
  const winRate = matchesPlayed > 0 ? Math.round((wins / matchesPlayed) * 100) : 0;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-300">
      {/* Top Welcome Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/70 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-80 h-80 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="relative">
              <img
                src={
                  user?.avatar ||
                  'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=300&q=80'
                }
                alt={user?.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-cyan-400 shadow-xl shadow-cyan-500/20"
              />
              <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 text-[10px] font-black tracking-wider text-slate-950 uppercase shadow-md">
                LVL {level}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                  {user?.name?.toUpperCase()}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 font-mono">
                  {user?.role === 'admin'
                    ? 'Arena Admin'
                    : user?.role === 'organizer'
                    ? 'Tournament Master'
                    : 'Collegiate Athlete'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 flex items-center gap-2">
                <span>@{user?.username}</span>
                <span className="w-1 h-1 rounded-full bg-slate-600" />
                <span className="text-slate-300">{user?.college || 'UEM Jaipur Esports'}</span>
              </p>

              {/* XP Progress Bar */}
              <div className="mt-3 flex items-center gap-3 max-w-sm">
                <div className="flex-1 bg-slate-800/80 rounded-full h-2.5 overflow-hidden border border-slate-700/60">
                  <div
                    className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-fuchsia-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(12, xpPercentage)}%` }}
                  />
                </div>
                <span className="text-[11px] font-mono font-bold text-cyan-300 shrink-0">
                  {xp} / {nextLevelXp} XP
                </span>
              </div>
            </div>
          </div>

          {/* Quick Hub Navigation */}
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              to="/tournaments"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-1.5"
            >
              <Trophy className="w-4 h-4 text-slate-950" />
              <span>Browse Arenas</span>
            </Link>
            <Link
              to="/my-teams"
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-semibold text-xs transition-all flex items-center gap-1.5"
            >
              <Shield className="w-4 h-4 text-indigo-400" />
              <span>My Squads</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 4 Stat Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Stat 1: Tournaments */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Tournaments
            </span>
            <div className="w-9 h-9 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">
              {myTournaments.length}
            </span>
            <span className="text-[11px] text-cyan-400 font-semibold font-mono">Active</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Collegiate bracket registrations</p>
        </div>

        {/* Stat 2: Matches */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Matches Played
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
              <Swords className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">
              {matchesPlayed}
            </span>
            <span className="text-[11px] text-indigo-400 font-semibold font-mono">Rounds</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Across campus scrims & cups</p>
        </div>

        {/* Stat 3: Wins */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Victories
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">
              {wins}
            </span>
            <span className="text-[11px] text-emerald-400 font-semibold font-mono">
              {winRate}% WR
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Collegiate win ratio</p>
        </div>

        {/* Stat 4: Club XP */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Club Rank XP
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">
              {xp}
            </span>
            <span className="text-[11px] text-amber-400 font-semibold font-mono">Tier II</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Rank: Gold Challenger</p>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Match Widget + Recommended Tournaments */}
        <div className="lg:col-span-2 space-y-8">
          {/* Upcoming Match Widget */}
          <section className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-md relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-rose-500" />
                <h2 className="text-lg font-black text-white font-mono uppercase tracking-wide">
                  Upcoming Arena Scrim / Match
                </h2>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-950/70 text-rose-400 border border-rose-500/40 animate-pulse">
                Live Broadcast Ready
              </span>
            </div>

            {upcomingMatches.length > 0 ? (
              <div className="mt-5 space-y-4">
                {upcomingMatches.slice(0, 1).map((match, idx) => {
                  const team1Name = match.team1?.name || 'Viper Legion';
                  const team2Name = match.team2?.name || 'Apex Strikers';
                  const round = match.round ? `Round ${match.round}` : 'Quarterfinals';
                  const time = match.scheduledTime
                    ? new Date(match.scheduledTime).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Tonight, 8:00 PM IST';

                  return (
                    <div
                      key={match._id || idx}
                      className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/90 flex flex-col md:flex-row md:items-center justify-between gap-6"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold mb-3">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{time}</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-400">{round}</span>
                        </div>

                        {/* Matchup Banner */}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center font-black text-cyan-400 font-mono text-sm">
                              {team1Name.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="font-bold text-white text-sm sm:text-base">
                              {team1Name}
                            </span>
                          </div>

                          <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-black text-amber-400 font-mono">
                            VS
                          </span>

                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl bg-rose-950 border border-rose-500/40 flex items-center justify-center font-black text-rose-400 font-mono text-sm">
                              {team2Name.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="font-bold text-white text-sm sm:text-base">
                              {team2Name}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <Link
                          to="/tournaments"
                          className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5"
                        >
                          <span>View Match Lobby</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-5 text-center py-8 text-slate-500 text-sm">
                No matches scheduled right now. Join a tournament to get seeded!
              </div>
            )}
          </section>

          {/* Recommended Tournaments */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-white font-mono">
                  OPEN TOURNAMENTS
                </h2>
                <p className="text-xs text-slate-400">
                  Enter with your collegiate roster and fight for prizes & ranking points.
                </p>
              </div>
              <Link
                to="/tournaments"
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {tournaments.map((tourney) => (
                <TournamentCard key={tourney._id} tournament={tourney} />
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: My Squads + Quests + Activity Feed */}
        <div className="space-y-8">
          {/* My Team Widget */}
          <section className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-sm text-white font-mono uppercase">
                  My Active Squad
                </h3>
              </div>
              <Link
                to="/my-teams"
                className="text-xs text-indigo-400 hover:underline font-semibold"
              >
                Manage
              </Link>
            </div>

            {myTeams.length > 0 ? (
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-500 to-fuchsia-600 p-0.5 flex items-center justify-center">
                    <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-mono font-black text-indigo-300">
                      {myTeams[0].tag || myTeams[0].name.slice(0, 3).toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm leading-tight">
                      {myTeams[0].name}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Game: <span className="text-cyan-300 font-semibold">{myTeams[0].game?.title || myTeams[0].game || 'Valorant'}</span>
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                  <span>Roster: {myTeams[0].members?.length || 5} Players</span>
                  <span className="text-emerald-400 font-mono font-semibold">Ready to Queue</span>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-slate-950/50 border border-dashed border-slate-800 text-center space-y-3">
                <p className="text-xs text-slate-400">
                  You haven't joined a gaming squad yet.
                </p>
                <Link
                  to="/teams"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
                >
                  <Users className="w-3.5 h-3.5" /> Find or Create Squad
                </Link>
              </div>
            )}
          </section>

          {/* Daily Quests & Milestones */}
          <section className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm text-white font-mono uppercase">
                  Collegiate Quests
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">
                +150 XP Available
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">Win 1 Arena Scrim</span>
                  <span className="text-amber-400 font-mono font-bold">+50 XP</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-amber-400 h-full rounded-full" style={{ width: '60%' }} />
                </div>
                <span className="text-[10px] text-slate-500">Progress: 1/2 matches completed</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">Register Squad in UEM Cup</span>
                  <span className="text-amber-400 font-mono font-bold">+100 XP</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-cyan-400 h-full rounded-full" style={{ width: myTournaments.length > 0 ? '100%' : '0%' }} />
                </div>
                <span className="text-[10px] text-slate-500">
                  {myTournaments.length > 0 ? 'Completed!' : 'Progress: 0/1 registered'}
                </span>
              </div>
            </div>
          </section>

          {/* Announcements & Club Feed */}
          <section className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-sm text-white font-mono uppercase">
                  Arena Broadcasts
                </h3>
              </div>
              <Link to="/news" className="text-xs text-cyan-400 hover:underline">
                All
              </Link>
            </div>

            <div className="space-y-3">
              {announcements.length > 0 ? (
                announcements.map((ann) => (
                  <div
                    key={ann._id}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white truncate max-w-[200px]">
                        {ann.title}
                      </h4>
                      <span className="text-[9px] font-mono text-slate-500">
                        {new Date(ann.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">
                      {ann.content}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 text-center py-4">
                  No active broadcasts. Check back soon!
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
