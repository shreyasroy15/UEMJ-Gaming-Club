import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API from '../../services/api';
import Loading from '../../components/Loading/Loading';
import EmptyState from '../../components/EmptyState/EmptyState';
import {
  Trophy,
  Swords,
  Shield,
  Users,
  Gamepad2,
  ExternalLink,
  Plus,
  Play,
  Clock,
  CheckCircle2,
  ArrowRight,
  Flame,
  Radio,
  Sparkles,
} from 'lucide-react';

const GAME_CONFIG = {
  bgmi: {
    key: 'bgmi',
    name: 'BGMI',
    fullName: 'Battlegrounds Mobile India',
    platform: 'Mobile',
    teamSize: 'Squad (4 Players)',
    accentColor: '#38BDF8',
    themeClass: {
      border: 'border-cyan-500/40',
      text: 'text-cyan-400',
      bgPill: 'bg-cyan-950/60 border-cyan-500/30 text-cyan-300',
      gradient: 'from-cyan-500 to-blue-600',
      badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      glow: 'shadow-[0_0_20px_rgba(56,189,248,0.15)]',
    },
    defaultLogo: 'https://wallpapercave.com/wp/wp9837300.jpg',
    logo: 'https://wallpapercave.com/wp/wp9837300.jpg',
    fallbackLogo: '/assets/bgmi-logo.jpg',
    description: 'Premier tactical battle royale tournament operations for university squads.',
  },
  'free-fire': {
    key: 'free-fire',
    name: 'Free Fire',
    fullName: 'Garena Free Fire MAX',
    platform: 'Mobile',
    teamSize: 'Squad (4 Players)',
    accentColor: '#F97316',
    themeClass: {
      border: 'border-orange-500/40',
      text: 'text-orange-400',
      bgPill: 'bg-orange-950/60 border-orange-500/30 text-orange-300',
      gradient: 'from-orange-500 to-amber-600',
      badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      glow: 'shadow-[0_0_20px_rgba(249,115,22,0.15)]',
    },
    defaultLogo: 'https://wallpapers.com/images/hd/free-fire-logo-in-black-neggg4nr4exfv0yh.jpg',
    logo: 'https://wallpapers.com/images/hd/free-fire-logo-in-black-neggg4nr4exfv0yh.jpg',
    description: 'Fast-paced survival esports bracket management and points accumulation.',
  },
  valorant: {
    key: 'valorant',
    name: 'Valorant',
    fullName: 'Riot Games Valorant',
    platform: 'PC',
    teamSize: 'Standard (5 Players)',
    accentColor: '#EF4444',
    themeClass: {
      border: 'border-rose-500/40',
      text: 'text-rose-400',
      bgPill: 'bg-rose-950/60 border-rose-500/30 text-rose-300',
      gradient: 'from-rose-500 to-red-600',
      badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      glow: 'shadow-[0_0_20px_rgba(239,68,68,0.15)]',
    },
    defaultLogo: 'https://i.pinimg.com/originals/6f/20/7c/6f207c513f95b2a14e164c9c0b772874.jpg',
    logo: 'https://i.pinimg.com/originals/6f/20/7c/6f207c513f95b2a14e164c9c0b772874.jpg',
    fallbackLogo: '/assets/valorant-logo.jpg',
    description: 'Precision tactical 5v5 FPS tournament seeding, lobbies, and match arbitration.',
  },
};

