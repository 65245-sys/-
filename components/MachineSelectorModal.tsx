
import React, { useState } from 'react';
import { X, Zap, RotateCcw } from 'lucide-react';
import { ALL_MACHINE_MODES, getRoutineForDay } from '../utils/routineLogic';
import { MachineMode } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  currentModes: MachineMode[];
  defaultModes: MachineMode[];
  skinConditions: string[];
  onSave: (modes: MachineMode[]) => void;
}

const MachineSelectorModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  selectedDate,
  currentModes,
  defaultModes,
  onSave 
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    currentModes.map(m => m.id)
  );

  // Sync state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedIds(currentModes.map(m => m.id));
    }
  }, [isOpen, currentModes]);

  if (!isOpen) return null;

  const toggleMode = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(m => m !== id) 
        : [...prev, id]
    );
  };

  const handleReset = () => {
    // Reset to the default weekly schedule modes for this day
    const defaults = defaultModes.map(m => m.id);
    
    // Check if visually nothing will change (already default)
    // to give feedback to the user
    const isAlreadyDefault = 
        selectedIds.length === defaults.length && 
        selectedIds.every(id => defaults.includes(id));

    if (isAlreadyDefault) {
        alert("目前選擇已經是系統預設行程囉！");
        return;
    }

    setSelectedIds(defaults);
  };

  const handleSave = () => {
    const modes = ALL_MACHINE_MODES.filter(m => selectedIds.includes(m.id));
    onSave(modes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-[scaleUp_0.2s_ease-out]">
        
        <div className="bg-gradient-to-r from-rose-50 to-white p-5 flex justify-between items-center border-b border-rose-100">
          <div className="flex items-center gap-2">
             <Zap size={20} className="text-rose-500" />
             <h3 className="text-lg font-bold text-gray-800">今日調整美容儀</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
           <p className="text-sm text-gray-500 mb-4">
               此調整僅影響<b>今日 ({selectedDate.toLocaleDateString()})</b> 的紀錄。如需修改每週固定行程，請至首頁「編輯療程安排」。
           </p>

           {/* Modes List */}
           <div className="space-y-3 mb-6">
              {ALL_MACHINE_MODES.map(mode => {
                  const isSelected = selectedIds.includes(mode.id);
                  return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => toggleMode(mode.id)}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3
                            ${isSelected ? 'bg-rose-50 border-rose-300 shadow-sm' : 'bg-white border-gray-100 hover:border-gray-200'}
                        `}
                      >
                          <div className={`w-5 h-5 rounded-full mt-0.5 shrink-0 ${mode.color} ${isSelected ? 'opacity-100' : 'opacity-40'}`} />
                          <div>
                              <div className={`text-sm font-bold ${isSelected ? 'text-gray-900' : 'text-gray-500'}`}>{mode.name}</div>
                              <div className="text-xs text-gray-400">{mode.description}</div>
                          </div>
                      </button>
                  )
              })}
           </div>

           {/* Actions */}
           <div className="flex gap-2 mb-4">
               <button 
                  type="button"
                  onClick={handleReset}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200 flex items-center justify-center gap-2"
               >
                   <RotateCcw size={16} /> 重置為預設行程
               </button>
           </div>

           <button 
              type="button"
              onClick={handleSave}
              className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-bold text-base shadow-lg hover:bg-black active:scale-95 transition-all"
           >
               確認今日設定
           </button>
        </div>

      </div>
    </div>
  );
};

export default MachineSelectorModal;
