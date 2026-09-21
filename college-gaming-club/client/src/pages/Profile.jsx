import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import API from '../services/api';
import Modal from '../components/Modal/Modal';
import Avatar from '../components/Avatar/Avatar';
import AvatarSelectorModal from '../components/Avatar/AvatarSelectorModal';
import {
  User,
  Shield,
  Trophy,
  Award,
  Edit,
  Mail,
  Building,
  Gamepad2,
  CheckCircle2,
  Flame,
  Sparkles,
  Camera,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    avatar: user?.avatar || '',
    college: user?.college || '',
  });
  const [saving, setSaving] = useState(false);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await API.put('/auth/profile', formData);
      if (res.data.success) {
        updateUser(res.data.user);
        addToast('Profile updated successfully!', 'success');
        setEditModalOpen(false);
      }
    } catch (err) {
      try {
        const fallback = await API.put(`/users/${user._id}`, formData);
        if (fallback.data.success) {
          updateUser(fallback.data.user || { ...user, ...formData });
          addToast('Profile updated successfully!', 'success');
          setEditModalOpen(false);
          return;
        }
      } catch (fallbackErr) {
        addToast(err.response?.data?.message || 'Failed to update profile', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const matches = user?.stats?.matchesPlayed || (user?.stats?.wins || 0) + (user?.stats?.losses || 0);
  const winRate = matches > 0 ? Math.round(((user?.stats?.wins || 0) / matches) * 100) : 0;

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Profile Header Banner */}
      <div className="p-4 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          <div className="flex flex-col min-[480px]:flex-row items-center min-[480px]:items-start gap-4 sm:gap-5 text-center min-[480px]:text-left w-full md:w-auto">
            <div className="relative shrink-0 group">
              <Avatar
                user={user}
                size="2xl"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-cyan-400 shadow-xl shadow-cyan-500/20 group-hover:border-cyan-300 transition-all"
                imgClassName="rounded-2xl"
                textSize="text-3xl sm:text-4xl"
              />
              <button
                onClick={() => setAvatarModalOpen(true)}
                title="Change Character Avatar"
                className="absolute inset-0 bg-black/60 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] font-bold font-mono cursor-pointer"
              >
                <Camera className="w-5 h-5 text-cyan-400 mb-0.5" />
                <span>Change</span>
              </button>
              <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-cyan-950 text-cyan-400 border border-cyan-500 font-mono">
                {user?.role}
              </span>
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center min-[480px]:justify-start gap-2">
                <h1 className="text-xl sm:text-3xl font-black text-white font-mono break-words">
                  {user?.name}
                </h1>
                <span className="text-xs text-slate-400 font-mono">@{user?.username}</span>
              </div>
              <p className="text-xs text-slate-400 flex items-center justify-center min-[480px]:justify-start gap-1.5">
                <Building className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>{user?.college}</span>
              </p>
              <p className="text-xs text-slate-400 flex items-center justify-center min-[480px]:justify-start gap-1.5">
                <Mail className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">{user?.email}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => setAvatarModalOpen(true)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" /> Choose Avatar
            </button>

            <button
              onClick={() => {
                setFormData({
                  name: user?.name || '',
                  bio: user?.bio || '',
                  avatar: user?.avatar || '',
                  college: user?.college || '',
                });
                setEditModalOpen(true);
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" /> Edit Profile
            </button>
          </div>
        </div>

        {/* Bio */}
        {user?.bio && (
          <p className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-slate-800/80 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl text-center min-[480px]:text-left">
            "{user.bio}"
          </p>
        )}

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-slate-800 text-center">
          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
            <span className="block text-[10px] uppercase font-bold text-slate-400">Total Matches</span>
            <span className="text-lg sm:text-xl font-bold text-white font-mono">{matches}</span>
          </div>
          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
            <span className="block text-[10px] uppercase font-bold text-slate-400">Wins</span>
            <span className="text-lg sm:text-xl font-bold text-emerald-400 font-mono">{user?.stats?.wins || 0}</span>
          </div>
          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
            <span className="block text-[10px] uppercase font-bold text-slate-400">Win Rate</span>
            <span className="text-lg sm:text-xl font-bold text-cyan-400 font-mono">{winRate}%</span>
          </div>
          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
            <span className="block text-[10px] uppercase font-bold text-slate-400">Tournament MVPs</span>
            <span className="text-lg sm:text-xl font-black text-amber-400 font-mono flex items-center justify-center gap-1">
              <Trophy className="w-4 h-4 text-amber-400" /> {user?.stats?.mvpCount || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Badges & Quick Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Achievements Column */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" /> Achievement Badges ({user?.achievements?.length || 0})
          </h3>

          {!user?.achievements || user.achievements.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400">
              No tournament badges unlocked yet. Compete in campus tournaments to earn awards!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {user.achievements.map((ach, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3.5"
                >
                  <span className="text-3xl p-2 rounded-xl bg-slate-950 border border-slate-800">
                    {ach.badge || '🏅'}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-white font-mono">{ach.title}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{ach.description}</p>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Earned {new Date(ach.awardedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Links Column */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white font-mono">Arena Portals</h3>
          <div className="space-y-3">
            <Link
              to="/my-tournaments"
              className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition-all group"
            >
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-cyan-400" />
                <div>
                  <span className="text-sm font-bold text-white font-mono block group-hover:text-cyan-400 transition-colors">
                    My Tournaments
                  </span>
                  <span className="text-xs text-slate-400">Registered matches & fixtures</span>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-500 font-mono">→</span>
            </Link>

            <Link
              to="/my-teams"
              className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 transition-all group"
            >
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-indigo-400" />
                <div>
                  <span className="text-sm font-bold text-white font-mono block group-hover:text-indigo-400 transition-colors">
                    My Squads & Rosters
                  </span>
                  <span className="text-xs text-slate-400">Manage captains & teammates</span>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-500 font-mono">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Player Profile"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase">
                Avatar Image
              </label>
              <button
                type="button"
                onClick={() => setAvatarModalOpen(true)}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" /> Choose from Game Characters
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-950 border border-slate-700 shrink-0 flex items-center justify-center">
                {formData.avatar ? (
                  <img
                    src={formData.avatar}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/assets/free-fire-logo.jpg';
                    }}
                  />
                ) : (
                  <span className="text-[10px] font-bold text-slate-500 font-mono">None</span>
                )}
              </div>
              <input
                type="url"
                value={formData.avatar}
                onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                placeholder="https://... or select character"
                className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              College Department
            </label>
            <input
              type="text"
              value={formData.college}
              onChange={(e) => setFormData({ ...formData, college: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Bio
            </label>
            <textarea
              rows="3"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-xs font-bold text-black disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Interactive Avatar Selector Modal with BGMI, Free Fire, Valorant Suggestions */}
      <AvatarSelectorModal
        isOpen={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
        onAvatarSaved={(savedUser) => {
          setFormData((prev) => ({ ...prev, avatar: savedUser.avatar }));
        }}
      />
    </div>
  );
};

export default Profile;
