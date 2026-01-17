import React, { useRef, useEffect, useMemo } from 'react';

// --- 1. 本地定義日期工具 (移除 date-fns 依賴，確保部署成功) ---
const getLocalYMD = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const isSameDate = (d1: Date, d2: Date) => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

const getStartOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// 格式化顯示 (中文)
const formatMonth = (date: Date) => `${date.getMonth() + 1}月`;
const formatWeekday = (date: Date) => {
  const days = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
  return days[date.getDay()];
};
// -------------------------------------------------------------

interface Props {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  completedDates: string[]; // array of YYYY-MM-DD
}

const Timeline: React.FC<Props> = ({ selectedDate, onSelectDate, completedDates }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // 2. 產生日期範圍：前後 180 天 (模擬無限捲動)
  const dates = useMemo(() => {
    const today = getStartOfToday();
    const range = 180;
    const result: Date[] = [];
    
    // 從 -180 天 到 +180 天
    for (let i = -range; i <= range; i++) {
      result.push(addDays(today, i));
    }
    return result;
  }, []);

  const today = useMemo(() => getStartOfToday(), []);

  // 3. 自動捲動邏輯 (修正版：加入延遲以確保 iOS 置中生效)
  useEffect(() => {
    // 加入 100ms 延遲，等待 iOS Safari 畫面渲染完成
    const timer = setTimeout(() => {
      if (scrollContainerRef.current) {
        // 找到目前 active 的日期元素
        const activeElement = scrollContainerRef.current.querySelector('[data-active="true"]');
        
        if (activeElement) {
          // 使用 scrollIntoView 自動置中，比手動算座標更精準且相容
          activeElement.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',   // 垂直不亂動
            inline: 'center'    // 水平置中 (關鍵)
          });
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []); // 空陣列表示只在剛開啟時執行一次

  return (
    <div className="w-full relative my-2">
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto no-scrollbar gap-3 px-5 py-4 scroll-smooth snap-x snap-mandatory"
        style={{
          WebkitOverflowScrolling: 'touch', // iOS 順暢滑動
        }}
      >
        {dates.map((date) => {
          const isSelected = isSameDate(date, selectedDate);
          const isDateToday = isSameDate(date, today);
          const dateKey = getLocalYMD(date);
          const isCompleted = completedDates.includes(dateKey);

          return (
            <div
              key={date.getTime()} // 使用時間戳記當 key
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
                 {formatMonth(date)}
              </span>

              {/* 顯示星期 */}
              <span className={`text-[11px] font-bold tracking-wider mb-0.5 ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                {formatWeekday(date)}
              </span>
              
              {/* 顯示日期 */}
              <span className={`text-2xl font-serif font-bold leading-none ${isSelected ? 'text-white' : 'text-gray-600'}`}>
                {date.getDate()}
              </span>

              {/* 完成標記 (小綠點) */}
              {isCompleted && !isSelected && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white shadow-sm"></div>
              )}
              
              {/* 今日標記 */}
              {isDateToday && !isSelected && (
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
