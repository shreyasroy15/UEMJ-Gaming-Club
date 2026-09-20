import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API from '../../services/api';
import Loading from '../../components/Loading/Loading';
import EmptyState from '../../components/EmptyState/EmptyState';
import RejectionModal from '../../components/RejectionModal/RejectionModal';
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

  // Rejection modal state
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [selectedRegForReject, setSelectedRegForReject] = useState(null);

  useEffect(() => {
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

  if (loading) return <Loading message="Loading teams..." />;
  if (!data) return <div className="text-white p-6">Error: No data loaded.</div>;
  if (!tournament) return <div className="text-white p-6">Error: Tournament data missing.</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full px-2 sm:px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/teams')}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shrink-0"
            title="Back to tournaments"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-white font-mono uppercase truncate">
              {tournament.name}
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              {tournament.game} • {registrations.length} Teams Registered
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
            {verifiedCount} Active / Verified
          </span>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900 border border-slate-800">
          <p className="text-[10px] uppercase font-bold text-slate-500 font-mono">Registered Teams</p>
          <p className="text-xl sm:text-2xl font-black text-white font-mono">
            {registrations.length}{' '}
            <span className="text-xs sm:text-sm font-normal text-slate-500">
              / {tournament.maxTeams}
            </span>
          </p>
        </div>
        <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900 border border-slate-800">
          <p className="text-[10px] uppercase font-bold text-slate-500 font-mono">Active Verified Teams</p>
          <p className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
            {verifiedCount}
          </p>
        </div>
        <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900 border border-slate-800 col-span-2 sm:col-span-1">
          <p className="text-[10px] uppercase font-bold text-slate-500 font-mono">Total Players</p>
          <p className="text-xl sm:text-2xl font-black text-cyan-400 font-mono">
            {registrations.reduce((acc, reg) => acc + (reg.players?.length || 0), 0)}
          </p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      {registrations.length > 0 && (
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search team name, team code, captain, or player..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono transition shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-full transition"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Results count badge */}
            <div className="text-xs font-mono text-slate-400 shrink-0 self-end sm:self-center">
              Showing <span className="text-cyan-400 font-bold">{filteredRegistrations.length}</span> of{' '}
              <span className="text-white font-bold">{registrations.length}</span> teams
            </div>
          </div>

          {/* Status Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
            <span className="text-[11px] font-mono text-slate-500 uppercase font-bold flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3" /> Status:
            </span>

            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
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
                  : 'bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60 border border-emerald-800/50'
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
                  : 'bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/60 border border-cyan-800/50'
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
                  : 'bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 border border-rose-800/50'
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
                className="ml-auto text-[11px] font-mono text-slate-400 hover:text-cyan-400 underline underline-offset-2 transition cursor-pointer"
              >
                Reset Filters
              </button>
            )}
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
        <div className="p-10 text-center rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <Search className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-sm text-slate-300 font-mono font-bold">
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
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-mono font-bold transition cursor-pointer"
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

              return (
                <div
                  key={reg._id}
                  className={`p-4 rounded-2xl border space-y-3 transition-all ${
                    isVerified
                      ? 'bg-slate-900/80 border-emerald-500/30'
                      : isRejected
                      ? 'bg-rose-950/20 border-rose-500/40'
                      : 'bg-slate-900/70 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-white font-mono truncate">
                        {reg.teamName}
                      </h3>
                      <p className="text-xs text-slate-400 font-mono truncate mt-0.5">
                        Captain: {reg.captain?.name || reg.captain?.username || 'N/A'}
                      </p>
                    </div>
                    {isVerified ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-emerald-950 text-emerald-300 border border-emerald-500/40 shrink-0">
                        ✓ Active Team
                      </span>
                    ) : isRejected ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-rose-950 text-rose-300 border border-rose-500/40 shrink-0">
                        ✕ Rejected
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-cyan-950 text-cyan-300 border border-cyan-500/40 shrink-0">
                        {reg.status}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      👥 {reg.players?.length || 0} Players
                    </span>
                    {hasProof ? (
                      <span className="px-2 py-0.5 rounded bg-purple-950/70 text-purple-300 border border-purple-800/50 flex items-center gap-1">
                        <FileText className="w-3 h-3" /> Proof Uploaded
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-amber-950/50 text-amber-400 border border-amber-800/40">
                        ⏳ No Proof
                      </span>
                    )}
                  </div>

                  {/* Verification & Action Buttons */}
                  <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                    <Link
                      to={`/admin/teams/${tournamentId}/${reg._id}`}
                      className="flex-1 min-w-[90px] py-1.5 px-3 rounded-xl bg-cyan-600/20 text-cyan-300 hover:bg-cyan-600/30 border border-cyan-500/30 text-center text-xs font-bold font-mono transition"
                    >
                      View Details
                    </Link>

                    {/* Approve Button */}
                    {!isVerified && (
                      <button
                        disabled={submitting}
                        onClick={() => handleApproveRegistration(reg._id)}
                        className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-1 shadow-md shadow-emerald-600/20 transition cursor-pointer"
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
                        className="py-1.5 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-1 transition cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP TABLE VIEW (>= sm breakpoint) */}
          <div className="hidden sm:block rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300 min-w-[700px]">
                <thead className="bg-slate-950/80 uppercase font-mono text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-4 text-white">Team Name</th>
                    <th className="p-4 text-center">Players</th>
                    <th className="p-4">Captain</th>
                    <th className="p-4">Proof</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Verification & Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-mono">
                  {filteredRegistrations.map((reg) => {
                    const isVerified = reg.status === 'verified' || reg.isVerified;
                    const isRejected = reg.status === 'rejected';
                    const hasProof = Boolean(reg.identityProof?.url);

                    return (
                      <tr
                        key={reg._id}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          isVerified ? 'bg-emerald-950/10' : isRejected ? 'bg-rose-950/10' : ''
                        }`}
                      >
                        <td className="p-4">
                          <div className="font-bold text-slate-100 text-sm">{reg.teamName}</div>
                          <div className="text-[10px] text-slate-500">Code: {reg.teamCode}</div>
                        </td>
                        <td className="p-4 text-center font-mono text-slate-200">
                          {reg.players?.length || 0}
                        </td>
                        <td className="p-4 text-slate-300">
                          {reg.captain?.name || reg.captain?.username || 'N/A'}
                        </td>
                        <td className="p-4">
                          {hasProof ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950/60 text-purple-300 border border-purple-800/40 flex items-center gap-1 w-fit">
                              <FileText className="w-3 h-3" /> PDF Uploaded
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">None</span>
                          )}
                        </td>
                        <td className="p-4">
                          {isVerified ? (
                            <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3 h-3" /> Active Team
                            </span>
                          ) : isRejected ? (
                            <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase bg-rose-950 text-rose-300 border border-rose-500/40 flex items-center gap-1 w-fit">
                              <XCircle className="w-3 h-3" /> Rejected
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase bg-cyan-950 text-cyan-400 border border-cyan-500/40 w-fit block">
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
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold uppercase flex items-center gap-1 shadow transition cursor-pointer"
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
                                className="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 text-[11px] font-bold uppercase flex items-center gap-1 transition cursor-pointer"
                                title="Reject with Reason"
                              >
                                <XCircle className="w-3 h-3" />
                                Reject
                              </button>
                            )}

                            <Link
                              to={`/admin/teams/${tournamentId}/${reg._id}`}
                              className="px-3 py-1 rounded-lg bg-cyan-600/20 text-cyan-300 hover:bg-cyan-600/30 border border-cyan-500/30 transition-colors text-[11px] font-bold"
                            >
                              View Details
                            </Link>
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

      {/* Rejection Modal */}
      <RejectionModal
        isOpen={rejectionModalOpen}
        onClose={() => {
          setRejectionModalOpen(false);
          setSelectedRegForReject(null);
        }}
        onConfirm={handleConfirmReject}
        teamName={selectedRegForReject?.teamName}
        tournamentName={tournament?.name}
      />
    </div>
  );
};

export default AdminTournamentTeams;
