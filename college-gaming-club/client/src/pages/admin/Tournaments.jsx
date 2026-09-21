import React, { useState, useEffect, useMemo } from 'react';
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
  Swords,
  Search,
  X,
  Filter,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import RejectionModal from '../../components/RejectionModal/RejectionModal';

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
  const [verifyingId, setVerifyingId] = useState(null);
  const [expandedTeamId, setExpandedTeamId] = useState(null);
  const [teamStatusFilter, setTeamStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [teamSearchQuery, setTeamSearchQuery] = useState('');

  // Rejection Modal State
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);

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

  // Open Rejection Modal
  const handleOpenRejectModal = (reg, isPdfOnly = false) => {
    setRejectTarget({
      regId: reg._id,
      status: isPdfOnly ? null : 'rejected',
      identityProofStatus: 'rejected',
      teamName: reg.teamName,
    });
    setRejectionModalOpen(true);
  };

  // Confirm Rejection with Reason
  const handleConfirmRejection = async (reason) => {
    if (!rejectTarget) return;
    try {
      setVerifyingId(rejectTarget.regId);
      const payload = {
        status: rejectTarget.status || 'rejected',
        identityProofStatus: 'rejected',
        verificationNotes: reason,
      };

      const res = await API.put(`/registrations/${rejectTarget.regId}/verify`, payload);
      if (res.data.success) {
        addToast(`Team "${rejectTarget.teamName}" rejected. Notification sent to squad with cause.`, 'info');
        setRejectionModalOpen(false);
        setRejectTarget(null);
        if (viewingTournament) {
          const refreshed = await API.get(`/tournaments/${viewingTournament._id}/admin-registrations`);
          setAdminRegistrations(refreshed.data.registrations || []);
        }
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Rejection failed', 'error');
    } finally {
      setVerifyingId(null);
    }
  };

  // Approve Team Registration
  const handleApproveRegistration = async (reg) => {
    try {
      setVerifyingId(reg._id);
      const payload = {
        status: 'verified',
        identityProofStatus: 'verified',
        verificationNotes: 'All squad documents verified and approved.',
      };

      const res = await API.put(`/registrations/${reg._id}/verify`, payload);
      if (res.data.success) {
        addToast(`Team "${reg.teamName}" verified and approved as active! Notification sent to squad.`, 'success');
        if (viewingTournament) {
          const refreshed = await API.get(`/tournaments/${viewingTournament._id}/admin-registrations`);
          setAdminRegistrations(refreshed.data.registrations || []);
        }
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Approval failed', 'error');
    } finally {
      setVerifyingId(null);
    }
  };

  const filteredRegistrations = useMemo(() => {
    return adminRegistrations.filter((r) => {
      if (teamStatusFilter !== 'all' && r.status !== teamStatusFilter) return false;
      if (teamSearchQuery.trim()) {
        const q = teamSearchQuery.toLowerCase().trim();
        const matchesName = (r.teamName || '').toLowerCase().includes(q);
        const matchesCode = (r.teamCode || '').toLowerCase().includes(q);
        const matchesLeader = (r.leader?.name || r.captain?.name || '').toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesLeader) return false;
      }
      return true;
    });
  }, [adminRegistrations, teamStatusFilter, teamSearchQuery]);

  const filteredTournaments = useMemo(() => {
    return tournaments.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (t.name || '').toLowerCase().includes(q);
        const matchesGame = (t.game || '').toLowerCase().includes(q);
        const matchesSlug = (t.slug || '').toLowerCase().includes(q);
        if (!matchesName && !matchesGame && !matchesSlug) return false;
      }
      return true;
    });
  }, [tournaments, searchQuery, statusFilter]);

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

      {/* Search & Filter Bar */}
      {tournaments.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search tournaments by name or game..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white font-mono shadow-sm transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 transition cursor-pointer"
                title="Clear"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 outline-none focus:border-cyan-500 font-mono"
              >
                <option value="all">All Statuses ({tournaments.length})</option>
                <option value="upcoming">Upcoming</option>
                <option value="live">Live / Ongoing</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="text-xs font-mono text-slate-500 hidden sm:block">
              Showing <span className="text-cyan-700 font-bold">{filteredTournaments.length}</span> of{' '}
              <span className="text-slate-900 font-bold">{tournaments.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tournaments Table */}
      {loading ? (
        <Loading message="Loading tournaments..." />
      ) : tournaments.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No tournaments found"
          description="Create your first collegiate tournament to kick off the season."
        />
      ) : filteredTournaments.length === 0 ? (
        <div className="p-10 text-center rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
          <Search className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm text-slate-700 font-mono font-bold">
            No tournaments found matching "{searchQuery}"
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
            className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-cyan-700 border border-slate-200 text-xs font-mono font-bold transition cursor-pointer"
          >
            Clear Search & Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* MOBILE TOURNAMENTS CARDS VIEW (< md) */}
          <div className="block md:hidden space-y-3.5">
            {filteredTournaments.map((t) => (
              <div
                key={t._id}
                className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3.5"
              >
                {/* Header: Title & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/tournaments/${t.slug || t._id}`}
                      className="font-bold text-slate-900 font-mono text-sm hover:text-cyan-600 flex items-center gap-1.5 truncate"
                    >
                      <span className="truncate">{t.name}</span>
                      <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[10px] font-bold">
                        {t.game}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {t.minTeamSize || 4} Starters
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono shrink-0 ${
                      t.status === 'live' || t.status === 'ongoing'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : t.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : t.status === 'cancelled'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>

                {/* Progress & Prize Pool */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-600">Registered:</span>
                    <span className="text-cyan-700 font-bold">
                      {t.registeredTeams?.length || 0} / {t.maxTeams} Teams
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full"
                      style={{
                        width: `${Math.min(100, Math.round(((t.registeredTeams?.length || 0) / (t.maxTeams || 16)) * 100))}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200/60 font-mono">
                    <span className="text-slate-600">Prize Pool:</span>
                    <span className="font-bold text-amber-600">₹{t.prizePool?.total?.toLocaleString()}</span>
                  </div>
                </div>

                {/* Mobile Action Buttons Bar */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <Link
                    to={`/admin/matches?tournament=${t._id}`}
                    className="flex-1 min-w-[70px] py-2 px-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold font-mono flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Swords className="w-3.5 h-3.5" />
                    <span>Matches</span>
                  </Link>

                  <button
                    onClick={() => handleViewTeams(t)}
                    className="flex-1 min-w-[70px] py-2 px-2.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 text-xs font-bold font-mono flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Teams</span>
                  </button>

                  <Link
                    to={`/admin/tournaments/${t._id}/form`}
                    title="Form Builder"
                    className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 cursor-pointer"
                  >
                    <FileCode className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    onClick={() => handleGenerateBracket(t._id, t.name)}
                    title="Brackets"
                    className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 cursor-pointer"
                  >
                    <GitBranch className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleOpenEdit(t)}
                    title="Edit Tournament"
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(t._id, t.name)}
                    title="Delete Tournament"
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP / TABLET TABLE VIEW (Hidden on Mobile) */}
          <div className="hidden md:block rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-left text-xs text-slate-700">
                <thead className="bg-slate-50 uppercase font-mono text-slate-600 border-b border-slate-200">
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
                <tbody className="divide-y divide-slate-100">
                  {filteredTournaments.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-bold text-slate-900 font-mono">
                        <Link
                          to={`/tournaments/${t.slug || t._id}`}
                          className="hover:text-cyan-600 flex items-center gap-1.5"
                        >
                          {t.name} <ExternalLink className="w-3 h-3 text-slate-400" />
                        </Link>
                      </td>

                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-mono font-bold">
                          {t.game}
                        </span>
                      </td>

                      <td className="p-4 text-slate-600 font-mono">
                        {t.minTeamSize || 4} Starters {t.allowSubstitutes !== false ? `+ ${t.maxSubstitutes || 1} Sub` : ''}
                      </td>

                      <td className="p-4 text-center font-mono font-semibold">
                        <span className="text-cyan-700 font-bold">{t.registeredTeams?.length || 0}</span> / {t.maxTeams}
                      </td>

                      <td className="p-4 font-mono font-bold text-amber-600">
                        ₹{t.prizePool?.total?.toLocaleString()}
                      </td>

                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                            t.status === 'live' || t.status === 'ongoing'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : t.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : t.status === 'cancelled'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
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
                          className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors inline-block align-middle cursor-pointer shadow-xs"
                        >
                          <FileCode className="w-3.5 h-3.5" />
                        </Link>

                        {/* Manage Stages, Lobbies & Matches */}
                        <Link
                          to={`/admin/matches?tournament=${t._id}`}
                          title="Manage Stages, Lobbies & Match Fixtures"
                          className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors inline-block align-middle cursor-pointer shadow-xs"
                        >
                          <Swords className="w-3.5 h-3.5" />
                        </Link>

                        {/* View & Verify Teams */}
                        <button
                          onClick={() => handleViewTeams(t)}
                          title="View Registered Teams & Verify Documents"
                          className="p-1.5 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 transition-colors cursor-pointer shadow-xs"
                        >
                          <Users className="w-3.5 h-3.5" />
                        </button>

                        {/* Generate Bracket */}
                        <button
                          onClick={() => handleGenerateBracket(t._id, t.name)}
                          title="Generate Elimination Brackets"
                          className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-colors cursor-pointer shadow-xs"
                        >
                          <GitBranch className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => handleOpenEdit(t)}
                          title="Edit Tournament"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer shadow-xs"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(t._id, t.name)}
                          title="Delete Tournament"
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer shadow-xs"
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
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Tournament Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
              placeholder="e.g. UEM Jaipur Tech Fest 2026 – BGMI"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Esports Game *
              </label>
              <select
                value={formData.game}
                onChange={(e) => setFormData({ ...formData, game: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
              >
                {games.map((g) => (
                  <option key={g._id} value={g.name}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Format
              </label>
              <select
                value={formData.format}
                onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
              >
                <option value="Single Elimination">Single Elimination</option>
                <option value="Double Elimination">Double Elimination</option>
                <option value="Round Robin">Round Robin</option>
                <option value="Swiss">Swiss</option>
              </select>
            </div>
          </div>

          {/* Roster Configuration */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <h4 className="text-xs font-mono font-bold text-sky-700 uppercase">
              Roster & Team Size Rules
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Required Starters
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.minTeamSize}
                  onChange={(e) => setFormData({ ...formData, minTeamSize: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Max Roster Size
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={formData.maxTeamSize}
                  onChange={(e) => setFormData({ ...formData, maxTeamSize: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Allow Substitute
                </label>
                <select
                  value={formData.allowSubstitutes ? 'yes' : 'no'}
                  onChange={(e) => setFormData({ ...formData, allowSubstitutes: e.target.value === 'yes' })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-900"
                >
                  <option value="yes">Yes (1 sub)</option>
                  <option value="no">No</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Max Substitutes
                </label>
                <input
                  type="number"
                  min="0"
                  max="3"
                  value={formData.maxSubstitutes}
                  onChange={(e) => setFormData({ ...formData, maxSubstitutes: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Prize Pool (₹)
              </label>
              <input
                type="number"
                min="0"
                value={formData.prizeTotal}
                onChange={(e) => setFormData({ ...formData, prizeTotal: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Entry Fee (₹)
              </label>
              <input
                type="number"
                min="0"
                value={formData.entryFee}
                onChange={(e) => setFormData({ ...formData, entryFee: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Max Teams
              </label>
              <input
                type="number"
                min="2"
                max="64"
                value={formData.maxTeams}
                onChange={(e) => setFormData({ ...formData, maxTeams: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Registration Deadline *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.registrationDeadline}
                onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Identity Proof Deadline *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.identityProofDeadline}
                onChange={(e) => setFormData({ ...formData, identityProofDeadline: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Tournament Start Date *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Cloudinary Banner Upload */}
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Tournament Banner Image *
              </label>
              <span className="text-[10px] text-slate-500">Presets:</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {bannerPresets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setFormData({ ...formData, banner: p.url, game: p.label })}
                  className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[10px] font-mono text-slate-700 cursor-pointer transition-colors"
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
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
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
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono">
            <div>
              <span className="text-slate-500">Total Teams:</span>{' '}
              <span className="font-bold text-cyan-600">{adminRegistrations.length}</span> / {viewingTournament?.maxTeams || 16}
            </div>
            {viewingTournament && (
              <Link
                to={`/admin/tournaments/${viewingTournament._id}/form`}
                className="text-amber-600 hover:underline flex items-center gap-1 font-bold"
              >
                <FileCode className="w-3.5 h-3.5" /> Edit Registration Form Schema
              </Link>
            )}
          </div>

          {/* Search & Filter bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search team name, code, or leader..."
                value={teamSearchQuery}
                onChange={(e) => setTeamSearchQuery(e.target.value)}
                className="w-full pl-8 pr-8 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-cyan-500 font-mono"
              />
              {teamSearchQuery && (
                <button
                  type="button"
                  onClick={() => setTeamSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-[11px] font-mono font-bold overflow-x-auto">
              {['all', 'incomplete', 'complete', 'verified', 'rejected'].map((st) => (
                <button
                  key={st}
                  onClick={() => setTeamStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg uppercase transition-all cursor-pointer ${
                    teamStatusFilter === st
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {viewTeamsLoading ? (
            <Loading message="Loading registered teams and player documents..." />
          ) : filteredRegistrations.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 space-y-1">
              <p>
                No registered teams found {teamSearchQuery ? `matching "${teamSearchQuery}"` : ''}{' '}
                with status filter "{teamStatusFilter}".
              </p>
              {teamSearchQuery && (
                <button
                  type="button"
                  onClick={() => setTeamSearchQuery('')}
                  className="text-cyan-600 hover:underline text-xs mt-1 font-semibold"
                >
                  Clear search
                </button>
              )}
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
                    className="rounded-xl bg-white border border-slate-200 shadow-xs overflow-hidden text-xs"
                  >
                    {/* Team summary header */}
                    <div className="p-3.5 flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 border-b border-slate-100">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 font-mono font-bold flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 font-mono flex items-center gap-2">
                            <span>{reg.teamName}</span>
                            {reg.teamTag && <span className="text-indigo-600 text-[11px]">[{reg.teamTag}]</span>}
                            <span className="text-[10px] text-cyan-700 font-mono px-1.5 py-0.2 rounded bg-cyan-50 border border-cyan-200">
                              {reg.teamCode}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2 font-mono">
                            <span>Leader: <strong>{(reg.leader || reg.captain)?.name}</strong></span>
                            <span>•</span>
                            <span className={completedStarters.length >= minStarters ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
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
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : reg.status === 'complete'
                              ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                              : reg.status === 'rejected'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {reg.status}
                        </span>

                        {/* Quick Verify / Reject Actions */}
                        {reg.status !== 'verified' && (
                          <button
                            type="button"
                            disabled={verifyingId === reg._id}
                            onClick={() => handleApproveRegistration(reg)}
                            className="p-1.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-pointer transition-colors"
                            title="Verify and Approve Team (Mark Active)"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {reg.status !== 'rejected' && (
                          <button
                            type="button"
                            disabled={verifyingId === reg._id}
                            onClick={() => handleOpenRejectModal(reg, false)}
                            className="p-1.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer transition-colors"
                            title="Reject Registration with Cause"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setExpandedTeamId(isExpanded ? null : reg._id)}
                          className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer transition-colors"
                          title="View Roster Details"
                        >
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Team & Player Breakdown */}
                    {isExpanded && (
                      <div className="p-4 bg-white border-t border-slate-100 space-y-4">
                        {reg.verificationNotes && (
                          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-700">
                            <strong>Admin Note:</strong> {reg.verificationNotes}
                          </div>
                        )}

                        {/* ONE Team-Level Combined Identity Proof Section */}
                        <div className="p-3.5 rounded-xl bg-slate-50/80 border border-amber-200 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-amber-600" />
                              <span className="font-bold text-slate-900 font-mono uppercase text-xs">
                                Team Identity Proof (Combined 1 PDF)
                              </span>
                            </div>
                            <div className="flex items-center gap-2 font-mono">
                              <span className="text-[10px] text-slate-500">Status:</span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  idProofStatus === 'verified'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : idProofStatus === 'rejected'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : idProofStatus === 'submitted'
                                    ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
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
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold"
                                >
                                  <FileText className="w-4 h-4 text-rose-600" /> [ View Team PDF ]
                                </a>
                                {reg.identityProof?.submittedAt && (
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    Uploaded: {new Date(reg.identityProof.submittedAt).toLocaleString()}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-amber-600 font-mono text-[11px] font-semibold">
                                ⏳ Pending: Squad has not yet submitted the combined identity proof PDF
                              </span>
                            )}

                            {idProofUrl && (
                              <div className="flex items-center gap-1.5">
                                {idProofStatus !== 'verified' && (
                                  <button
                                    type="button"
                                    disabled={verifyingId === reg._id}
                                    onClick={() => handleApproveRegistration(reg)}
                                    className="px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold border border-emerald-200 flex items-center gap-1 cursor-pointer transition-colors"
                                  >
                                    <CheckCircle2 className="w-3 h-3" /> Approve PDF
                                  </button>
                                )}
                                {idProofStatus !== 'rejected' && (
                                  <button
                                    type="button"
                                    disabled={verifyingId === reg._id}
                                    onClick={() => handleOpenRejectModal(reg, true)}
                                    className="px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold border border-rose-200 flex items-center gap-1 cursor-pointer transition-colors"
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
                          <h4 className="text-[11px] font-mono font-bold text-slate-500 uppercase mb-2 flex items-center justify-between">
                            <span>Roster Members ({reg.players?.length || 0}):</span>
                            <span className="text-cyan-600 font-bold font-mono">
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
                                  className="p-3 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-slate-900 font-mono">
                                        Player {player.slotNumber} {isCompleted ? '✓' : '⏳'}: {responses.player_name || player.user?.name}
                                      </span>
                                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase font-bold ${
                                        isSlotLeader ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                      }`}>
                                        {isSlotLeader ? 'Leader' : player.role}
                                      </span>
                                    </div>
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold ${
                                        isCompleted
                                          ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                                          : 'text-amber-700 bg-amber-50 border border-amber-200'
                                      }`}
                                    >
                                      {isCompleted ? '✓ Profile Completed' : '⏳ Details Incomplete'}
                                    </span>
                                  </div>

                                  {/* Player responses key-values (No individual ID card proof) */}
                                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px] text-slate-700 pt-1 border-t border-slate-200">
                                    <div>
                                      <span className="text-slate-400 block font-semibold">IGN:</span>
                                      <span className="font-mono font-bold text-cyan-700">{responses.game_ign || 'N/A'}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 block font-semibold">UID:</span>
                                      <span className="font-mono font-bold text-slate-800">{responses.game_uid || 'N/A'}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 block font-semibold">College:</span>
                                      <span className="truncate block font-medium">{responses.college_name || player.user?.college || 'N/A'}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 block font-semibold">College ID:</span>
                                      <span className="font-mono">{responses.college_id || 'N/A'}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 block font-semibold">WhatsApp:</span>
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

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setViewTeamsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 border border-slate-200 cursor-pointer transition-colors"
            >
              Close Console
            </button>
          </div>
        </div>
      </Modal>

      {/* Rejection Modal with Presets */}
      <RejectionModal
        isOpen={rejectionModalOpen}
        onClose={() => {
          setRejectionModalOpen(false);
          setRejectTarget(null);
        }}
        onConfirm={handleConfirmRejection}
        teamName={rejectTarget?.teamName}
        submitting={verifyingId !== null}
      />
    </div>
  );
};

export default AdminTournaments;
