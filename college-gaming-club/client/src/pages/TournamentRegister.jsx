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
  const [teamTag, setTeamTag] = useState('');
  const [teamLogo, setTeamLogo] = useState('');
  const [teamResponses, setTeamResponses] = useState({});
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
      if (formRes.data.success) {
        setTournament(formRes.data.tournament);
        setForm(formRes.data.form);
      }

      // 2. If logged in, check if user is already in a team for this tournament
      if (user) {
        const myRegsRes = await API.get('/registrations/my-tournaments');
        if (myRegsRes.data.success) {
          const matched = (myRegsRes.data.registrations || []).find(
            (r) => (r.tournament?._id || r.tournament) === id
          );
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

  const handleUploadTeamProof = async (url) => {
    if (!url) return;
    try {
      const res = await API.put(`/registrations/${activeRegistration._id}/team-identity-proof`, { url });
      if (res.data.success) {
        addToast('Team Identity Proof PDF uploaded successfully!', 'success');
        reloadRegistration(activeRegistration._id);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to upload team identity proof', 'error');
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
        teamTag: teamTag.trim() || undefined,
        teamLogo: teamLogo || undefined,
        teamResponses,
      });

      if (res.data.success) {
        addToast(res.data.message || 'Squad created successfully!', 'success');
        setActiveRegistration(res.data.registration);
        // Pre-fill user defaults for player form
        setPlayerResponses({
          player_name: user?.name || '',
          college_name: user?.college || '',
        });
        // Open player form modal immediately so captain can complete slot 1
        setPlayerModalOpen(true);
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
        setPlayerResponses({
          player_name: user?.name || '',
          college_name: user?.college || '',
        });
        setPlayerModalOpen(true);
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

  // 5. Handle Leave Squad
  const handleLeaveSquad = async () => {
    if (!window.confirm('Are you sure you want to leave this squad?')) return;

    try {
      const res = await API.post(`/registrations/${activeRegistration._id}/leave`);
      if (res.data.success) {
        addToast('You have left the squad', 'success');
        setActiveRegistration(null);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to leave squad', 'error');
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

  const minStarters = tournament.minTeamSize || 4;
  const maxCapacity = tournament.maxTeamSize || 5;

  // Active Squad Workspace View
  if (activeRegistration) {
    const isCaptain = (activeRegistration.captain?._id || activeRegistration.captain) === user?._id;
    const myPlayerSlot = activeRegistration.players?.find(
      (p) => (p.user?._id || p.user) === user?._id
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
                {activeRegistration.teamName}{' '}
                {activeRegistration.teamTag && (
                  <span className="text-indigo-400 text-xl font-normal">[{activeRegistration.teamTag}]</span>
                )}
              </h1>
              <p className="text-xs text-slate-300">
                Captain: <strong>{activeRegistration.captain?.name}</strong> • Competing in{' '}
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
              <span className="text-xs font-bold text-white font-mono">Your Status ({user.name}):</span>
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
            onClick={() => setPlayerModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shrink-0"
          >
            <Edit3 className="w-3.5 h-3.5" />
            {myPlayerSlot?.status === 'completed' ? 'Update Your Information' : 'Complete Player Form'}
          </button>
        </div>

        {/* Roster Slots List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" /> Squad Roster Slots ({activeRegistration.players?.length} / {maxCapacity})
            </h3>
            {!isCaptain && (
              <button
                type="button"
                onClick={handleLeaveSquad}
                className="text-xs text-rose-400 hover:underline flex items-center gap-1 font-mono"
              >
                <LogOut className="w-3 h-3" /> Leave Squad
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Filled Roster Slots */}
            {activeRegistration.players?.map((slot) => {
              const isMe = (slot.user?._id || slot.user) === user?._id;
              const isSlotCaptain = slot.role === 'captain' || slot.slotNumber === 1;
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

                  {/* Actions for Captain */}
                  {isCaptain && !isSlotCaptain && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(slot.user?._id || slot.user, slot.user?.name)}
                      className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-300 transition-colors cursor-pointer"
                      title="Remove member from squad"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
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
                  onClick={handleCopyInvite}
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
                      <p className="text-[11px] text-slate-400">Click to copy invite link & add teammate</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-cyan-400 font-mono underline group-hover:text-cyan-300">
                    Invite Teammate
                  </span>
                </div>
              );
            })}

            {/* Dynamic [+ Add Player] Slot (Up to maxCapacity) */}
            {(activeRegistration.players?.length || 0) >= minStarters &&
              (activeRegistration.players?.length || 0) < maxCapacity && (
                <div
                  onClick={handleCopyInvite}
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
                    Copy Invite Link
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
            {workspaceData?.identityProofDeadline && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                  workspaceData.isIdentityProofDeadlinePassed
                    ? 'bg-rose-950/20 border-rose-800/40 text-rose-300'
                    : 'bg-purple-950/20 border-purple-800/30 text-purple-300'
                }`}
              >
                <span>
                  ⏰ <strong>Identity Proof Submission Deadline:</strong>{' '}
                  {new Date(workspaceData.identityProofDeadline).toLocaleString()}
                </span>
                {workspaceData.isIdentityProofDeadlinePassed && (
                  <span className="font-bold text-rose-400 uppercase tracking-wide text-[10px]">
                    Deadline Passed — Submissions Locked
                  </span>
                )}
              </div>
            )}

            {/* Step Unlock Guidance */}
            {!workspaceData?.canUploadIdentityProof ? (
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
                {activeRegistration.identityProof?.url && (
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-5 h-5 text-purple-400 shrink-0" />
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-200 truncate">
                          Combined_Team_Identity_Proof.pdf
                        </p>
                        {activeRegistration.identityProof?.submittedAt && (
                          <p className="text-[10px] text-slate-500">
                            Uploaded {new Date(activeRegistration.identityProof.submittedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <a
                      href={activeRegistration.identityProof.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 flex items-center gap-1.5 shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View Uploaded PDF
                    </a>
                  </div>
                )}

                {workspaceData.isIdentityProofDeadlinePassed ? (
                  <p className="text-xs text-slate-500 italic">
                    The identity proof deadline has passed. Uploading or updating the PDF is disabled.
                  </p>
                ) : (
                  <CloudinaryUpload
                    label={
                      activeRegistration.identityProof?.url
                        ? 'Replace Team Identity Proof (Single Combined PDF) *'
                        : 'Upload Team Identity Proof (Single Combined PDF) *'
                    }
                    helpText="Single PDF containing identity/college proof for all registered team members (Max 10MB)"
                    value={activeRegistration.identityProof?.url || ''}
                    onChange={handleUploadTeamProof}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Player Form Modal */}
        <Modal
          isOpen={playerModalOpen}
          onClose={() => setPlayerModalOpen(false)}
          title={`Complete Player Verification: ${user.name}`}
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

      {/* 1. CREATE SQUAD FORM */}
      {mode === 'create' ? (
        <form onSubmit={handleCreateTeam} className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" /> Create Squad Roster
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              You will be registered as the Squad Captain (Slot 1). You will receive an invite code to share with your teammates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-mono font-bold text-slate-300">
                Squad / Team Name *
              </label>
              <input
                type="text"
                required
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Apex Predators"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold text-slate-300">
                Team Tag (Max 5 chars)
              </label>
              <input
                type="text"
                maxLength={5}
                value={teamTag}
                onChange={(e) => setTeamTag(e.target.value.toUpperCase())}
                placeholder="e.g. APX"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono uppercase"
              />
            </div>
          </div>

          {/* Dynamic Team Questions */}
          {teamQuestions.length > 0 && (
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
              <h3 className="text-xs font-mono font-bold text-indigo-400 uppercase">
                Tournament Team Questionnaire
              </h3>
              {teamQuestions.map((q) => (
                <div key={q.id} className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    {q.label} {q.required && <span className="text-rose-400">*</span>}
                  </label>
                  {q.helpText && <p className="text-[11px] text-slate-400">{q.helpText}</p>}

                  {q.fieldType === 'dropdown' ? (
                    <select
                      required={q.required}
                      value={teamResponses[q.id] || ''}
                      onChange={(e) => setTeamResponses({ ...teamResponses, [q.id]: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                    >
                      <option value="">Select an option</option>
                      {q.options?.map((opt, i) => (
                        <option key={i} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required={q.required}
                      value={teamResponses[q.id] || ''}
                      onChange={(e) => setTeamResponses({ ...teamResponses, [q.id]: e.target.value })}
                      placeholder={q.placeholder || ''}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={creating}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
            >
              {creating ? 'Creating Squad...' : 'Create Squad & Generate Invite Code'}
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
