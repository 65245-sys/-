// utils/dateUtils.ts

// 取得顯示用的日期字串
export const getDisplayDate = (date: Date): string => {
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const days = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
    const dayName = days[date.getDay()];
    return `${m}月${d}日 ${dayName}`;
};

// 取得資料庫存檔用的 Key (YYYY-MM-DD)
export const formatDateKey = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

// 判斷是否為同一天
export const isSameDay = (d1: Date, d2: Date): boolean => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
};

// 取得時間軸需要的日期陣列
export const getTimelineDates = (baseDate: Date = new Date()): Date[] => {
    const dates: Date[] = [];
    const start = new Date(baseDate);
    start.setDate(baseDate.getDate() - 14);

    for (let i = 0; i < 29; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        dates.push(d);
    }
    return dates;
};
