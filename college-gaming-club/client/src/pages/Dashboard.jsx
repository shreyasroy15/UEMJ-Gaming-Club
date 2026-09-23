import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading/Loading';
import TournamentCard from '../components/TournamentCard/TournamentCard';
import Avatar from '../components/Avatar/Avatar';
import {
  Trophy,
  Swords,
  Shield,
  Zap,
  Award,
  Clock,
  ArrowRight,
  Flame,
  Gamepad2,
  Megaphone,
  Pin,
  Calendar,
  Camera,
  Sparkles,
} from 'lucide-react';
import AvatarSelectorModal from '../components/Avatar/AvatarSelectorModal';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [tournaments, setTournaments] = useState([]);
  const [myTournaments, setMyTournaments] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [tournRes, teamsRes, matchRes, myRegsRes, annRes] = await Promise.allSettled([
          API.get('/tournaments'),
          API.get('/teams'),
          API.get('/matches'),
          API.get('/registrations/my-tournaments'),
          API.get('/announcements'),
        ]);

        const allTournaments =
          tournRes.status === 'fulfilled' ? tournRes.value.data.tournaments || [] : [];
        const allTeams =
          teamsRes.status === 'fulfilled' ? teamsRes.value.data.teams || [] : [];
        const allMatches =
          matchRes.status === 'fulfilled' ? matchRes.value.data.matches || [] : [];
        const dynamicTourneys =
          myRegsRes.status === 'fulfilled'
            ? (myRegsRes.value.data.registrations || []).map((r) => r.tournament).filter(Boolean)
            : [];
        const allAnnouncements =
          annRes.status === 'fulfilled' ? annRes.value.data.announcements || [] : [];
        setAnnouncements(allAnnouncements.slice(0, 3));

        // Filter user's teams
        const userTeams = allTeams.filter((t) =>
          t.members?.some((m) => (m.user?._id || m.user) === user?._id)
        );

        const userTeamIds = userTeams.map((t) => t._id.toString());

        // Filter tournaments player is registered for (both legacy and dynamic registrations)
        const registeredTourneys = allTournaments.filter((tourney) =>
          tourney.registeredTeams?.some((reg) =>
            userTeamIds.includes((reg.team?._id || reg.team).toString())
          )
        );
        const combinedMap = new Map();
        [...dynamicTourneys, ...registeredTourneys].forEach((t) => {
          if (t && t._id) combinedMap.set(t._id.toString(), t);
        });
        setMyTournaments(Array.from(combinedMap.values()));

        // Recommended open tournaments
        const openTourneys = allTournaments.filter(
          (t) => t.status === 'upcoming' || t.status === 'registration_open' || t.status === 'ongoing'
        );
        setTournaments(openTourneys.slice(0, 6));

        // Upcoming matches for user's teams
        const myUpcoming = allMatches.filter((m) => {
          const t1Id = (m.team1?._id || m.team1)?.toString();
          const t2Id = (m.team2?._id || m.team2)?.toString();
          return (userTeamIds.includes(t1Id) || userTeamIds.includes(t2Id)) && m.status !== 'completed';
        });
        setUpcomingMatches(myUpcoming.length > 0 ? myUpcoming : allMatches.slice(0, 2));
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

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-300">
      {/* Top Welcome Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/70 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-80 h-80 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <button
              type="button"
              onClick={() => setAvatarModalOpen(true)}
              className="relative group rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400 text-left cursor-pointer"
              title="Click to choose Valorant, Free Fire, or BGMI avatar"
            >
              <Avatar
                user={user}
                size="xl"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-cyan-400 shadow-xl shadow-cyan-500/20 group-hover:opacity-85 transition-all"
                imgClassName="rounded-2xl"
                textSize="text-2xl sm:text-3xl"
              />
              <div className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity backdrop-blur-[2px]">
                <Camera className="w-5 h-5 text-cyan-300 drop-shadow" />
                <span className="text-[9px] font-bold mt-0.5 text-cyan-200">Change</span>
              </div>
              <span className="absolute -top-1.5 -left-1.5 w-6 h-6 rounded-full bg-slate-900 border border-cyan-400 text-cyan-300 flex items-center justify-center shadow-md transition-transform group-hover:scale-110 active:scale-95">
                <Camera className="w-3 h-3" />
              </span>
              <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 text-[10px] font-black tracking-wider text-slate-950 uppercase shadow-md pointer-events-none">
                LVL {level}
              </div>
            </button>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                  {user?.name?.toUpperCase()}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 font-mono">
                  {user?.role === 'admin' ? 'Arena Admin' : 'Collegiate Athlete'}
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
            <button
              type="button"
              onClick={() => setAvatarModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 hover:border-cyan-500/50 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md shadow-black/30"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Select Avatar</span>
            </button>
            <Link
              to="/tournaments"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-1.5"
            >
              <Trophy className="w-4 h-4 text-slate-950" />
              <span>Browse Arenas</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2 Stat Cards */}
      <section className="grid grid-cols-2 gap-3 sm:gap-6">
        {/* Stat 1: Tournaments */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">
              Tournaments
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform shrink-0">
              <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl lg:text-3xl font-black text-white font-mono">
              {myTournaments.length}
            </span>
            <span className="text-[10px] sm:text-[11px] text-cyan-400 font-semibold font-mono">Registered</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 truncate">Collegiate brackets</p>
        </div>

        {/* Stat 2: Club XP */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">
              Club XP
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform shrink-0">
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl lg:text-3xl font-black text-white font-mono">
              {xp}
            </span>
            <span className="text-[10px] sm:text-[11px] text-amber-400 font-semibold font-mono">LVL {level}</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 truncate">Club Member XP</p>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="space-y-8">
        {/* Official Club Announcements & Bulletins */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
            <div className="flex items-start sm:items-center gap-2.5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-cyan-500/20 shrink-0 mt-0.5 sm:mt-0">
                <Megaphone className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white font-mono uppercase tracking-wide">
                  Club Bulletins & Announcements
                </h2>
                <p className="text-xs text-slate-400">
                  Official notices, rules, schedule drops, and collegiate tournament alerts.
                </p>
              </div>
            </div>
            <Link
              to="/news"
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono transition-colors self-start sm:self-auto shrink-0 bg-cyan-950/40 sm:bg-transparent px-2.5 py-1 sm:p-0 rounded-lg sm:rounded-none border sm:border-0 border-cyan-500/20"
            >
              All Bulletins <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {announcements.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {announcements.map((ann) => (
                <div
                  key={ann._id}
                  className="rounded-2xl bg-slate-900/60 border border-slate-800/90 hover:border-cyan-500/40 transition-all duration-200 overflow-hidden flex flex-col group backdrop-blur-sm shadow-lg"
                >
                  {/* Announcement Banner Image */}
                  {ann.image && (
                    <div className="h-40 w-full overflow-hidden relative bg-slate-950">
                      <img
                        src={ann.image}
                        alt={ann.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                      {ann.pinned && (
                        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-amber-500/90 text-slate-950 text-[10px] font-black uppercase font-mono tracking-wider flex items-center gap-1 shadow-md">
                          <Pin className="w-3 h-3 fill-current" /> Pinned
                        </div>
                      )}
                      <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/20 text-[10px] font-bold text-cyan-300 uppercase font-mono">
                        {ann.category || 'General'}
                      </div>
                    </div>
                  )}

                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      {!ann.image && (
                        <div className="flex items-center gap-2">
                          {ann.pinned && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase font-mono tracking-wider flex items-center gap-1">
                              <Pin className="w-3 h-3" /> Pinned
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-cyan-300 border border-slate-700 uppercase font-mono">
                            {ann.category || 'General'}
                          </span>
                        </div>
                      )}

                      <h3 className="text-sm sm:text-base font-bold text-white font-mono group-hover:text-cyan-300 transition-colors line-clamp-1">
                        {ann.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {ann.content}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-cyan-400" />
                        {new Date(ann.publishedAt || ann.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <Link
                        to="/news"
                        className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 transition-colors"
                      >
                        Read More <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/70 text-center text-slate-500 text-xs font-mono">
              No new club announcements at this moment.
            </div>
          )}
        </section>

        {/* Upcoming Match Widget */}
        <section className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-md relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-800 gap-2">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-500 shrink-0" />
              <h2 className="text-base sm:text-lg font-black text-white font-mono uppercase tracking-wide">
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
                    className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800/90 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold mb-3 flex-wrap">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{time}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-400">{round}</span>
                      </div>

                      {/* Matchup Banner */}
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center font-black text-cyan-400 font-mono text-xs sm:text-sm shrink-0">
                            {team1Name.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-bold text-white text-xs sm:text-base truncate">
                            {team1Name}
                          </span>
                        </div>

                        <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] sm:text-[11px] font-black text-amber-400 font-mono shrink-0">
                          VS
                        </span>

                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-950 border border-rose-500/40 flex items-center justify-center font-black text-rose-400 font-mono text-xs sm:text-sm shrink-0">
                            {team2Name.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-bold text-white text-xs sm:text-base truncate">
                            {team2Name}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                      <Link
                        to="/tournaments"
                        className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
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

          {tournaments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {tournaments.map((tourney) => (
                <TournamentCard key={tourney._id} tournament={tourney} />
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 text-center text-slate-500 text-sm">
              No open tournaments right now. Check back soon!
            </div>
          )}
        </section>
      </div>

      {/* Character Avatar Suggestion & Selection Modal */}
      <AvatarSelectorModal
        isOpen={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
      />
    </div>
  );
};

export default Dashboard;
