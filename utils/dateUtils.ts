export const formatDateKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const getDisplayDate = (date: Date): string => {
  return new Intl.DateTimeFormat('zh-TW', {
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  }).format(date);
};

export const getWeekDays = (currentDate: Date): Date[] => {
  // Generate a sliding window: 3 days before current date, up to 10 days after (Total 14 days)
  const dates: Date[] = [];
  const curr = new Date(currentDate); 
  curr.setHours(0, 0, 0, 0);
  
  // Start 3 days back
  const startOffset = -3;
  const totalDays = 14;

  const startDate = new Date(curr);
  startDate.setDate(curr.getDate() + startOffset);

  for (let i = 0; i < totalDays; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    dates.push(d);
  }
  return dates;
};

export const isSameDay = (d1: Date, d2: Date): boolean => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

export const getDaysInMonth = (year: number, month: number): Date[] => {
  const date = new Date(year, month, 1);
  const days: Date[] = [];
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
};

export const getMonthGrid = (year: number, month: number): (Date | null)[] => {
  const days = getDaysInMonth(year, month);
  const firstDay = days[0].getDay(); // 0 Sun ... 6 Sat
  // Adjust so Monday is 0, Sunday is 6
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  const grid: (Date | null)[] = Array(startOffset).fill(null);
  return [...grid, ...days];
};