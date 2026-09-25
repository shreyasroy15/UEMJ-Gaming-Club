import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import Loading from '../../components/Loading/Loading';
import CloudinaryUpload from '../../components/Upload/CloudinaryUpload';
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
  RefreshCw,
  Globe,
  Settings as SettingsIcon,
  Sparkles,
} from 'lucide-react';

const AdminSettings = () => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const [whatsappData, setWhatsappData] = useState({
    groupName: 'UEMJ Gaming Club Official',
    link: 'https://chat.whatsapp.com/invite',
    qrCode: '',
    description: 'Join our official WhatsApp group for instant match room IDs, passwords, fixtures, and coordinator support.',
    isActive: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await API.get('/settings');
      if (res.data?.success && res.data?.settings?.whatsapp) {
        setWhatsappData(res.data.settings.whatsapp);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!whatsappData.link?.trim()) {
      addToast('Please provide a valid WhatsApp group link', 'error');
      return;
    }

    try {
      setSaving(true);
      const res = await API.put('/settings', {
        whatsapp: whatsappData,
      });

      if (res.data?.success) {
        addToast('WhatsApp group settings saved successfully!', 'success');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const previewQrSrc =
    whatsappData.qrCode && whatsappData.qrCode.trim().length > 0
      ? whatsappData.qrCode
      : `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
          whatsappData.link || 'https://chat.whatsapp.com/invite'
        )}&margin=12&format=svg`;

  const handleCopyLink = () => {
    if (!whatsappData.link) return;
    navigator.clipboard.writeText(whatsappData.link);
    setCopied(true);
    addToast('Link copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <Loading message="Loading club configuration..." />;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono">
              COMMUNITY SETTINGS
            </span>
            <span className="text-xs text-slate-500 font-mono">Bottom Navbar & QR</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-1 flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-emerald-600" />
            WhatsApp Group & QR Configuration
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure the official WhatsApp community link and QR code displayed on the user-side bottom navigation bar, mobile dock, and footer.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs font-mono uppercase tracking-wider shadow-sm disabled:opacity-50 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving Changes...' : 'Save Settings'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Controls (7 cols) */}
        <form onSubmit={handleSave} className="lg:col-span-7 space-y-5">
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 uppercase font-mono flex items-center gap-2">
                <SettingsIcon className="w-4 h-4 text-emerald-600" />
                WhatsApp Group Information
              </h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={whatsappData.isActive}
                  onChange={(e) =>
                    setWhatsappData({ ...whatsappData, isActive: e.target.checked })
                  }
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-700 font-mono">
                  {whatsappData.isActive ? 'Active on User Side' : 'Hidden from Users'}
                </span>
              </label>
            </div>

            {/* Group Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold text-slate-700 uppercase">
                Community / Group Title *
              </label>
              <input
                type="text"
                required
                value={whatsappData.groupName}
                onChange={(e) =>
                  setWhatsappData({ ...whatsappData, groupName: e.target.value })
                }
                placeholder="e.g. UEMJ Gaming Club Official WhatsApp"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 font-semibold"
              />
              <p className="text-[11px] text-slate-500">
                The headline displayed on the QR modal and bottom navigation.
              </p>
            </div>

            {/* Group Invite Link */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold text-slate-700 uppercase">
                WhatsApp Group Invite Link *
              </label>
              <div className="relative">
                <input
                  type="url"
                  required
                  value={whatsappData.link}
                  onChange={(e) =>
                    setWhatsappData({ ...whatsappData, link: e.target.value })
                  }
                  placeholder="https://chat.whatsapp.com/L123456789..."
                  className="w-full px-3.5 py-2 pl-9 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 font-mono font-semibold"
                />
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
              <p className="text-[11px] text-slate-500">
                Direct WhatsApp group invite URL that opens when students click "Join Group".
              </p>
            </div>

            {/* Description / Instructions */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold text-slate-700 uppercase">
                Description / Notice for Students
              </label>
              <textarea
                rows={3}
                value={whatsappData.description}
                onChange={(e) =>
                  setWhatsappData({ ...whatsappData, description: e.target.value })
                }
                placeholder="e.g. Join our official WhatsApp group for instant match room IDs, passwords, fixtures, and coordinator support."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* QR Code Upload or Custom Image */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 uppercase font-mono flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-600" />
                Custom WhatsApp QR Code Flyer
              </h2>
              {whatsappData.qrCode && (
                <button
                  type="button"
                  onClick={() => setWhatsappData({ ...whatsappData, qrCode: '' })}
                  className="text-[11px] text-rose-600 hover:text-rose-700 font-mono font-bold underline cursor-pointer"
                >
                  Reset to Auto-Generated QR
                </button>
              )}
            </div>

            <p className="text-xs text-slate-600">
              You can upload a custom WhatsApp group QR code screenshot or poster. If left empty, the website will <strong>automatically generate a crisp, high-resolution QR code</strong> directly from your invite link above!
            </p>

            <CloudinaryUpload
              value={whatsappData.qrCode}
              onChange={(url) => setWhatsappData({ ...whatsappData, qrCode: url })}
              label="Upload Custom QR Code Image / Flyer"
              helpText="PNG, JPG, or WEBP (Max 10MB)"
              type="public"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs font-mono uppercase tracking-wider shadow-sm disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>

        {/* Right Column: Live Interactive User Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-xl text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Live User Preview
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                  whatsappData.isActive
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                }`}
              >
                {whatsappData.isActive ? '● Visible' : 'Hidden'}
              </span>
            </div>

            {/* Preview Card */}
            <div className="space-y-4 text-center">
              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                  <MessageCircle className="w-7 h-7 text-emerald-400 fill-emerald-400/20" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-mono text-white">
                    {whatsappData.groupName || 'Group Name'}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed line-clamp-2">
                    {whatsappData.description || 'Description'}
                  </p>
                </div>
              </div>

              {/* Scannable QR Code */}
              <div className="mx-auto w-48 h-48 p-2.5 rounded-xl bg-white border-2 border-emerald-500/40 shadow-lg flex items-center justify-center">
                <img
                  src={previewQrSrc}
                  alt="QR Preview"
                  className="w-full h-full object-contain rounded"
                />
              </div>

              <div className="space-y-2 pt-1">
                <a
                  href={whatsappData.link || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-slate-950 stroke-none" />
                  <span>Join WhatsApp Group</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-mono text-xs flex items-center justify-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Invite Link'}</span>
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-left text-[11px] font-mono text-slate-400 space-y-1">
                <div className="flex items-center gap-1 text-slate-300 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Placement Locations:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[10px]">
                  <li>Mobile Bottom Navigation Dock (fixed on all pages)</li>
                  <li>Desktop Floating Community Button (bottom-right)</li>
                  <li>Website Footer Official Community Card</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
