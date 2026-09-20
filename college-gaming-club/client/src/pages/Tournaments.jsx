import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import API from '../services/api';
import TournamentCard from '../components/TournamentCard/TournamentCard';
import Loading from '../components/Loading/Loading';
import EmptyState from '../components/EmptyState/EmptyState';
import Modal from '../components/Modal/Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Trophy,
  Search,
  Users,
  Calendar,
  CheckCircle2,
  LogIn,
  UserPlus,
  Shield,
  Clock,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

const Tournaments = () => {
  const [searchParams] = useSearchParams();
  const initialGame = searchParams.get('game') || 'all';

  const { user, isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [tournaments, setTournaments] = useState([]);
  const [games, setGames] = useState([]);
  const [myTournaments, setMyTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedGame, setSelectedGame] = useState(initialGame);
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);

  // Registration Form State (Team Name + Team Type ONLY)
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamType, setNewTeamType] = useState('UEM Student Team');
  const [creatingTeam, setCreatingTeam] = useState(false);

  useEffect(() => {
    fetchGames();
    fetchTournaments();
  }, [selectedGame, selectedStatus]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserRegistrations();
    } else {
      setMyTournaments([]);
    }
  }, [isAuthenticated, user, tournaments]);

  const fetchGames = async () => {
    try {
      const res = await API.get('/games');
      setGames(res.data.games || []);
    } catch (e) {
      console.error('Failed to load games:', e);
    }
  };

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedGame !== 'all') params.append('game', selectedGame);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);

      const res = await API.get(`/tournaments?${params.toString()}`);
      setTournaments(res.data.tournaments || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to load tournaments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRegistrations = async () => {
    try {
      const res = await API.get('/registrations/my-tournaments');
      if (res.data.success) {
        setMyTournaments(res.data.registrations || []);
      }
    } catch (e) {
      console.error('Error fetching user registrations:', e);
    }
  };

  const isUserRegisteredForTournament = (tournament) => {
    if (!isAuthenticated || !user) return false;
    const tournamentId = (tournament._id || tournament).toString();
    return myTournaments.some(
      (r) => (r.tournament?._id || r.tournament).toString() === tournamentId
    );
  };

  const handleOpenRegister = (tournament) => {
    // 5. LOGIN / SIGNUP REQUIREMENT
    if (!isAuthenticated) {
      setSelectedTournament(tournament);
      setAuthModalOpen(true);
      return;
    }

    // 6. STUDENT RESTRICTION
    if (user.role !== 'student' && user.role !== 'admin') {
      addToast('Only authenticated college students can register for tournaments', 'error');
      return;
    }

    // Rule 8: Check if already registered
    if (isUserRegisteredForTournament(tournament)) {
      addToast('You are already registered for this tournament', 'warning');
      return;
    }

    setSelectedTournament(tournament);
    setNewTeamName('');
    setNewTeamType('UEM Student Team');
    setRegisterModalOpen(true);
  };

  const handleCreateTeamSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTournament) return;
    if (!newTeamName.trim()) {
      addToast('Please enter a team name', 'error');
      return;
    }

    try {
      setCreatingTeam(true);
      const res = await API.post(`/tournaments/${selectedTournament._id}/registrations/create-team`, {
        teamName: newTeamName.trim(),
        teamType: newTeamType,
      });

      if (res.data.success) {
        addToast(res.data.message || 'Squad created successfully!', 'success');
        setRegisterModalOpen(false);
        fetchUserRegistrations();
        navigate(`/tournaments/${selectedTournament._id}/register`);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Registration failed';
      addToast(errorMsg, 'error');
    } finally {
      setCreatingTeam(false);
    }
  };

  const filteredTournaments = tournaments.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.game.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-10">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-slate-950/60 backdrop-blur-xl border border-cyan-500/20 shadow-[0_10px_35px_rgba(0,0,0,0.6),0_0_20px_rgba(6,182,212,0.08)]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
            <Trophy className="w-4 h-4 text-cyan-400" />
            <span>Collegiate Esports Arena</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white font-mono mt-1 break-words">
            CAMPUS TOURNAMENTS
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Compete in official university brackets, register your squad, and track your active registrations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/points-table"
            className="px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-amber-500/40 text-amber-300 text-xs font-bold font-mono transition-all shadow-[0_0_15px_rgba(245,158,11,0.15)]"
          >
            View Points Table →
          </Link>
          {user?.role === 'admin' && (
            <Link
              to="/admin/tournaments"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-xs font-bold text-white shadow-lg shadow-fuchsia-500/20"
            >
              <Shield className="w-3.5 h-3.5" /> Admin Panel
            </Link>
          )}
        </div>
      </div>

      {/* 4.B: MY TOURNAMENTS SECTION (LOGGED-IN STUDENTS) */}
      {isAuthenticated && (
        <section className="space-y-4 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-900/40 border border-cyan-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <Trophy className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-black text-white font-mono truncate">MY TOURNAMENTS</h2>
                <p className="text-xs text-slate-400 truncate">Tournaments your squad is currently registered in</p>
              </div>
            </div>
            <span className="px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30 shrink-0">
              {myTournaments.length} Registered
            </span>
          </div>

          {myTournaments.length === 0 ? (
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center space-y-2">
              <p className="text-xs text-slate-400">You are not registered in any tournament yet.</p>
              <p className="text-[11px] text-slate-500">
                Browse the available tournaments below and click <strong>Register</strong> to participate.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 pt-1 sm:pt-2">
              {myTournaments.map((reg) => {
                const t = reg.tournament || {};
                return (
                  <div
                    key={reg._id}
                    className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] uppercase font-bold text-cyan-400 font-mono">
                          {t.game || 'TOURNAMENT'}
                        </span>
                        <h3 className="text-sm font-bold text-white font-mono truncate">{t.name || 'Tournament'}</h3>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {t.status === 'ongoing' || t.status === 'live' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 animate-pulse">
                            ● Running
                          </span>
                        ) : t.status === 'on-hold' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-950/90 text-amber-300 border border-amber-500/50">
                            ⏸️ On Hold
                          </span>
                        ) : null}
                        {reg.isVerified || reg.status === 'verified' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-500/40 shrink-0">
                            ✓ Active Team
                          </span>
                        ) : reg.status === 'rejected' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-950 text-rose-300 border border-rose-500/40 shrink-0">
                            ✕ Rejected
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-800 shrink-0">
                            ✓ Registered
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-slate-300 space-y-1 py-2 border-y border-slate-900 font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Team:</span>
                        <span className="font-bold text-white truncate">{reg.teamName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Type:</span>
                        <span className="text-cyan-400 truncate">{reg.teamType || 'UEM Student Team'}</span>
                      </div>
                    </div>

                    <Link
                      to={`/tournaments/${t.slug || t._id || reg.tournament}/register`}
                      className="text-center py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-cyan-300 transition-colors flex items-center justify-center gap-1"
                    >
                      View Squad Hub <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* 4.A: AVAILABLE TOURNAMENTS SECTION */}
      <section className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-mono">
              AVAILABLE TOURNAMENTS
            </h2>
            <p className="text-xs text-slate-400">
              Official tournaments created by club administration.
            </p>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center w-full sm:w-auto">
            <div className="relative w-full sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 sm:py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
              <select
                value={selectedGame}
                onChange={(e) => setSelectedGame(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 sm:py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="all">All Games</option>
                {games.map((g) => (
                  <option key={g._id} value={g.name}>
                    {g.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 sm:py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              >
                <option value="all">All Statuses</option>
                <option value="ongoing">● Running / Live</option>
                <option value="on-hold">⏸️ On Hold</option>
                <option value="registration-open">Registration Open</option>
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tournaments Grid */}
        {loading ? (
          <Loading message="Loading collegiate tournaments..." />
        ) : filteredTournaments.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="No tournaments found"
            description="There are currently no tournaments matching your filters."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredTournaments.map((tournament) => (
              <TournamentCard
                key={tournament._id}
                tournament={tournament}
                onRegisterClick={handleOpenRegister}
                isRegistered={isUserRegisteredForTournament(tournament)}
              />
            ))}
          </div>
        )}
      </section>

      {/* 5. VISITOR AUTH REQUIREMENT MODAL */}
      <Modal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        title="Sign In Required"
      >
        <div className="p-4 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-mono">
              Authentication Required
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Please sign in or create an account to register for a tournament.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
            <Link
              to="/login"
              state={{ from: '/tournaments' }}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors flex items-center justify-center gap-1.5"
            >
              <LogIn className="w-4 h-4" /> Sign In
            </Link>
            <Link
              to="/register"
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-xs font-bold text-white shadow-md shadow-cyan-500/20 transition-all flex items-center justify-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" /> Sign Up
            </Link>
          </div>
        </div>
      </Modal>

      {/* 7. TOURNAMENT REGISTRATION MODAL (Team Name + Team Type ONLY) */}
      <Modal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        title={`Register for ${selectedTournament?.name}`}
      >
        <form onSubmit={handleCreateTeamSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5">
              Team Name *
            </label>
            <input
              type="text"
              required
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="e.g. Team Alpha"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5">
              Team Type *
            </label>
            <select
              value={newTeamType}
              onChange={(e) => setNewTeamType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="UEM Student Team">UEM Student Team</option>
              <option value="Outside Team">Outside Team</option>
              <option value="Mixed Team">Mixed Team</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              disabled={creatingTeam}
              onClick={() => setRegisterModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creatingTeam}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-xs font-bold text-white shadow-md shadow-cyan-500/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {creatingTeam ? 'Creating Team...' : 'Create Team'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Tournaments;
