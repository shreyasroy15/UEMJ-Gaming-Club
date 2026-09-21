import React, { useState, useEffect } from 'react';
import Modal from '../Modal/Modal';
import { AVATAR_PRESETS } from '../../data/avatarPresets';
import {
  Check,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import API from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const AvatarSelectorModal = ({ isOpen, onClose, onAvatarSaved }) => {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('bgmi'); // 'bgmi' | 'freefire' | 'valorant'
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const currentAvatar = user?.avatar || '';
      setSelectedAvatar(currentAvatar);

      const all = [
        ...AVATAR_PRESETS.valorant,
        ...AVATAR_PRESETS.freefire,
        ...AVATAR_PRESETS.bgmi,
      ];
      const matchedPreset = all.find((a) => a.src === currentAvatar);
      if (matchedPreset?.gameCategory) {
        setActiveTab(matchedPreset.gameCategory);
      }
    }
  }, [isOpen, user?.avatar]);

  // Combine or filter avatars based on activeTab
  const visibleAvatars = React.useMemo(() => {
    if (activeTab === 'bgmi') return AVATAR_PRESETS.bgmi;
    if (activeTab === 'freefire') return AVATAR_PRESETS.freefire;
    if (activeTab === 'valorant') return AVATAR_PRESETS.valorant;
    return AVATAR_PRESETS.bgmi;
  }, [activeTab]);

  // Find info of currently selected preset (if any)
  const selectedPreset = React.useMemo(() => {
    const all = [
      ...AVATAR_PRESETS.valorant,
      ...AVATAR_PRESETS.freefire,
      ...AVATAR_PRESETS.bgmi,
    ];
    return all.find((a) => a.src === selectedAvatar);
  }, [selectedAvatar]);

  const handleSelectPreset = (preset) => {
    setSelectedAvatar(preset.src);
  };

  const handleSave = async () => {
    if (!selectedAvatar) {
      addToast('Please select an avatar first', 'error');
      return;
    }

    try {
      setSaving(true);
      const res = await API.put('/auth/profile', { avatar: selectedAvatar });

      if (res.data?.success && res.data?.user) {
        updateUser(res.data.user);
        addToast('Student avatar updated and saved permanently!', 'success');
        if (onAvatarSaved) {
          onAvatarSaved(res.data.user);
        }
        onClose();
      } else {
        addToast(res.data?.message || 'Failed to save avatar', 'error');
      }
    } catch (err) {
      console.error(err);
      // Fallback try PUT /users/:id
      try {
        const fallbackRes = await API.put(`/users/${user?._id}`, { avatar: selectedAvatar });
        if (fallbackRes.data?.success) {
          updateUser(fallbackRes.data.user || { ...user, avatar: selectedAvatar });
          addToast('Avatar saved successfully!', 'success');
          if (onAvatarSaved) onAvatarSaved(fallbackRes.data.user);
          onClose();
          return;
        }
      } catch (fallbackErr) {
        addToast(err.response?.data?.message || 'Failed to update avatar', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Choose Student Character Avatar"
      maxWidth="max-w-2xl"
      bodyClassName="p-3 sm:p-4.5 flex flex-col flex-1 min-h-0 overflow-hidden space-y-2.5 sm:space-y-3"
      footer={
        <div className="flex items-center justify-between gap-2.5 sm:gap-4 w-full text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 sm:py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition-all font-mono font-semibold cursor-pointer text-center touch-manipulation active:scale-95"
          >
            Cancel
          </button>

          <div className="hidden sm:flex items-center gap-1.5 text-slate-400 font-mono text-[11px] truncate">
            <span>Equipping:</span>
            <span className="font-bold text-cyan-300 truncate">
              {selectedPreset ? selectedPreset.name : 'Character'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !selectedAvatar}
            className="px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black font-mono text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer touch-manipulation"
          >
            {saving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Save Avatar</span>
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="flex flex-col flex-1 min-h-0 w-full font-sans text-slate-100 space-y-3 sm:space-y-3.5">
        {/* Header Selected Identity Banner - Always Visible & Responsive */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-indigo-950/60 to-slate-900/90 text-white border border-cyan-500/30 shadow-[0_0_25px_rgba(6,182,212,0.12)] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="relative shrink-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl p-0.5 bg-gradient-to-tr from-cyan-400 via-indigo-500 to-fuchsia-500 shadow-lg shadow-cyan-500/20 flex items-center justify-center overflow-hidden">
                {selectedAvatar ? (
                  <img
                    src={selectedAvatar}
                    alt="Avatar Preview"
                    className="w-full h-full object-cover rounded-[14px] bg-slate-950"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/assets/free-fire-logo.jpg';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-slate-800 rounded-[14px] flex items-center justify-center font-bold text-xl text-slate-400 font-mono">
                    {user?.name?.charAt(0)?.toUpperCase() || 'S'}
                  </div>
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 p-0.5 sm:p-1 bg-cyan-500 text-slate-950 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.8)]">
                <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              </span>
            </div>

            <div className="min-w-0 space-y-0.5 flex-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 font-mono flex items-center gap-1.5 flex-wrap">
                <span>Selected Identity</span>
                {selectedPreset && (
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase border ${
                      selectedPreset.game === 'BGMI'
                        ? 'bg-sky-950/80 text-sky-300 border-sky-500/40'
                        : selectedPreset.game === 'Free Fire'
                        ? 'bg-orange-950/80 text-orange-300 border-orange-500/40'
                        : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                    }`}
                  >
                    {selectedPreset.game}
                  </span>
                )}
              </div>
              <h4 className="text-sm sm:text-base font-black text-white truncate font-mono">
                {selectedPreset ? selectedPreset.name : user?.name || 'Player Avatar'}
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                {selectedPreset ? selectedPreset.title : 'Official Campus Esports Player Profile'}
              </p>
            </div>
          </div>

          <div className="hidden min-[480px]:flex flex-col items-end shrink-0 pl-2">
            <span className="text-[10px] font-mono uppercase text-slate-400">Selection</span>
            <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Ready
            </span>
          </div>
        </div>

        {/* Tab Filters - Full Width & Touch Friendly */}
        <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs font-semibold select-none shrink-0 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setActiveTab('bgmi')}
            className={`px-2 py-2 sm:py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center touch-manipulation active:scale-[0.98] ${
              activeTab === 'bgmi'
                ? 'bg-gradient-to-r from-sky-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/30 border border-cyan-400/50 font-bold'
                : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-900/60 bg-transparent'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0"></span>
            <span className="truncate font-mono">BGMI</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold hidden min-[360px]:inline-block ${
                activeTab === 'bgmi' ? 'bg-white/25 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
            >
              {AVATAR_PRESETS.bgmi.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('freefire')}
            className={`px-2 py-2 sm:py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center touch-manipulation active:scale-[0.98] ${
              activeTab === 'freefire'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-orange-500/30 border border-amber-400/50 font-bold'
                : 'text-slate-400 hover:text-amber-300 hover:bg-slate-900/60 bg-transparent'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
            <span className="truncate font-mono">Free Fire</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold hidden min-[360px]:inline-block ${
                activeTab === 'freefire' ? 'bg-white/25 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
            >
              {AVATAR_PRESETS.freefire.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('valorant')}
            className={`px-2 py-2 sm:py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center touch-manipulation active:scale-[0.98] ${
              activeTab === 'valorant'
                ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/30 border border-rose-400/50 font-bold'
                : 'text-slate-400 hover:text-rose-300 hover:bg-slate-900/60 bg-transparent'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0"></span>
            <span className="truncate font-mono">Valorant</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold hidden min-[360px]:inline-block ${
                activeTab === 'valorant' ? 'bg-white/25 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
            >
              {AVATAR_PRESETS.valorant.length}
            </span>
          </button>
        </div>

        {/* Character Suggestions Grid - Flexible & Smoothly Scrollable */}
        <div className="flex-1 min-h-0 flex flex-col space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1 shrink-0">
            <span>Select avatar to equip:</span>
            <span className="font-mono text-[11px] font-bold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-500/40">
              {visibleAvatars.length} Available
            </span>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-1 pr-1.5 gaming-scrollbar touch-pan-y">
            <div className="grid grid-cols-2 min-[380px]:grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
              {visibleAvatars.map((preset) => {
                const isSelected = selectedAvatar === preset.src;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`
                      relative p-2 sm:p-2.5 rounded-2xl border text-left transition-all group cursor-pointer flex flex-col items-center justify-between gap-1.5 sm:gap-2 touch-manipulation
                      ${
                        isSelected
                          ? 'bg-gradient-to-b from-cyan-950/80 to-slate-950/90 border-cyan-400 ring-2 ring-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.35)] scale-[1.03]'
                          : 'bg-slate-950/70 hover:bg-slate-900/80 border-slate-800/90 hover:border-cyan-500/40 text-slate-300 hover:scale-[1.01] active:scale-95'
                      }
                    `}
                  >
                    {/* Active Selected Badge */}
                    {isSelected && (
                      <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.8)] z-10 animate-in zoom-in-50">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}

                    {/* Avatar Image */}
                    <div className="w-14 h-14 min-[380px]:w-16 min-[380px]:h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-xl overflow-hidden bg-slate-950 border border-slate-800/90 group-hover:border-cyan-500/40 shadow-inner flex items-center justify-center group-hover:scale-105 transition-all shrink-0">
                      <img
                        src={preset.src}
                        alt={preset.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/assets/free-fire-logo.jpg';
                        }}
                      />
                    </div>

                    {/* Character Info */}
                    <div className="w-full text-center space-y-0.5 min-w-0">
                      <div className="flex items-center justify-center">
                        <span className="text-xs font-bold text-white group-hover:text-cyan-300 truncate font-mono w-full text-center transition-colors">
                          {preset.name}
                        </span>
                      </div>
                      <div className="flex items-center justify-center">
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase tracking-wider ${
                            preset.game === 'BGMI'
                              ? 'bg-sky-950/80 text-sky-300 border border-sky-500/40'
                              : preset.game === 'Free Fire'
                              ? 'bg-orange-950/80 text-orange-300 border border-orange-500/40'
                              : 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                          }`}
                        >
                          {preset.game}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AvatarSelectorModal;
