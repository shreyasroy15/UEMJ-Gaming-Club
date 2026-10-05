import React, { useState } from 'react';
import Modal from '../Modal/Modal';
import API from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  Users,
  Shield,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  Trophy,
} from 'lucide-react';

const AddTeamModal = ({ isOpen, onClose, tournamentId, tournamentName, onTeamAdded }) => {
  const { addToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const [teamName, setTeamName] = useState('');
  const [teamType, setTeamType] = useState('UEM Student Team');
  const [isVerified, setIsVerified] = useState(false);

  // Initialize with 4 player slots (standard squad format)
  const [players, setPlayers] = useState([
    { name: '', inGameName: '', role: 'captain', inGameId: '' },
    { name: '', inGameName: '', role: 'starter', inGameId: '' },
    { name: '', inGameName: '', role: 'starter', inGameId: '' },
    { name: '', inGameName: '', role: 'starter', inGameId: '' },
  ]);

  const handleAddPlayer = () => {
    setPlayers((prev) => [
      ...prev,
      {
        name: '',
        inGameName: '',
        role: prev.length === 0 ? 'captain' : 'starter',
        inGameId: '',
      },
    ]);
  };

  const handleRemovePlayer = (index) => {
    if (players.length <= 1) {
      addToast('A team must have at least one player or captain', 'warning');
      return;
    }
    setPlayers((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handlePlayerChange = (index, field, value) => {
    setPlayers((prev) =>
      prev.map((p, idx) => (idx === index ? { ...p, [field]: value } : p))
    );
  };

  const resetForm = () => {
    setTeamName('');
    setTeamType('UEM Student Team');
    setIsVerified(false);
    setPlayers([
      { name: '', inGameName: '', role: 'captain', inGameId: '' },
      { name: '', inGameName: '', role: 'starter', inGameId: '' },
      { name: '', inGameName: '', role: 'starter', inGameId: '' },
      { name: '', inGameName: '', role: 'starter', inGameId: '' },
    ]);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (submitting) return;

    if (!teamName.trim()) {
      addToast('Please enter a team name', 'warning');
      return;
    }

    // Clean player slots
    const validPlayers = players
      .filter((p) => (p.name && p.name.trim()) || (p.inGameName && p.inGameName.trim()))
      .map((p) => ({
        name: p.name.trim(),
        inGameName: p.inGameName.trim(),
        role: p.role,
        inGameId: p.inGameId ? p.inGameId.trim() : undefined,
      }));

    try {
      setSubmitting(true);
      const res = await API.post(`/tournaments/${tournamentId}/admin-add-team`, {
        teamName: teamName.trim(),
        teamType,
        status: isVerified ? 'verified' : 'rejected',
        isVerified,
        players: validPlayers,
      });

      addToast(`Team "${teamName.trim()}" added (Initial: Rejected). Click Approve when ready!`, 'success');
      resetForm();
      if (onTeamAdded) onTeamAdded(res.data.registration);
      onClose();
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to add team', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Add Team to Tournament`}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {tournamentName && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan-50/70 border border-cyan-200 text-xs font-mono text-cyan-800">
            <Trophy className="w-4 h-4 text-cyan-600 shrink-0" />
            <span className="truncate">
              Adding to: <strong>{tournamentName}</strong>
            </span>
          </div>
        )}

        {/* Team Basic Information */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
            <Shield className="w-4 h-4 text-cyan-600" />
            <span>Team Profile Details</span>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Team Name *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. Haryanvi Hunters"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-cyan-500 font-bold text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Team Type
              </label>
              <select
                value={teamType}
                onChange={(e) => setTeamType(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-cyan-500 text-slate-800"
              >
                <option value="UEM Student Team">UEM Student Team</option>
                <option value="Outside Team">Outside Team</option>
                <option value="Mixed Team">Mixed Team</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Initial Status
              </label>
              <button
                type="button"
                onClick={() => setIsVerified(!isVerified)}
                className={`w-full px-3 py-2 text-xs rounded-xl font-bold flex items-center justify-center gap-1.5 transition border cursor-pointer ${
                  isVerified
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isVerified ? 'Active / Verified' : 'Rejected (Approve to Activate)'}
              </button>
            </div>
          </div>
        </div>

        {/* Squad Members / Players */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-800">
                <Users className="w-4 h-4 text-purple-600" />
                <span>Squad Members ({players.length})</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Add member real names, in-game tags, and roles.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddPlayer}
              className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold flex items-center gap-1 shrink-0 self-start sm:self-auto cursor-pointer transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add Player Slot
            </button>
          </div>

          <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1.5 custom-scrollbar">
            {players.map((p, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200/90 hover:border-slate-300 transition"
              >
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-200/60">
                  <span className="text-[11px] font-mono font-bold text-slate-600 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    {idx === 0 ? 'CAPTAIN / LEADER' : `PLAYER #${idx + 1}`}
                  </span>

                  {players.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePlayer(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition"
                      title="Remove player"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                      Member Name {idx === 0 && '*'}
                    </label>
                    <input
                      type="text"
                      value={p.name}
                      onChange={(e) => handlePlayerChange(idx, 'name', e.target.value)}
                      placeholder={idx === 0 ? 'Captain Name' : 'Player Name'}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-purple-600 font-medium text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                      In-Game Name (IGN)
                    </label>
                    <input
                      type="text"
                      value={p.inGameName}
                      onChange={(e) => handlePlayerChange(idx, 'inGameName', e.target.value)}
                      placeholder="e.g. MortaL_99"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-purple-600 font-mono text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                      Role
                    </label>
                    <select
                      value={p.role}
                      onChange={(e) => handlePlayerChange(idx, 'role', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-purple-600 font-medium text-slate-800"
                    >
                      <option value="captain">Captain</option>
                      <option value="starter">Starter</option>
                      <option value="substitute">Substitute</option>
                      <option value="member">Member</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold font-mono uppercase tracking-wider shadow-md hover:shadow-cyan-500/20 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            {submitting ? 'Adding Team...' : 'Add Team to Tournament'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddTeamModal;
