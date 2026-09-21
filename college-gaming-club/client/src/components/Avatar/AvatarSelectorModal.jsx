import React, { useState, useEffect } from 'react';
import Modal from '../Modal/Modal';
import { AVATAR_PRESETS } from '../../data/avatarPresets';
import {
  Check,
  Sparkles,
  Gamepad2,
  Image as ImageIcon,
  Link as LinkIcon,
  Upload,
  RefreshCw,
} from 'lucide-react';
import API from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const AvatarSelectorModal = ({ isOpen, onClose, onAvatarSaved }) => {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('bgmi'); // 'bgmi' | 'freefire' | 'valorant' | 'custom'
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || '');
  const [customUrl, setCustomUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const currentAvatar = user?.avatar || '';
      setSelectedAvatar(currentAvatar);
      setCustomUrl('');

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
    if (activeTab === 'custom') return [];
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

  const handleApplyCustomUrl = () => {
    if (!customUrl.trim()) return;
    setSelectedAvatar(customUrl.trim());
    addToast('Custom avatar URL preview applied', 'info');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('Please upload an image file (JPG, PNG, WEBP)', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addToast('Image size must be less than 5MB', 'error');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await API.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success && res.data?.url) {
        setSelectedAvatar(res.data.url);
        addToast('Avatar uploaded! Click "Save Avatar" to confirm.', 'success');
      } else {
        addToast(res.data?.message || 'Failed to upload image', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Upload failed. You can also paste an image URL directly.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedAvatar) {
      addToast('Please select or upload an avatar first', 'error');
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
    >
      <div className="space-y-5 max-w-2xl font-sans text-slate-800">
        {/* Header Preview Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-slate-700/80 shadow-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl p-0.5 bg-gradient-to-tr from-cyan-400 via-indigo-500 to-fuchsia-500 shadow-lg shadow-cyan-500/20 flex items-center justify-center overflow-hidden">
                {selectedAvatar ? (
                  <img
                    src={selectedAvatar}
                    alt="Avatar Preview"
                    className="w-full h-full object-cover rounded-[14px] bg-slate-900"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/assets/free-fire-logo.jpg';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-slate-800 rounded-[14px] flex items-center justify-center font-bold text-2xl text-slate-400 font-mono">
                    {user?.name?.charAt(0)?.toUpperCase() || 'S'}
                  </div>
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 p-1 bg-cyan-500 text-slate-950 rounded-full shadow-xs">
                <Sparkles className="w-3 h-3" />
              </span>
            </div>

            <div className="min-w-0 space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 font-mono flex items-center gap-1.5">
                <span>Selected Identity</span>
                {selectedPreset && (
                  <span className="bg-cyan-900/70 border border-cyan-500/30 px-1.5 py-0.2 rounded text-[9px]">
                    {selectedPreset.game}
                  </span>
                )}
              </span>
              <h4 className="text-base sm:text-lg font-black text-white truncate font-mono">
                {selectedPreset ? selectedPreset.name : user?.name || 'Player Avatar'}
              </h4>
              <p className="text-xs text-slate-400 truncate">
                {selectedPreset ? selectedPreset.title : 'Official Campus Esports Player Profile'}
              </p>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !selectedAvatar}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-cyan-500/25 flex items-center gap-1.5 shrink-0 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
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

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold overflow-x-auto select-none">
          <button
            type="button"
            onClick={() => setActiveTab('bgmi')}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'bgmi'
                ? 'bg-sky-500 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-sky-600'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            BGMI
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('freefire')}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'freefire'
                ? 'bg-orange-500 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-orange-600'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-orange-300"></span>
            Free Fire
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('valorant')}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'valorant'
                ? 'bg-rose-500 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-rose-600'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-300"></span>
            Valorant
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
              activeTab === 'custom'
                ? 'bg-indigo-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-indigo-600'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            Custom / Upload
          </button>
        </div>

        {/* Character Suggestions Grid */}
        {activeTab !== 'custom' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>Click any character to preview and save:</span>
              <span className="font-mono text-[11px] font-bold text-slate-700">
                {visibleAvatars.length} Available
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[360px] overflow-y-auto p-1 pr-2 admin-scrollbar">
              {visibleAvatars.map((preset) => {
                const isSelected = selectedAvatar === preset.src;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`
                      relative p-2.5 rounded-2xl border text-left transition-all group cursor-pointer flex flex-col items-center justify-between gap-2.5
                      ${
                        isSelected
                          ? 'bg-sky-50/80 border-sky-400 ring-2 ring-sky-400/40 shadow-md shadow-sky-500/10 scale-[1.02]'
                          : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 shadow-2xs'
                      }
                    `}
                  >
                    {/* Active Selected Badge */}
                    {isSelected && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-xs z-10">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}

                    {/* Avatar Image */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-950 border border-slate-200/80 shadow-xs flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
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
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-xs font-bold text-slate-900 truncate font-mono">
                          {preset.name}
                        </span>
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase tracking-wider ${
                            preset.game === 'BGMI'
                              ? 'bg-cyan-50 text-cyan-700 border border-cyan-100'
                              : preset.game === 'Free Fire'
                              ? 'bg-orange-50 text-orange-700 border border-orange-100'
                              : 'bg-rose-50 text-rose-700 border border-rose-100'
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
        )}

        {/* Custom URL or Upload Panel */}
        {activeTab === 'custom' && (
          <div className="space-y-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div>
              <h5 className="text-xs font-bold text-slate-900 mb-1">Paste Direct Image URL</h5>
              <p className="text-[11px] text-slate-500 mb-2">
                Paste any web image URL (Discord, Steam, Pinterest, Imgur, or direct JPG/PNG link):
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-sky-500 font-mono"
                />
                <button
                  type="button"
                  onClick={handleApplyCustomUrl}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Preview
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <h5 className="text-xs font-bold text-slate-900 mb-1">Or Upload from Device</h5>
              <p className="text-[11px] text-slate-500 mb-2">
                Choose a photo from your phone or computer (JPG, PNG, WEBP):
              </p>
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 hover:border-sky-400 rounded-2xl bg-slate-50/50 hover:bg-sky-50/30 transition-all cursor-pointer group">
                <Upload className="w-6 h-6 text-slate-400 group-hover:text-sky-500 mb-1 transition-colors" />
                <span className="text-xs font-bold text-slate-700 group-hover:text-sky-600">
                  {uploading ? 'Uploading avatar...' : 'Click to browse image file'}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">Maximum size: 5MB</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors font-semibold cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !selectedAvatar}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold transition-all shadow-sm disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
          >
            {saving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Saving to Account...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Save Avatar All Time</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AvatarSelectorModal;
