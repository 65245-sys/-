import React, { useRef, useEffect } from 'react';
import { getWeekDays, isSameDay } from '../utils/dateUtils';

interface Props {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  completedDates: string[]; // array of YYYY-MM-DD
}

const Timeline: React.FC<Props> = ({ selectedDate, onSelectDate, completedDates }) => {
  const weekDays = getWeekDays(selectedDate);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to selected date if needed (simplified for now)
  useEffect(() => {
    if (scrollRef.current) {
        // logic to center could go here
    }
  }, [selectedDate]);

  return (
    <div className="w-full overflow-x-auto no-scrollbar py-4" ref={scrollRef}>
      {/* Container to align with main content on large screens, but allow scroll overflow on small */}
      <div className="px-4 sm:px-6 w-max mx-auto md:w-full md:mx-0"> 
          <div className="flex space-x-3 min-w-max md:justify-center">
            {weekDays.map((date) => {
            const isSelected = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, new Date());
            const dateStr = date.toLocaleDateString('en-CA'); // YYYY-MM-DD local
            const isCompleted = completedDates.includes(dateStr);
            
            return (
                <button
                key={date.toISOString()}
                onClick={() => onSelectDate(date)}
                className={`
                    flex flex-col items-center justify-center min-w-[64px] h-[84px] rounded-2xl transition-all duration-300
                    ${isSelected 
                    ? 'bg-gradient-to-br from-rose-400 to-pink-500 text-white shadow-lg shadow-rose-200 scale-105' 
                    : 'bg-white text-gray-500 border border-transparent hover:border-rose-100'}
                `}
                >
                <span className="text-xs font-medium opacity-80 mb-1">
                    {date.toLocaleDateString('zh-TW', { weekday: 'short' })}
                </span>
                <span className={`text-xl font-bold ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                    {date.getDate()}
                </span>
                
                {/* Indicators */}
                <div className="flex gap-1 mt-1 h-1.5">
                    {isCompleted && (
                    <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-green-400'}`} />
                    )}
                    {isToday && !isSelected && (
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    )}
                </div>
                </button>
            );
            })}
        </div>
      </div>
    </div>
  );
};

export default Timeline;