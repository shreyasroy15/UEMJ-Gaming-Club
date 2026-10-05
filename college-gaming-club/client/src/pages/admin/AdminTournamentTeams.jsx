import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API from '../../services/api';
import Loading from '../../components/Loading/Loading';
import EmptyState from '../../components/EmptyState/EmptyState';
import RejectionModal from '../../components/RejectionModal/RejectionModal';
import EditTeamModal from '../../components/EditTeamModal/EditTeamModal';
import AddTeamModal from '../../components/AddTeamModal/AddTeamModal';
import { useToast } from '../../context/ToastContext';
import {
  Users,
  Trophy,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Search,
  X,
  Filter,
  Edit,
  Plus,
  Trash2,
} from 'lucide-react';

const AdminTournamentTeams = () => {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'verified' | 'pending' | 'rejected'

  // Multi-selection state
  const [selectedRegIds, setSelectedRegIds] = useState([]);
  const [bulkRejectModalOpen, setBulkRejectModalOpen] = useState(false);

  // Rejection modal state
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [selectedRegForReject, setSelectedRegForReject] = useState(null);

  // Edit team modal state
  const [editingTeam, setEditingTeam] = useState(null);

  // Add team modal state
  const [addTeamModalOpen, setAddTeamModalOpen] = useState(false);

  useEffect(() => {
    setSelectedRegIds([]);
    fetchRegistrations();
  }, [tournamentId]);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/tournaments/${tournamentId}/admin-registrations`);
      setData(res.data);
    } catch (err) {
      console.error(err);
      addToast('Failed to load team registrations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRegistration = async (regId) => {
    try {
      setSubmitting(true);
      await API.put(`/registrations/${regId}/verify`, {
        isVerified: true,
        status: 'verified',
      });
      addToast('Team successfully verified and approved as Active Team!', 'success');
      fetchRegistrations();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to approve team', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenRejectModal = (reg) => {
    setSelectedRegForReject(reg);
    setRejectionModalOpen(true);
  };

  const handleConfirmReject = async (reason) => {
    if (!selectedRegForReject) return;
    try {
      setSubmitting(true);
      await API.put(`/registrations/${selectedRegForReject._id}/verify`, {
        isVerified: false,
        status: 'rejected',
        identityProofStatus: 'rejected',
        verificationNotes: reason || 'You need to upload all proofs by merging in a single PDF.',
        reason: reason || 'You need to upload all proofs by merging in a single PDF.',
      });
      addToast('Team verification rejected. User notification dispatched with cause.', 'info');
      setRejectionModalOpen(false);
      setSelectedRegForReject(null);
      fetchRegistrations();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to reject team', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Bulk Actions
  const handleToggleSelectOne = (regId) => {
    setSelectedRegIds((prev) =>
      prev.includes(regId) ? prev.filter((id) => id !== regId) : [...prev, regId]
    );
  };

  const handleToggleSelectAll = (filteredList) => {
    const filteredIds = filteredList.map((r) => r._id);
    const allSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedRegIds.includes(id));

    if (allSelected) {
      // Unselect all in current filtered view
      const filterSet = new Set(filteredIds);
      setSelectedRegIds((prev) => prev.filter((id) => !filterSet.has(id)));
    } else {
      // Add all currently filtered items
      setSelectedRegIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleBulkApprove = async () => {
    if (selectedRegIds.length === 0) return;
    const count = selectedRegIds.length;
    try {
      setSubmitting(true);
      let success = false;
      try {
        await API.post('/registrations/bulk-verify', {
          registrationIds: selectedRegIds,
          action: 'approve',
          status: 'verified',
          isVerified: true,
        });
        success = true;
      } catch (bulkErr) {
        console.warn('Bulk approve endpoint error, falling back to sequential calls...', bulkErr);
        // Fallback to guarantee execution always works
        await Promise.all(
          selectedRegIds.map((id) =>
            API.put(`/registrations/${id}/verify`, {
              isVerified: true,
              status: 'verified',
            })
          )
        );
        success = true;
      }

      if (success) {
        addToast(`Successfully approved ${count} team${count > 1 ? 's' : ''}!`, 'success');
        setSelectedRegIds([]);
        fetchRegistrations();
      }
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to approve selected teams', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkConfirmReject = async (reason) => {
    if (selectedRegIds.length === 0) return;
    const count = selectedRegIds.length;
    const note = reason || 'You need to upload all proofs by merging in a single PDF.';
    try {
      setSubmitting(true);
      let success = false;
      try {
        await API.post('/registrations/bulk-verify', {
          registrationIds: selectedRegIds,
          action: 'reject',
          status: 'rejected',
          isVerified: false,
          identityProofStatus: 'rejected',
          verificationNotes: note,
          reason: note,
        });
        success = true;
      } catch (bulkErr) {
        console.warn('Bulk reject endpoint error, falling back to sequential calls...', bulkErr);
        await Promise.all(
          selectedRegIds.map((id) =>
            API.put(`/registrations/${id}/verify`, {
              isVerified: false,
              status: 'rejected',
              identityProofStatus: 'rejected',
              verificationNotes: note,
              reason: note,
            })
          )
        );
        success = true;
      }

      if (success) {
        addToast(`Successfully rejected ${count} team${count > 1 ? 's' : ''}. Notification dispatched.`, 'info');
        setBulkRejectModalOpen(false);
        setSelectedRegIds([]);
        fetchRegistrations();
      }
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to reject selected teams', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRegistration = async (reg) => {
    if (!reg) return;
    const confirmMsg = `Are you sure you want to delete team "${reg.teamName}" from this tournament? This will remove them from all lobbies/matches and free up the registration slot so other teams can register.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setSubmitting(true);
      try {
        await API.delete(`/tournaments/${tournamentId}/registrations/${reg._id}`);
      } catch (err1) {
        await API.delete(`/registrations/${reg._id}`);
      }
      addToast(`Team "${reg.teamName}" deleted from tournament. Slot freed up.`, 'success');
      setSelectedRegIds((prev) => prev.filter((id) => id !== reg._id));
      fetchRegistrations();
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to delete team', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRegIds.length === 0) return;
    const count = selectedRegIds.length;
    const confirmMsg = `Are you sure you want to delete ${count} selected team(s) from this tournament? This will free up ${count} registration slot(s) for other teams to register.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setSubmitting(true);
      await API.post('/registrations/bulk-delete', { registrationIds: selectedRegIds });
      addToast(`Successfully removed ${count} team(s) from tournament. Slots freed up.`, 'success');
      setSelectedRegIds([]);
      fetchRegistrations();
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to delete selected teams', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const tournament = data?.tournament;
  const registrations = useMemo(() => data?.registrations || [], [data]);

  const verifiedCount = useMemo(() => {
    return registrations.filter((r) => r.status === 'verified' || r.isVerified).length;
  }, [registrations]);

  const rejectedCount = useMemo(() => {
    return registrations.filter((r) => r.status === 'rejected').length;
  }, [registrations]);

  const pendingCount = useMemo(() => {
    return registrations.length - verifiedCount - rejectedCount;
  }, [registrations, verifiedCount, rejectedCount]);

  const filteredRegistrations = useMemo(() => {
    if (!registrations || registrations.length === 0) return [];
    return registrations.filter((reg) => {
      const isVerified = reg.status === 'verified' || reg.isVerified;
      const isRejected = reg.status === 'rejected';
      const isPending = !isVerified && !isRejected;

      if (statusFilter === 'verified' && !isVerified) return false;
      if (statusFilter === 'rejected' && !isRejected) return false;
      if (statusFilter === 'pending' && !isPending) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const teamName = (reg.teamName || '').toLowerCase();
        const teamCode = (reg.teamCode || '').toLowerCase();
        const capName = (reg.captain?.name || '').toLowerCase();
        const capUser = (reg.captain?.username || '').toLowerCase();
        const capEmail = (reg.captain?.email || '').toLowerCase();
        const playerNames = (reg.players || [])
          .map((p) => (p.name || p.inGameName || p.ign || '').toLowerCase())
          .join(' ');

        const matches =
          teamName.includes(q) ||
          teamCode.includes(q) ||
          capName.includes(q) ||
          capUser.includes(q) ||
          capEmail.includes(q) ||
          playerNames.includes(q);

        if (!matches) return false;
      }

      return true;
    });
  }, [registrations, searchQuery, statusFilter]);

  const isAllFilteredSelected = useMemo(() => {
    return (
      filteredRegistrations.length > 0 &&
      filteredRegistrations.every((r) => selectedRegIds.includes(r._id))
    );
  }, [filteredRegistrations, selectedRegIds]);

  const isSomeFilteredSelected = useMemo(() => {
    return (
      filteredRegistrations.some((r) => selectedRegIds.includes(r._id)) &&
      !isAllFilteredSelected
    );
  }, [filteredRegistrations, selectedRegIds, isAllFilteredSelected]);

  if (loading) return <Loading message="Loading teams..." />;
  if (!data) return <div className="text-white p-6">Error: No data loaded.</div>;
  if (!tournament) return <div className="text-white p-6">Error: Tournament data missing.</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full px-2 sm:px-4 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/teams')}
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors shrink-0 shadow-sm"
            title="Back to tournaments"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-mono uppercase truncate">
              {tournament.name}
            </h1>
            <p className="text-xs text-slate-500 font-mono">
              {tournament.game} • {verifiedCount} Active Approved Teams ({registrations.length} Total Submissions)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setAddTeamModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 shadow-sm hover:shadow-cyan-500/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Add Team
          </button>

          <span className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {verifiedCount} Active / Verified
          </span>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-slate-400 font-mono">Active Approved Teams</p>
          <p className="text-xl sm:text-2xl font-black text-emerald-600 font-mono">
            {verifiedCount}{' '}
            <span className="text-xs sm:text-sm font-normal text-slate-400">
              / {tournament.maxTeams} Slots Filled
            </span>
          </p>
        </div>
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-slate-400 font-mono">Total Submissions</p>
          <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
            {registrations.length}{' '}
            <span className="text-xs sm:text-sm font-normal text-slate-400 font-mono">
              ({pendingCount} Pending)
            </span>
          </p>
        </div>
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-sm col-span-2 sm:col-span-1">
          <p className="text-[10px] uppercase font-bold text-slate-400 font-mono">Total Players</p>
          <p className="text-xl sm:text-2xl font-black text-cyan-600 font-mono">
            {registrations.reduce((acc, reg) => acc + (reg.players?.length || 0), 0)}
          </p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      {registrations.length > 0 && (
        <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search team name, team code, captain, or player..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white font-mono transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 rounded-full transition"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Results count badge */}
            <div className="text-xs font-mono text-slate-500 shrink-0 self-end sm:self-center">
              Showing <span className="text-cyan-600 font-bold">{filteredRegistrations.length}</span> of{' '}
              <span className="text-slate-900 font-bold">{registrations.length}</span> teams
            </div>
          </div>

          {/* Status Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            <span className="text-[11px] font-mono text-slate-400 uppercase font-bold flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3" /> Status:
            </span>

            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              All ({registrations.length})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('verified')}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                statusFilter === 'verified'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              Active / Verified ({verifiedCount})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border border-cyan-200'
              }`}
            >
              Pending ({pendingCount})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('rejected')}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                statusFilter === 'rejected'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              Rejected ({rejectedCount})
            </button>

            {(searchQuery || statusFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                className="ml-auto text-[11px] font-mono text-slate-400 hover:text-cyan-600 underline underline-offset-2 transition cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Floating / Sticky Bulk Actions Bar */}
      {selectedRegIds.length > 0 && (
        <div className="sticky top-4 z-30 p-3 sm:p-4 rounded-2xl bg-slate-900/95 backdrop-blur-md text-white shadow-xl flex flex-wrap items-center justify-between gap-3 border border-slate-700/80 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 font-mono font-bold text-sm flex items-center justify-center border border-cyan-500/30">
              {selectedRegIds.length}
            </span>
            <div>
              <div className="text-xs font-mono font-bold text-white">
                {selectedRegIds.length} {selectedRegIds.length === 1 ? 'Team' : 'Teams'} Selected
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                Bulk action on selected teams
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <button
              type="button"
              disabled={submitting}
              onClick={handleBulkApprove}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Approve Selected ({selectedRegIds.length})
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => setBulkRejectModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-rose-950/40 transition cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
              Reject Selected ({selectedRegIds.length})
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={handleBulkDelete}
              className="px-3.5 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/60 disabled:opacity-50 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
              title="Delete selected teams from tournament and free up slots"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected ({selectedRegIds.length})
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => setSelectedRegIds([])}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono font-bold transition cursor-pointer"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Team List */}
      {registrations.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No teams registered yet"
          description="Wait for teams to register for this tournament."
        />
      ) : filteredRegistrations.length === 0 ? (
        <div className="p-10 text-center rounded-2xl bg-white border border-slate-200 space-y-3 shadow-sm">
          <Search className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm text-slate-800 font-mono font-bold">
            No teams found matching "{searchQuery}"
          </p>
          <p className="text-xs text-slate-500 font-mono">
            Try adjusting your search query or status filter.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
            className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-cyan-700 text-xs font-mono font-bold transition cursor-pointer"
          >
            Clear Search & Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* MOBILE CARDS VIEW (< sm breakpoint) */}
          <div className="grid grid-cols-1 gap-3 sm:hidden">
            {filteredRegistrations.map((reg) => {
              const isVerified = reg.status === 'verified' || reg.isVerified;
              const isRejected = reg.status === 'rejected';
              const hasProof = Boolean(reg.identityProof?.url);
              const isSelected = selectedRegIds.includes(reg._id);

              return (
                <div
                  key={reg._id}
                  className={`p-4 rounded-2xl border space-y-3 transition-all shadow-sm ${
                    isSelected
                      ? 'bg-cyan-50/60 border-cyan-400 ring-1 ring-cyan-300'
                      : isVerified
                      ? 'bg-white border-emerald-300'
                      : isRejected
                      ? 'bg-white border-rose-300'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectOne(reg._id)}
                        className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer accent-cyan-600 shrink-0"
                        title={`Select ${reg.teamName}`}
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-slate-900 font-mono truncate">
                          {reg.teamName}
                        </h3>
                        <p className="text-xs text-slate-500 font-mono truncate mt-0.5">
                          Captain: {reg.captain?.name || reg.captain?.username || 'N/A'}
                        </p>
                      </div>
                    </div>
                    {isVerified ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        ✓ Active Team
                      </span>
                    ) : isRejected ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                        ✕ Rejected
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-cyan-50 text-cyan-700 border border-cyan-200 shrink-0">
                        {reg.status}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      👥 {reg.players?.length || 0} Players
                    </span>
                    {hasProof ? (
                      <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                        <FileText className="w-3 h-3" /> Proof Uploaded
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                        ⏳ No Proof
                      </span>
                    )}
                  </div>

                  {/* Verification & Action Buttons */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingTeam(reg)}
                      className="py-1.5 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-1 transition cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Edit
                    </button>

                    <Link
                      to={`/admin/teams/${tournamentId}/${reg._id}`}
                      className="flex-1 min-w-[90px] py-1.5 px-3 rounded-xl bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border border-cyan-200 text-center text-xs font-bold font-mono transition"
                    >
                      View Details
                    </Link>

                    {/* Approve Button */}
                    {!isVerified && (
                      <button
                        disabled={submitting}
                        onClick={() => handleApproveRegistration(reg._id)}
                        className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-1 shadow-sm transition cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approve
                      </button>
                    )}

                    {/* Reject Button */}
                    {!isRejected && (
                      <button
                        disabled={submitting}
                        onClick={() => handleOpenRejectModal(reg)}
                        className="py-1.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-1 transition cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    )}

                    {/* Delete Team Button */}
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleDeleteRegistration(reg)}
                      className="py-1.5 px-3 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-700 border border-slate-200 text-xs font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-1 transition cursor-pointer"
                      title="Delete team from tournament"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP TABLE VIEW (>= sm breakpoint) */}
          <div className="hidden sm:block rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 min-w-[700px]">
                <thead className="bg-slate-50 uppercase font-mono text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-4 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={isAllFilteredSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = isSomeFilteredSelected;
                        }}
                        onChange={() => handleToggleSelectAll(filteredRegistrations)}
                        className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer accent-cyan-600"
                        title="Select or deselect all teams in list"
                      />
                    </th>
                    <th className="p-4 text-slate-800">Team Name</th>
                    <th className="p-4 text-center">Players</th>
                    <th className="p-4">Captain</th>
                    <th className="p-4">Proof</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Verification & Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {filteredRegistrations.map((reg) => {
                    const isVerified = reg.status === 'verified' || reg.isVerified;
                    const isRejected = reg.status === 'rejected';
                    const hasProof = Boolean(reg.identityProof?.url);
                    const isSelected = selectedRegIds.includes(reg._id);

                    return (
                      <tr
                        key={reg._id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isSelected
                            ? 'bg-cyan-50/70 ring-1 ring-inset ring-cyan-200'
                            : isVerified
                            ? 'bg-emerald-50/30'
                            : isRejected
                            ? 'bg-rose-50/30'
                            : ''
                        }`}
                      >
                        <td className="p-4 w-12 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectOne(reg._id)}
                            className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer accent-cyan-600"
                            title={`Select ${reg.teamName}`}
                          />
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-slate-900 text-sm">{reg.teamName}</div>
                          <div className="text-[10px] text-slate-400">Code: {reg.teamCode}</div>
                        </td>
                        <td className="p-4 text-center font-mono text-slate-800">
                          {reg.players?.length || 0}
                        </td>
                        <td className="p-4 text-slate-600">
                          {reg.captain?.name || reg.captain?.username || 'N/A'}
                        </td>
                        <td className="p-4">
                          {hasProof ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1 w-fit">
                              <FileText className="w-3 h-3" /> PDF Uploaded
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">None</span>
                          )}
                        </td>
                        <td className="p-4">
                          {isVerified ? (
                            <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3 h-3" /> Active Team
                            </span>
                          ) : isRejected ? (
                            <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 w-fit">
                              <XCircle className="w-3 h-3" /> Rejected
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase bg-cyan-50 text-cyan-700 border border-cyan-200 w-fit block">
                              {reg.status}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Approve */}
                            {!isVerified && (
                              <button
                                disabled={submitting}
                                onClick={() => handleApproveRegistration(reg._id)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold uppercase flex items-center gap-1 shadow-sm transition cursor-pointer"
                                title="Approve Team (Mark Active)"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                Approve
                              </button>
                            )}

                            {/* Reject */}
                            {!isRejected && (
                              <button
                                disabled={submitting}
                                onClick={() => handleOpenRejectModal(reg)}
                                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold uppercase flex items-center gap-1 transition cursor-pointer"
                                title="Reject with Reason"
                              >
                                <XCircle className="w-3 h-3" />
                                Reject
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setEditingTeam(reg)}
                              className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-[11px] font-bold uppercase flex items-center gap-1 transition cursor-pointer"
                              title="Edit Team & Members"
                            >
                              <Edit className="w-3 h-3" />
                              Edit
                            </button>

                            <Link
                              to={`/admin/teams/${tournamentId}/${reg._id}`}
                              className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors text-[11px] font-bold"
                            >
                              View Details
                            </Link>

                            <button
                              type="button"
                              disabled={submitting}
                              onClick={() => handleDeleteRegistration(reg)}
                              className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-700 border border-slate-200 text-[11px] font-bold uppercase flex items-center gap-1 transition cursor-pointer"
                              title="Delete team from tournament"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Individual Rejection Modal */}
      <RejectionModal
        isOpen={rejectionModalOpen}
        onClose={() => {
          setRejectionModalOpen(false);
          setSelectedRegForReject(null);
        }}
        onConfirm={handleConfirmReject}
        teamName={selectedRegForReject?.teamName}
        tournamentName={tournament?.name}
        submitting={submitting}
      />

      {/* Bulk Rejection Modal */}
      <RejectionModal
        isOpen={bulkRejectModalOpen}
        onClose={() => setBulkRejectModalOpen(false)}
        onConfirm={handleBulkConfirmReject}
        teamName={`${selectedRegIds.length} Selected Teams`}
        title={`Reject ${selectedRegIds.length} Selected Teams`}
        submitting={submitting}
      />

      {/* Edit Team & Members Modal */}
      <EditTeamModal
        isOpen={Boolean(editingTeam)}
        onClose={() => setEditingTeam(null)}
        team={editingTeam}
        onSaved={() => fetchRegistrations()}
      />

      {/* Add Team Modal */}
      <AddTeamModal
        isOpen={addTeamModalOpen}
        onClose={() => setAddTeamModalOpen(false)}
        tournamentId={tournamentId}
        tournamentName={tournament?.name}
        onTeamAdded={() => fetchRegistrations()}
      />
    </div>
  );
};

export default AdminTournamentTeams;
