import React from 'react';

const Loading = ({ message = 'Loading arena data...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 space-y-4">
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 animate-ping" />
        <div className="w-full h-full rounded-full border-4 border-cyan-500/30 border-t-cyan-400 animate-spin" />
      </div>
      <p className="text-sm font-semibold text-slate-400 font-mono tracking-wider animate-pulse">
        {message}
      </p>
    </div>
  );
};

export default Loading;
