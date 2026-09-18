import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../services/api';
import Loading from '../../components/Loading/Loading';
import { useToast } from '../../context/ToastContext';
import { ChevronLeft, FileText, CheckCircle2, User, X, ExternalLink } from 'lucide-react';

const AdminTeamDetails = () => {
  const { tournamentId, registrationId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [identityProofUrl, setIdentityProofUrl] = useState(null);
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

  if (loading) return <Loading message="Loading team details..." />;
  if (!data) return <div className="text-white">Error: No data loaded.</div>;

  const { registration } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/admin/teams/${tournamentId}`)}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-black text-white font-mono uppercase">{registration.teamName} - Details</h1>
      </div>

      {/* TOP: Team Information */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="font-bold text-white border-b border-slate-800 pb-2">Team Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <p><span className="text-slate-500">Name:</span> <span className="text-white">{registration.teamName}</span></p>
          <p><span className="text-slate-500">Game:</span> <span className="text-white">{data.registration.tournament.game}</span></p>
          <p><span className="text-slate-500">Tournament:</span> <span className="text-white">{data.registration.tournament.name}</span></p>
          <p><span className="text-slate-500">Code:</span> <span className="text-white font-mono">{registration.teamCode}</span></p>
          <p><span className="text-slate-500">Type:</span> <span className="text-white">{registration.teamType}</span></p>
          <p><span className="text-slate-500">Status:</span> <span className="text-cyan-400 uppercase font-bold">{registration.status}</span></p>
          <p><span className="text-slate-500">Captain:</span> <span className="text-white">{registration.captain?.username}</span></p>
          <p><span className="text-slate-500">Players:</span> <span className="text-white">{registration.players.length}</span></p>
        </div>
      </div>

      {/* SQUAD MEMBERS */}
      <div className="space-y-4">
        <h3 className="font-bold text-white">Squad Members</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {registration.players.map(p => (
            <div key={p.user._id} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center gap-4">
                {p.responses.profile_photo ? (
                  <img src={p.responses.profile_photo} alt={p.user.name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                    <User className="w-6 h-6 text-slate-400" />
                  </div>
                )}
                <div className="flex-1">
                    <p className="text-md font-bold text-white">{p.user.name}</p>
                    <p className="text-sm text-slate-400">@{p.user.username} • {p.role}</p>
                </div>
                <div className={`px-2 py-1 rounded text-[10px] font-bold ${p.status === 'completed' ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                    {p.status}
                </div>
              </div>

              {/* Player Responses */}
              <div className="text-sm text-slate-300 pt-3 border-t border-slate-800 space-y-1">
                {Object.entries(p.responses).map(([key, val]) => (
                  key !== 'profile_photo' && (
                    <div key={key} className="flex justify-between">
                      <span className="text-slate-500 capitalize">{key.replace('_', ' ')}</span>
                      <span className="text-white font-medium">{String(val)}</span>
                    </div>
                  )
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* IDENTITY PROOF (EMBEDDED PREVIEW BY DEFAULT) */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-base">Team Identity Proof</h3>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase font-mono tracking-wider ${
              registration.identityProof?.status === 'verified'
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                : 'bg-cyan-950 text-cyan-400 border border-cyan-800/40'
            }`}>
              {registration.identityProof?.status || 'Submitted'}
            </span>
          </div>

          {identityProofUrl && (
            <a
              href={identityProofUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 text-xs rounded-xl font-bold transition flex items-center gap-2 border border-slate-700 shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open in New Window
            </a>
          )}
        </div>

        {registration.identityProof?.fileName && (
          <p className="text-xs text-slate-400 font-mono">
            📄 {registration.identityProof.fileName}
            {registration.identityProof.fileSize ? ` · ${(registration.identityProof.fileSize / (1024 * 1024)).toFixed(2)} MB` : ''}
          </p>
        )}

        {identityProofUrl ? (
          <div className="w-full h-[650px] rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
            <iframe
              src={identityProofUrl}
              className="w-full h-full rounded-xl bg-slate-950"
              title={`Identity Proof - ${registration.teamName}`}
            />
          </div>
        ) : (
          <div className="p-8 text-center rounded-xl bg-slate-950/50 border border-dashed border-slate-800">
            <p className="text-sm text-slate-500">No identity proof submitted for this squad.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTeamDetails;
