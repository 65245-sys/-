import React, { useRef, useLayoutEffect } from 'react';
import { format, addDays, startOfToday, isSameDay, subDays } from 'date-fns';
import { zhTW } from 'date-fns/locale';

interface Props {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  completedDates: string[]; // array of YYYY-MM-DD
}

const Timeline: React.FC<Props> = ({ selectedDate, onSelectDate, completedDates }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // 1. 大幅擴充日期範圍：產生前後各 180 天 (共約 360 天)
  // 這樣使用者感覺就像可以「無限」左右滑動，但不會有載入延遲
  const today = startOfToday();
  const range = 180; // 前後範圍
  const dates = Array.from({ length: range * 2 + 1 }, (_, i) => addDays(subDays(today, range), i));

  // 2. 自動捲動邏輯
  useLayoutEffect(() => {
    if (scrollContainerRef.current) {
      // 找到目前選中的日期 (或是今天)
      const activeElement = scrollContainerRef.current.querySelector('[data-active="true"]') as HTMLElement;
      
      if (activeElement) {
        const container = scrollContainerRef.current;
        // 計算置中位置：讓選中的項目出現在畫面正中央
        const scrollLeft = activeElement.offsetLeft - container.offsetWidth / 2 + activeElement.offsetWidth / 2;
        
        container.scrollTo({
          left: scrollLeft,
          behavior: 'smooth' // 平滑捲動
        });
      }
    }
  }, []); // 只在初始化時執行一次

  return (
    <div className="w-full relative my-2">
      {/* 移除左右遮罩與過大的 Padding，讓視覺延伸到邊緣 */}
      
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto no-scrollbar gap-3 px-5 py-4 scroll-smooth snap-x snap-mandatory"
        style={{
          // 讓 iOS 慣性滑動更流暢
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {dates.map((date) => {
          const isSelected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, today);
          const dateKey = format(date, 'yyyy-MM-dd');
          const isCompleted = completedDates.includes(dateKey);

          return (
            <div
              key={date.toISOString()}
              data-active={isSelected ? "true" : "false"}
              onClick={() => onSelectDate(date)}
              className={`
                relative flex-shrink-0 flex flex-col items-center justify-center 
                w-[64px] h-[84px] rounded-[24px] cursor-pointer transition-all duration-300 snap-center select-none
                ${isSelected 
                  ? 'bg-gradient-to-b from-rose-400 to-rose-600 text-white shadow-xl shadow-rose-200 scale-110 z-10' 
                  : 'bg-white text-gray-400 border border-white shadow-sm hover:border-rose-100'
                }
              `}
            >
              {/* 顯示月份 */}
              <span className={`text-[10px] font-medium mb-0.5 leading-tight ${isSelected ? 'text-rose-100' : 'text-gray-400'}`}>
                 {format(date, 'M月', { locale: zhTW })}
              </span>

              {/* 顯示星期 */}
              <span className={`text-[11px] font-bold tracking-wider mb-0.5 ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                {format(date, 'EE', { locale: zhTW })}
              </span>
              
              {/* 顯示日期 */}
              <span className={`text-2xl font-serif font-bold leading-none ${isSelected ? 'text-white' : 'text-gray-600'}`}>
                {format(date, 'd')}
              </span>

              {/* 完成標記 (小圓點) */}
              {isCompleted && !isSelected && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white shadow-sm"></div>
              )}
              
              {/* 今日標記 */}
              {isToday && !isSelected && (
                 <span className="absolute bottom-1.5 text-[9px] font-bold text-rose-400">Today</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Timeline;
