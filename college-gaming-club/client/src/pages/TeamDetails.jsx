import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import Loading from '../components/Loading/Loading';
import EmptyState from '../components/EmptyState/EmptyState';
import Modal from '../components/Modal/Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Shield,
  Users,
  Trophy,
  Award,
  UserPlus,
  UserMinus,
  Crown,
  LogOut,
  Trash2,
  Calendar,
  Sparkles,
} from 'lucide-react';

const TeamDetails = () => {
  const { id } = useParams();
  const { user, isAuthenticated, isAdmin } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  // Invite player modal
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteIGN, setInviteIGN] = useState('');
  const [inviting, setInviting] = useState(false);

  // Transfer captain modal
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [newCaptainId, setNewCaptainId] = useState('');
  const [transferring, setTransferring] = useState(false);

  useEffect(() => {
    fetchTeamDetails();
  }, [id]);

  const fetchTeamDetails = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/teams/${id}`);
      setTeam(res.data.team);
    } catch (err) {
      console.error(err);
      addToast('Failed to load team details', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading message="Loading squad roster..." />;
  if (!team) return <EmptyState icon={Shield} title="Team Not Found" description="This team does not exist or has been disbanded." />;

  const isCaptain = user && team.captain && (team.captain._id === user._id || team.captain === user._id);
  const canManage = isCaptain || isAdmin;
  const isMember = user && team.members?.some((m) => (m.user?._id || m.user) === user._id);

  // Add/Invite Player
  const handleInvitePlayer = async (e) => {
    e.preventDefault();
    if (!inviteUsername) {
      addToast('Please enter username or email', 'error');
      return;
    }

    try {
      setInviting(true);
      const res = await API.post(`/teams/${team._id}/members`, {
        usernameOrEmail: inviteUsername,
        inGameName: inviteIGN,
      });

      if (res.data.success) {
        addToast(res.data.message || 'Player added to team!', 'success');
        setInviteModalOpen(false);
        setInviteUsername('');
        setInviteIGN('');
        fetchTeamDetails();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to add player', 'error');
    } finally {
      setInviting(false);
    }
  };

  // Remove Player
  const handleRemovePlayer = async (memberUserId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from the team?`)) {
      return;
    }

    try {
      const res = await API.delete(`/teams/${team._id}/members/${memberUserId}`);
      if (res.data.success) {
        addToast('Member removed from team', 'success');
        fetchTeamDetails();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to remove member', 'error');
    }
  };

  // Leave Team
  const handleLeaveTeam = async () => {
    if (!window.confirm('Are you sure you want to leave this team?')) return;

    try {
      const res = await API.post(`/teams/${team._id}/leave`);
      if (res.data.success) {
        addToast('You have left the team', 'success');
        navigate('/teams');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to leave team', 'error');
    }
  };

  // Transfer Captain
  const handleTransferCaptain = async (e) => {
    e.preventDefault();
    if (!newCaptainId) {
      addToast('Please select the new captain', 'error');
      return;
    }

    try {
      setTransferring(true);
      const res = await API.put(`/teams/${team._id}/transfer-captain`, {
        newCaptainId,
      });

      if (res.data.success) {
        addToast('Captaincy transferred successfully!', 'success');
        setTransferModalOpen(false);
        fetchTeamDetails();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to transfer captaincy', 'error');
    } finally {
      setTransferring(false);
    }
  };

  // Delete Team
  const handleDeleteTeam = async () => {
    if (!window.confirm('Are you sure you want to permanently disband this team?')) return;

    try {
      const res = await API.delete(`/teams/${team._id}`);
      if (res.data.success) {
        addToast('Team disbanded successfully', 'success');
        navigate('/teams');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete team', 'error');
    }
  };

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Team Header Card */}
      <div className="p-4 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col min-[480px]:flex-row items-center min-[480px]:items-start gap-4 sm:gap-5 text-center min-[480px]:text-left w-full md:w-auto">
            <img
              src={team.logo || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=200&q=80'}
              alt={team.name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-indigo-500/50 shadow-lg shadow-indigo-500/20 shrink-0"
            />
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center min-[480px]:justify-start gap-2">
                <h1 className="text-xl sm:text-3xl font-black text-white font-mono break-words">
                  {team.name}
                </h1>
                {team.tag && (
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono">
                    {team.tag}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 flex items-center justify-center min-[480px]:justify-start gap-2">
                <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Title: <strong className="text-slate-200">{team.game}</strong></span>
              </p>
              <p className="text-xs text-slate-400">
                Captain: <strong className="text-amber-400">{team.captain?.name || team.captain?.username}</strong>
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center min-[480px]:justify-start gap-2 w-full md:w-auto">
            {canManage && (
              <>
                <button
                  onClick={() => setInviteModalOpen(true)}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Invite Player
                </button>
                <button
                  onClick={() => setTransferModalOpen(true)}
                  className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-300 border border-slate-700 flex items-center justify-center gap-1.5 transition-all"
                >
                  <Crown className="w-3.5 h-3.5" /> Transfer
                </button>
                <button
                  onClick={handleDeleteTeam}
                  className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-xs font-bold text-rose-300 border border-rose-800/40 flex items-center justify-center gap-1.5 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Disband
                </button>
              </>
            )}

            {isMember && !isCaptain && (
              <button
                onClick={handleLeaveTeam}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 flex items-center justify-center gap-1.5 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" /> Leave Team
              </button>
            )}
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-slate-800 text-center">
          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
            <span className="block text-[10px] uppercase font-bold text-slate-400">Matches</span>
            <span className="text-lg sm:text-xl font-bold text-white font-mono">{team.matchesPlayed || 0}</span>
          </div>
          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
            <span className="block text-[10px] uppercase font-bold text-slate-400">Wins</span>
            <span className="text-lg sm:text-xl font-bold text-emerald-400 font-mono">{team.wins || 0}</span>
          </div>
          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
            <span className="block text-[10px] uppercase font-bold text-slate-400">Losses</span>
            <span className="text-lg sm:text-xl font-bold text-rose-400 font-mono">{team.losses || 0}</span>
          </div>
          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
            <span className="block text-[10px] uppercase font-bold text-slate-400">Points</span>
            <span className="text-lg sm:text-xl font-black text-amber-400 font-mono">{team.points || 0}</span>
          </div>
        </div>
      </div>

      {/* Roster & Description Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Roster Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-900">
            <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" /> Active Roster ({team.members?.length || 0})
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {team.members?.map((member) => {
              const u = member.user;
              if (!u) return null;
              const isMemCaptain = (team.captain?._id || team.captain) === u._id;

              return (
                <div
                  key={u._id}
                  className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={u.avatar || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=150&q=80'}
                      alt={u.name}
                      className="w-11 h-11 rounded-xl object-cover border border-slate-700 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-white font-mono truncate">{u.name}</h4>
                        {isMemCaptain && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-0.5">
                            <Crown className="w-2.5 h-2.5" /> CPT
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-cyan-400 font-mono truncate">
                        IGN: {member.inGameName || u.username}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">{u.college}</p>
                    </div>
                  </div>

                  {canManage && !isMemCaptain && (
                    <button
                      onClick={() => handleRemovePlayer(u._id, u.name)}
                      title="Remove Member"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bio / About Team */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
            <h3 className="text-base font-bold text-white font-mono">Team Biography</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {team.description || 'This team has not provided a description yet.'}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
            <h3 className="text-base font-bold text-white font-mono">Scrims & Tournaments</h3>
            <p className="text-xs text-slate-400">
              To enter official campus tournaments, make sure your roster has the minimum required players for {team.game}.
            </p>
            <Link
              to={`/tournaments?game=${encodeURIComponent(team.game)}`}
              className="inline-block text-xs font-bold text-cyan-400 hover:underline pt-1"
            >
              Browse {team.game} Tournaments →
            </Link>
          </div>
        </div>
      </div>

      {/* Invite Member Modal */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Invite Player to Roster"
      >
        <form onSubmit={handleInvitePlayer} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Username or Registered Email *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. apex_shreyas or shreyas@uemjgaming.club"
              value={inviteUsername}
              onChange={(e) => setInviteUsername(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Player In-Game Name (IGN)
            </label>
            <input
              type="text"
              placeholder="e.g. VTX_Apex"
              value={inviteIGN}
              onChange={(e) => setInviteIGN(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setInviteModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={inviting}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md shadow-indigo-600/20 disabled:opacity-50"
            >
              {inviting ? 'Adding...' : 'Add Player'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Transfer Captain Modal */}
      <Modal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        title="Transfer Team Captaincy"
      >
        <form onSubmit={handleTransferCaptain} className="space-y-4">
          <p className="text-xs text-slate-400">
            Select a squad member who will become the new team captain. You will become a regular starter.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Select New Captain *
            </label>
            <select
              value={newCaptainId}
              onChange={(e) => setNewCaptainId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="">Select a roster member</option>
              {team.members
                ?.filter((m) => m.user?._id !== user._id)
                .map((m) => (
                  <option key={m.user?._id} value={m.user?._id}>
                    {m.user?.name} (@{m.user?.username})
                  </option>
                ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setTransferModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={transferring}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-bold text-black disabled:opacity-50"
            >
              {transferring ? 'Transferring...' : 'Confirm Transfer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TeamDetails;
