import React, { useState, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { DailyLogsMap } from '../types';

// --- 純 JS 日期工具 (本地定義) ---
const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

const formatDateKey = (year: number, month: number, day: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
};

const MONTH_NAMES = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
const WEEK_DAYS = ['日', '一', '二', '三', '四', '五', '六'];
// ------------------------------------

interface Props {
  isOpen: boolean;
  onClose: () => void;
  logs: DailyLogsMap;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

const MonthCalendar: React.FC<Props> = ({ isOpen, onClose, logs, selectedDate, onSelectDate }) => {
  // 記錄目前檢視的年份與月份
  const [viewDate, setViewDate] = useState(new Date(selectedDate));

  if (!isOpen) return null;

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth(); // 0-11

  // 切換月份
  const handlePrevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(year, month + 1, 1));

  // 產生月曆格子
  const calendarDays = useMemo(() => {
      const daysInMonth = getDaysInMonth(year, month);
      const firstDayOfWeek = getFirstDayOfMonth(year, month); // 0(Sun) - 6(Sat)
      
      const days = [];
      
      // 補前面的空白
      for (let i = 0; i < firstDayOfWeek; i++) {
          days.push(null);
      }
      
      // 填入日期
      for (let i = 1; i <= daysInMonth; i++) {
          days.push(new Date(year, month, i));
      }
      
      return days;
  }, [year, month]);

  const handleDayClick = (date: Date) => {
      onSelectDate(date);
      onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-rose-950/20 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-[scaleUp_0.2s_ease-out]">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
            <h3 className="text-xl font-serif font-bold text-rose-900">
                {year}年 {MONTH_NAMES[month]}
            </h3>
            <div className="flex gap-2">
                <button onClick={handlePrevMonth} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-rose-500 transition-colors">
                    <ChevronLeft size={20} />
                </button>
                <button onClick={handleNextMonth} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-rose-500 transition-colors">
                    <ChevronRight size={20} />
                </button>
                <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors ml-2">
                    <X size={20} />
                </button>
            </div>
        </div>

        {/* Body */}
        <div className="p-6">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 mb-4 text-center">
                {WEEK_DAYS.map((day, idx) => (
                    <div key={day} className={`text-xs font-bold ${idx === 0 || idx === 6 ? 'text-rose-400' : 'text-gray-400'}`}>
                        {day}
                    </div>
                ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-y-4 gap-x-2">
                {calendarDays.map((date, index) => {
                    if (!date) return <div key={`empty-${index}`} />;

                    const dateStr = formatDateKey(date.getFullYear(), date.getMonth(), date.getDate());
                    const isToday = new Date().toDateString() === date.toDateString();
                    const isSelected = selectedDate.toDateString() === date.toDateString();
                    const isCompleted = logs[dateStr]?.completed;

                    return (
                        <button
                            key={dateStr}
                            onClick={() => handleDayClick(date)}
                            className={`
                                relative h-10 rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all
                                ${isSelected 
                                    ? 'bg-rose-500 text-white shadow-md shadow-rose-200 scale-110 z-10' 
                                    : 'text-gray-700 hover:bg-gray-50'}
                                ${isToday && !isSelected ? 'text-rose-500 font-bold' : ''}
                            `}
                        >
                            <span>{date.getDate()}</span>
                            
                            {/* Dots Indicators */}
                            <div className="flex gap-0.5 mt-0.5 h-1.5">
                                {isCompleted && (
                                    <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-400'}`} />
                                )}
                                {isToday && !isSelected && !isCompleted && (
                                    <div className="w-1 h-1 rounded-full bg-rose-400" />
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
        
        <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
            <button
                onClick={() => { onSelectDate(new Date()); onClose(); }}
                className="text-sm font-bold text-rose-500 hover:text-rose-600 transition-colors"
            >
                回到今天
            </button>
        </div>

      </div>
    </div>
  );
};

export default MonthCalendar;