const AdminGameView = () => {
  const { gameKey } = useParams();
  const navigate = useNavigate();
  const normalizedKey = (gameKey || 'bgmi').toLowerCase();
  const game = GAME_CONFIG[normalizedKey] || GAME_CONFIG['bgmi'];

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'tournaments' | 'matches' | 'teams' | 'points'
  const [loading, setLoading] = useState(true);
  const [tournaments, setTournaments] = useState([]);
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    fetchGameData();
  }, [normalizedKey]);

  const fetchGameData = async () => {
    try {
      setLoading(true);
      const [tRes, mRes] = await Promise.allSettled([
        API.get('/tournaments'),
        API.get('/matches'),
      ]);

      const allTournaments = tRes.status === 'fulfilled' ? tRes.value.data.tournaments || [] : [];
      const allMatches = mRes.status === 'fulfilled' ? mRes.value.data.matches || [] : [];

      // Filter by current game name pattern
      const targetName = game.name.toLowerCase();
      const filteredTournaments = allTournaments.filter(
        (t) => t.game?.toLowerCase().includes(targetName)
      );

      const filteredMatches = allMatches.filter(
        (m) =>
          m.tournament?.game?.toLowerCase().includes(targetName) ||
          m.title?.toLowerCase().includes(targetName)
      );

      setTournaments(filteredTournaments);
      setMatches(filteredMatches);

      // Collect registered teams from tournaments of this game
      const teamList = [];
      filteredTournaments.forEach((t) => {
        if (Array.isArray(t.registeredTeams)) {
          t.registeredTeams.forEach((rt) => {
            if (rt.team) {
              teamList.push({
                ...rt.team,
                tournamentName: t.name,
                tournamentId: t._id,
                registrationStatus: rt.status || 'verified',
              });
            }
          });
        }
      });
      setTeams(teamList);
    } catch (err) {
      console.error('Error fetching game data:', err);
    } finally {
      setLoading(false);
    }
  };

  const liveMatches = useMemo(() => matches.filter((m) => m.status === 'live'), [matches]);
  const upcomingMatches = useMemo(
    () => matches.filter((m) => m.status === 'upcoming' || m.status === 'scheduled'),
    [matches]
  );
  const completedMatches = useMemo(() => matches.filter((m) => m.status === 'completed'), [matches]);

  if (loading) {
    return <Loading message={`Loading ${game.fullName} command hub...`} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Game Header Banner */}
      <div
        className="relative rounded-3xl p-6 sm:p-8 admin-gradient-card border border-slate-200 overflow-hidden admin-shadow-card"
      >
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-sky-200/40 rounded-full blur-3xl pointer-events-none mix-blend-multiply" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4 sm:gap-6">
            <div
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl p-1 bg-black border border-slate-200 shadow-sm flex items-center justify-center shrink-0 overflow-hidden`}
            >
              {game.logo ? (
                <img
                  src={game.logo}
                  alt={game.fullName}
                  className="w-full h-full object-cover rounded-xl"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = game.fallbackLogo || (game.key === 'free-fire' ? '/assets/free-fire-logo.jpg' : game.key === 'valorant' ? '/assets/valorant-logo.jpg' : '/assets/bgmi-logo.jpg');
                  }}
                />
              ) : (
                <Gamepad2 className={`w-9 h-9 sm:w-11 sm:h-11 ${game.themeClass.text}`} />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono ${game.themeClass.bgPill}`}>
                  ● Competitive Title
                </span>
                <span className="text-xs font-mono text-slate-500">Platform: {game.platform}</span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-mono text-slate-500">Roster: {game.teamSize}</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-slate-800 font-mono tracking-tight">
                {game.fullName}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">{game.description}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              to={`/admin/matches`}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-mono text-white bg-gradient-to-r ${game.themeClass.gradient} shadow-sm hover:opacity-95 transition-all flex items-center gap-1.5`}
            >
              <Swords className="w-4 h-4" />
              <span>Launch Match</span>
            </Link>
            <Link
              to="/admin/tournaments"
              className="px-4 py-2 rounded-xl text-xs font-bold font-mono text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs transition-all flex items-center gap-1.5"
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Tournaments</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto admin-scrollbar">
        {[
          { id: 'overview', label: 'Overview', icon: Radio },
          { id: 'tournaments', label: `Tournaments (${tournaments.length})`, icon: Trophy },
          { id: 'matches', label: `Matches (${matches.length})`, icon: Swords },
          { id: 'teams', label: `Teams (${teams.length})`, icon: Shield },
          { id: 'points', label: 'Points Standings', icon: Flame },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? `bg-white text-sky-600 border border-slate-200 shadow-xs`
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/70 border border-transparent'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-100 admin-shadow-card">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Tournaments</span>
              <p className={`text-2xl sm:text-3xl font-black font-mono mt-1 ${game.themeClass.text}`}>
                {tournaments.length}
              </p>
              <span className="text-[10px] text-slate-500 font-mono">Managed Brackets</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-100 admin-shadow-card">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Live Matches</span>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl sm:text-3xl font-black font-mono text-rose-500">
                  {liveMatches.length}
                </p>
                {liveMatches.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                )}
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Real-time Arenas</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-100 admin-shadow-card">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Rosters Enrolled</span>
              <p className="text-2xl sm:text-3xl font-black font-mono text-slate-800 mt-1">
                {teams.length}
              </p>
              <span className="text-[10px] text-slate-500 font-mono">Approved Squads</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-100 admin-shadow-card">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Total Matches</span>
              <p className="text-2xl sm:text-3xl font-black font-mono text-emerald-600 mt-1">
                {matches.length}
              </p>
              <span className="text-[10px] text-slate-500 font-mono">Lobbies Tracked</span>
            </div>
          </div>

          {/* Active Tournament Highlights */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 font-mono uppercase tracking-wide flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>{game.name} Tournaments</span>
              </h2>
              <Link
                to="/admin/tournaments"
                className={`text-xs font-mono font-bold ${game.themeClass.text} hover:underline flex items-center gap-1`}
              >
                Create Tournament <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {tournaments.length === 0 ? (
              <EmptyState
                icon={Trophy}
                title={`No ${game.name} Tournaments Yet`}
                description={`Create a new ${game.name} tournament to open squad registrations and launch scrims.`}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tournaments.map((t) => (
                  <div
                    key={t._id}
                    className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 transition-all space-y-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${game.themeClass.badge}`}>
                          {t.status || 'Active'}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 font-mono mt-1">{t.name}</h3>
                        <p className="text-xs text-slate-600 font-mono">Format: {t.format || 'Single Elimination'}</p>
                      </div>
                      <Link
                        to={`/admin/matches?tournament=${t._id}`}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                        title="Manage Matches"
                      >
                        <Swords className="w-4 h-4" />
                      </Link>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-500">
                      <span>Rosters: {t.registeredTeams?.length || 0} teams</span>
                      <Link
                        to={`/admin/points-table?tournament=${t._id}`}
                        className={`${game.themeClass.text} hover:underline font-bold flex items-center gap-1`}
                      >
                        Standings <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: Tournaments */}
      {activeTab === 'tournaments' && (
        <div className="space-y-4">
          {tournaments.length === 0 ? (
            <EmptyState
              icon={Trophy}
              title={`No ${game.name} Tournaments`}
              description="No tournament records found for this title."
            />
          ) : (
            <div className="space-y-3">
              {tournaments.map((t) => (
                <div
                  key={t._id}
                  className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-mono">{t.name}</h3>
                    <p className="text-xs text-slate-600 font-mono">
                      Status: {t.status} • Teams: {t.registeredTeams?.length || 0}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/admin/matches?tournament=${t._id}`}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-mono font-bold text-slate-700 hover:bg-slate-200 border border-slate-200"
                    >
                      Matches
                    </Link>
                    <Link
                      to={`/admin/points-table?tournament=${t._id}`}
                      className={`px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-mono font-bold ${game.themeClass.text} hover:bg-slate-200 border border-slate-200`}
                    >
                      Points Table
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: Matches */}
      {activeTab === 'matches' && (
        <div className="space-y-4">
          {matches.length === 0 ? (
            <EmptyState
              icon={Swords}
              title={`No ${game.name} Matches Found`}
              description="No matches scheduled or logged for this competitive title."
            />
          ) : (
            <div className="space-y-3">
              {matches.map((m) => (
                <div
                  key={m._id}
                  className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        m.status === 'live'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {m.status}
                      </span>
                      <span className="text-xs font-bold text-slate-900 font-mono">
                        {m.stageName || m.round || 'Round 1'} - {m.title || `Match #${m.matchNumber || 1}`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-mono">
                      Tournament: {m.tournament?.name || 'Championship'}
                    </p>
                  </div>

                  <Link
                    to={`/admin/matches?tournament=${m.tournament?._id || ''}`}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 text-xs font-mono font-bold text-slate-700 hover:bg-slate-200 border border-slate-200 shrink-0"
                  >
                    Open in Matches Console →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: Teams */}
      {activeTab === 'teams' && (
        <div className="space-y-4">
          {teams.length === 0 ? (
            <EmptyState
              icon={Shield}
              title="No Rosters Registered"
              description={`No student teams have registered under ${game.name} tournaments.`}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {teams.map((t, idx) => (
                <div
                  key={t._id || idx}
                  className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-mono font-black text-cyan-700">
                      {t.name ? t.name.slice(0, 2).toUpperCase() : 'TM'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-slate-900 font-mono truncate">{t.name}</h4>
                      <span className="text-[10px] text-slate-500 font-mono block truncate">
                        Tournament: {t.tournamentName}
                      </span>
                    </div>
                  </div>
                  <span className="inline-block px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Verified Roster
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: Points Standings */}
      {activeTab === 'points' && (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-mono">
                {game.name} Standings & Points Table
              </h3>
              <p className="text-xs text-slate-600 font-mono mt-0.5">
                Official leaderboard scores, placement points, and kill telemetry.
              </p>
            </div>
            <Link
              to="/admin/points-table"
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold text-white bg-gradient-to-r ${game.themeClass.gradient} shadow-sm`}
            >
              Full Standings Console →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminGameView;
