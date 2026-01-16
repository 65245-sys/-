import React, { useRef, useEffect, useState } from 'react';
import { getTimelineDates, isSameDay } from '../utils/dateUtils';
import { Check } from 'lucide-react';

interface Props {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  completedDates: string[]; // array of YYYY-MM-DD
}

const Timeline: React.FC<Props> = ({ selectedDate, onSelectDate, completedDates }) => {
  const [dates, setDates] = useState<Date[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  useEffect(() => {
    // Generate dates based on selectedDate to ensure it's in the middle/available
    setDates(getTimelineDates(selectedDate));
  }, [selectedDate]);

  // Auto-scroll to selected date on mount or change
  useEffect(() => {
    const key = selectedDate.toISOString();
    const element = itemRefs.current.get(key);
    if (element && scrollRef.current) {
        // Center the element
        element.scrollIntoView({
            behavior: 'smooth',
            inline: 'center',
            block: 'nearest'
        });
    }
  }, [dates, selectedDate]);

  return (
    <div className="w-full relative group">
      {/* Gradient Fade Masks for scroll indication */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white/80 to-transparent z-10 pointer-events-none" />

      <div className="w-full overflow-x-auto no-scrollbar py-4 px-4" ref={scrollRef}>
          <div className="flex space-x-3 min-w-max">
            {dates.map((date) => {
            const isSelected = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, new Date());
            const dateStr = date.toLocaleDateString('en-CA'); // YYYY-MM-DD local
            const isCompleted = completedDates.includes(dateStr);
            const key = date.toISOString();
            
            return (
                <button
                key={key}
                ref={(el) => {
                    if (el) itemRefs.current.set(key, el);
                    else itemRefs.current.delete(key);
                }}
                onClick={() => onSelectDate(date)}
                className={`
                    flex flex-col items-center justify-center w-[60px] h-[72px] rounded-[20px] transition-all duration-300 relative shrink-0
                    ${isSelected 
                    ? 'bg-gradient-to-br from-rose-400 to-rose-600 text-white shadow-xl shadow-rose-300/50 scale-110 ring-2 ring-white z-10' 
                    : isToday
                        ? 'bg-white border-2 border-rose-300 shadow-md ring-2 ring-rose-50'
                        : 'bg-white/70 backdrop-blur-sm text-gray-400 border border-white shadow-sm hover:bg-white hover:shadow-md'
                    }
                `}
                >
                {/* Weekday */}
                <span className={`text-[10px] font-bold uppercase mb-0.5 tracking-wide ${isSelected ? 'opacity-90' : isToday ? 'text-rose-500' : 'opacity-50'}`}>
                    {date.toLocaleDateString('zh-TW', { weekday: 'short' })}
                </span>
                
                {/* Day Number */}
                <span className={`text-2xl font-serif font-bold leading-none ${isSelected ? 'text-white' : isToday ? 'text-rose-600' : 'text-gray-600'}`}>
                    {date.getDate()}
                </span>
                
                {/* Today Label (if not selected) */}
                {!isSelected && isToday && (
                     <span className="text-[9px] font-bold text-rose-500 mt-1 scale-90">
                        今日
                     </span>
                )}
                
                {/* Completed Indicator - Big Checkmark Badge */}
                {isCompleted && (
                    <div className={`
                        absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center shadow-sm border-2 border-white
                        ${isSelected ? 'bg-white text-rose-500' : 'bg-green-400 text-white'}
                    `}>
                        <Check size={14} strokeWidth={4} />
                    </div>
                )}
                </button>
            );
            })}
        </div>
      </div>
    </div>
  );
};

export default Timeline;