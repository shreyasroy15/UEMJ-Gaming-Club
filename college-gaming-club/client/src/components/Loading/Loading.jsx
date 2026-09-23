import React from 'react';

const Loading = ({
  message = 'Loading arena data...',
  size = 'md',
  compact = false,
  className = '',
}) => {
  const spinnerSize =
    size === 'lg' ? 'w-16 h-16' : size === 'sm' ? 'w-8 h-8' : 'w-14 h-14';

  return (
    <div
      className={`flex flex-col items-center justify-center px-4 space-y-4 ${
        compact ? 'py-8' : 'min-h-[65vh] sm:min-h-[72vh] py-16'
      } ${className}`}
    >
      <div className={`relative ${spinnerSize}`}>
        <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 animate-ping" />
        <div className="w-full h-full rounded-full border-4 border-cyan-500/30 border-t-cyan-400 animate-spin" />
      </div>
      <p className="text-sm font-semibold text-slate-400 font-mono tracking-wider animate-pulse text-center">
        {message}
      </p>
    </div>
  );
};

export default Loading;
