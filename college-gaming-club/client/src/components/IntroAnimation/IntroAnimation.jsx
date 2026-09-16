import React, { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import introAnimationData from '../../assets/Password process animation.json';
import { Gamepad2, ArrowRight } from 'lucide-react';

const IntroAnimation = ({ onComplete }) => {
  const [fading, setFading] = useState(false);
  const [visible, setVisible] = useState(true);

  const handleFinish = () => {
    if (fading) return;
    setFading(true);
    setTimeout(() => {
      setVisible(false);
      if (onComplete) onComplete();
    }, 600);
  };

  useEffect(() => {
    // Auto-transition after 2.4 seconds if user doesn't skip
    const timer = setTimeout(() => {
      handleFinish();
    }, 2400);

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#05060a] transition-all duration-700 ease-out ${
        fading ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Background Cyber Ambient Glow */}
      <div className="absolute inset-0 bg-radial from-cyan-950/20 via-[#05060a]/90 to-[#05060a] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Lottie Container */}
      <div className="relative z-10 flex flex-col items-center max-w-sm px-6 text-center space-y-5">
        <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
          {/* Subtle Outer Cyber Glow Ring */}
          <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-pulse" />
          <div className="absolute -inset-2 rounded-full border border-indigo-500/15" />
          <Lottie
            animationData={introAnimationData}
            loop={false}
            onComplete={handleFinish}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Branding & Status */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-cyan-500/30 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest text-cyan-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <Gamepad2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>INITIALIZING ARENA</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-mono tracking-wider text-white">
            UEMJ <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">GAMING CLUB</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono tracking-wide">
            Varsity Esports • Season 2026
          </p>
        </div>

        {/* Loading Progress Bar */}
        <div className="w-48 h-1 bg-slate-800/80 rounded-full overflow-hidden relative">
          <div className="h-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-cyan-400 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Skip Button */}
      <button
        onClick={handleFinish}
        className="absolute bottom-8 right-8 z-20 px-4 py-2 rounded-full bg-slate-900/70 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/50 text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-300 hover:text-white transition-all flex items-center gap-1.5 backdrop-blur-md cursor-pointer"
      >
        <span>ENTER NOW</span>
        <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
      </button>
    </div>
  );
};

export default IntroAnimation;
