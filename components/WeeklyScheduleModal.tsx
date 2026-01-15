import React, { useState, useEffect } from 'react';
import { X, Zap, Calendar, Save, RotateCcw } from 'lucide-react';
import { DayRoutine } from '../types';
import { ALL_MACHINE_MODES, getDayLabel, DEFAULT_WEEKLY_SCHEDULE } from '../utils/routineLogic';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  schedule: Record<number, DayRoutine>;
  onSave: (newSchedule: Record<number, DayRoutine>) => void;
}

const WeeklyScheduleModal: React.FC<Props> = ({ isOpen, onClose, schedule, onSave }) => {
  const [localSchedule, setLocalSchedule] = useState<Record<number, DayRoutine>>(schedule);
  const [activeDay, setActiveDay] = useState<number>(1); // Start with Mon

  useEffect(() => {
    if (isOpen) {
      setLocalSchedule(JSON.parse(JSON.stringify(schedule)));
    }
  }, [isOpen, schedule]);

  if (!isOpen) return null;

  const handleUpdateDay = (field: keyof DayRoutine, value: any) => {
    setLocalSchedule(prev => ({
      ...prev,
      [activeDay]: {
        ...prev[activeDay],
        [field]: value
      }
    }));
  };

  const toggleModeForActiveDay = (modeId: string) => {
    const currentModes = localSchedule[activeDay].machineModes;
    const exists = currentModes.find(m => m.id === modeId);
    
    let newModes;
    if (exists) {
      newModes = currentModes.filter(m => m.id !== modeId);
    } else {
      const modeToAdd = ALL_MACHINE_MODES.find(m => m.id === modeId);
      if (modeToAdd) {
        newModes = [...currentModes, modeToAdd];
      } else {
        newModes = currentModes;
      }
    }

    handleUpdateDay('machineModes', newModes);
    // If modes exist, it's not a rest day automatically (unless user wants it to be)
    // But usually modes imply work. 
    if (newModes.length > 0) {
        handleUpdateDay('isRestDay', false);
    }
  };

  const handleResetDefault = () => {
    // Directly reset to defaults without blocking confirm to ensure UI responsiveness
    setLocalSchedule(JSON.parse(JSON.stringify(DEFAULT_WEEKLY_SCHEDULE)));
    // Optional: Visual feedback
    alert("已載入系統預設值！\n請記得點擊右下角「儲存設定」以套用變更。");
  };

  const currentDayData = localSchedule[activeDay];

  // Safeguard in case currentDayData is undefined (e.g. key mismatch during render)
  if (!currentDayData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-rose-950/20 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-[scaleUp_0.2s_ease-out] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-rose-50 to-white border-b border-rose-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-rose-100 p-2 rounded-lg text-rose-500">
               <Calendar size={20} />
            </div>
            <div>
               <h3 className="text-lg font-bold text-gray-800">編輯每週療程安排</h3>
               <p className="text-xs text-rose-400">設定固定的一週保養行程</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            
            {/* Sidebar: Days */}
            <div className="w-full md:w-24 bg-gray-50 flex md:flex-col overflow-x-auto md:overflow-y-auto shrink-0 border-b md:border-b-0 md:border-r border-gray-100 p-2 gap-2">
                {[1, 2, 3, 4, 5, 6, 0].map(dayIdx => (
                    <button
                        key={dayIdx}
                        type="button"
                        onClick={() => setActiveDay(dayIdx)}
                        className={`
                            flex-1 md:flex-none p-3 rounded-xl text-center text-sm font-bold transition-all
                            ${activeDay === dayIdx 
                                ? 'bg-white text-rose-500 shadow-md ring-1 ring-rose-100' 
                                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}
                        `}
                    >
                        週{getDayLabel(dayIdx)}
                    </button>
                ))}
            </div>

            {/* Editor Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-white">
                
                {/* 1. Theme Input */}
                <div className="mb-5">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">今日主題 (Theme)</label>
                    <input 
                        type="text" 
                        value={currentDayData.theme}
                        onChange={(e) => handleUpdateDay('theme', e.target.value)}
                        className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-gray-800 focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-50"
                        placeholder="例如：毛孔清潔日"
                    />
                </div>

                {/* 2. Description Input */}
                <div className="mb-6">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">描述與備註</label>
                    <textarea 
                        value={currentDayData.description}
                        onChange={(e) => handleUpdateDay('description', e.target.value)}
                        className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-600 h-24 resize-none focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-50 leading-relaxed"
                        placeholder="例如：務必在乾臉狀態使用..."
                    />
                </div>

                {/* 3. Rest Day Toggle */}
                <div className="mb-6 flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-sm font-bold text-gray-700">是否為肌膚休息日？</span>
                    <button 
                        type="button"
                        onClick={() => handleUpdateDay('isRestDay', !currentDayData.isRestDay)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${currentDayData.isRestDay ? 'bg-green-400' : 'bg-gray-300'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${currentDayData.isRestDay ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>

                {/* 4. Machine Modes */}
                <div className="mb-4">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                        <Zap size={14} /> 美容儀模式設定
                    </label>
                    <div className="space-y-2">
                        {ALL_MACHINE_MODES.map(mode => {
                            const isSelected = currentDayData.machineModes.some(m => m.id === mode.id);
                            return (
                                <button
                                    key={mode.id}
                                    type="button"
                                    onClick={() => toggleModeForActiveDay(mode.id)}
                                    className={`
                                        w-full flex items-center p-3 rounded-xl border transition-all text-left
                                        ${isSelected ? 'bg-rose-50 border-rose-300 shadow-sm' : 'bg-white border-gray-100 opacity-70 hover:opacity-100'}
                                    `}
                                >
                                    <div className={`w-4 h-4 rounded-full mr-3 ${mode.color} ${isSelected ? 'opacity-100' : 'opacity-30'}`} />
                                    <span className={`text-sm font-bold ${isSelected ? 'text-gray-900' : 'text-gray-500'}`}>{mode.name}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>

            </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 bg-gray-50 flex gap-3">
             <button 
                type="button"
                onClick={handleResetDefault}
                className="px-4 py-3 bg-white border border-gray-200 text-gray-500 rounded-xl font-bold text-sm hover:bg-gray-100 transition-colors flex items-center gap-2"
                title="重置為系統預設"
             >
                <RotateCcw size={18} /> 重置預設
             </button>
             <button 
                type="button"
                onClick={() => onSave(localSchedule)}
                className="flex-1 py-3 bg-rose-500 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-rose-600 transition-all flex items-center justify-center gap-2"
             >
                <Save size={18} /> 儲存設定
             </button>
        </div>

      </div>
    </div>
  );
};

export default WeeklyScheduleModal;