import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import Loading from '../components/Loading/Loading';
import EmptyState from '../components/EmptyState/EmptyState';
import Modal from '../components/Modal/Modal';
import CloudinaryUpload from '../components/Upload/CloudinaryUpload';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Trophy,
  Shield,
  Users,
  UserPlus,
  Copy,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Edit3,
  User,
  Trash2,
  LogOut,
  Calendar,
  Lock,
  FileText,
  Share2,
  Loader2,
  Upload,
  X,
} from 'lucide-react';

const TournamentRegister = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const codeParam = searchParams.get('code') || '';

  const { user, isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [tournament, setTournament] = useState(null);
  const [form, setForm] = useState(null);

  // User's active registration for this tournament if any
  const [activeRegistration, setActiveRegistration] = useState(null);

  // Tab: 'create' | 'join'
  const [mode, setMode] = useState(codeParam ? 'join' : 'create');

  // Create Team state
  const [teamName, setTeamName] = useState('');
  const [teamType, setTeamType] = useState('UEM Student Team');
  const [creating, setCreating] = useState(false);

  // Join Team state
  const [inputCode, setInputCode] = useState(codeParam);
  const [joining, setJoining] = useState(false);

  // Player Submission Modal
  const [playerModalOpen, setPlayerModalOpen] = useState(false);
  const [playerResponses, setPlayerResponses] = useState({});
  const [submittingPlayer, setSubmittingPlayer] = useState(false);

  // Team-Level Identity Proof state
  const [canUploadIdentityProof, setCanUploadIdentityProof] = useState(false);
  const [identityProofDeadline, setIdentityProofDeadline] = useState(null);
  const [isIdentityProofDeadlinePassed, setIsIdentityProofDeadlinePassed] = useState(false);

  // Add Player by Username Modal State
  const [addPlayerModalOpen, setAddPlayerModalOpen] = useState(false);
  const [searchUsername, setSearchUsername] = useState('');
  const [searchingUser, setSearchingUser] = useState(false);
  const [searchedUser, setSearchedUser] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);

  // Copied state
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, [id, user]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      // 1. Fetch tournament specifications and form
      const formRes = await API.get(`/tournaments/${id}/form`);
      let fetchedTournament = null;
      if (formRes.data.success) {
        fetchedTournament = formRes.data.tournament;
        setTournament(fetchedTournament);
        setForm(formRes.data.form);
      }

      // 2. If logged in, check if user is already in a team for this tournament
      if (user) {
        const myRegsRes = await API.get('/registrations/my-tournaments');
        if (myRegsRes.data.success) {
          const tournamentActualId = (fetchedTournament?._id || '').toString();
          const matched = (myRegsRes.data.registrations || []).find((r) => {
            const rTid = (r.tournament?._id || r.tournament)?.toString();
            const rSlug = r.tournament?.slug;
            return (
              rTid === id ||
              (tournamentActualId && rTid === tournamentActualId) ||
              (rSlug && rSlug === id) ||
              (fetchedTournament?.slug && rSlug === fetchedTournament.slug)
            );
          });
          if (matched) {
            // Load full workspace
            const wsRes = await API.get(`/registrations/${matched._id}`);
            if (wsRes.data.success) {
              setActiveRegistration(wsRes.data.registration);
              setCanUploadIdentityProof(Boolean(wsRes.data.canUploadIdentityProof));
              setIdentityProofDeadline(wsRes.data.identityProofDeadline);
              setIsIdentityProofDeadlinePassed(Boolean(wsRes.data.isIdentityProofDeadlinePassed));

              if (wsRes.data.currentUserState?.responses) {
                const mapObj = {};
                const resps = wsRes.data.currentUserState.responses;
                if (resps instanceof Object) {
                  Object.keys(resps).forEach((k) => {
                    mapObj[k] = resps[k];
                  });
                }
                setPlayerResponses(mapObj);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to load registration data:', err);
      addToast('Failed to load tournament registration', 'error');
    } finally {
      setLoading(false);
    }
  };

  const reloadRegistration = async (regId) => {
    try {
      const wsRes = await API.get(`/registrations/${regId}`);
      if (wsRes.data.success) {
        setActiveRegistration(wsRes.data.registration);
        setCanUploadIdentityProof(Boolean(wsRes.data.canUploadIdentityProof));
        setIdentityProofDeadline(wsRes.data.identityProofDeadline);
        setIsIdentityProofDeadlinePassed(Boolean(wsRes.data.isIdentityProofDeadlinePassed));
        if (wsRes.data.currentUserState?.responses) {
          setPlayerResponses(wsRes.data.currentUserState.responses);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const [uploadingProof, setUploadingProof] = useState(false);
  const [removingProof, setRemovingProof] = useState(false);
  const [proofError, setProofError] = useState('');
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [selectedFileMeta, setSelectedFileMeta] = useState(null);

  const MAX_PDF_SIZE = 5 * 1024 * 1024; // 5 MB

  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleUploadTeamProof = async (file) => {
    if (!file) return;
    setProofError('');
    setShowRemoveConfirm(false);

    // Validate PDF MIME type
    if (file.type !== 'application/pdf') {
      setProofError('Only PDF files are accepted. Please upload a .pdf document.');
      return;
    }

    // Validate extension
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext !== 'pdf') {
      setProofError('Only .pdf files are accepted.');
      return;
    }

    // Validate size (Show current file size before rejecting)
    const currentSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    if (file.size > MAX_PDF_SIZE) {
      setProofError(`PDF must be 5 MB or smaller. Your file is ${currentSizeMB} MB.`);
      return;
    }

    setSelectedFileMeta({ name: file.name, size: file.size });

    try {
      setUploadingProof(true);

      // Direct multipart upload to /team-identity-proof
      const formData = new FormData();
      formData.append('file', file);

      const res = await API.put(`/registrations/${activeRegistration._id}/team-identity-proof`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        addToast('Team Identity Proof PDF uploaded successfully!', 'success');
        if (res.data.registration) {
          setActiveRegistration(res.data.registration);
        } else {
          reloadRegistration(activeRegistration._id);
        }
        setSelectedFileMeta(null);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to upload team identity proof.';
      setProofError(msg);
      addToast(msg, 'error');
    } finally {
      setUploadingProof(false);
    }
  };

  const executeRemoveProof = async () => {
    try {
      setRemovingProof(true);
      setProofError('');
      const res = await API.delete(`/registrations/${activeRegistration._id}/team-identity-proof`);
      if (res.data.success) {
        addToast('Team identity proof removed successfully.', 'success');
        setShowRemoveConfirm(false);
        if (res.data.registration) {
          setActiveRegistration(res.data.registration);
        } else {
          reloadRegistration(activeRegistration._id);
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to remove identity proof. Please try again.';
      setProofError(msg);
      addToast(msg, 'error');
    } finally {
      setRemovingProof(false);
    }
  };


  // 1. Handle Team Creation
  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!teamName.trim()) {
      addToast('Please enter a team name', 'error');
      return;
    }

    try {
      setCreating(true);
      const res = await API.post(`/tournaments/${id}/registrations/create-team`, {
        teamName: teamName.trim(),
        teamType,
      });

      if (res.data.success) {
        addToast(res.data.message || 'Squad created successfully!', 'success');
        setActiveRegistration(res.data.registration);
        if (res.data.registration?.players?.[0]?.responses) {
          const mapObj = {};
          const resps = res.data.registration.players[0].responses;
          Object.keys(resps).forEach((k) => {
            mapObj[k] = resps[k];
          });
          setPlayerResponses(mapObj);
        }
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create team', 'error');
    } finally {
      setCreating(false);
    }
  };

  // 2. Handle Join with Code
  const handleJoinTeam = async (e) => {
    e.preventDefault();
    if (!inputCode.trim()) {
      addToast('Please enter a team invite code', 'error');
      return;
    }

    try {
      setJoining(true);
      const res = await API.post('/registrations/join', {
        teamCode: inputCode.trim(),
      });

      if (res.data.success) {
        addToast(res.data.message || 'Joined squad successfully!', 'success');
        setActiveRegistration(res.data.registration);
        const mySlot = res.data.registration?.players?.find(
          (p) => (p.user?._id || p.user)?.toString() === (user?._id || user?.id)?.toString()
        );
        const existingResponses = mySlot?.responses
          ? mySlot.responses instanceof Map
            ? Object.fromEntries(mySlot.responses)
            : { ...mySlot.responses }
          : {};
        setPlayerResponses({
          player_name: user?.name || '',
          college_name: user?.college || '',
          college_id: user?.studentId || '',
          phone_number: user?.phone || '',
          ...existingResponses,
        });
        setPlayerModalOpen(true);
        if (res.data.tournamentSlug && res.data.tournamentSlug !== id && res.data.tournamentId !== id) {
          navigate(`/tournaments/${res.data.tournamentSlug || res.data.tournamentId}/register`);
        }
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to join team', 'error');
    } finally {
      setJoining(false);
    }
  };

  // 3. Handle Player Info Submission
  const handlePlayerSubmit = async (e) => {
    e.preventDefault();
    if (!activeRegistration) return;

    try {
      setSubmittingPlayer(true);
      const res = await API.put(`/registrations/${activeRegistration._id}/player-submission`, {
        responses: playerResponses,
      });

      if (res.data.success) {
        addToast(res.data.message || 'Player information saved!', 'success');
        setPlayerModalOpen(false);
        reloadRegistration(activeRegistration._id);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Please complete all required fields', 'error');
    } finally {
      setSubmittingPlayer(false);
    }
  };

  // 4. Handle Member Removal (Captain only)
  const handleRemoveMember = async (memberUserId, memberName) => {
    if (!window.confirm(`Remove ${memberName || 'this player'} from the team roster?`)) return;

    try {
      const res = await API.delete(`/registrations/${activeRegistration._id}/members/${memberUserId}`);
      if (res.data.success) {
        addToast('Member removed from squad', 'success');
        reloadRegistration(activeRegistration._id);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to remove member', 'error');
    }
  };

  // 5. Handle Leave / Deregister Squad
  const handleLeaveSquad = async () => {
    if (!window.confirm('Are you sure you want to deregister from this tournament squad?')) return;

    try {
      const res = await API.post(`/tournaments/${id}/deregister`);
      if (res.data.success) {
        addToast(res.data.message || 'You have deregistered from the tournament', 'success');
        setActiveRegistration(null);
        navigate(`/tournaments/${id}`);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to deregister', 'error');
    }
  };

  // 6. Handle Search User by Username
  const handleSearchUser = async (e) => {
    e.preventDefault();
    if (!searchUsername.trim()) return;

    try {
      setSearchingUser(true);
      setSearchError('');
      setSearchedUser(null);
      const res = await API.get(`/users/search/${encodeURIComponent(searchUsername.trim())}`);
      if (res.data.success) {
        setSearchedUser(res.data.user);
      }
    } catch (err) {
      setSearchError(err.response?.data?.message || 'User not found.');
    } finally {
      setSearchingUser(false);
    }
  };

  // 7. Handle Send Tournament Invite
  const handleSendInvite = async () => {
    if (!searchedUser || !activeRegistration) return;

    try {
      setSendingInvite(true);
      const res = await API.post(`/registrations/${activeRegistration._id}/invitations`, {
        username: searchedUser.username,
      });

      if (res.data.success) {
        addToast(res.data.message || 'Invitation sent successfully!', 'success');
        setAddPlayerModalOpen(false);
        setSearchUsername('');
        setSearchedUser(null);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to send invitation', 'error');
    } finally {
      setSendingInvite(false);
    }
  };

  // Copy Invite Link
  const handleCopyInvite = () => {
    const inviteUrl = `${window.location.origin}/tournaments/${id}/register?code=${activeRegistration?.teamCode}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    addToast('Invite link copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) return <Loading message="Loading Tournament Registration Workspace..." />;
  if (!tournament) return <EmptyState title="Tournament Not Found" description="The tournament registration page could not be found." />;

  // Check login
  if (!isAuthenticated) {
    return (
      <div className="py-12 px-4 max-w-lg mx-auto text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 flex items-center justify-center mx-auto shadow-xl">
          <Trophy className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-white font-mono">AUTHENTICATION REQUIRED</h1>
          <p className="text-xs text-slate-300">
            You must be signed in with your student account to register a squad or join a teammate's roster for <strong>{tournament.name}</strong>.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to={`/login?redirect=/tournaments/${id}/register${codeParam ? `?code=${codeParam}` : ''}`}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider"
          >
            Sign In to Continue
          </Link>
          <Link
            to={`/register?redirect=/tournaments/${id}/register${codeParam ? `?code=${codeParam}` : ''}`}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs border border-slate-700"
          >
            Create New Account
          </Link>
        </div>
      </div>
    );
  }

  const teamQuestions = (form?.questions || []).filter((q) => q.scope === 'team');
  const playerQuestions = (form?.questions || []).filter(
    (q) =>
      q.scope === 'player' &&
      q.id !== 'identity_proof' &&
      q.id !== 'student_id_proof' &&
      q.id !== 'team_identity_proof'
  );

  const minStarters = tournament?.minTeamSize || 4;
  const maxCapacity = tournament?.maxTeamSize || 5;

  const workspaceData = {
    canUploadIdentityProof,
    identityProofDeadline,
    isIdentityProofDeadlinePassed,
  };

  // Active Squad Workspace View
  if (activeRegistration) {
    const currentUserId = (user?._id || user?.id)?.toString();
    const isCaptain =
      ((activeRegistration.captain?._id || activeRegistration.captain)?.toString() === currentUserId) ||
      ((activeRegistration.leader?._id || activeRegistration.leader)?.toString() === currentUserId);
    const myPlayerSlot = activeRegistration.players?.find(
      (p) => (p.user?._id || p.user)?.toString() === currentUserId
    );

    const starters = activeRegistration.players?.filter((p) => p.role === 'captain' || p.role === 'starter') || [];
    const completedStarters = starters.filter((p) => p.status === 'completed');
    const isTeamComplete = activeRegistration.status === 'complete' || activeRegistration.status === 'verified';

    return (
      <div className="py-6 sm:py-10 px-3.5 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full space-y-6">
        {/* Breadcrumb & Tournament strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <Link
            to={`/tournaments/${tournament.slug || tournament._id}`}
            className="text-xs text-slate-400 hover:text-cyan-400 font-mono flex items-center gap-1.5"
          >
            ← Back to {tournament.name}
          </Link>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-950 text-cyan-300 border border-cyan-500/30">
            {tournament.game} Arena
          </span>
        </div>

        {/* Squad Status Header */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/60 border border-slate-800 shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 font-mono flex items-center gap-1">
                  <Shield className="w-4 h-4" /> Tournament Squad Hub
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    isTeamComplete
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                      : 'bg-amber-950 text-amber-300 border-amber-500/50'
                  }`}
                >
                  {activeRegistration.status === 'verified'
                    ? '✓ VERIFIED BY ADMIN'
                    : isTeamComplete
                    ? '✓ REGISTRATION COMPLETE'
                    : '⏳ INCOMPLETE SQUAD'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white font-mono">
                {activeRegistration.teamName}
              </h1>
              <p className="text-xs text-slate-300">
                Team Type: <span className="font-semibold text-cyan-400">{activeRegistration.teamType || 'UEM Student Team'}</span> • Captain: <strong>{activeRegistration.captain?.name}</strong> • Competing in{' '}
                <strong>{tournament.name}</strong>
              </p>
            </div>

            {/* Invite Code Badge & Copy Link */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-cyan-500/30 shadow-lg space-y-2.5 max-w-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Team Invite Code:</span>
                <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono font-black text-sm border border-cyan-500/40">
                  {activeRegistration.teamCode}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopyInvite}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs font-mono flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Invite Link Copied!' : 'Copy Teammate Invite Link'}
              </button>
            </div>
          </div>

          {/* Live Progress Bar Strip */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300 font-bold">
                Starter Roster Completion:
              </span>
              <span className="font-black text-cyan-400">
                {completedStarters.length} / {minStarters} Required Players
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-900 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  isTeamComplete ? 'bg-gradient-to-r from-emerald-500 to-cyan-400' : 'bg-gradient-to-r from-amber-500 to-indigo-500'
                }`}
                style={{ width: `${Math.min(100, (completedStarters.length / minStarters) * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              {isTeamComplete
                ? '🎉 All required starters have submitted their verification details. Your squad registration is officially complete!'
                : `Need ${minStarters - completedStarters.length} more starter player(s) to complete registration before the deadline.`}
            </p>
          </div>
        </div>

        {/* Current User Action Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-cyan-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white font-mono">Your Status ({user?.name || user?.username || 'Player'}):</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  myPlayerSlot?.status === 'completed'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/40'
                    : 'bg-amber-950 text-amber-300 border border-amber-600/40'
                }`}
              >
                {myPlayerSlot?.status === 'completed' ? '✓ Profile Completed' : '⏳ Details Required'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {myPlayerSlot?.status === 'completed'
                ? 'You have submitted all required player questions and document verification proof.'
                : 'You still need to complete your player details (UID, IGN, ID proof) for this tournament.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              const existingResponses = myPlayerSlot?.responses
                ? myPlayerSlot.responses instanceof Map
                  ? Object.fromEntries(myPlayerSlot.responses)
                  : { ...myPlayerSlot.responses }
                : {};
              setPlayerResponses({
                player_name: user?.name || '',
                college_name: user?.college || '',
                college_id: user?.studentId || '',
                phone_number: user?.phone || '',
                ...existingResponses,
              });
              setPlayerModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            {myPlayerSlot?.status === 'completed' ? 'Update Your Information' : 'Complete Player Form'}
          </button>
        </div>

        {/* Roster Slots List */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" /> Squad Roster Slots ({activeRegistration.players?.length} / {maxCapacity})
              </h3>
              {isCaptain && (activeRegistration.players?.length || 0) < maxCapacity && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchUsername('');
                    setSearchedUser(null);
                    setSearchError('');
                    setAddPlayerModalOpen(true);
                  }}
                  className="px-3 py-1 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs uppercase font-mono tracking-wider flex items-center gap-1 shadow-md shadow-cyan-500/20"
                >
                  <UserPlus className="w-3.5 h-3.5" /> + Add Player
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={handleLeaveSquad}
              className="text-xs text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1 font-mono cursor-pointer"
            >
              <LogOut className="w-3 h-3" /> De-register from Tournament
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Filled Roster Slots */}
            {activeRegistration.players?.map((slot) => {
              const slotUserId = (slot.user?._id || slot.user)?.toString();
              const isMe = slotUserId === currentUserId;
              const captainUserId = (
                activeRegistration.captain?._id ||
                activeRegistration.captain ||
                activeRegistration.leader?._id ||
                activeRegistration.leader
              )?.toString();
              const isSlotCaptain = slot.role === 'captain' || slotUserId === captainUserId;
              const isSubstitute = slot.role === 'substitute' || slot.slotNumber > minStarters;

              return (
                <div
                  key={slot._id || slot.slotNumber}
                  className={`p-4 rounded-2xl border flex items-start justify-between gap-3 shadow-md ${
                    isSlotCaptain
                      ? 'bg-slate-900/80 border-amber-900/40'
                      : isSubstitute
                      ? 'bg-slate-900/70 border-purple-900/40'
                      : 'bg-slate-900/70 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img
                      src={
                        slot.user?.avatar ||
                        'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=150&q=80'
                      }
                      alt={slot.user?.name}
                      className="w-11 h-11 rounded-xl object-cover border border-slate-700 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs sm:text-sm font-bold text-white font-mono truncate">
                          PLAYER {slot.slotNumber}: {slot.user?.name} {isMe && <span className="text-cyan-400">(You)</span>}
                        </h4>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase ${
                            isSlotCaptain
                              ? 'bg-amber-950 text-amber-300 border border-amber-700/50'
                              : isSubstitute
                              ? 'bg-purple-950 text-purple-300 border border-purple-700/50'
                              : 'bg-indigo-950 text-indigo-300 border border-indigo-700/50'
                          }`}
                        >
                          {isSlotCaptain ? '👑 Captain' : isSubstitute ? 'Substitute' : 'Required Starter'}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono truncate">
                          @{slot.user?.username}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            slot.status === 'completed'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}
                        >
                          {slot.status === 'completed' ? '✓ Profile Completed' : '⏳ Details Incomplete'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Actions for current player (Fill / Edit details) */}
                    {isMe && (
                      <button
                        type="button"
                        onClick={() => {
                          const existingResponses = slot.responses
                            ? slot.responses instanceof Map
                              ? Object.fromEntries(slot.responses)
                              : { ...slot.responses }
                            : {};
                          setPlayerResponses({
                            player_name: user?.name || '',
                            college_name: user?.college || '',
                            college_id: user?.studentId || '',
                            phone_number: user?.phone || '',
                            ...existingResponses,
                          });
                          setPlayerModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Edit3 className="w-3 h-3" />
                        {slot.status === 'completed' ? 'Edit Details' : 'Fill Details'}
                      </button>
                    )}

                    {/* Actions for Captain / Leader */}
                    {isCaptain && !isSlotCaptain && (
                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveMember(
                            (slot.user?._id || slot.user)?.toString(),
                            slot.user?.name || slot.user?.username
                          )
                        }
                        className="px-2 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 border border-rose-600/40 text-rose-300 hover:text-white transition-all cursor-pointer flex items-center gap-1 text-[10px] font-mono font-bold"
                        title="Remove member from squad"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Empty Required Starter Slots (Up to minStarters) */}
            {Array.from({ length: Math.max(0, minStarters - (activeRegistration.players?.length || 0)) }).map((_, i) => {
              const currentCount = activeRegistration.players?.length || 0;
              const slotNum = currentCount + i + 1;

              return (
                <div
                  key={`empty-starter-${i}`}
                  onClick={() => {
                    if (isCaptain) {
                      setSearchUsername('');
                      setSearchedUser(null);
                      setSearchError('');
                      setAddPlayerModalOpen(true);
                    } else {
                      handleCopyInvite();
                    }
                  }}
                  className="p-4 rounded-2xl border-2 border-dashed border-cyan-800/40 hover:border-cyan-500 bg-slate-950/40 flex items-center justify-between gap-3 cursor-pointer group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 group-hover:text-cyan-400">
                      <UserPlus className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 font-mono">
                        PLAYER {slotNum} (Required Starter)
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {isCaptain ? 'Click to search username & invite player' : 'Click to copy invite link & add teammate'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-cyan-400 font-mono underline group-hover:text-cyan-300">
                    {isCaptain ? '+ Add Player' : 'Invite Teammate'}
                  </span>
                </div>
              );
            })}

            {/* Dynamic [+ Add Player] Slot (Up to maxCapacity) */}
            {(activeRegistration.players?.length || 0) >= minStarters &&
              (activeRegistration.players?.length || 0) < maxCapacity && (
                <div
                  onClick={() => {
                    if (isCaptain) {
                      setSearchUsername('');
                      setSearchedUser(null);
                      setSearchError('');
                      setAddPlayerModalOpen(true);
                    } else {
                      handleCopyInvite();
                    }
                  }}
                  className="p-4 rounded-2xl border-2 border-dashed border-purple-800/50 hover:border-purple-500 bg-purple-950/10 flex items-center justify-between gap-3 cursor-pointer group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-purple-950/40 border border-purple-800 flex items-center justify-center text-purple-400 group-hover:text-purple-300">
                      <UserPlus className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-purple-200 font-mono">
                        [+ Add Player {(activeRegistration.players?.length || 0) + 1} (Substitute)]
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Optional substitute slot available ({activeRegistration.players?.length}/{maxCapacity})
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-purple-400 font-mono underline group-hover:text-purple-300">
                    {isCaptain ? '+ Add Player' : 'Copy Invite Link'}
                  </span>
                </div>
              )}
          </div>

          {/* ONE TEAM-LEVEL IDENTITY PROOF (Only unlocked after required players complete their details) */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Team Identity Proof (Single PDF)
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    Private / Admin Only
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                  Upload ONE PDF containing the identity/college proof of all registered team members. For UEM students, include the required IEMCRP/college proof for each member.
                </p>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2 self-start md:self-auto">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                    activeRegistration.identityProof?.status === 'verified'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : activeRegistration.identityProof?.status === 'rejected'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : activeRegistration.identityProof?.url
                      ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}
                >
                  Status: {activeRegistration.identityProof?.status || (activeRegistration.identityProof?.url ? 'Submitted' : 'Pending')}
                </span>
              </div>
            </div>

            {/* Deadline information */}
            {identityProofDeadline && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                  isIdentityProofDeadlinePassed
                    ? 'bg-rose-950/20 border-rose-800/40 text-rose-300'
                    : 'bg-purple-950/20 border-purple-800/30 text-purple-300'
                }`}
              >
                <span>
                  ⏰ <strong>Identity Proof Submission Deadline:</strong>{' '}
                  {new Date(identityProofDeadline).toLocaleString()}
                </span>
                {isIdentityProofDeadlinePassed && (
                  <span className="font-bold text-rose-400 uppercase tracking-wide text-[10px]">
                    Deadline Passed — Submissions Locked
                  </span>
                )}
              </div>
            )}

            {/* Step Unlock Guidance */}
            {!canUploadIdentityProof ? (
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 text-amber-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold">Team Identity Proof is locked</p>
                  <p className="text-amber-300/80 mt-0.5">
                    All required starter players ({minStarters}) must join and complete their profile details before the combined team identity proof PDF can be submitted.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Error display */}
                {proofError && (
                  <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{proofError}</span>
                    <button type="button" onClick={() => setProofError('')} className="ml-auto p-0.5 hover:bg-rose-900/40 rounded">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {activeRegistration.identityProof?.url ? (
                  /* ── Uploaded PDF Display ── */
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-lg bg-purple-950/60 border border-purple-800/50 flex items-center justify-center text-purple-400 shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-200 truncate">
                            📄 {activeRegistration.identityProof.fileName || 'Combined_Team_Identity_Proof.pdf'}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-slate-400 mt-0.5">
                            {activeRegistration.identityProof.fileSize ? (
                              <span>Size: <strong className="text-slate-300 font-mono">{formatFileSize(activeRegistration.identityProof.fileSize)}</strong></span>
                            ) : null}
                            {activeRegistration.identityProof.submittedAt && (
                              <span>Uploaded {new Date(activeRegistration.identityProof.submittedAt).toLocaleDateString()}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span className="text-[10px] font-bold text-emerald-400 font-mono">Uploaded Successfully</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Confirmation dialog for Remove */}
                    {showRemoveConfirm && !isIdentityProofDeadlinePassed && (
                      <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 space-y-2.5 animate-in fade-in duration-150">
                        <div className="flex items-start gap-2.5">
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-rose-200">
                              Remove the team identity proof PDF?
                            </p>
                            <p className="text-[10px] text-rose-300/80">
                              This will permanently delete the document from cloud storage and remove it from your registration.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setShowRemoveConfirm(false)}
                            disabled={removingProof}
                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={executeRemoveProof}
                            disabled={removingProof}
                            className="px-3 py-1 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 transition-colors shadow"
                          >
                            {removingProof ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Removing...
                              </>
                            ) : (
                              <>
                                <Trash2 className="w-3.5 h-3.5" />
                                Remove
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                      <a
                        href={activeRegistration.identityProof.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 flex items-center gap-1.5 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        View PDF
                      </a>

                      {!isIdentityProofDeadlinePassed && (
                        <>
                          <label
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-600/20 text-sky-300 border border-sky-500/30 hover:bg-sky-600/30 flex items-center gap-1.5 cursor-pointer transition-colors ${
                              uploadingProof ? 'opacity-50 pointer-events-none' : ''
                            }`}
                          >
                            {uploadingProof ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Replacing...
                              </>
                            ) : (
                              <>
                                <Upload className="w-3.5 h-3.5" />
                                Replace
                              </>
                            )}
                            <input
                              type="file"
                              accept=".pdf,application/pdf"
                              className="hidden"
                              disabled={uploadingProof}
                              onChange={(e) => {
                                if (e.target.files?.[0]) handleUploadTeamProof(e.target.files[0]);
                                e.target.value = '';
                              }}
                            />
                          </label>

                          <button
                            type="button"
                            onClick={() => setShowRemoveConfirm(true)}
                            disabled={removingProof || showRemoveConfirm}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600/30 flex items-center gap-1.5 transition-colors ${
                              removingProof ? 'opacity-50 pointer-events-none' : ''
                            }`}
                            title="Remove team identity proof"
                          >
                            <X className="w-3.5 h-3.5 text-rose-400" />
                            Remove
                          </button>
                        </>
                      )}
                    </div>

                    {isIdentityProofDeadlinePassed && (
                      <p className="text-[10px] text-slate-500 italic mt-1">
                        Identity proof submission deadline has passed. Replace and remove are disabled.
                      </p>
                    )}
                  </div>
                ) : (
                  /* ── Upload PDF Control ── */
                  isIdentityProofDeadlinePassed ? (
                    <p className="text-xs text-slate-500 italic">
                      Identity proof submission deadline has passed. Uploading is disabled.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-400">
                        Accepted format: <strong className="text-slate-200">PDF only</strong> · Maximum size: <strong className="text-slate-200">5 MB</strong>
                      </p>

                      <label
                        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center gap-2 ${
                          uploadingProof
                            ? 'border-cyan-500/40 bg-cyan-950/20'
                            : 'border-slate-700 hover:border-purple-500/50 bg-slate-900/40 hover:bg-slate-900/60'
                        }`}
                      >
                        <input
                          type="file"
                          accept=".pdf,application/pdf"
                          className="hidden"
                          disabled={uploadingProof}
                          onChange={(e) => {
                            if (e.target.files?.[0]) handleUploadTeamProof(e.target.files[0]);
                            e.target.value = '';
                          }}
                        />

                        {uploadingProof ? (
                          <>
                            <Loader2 className="w-7 h-7 text-cyan-400 animate-spin" />
                            <div className="space-y-0.5">
                              <span className="text-xs text-slate-300 font-mono">Uploading PDF to secure storage...</span>
                              {selectedFileMeta && (
                                <p className="text-[10px] text-slate-400">
                                  {selectedFileMeta.name} ({formatFileSize(selectedFileMeta.size)})
                                </p>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-10 h-10 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-400 flex items-center justify-center">
                              <Upload className="w-5 h-5" />
                            </div>
                            <div className="text-xs font-semibold text-slate-200">
                              <span className="text-purple-400 underline">Upload PDF</span>
                            </div>
                            <p className="text-[10px] text-slate-500">
                              Upload ONE PDF containing the identity/college proof for all registered team members
                            </p>
                          </>
                        )}
                      </label>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>

        {/* Player Form Modal */}
        <Modal
          isOpen={playerModalOpen}
          onClose={() => setPlayerModalOpen(false)}
          title={`Complete Player Details: ${user?.name || user?.username || 'Player'}`}
        >
          <form onSubmit={handlePlayerSubmit} className="space-y-4">
            <p className="text-xs text-slate-400 pb-2 border-b border-slate-800">
              Please complete all required tournament fields and upload your college verification proof.
            </p>

            <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-1">
              {playerQuestions.map((q) => {
                const isUpload = q.fieldType === 'image_upload' || q.fieldType === 'file_upload';
                const isPdfDoc = q.id === 'identity_proof' || q.fieldType === 'file_upload';

                if (isUpload) {
                  return (
                    <div key={q.id}>
                      <CloudinaryUpload
                        label={`${q.label} ${q.required ? '*' : ''}`}
                        helpText={
                          isPdfDoc
                            ? 'Single PDF only (College ID card or fee receipt, max 10MB)'
                            : q.helpText || 'Upload photo or avatar'
                        }
                        value={playerResponses[q.id] || ''}
                        type={q.isPublic ? 'public' : 'private'}
                        accept={isPdfDoc ? '.pdf,application/pdf' : 'image/*'}
                        onChange={(url) => setPlayerResponses({ ...playerResponses, [q.id]: url })}
                      />
                      {isPdfDoc && (
                        <p className="text-[10px] text-amber-400 flex items-center gap-1 mt-1 font-mono">
                          <Lock className="w-3 h-3" /> Private: Document is stored securely and only accessible to tournament organizers.
                        </p>
                      )}
                    </div>
                  );
                }

                if (q.fieldType === 'dropdown') {
                  return (
                    <div key={q.id} className="space-y-1">
                      <label className="block text-xs font-mono font-bold text-slate-300">
                        {q.label} {q.required && <span className="text-rose-400">*</span>}
                      </label>
                      {q.helpText && <p className="text-[10px] text-slate-500">{q.helpText}</p>}
                      <select
                        required={q.required}
                        value={playerResponses[q.id] || ''}
                        onChange={(e) => setPlayerResponses({ ...playerResponses, [q.id]: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400"
                      >
                        <option value="">{q.placeholder || 'Select...'}</option>
                        {q.options?.map((opt, oI) => (
                          <option key={oI} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                }

                if (q.fieldType === 'long_text') {
                  return (
                    <div key={q.id} className="space-y-1">
                      <label className="block text-xs font-mono font-bold text-slate-300">
                        {q.label} {q.required && <span className="text-rose-400">*</span>}
                      </label>
                      <textarea
                        rows={3}
                        required={q.required}
                        value={playerResponses[q.id] || ''}
                        onChange={(e) => setPlayerResponses({ ...playerResponses, [q.id]: e.target.value })}
                        placeholder={q.placeholder || ''}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  );
                }

                return (
                  <div key={q.id} className="space-y-1">
                    <label className="block text-xs font-mono font-bold text-slate-300">
                      {q.label} {q.required && <span className="text-rose-400">*</span>}
                    </label>
                    {q.helpText && <p className="text-[10px] text-slate-500">{q.helpText}</p>}
                    <input
                      type={q.fieldType === 'number' ? 'number' : q.fieldType === 'email' ? 'email' : 'text'}
                      required={q.required}
                      value={playerResponses[q.id] || ''}
                      onChange={(e) => setPlayerResponses({ ...playerResponses, [q.id]: e.target.value })}
                      placeholder={q.placeholder || ''}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setPlayerModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingPlayer}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-xs font-bold text-white shadow-md shadow-cyan-500/20 disabled:opacity-50"
              >
                {submittingPlayer ? 'Saving...' : 'Submit Player Details'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Add Player by Username Modal */}
        <Modal
          isOpen={addPlayerModalOpen}
          onClose={() => {
            setAddPlayerModalOpen(false);
            setSearchUsername('');
            setSearchedUser(null);
            setSearchError('');
          }}
          title="Invite Player to Squad"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Enter the exact username of the registered student/player you want to add to your tournament roster.
            </p>

            <form onSubmit={handleSearchUser} className="flex gap-2">
              <input
                type="text"
                required
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
                placeholder="e.g. sanglap123"
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
              />
              <button
                type="submit"
                disabled={searchingUser}
                className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider font-mono disabled:opacity-50"
              >
                {searchingUser ? 'Searching...' : 'Search'}
              </button>
            </form>

            {searchError && (
              <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{searchError}</span>
              </div>
            )}

            {searchedUser && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-800/40 space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src={searchedUser.avatar || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=150&q=80'}
                    alt={searchedUser.name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white font-mono truncate">
                      {searchedUser.name}
                    </h4>
                    <p className="text-xs text-cyan-400 font-mono">
                      @{searchedUser.username}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {searchedUser.college || 'UEM Jaipur'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={sendingInvite}
                  onClick={handleSendInvite}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-cyan-500/20 disabled:opacity-50 flex items-center justify-center gap-1.5 font-mono"
                >
                  <UserPlus className="w-4 h-4" />
                  {sendingInvite ? 'Sending Invite...' : 'Send Tournament Invite'}
                </button>
              </div>
            )}
          </div>
        </Modal>
      </div>
    );
  }

  // Registration Hub (Create Squad vs Join with Code)
  return (
    <div className="py-8 sm:py-12 px-3.5 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-8">
      {/* Tournament Card Strip */}
      <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-mono">
              {tournament.game}
            </span>
            <span className="text-xs text-slate-400">Collegiate Championship</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white font-mono">
            {tournament.name}
          </h1>
          <p className="text-xs text-slate-400">
            Min Roster: {minStarters} Players • Max Roster: {maxCapacity} Players
          </p>
        </div>

        <Link
          to={`/tournaments/${tournament.slug || tournament._id}`}
          className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white"
        >
          View Tournament Details
        </Link>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold">
        <button
          type="button"
          onClick={() => setMode('create')}
          className={`py-2.5 rounded-xl transition-all ${
            mode === 'create'
              ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          👑 Create New Squad (Captain)
        </button>
        <button
          type="button"
          onClick={() => setMode('join')}
          className={`py-2.5 rounded-xl transition-all ${
            mode === 'join'
              ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🎯 Join with Team Code
        </button>
      </div>

      {/* 1. CREATE SQUAD FORM (Contains ONLY Team Name + Team Type) */}
      {mode === 'create' ? (
        <form onSubmit={handleCreateTeam} className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" /> Create Team
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Enter your team name and select your team type to register. You will automatically become the Team Leader.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold text-slate-300">
                Team Name *
              </label>
              <input
                type="text"
                required
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Team Alpha"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold text-slate-300">
                Team Type *
              </label>
              <select
                value={teamType}
                onChange={(e) => setTeamType(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-400 font-mono"
              >
                <option value="UEM Student Team">UEM Student Team</option>
                <option value="Outside Team">Outside Team</option>
                <option value="Mixed Team">Mixed Team</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => navigate(`/tournaments/${id}`)}
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 disabled:opacity-50 cursor-pointer transition-all"
            >
              {creating ? 'Creating Team...' : 'Create Team'}
            </button>
          </div>
        </form>
      ) : (
        /* 2. JOIN SQUAD FORM */
        <form onSubmit={handleJoinTeam} className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-400" /> Join Squad via Invite Code
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Enter the unique team code received from your squad captain to join their tournament roster.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-mono font-bold text-slate-300">
              Team Invite Code *
            </label>
            <input
              type="text"
              required
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="e.g. BGMI-X7K29"
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-base text-cyan-300 font-mono font-black uppercase tracking-wider focus:outline-none focus:border-cyan-400"
            />
          </div>

          <button
            type="submit"
            disabled={joining}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
          >
            {joining ? 'Verifying Code & Joining...' : 'Join Squad Roster'}
          </button>
        </form>
      )}
    </div>
  );
};

export default TournamentRegister;
