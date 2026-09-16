import React, { useState, useEffect } from 'react';
import API from '../services/api';
import TeamCard from '../components/TeamCard/TeamCard';
import Loading from '../components/Loading/Loading';
import EmptyState from '../components/EmptyState/EmptyState';
import Modal from '../components/Modal/Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Shield, Plus, Search, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Teams = () => {
  const { user, isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [teams, setTeams] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedGame, setSelectedGame] = useState('all');

  // Create Team Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    tag: '',
    game: 'Valorant',
    logo: '',
    description: '',
    inGameName: '',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchGames();
    fetchTeams();
  }, [selectedGame]);

  const fetchGames = async () => {
    try {
      const res = await API.get('/games');
      setGames(res.data.games || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const url = selectedGame === 'all' ? '/teams' : `/teams?game=${encodeURIComponent(selectedGame)}`;
      const res = await API.get(url);
      setTeams(res.data.teams || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to load teams', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    if (!isAuthenticated) {
      addToast('Please login to create a team', 'info');
      navigate('/login');
      return;
    }
    setCreateModalOpen(true);
  };

  const handleCreateTeamSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.game) {
      addToast('Please provide team name and game', 'error');
      return;
    }

    try {
      setCreating(true);
      const res = await API.post('/teams', formData);
      if (res.data.success) {
        addToast(`Team ${res.data.team.name} created successfully!`, 'success');
        setCreateModalOpen(false);
        setFormData({
          name: '',
          tag: '',
          game: 'Valorant',
          logo: '',
          description: '',
          inGameName: '',
        });
        fetchTeams();
        navigate(`/teams/${res.data.team._id}`);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create team', 'error');
    } finally {
      setCreating(false);
    }
  };

  const filteredTeams = teams.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.tag && t.tag.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-900">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
            <Shield className="w-4 h-4" />
            <span>Collegiate Rosters</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white font-mono mt-1 break-words">
            CAMPUS TEAMS & SQUADS
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Browse registered collegiate teams, scout players, or form your own competitive roster.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Create New Team
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search teams by name or tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        <select
          value={selectedGame}
          onChange={(e) => setSelectedGame(e.target.value)}
          className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
        >
          <option value="all">All Games</option>
          {games.map((g) => (
            <option key={g._id} value={g.name}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <Loading message="Loading collegiate teams..." />
      ) : filteredTeams.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No teams found"
          description="Be the first to create a team for this game!"
          action={
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-xs font-bold text-slate-950"
            >
              Create Team Now
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((team) => (
            <TeamCard key={team._id} team={team} />
          ))}
        </div>
      )}

      {/* Create Team Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Esports Team"
      >
        <form onSubmit={handleCreateTeamSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Team Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Phoenix Titans"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Team Tag (Max 5 chars)
              </label>
              <input
                type="text"
                maxLength="5"
                placeholder="e.g. PHX"
                value={formData.tag}
                onChange={(e) => setFormData({ ...formData, tag: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white uppercase focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Game *
              </label>
              <select
                value={formData.game}
                onChange={(e) => setFormData({ ...formData, game: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                {games.map((g) => (
                  <option key={g._id} value={g.name}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Your In-Game Name (IGN)
            </label>
            <input
              type="text"
              placeholder="e.g. Phoenix#1337"
              value={formData.inGameName}
              onChange={(e) => setFormData({ ...formData, inGameName: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Team Logo URL
            </label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={formData.logo}
              onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Description / Bio
            </label>
            <textarea
              rows="3"
              placeholder="Tell others about your team, training schedule, and goals..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-xs font-bold text-white shadow-md shadow-cyan-500/20 disabled:opacity-50"
            >
              {creating ? 'Creating Team...' : 'Create Team'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Teams;
