import React, { useState, useEffect } from 'react';
import { X, Save, Sun, Moon, Info } from 'lucide-react';
import { DayRoutine, MachineMode } from '../types';
import { ALL_MACHINE_MODES, THEME_PRESETS, getThemeType } from '../utils/routineLogic';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  schedule: Record<number, DayRoutine>;
  onSave: (schedule: Record<number, DayRoutine>) => void;
}

const WEEK_DAYS = [
    { id: 1, label: '週一', short: 'Mon' },
    { id: 2, label: '週二', short: 'Tue' },
    { id: 3, label: '週三', short: 'Wed' },
    { id: 4, label: '週四', short: 'Thu' },
    { id: 5, label: '週五', short: 'Fri' },
    { id: 6, label: '週六', short: 'Sat' },
    { id: 0, label: '週日', short: 'Sun' },
];

const WeeklyScheduleModal: React.FC<Props> = ({ isOpen, onClose, schedule, onSave }) => {
  const [localSchedule, setLocalSchedule] = useState<Record<number, DayRoutine>>(schedule);
  const [activeDay, setActiveDay] = useState<number>(1); // Default Monday

  useEffect(() => {
      if (isOpen) {
          setLocalSchedule(JSON.parse(JSON.stringify(schedule)));
      }
  }, [isOpen, schedule]);

  const handleThemeChange = (day: number, themeLabel: string) => {
      const preset = THEME_PRESETS.find(p => p.label === themeLabel);
      if (!preset) return;

      setLocalSchedule(prev => ({
          ...prev,
          [day]: {
              ...prev[day],
              theme: preset.theme,
              description: preset.description,
              machineModes: preset.defaultModes
                  .map(mid => ALL_MACHINE_MODES.find(m => m.id === mid))
                  .filter((m): m is MachineMode => !!m),
              isRestDay: preset.defaultModes.length === 0
          }
      }));
  };

  const handleSave = () => {
      onSave(localSchedule);
      onClose();
  };

  if (!isOpen) return null;

  const currentRoutine = localSchedule[activeDay];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-rose-950/20 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl h-[85vh] flex flex-col overflow-hidden animate-[scaleUp_0.2s_ease-out]">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
            <div>
                <h3 className="text-xl font-serif font-bold text-gray-800">每週護膚排程</h3>
                <p className="text-xs text-gray-400 mt-1">設定每一天的保養主題與儀器模式</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                <X size={24} />
            </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
            {/* Sidebar: Days */}
            <div className="w-24 bg-gray-50 border-r border-gray-100 flex flex-col overflow-y-auto">
                {WEEK_DAYS.map((day) => (
                    <button
                        key={day.id}
                        onClick={() => setActiveDay(day.id)}
                        className={`
                            p-4 text-center border-b border-gray-100 transition-all
                            ${activeDay === day.id 
                                ? 'bg-white border-l-4 border-l-rose-500 text-rose-600 font-bold shadow-sm' 
                                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 border-l-4 border-l-transparent'}
                        `}
                    >
                        <span className="block text-xs uppercase tracking-wider opacity-70">{day.short}</span>
                        <span className="block text-sm">{day.label}</span>
                    </button>
                ))}
            </div>

            {/* Content: Settings */}
            <div className="flex-1 p-6 overflow-y-auto">
                
                <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-700 mb-3">選擇保養主題</label>
                    <div className="grid gap-3">
                        {THEME_PRESETS.map((preset) => {
                            const isSelected = currentRoutine?.theme === preset.theme;
                            return (
                                <button
                                    key={preset.label}
                                    onClick={() => handleThemeChange(activeDay, preset.label)}
                                    className={`
                                        p-4 rounded-xl border text-left transition-all flex items-center justify-between group
                                        ${isSelected 
                                            ? 'border-rose-300 bg-rose-50 shadow-sm ring-1 ring-rose-200' 
                                            : 'border-gray-200 hover:border-rose-200 hover:bg-white'}
                                    `}
                                >
                                    <div>
                                        <span className={`font-bold block ${isSelected ? 'text-rose-700' : 'text-gray-700'}`}>
                                            {preset.label}
                                        </span>
                                        <span className={`text-xs block mt-1 ${isSelected ? 'text-rose-500' : 'text-gray-400'}`}>
                                            {preset.description}
                                        </span>
                                    </div>
                                    {isSelected && <div className="text-rose-500"><CheckIcon /></div>}
                                </button>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end shrink-0">
            <button
                onClick={handleSave}
                className="px-8 py-3 bg-rose-500 text-white rounded-xl font-bold shadow-lg shadow-rose-200 hover:bg-rose-600 active:scale-95 transition-all flex items-center gap-2"
            >
                <Save size={18} /> 儲存排程
            </button>
        </div>

      </div>
    </div>
  );
};

const CheckIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

export default WeeklyScheduleModal;
