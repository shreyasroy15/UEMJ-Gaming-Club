import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { X } from 'lucide-react';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'max-w-xl',
  bodyClassName,
  theme,
  containerClassName = '',
}) => {
  let location;
  try {
    location = useLocation();
  } catch (e) {
    location = { pathname: '' };
  }

  const isDark = theme ? theme === 'dark' : !location?.pathname?.startsWith('/admin');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full ${maxWidth} ${
          isDark
            ? 'bg-[#090d18]/95 backdrop-blur-2xl border border-cyan-500/30 rounded-2xl sm:rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.95),0_0_35px_rgba(6,182,212,0.22)] text-slate-100'
            : 'bg-white border border-slate-200 rounded-2xl shadow-2xl text-slate-800'
        } overflow-hidden flex flex-col max-h-[min(86vh,650px)] animate-in zoom-in-95 duration-200 relative ${containerClassName}`}
      >
        {/* Subtle top ambient glow for dark theme */}
        {isDark && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-cyan-500/10 blur-2xl pointer-events-none rounded-full" />
        )}

        {/* Modal Header */}
        <div
          className={`flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b shrink-0 relative z-10 ${
            isDark
              ? 'border-cyan-500/20 bg-slate-950/80'
              : 'border-slate-100 bg-slate-50/90'
          }`}
        >
          <h3
            className={`font-black text-base sm:text-lg font-mono truncate pr-2 ${
              isDark ? 'text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]' : 'text-slate-900'
            }`}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            className={`p-1.5 sm:p-2 rounded-xl transition-all shrink-0 cursor-pointer ${
              isDark
                ? 'text-slate-400 hover:text-white bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/40 hover:scale-105 active:scale-95'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Modal Body with smooth custom gaming scrollbar */}
        <div
          className={`flex-1 min-h-0 overflow-y-auto ${
            isDark ? 'gaming-scrollbar' : 'admin-scrollbar'
          } relative z-10 ${bodyClassName || 'p-4 sm:p-6 space-y-4'}`}
        >
          {children}
        </div>

        {/* Optional Sticky / Pinned Footer */}
        {footer && (
          <div
            className={`shrink-0 border-t relative z-10 ${
              isDark
                ? 'border-cyan-500/20 bg-slate-950/95 backdrop-blur-md px-4 sm:px-6 py-3 sm:py-3.5'
                : 'border-slate-100 bg-slate-50/95 backdrop-blur-md px-4 sm:px-6 py-3'
            }`}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default Modal;
