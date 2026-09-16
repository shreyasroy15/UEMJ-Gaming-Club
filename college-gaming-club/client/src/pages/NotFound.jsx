import React from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, ArrowLeft, Skull } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-[75vh] flex items-center justify-center py-16 px-4 text-center">
      <div className="max-w-md w-full space-y-6 p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
        <div className="w-16 h-16 rounded-2xl bg-rose-950/50 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
          <Skull className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-4xl sm:text-5xl font-black text-white font-mono tracking-wider">
            404
          </span>
          <h2 className="text-xl font-bold text-white font-mono">MISSION OUT OF BOUNDS</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            The arena coordinator could not find the page or tournament you were looking for.
          </p>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold uppercase tracking-wider transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Home Arena
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
