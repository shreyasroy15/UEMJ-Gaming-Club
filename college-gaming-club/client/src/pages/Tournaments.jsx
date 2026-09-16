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
  const [userTeams, setUserTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedGame, setSelectedGame] = useState(initialGame);
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [registrationResult, setRegistrationResult] = useState(null);

  // Registration Form State
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [registrationMode, setRegistrationMode] = useState('existing'); // 'existing' | 'new'
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamTag, setNewTeamTag] = useState('');
  const [inGameName, setInGameName] = useState('');
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    fetchGames();
    fetchTournaments();
  }, [selectedGame, selectedStatus]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserTeamsAndRegistrations();
    } else {
      setMyTournaments([]);
      setUserTeams([]);
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

  const fetchUserTeamsAndRegistrations = async () => {
    try {
      const res = await API.get('/teams');
      const allTeams = res.data.teams || [];
      const userSquads = allTeams.filter(
        (t) =>
          (t.captain?._id || t.captain) === user._id ||
          t.members?.some((m) => (m.user?._id || m.user) === user._id)
      );
      setUserTeams(userSquads);
      if (userSquads.length > 0 && !selectedTeamId) {
        setSelectedTeamId(userSquads[0]._id);
      }

      // Filter My Tournaments
      const userSquadIds = userSquads.map((s) => s._id.toString());
      const userRegs = tournaments
        .map((t) => {
          const registeredReg = t.registeredTeams?.find(
            (r) => r.team && userSquadIds.includes((r.team._id || r.team).toString())
          );
          if (registeredReg) {
            const teamObj = userSquads.find(
              (s) => s._id.toString() === (registeredReg.team._id || registeredReg.team).toString()
            );
            return {
              tournament: t,
              teamName: teamObj?.name || 'Registered Squad',
              registeredAt: registeredReg.registeredAt,
            };
          }
          return null;
        })
        .filter(Boolean);

      setMyTournaments(userRegs);
    } catch (e) {
      console.error('Error fetching teams:', e);
    }
  };

  const isUserRegisteredForTournament = (tournament) => {
    if (!isAuthenticated || !user) return false;
    const userSquadIds = userTeams.map((s) => s._id.toString());
    return tournament.registeredTeams?.some(
      (r) => r.team && userSquadIds.includes((r.team._id || r.team).toString())
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
    setInGameName(user.username || '');
    setNewTeamName('');
    setNewTeamTag('');
    setRegistrationMode(userTeams.length > 0 ? 'existing' : 'new');
    setRegisterModalOpen(true);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTournament) return;

    const payload = {};
    if (registrationMode === 'existing') {
      if (!selectedTeamId) {
        addToast('Please select a team', 'error');
        return;
      }
      payload.teamId = selectedTeamId;
    } else {
      if (!newTeamName.trim()) {
        addToast('Please enter a team name', 'error');
        return;
      }
      payload.teamName = newTeamName.trim();
      payload.inGameName = inGameName.trim() || user.username;
      payload.tag = newTeamTag.trim() || undefined;
    }

    try {
      setRegistering(true);
      const res = await API.post(`/tournaments/${selectedTournament._id}/register`, payload);

      if (res.data.success) {
        setRegistrationResult({
          tournamentName: res.data.tournament || selectedTournament.name,
          teamName: res.data.team || newTeamName || 'Your Squad',
          registrationId: res.data.registrationId,
        });
        setRegisterModalOpen(false);
        setSuccessModalOpen(true);
        fetchTournaments();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Registration failed';
      addToast(errorMsg, 'error');
    } finally {
      setRegistering(false);
    }
  };

  const filteredTournaments = tournaments.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.game.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-10">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-900">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
            <Trophy className="w-4 h-4 text-cyan-400" />
            <span>Collegiate Esports Arena</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white font-mono mt-1 break-words">
            CAMPUS TOURNAMENTS
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Compete in official university brackets, register your squad, and track your active registrations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/points-table"
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-400 text-xs font-bold font-mono transition-colors"
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
              {myTournaments.map(({ tournament: t, teamName, registeredAt }) => (
                <div
                  key={t._id}
                  className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] uppercase font-bold text-cyan-400 font-mono">
                        {t.game}
                      </span>
                      <h3 className="text-sm font-bold text-white font-mono truncate">{t.name}</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-800 shrink-0">
                      ✓ Registered
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 space-y-1 py-2 border-y border-slate-900 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Team:</span>
                      <span className="font-bold text-white truncate">{teamName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Date:</span>
                      <span>{new Date(t.startDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <Link
                    to={`/tournaments/${t.slug || t._id}`}
                    className="text-center py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-cyan-300 transition-colors flex items-center justify-center gap-1"
                  >
                    View Details <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
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
                className="w-full sm:w-auto px-3 py-2 sm:py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="all">All Statuses</option>
                <option value="upcoming">Upcoming</option>
                <option value="registration-open">Registration Open</option>
                <option value="ongoing">Ongoing</option>
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

      {/* 7. TOURNAMENT REGISTRATION MODAL */}
      <Modal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        title={`Register for ${selectedTournament?.name}`}
      >
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Game:</span>
              <span className="font-bold text-cyan-300">{selectedTournament?.game}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Format:</span>
              <span className="text-white">{selectedTournament?.format}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Entry Fee:</span>
              <span className="text-emerald-400">
                {selectedTournament?.entryFee === 0 ? 'Free Entry' : `₹${selectedTournament?.entryFee}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Deadline:</span>
              <span className="text-amber-300">
                {selectedTournament?.registrationDeadline ? new Date(selectedTournament.registrationDeadline).toLocaleString() : 'N/A'}
              </span>
            </div>
          </div>

          {/* Registration Mode Selector */}
          <div className="flex gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setRegistrationMode('existing')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                registrationMode === 'existing'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Select Existing Squad
            </button>
            <button
              type="button"
              onClick={() => setRegistrationMode('new')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                registrationMode === 'new'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Register New Squad
            </button>
          </div>

          {registrationMode === 'existing' ? (
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Choose Team (You are Captain/Member)
              </label>
              {userTeams.length === 0 ? (
                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200 space-y-2">
                  <p>You have no existing teams registered.</p>
                  <button
                    type="button"
                    onClick={() => setRegistrationMode('new')}
                    className="font-bold text-cyan-400 underline"
                  >
                    Click here to register a new team right now
                  </button>
                </div>
              ) : (
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                >
                  {userTeams.map((team) => (
                    <option key={team._id} value={team._id}>
                      {team.name} ({team.game}) - [{team.members?.length || 1} members]
                    </option>
                  ))}
                </select>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Team / Squad Name *
                </label>
                <input
                  type="text"
                  required
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g. Team Alpha"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Squad Tag (3-4 letters)
                  </label>
                  <input
                    type="text"
                    maxLength={5}
                    value={newTeamTag}
                    onChange={(e) => setNewTeamTag(e.target.value.toUpperCase())}
                    placeholder="e.g. ALPH"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Captain In-Game Name / ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={inGameName}
                    onChange={(e) => setInGameName(e.target.value)}
                    placeholder="e.g. Alpha_IGL"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setRegisterModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={registering}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-xs font-bold text-white shadow-md shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
            >
              {registering ? 'Submitting...' : 'Confirm Registration'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 7. REGISTRATION SUCCESS CONFIRMATION MODAL */}
      <Modal
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        title="Registration Successful"
      >
        <div className="p-4 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-base font-black text-white font-mono uppercase tracking-wide">
              REGISTRATION CONFIRMED
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Your squad has been officially entered into the tournament bracket.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-left space-y-2 font-mono">
            <div className="flex justify-between border-b border-slate-900 pb-1.5">
              <span className="text-slate-400">Tournament:</span>
              <span className="font-bold text-white">{registrationResult?.tournamentName}</span>
            </div>
            <div className="flex justify-between border-b border-slate-900 pb-1.5">
              <span className="text-slate-400">Team:</span>
              <span className="font-bold text-cyan-300">{registrationResult?.teamName}</span>
            </div>
            <div className="flex justify-between border-b border-slate-900 pb-1.5">
              <span className="text-slate-400">Registration ID:</span>
              <span className="font-bold text-amber-400">{registrationResult?.registrationId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Status:</span>
              <span className="font-bold text-emerald-400">Registered & Confirmed</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSuccessModalOpen(false)}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Tournaments;
