import React, { useState, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { DailyLogsMap } from '../types';

// ----------------------------------------------------
// ⚠️ 獨立日期邏輯：確保此元件不依賴任何外部檔案，避免部署失敗
// ----------------------------------------------------
const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
const formatDateKey = (year: number, month: number, day: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
};
const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
};
const MONTH_NAMES = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
const WEEK_DAYS = ['日', '一', '二', '三', '四', '五', '六'];
// ----------------------------------------------------

interface Props {
  isOpen: boolean;
  onClose: () => void;
  logs: DailyLogsMap;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

const MonthCalendar: React.FC<Props> = ({ isOpen, onClose, logs, selectedDate, onSelectDate }) => {
  const [viewDate, setViewDate] = useState(new Date(selectedDate));

  if (!isOpen) return null;

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth(); // 0-11

  const handlePrevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const handleDayClick = (date: Date) => {
      onSelectDate(date);
      onClose();
  };

  const calendarDays = useMemo(() => {
      const daysInMonth = getDaysInMonth(year, month);
      const firstDayOfWeek = getFirstDayOfMonth(year, month);
      
      const days = [];
      for (let i = 0; i < firstDayOfWeek; i++) {
          days.push(null);
      }
      for (let i = 1; i <= daysInMonth; i++) {
          days.push(new Date(year, month, i));
      }
      return days;
  }, [year, month]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-rose-950/20 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-[scaleUp_0.2s_ease-out]">
        
        <div className="p-5 flex justify-between items-center bg-gradient-to-r from-rose-50/50 to-white border-b border-rose-50">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-full text-gray-400 transition-all">
                <ChevronLeft size={20} />
            </button>
            <h3 className="text-lg font-bold text-gray-800 font-serif tracking-wide">
                {year} <span className="text-rose-400">.</span> {month + 1}
            </h3>
            <button onClick={handleNextMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-full text-gray-400 transition-all">
                <ChevronRight size={20} />
            </button>
            <button onClick={onClose} className="absolute right-4 top-5 text-gray-300 hover:text-gray-500">
                <X size={20} />
            </button>
        </div>

        <div className="grid grid-cols-7 gap-1 px-4 pt-4 pb-2 text-center">
            {WEEK_DAYS.map(d => (
                <span key={d} className="text-xs text-gray-400 font-bold">{d}</span>
            ))}
        </div>

        <div className="grid grid-cols-7 gap-2 px-4 pb-6">
            {calendarDays.map((date, index) => {
                if (!date) return <div key={`empty-${index}`} />;

                const dateStr = formatDateKey(date.getFullYear(), date.getMonth(), date.getDate());
                const isToday = isSameDay(date, new Date());
                const isSelected = isSameDay(date, selectedDate);
                const isCompleted = logs[dateStr]?.completed;

                return (
                    <button
                        key={dateStr}
                        onClick={() => handleDayClick(date)}
                        className={`
                            relative h-10 w-full rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300
                            ${isSelected 
                                ? 'bg-rose-500 text-white shadow-lg shadow-rose-200 scale-105 z-10' 
                                : 'text-gray-700 hover:bg-rose-50'}
                            ${!isSelected && isToday ? 'ring-2 ring-rose-400 bg-rose-50 text-rose-600 font-bold' : ''}
                        `}
                    >
                        {date.getDate()}
                        {isCompleted && (
                            <div className={`
                                absolute bottom-1 w-1.5 h-1.5 rounded-full shadow-sm
                                ${isSelected ? 'bg-white' : 'bg-green-500 ring-1 ring-white'}
                            `} />
                        )}
                    </button>
                );
            })}
        </div>

        <div className="p-4 bg-gray-50/50 border-t border-gray-100 text-center">
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
