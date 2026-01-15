import React from 'react';
import { SKIN_CONDITIONS } from '../utils/routineLogic';
import { User } from 'lucide-react';

interface Props {
  selected: string[];
  onChange: (selected: string[]) => void;
}

const SkinConditionSelector: React.FC<Props> = ({ selected, onChange }) => {
  
  const toggleCondition = (condition: string) => {
    if (selected.includes(condition)) {
      onChange(selected.filter(c => c !== condition));
    } else {
      onChange([...selected, condition]);
    }
  };

  return (
    <div className="space-y-3 mb-4">
      <div className="flex items-center gap-2 text-gray-700 font-bold text-sm">
        <User size={16} className="text-rose-400" />
        <span>今日膚況 (可多選)</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {SKIN_CONDITIONS.map((cond) => {
          const isActive = selected.includes(cond);
          return (
            <button
              key={cond}
              onClick={() => toggleCondition(cond)}
              className={`
                px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200
                ${isActive 
                  ? 'bg-rose-400 text-white shadow-md scale-105' 
                  : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}
              `}
            >
              {cond}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SkinConditionSelector;