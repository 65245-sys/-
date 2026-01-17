export type RoutineType = 'MORNING' | 'EVENING';

export type ProductTiming = 'MORNING' | 'EVENING' | 'BOTH';

export interface Product {
  id: string;
  name: string;
  timing: ProductTiming;
  days: number[]; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  
  productType?: string; // e.g. "精華液", "乳霜", "化妝水"
  order: number; // For sorting sequence
  
  // Legacy/Optional for display badges or migration
  originalCategory?: string;
  isCustom?: boolean;
}

export interface MachineMode {
  id: string; // Add ID for easier selection
  name: string;
  color: string;
  description: string;
}

export interface DailyLog {
  completed: boolean;
  note: string;
  skinConditions?: string[]; // e.g. ["乾燥", "泛紅"]
  
  // 支援物件格式的 AI 回應
  aiResponse?: {
      title: string;
      content: string;
      actionItem?: string;
      historyStory?: string;
      quote?: string;
  };
  
  // 舊版資料相容
  aiFeedback?: string;

  machineModes?: MachineMode[]; // Custom overrides for the day
  
  customRoutine?: Product[];    // 當天專屬的產品清單
  routineSnapshot?: Product[];  // 舊版相容用的快照
  
  timestamp?: number;
}

export interface DayRoutine {
  theme: string;
  description: string;
  machineModes: MachineMode[];
  isRestDay: boolean;
}

export interface DailyLogsMap {
  [dateString: string]: DailyLog;
}

export interface ProductSuggestionResult {
  timing: ProductTiming;
  days: number[];
  productType: string;
  warning?: string;
  reason?: string;
}
