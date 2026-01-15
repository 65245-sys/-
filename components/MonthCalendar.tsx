import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { getMonthGrid, isSameDay, formatDateKey } from '../utils/dateUtils';
import { DailyLogsMap } from '../types';

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
  const month = viewDate.getMonth();
  const days = getMonthGrid(year, month);

  const prevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleSelect = (date: Date) => {
    onSelectDate(date);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-rose-900/20 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-[scaleUp_0.2s_ease-out]">
        
        {/* Header */}
        <div className="p-5 flex justify-between items-center bg-white border-b border-gray-50">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <ChevronLeft size={20} />
          </button>
          <h3 className="text-lg font-bold text-gray-800">
            {year}年 {month + 1}月
          </h3>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <ChevronRight size={20} />
          </button>
          <button onClick={onClose} className="absolute right-4 top-5 text-gray-300 hover:text-gray-500">
            <X size={20} />
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 px-4 pt-4 pb-2 text-center">
          {['一', '二', '三', '四', '五', '六', '日'].map(d => (
            <span key={d} className="text-xs text-gray-400 font-medium">{d}</span>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 px-4 pb-6">
          {days.map((date, idx) => {
            if (!date) return <div key={idx} />;
            
            const dateStr = formatDateKey(date);
            const isCompleted = logs[dateStr]?.completed;
            const isSelected = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, new Date());

            return (
              <button
                key={dateStr}
                onClick={() => handleSelect(date)}
                className={`
                  relative h-10 w-full rounded-full flex items-center justify-center text-sm font-medium transition-all
                  ${isSelected ? 'bg-rose-500 text-white shadow-md' : 'text-gray-700 hover:bg-gray-50'}
                  ${isToday && !isSelected ? 'text-rose-500 font-bold border border-rose-200' : ''}
                `}
              >
                {date.getDate()}
                {/* Status Dot */}
                {isCompleted && (
                  <div className={`absolute bottom-1 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-green-400'}`} />
                )}
              </button>
            );
          })}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-xs text-gray-400 flex justify-between">
           <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-400"/> 已完成</div>
           <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full border border-rose-400"/> 今日</div>
        </div>

      </div>
    </div>
  );
};

export default MonthCalendar;