import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import Loading from '../../components/Loading/Loading';
import EmptyState from '../../components/EmptyState/EmptyState';
import Modal from '../../components/Modal/Modal';
import { useToast } from '../../context/ToastContext';
import { Shield, Edit, Trash2, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminTeams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [points, setPoints] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const res = await API.get('/teams');
      setTeams(res.data.teams || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to load teams', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (team) => {
    setEditingTeam(team);
    setWins(team.wins || 0);
    setLosses(team.losses || 0);
    setPoints(team.points || 0);
    setEditModalOpen(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await API.put(`/teams/${editingTeam._id}`, {
        wins: Number(wins),
        losses: Number(losses),
        points: Number(points),
      });

      if (res.data.success) {
        addToast('Team record updated successfully', 'success');
        setEditModalOpen(false);
        fetchTeams();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update team', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTeam = async (teamId, teamName) => {
    if (!window.confirm(`Permanently delete team "${teamName}"?`)) return;

    try {
      await API.delete(`/teams/${teamId}`);
      addToast('Team removed from arena', 'success');
      fetchTeams();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete team', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-black text-white font-mono">
          TEAM ROSTERS & STANDINGS
        </h1>
        <p className="text-xs text-slate-400">
          Supervise varsity teams, adjust standings points, inspect rosters, and manage student clubs.
        </p>
      </div>

      {loading ? (
        <Loading message="Loading teams..." />
      ) : teams.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="No teams found"
          description="There are no teams created yet."
        />
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 uppercase font-mono text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-4">Team</th>
                  <th className="p-4">Game</th>
                  <th className="p-4">Captain</th>
                  <th className="p-4 text-center">Roster</th>
                  <th className="p-4 text-center">Wins</th>
                  <th className="p-4 text-center">Losses</th>
                  <th className="p-4 text-right">Points</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {teams.map((team) => (
                  <tr key={team._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4">
                      <Link
                        to={`/teams/${team._id}`}
                        className="flex items-center gap-3 font-bold text-white hover:text-cyan-400 font-mono"
                      >
                        <img
                          src={team.logo || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=100&q=80'}
                          alt={team.name}
                          className="w-7 h-7 rounded-lg object-cover"
                        />
                        <span>{team.name}</span>
                        {team.tag && (
                          <span className="text-[10px] text-indigo-400 font-mono">[{team.tag}]</span>
                        )}
                      </Link>
                    </td>

                    <td className="p-4 text-slate-300 font-semibold">{team.game}</td>

                    <td className="p-4 text-slate-400">
                      {team.captain?.name || team.captain?.username || 'Active'}
                    </td>

                    <td className="p-4 text-center font-mono">
                      {team.members?.length || 1}
                    </td>

                    <td className="p-4 text-center font-mono text-emerald-400 font-bold">
                      {team.wins || 0}
                    </td>

                    <td className="p-4 text-center font-mono text-rose-400 font-bold">
                      {team.losses || 0}
                    </td>

                    <td className="p-4 text-right font-mono font-black text-amber-400">
                      {team.points || 0} PTS
                    </td>

                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(team)}
                        title="Edit Standings Points"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTeam(team._id, team.name)}
                        title="Delete Team"
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

      {/* Edit Stats Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Edit Standings for ${editingTeam?.name}`}
      >
        <form onSubmit={handleUpdateSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Wins
              </label>
              <input
                type="number"
                min="0"
                value={wins}
                onChange={(e) => setWins(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Losses
              </label>
              <input
                type="number"
                min="0"
                value={losses}
                onChange={(e) => setLosses(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Points
              </label>
              <input
                type="number"
                min="0"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-xs font-bold text-slate-950 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Standings'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminTeams;
