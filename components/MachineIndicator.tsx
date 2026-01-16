import React from 'react';
import { MachineMode } from '../types';

interface Props {
  modes: MachineMode[];
}

const MachineIndicator: React.FC<Props> = ({ modes }) => {
  if (modes.length === 0) {
    return (
      <div className="p-5 bg-gray-50/50 rounded-2xl border border-gray-100 flex items-center justify-center text-gray-400 text-sm italic font-serif">
        <span>✨ Rest Day for your skin</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {modes.map((mode) => (
        <div key={mode.name} className="flex items-start p-3 bg-white/60 rounded-2xl shadow-sm border border-white hover:border-rose-100 transition-colors">
          <div className={`w-10 h-10 rounded-full ${mode.color} flex items-center justify-center shadow-lg shadow-gray-200/50 mr-4 shrink-0 mt-1 relative overflow-hidden`}>
             {/* Shine effect */}
             <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/40 to-transparent"></div>
             <div className="w-2 h-2 bg-white rounded-full opacity-80 blur-[1px] shadow-[0_0_10px_rgba(255,255,255,0.8)] animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-gray-800 text-base font-serif tracking-wide">{mode.name}</h4>
            <p className="text-sm text-gray-500 break-words leading-relaxed font-light">{mode.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MachineIndicator;