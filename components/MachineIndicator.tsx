import React from 'react';
import { MachineMode } from '../types';

interface Props {
  modes: MachineMode[];
}

const MachineIndicator: React.FC<Props> = ({ modes }) => {
  if (modes.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center text-gray-500 text-sm">
        <span>✨ 今天是肌膚休息日，無需使用美容儀</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {modes.map((mode) => (
        <div key={mode.name} className="flex items-start p-3 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className={`w-10 h-10 rounded-full ${mode.color} flex items-center justify-center shadow-inner mr-4 shrink-0 animate-pulse mt-1`}>
            <div className="w-3 h-3 bg-white rounded-full opacity-50" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-gray-800 text-base">{mode.name}</h4>
            <p className="text-sm text-gray-500 break-words leading-relaxed">{mode.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MachineIndicator;