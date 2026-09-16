import React, { useState, useEffect } from 'react';
import ScrollAnimation from 'react-animate-on-scroll';
import API from '../services/api';
import TournamentCard from '../components/TournamentCard/TournamentCard';
import Loading from '../components/Loading/Loading';
import EmptyState from '../components/EmptyState/EmptyState';
import Modal from '../components/Modal/Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Trophy, Search, Filter, Sparkles, Plus } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

const Tournaments = () => {
  const [searchParams] = useSearchParams();
  const initialGame = searchParams.get('game') || 'all';

  const { user, isAuthenticated, isStaff } = useAuth();
  const { addToast } = useToast();

  const [tournaments, setTournaments] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedGame, setSelectedGame] = useState(initialGame);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('startDate');

  // Registration modal
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [userTeams, setUserTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    fetchGames();
    fetchTournaments();
  }, [selectedGame, selectedStatus, sortBy]);

  const fetchGames = async () => {
    try {
      const res = await API.get('/games');
      setGames(res.data.games || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedGame !== 'all') params.append('game', selectedGame);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (sortBy === 'prize') params.append('sort', 'prize');

      const res = await API.get(`/tournaments?${params.toString()}`);
      setTournaments(res.data.tournaments || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to load tournaments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRegister = (tournament) => {
    if (!isAuthenticated) {
      addToast('Please login to register a team', 'info');
      return;
    }
    setSelectedTournament(tournament);
    setRegisterModalOpen(true);

    // Fetch user teams
    API.get('/teams')
      .then((res) => {
        const myTeams = (res.data.teams || []).filter(
          (t) => (t.captain?._id || t.captain) === user._id
        );
        setUserTeams(myTeams);
        if (myTeams.length > 0) setSelectedTeamId(myTeams[0]._id);
      })
      .catch((e) => console.error(e));
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTeamId) {
      addToast('Please select a team', 'error');
      return;
    }

    try {
      setRegistering(true);
      const res = await API.post(`/tournaments/${selectedTournament._id}/register`, {
        teamId: selectedTeamId,
      });

      if (res.data.success) {
        addToast(res.data.message || 'Team registered successfully!', 'success');
        setRegisterModalOpen(false);
        fetchTournaments();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Registration failed', 'error');
    } finally {
      setRegistering(false);
    }
  };

  const filteredTournaments = tournaments.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Header Banner */}
      <ScrollAnimation animateIn="fadeInDown" animateOnce={false} duration={0.45} offset={60} initiallyVisible={true}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-900">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
              <Trophy className="w-4 h-4 text-cyan-400" />
              <span>Collegiate Esports Arena</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white font-mono mt-1 break-words">
              TOURNAMENTS & CHAMPIONSHIPS
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Register your squad, check battle brackets, track live match scores, and conquer collegiate gaming trophies.
            </p>
          </div>

          {isStaff && (
            <Link
              to="/admin/tournaments"
              className="self-start md:self-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-xs font-bold text-white shadow-lg shadow-fuchsia-500/20"
            >
              <Plus className="w-4 h-4" /> Create Tournament
            </Link>
          )}
        </div>
      </ScrollAnimation>

      {/* Search & Filters Toolbar */}
      <ScrollAnimation animateIn="fadeInUp" animateOnce={false} duration={0.45} offset={60} delay={40} initiallyVisible={true}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tournaments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Game Filter */}
          <select
            value={selectedGame}
            onChange={(e) => setSelectedGame(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Games</option>
            {games.map((g) => (
              <option key={g._id} value={g.name}>
                {g.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Statuses</option>
            <option value="upcoming">Upcoming</option>
            <option value="live">Live Now</option>
            <option value="completed">Completed</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="startDate">Sort by Start Date</option>
            <option value="prize">Sort by Prize Pool (Highest)</option>
          </select>
        </div>
      </ScrollAnimation>

      {/* Tournaments Grid */}
      {loading ? (
        <Loading message="Loading college tournaments..." />
      ) : filteredTournaments.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No tournaments found"
          description="Try adjusting your filters or search keywords to find open tournaments."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTournaments.map((tournament, idx) => (
            <ScrollAnimation
              key={tournament._id}
              animateIn="fadeInUp"
              animateOnce={false}
              duration={0.45}
              offset={60}
              delay={Math.min(idx * 40, 160)}
              className="h-full"
            >
              <TournamentCard
                tournament={tournament}
                onRegisterClick={handleOpenRegister}
              />
            </ScrollAnimation>
          ))}
        </div>
      )}

      {/* Registration Modal */}
      <Modal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        title={`Register for ${selectedTournament?.name || 'Tournament'}`}
      >
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
            <p className="text-slate-300">
              <strong>Game:</strong> {selectedTournament?.game}
            </p>
            <p className="text-slate-300">
              <strong>Format:</strong> {selectedTournament?.format}
            </p>
            <p className="text-slate-300">
              <strong>Entry Fee:</strong> {selectedTournament?.entryFee === 0 ? 'Free' : `₹${selectedTournament?.entryFee}`}
            </p>
            <p className="text-slate-300">
              <strong>Deadline:</strong> {new Date(selectedTournament?.registrationDeadline).toLocaleString()}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Select Your Team (You must be Captain)
            </label>
            {userTeams.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200 space-y-2">
                <p>You have not created any team yet.</p>
                <Link
                  to="/teams"
                  onClick={() => setRegisterModalOpen(false)}
                  className="inline-block font-bold text-cyan-400 underline"
                >
                  Create a Team first
                </Link>
              </div>
            ) : (
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                {userTeams.map((team) => (
                  <option key={team._id} value={team._id}>
                    {team.name} ({team.game}) - [{team.members?.length || 1} members]
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setRegisterModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            {userTeams.length > 0 && (
              <button
                type="submit"
                disabled={registering}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-xs font-bold text-white shadow-md shadow-cyan-500/20 disabled:opacity-50"
              >
                {registering ? 'Registering...' : 'Confirm Registration'}
              </button>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Tournaments;
