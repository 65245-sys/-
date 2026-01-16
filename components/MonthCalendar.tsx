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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-rose-950/20 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-[scaleUp_0.2s_ease-out]">
        
        {/* Header */}
        <div className="p-5 flex justify-between items-center bg-gradient-to-r from-rose-50/50 to-white border-b border-rose-50">
          <button onClick={prevMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-full text-gray-400 transition-all">
            <ChevronLeft size={20} />
          </button>
          <h3 className="text-lg font-bold text-gray-800 font-serif tracking-wide">
            {year} <span className="text-rose-400">.</span> {month + 1}
          </h3>
          <button onClick={nextMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-full text-gray-400 transition-all">
            <ChevronRight size={20} />
          </button>
          <button onClick={onClose} className="absolute right-4 top-5 text-gray-300 hover:text-gray-500">
            <X size={20} />
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 px-4 pt-4 pb-2 text-center">
          {['一', '二', '三', '四', '五', '六', '日'].map(d => (
            <span key={d} className="text-xs text-gray-400 font-bold">{d}</span>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-2 px-4 pb-6">
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
                  relative h-10 w-full rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300
                  ${isSelected 
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-200 scale-105 z-10' 
                    : 'text-gray-700 hover:bg-rose-50'}
                  
                  ${/* Distinct Style for Today when not selected */''}
                  ${!isSelected && isToday ? 'ring-2 ring-rose-400 bg-rose-50 text-rose-600 font-bold' : ''}
                `}
              >
                {date.getDate()}
                
                {/* Completed Indicator - Larger, brighter dot */}
                {isCompleted && (
                  <div className={`
                    absolute bottom-1 w-1.5 h-1.5 rounded-full shadow-sm
                    ${isSelected ? 'bg-white' : 'bg-green-500 ring-1 ring-white'}
                  `} />
                )}

                {/* Today Indicator - Small top-right accent if needed, but ring is main indicator */}
                {isToday && !isSelected && (
                   <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 border-2 border-white"></span>
                    </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 text-xs text-gray-500 flex justify-between font-medium">
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-green-500 ring-1 ring-white shadow-sm"/> 
             已完成保養
           </div>
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-rose-500 border border-rose-200"/> 
             今日
           </div>
        </div>

      </div>
    </div>
  );
};

export default MonthCalendar;