import React, { useState } from 'react';
import Modal from '../Modal/Modal';
import {
  MessageCircle,
  ExternalLink,
  Copy,
  Check,
  QrCode,
  ShieldCheck,
  Users,
  Sparkles,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const WhatsAppModal = ({ isOpen, onClose, whatsappSettings }) => {
  const [copied, setCopied] = useState(false);
  const { addToast } = useToast();

  const groupName = whatsappSettings?.groupName || 'UEMJ Gaming Club Official';
  const groupLink = whatsappSettings?.link || 'https://chat.whatsapp.com/invite';
  const description =
    whatsappSettings?.description ||
    'Join our official WhatsApp group for instant match room IDs, passwords, fixtures, and coordinator support.';

  // If a custom QR code image was uploaded by admin, use it.
  // Otherwise, automatically generate a crisp QR code from the group invite link.
  const qrImageSrc =
    whatsappSettings?.qrCode && whatsappSettings.qrCode.trim().length > 0
      ? whatsappSettings.qrCode
      : `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(
          groupLink
        )}&margin=12&format=svg`;

  const handleCopyLink = () => {
    if (!groupLink) return;
    navigator.clipboard.writeText(groupLink);
    setCopied(true);
    addToast('WhatsApp group link copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Official WhatsApp Community">
      <div className="space-y-5 text-center">
        {/* Header Badge */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-[0_0_25px_rgba(16,185,129,0.35)]">
              <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-emerald-400 stroke-[2.2]" />
              </div>
            </div>
            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[9px] font-black uppercase tracking-wider flex items-center gap-0.5">
              <ShieldCheck className="w-2.5 h-2.5" /> VERIFIED
            </span>
          </div>

          <div>
            <h3 className="text-lg font-black text-white font-mono tracking-tight">
              {groupName}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* QR Code Container */}
        <div className="relative mx-auto w-56 h-56 sm:w-64 sm:h-64 p-3 rounded-2xl bg-white border-2 border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.2)] flex flex-col items-center justify-center group overflow-hidden">
          <img
            src={qrImageSrc}
            alt="WhatsApp Group QR Code"
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
        <div className="space-y-2.5 pt-1">
          <a
            href={groupLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all cursor-pointer active:scale-[0.98]"
          >
            <MessageCircle className="w-4 h-4 fill-slate-950 stroke-none" />
            <span>Join WhatsApp Group Directly</span>
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
          🔒 Official club community link. Room IDs & passwords for tournaments are posted here before each match.
        </p>
      </div>
    </Modal>
  );
};

export default WhatsAppModal;
