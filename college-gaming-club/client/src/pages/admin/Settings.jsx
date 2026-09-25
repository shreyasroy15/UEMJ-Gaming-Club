import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import Loading from '../../components/Loading/Loading';
import CloudinaryUpload from '../../components/Upload/CloudinaryUpload';
import Modal from '../../components/Modal/Modal';
import { useToast } from '../../context/ToastContext';
import {
  MessageCircle,
  QrCode,
  Save,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Plus,
  Trash2,
  Edit3,
  Star,
  Layers,
  Gamepad2,
  Bell,
  HelpCircle,
  Users,
  Eye,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

const CATEGORIES = [
  'General',
  'BGMI',
  'Valorant',
  'Free Fire',
  'Announcements',
  'Support',
  'Other',
];

const getCategoryBadgeClass = (category) => {
  switch (category) {
    case 'BGMI':
      return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'Valorant':
      return 'bg-rose-100 text-rose-800 border-rose-300';
    case 'Free Fire':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'Announcements':
      return 'bg-purple-100 text-purple-800 border-purple-300';
    case 'Support':
      return 'bg-sky-100 text-sky-800 border-sky-300';
    default:
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
  }
};

const getCategoryIcon = (category) => {
  switch (category) {
    case 'BGMI':
    case 'Valorant':
    case 'Free Fire':
      return <Gamepad2 className="w-3.5 h-3.5" />;
    case 'Announcements':
      return <Bell className="w-3.5 h-3.5" />;
    case 'Support':
      return <HelpCircle className="w-3.5 h-3.5" />;
    default:
      return <Users className="w-3.5 h-3.5" />;
  }
};

const AdminSettings = () => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedGroupIndex, setCopiedGroupIndex] = useState(null);

  // List of all groups
  const [groups, setGroups] = useState([]);

  // Active preview tab index
  const [previewIndex, setPreviewIndex] = useState(0);

  // Group Edit/Create Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null); // null = new, number = edit
  const [formGroup, setFormGroup] = useState({
    name: '',
    category: 'General',
    link: '',
    qrCode: '',
    description: 'Join for instant match room IDs, passwords, fixtures, and coordinator support.',
    isActive: true,
    isDefault: false,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await API.get('/settings');
      if (res.data?.success && res.data?.settings) {
        const s = res.data.settings;
        let fetchedGroups = [];

        if (Array.isArray(s.whatsappGroups) && s.whatsappGroups.length > 0) {
          fetchedGroups = s.whatsappGroups;
        } else if (s.whatsapp) {
          fetchedGroups = [
            {
              name: s.whatsapp.groupName || 'Main Community',
              category: 'General',
              link: s.whatsapp.link || 'https://chat.whatsapp.com/invite',
              qrCode: s.whatsapp.qrCode || '',
              description:
                s.whatsapp.description ||
                'Join our official WhatsApp group for instant match room IDs, passwords, fixtures, and coordinator support.',
              isActive: s.whatsapp.isActive !== false,
              isDefault: true,
            },
          ];
        }

        setGroups(fetchedGroups);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load community settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async (groupsToSave = groups) => {
    try {
      setSaving(true);

      // Validate links
      for (const g of groupsToSave) {
        if (!g.name?.trim()) {
          addToast('All groups must have a title', 'error');
          setSaving(false);
          return;
        }
        if (!g.link?.trim()) {
          addToast(`Group "${g.name}" needs a WhatsApp invite link`, 'error');
          setSaving(false);
          return;
        }
      }

      const res = await API.put('/settings', {
        whatsappGroups: groupsToSave,
      });

      if (res.data?.success) {
        addToast('All WhatsApp groups saved successfully!', 'success');
        if (res.data.settings?.whatsappGroups) {
          setGroups(res.data.settings.whatsappGroups);
        }
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const openCreateModal = () => {
    setEditingIndex(null);
    setFormGroup({
      name: '',
      category: 'General',
      link: '',
      qrCode: '',
      description: 'Join for instant match room IDs, passwords, fixtures, and coordinator support.',
      isActive: true,
      isDefault: groups.length === 0,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (index) => {
    setEditingIndex(index);
    setFormGroup({ ...groups[index] });
    setIsModalOpen(true);
  };

  const handleModalSubmit = (e) => {
    e.preventDefault();
    if (!formGroup.name?.trim()) {
      addToast('Group title is required', 'error');
      return;
    }
    if (!formGroup.link?.trim()) {
      addToast('WhatsApp invite link is required', 'error');
      return;
    }

    let updated = [...groups];

    // If marked as default, unset others
    if (formGroup.isDefault) {
      updated = updated.map((g) => ({ ...g, isDefault: false }));
    }

    if (editingIndex !== null) {
      updated[editingIndex] = { ...formGroup };
    } else {
      // If this is the only group, make it default
      const shouldBeDefault = formGroup.isDefault || updated.length === 0;
      updated.push({ ...formGroup, isDefault: shouldBeDefault });
    }

    // Ensure at least one default
    if (!updated.some((g) => g.isDefault) && updated.length > 0) {
      updated[0].isDefault = true;
    }

    setGroups(updated);
    setIsModalOpen(false);
    handleSaveAll(updated);
  };

  const handleDeleteGroup = (index) => {
    if (groups.length <= 1) {
      addToast('You must keep at least one WhatsApp group configured', 'warning');
      return;
    }
    if (!window.confirm(`Are you sure you want to remove "${groups[index]?.name}"?`)) {
      return;
    }

    let updated = groups.filter((_, idx) => idx !== index);
    if (!updated.some((g) => g.isDefault) && updated.length > 0) {
      updated[0].isDefault = true;
    }
    setGroups(updated);
    if (previewIndex >= updated.length) {
      setPreviewIndex(0);
    }
    handleSaveAll(updated);
    addToast('Group removed and settings updated', 'info');
  };

  const handleSetDefault = (index) => {
    const updated = groups.map((g, idx) => ({
      ...g,
      isDefault: idx === index,
    }));
    setGroups(updated);
    handleSaveAll(updated);
    addToast(`"${groups[index]?.name}" is now the primary community group`, 'success');
  };

  const handleToggleActive = (index) => {
    const updated = [...groups];
    updated[index] = {
      ...updated[index],
      isActive: !updated[index].isActive,
    };
    setGroups(updated);
    handleSaveAll(updated);
  };

  const handleCopyLink = (link, idx) => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopiedGroupIndex(idx);
    addToast('WhatsApp invite link copied!', 'success');
    setTimeout(() => setCopiedGroupIndex(null), 2000);
  };

  // Preview target group
  const activePreviewGroup = groups[previewIndex] || groups[0] || {};
  const previewQrSrc =
    activePreviewGroup.qrCode && activePreviewGroup.qrCode.trim().length > 0
      ? activePreviewGroup.qrCode
      : `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
          activePreviewGroup.link || 'https://chat.whatsapp.com/invite'
        )}&margin=12&format=svg`;

  if (loading) return <Loading message="Loading club configuration..." />;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono">
              COMMUNITY SETTINGS
            </span>
            <span className="text-xs text-slate-500 font-mono">Multi-Group WhatsApp Engine</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-1 flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-emerald-600" />
            WhatsApp Groups & QR Hub
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage multiple WhatsApp groups for BGMI, Valorant, Free Fire, Announcements, and general club discussions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs font-mono uppercase tracking-wider shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Add New Group</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveAll()}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs font-mono uppercase tracking-wider shadow-sm disabled:opacity-50 transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save All'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Group List (7 cols) + User Live Preview (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Configured Groups */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase font-mono">
                Configured Groups ({groups.length})
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              {groups.filter((g) => g.isActive !== false).length} Active on site
            </span>
          </div>

          {groups.length === 0 ? (
            <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl space-y-3">
              <MessageCircle className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700 font-mono">No WhatsApp Groups Configured</p>
              <button
                type="button"
                onClick={openCreateModal}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold font-mono"
              >
                Add Your First Group
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((group, idx) => {
                const isActive = group.isActive !== false;
                const isDefault = Boolean(group.isDefault);

                return (
                  <div
                    key={group._id || idx}
                    className={`p-4 rounded-2xl bg-white border transition-all shadow-sm ${
                      isDefault
                        ? 'border-emerald-500/60 ring-1 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        {/* Badges */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border flex items-center gap-1 ${getCategoryBadgeClass(
                              group.category
                            )}`}
                          >
                            {getCategoryIcon(group.category)}
                            {group.category || 'General'}
                          </span>

                          {isDefault && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/15 text-amber-700 border border-amber-300 flex items-center gap-1">
                              <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-600" />
                              Primary Community
                            </span>
                          )}

                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                          >
                            {isActive ? '● Active' : '○ Hidden'}
                          </span>
                        </div>

                        {/* Title & Link */}
                        <h3 className="text-base font-black text-slate-900 font-mono truncate">
                          {group.name}
                        </h3>

                        <p className="text-xs text-slate-500 line-clamp-2">
                          {group.description || 'No description provided.'}
                        </p>

                        <div className="flex items-center gap-2 pt-1 text-xs font-mono text-slate-600">
                          <span className="text-slate-400 truncate max-w-[200px] sm:max-w-[280px]">
                            {group.link}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyLink(group.link, idx)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                            title="Copy Link"
                          >
                            {copiedGroupIndex === idx ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <a
                            href={group.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-slate-400 hover:text-emerald-600 rounded transition-colors"
                            title="Open Link"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>

                      {/* QR Thumbnail or Status */}
                      <div className="shrink-0 flex flex-col items-center">
                        <div
                          onClick={() => setPreviewIndex(idx)}
                          className="w-16 h-16 p-1 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden cursor-pointer hover:border-emerald-400 transition-all flex items-center justify-center group"
                          title="Click to preview this group"
                        >
                          <img
                            src={
                              group.qrCode && group.qrCode.trim().length > 0
                                ? group.qrCode
                                : `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                                    group.link || 'https://chat.whatsapp.com/invite'
                                  )}&margin=4`
                            }
                            alt="QR Thumbnail"
                            className="w-full h-full object-contain select-none"
                          />
                        </div>
                        <span className="text-[9px] font-mono text-slate-400 mt-1">
                          {group.qrCode ? 'Custom Flyer' : 'Auto QR'}
                        </span>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(idx)}
                          className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                            isActive
                              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                          }`}
                        >
                          {isActive ? 'Hide from Users' : 'Activate Group'}
                        </button>

                        {!isDefault && (
                          <button
                            type="button"
                            onClick={() => handleSetDefault(idx)}
                            className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Star className="w-3 h-3 text-amber-500" />
                            Make Primary
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewIndex(idx);
                          }}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            previewIndex === idx
                              ? 'bg-emerald-500 text-white border-emerald-500'
                              : 'text-slate-500 hover:text-slate-900 border-slate-200 hover:bg-slate-50'
                          }`}
                          title="Preview in Mockup"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditModal(idx)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                          title="Edit Group"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteGroup(idx)}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 border border-slate-200 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Group"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Notice */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 font-mono space-y-1">
            <p className="font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Multi-Group Tips:
            </p>
            <p>• Create separate groups for <strong>BGMI</strong>, <strong>Valorant</strong>, and <strong>Free Fire</strong> tournaments.</p>
            <p>• The <strong>Primary Community</strong> is featured first on the user popup and footer.</p>
            <p>• If no custom flyer image is uploaded, an official QR code is automatically generated from the invite link.</p>
          </div>
        </div>

        {/* Right Column: Live User Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase font-mono flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-600" />
              Live User Popup Preview
            </h2>
            <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Interactive
            </span>
          </div>

          {/* Preview Container Mockup */}
          <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl relative overflow-hidden text-center space-y-4">
            {/* Background lighting */}
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Selector tabs if multiple active groups */}
            {groups.length > 1 && (
              <div className="flex flex-col gap-1.5 pb-2 border-b border-slate-800 text-left">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 text-emerald-400">
                  <Layers className="w-3 h-3" /> Select Group
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                  {groups.map((g, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPreviewIndex(idx)}
                      className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1 border ${
                        previewIndex === idx
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
                      }`}
                    >
                      {getCategoryIcon(g.category)}
                      <span className="truncate max-w-[100px]">{g.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Header / Verified Badge */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center">
                    <MessageCircle className="w-7 h-7 text-emerald-400 stroke-[2.2]" />
                  </div>
                </div>
                <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[9px] font-black uppercase tracking-wider flex items-center gap-0.5">
                  <ShieldCheck className="w-2.5 h-2.5" /> VERIFIED
                </span>
              </div>

              <div>
                <div className="flex items-center justify-center gap-2">
                  <h3 className="text-base font-black text-white font-mono tracking-tight">
                    {activePreviewGroup.name || 'Group Title'}
                  </h3>
                  {activePreviewGroup.category && activePreviewGroup.category !== 'General' && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-[9px] font-mono text-emerald-400">
                      {activePreviewGroup.category}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1 leading-relaxed line-clamp-2">
                  {activePreviewGroup.description || 'Join our official community.'}
                </p>
              </div>
            </div>

            {/* QR Code Container Mockup */}
            <div className="relative mx-auto w-48 h-48 p-2.5 rounded-2xl bg-white border-2 border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.2)] flex flex-col items-center justify-center overflow-hidden">
              <img
                src={previewQrSrc}
                alt="QR Preview"
                className="w-full h-full object-contain rounded-xl select-none"
              />
              <div className="absolute bottom-2 inset-x-2 py-1 rounded bg-slate-950/85 backdrop-blur-md border border-emerald-500/30 text-[9px] font-mono font-bold text-emerald-300 flex items-center justify-center gap-1">
                <QrCode className="w-3 h-3 text-emerald-400" />
                <span>Scan with camera or WhatsApp</span>
              </div>
            </div>

            {/* Direct Join Button Mockup */}
            <div className="space-y-2 pt-1">
              <a
                href={activePreviewGroup.link || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-slate-950 font-black text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.35)] cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-slate-950 stroke-none" />
                <span>Join Directly</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <div className="text-[10px] text-slate-400 font-mono">
                {activePreviewGroup.isActive !== false ? (
                  <span className="text-emerald-400">✓ Displayed on User Site</span>
                ) : (
                  <span className="text-amber-400">⚠ Currently Hidden from Users</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Group Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingIndex !== null ? `Edit: ${formGroup.name || 'Group'}` : 'Add New WhatsApp Group'}
      >
        <form onSubmit={handleModalSubmit} className="space-y-4">
          {/* Group Title */}
          <div className="space-y-1">
            <label className="block text-xs font-mono font-bold text-slate-300 uppercase">
              Group Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. BGMI Official Tournament Squads"
              value={formGroup.name}
              onChange={(e) => setFormGroup({ ...formGroup, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Category */}
          <div className="space-y-1">
            <label className="block text-xs font-mono font-bold text-slate-300 uppercase">
              Category / Game Focus
            </label>
            <select
              value={formGroup.category}
              onChange={(e) => setFormGroup({ ...formGroup, category: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-slate-900 text-white">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* WhatsApp Invite Link */}
          <div className="space-y-1">
            <label className="block text-xs font-mono font-bold text-slate-300 uppercase">
              WhatsApp Group Invite Link *
            </label>
            <div className="relative">
              <input
                type="url"
                required
                placeholder="https://chat.whatsapp.com/..."
                value={formGroup.link}
                onChange={(e) => setFormGroup({ ...formGroup, link: e.target.value })}
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:border-emerald-500"
              />
              <MessageCircle className="absolute right-3 top-3 w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              In WhatsApp: Group Info → Invite via link → Copy link
            </p>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-xs font-mono font-bold text-slate-300 uppercase">
              Description / Match Guidelines
            </label>
            <textarea
              rows={2}
              value={formGroup.description}
              onChange={(e) => setFormGroup({ ...formGroup, description: e.target.value })}
              placeholder="Guidelines for students & room ID sharing..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Cloudinary QR Code Upload */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-mono font-bold text-slate-300 uppercase">
              Custom QR Code Flyer / Image (Optional, up to 10MB)
            </label>
            <CloudinaryUpload
              value={formGroup.qrCode}
              onChange={(url) => setFormGroup({ ...formGroup, qrCode: url })}
              folder="whatsapp_qrs"
              label="Upload Custom QR Code Flyer"
            />
            <p className="text-[11px] text-slate-400 font-mono">
              Leave empty to automatically generate a sharp QR code from the WhatsApp invite link.
            </p>
          </div>

          {/* Switches: Active & Default */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formGroup.isActive}
                onChange={(e) => setFormGroup({ ...formGroup, isActive: e.target.checked })}
                className="w-4 h-4 text-emerald-500 rounded border-slate-700 focus:ring-emerald-400 cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-slate-200">
                Active on User Website
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formGroup.isDefault}
                onChange={(e) => setFormGroup({ ...formGroup, isDefault: e.target.checked })}
                className="w-4 h-4 text-amber-500 rounded border-slate-700 focus:ring-amber-400 cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400" /> Primary Community Group
              </span>
            </label>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-xs font-mono font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs font-mono uppercase tracking-wider transition-all cursor-pointer"
            >
              {editingIndex !== null ? 'Save Changes' : 'Create Group'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminSettings;
