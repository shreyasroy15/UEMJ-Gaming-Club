import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import Loading from '../../components/Loading/Loading';
import EmptyState from '../../components/EmptyState/EmptyState';
import Modal from '../../components/Modal/Modal';
import CloudinaryUpload from '../../components/Upload/CloudinaryUpload';
import { useToast } from '../../context/ToastContext';
import {
  Trophy,
  Plus,
  Edit,
  Trash2,
  GitBranch,
  Calendar,
  Users,
  ExternalLink,
  FileCode,
  CheckCircle2,
  XCircle,
  Eye,
  Lock,
  ChevronDown,
  ChevronUp,
  FileText,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminTournaments = () => {
  const [tournaments, setTournaments] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  // Create / Edit modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState(null);

  // View & Verify Registered Teams state
  const [viewTeamsModalOpen, setViewTeamsModalOpen] = useState(false);
  const [viewingTournament, setViewingTournament] = useState(null);
  const [adminRegistrations, setAdminRegistrations] = useState([]);
  const [viewTeamsLoading, setViewTeamsLoading] = useState(false);
  const [teamStatusFilter, setTeamStatusFilter] = useState('all');
  const [expandedTeamId, setExpandedTeamId] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    game: 'BGMI',
    banner: '',
    description: '',
    format: 'Single Elimination',
    prizeTotal: 10000,
    entryFee: 0,
    maxTeams: 16,
    minTeamSize: 4,
    maxTeamSize: 5,
    allowSubstitutes: true,
    maxSubstitutes: 1,
    registrationDeadline: '',
    identityProofDeadline: '',
    startDate: '',
    status: 'upcoming',
  });
  const [submitting, setSubmitting] = useState(false);

  const bannerPresets = [
    { label: 'BGMI', url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Free Fire', url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Valorant', url: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=1200&q=80' },
  ];

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
      game: 'BGMI',
      banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
      description: 'Official university esports championship tournament.',
      format: 'Single Elimination',
      prizeTotal: 15000,
      entryFee: 0,
      maxTeams: 16,
      minTeamSize: 4,
      maxTeamSize: 5,
      allowSubstitutes: true,
      maxSubstitutes: 1,
      registrationDeadline: new Date(Date.now() + 7 * 24 * 3600000).toISOString().slice(0, 16),
      identityProofDeadline: new Date(Date.now() + 7 * 24 * 3600000).toISOString().slice(0, 16),
      startDate: new Date(Date.now() + 10 * 24 * 3600000).toISOString().slice(0, 16),
      status: 'registration-open',
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
      minTeamSize: tournament.minTeamSize || 4,
      maxTeamSize: tournament.maxTeamSize || 5,
      allowSubstitutes: tournament.allowSubstitutes !== false,
      maxSubstitutes: tournament.maxSubstitutes || 1,
      registrationDeadline: new Date(tournament.registrationDeadline).toISOString().slice(0, 16),
      identityProofDeadline: tournament.identityProofDeadline
        ? new Date(tournament.identityProofDeadline).toISOString().slice(0, 16)
        : new Date(tournament.registrationDeadline).toISOString().slice(0, 16),
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
        minTeamSize: Number(formData.minTeamSize) || 4,
        maxTeamSize: Number(formData.maxTeamSize) || 5,
        maxSubstitutes: Number(formData.maxSubstitutes) || 1,
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

  // View Registered Teams & Documents Handler
  const handleViewTeams = async (t) => {
    setViewingTournament(t);
    setViewTeamsModalOpen(true);
    setViewTeamsLoading(true);
    setTeamStatusFilter('all');
    setExpandedTeamId(null);
    try {
      const res = await API.get(`/tournaments/${t._id}/admin-registrations`);
      setAdminRegistrations(res.data.registrations || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to load registered teams', 'error');
    } finally {
      setViewTeamsLoading(false);
    }
  };

  // Verify / Reject Team Registration
  const handleVerifyRegistration = async (regId, status = null, identityProofStatus = null) => {
    let note = '';
    if (status === 'rejected' || identityProofStatus === 'rejected') {
      note = prompt('Please enter the reason for rejection (e.g. Invalid or unreadable college ID card in PDF):') || '';
      if (!note) return;
    }

    try {
      setVerifyingId(regId);
      const payload = {};
      if (status) payload.status = status;
      if (identityProofStatus) payload.identityProofStatus = identityProofStatus;
      if (note) payload.verificationNotes = note;

      const res = await API.put(`/registrations/${regId}/verify`, payload);

      if (res.data.success) {
        addToast('Registration verification updated successfully!', 'success');
        // Refresh list
        const refreshed = await API.get(`/tournaments/${viewingTournament._id}/admin-registrations`);
        setAdminRegistrations(refreshed.data.registrations || []);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Verification update failed', 'error');
    } finally {
      setVerifyingId(null);
    }
  };

  const filteredRegistrations = adminRegistrations.filter((r) => {
    if (teamStatusFilter === 'all') return true;
    return r.status === teamStatusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white font-mono">
            TOURNAMENT MANAGEMENT
          </h1>
          <p className="text-xs text-slate-400">
            Create tournaments, configure squad sizes, customize registration forms, and verify player rosters.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-xs font-bold text-white shadow-lg shadow-fuchsia-600/20 cursor-pointer"
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
            <table className="w-full min-w-[750px] text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 uppercase font-mono text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-4">Tournament Name</th>
                  <th className="p-4">Game</th>
                  <th className="p-4">Roster Size</th>
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
                      <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 font-mono font-bold">
                        {t.game}
                      </span>
                    </td>

                    <td className="p-4 text-slate-300 font-mono">
                      {t.minTeamSize || 4} Starters {t.allowSubstitutes !== false ? `+ ${t.maxSubstitutes || 1} Sub` : ''}
                    </td>

                    <td className="p-4 text-center font-mono font-semibold">
                      <span className="text-cyan-400">{t.registeredTeams?.length || 0}</span> / {t.maxTeams}
                    </td>

                    <td className="p-4 font-mono font-bold text-amber-400">
                      ₹{t.prizePool?.total?.toLocaleString()}
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          t.status === 'live' || t.status === 'ongoing'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : t.status === 'completed'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : t.status === 'cancelled'
                            ? 'bg-red-950/80 text-red-400 border border-red-800'
                            : 'bg-slate-900 text-cyan-400 border border-slate-800'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>

                    <td className="p-4 text-right space-x-1.5">
                      {/* Form Builder Button */}
                      <Link
                        to={`/admin/tournaments/${t._id}/form`}
                        title="Edit Dynamic Registration Form"
                        className="p-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-800/60 transition-colors inline-block align-middle cursor-pointer"
                      >
                        <FileCode className="w-3.5 h-3.5" />
                      </Link>

                      {/* View & Verify Teams */}
                      <button
                        onClick={() => handleViewTeams(t)}
                        title="View Registered Teams & Verify Documents"
                        className="p-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 transition-colors cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5" />
                      </button>

                      {/* Generate Bracket */}
                      <button
                        onClick={() => handleGenerateBracket(t._id, t.name)}
                        title="Generate Elimination Brackets"
                        className="p-1.5 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800 transition-colors cursor-pointer"
                      >
                        <GitBranch className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => handleOpenEdit(t)}
                        title="Edit Tournament"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(t._id, t.name)}
                        title="Delete Tournament"
                        className="p-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 text-rose-400 border border-rose-900 transition-colors cursor-pointer"
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
              placeholder="e.g. UEM Jaipur Tech Fest 2026 – BGMI"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Esports Game *
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

          {/* Roster Configuration */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <h4 className="text-xs font-mono font-bold text-cyan-400 uppercase">
              Roster & Team Size Rules
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Required Starters
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.minTeamSize}
                  onChange={(e) => setFormData({ ...formData, minTeamSize: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Max Roster Size
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={formData.maxTeamSize}
                  onChange={(e) => setFormData({ ...formData, maxTeamSize: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Allow Substitute
                </label>
                <select
                  value={formData.allowSubstitutes ? 'yes' : 'no'}
                  onChange={(e) => setFormData({ ...formData, allowSubstitutes: e.target.value === 'yes' })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                >
                  <option value="yes">Yes (1 sub)</option>
                  <option value="no">No</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Max Substitutes
                </label>
                <input
                  type="number"
                  min="0"
                  max="3"
                  value={formData.maxSubstitutes}
                  onChange={(e) => setFormData({ ...formData, maxSubstitutes: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white font-mono"
                />
              </div>
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                Identity Proof Deadline *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.identityProofDeadline}
                onChange={(e) => setFormData({ ...formData, identityProofDeadline: e.target.value })}
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

          {/* Cloudinary Banner Upload */}
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-300 uppercase">
                Tournament Banner Image *
              </label>
              <span className="text-[10px] text-slate-400">Presets:</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {bannerPresets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setFormData({ ...formData, banner: p.url, game: p.label })}
                  className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] font-mono text-cyan-300 cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
            <CloudinaryUpload
              value={formData.banner}
              onChange={(url) => setFormData({ ...formData, banner: url })}
              label="Upload Custom Banner via Cloudinary"
              helpText="Upload wide 16:9 banner (JPG, PNG, WEBP)"
              type="public"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
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

      {/* View & Verify Registered Teams Console Modal */}
      <Modal
        isOpen={viewTeamsModalOpen}
        onClose={() => setViewTeamsModalOpen(false)}
        title={`Registered Teams & Roster Verification: ${viewingTournament?.name || ''}`}
      >
        <div className="space-y-4 max-w-3xl">
          {/* Top Info Bar with Quick Link to Form Builder */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono">
            <div>
              <span className="text-slate-400">Total Teams:</span>{' '}
              <span className="font-bold text-cyan-400">{adminRegistrations.length}</span> / {viewingTournament?.maxTeams || 16}
            </div>
            {viewingTournament && (
              <Link
                to={`/admin/tournaments/${viewingTournament._id}/form`}
                className="text-amber-400 hover:underline flex items-center gap-1"
              >
                <FileCode className="w-3.5 h-3.5" /> Edit Registration Form Schema
              </Link>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono font-bold overflow-x-auto">
            {['all', 'incomplete', 'complete', 'verified', 'rejected'].map((st) => (
              <button
                key={st}
                onClick={() => setTeamStatusFilter(st)}
                className={`px-3 py-1 rounded-lg uppercase transition-all ${
                  teamStatusFilter === st
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {viewTeamsLoading ? (
            <Loading message="Loading registered teams and player documents..." />
          ) : filteredRegistrations.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 space-y-1">
              <p>No registered teams found matching status filter "{teamStatusFilter}".</p>
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1">
              {filteredRegistrations.map((reg, idx) => {
                const isExpanded = expandedTeamId === reg._id;
                const isComplete = reg.status === 'complete' || reg.status === 'verified';
                const minStarters = viewingTournament?.minTeamSize || 4;
                const starters = reg.players?.filter((p) => p.role === 'captain' || p.role === 'starter') || [];
                const completedStarters = starters.filter((p) => p.status === 'completed');

                // Extract team-level identity proof
                const idProofUrl = reg.identityProof?.url ||
                  (reg.teamResponses instanceof Map
                    ? (reg.teamResponses.get('team_identity_proof') || reg.teamResponses.get('identity_proof'))
                    : (reg.teamResponses?.team_identity_proof || reg.teamResponses?.identity_proof));

                const idProofStatus = reg.identityProof?.status || (idProofUrl ? 'submitted' : 'pending');

                return (
                  <div
                    key={reg._id || idx}
                    className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden text-xs"
                  >
                    {/* Team summary header */}
                    <div className="p-3.5 flex flex-wrap items-center justify-between gap-3 bg-slate-900/60">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono font-bold flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-bold text-white font-mono flex items-center gap-2">
                            <span>{reg.teamName}</span>
                            {reg.teamTag && <span className="text-indigo-400 text-[11px]">[{reg.teamTag}]</span>}
                            <span className="text-[10px] text-cyan-400 font-mono px-1.5 py-0.2 rounded bg-cyan-950">
                              {reg.teamCode}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2 font-mono">
                            <span>Leader: <strong>{(reg.leader || reg.captain)?.name}</strong></span>
                            <span>•</span>
                            <span className={completedStarters.length >= minStarters ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                              {completedStarters.length}/{minStarters} Required Players
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status & Action buttons */}
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                            reg.status === 'verified'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                              : reg.status === 'complete'
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-600'
                              : reg.status === 'rejected'
                              ? 'bg-rose-950 text-rose-300 border border-rose-600'
                              : 'bg-amber-950 text-amber-300 border border-amber-600'
                          }`}
                        >
                          {reg.status}
                        </span>

                        {/* Quick Verify / Reject Actions */}
                        {reg.status !== 'verified' && (
                          <button
                            type="button"
                            disabled={verifyingId === reg._id}
                            onClick={() => handleVerifyRegistration(reg._id, 'verified')}
                            className="p-1.5 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 cursor-pointer"
                            title="Verify and Approve Team"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {reg.status !== 'rejected' && (
                          <button
                            type="button"
                            disabled={verifyingId === reg._id}
                            onClick={() => handleVerifyRegistration(reg._id, 'rejected')}
                            className="p-1.5 rounded bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 cursor-pointer"
                            title="Reject Registration"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setExpandedTeamId(isExpanded ? null : reg._id)}
                          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                          title="View Roster Details"
                        >
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Team & Player Breakdown */}
                    {isExpanded && (
                      <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-4">
                        {reg.verificationNotes && (
                          <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/40 text-[11px] text-rose-300">
                            <strong>Admin Note:</strong> {reg.verificationNotes}
                          </div>
                        )}

                        {/* ONE Team-Level Combined Identity Proof Section */}
                        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-amber-900/40 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-amber-400" />
                              <span className="font-bold text-white font-mono uppercase text-xs">
                                Team Identity Proof (Combined 1 PDF)
                              </span>
                            </div>
                            <div className="flex items-center gap-2 font-mono">
                              <span className="text-[10px] text-slate-400">Status:</span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  idProofStatus === 'verified'
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                                    : idProofStatus === 'rejected'
                                    ? 'bg-rose-950 text-rose-300 border border-rose-600'
                                    : idProofStatus === 'submitted'
                                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-600'
                                    : 'bg-amber-950 text-amber-300 border border-amber-600'
                                }`}
                              >
                                {idProofStatus}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
                            {idProofUrl ? (
                              <div className="flex items-center gap-2">
                                <a
                                  href={idProofUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 font-bold"
                                >
                                  <FileText className="w-4 h-4 text-red-400" /> [ View Team PDF ]
                                </a>
                                {reg.identityProof?.submittedAt && (
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    Uploaded: {new Date(reg.identityProof.submittedAt).toLocaleString()}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-amber-400 font-mono text-[11px]">
                                ⏳ Pending: Squad has not yet submitted the combined identity proof PDF
                              </span>
                            )}

                            {idProofUrl && (
                              <div className="flex items-center gap-1.5">
                                {idProofStatus !== 'verified' && (
                                  <button
                                    type="button"
                                    disabled={verifyingId === reg._id}
                                    onClick={() => handleVerifyRegistration(reg._id, null, 'verified')}
                                    className="px-2.5 py-1 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 text-[11px] font-bold border border-emerald-800 flex items-center gap-1 cursor-pointer"
                                  >
                                    <CheckCircle2 className="w-3 h-3" /> Approve PDF
                                  </button>
                                )}
                                {idProofStatus !== 'rejected' && (
                                  <button
                                    type="button"
                                    disabled={verifyingId === reg._id}
                                    onClick={() => handleVerifyRegistration(reg._id, null, 'rejected')}
                                    className="px-2.5 py-1 rounded bg-rose-950 hover:bg-rose-900 text-rose-300 text-[11px] font-bold border border-rose-800 flex items-center gap-1 cursor-pointer"
                                  >
                                    <XCircle className="w-3 h-3" /> Reject PDF
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Roster Members Breakdown */}
                        <div>
                          <h4 className="text-[11px] font-mono font-bold text-slate-400 uppercase mb-2 flex items-center justify-between">
                            <span>Roster Members ({reg.players?.length || 0}):</span>
                            <span className="text-cyan-400 font-bold font-mono">
                              {completedStarters.length}/{minStarters} Starters Completed
                            </span>
                          </h4>

                          <div className="space-y-3">
                            {reg.players?.map((player) => {
                              const responses = player.responses instanceof Map
                                ? Object.fromEntries(player.responses)
                                : player.responses || {};
                              const isCompleted = player.status === 'completed';
                              const isSlotLeader = player.role === 'captain';

                              return (
                                <div
                                  key={player._id || player.slotNumber}
                                  className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-white font-mono">
                                        Player {player.slotNumber} {isCompleted ? '✓' : '⏳'}: {responses.player_name || player.user?.name}
                                      </span>
                                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase font-bold ${
                                        isSlotLeader ? 'bg-amber-950 text-amber-300' : 'bg-indigo-950 text-indigo-300'
                                      }`}>
                                        {isSlotLeader ? 'Leader' : player.role}
                                      </span>
                                    </div>
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold ${
                                        isCompleted
                                          ? 'text-emerald-400 bg-emerald-950 border border-emerald-800'
                                          : 'text-amber-400 bg-amber-950 border border-amber-800'
                                      }`}
                                    >
                                      {isCompleted ? '✓ Profile Completed' : '⏳ Details Incomplete'}
                                    </span>
                                  </div>

                                  {/* Player responses key-values (No individual ID card proof) */}
                                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px] text-slate-300 pt-1 border-t border-slate-800/60">
                                    <div>
                                      <span className="text-slate-500 block">IGN:</span>
                                      <span className="font-mono font-bold text-cyan-300">{responses.game_ign || 'N/A'}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-500 block">UID:</span>
                                      <span className="font-mono font-bold">{responses.game_uid || 'N/A'}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-500 block">College:</span>
                                      <span className="truncate block">{responses.college_name || player.user?.college || 'N/A'}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-500 block">College ID:</span>
                                      <span className="font-mono">{responses.college_id || 'N/A'}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-500 block">WhatsApp:</span>
                                      <span className="font-mono">{responses.phone_number || 'N/A'}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setViewTeamsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
            >
              Close Console
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminTournaments;
