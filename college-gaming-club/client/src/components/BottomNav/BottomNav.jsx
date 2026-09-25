import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Trophy,
  BarChart3,
  Megaphone,
  MessageCircle,
  QrCode,
} from 'lucide-react';

const BottomNav = ({ onOpenWhatsApp, whatsappSettings }) => {
  const isEnabled = whatsappSettings?.isActive !== false;

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. MOBILE NATIVE BOTTOM NAVBAR DOCK (Fixed at bottom for mobile & tablet) */}
      {/* ========================================================================= */}
      <nav
        aria-label="Mobile Navigation Dock"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-2xl border-t border-cyan-500/25 px-2 py-1.5 flex items-center justify-around shadow-[0_-10px_35px_rgba(0,0,0,0.7)] select-none"
      >
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
              isActive
                ? 'text-cyan-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          <Home className="w-4 h-4" />
          <span className="text-[10px] font-mono tracking-tight">Home</span>
        </NavLink>

        <NavLink
          to="/tournaments"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
              isActive
                ? 'text-cyan-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          <Trophy className="w-4 h-4" />
          <span className="text-[10px] font-mono tracking-tight">Tourneys</span>
        </NavLink>

        <NavLink
          to="/points-table"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
              isActive
                ? 'text-cyan-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          <BarChart3 className="w-4 h-4" />
          <span className="text-[10px] font-mono tracking-tight">Scores</span>
        </NavLink>

        <NavLink
          to="/news"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
              isActive
                ? 'text-cyan-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          <Megaphone className="w-4 h-4" />
          <span className="text-[10px] font-mono tracking-tight">News</span>
        </NavLink>

        {/* WhatsApp Group & QR Code Option */}
        {isEnabled && (
          <button
            type="button"
            onClick={onOpenWhatsApp}
            className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all text-emerald-400 hover:text-emerald-300 active:scale-95 cursor-pointer relative group"
            title="Scan or Join WhatsApp Community"
          >
            <div className="relative">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.4)]">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20" />
              </div>
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <span className="text-[10px] font-mono font-bold tracking-tight text-emerald-400 flex items-center gap-0.5">
              <span>WhatsApp</span>
            </span>
          </button>
        )}
      </nav>

      {/* ========================================================================= */}
      {/* 2. DESKTOP FLOATING WHATSAPP PILL (Bottom-Right, non-intrusive) */}
      {/* ========================================================================= */}
      {isEnabled && (
        <aside
          aria-label="Community WhatsApp Quick Access"
          className="hidden md:flex fixed bottom-6 right-6 z-40"
        >
          <button
            type="button"
            onClick={onOpenWhatsApp}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-slate-950/90 hover:bg-slate-900 border border-emerald-500/40 hover:border-emerald-400/80 text-emerald-400 shadow-[0_4px_25px_rgba(0,0,0,0.6),0_0_20px_rgba(16,185,129,0.25)] hover:shadow-[0_4px_30px_rgba(0,0,0,0.7),0_0_30px_rgba(16,185,129,0.4)] backdrop-blur-xl transition-all duration-300 cursor-pointer group active:scale-95"
            title="Join WhatsApp Group & Scan QR"
          >
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageCircle className="w-4 h-4 text-emerald-400 fill-emerald-400/30" />
            </div>
            <div className="text-left font-mono">
              <span className="block text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                WhatsApp Group
              </span>
              <span className="block text-[10px] text-emerald-400/90 tracking-tight flex items-center gap-1">
                <QrCode className="w-2.5 h-2.5" /> Scan QR / Join
              </span>
            </div>
          </button>
        </aside>
      )}
    </>
  );
};

export default BottomNav;
