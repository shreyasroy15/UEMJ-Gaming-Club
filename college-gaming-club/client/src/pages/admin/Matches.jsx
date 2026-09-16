import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import Loading from '../../components/Loading/Loading';
import EmptyState from '../../components/EmptyState/EmptyState';
import Modal from '../../components/Modal/Modal';
import { useToast } from '../../context/ToastContext';
import { Swords, Edit, Trash2, CheckCircle2, Video } from 'lucide-react';

const AdminMatches = () => {
  const [matches, setMatches] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState('all');
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  // Edit match modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentMatch, setCurrentMatch] = useState(null);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [winnerId, setWinnerId] = useState('');
  const [status, setStatus] = useState('scheduled');
  const [streamUrl, setStreamUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTournaments();
    fetchMatches();
  }, [selectedTournament]);

  const fetchTournaments = async () => {
    try {
      const res = await API.get('/tournaments');
      setTournaments(res.data.tournaments || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const url = selectedTournament === 'all' ? '/matches' : `/matches?tournament=${selectedTournament}`;
      const res = await API.get(url);
      setMatches(res.data.matches || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to load matches', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (match) => {
    setCurrentMatch(match);
    setScoreA(match.scoreA || 0);
    setScoreB(match.scoreB || 0);
    setWinnerId(match.winner?._id || '');
    setStatus(match.status || 'scheduled');
    setStreamUrl(match.streamUrl || '');
    setEditModalOpen(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await API.put(`/matches/${currentMatch._id}`, {
        scoreA: Number(scoreA),
        scoreB: Number(scoreB),
        winner: winnerId || null,
        status,
        streamUrl,
      });

      if (res.data.success) {
        addToast('Match updated successfully!', 'success');
        setEditModalOpen(false);
        fetchMatches();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update match', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMatch = async (matchId) => {
    if (!window.confirm('Are you sure you want to delete this match?')) return;

    try {
      await API.delete(`/matches/${matchId}`);
      addToast('Match fixture removed', 'success');
      fetchMatches();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete match', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white font-mono">
            MATCH FIXTURES & LIVE SCORING
          </h1>
          <p className="text-xs text-slate-400">
            Control tournament rounds, enter live scores, set match winners, and attach live stream links.
          </p>
        </div>

        {/* Tournament Filter */}
        <select
          value={selectedTournament}
          onChange={(e) => setSelectedTournament(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
        >
          <option value="all">All Tournaments</option>
          {tournaments.map((t) => (
            <option key={t._id} value={t._id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Matches Table */}
      {loading ? (
        <Loading message="Fetching match fixtures..." />
      ) : matches.length === 0 ? (
        <EmptyState
          icon={Swords}
          title="No matches found"
          description="Generate brackets from the Tournaments tab to create match fixtures."
        />
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 uppercase font-mono text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-4">Match</th>
                  <th className="p-4">Tournament</th>
                  <th className="p-4">Team A</th>
                  <th className="p-4 text-center">Score</th>
                  <th className="p-4">Team B</th>
                  <th className="p-4">Winner</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {matches.map((m) => (
                  <tr key={m._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-white">
                      #{m.matchNumber} <span className="text-slate-500 text-[10px]">({m.round})</span>
                    </td>

                    <td className="p-4 text-slate-300 truncate max-w-xs font-mono">
                      {m.tournament?.name || 'Tournament'}
                    </td>

                    <td className="p-4 font-bold text-slate-200">
                      <div className="flex items-center gap-2">
                        <img
                          src={m.teamA?.logo || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=100&q=80'}
                          alt={m.teamA?.name || 'TBD'}
                          className="w-5 h-5 rounded object-cover"
                        />
                        <span>{m.teamA?.name || 'TBD'}</span>
                      </div>
                    </td>

                    <td className="p-4 text-center font-mono font-black text-cyan-300">
                      {m.scoreA ?? 0} : {m.scoreB ?? 0}
                    </td>

                    <td className="p-4 font-bold text-slate-200">
                      <div className="flex items-center gap-2">
                        <img
                          src={m.teamB?.logo || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=100&q=80'}
                          alt={m.teamB?.name || 'TBD'}
                          className="w-5 h-5 rounded object-cover"
                        />
                        <span>{m.teamB?.name || 'TBD'}</span>
                      </div>
                    </td>

                    <td className="p-4 font-mono text-amber-400 font-bold">
                      {m.winner?.name || '—'}
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          m.status === 'live'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800 animate-pulse'
                            : m.status === 'completed'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>

                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(m)}
                        title="Update Match"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteMatch(m._id)}
                        title="Delete Match"
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

      {/* Edit Match Score Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Edit Match #${currentMatch?.matchNumber}`}
      >
        <form onSubmit={handleUpdateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                {currentMatch?.teamA?.name || 'Team A'} Score
              </label>
              <input
                type="number"
                min="0"
                value={scoreA}
                onChange={(e) => setScoreA(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                {currentMatch?.teamB?.name || 'Team B'} Score
              </label>
              <input
                type="number"
                min="0"
                value={scoreB}
                onChange={(e) => setScoreB(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Match Winner
            </label>
            <select
              value={winnerId}
              onChange={(e) => setWinnerId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
            >
              <option value="">No winner decided yet</option>
              {currentMatch?.teamA && (
                <option value={currentMatch.teamA._id}>
                  {currentMatch.teamA.name}
                </option>
              )}
              {currentMatch?.teamB && (
                <option value={currentMatch.teamB._id}>
                  {currentMatch.teamB.name}
                </option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Match Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
            >
              <option value="scheduled">Scheduled</option>
              <option value="live">Live Now</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Live Stream URL (Twitch / YouTube)
            </label>
            <input
              type="url"
              placeholder="https://twitch.tv/..."
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
            />
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
              {submitting ? 'Saving...' : 'Save Match'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminMatches;
