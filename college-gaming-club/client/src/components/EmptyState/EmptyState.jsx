import React from 'react';
import { Gamepad2 } from 'lucide-react';

const EmptyState = ({
  icon: Icon = Gamepad2,
  title = 'No items found',
  description = 'There are no active records in this section right now.',
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 max-w-lg mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center text-slate-500 mb-4 border border-slate-700/50">
        <Icon className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2 font-mono">{title}</h3>
      <p className="text-sm text-slate-400 mb-6 leading-relaxed max-w-sm">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
