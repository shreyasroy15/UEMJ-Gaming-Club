import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import API from '../services/api';
import Modal from '../components/Modal/Modal';
import Avatar from '../components/Avatar/Avatar';
import AvatarSelectorModal from '../components/Avatar/AvatarSelectorModal';
import Loading from '../components/Loading/Loading';
import {
  User,
  Edit,
  Mail,
  Building,
  Sparkles,
  Camera,
  MessageSquare,
  Check,
  Loader2,
  Shield,
  Trophy,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';

const Profile = () => {
  const { id } = useParams();
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();

  const isOwnProfile = !id || id === user?._id || id === user?.id || id === user?.username;

  const [otherUser, setOtherUser] = useState(null);
  const [loadingOther, setLoadingOther] = useState(!isOwnProfile);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    avatar: user?.avatar || '',
    college: user?.college || '',
  });
  const [saving, setSaving] = useState(false);

  // Load other user's profile if visiting /profile/:id
  useEffect(() => {
    if (!isOwnProfile && id) {
      const fetchOtherProfile = async () => {
        try {
          setLoadingOther(true);
          const res = await API.get(`/users/${id}`);
          if (res.data?.success && res.data?.user) {
            setOtherUser(res.data.user);
          }
        } catch (err) {
          console.error('Failed to load player profile', err);
          addToast(err.response?.data?.message || 'Player profile not found', 'error');
        } finally {
          setLoadingOther(false);
        }
      };
      fetchOtherProfile();
    }
  }, [id, isOwnProfile]);

  // Keep form data synced with current user profile
  useEffect(() => {
    if (user && isOwnProfile) {
      setFormData({
        name: user.name || '',
        bio: user.bio || '',
        avatar: user.avatar || '',
        college: user.college || '',
      });
    }
  }, [user, isOwnProfile]);

  // Sync latest user profile from server on mount
  useEffect(() => {
    if (isOwnProfile) {
      const fetchLatestProfile = async () => {
        try {
          const res = await API.get('/auth/me');
          if (res.data?.success && res.data?.user) {
            updateUser(res.data.user);
          }
        } catch (err) {
          console.error('Failed to sync profile', err);
        }
      };
      fetchLatestProfile();
    }
  }, [isOwnProfile]);

  const displayUser = isOwnProfile ? user : (otherUser || {});

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      addToast('Full name is required', 'error');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      bio: formData.bio?.trim() || '',
      avatar: formData.avatar || user?.avatar || '',
      college: formData.college?.trim() || '',
    };

    try {
      setSaving(true);
      const res = await API.put('/auth/profile', payload);
      if (res.data.success) {
        updateUser(res.data.user);
        addToast('Profile updated successfully!', 'success');
        setEditModalOpen(false);
      }
    } catch (err) {
      try {
        const fallback = await API.put(`/users/${user._id}`, payload);
        if (fallback.data.success) {
          updateUser(fallback.data.user || { ...user, ...payload });
          addToast('Profile updated successfully!', 'success');
          setEditModalOpen(false);
          return;
        }
      } catch (fallbackErr) {
        addToast(
          err.response?.data?.message ||
            fallbackErr.response?.data?.message ||
            'Failed to update profile',
          'error'
        );
      }
    } finally {
      setSaving(false);
    }
  };

  if (loadingOther) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        <span className="text-xs font-mono text-slate-400">Loading player profile...</span>
      </div>
    );
  }

  return (
    <div className="py-6 sm:py-10 px-3 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full space-y-6 sm:space-y-8">
      {!isOwnProfile && (
        <div className="pb-1">
          <Link
            to="/admin/users"
            className="text-xs font-mono text-slate-400 hover:text-cyan-400 flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Users Directory
          </Link>
        </div>
      )}

      {/* Profile Header Banner */}
      <div className="p-4 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl bg-slate-900/75 border border-slate-800/90 backdrop-blur-xl shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-5 sm:gap-6">
          <div className="flex flex-col min-[480px]:flex-row items-center min-[480px]:items-start gap-4 sm:gap-6 text-center min-[480px]:text-left w-full md:w-auto">
            {/* Avatar */}
            <div
              className={`relative shrink-0 ${isOwnProfile ? 'cursor-pointer group' : ''}`}
              onClick={() => isOwnProfile && setAvatarModalOpen(true)}
              title={isOwnProfile ? 'Click to choose character avatar' : displayUser.name}
            >
              <Avatar
                user={displayUser}
                size="2xl"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-cyan-400 shadow-xl shadow-cyan-500/25 transition-all"
                imgClassName="rounded-2xl"
                textSize="text-3xl sm:text-4xl"
              />
              {isOwnProfile && (
                <>
                  <div className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity backdrop-blur-[2px]">
                    <Camera className="w-5 h-5 text-cyan-300 drop-shadow" />
                    <span className="text-[9px] font-bold mt-0.5 text-cyan-200">Change</span>
                  </div>
                  <span className="absolute -top-1.5 -left-1.5 w-6 h-6 rounded-full bg-slate-900 border border-cyan-400 text-cyan-300 flex items-center justify-center shadow-md transition-transform group-hover:scale-110">
                    <Camera className="w-3 h-3" />
                  </span>
                </>
              )}
              <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-cyan-950 text-cyan-400 border border-cyan-500 font-mono shadow-md">
                {displayUser?.role || 'student'}
              </span>
            </div>

            {/* User Identity Details */}
            <div className="space-y-2 min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-center min-[480px]:justify-start gap-2">
                <h1 className="text-xl sm:text-3xl font-black text-white font-mono break-words">
                  {displayUser?.name}
                </h1>
                <span className="text-xs font-mono text-cyan-400 font-semibold">
                  @{displayUser?.username}
                </span>
              </div>

              {/* College & Contact Meta */}
              <div className="space-y-1 pt-1 text-xs text-slate-400 font-mono">
                <p className="flex items-center justify-center min-[480px]:justify-start gap-1.5">
                  <Building className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">{displayUser?.college || 'UEM Jaipur Esports'}</span>
                </p>
                {displayUser?.email && (
                  <p className="flex items-center justify-center min-[480px]:justify-start gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate">{displayUser?.email}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Button (Only for own profile) */}
          {isOwnProfile ? (
            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto shrink-0">
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
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 hover:text-white border border-cyan-500/40 hover:border-cyan-400 font-mono text-xs font-bold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.12)] hover:shadow-[0_0_20px_rgba(6,182,212,0.25)] transition-all cursor-pointer active:scale-95"
              >
                <Edit className="w-3.5 h-3.5 text-cyan-400" />
                <span>Edit Player Profile</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300">
                Registered Competitor
              </span>
            </div>
          )}
        </div>

        {/* Bio */}
        {displayUser?.bio && (
          <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-slate-800/80">
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-mono italic bg-slate-950/50 p-3.5 sm:p-4 rounded-xl border border-slate-800/70 shadow-inner">
              "{displayUser.bio}"
            </p>
          </div>
        )}
      </div>

      {/* Current Esports Team Status Card */}
      <div className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-slate-900/60 border border-slate-800/90 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <h3 className="text-xs sm:text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            Current Esports Team Status
          </h3>
          {displayUser.teamInfo?.isFreeAgent || (!displayUser.teamName || displayUser.teamName.toLowerCase() === 'free agent') ? (
            <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
              ⚡ FREE AGENT
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> ACTIVE SQUAD
            </span>
          )}
        </div>

        {displayUser.teamInfo?.isFreeAgent || (!displayUser.teamName || displayUser.teamName.toLowerCase() === 'free agent') ? (
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                Free Agent
                <span className="text-[10px] text-slate-400 font-normal px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                  Unassigned
                </span>
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isOwnProfile
                  ? 'You are currently not assigned to any collegiate team. You can create a new squad or join with a team code when registering for tournaments.'
                  : 'This player is currently not assigned to any collegiate esports squad and is available for team recruitment.'}
              </p>
            </div>
            {isOwnProfile && (
              <Link
                to="/tournaments"
                className="px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono text-xs font-bold shrink-0 text-center transition-colors"
              >
                Browse Tournaments
              </Link>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-mono font-bold text-xl shrink-0">
                🛡️
              </div>
              <div className="space-y-0.5">
                <h4 className="text-base font-bold text-white font-mono flex items-center gap-2">
                  {displayUser.teamInfo?.name || displayUser.teamName}
                  {displayUser.teamInfo?.tag && (
                    <span className="text-xs text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800/60 font-mono">
                      [{displayUser.teamInfo.tag}]
                    </span>
                  )}
                </h4>
                <p className="text-xs text-slate-400 font-mono">
                  Role: <strong className="text-cyan-300 uppercase">{displayUser.teamInfo?.roleInTeam || (displayUser.role === 'captain' ? 'Captain' : 'Roster Player')}</strong> • Game:{' '}
                  <strong className="text-white">{displayUser.teamInfo?.game || displayUser.game || 'BGMI'}</strong>
                </p>
              </div>
            </div>
            <Link
              to="/tournaments"
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-mono text-xs font-bold shrink-0 text-center transition-colors"
            >
              View Tournaments
            </Link>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="EDIT PLAYER PROFILE"
        maxWidth="max-w-xl"
        bodyClassName="p-3.5 sm:p-5 space-y-4"
        footer={
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 w-full">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-xs font-mono font-semibold text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition-all cursor-pointer text-center active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-player-profile-form"
              disabled={saving}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black font-mono text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        }
      >
        <form id="edit-player-profile-form" onSubmit={handleEditSubmit} className="space-y-4">
          {/* Identity Quick Preview Card */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-900/95 via-indigo-950/50 to-slate-900/95 border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.12)] flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div
                className="relative group shrink-0 cursor-pointer"
                onClick={() => setAvatarModalOpen(true)}
                title="Click to choose character preset"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl p-0.5 bg-gradient-to-tr from-cyan-400 via-indigo-500 to-fuchsia-500 shadow-lg shadow-cyan-500/25 overflow-hidden group-hover:scale-105 transition-transform">
                  {formData.avatar ? (
                    <img
                      src={formData.avatar}
                      alt="Current Avatar"
                      className="w-full h-full object-cover rounded-[14px] bg-slate-950"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/assets/free-fire-logo.jpg';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-800 rounded-[14px] flex items-center justify-center font-bold text-xl text-cyan-400 font-mono">
                      {formData.name?.charAt(0)?.toUpperCase() || 'P'}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAvatarModalOpen(true);
                  }}
                  className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.8)] hover:scale-110 active:scale-95 transition-all cursor-pointer"
                  title="Choose character preset"
                >
                  <Camera className="w-3 h-3 stroke-[2.5]" />
                </button>
              </div>

              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm sm:text-base font-black text-white font-mono truncate">
                    {formData.name || 'Player Identity'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 shrink-0">
                    {user?.role || 'student'}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-400 font-mono truncate">
                  {formData.college || 'UEM Jaipur Esports'}
                </p>

              </div>
            </div>

            <button
              type="button"
              onClick={() => setAvatarModalOpen(true)}
              className="w-full sm:w-auto px-3.5 py-2 sm:py-2.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 hover:text-white text-xs font-bold font-mono transition-all shrink-0 flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.15)] active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Change Character</span>
            </button>
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span>Full Name</span>
              </label>
              <span className="text-[10px] font-mono font-semibold text-cyan-400/80 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-500/20">
                Required
              </span>
            </div>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Alex Rivera"
              className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-slate-950/90 border border-slate-700/70 hover:border-cyan-500/40 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 text-xs sm:text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none transition-all shadow-inner"
            />
          </div>



          {/* College Department */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-cyan-400" />
                <span>College Department / Campus</span>
              </label>
              <span className="text-[10px] font-mono text-slate-500">Optional</span>
            </div>
            <input
              type="text"
              value={formData.college}
              onChange={(e) => setFormData({ ...formData, college: e.target.value })}
              placeholder="e.g. Dept. of Computer Science & Engineering, UEM Jaipur"
              className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-slate-950/90 border border-slate-700/70 hover:border-cyan-500/40 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 text-xs sm:text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none transition-all shadow-inner"
            />
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                <span>Player Bio / Motto</span>
              </label>
              <span
                className={`text-[10px] font-mono font-semibold ${
                  (formData.bio?.length || 0) >= 240 ? 'text-amber-400' : 'text-slate-400'
                }`}
              >
                {formData.bio?.length || 0} / 250
              </span>
            </div>
            <textarea
              rows="3"
              maxLength={250}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Write a brief gamer intro or esports motto..."
              className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-slate-950/90 border border-slate-700/70 hover:border-cyan-500/40 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 text-xs sm:text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none transition-all resize-none shadow-inner min-h-[75px] max-h-[120px]"
            />
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
