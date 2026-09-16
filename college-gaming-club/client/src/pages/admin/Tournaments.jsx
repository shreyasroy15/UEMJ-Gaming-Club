import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import Loading from '../../components/Loading/Loading';
import EmptyState from '../../components/EmptyState/EmptyState';
import Modal from '../../components/Modal/Modal';
import { useToast } from '../../context/ToastContext';
import { Trophy, Plus, Edit, Trash2, GitBranch, Calendar, Users, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminTournaments = () => {
  const [tournaments, setTournaments] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  // Create / Edit modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    game: 'Valorant',
    banner: '',
    description: '',
    format: 'Single Elimination',
    prizeTotal: 10000,
    entryFee: 0,
    maxTeams: 16,
    registrationDeadline: '',
    startDate: '',
    status: 'upcoming',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tRes, gRes] = await Promise.all([
        API.get('/tournaments'),
        API.get('/games'),
      ]);
      setTournaments(tRes.data.tournaments || []);
      setGames(gRes.data.games || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to load tournament records', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingTournament(null);
    setFormData({
      name: '',
      game: games[0]?.name || 'Valorant',
      banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
      description: 'Competitive varsity gaming tournament.',
      format: 'Single Elimination',
      prizeTotal: 15000,
      entryFee: 0,
      maxTeams: 16,
      registrationDeadline: new Date(Date.now() + 7 * 24 * 3600000).toISOString().slice(0, 16),
      startDate: new Date(Date.now() + 10 * 24 * 3600000).toISOString().slice(0, 16),
      status: 'upcoming',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (tournament) => {
    setEditingTournament(tournament);
    setFormData({
      name: tournament.name,
      game: tournament.game,
      banner: tournament.banner,
      description: tournament.description,
      format: tournament.format || 'Single Elimination',
      prizeTotal: tournament.prizePool?.total || 10000,
      entryFee: tournament.entryFee || 0,
      maxTeams: tournament.maxTeams || 16,
      registrationDeadline: new Date(tournament.registrationDeadline).toISOString().slice(0, 16),
      startDate: new Date(tournament.startDate).toISOString().slice(0, 16),
      status: tournament.status || 'upcoming',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        prizePool: {
          total: Number(formData.prizeTotal),
          currency: 'INR (₹)',
        },
      };

      if (editingTournament) {
        await API.put(`/tournaments/${editingTournament._id}`, payload);
        addToast('Tournament updated successfully!', 'success');
      } else {
        await API.post('/tournaments', payload);
        addToast('Tournament created successfully!', 'success');
      }

      setModalOpen(false);
      fetchData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Action failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (tId, tName) => {
    if (!window.confirm(`Are you sure you want to delete tournament "${tName}"? This also removes its bracket matches.`)) {
      return;
    }

    try {
      await API.delete(`/tournaments/${tId}`);
      addToast('Tournament deleted', 'success');
      fetchData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Delete failed', 'error');
    }
  };

  // Generate Bracket Button
  const handleGenerateBracket = async (tId, tName) => {
    if (!window.confirm(`Generate automated elimination bracket matches for "${tName}"? Existing matches for this tournament will be reset.`)) {
      return;
    }

    try {
      const res = await API.post(`/tournaments/${tId}/generate-bracket`);
      if (res.data.success) {
        addToast(res.data.message || 'Bracket matches generated!', 'success');
        fetchData();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to generate brackets. Need at least 2 registered teams.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white font-mono">
            TOURNAMENT MANAGEMENT
          </h1>
          <p className="text-xs text-slate-400">
            Create tournaments, configure prize pools, manage registrations, and generate playoff brackets.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-xs font-bold text-white shadow-lg shadow-fuchsia-600/20"
        >
          <Plus className="w-4 h-4" /> Create Tournament
        </button>
      </div>

      {/* Tournaments Table */}
      {loading ? (
        <Loading message="Loading tournaments..." />
      ) : tournaments.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No tournaments found"
          description="Create your first collegiate tournament to kick off the season."
        />
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 uppercase font-mono text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-4">Tournament Name</th>
                  <th className="p-4">Game</th>
                  <th className="p-4">Format</th>
                  <th className="p-4 text-center">Teams Registered</th>
                  <th className="p-4">Prize Pool</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {tournaments.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-bold text-white font-mono">
                      <Link
                        to={`/tournaments/${t.slug || t._id}`}
                        className="hover:text-cyan-400 flex items-center gap-1.5"
                      >
                        {t.name} <ExternalLink className="w-3 h-3 text-slate-500" />
                      </Link>
                    </td>

                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                        {t.game}
                      </span>
                    </td>

                    <td className="p-4 text-slate-400 font-mono">{t.format}</td>

                    <td className="p-4 text-center font-mono font-semibold">
                      <span className="text-cyan-400">{t.registeredTeams?.length || 0}</span> / {t.maxTeams}
                    </td>

                    <td className="p-4 font-mono font-bold text-amber-400">
                      ₹{t.prizePool?.total?.toLocaleString()}
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          t.status === 'live'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : t.status === 'completed'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-slate-900 text-cyan-400 border border-slate-800'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>

                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleGenerateBracket(t._id, t.name)}
                        title="Generate Elimination Brackets"
                        className="p-1.5 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800 transition-colors"
                      >
                        <GitBranch className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(t)}
                        title="Edit Tournament"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(t._id, t.name)}
                        title="Delete Tournament"
                        className="p-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 text-rose-400 border border-rose-900 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Tournament Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTournament ? 'Edit Tournament Details' : 'Create New Tournament'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Tournament Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Game Title *
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

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Format
              </label>
              <select
                value={formData.format}
                onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="Single Elimination">Single Elimination</option>
                <option value="Double Elimination">Double Elimination</option>
                <option value="Round Robin">Round Robin</option>
                <option value="Swiss">Swiss</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Prize Pool (₹)
              </label>
              <input
                type="number"
                min="0"
                value={formData.prizeTotal}
                onChange={(e) => setFormData({ ...formData, prizeTotal: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Entry Fee (₹)
              </label>
              <input
                type="number"
                min="0"
                value={formData.entryFee}
                onChange={(e) => setFormData({ ...formData, entryFee: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Max Teams
              </label>
              <input
                type="number"
                min="2"
                max="64"
                value={formData.maxTeams}
                onChange={(e) => setFormData({ ...formData, maxTeams: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Registration Deadline *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.registrationDeadline}
                onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Tournament Start Date *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Banner URL
            </label>
            <input
              type="url"
              required
              value={formData.banner}
              onChange={(e) => setFormData({ ...formData, banner: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Description
            </label>
            <textarea
              rows="3"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
            >
              <option value="upcoming">Upcoming</option>
              <option value="live">Live</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-xs font-bold text-white shadow-md shadow-fuchsia-600/20 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingTournament ? 'Update Tournament' : 'Create Tournament'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminTournaments;
