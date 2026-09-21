import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../services/api';
import Loading from '../../components/Loading/Loading';
import { useToast } from '../../context/ToastContext';
import { ChevronLeft, FileText, CheckCircle2, User, X, ExternalLink, XCircle, AlertTriangle } from 'lucide-react';
import RejectionModal from '../../components/RejectionModal/RejectionModal';

const AdminTeamDetails = () => {
  const { tournamentId, registrationId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [identityProofUrl, setIdentityProofUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    fetchRegistration();
  }, [registrationId]);

  const fetchRegistration = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/registrations/${registrationId}`);
      setData(res.data);
      if (res.data.registration.identityProof?.url) {
        fetchSecureIdentityProofUrl();
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load team details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSecureIdentityProofUrl = async () => {
    try {
      const res = await API.get(`/registrations/${registrationId}/identity-proof-url`);
      setIdentityProofUrl(res.data.url);
    } catch (err) {
      console.error(err);
      addToast('Failed to load document.', 'error');
    }
  };

  const handleApproveTeam = async () => {
    try {
      setSubmitting(true);
      const res = await API.put(`/registrations/${registrationId}/verify`, {
        status: 'verified',
        identityProofStatus: 'verified',
        verificationNotes: 'All squad documents verified and approved.',
      });
      if (res.data.success) {
        addToast('Team approved! Squad marked as active and notification sent.', 'success');
        fetchRegistration();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Approval failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmRejection = async (reason) => {
    try {
      setSubmitting(true);
      const res = await API.put(`/registrations/${registrationId}/verify`, {
        status: 'rejected',
        identityProofStatus: 'rejected',
        verificationNotes: reason,
      });
      if (res.data.success) {
        addToast('Team verification rejected. Notification sent to squad with cause.', 'info');
        setRejectionModalOpen(false);
        fetchRegistration();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Rejection failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading message="Loading team details..." />;
  if (!data || !data.registration) return <div className="text-white p-6">Error: Registration details not loaded.</div>;

  const { registration } = data;
  const tournament = registration.tournament || {};

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full px-2 sm:px-4 pb-12">
      {/* Top Navigation & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/admin/teams/${tournamentId}`)}
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors shadow-sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 font-mono uppercase">{registration.teamName}</h1>
              {registration.status === 'verified' ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                  ✓ Active Team
                </span>
              ) : registration.status === 'rejected' ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono uppercase bg-rose-50 text-rose-700 border border-rose-200 shadow-sm">
                  ✕ Rejected
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono uppercase bg-cyan-50 text-cyan-700 border border-cyan-200 shadow-sm">
                  Pending Verification
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-mono">Code: {registration.teamCode}</p>
          </div>
        </div>

        {/* Verification Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {registration.status !== 'verified' ? (
            <button
              disabled={submitting}
              onClick={handleApproveTeam}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 shadow-sm disabled:opacity-50 transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Approve Team (Mark Active)
            </button>
          ) : (
            <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold font-mono uppercase flex items-center gap-1.5 shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Active Team (Approved)
            </span>
          )}

          <button
            disabled={submitting}
            onClick={() => setRejectionModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
            title="Reject verification with cause"
          >
            <XCircle className="w-4 h-4" />
            Reject
          </button>
        </div>
      </div>

      {/* Rejection Notice Banner if Rejected */}
      {(registration.status === 'rejected' || registration.identityProof?.status === 'rejected') && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-1.5 animate-in fade-in shadow-sm">
          <div className="flex items-center gap-2 text-rose-700 font-bold text-xs font-mono uppercase">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Document Verification Rejected</span>
          </div>
          <p className="text-xs text-rose-800 leading-relaxed font-mono">
            Cause: <strong>"{registration.verificationNotes || registration.identityProof?.verificationNotes || 'Invalid document submitted.'}"</strong>
          </p>
          <p className="text-[11px] text-slate-500">
            A notification was dispatched to squad members with instructions to merge all proofs into a single PDF.
          </p>
        </div>
      )}

      {/* TOP: Team Information */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Team Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <p><span className="text-slate-500">Name:</span> <span className="text-slate-900 font-semibold">{registration.teamName}</span></p>
          <p><span className="text-slate-500">Game:</span> <span className="text-slate-900 font-semibold">{tournament.game || 'N/A'}</span></p>
          <p><span className="text-slate-500">Tournament:</span> <span className="text-slate-900 font-semibold">{tournament.name || 'N/A'}</span></p>
          <p><span className="text-slate-500">Code:</span> <span className="text-slate-900 font-mono font-semibold">{registration.teamCode}</span></p>
          <p><span className="text-slate-500">Type:</span> <span className="text-slate-900 font-semibold">{registration.teamType}</span></p>
          <p><span className="text-slate-500">Status:</span> <span className="text-cyan-600 uppercase font-bold">{registration.status}</span></p>
          <p><span className="text-slate-500">Captain:</span> <span className="text-slate-900 font-semibold">{registration.captain?.name || registration.captain?.username || 'N/A'}</span></p>
          <p><span className="text-slate-500">Players:</span> <span className="text-slate-900 font-semibold">{registration.players?.length || 0}</span></p>
        </div>
      </div>

      {/* SQUAD MEMBERS */}
      <div className="space-y-4">
        <h3 className="font-bold text-slate-900">Squad Members</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(registration.players || []).map((p, idx) => {
            const userName = p.user?.name || p.responses?.player_name || `Player ${idx + 1}`;
            const userHandle = p.user?.username ? `@${p.user.username}` : (p.role || 'Member');
            const profilePhoto = p.responses?.profile_photo || p.user?.avatar;
            const responsesObj = p.responses && typeof p.responses === 'object' ? p.responses : {};

            return (
              <div key={p.user?._id || p._id || idx} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center gap-4">
                  {profilePhoto ? (
                    <img src={profilePhoto} alt={userName} className="w-12 h-12 rounded-full object-cover border border-slate-200" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                      <User className="w-6 h-6 text-slate-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-md font-bold text-slate-900 truncate">{userName}</p>
                    <p className="text-sm text-slate-500 truncate">{userHandle} • {p.role}</p>
                  </div>
                  <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${p.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    {p.status}
                  </div>
                </div>

                {/* Player Responses */}
                {Object.keys(responsesObj).length > 0 && (
                  <div className="text-sm text-slate-700 pt-3 border-t border-slate-100 space-y-1">
                    {Object.entries(responsesObj).map(([key, val]) => (
                      key !== 'profile_photo' && (
                        <div key={key} className="flex justify-between gap-2 text-xs">
                          <span className="text-slate-500 capitalize">{key.replace(/_/g, ' ')}</span>
                          <span className="text-slate-900 font-medium truncate">{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
                        </div>
                      )
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* IDENTITY PROOF (EMBEDDED PREVIEW BY DEFAULT) */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-cyan-600" />
            <h3 className="font-bold text-slate-900 text-base">Team Identity Proof</h3>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase font-mono tracking-wider border ${
              registration.identityProof?.status === 'verified' || registration.status === 'verified'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : registration.identityProof?.status === 'rejected' || registration.status === 'rejected'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-cyan-50 text-cyan-700 border-cyan-200'
            }`}>
              {registration.status === 'verified'
                ? '✓ Verified Active'
                : registration.status === 'rejected'
                ? '✕ Rejected'
                : (registration.identityProof?.status || 'Submitted')}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {registration.status !== 'verified' && (
              <button
                disabled={submitting}
                onClick={handleApproveTeam}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 shadow-sm disabled:opacity-50 transition cursor-pointer"
                title="Approve team identity proof and mark as active team"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Approve Proof
              </button>
            )}
            <button
              disabled={submitting}
              onClick={() => setRejectionModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
              title="Reject identity proof and specify cause"
            >
              <XCircle className="w-3.5 h-3.5" />
              Reject
            </button>
            {identityProofUrl && (
              <a
                href={identityProofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-xl font-bold transition flex items-center gap-1.5 border border-slate-200 shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open in New Window
              </a>
            )}
          </div>
        </div>

        {registration.identityProof?.fileName && (
          <p className="text-xs text-slate-500 font-mono">
            📄 {registration.identityProof.fileName}
            {registration.identityProof.fileSize ? ` · ${(registration.identityProof.fileSize / (1024 * 1024)).toFixed(2)} MB` : ''}
          </p>
        )}

        {identityProofUrl ? (
          <div className="w-full h-[650px] rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-inner">
            <iframe
              src={identityProofUrl}
              className="w-full h-full rounded-xl bg-white"
              title={`Identity Proof - ${registration.teamName}`}
            />
          </div>
        ) : (
          <div className="p-8 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
            <p className="text-sm text-slate-500">No identity proof submitted for this squad.</p>
          </div>
        )}
      </div>

      {/* Rejection Reason Modal */}
      <RejectionModal
        isOpen={rejectionModalOpen}
        onClose={() => setRejectionModalOpen(false)}
        onConfirm={handleConfirmRejection}
        teamName={registration?.teamName}
        tournamentName={tournament.name}
      />
    </div>
  );
};

export default AdminTeamDetails;
