import React, { useState, useEffect } from 'react';
import Modal from '../Modal/Modal';
import {
  MessageCircle,
  ExternalLink,
  Copy,
  Check,
  QrCode,
  ShieldCheck,
  Users,
  Gamepad2,
  Bell,
  HelpCircle,
  Layers,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

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

const WhatsAppModal = ({ isOpen, onClose, whatsappSettings }) => {
  const [copied, setCopied] = useState(false);
  const { addToast } = useToast();

  // Extract all active groups
  const groups =
    Array.isArray(whatsappSettings?.whatsappGroups) && whatsappSettings.whatsappGroups.length > 0
      ? whatsappSettings.whatsappGroups
      : Array.isArray(whatsappSettings?.groups) && whatsappSettings.groups.length > 0
      ? whatsappSettings.groups
      : [
          {
            name: whatsappSettings?.groupName || 'UEMJ Gaming Club Official',
            link: whatsappSettings?.link || 'https://chat.whatsapp.com/invite',
            qrCode: whatsappSettings?.qrCode || '',
            description:
              whatsappSettings?.description ||
              'Join our official WhatsApp group for instant match room IDs, passwords, fixtures, and coordinator support.',
            category: 'General',
            isActive: true,
          },
        ];

  const activeGroups = groups.filter((g) => g.isActive !== false);

  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);

  // Reset selected group if index out of bounds
  useEffect(() => {
    if (selectedGroupIndex >= activeGroups.length) {
      setSelectedGroupIndex(0);
    }
  }, [activeGroups.length, selectedGroupIndex]);

  const currentGroup = activeGroups[selectedGroupIndex] || activeGroups[0] || {};
  const groupName = currentGroup.name || currentGroup.groupName || 'UEMJ Gaming Club Official';
  const groupLink = currentGroup.link || 'https://chat.whatsapp.com/invite';
  const groupCategory = currentGroup.category || 'General';
  const description =
    currentGroup.description ||
    'Join our official WhatsApp group for instant match room IDs, passwords, fixtures, and coordinator support.';

  const qrImageSrc =
    currentGroup.qrCode && currentGroup.qrCode.trim().length > 0
      ? currentGroup.qrCode
      : `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(
          groupLink
        )}&margin=12&format=svg`;

  const handleCopyLink = () => {
    if (!groupLink) return;
    navigator.clipboard.writeText(groupLink);
    setCopied(true);
    addToast(`${groupName} link copied!`, 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Official WhatsApp Community">
      <div className="space-y-4 text-center">
        {/* Multi-Group Tabs/Pills if more than 1 group */}
        {activeGroups.length > 1 && (
          <div className="flex flex-col gap-1.5 pb-1 border-b border-slate-800">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
              <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-emerald-400">
                <Layers className="w-3.5 h-3.5" /> Select Group / Game
              </span>
              <span className="text-[10px] bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700 text-slate-300">
                {activeGroups.length} Groups Active
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {activeGroups.map((g, idx) => {
                const isSelected = selectedGroupIndex === idx;
                return (
                  <button
                    key={g._id || idx}
                    type="button"
                    onClick={() => {
                      setSelectedGroupIndex(idx);
                      setCopied(false);
                    }}
                    className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-slate-950 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                        : 'bg-slate-900/90 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {getCategoryIcon(g.category)}
                    <span className="truncate max-w-[140px]">{g.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Current Group Header */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-[0_0_25px_rgba(16,185,129,0.35)]">
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
              <h3 className="text-base sm:text-lg font-black text-white font-mono tracking-tight">
                {groupName}
              </h3>
              {groupCategory && groupCategory !== 'General' && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/40 text-[10px] font-mono font-bold text-emerald-400">
                  {groupCategory}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* QR Code Container */}
        <div className="relative mx-auto w-52 h-52 sm:w-60 sm:h-60 p-3 rounded-2xl bg-white border-2 border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.2)] flex flex-col items-center justify-center group overflow-hidden">
          <img
            src={qrImageSrc}
            alt={`${groupName} QR Code`}
            className="w-full h-full object-contain rounded-xl select-none"
            loading="eager"
          />

          {/* Scan overlay chip */}
          <div className="absolute bottom-2 inset-x-3 py-1 rounded-lg bg-slate-950/85 backdrop-blur-md border border-emerald-500/30 text-[10px] font-mono font-bold text-emerald-300 flex items-center justify-center gap-1.5">
            <QrCode className="w-3.5 h-3.5 text-emerald-400" />
            <span>Scan with phone camera or WhatsApp</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <a
            href={groupLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all cursor-pointer active:scale-[0.98]"
          >
            <MessageCircle className="w-4 h-4 fill-slate-950 stroke-none" />
            <span>Join {groupName} Directly</span>
            <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
          </a>

          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/40 text-slate-300 hover:text-white font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy Invite Link</span>
              </>
            )}
          </button>
        </div>

        {/* Security / Community Note */}
        <p className="text-[10px] text-slate-500 font-mono">
          🔒 Official club community. Match room IDs & passwords for upcoming tournament rounds will be posted directly in these groups.
        </p>
      </div>
    </Modal>
  );
};

export default WhatsAppModal;
