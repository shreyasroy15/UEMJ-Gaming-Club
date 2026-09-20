import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, FileText, Send, Check } from 'lucide-react';

const REJECTION_PRESETS = [
  {
    id: 'single_pdf',
    label: 'Single PDF Required (Merged Roster Proofs)',
    text: 'You need to upload all player/team ID proofs merged into a single PDF. Please combine all member college ID cards into one document and re-upload.',
  },
  {
    id: 'blurry',
    label: 'Blurry / Unreadable Document',
    text: 'The uploaded document is blurry, low resolution, or unreadable. Please upload clear, legible scans of college ID cards.',
  },
  {
    id: 'missing_members',
    label: 'Incomplete Squad Proofs',
    text: 'Only partial member proofs were uploaded. All starters and substitute players must have their college ID proof included.',
  },
  {
    id: 'expired_id',
    label: 'Invalid or Expired ID Proof',
    text: 'One or more submitted college ID proofs are expired or do not match the registered player names/details.',
  },
  {
    id: 'custom',
    label: 'Custom Reason...',
    text: '',
  },
];

const RejectionModal = ({
  isOpen,
  onClose,
  onConfirm,
  teamName = 'Team',
  title = 'Reject Verification',
  submitting = false,
}) => {
  const [selectedPreset, setSelectedPreset] = useState(REJECTION_PRESETS[0].id);
  const [reasonText, setReasonText] = useState(REJECTION_PRESETS[0].text);

  useEffect(() => {
    if (isOpen) {
      setSelectedPreset(REJECTION_PRESETS[0].id);
      setReasonText(REJECTION_PRESETS[0].text);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePresetChange = (presetId) => {
    setSelectedPreset(presetId);
    const found = REJECTION_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setReasonText(found.text);
    }
  };

  const handleConfirm = (e) => {
    e.preventDefault();
    const finalReason = reasonText.trim() || REJECTION_PRESETS[0].text;
    onConfirm(finalReason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-[#090e1f] border border-rose-500/40 shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_30px_rgba(244,63,94,0.15)] p-5 sm:p-6 space-y-4">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white font-mono uppercase">
                {title}
              </h3>
              <p className="text-xs text-rose-300/80 font-mono">
                Squad: <strong className="text-white">{teamName}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleConfirm} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block">
              Select Preset Rejection Cause:
            </label>
            <select
              value={selectedPreset}
              onChange={(e) => handlePresetChange(e.target.value)}
              disabled={submitting}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-medium text-white focus:outline-none focus:border-rose-500 transition-colors"
            >
              {REJECTION_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                Rejection Message sent to Squad:
              </label>
              <span className="text-[10px] text-slate-500 font-mono">Editable</span>
            </div>
            <textarea
              rows={4}
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              placeholder="Explain why the documents were rejected and what the squad needs to fix..."
              disabled={submitting}
              className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors leading-relaxed resize-none"
              required
            />
          </div>

          {/* Info Notice */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 leading-relaxed font-mono flex items-start gap-2">
            <Send className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              This reason will immediately trigger a high-priority notification to the captain and roster players with a 1-click link to re-upload their single merged PDF.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-bold font-mono text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !reasonText.trim()}
              className="px-4 py-2 rounded-xl text-xs font-black font-mono uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 disabled:opacity-50 flex items-center gap-1.5 transition cursor-pointer"
            >
              {submitting ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RejectionModal;
