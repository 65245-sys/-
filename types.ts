
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
  aiFeedback?: string;
  machineModes?: MachineMode[]; // Custom overrides for the day
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
