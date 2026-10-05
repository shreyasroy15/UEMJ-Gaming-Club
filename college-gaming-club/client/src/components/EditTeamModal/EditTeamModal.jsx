import React, { useState, useEffect } from 'react';
import Modal from '../Modal/Modal';
import API from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  Users,
  Shield,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

const EditTeamModal = ({ isOpen, onClose, team, onSaved }) => {
  const { addToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const [teamName, setTeamName] = useState('');
  const [teamTag, setTeamTag] = useState('');
  const [teamType, setTeamType] = useState('UEM Student Team');
  const [isVerified, setIsVerified] = useState(true);
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    if (team) {
      setTeamName(team.teamName || '');
      setTeamTag(team.teamTag || '');
      setTeamType(team.teamType || 'UEM Student Team');
      setIsVerified(Boolean(team.isVerified || team.status === 'verified'));

      const loadedPlayers = (team.players || []).map((p, idx) => ({
        _id: p._id,
        user: p.user?._id || p.user || null,
        name: p.name || p.user?.name || '',
        inGameName: p.inGameName || p.ign || p.responses?.in_game_name || '',
        inGameId: p.inGameId || p.responses?.in_game_id || '',
        role: p.role || (idx === 0 ? 'captain' : 'starter'),
        slotNumber: p.slotNumber || idx + 1,
      }));

      if (loadedPlayers.length === 0) {
        loadedPlayers.push({
          name: team.captain?.name || '',
          inGameName: '',
          inGameId: '',
          role: 'captain',
          slotNumber: 1,
        });
      }

      setPlayers(loadedPlayers);
    }
  }, [team, isOpen]);

  const handleAddPlayer = () => {
    setPlayers((prev) => [
      ...prev,
      {
        name: '',
        inGameName: '',
        inGameId: '',
        role: prev.length === 0 ? 'captain' : 'starter',
        slotNumber: prev.length + 1,
      },
    ]);
  };

  const handleRemovePlayer = (index) => {
    setPlayers((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handlePlayerChange = (index, field, value) => {
    setPlayers((prev) =>
      prev.map((p, idx) => (idx === index ? { ...p, [field]: value } : p))
    );
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!teamName.trim()) {
      addToast('Team name cannot be empty', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const res = await API.put(`/registrations/${team._id}/admin-update`, {
        teamName: teamName.trim(),
        teamTag: teamTag.trim().toUpperCase(),
        teamType,
        isVerified,
        status: isVerified ? 'verified' : (team.status || 'complete'),
        players,
      });

      addToast('Squad details and player names updated successfully!', 'success');
      if (onSaved) onSaved(res.data.registration);
      onClose();
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to update team details', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!team) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Team: ${team.teamName}`}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic Team Info */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
            <Shield className="w-4 h-4 text-cyan-600" />
            <span>Team Profile (Admin Override)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Team Name *
              </label>
              <input
                type="text"
                required
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Soul Esports"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-cyan-500 font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Team Tag
              </label>
              <input
                type="text"
                maxLength={6}
                value={teamTag}
                onChange={(e) => setTeamTag(e.target.value.toUpperCase())}
                placeholder="TAG"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-cyan-500 font-mono uppercase text-slate-800"
              />
            </div>
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
                Verification State
              </label>
              <button
                type="button"
                onClick={() => setIsVerified(!isVerified)}
                className={`w-full px-3 py-2 text-xs rounded-xl font-bold flex items-center justify-center gap-1.5 transition border cursor-pointer ${
                  isVerified
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isVerified ? 'Verified Active Team' : 'Pending Review'}
              </button>
            </div>
          </div>
        </div>

        {/* Players & Members List */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-800">
                <Users className="w-4 h-4 text-purple-600" />
                <span>Squad Members & Players ({players.length})</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Directly change member names, in-game tags, and roles for any match fixture.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddPlayer}
              className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold flex items-center gap-1 shrink-0 self-start sm:self-auto cursor-pointer transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add Member
            </button>
          </div>

          <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1.5 custom-scrollbar">
            {players.map((p, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200/90 hover:border-slate-300 transition"
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/60">
                  <span className="text-[11px] font-mono font-bold text-slate-600 flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    {p.role.toUpperCase()}
                  </span>

                  {players.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePlayer(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition"
                      title="Remove member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                      Member Name *
                    </label>
                    <input
                      type="text"
                      value={p.name}
                      onChange={(e) => handlePlayerChange(idx, 'name', e.target.value)}
                      placeholder="e.g. John Doe"
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
                      placeholder="e.g. Mortal_99"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-purple-600 font-mono text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                      Squad Role
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

        {/* Footer actions */}
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
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {submitting ? 'Saving Changes...' : 'Save Team & Members'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditTeamModal;
