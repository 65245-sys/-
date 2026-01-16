import { DayRoutine, Product, ProductSuggestionResult } from '../types';

// ✅ Cloudflare Worker 網址
const WORKER_URL = "https://skincare.65245.workers.dev";

// ✅ 定義 MachineMode 介面 (防止 types.ts 缺漏)
export interface MachineMode {
    id: string;
    name: string;
    color: string;
    description: string;
}

// ==========================================
// 1. 產品相關定義 (補回 PRODUCT_TAGS)
// ==========================================

// ID 與中文名稱對照
export const PRODUCT_TYPE_LABELS: Record<string, string> = {
    'CLEANSER': '潔顏/洗面乳',
    'TONER': '化妝水/爽膚水',
    'ESSENCE': '精華液/露',
    'SERUM': '高效安瓶/精萃',
    'EYE_CREAM': '眼部護理',
    'LOTION': '乳液/凝乳',
    'CREAM': '乳霜/凝霜',
    'OIL': '保養油',
    'SUNSCREEN': '防曬/隔離',
    'MASK': '面膜/凍膜',
    'ACID': '酸類煥膚',
    'RETINOL': 'A醇/A醛',
    'SCRUB': '去角質',
    'OTHER': '其他'
};

// 為了相容 App.tsx 的 import，我們匯出中文標籤陣列
export const PRODUCT_TAGS = Object.values(PRODUCT_TYPE_LABELS);

// 排序權重
export const PRODUCT_ORDER_WEIGHTS: Record<string, number> = {
    'CLEANSER': 10,
    'SCRUB': 15,
    'ACID': 20,
    'TONER': 30,
    'MASK': 35,
    'ESSENCE': 40,
    'SERUM': 42,
    'RETINOL': 45,
    'EYE_CREAM': 50,
    'LOTION': 55,
    'CREAM': 60,
    'OIL': 70,
    'SUNSCREEN': 80,
    'OTHER': 90
};

// 初始產品資料
export const INITIAL_PRODUCTS: Product[] = [
  { id: 'init-1', name: 'SK-II 洗面乳', timing: 'EVENING', days: [0,1,2,3,4,5,6], productType: 'CLEANSER', order: 0, isCustom: false },
  { id: 'init-2', name: 'Zero Pore Pad', timing: 'EVENING', days: [6], productType: 'ACID', order: 1, isCustom: false },
  { id: 'init-3', name: 'Green Tomato Ampoule', timing: 'MORNING', days: [0,1,2,3,4,5,6], productType: 'ESSENCE', order: 2, isCustom: false },
  { id: 'init-4', name: 'PDRN Ampoule', timing: 'EVENING', days: [0,1,2,3,4,5,6], productType: 'SERUM', order: 3, isCustom: false },
  { id: 'init-6', name: 'Lierac Cream', timing: 'EVENING', days: [0,1,2,3,4,5,6], productType: 'CREAM', order: 5, isCustom: false },
  { id: 'init-7', name: '防曬 (Sunscreen)', timing: 'MORNING', days: [0,1,2,3,4,5,6], productType: 'SUNSCREEN', order: 6, isCustom: false },
];

// ==========================================
// 2. 膚況與機器定義 (補回 SKIN_CONDITIONS)
// ==========================================

export const SKIN_CONDITIONS = [
    '正常', '乾燥脫皮', '出油', '外油內乾',
    '泛紅敏感', '粉刺痘痘', '暗沉無光', '毛孔粗大'
];

export const ALL_MACHINE_MODES: MachineMode[] = [
    { id: 'booster', name: 'Booster', color: 'bg-orange-400', description: '橘光 - 促進吸收、光澤護理' },
    { id: 'mc', name: 'MC', color: 'bg-green-500', description: '綠光 - 微電流、膠原蛋白增生' },
    { id: 'ems', name: 'EMS', color: 'bg-red-500', description: '紅光 - 肌肉層提拉、輪廓管理' },
    { id: 'airshot', name: 'Air Shot', color: 'bg-blue-500', description: '藍光 - 毛孔護理 (限乾臉)' },
    { id: 'derma', name: 'Derma Shot', color: 'bg-purple-500', description: '紫光 - 綜合按摩' },
];

// ==========================================
// 3. 主題與排程 (補回 THEME_PRESETS)
// ==========================================

export const THEME_PRESETS = [
    {
        label: '🌿 毛孔清潔 (Pore Care)',
        theme: '毛孔清潔日 (Pore Care)',
        description: '深度清潔毛孔，加強吸收。請務必在乾臉狀態使用 Air Shot。',
        defaultModes: ['airshot', 'booster'],
        keywords: ['毛孔', 'Pore', '清潔']
    },
    {
        label: '🪻 彈力拉提 (Lifting)',
        theme: '彈力拉提日 (Lifting)',
        description: 'EMS 刺激肌肉層，提升輪廓線。搭配凝膠使用效果更佳。',
        defaultModes: ['ems', 'booster'],
        keywords: ['拉提', 'Lifting', '彈力']
    },
    {
        label: '🌹 豐盈光澤 (Plumping)',
        theme: '豐盈光澤日 (Plumping)',
        description: 'MC 模式促進膠原蛋白，恢復肌膚彈性與澎潤感。',
        defaultModes: ['mc', 'booster'],
        keywords: ['光澤', 'Plumping', '豐盈']
    },
    {
        label: '🍂 週末煥膚 (Acid/Renewal)',
        theme: '週末煥膚日 (Acid Care)',
        description: '肌膚休息日，專注於角質代謝。勿使用美容儀。',
        defaultModes: [],
        keywords: ['煥膚', '酸類', 'Acid']
    },
    {
        label: '💧 深度保濕 (Moisturizing)',
        theme: '深度保濕日 (Moisturizing)',
        description: '一週的結尾，給予肌膚深層滋潤修復。勿使用美容儀。',
        defaultModes: [],
        keywords: ['保濕', '水', 'Moisturizing']
    },
    {
        label: '✨ 自訂主題 (Custom)',
        theme: '自訂保養主題',
        description: '請輸入您的自訂說明...',
        defaultModes: [],
        keywords: []
    }
];

// Helper: 判斷主題類型 (補回 getThemeType)
export const getThemeType = (themeName: string): 'PORE' | 'LIFTING' | 'PLUMPING' | 'ACID' | 'MOISTURE' | 'DEFAULT' => {
    const name = themeName || '';
    if (name.includes('毛孔') || name.includes('Pore')) return 'PORE';
    if (name.includes('拉提') || name.includes('Lifting')) return 'LIFTING';
    if (name.includes('光澤') || name.includes('Plumping') || name.includes('豐盈')) return 'PLUMPING';
    if (name.includes('煥膚') || name.includes('酸') || name.includes('Acid')) return 'ACID';
    if (name.includes('保濕') || name.includes('Moisturizing')) return 'MOISTURE';
    return 'DEFAULT';
};

// ==========================================
// 4. 工具函式
// ==========================================

export const getDayLabel = (dayIndex: number) => {
    const map = ['日', '一', '二', '三', '四', '五', '六'];
    return map[dayIndex] || '';
};

// API 呼叫 Helper
const callWorker = async (payload: any) => {
    try {
        const response = await fetch(WORKER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`Worker Error: ${response.status}`);

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error("AI 無法產生回應");

        const cleanJson = text.replace(/```json|```/g, "").trim();
        return JSON.parse(cleanJson);
    } catch (error) {
        console.error("AI API Error:", error);
        throw error;
    }
};

// ==========================================
// 5. 分析邏輯 (Regex + AI)
// ==========================================

// Regex Fallback
export const analyzeProductInputRegex = (name: string): ProductSuggestionResult => {
  const n = name.toLowerCase();
  
  if (/sun|spf|uv|防曬|隔離|day/.test(n) && !/night/.test(n)) {
    return { productType: 'SUNSCREEN', timing: 'MORNING', days: [0,1,2,3,4,5,6], reason: '日間紫外線防護' };
  }
  if (/acid|bha|aha|salicylic|glycolic|mandelic|酸|煥膚|杏仁酸|水楊酸/.test(n)) {
    return { productType: 'ACID', timing: 'EVENING', days: [6], warning: '酸類建議在「週六煥膚日」晚間使用。', reason: '含有酸類去角質成分' };
  }
  if (/retinol|retinal|a醇|a醛|抗老|wrinkle/.test(n)) {
    return { productType: 'RETINOL', timing: 'EVENING', days: [0, 1, 2, 3, 4, 5], warning: '建議避開週六酸類煥膚日。', reason: '含A醇抗老成分' };
  }
  if (/scrub|exfoli|peel|去角質|磨砂/.test(n)) {
    return { productType: 'SCRUB', timing: 'EVENING', days: [6], reason: '物理性去角質', warning: '建議一週一次' };
  }

  // 一般分類
  if (/cleanser|wash|soap|foam|洗面|潔顏/.test(n)) return { productType: 'CLEANSER', timing: 'EVENING', days: [0,1,2,3,4,5,6], reason: '臉部清潔' };
  if (/toner|pad|mist|water|水|露|爽膚|棉片/.test(n) && !/lotion/.test(n)) return { productType: 'TONER', timing: 'BOTH', days: [0,1,2,3,4,5,6], reason: '基礎補水' };
  if (/mask|pack|sheet|面膜|凍膜/.test(n)) return { productType: 'MASK', timing: 'EVENING', days: [0,1,2,3,4,5,6], reason: '加強護理' };
  if (/eye|眼/.test(n)) return { productType: 'EYE_CREAM', timing: 'BOTH', days: [0,1,2,3,4,5,6], reason: '眼周護理' };
  if (/oil|油/.test(n) && !/control/.test(n)) return { productType: 'OIL', timing: 'EVENING', days: [0,1,2,3,4,5,6], reason: '滋潤鎖水' };
  if (/ampoule|concentrate|安瓶|精萃/.test(n)) return { productType: 'SERUM', timing: 'EVENING', days: [0,1,2,3,4,5,6], reason: '高濃度修護' };
  if (/serum|essence|精華/.test(n)) return { productType: 'ESSENCE', timing: 'BOTH', days: [0,1,2,3,4,5,6], reason: '進階修護' };
  if (/lotion|emulsion|乳液|凝乳/.test(n)) return { productType: 'LOTION', timing: 'BOTH', days: [0,1,2,3,4,5,6], reason: '保濕鎖水' };
  if (/cream|balm|moist|霜/.test(n) && !/eye|sun/.test(n)) return { productType: 'CREAM', timing: 'EVENING', days: [0,1,2,3,4,5,6], reason: '深層滋潤' };

  return { productType: 'OTHER', timing: 'EVENING', days: [0,1,2,3,4,5,6], reason: '一般保養品' };
};

// AI Text Analysis
export const analyzeProductWithAI = async (name: string): Promise<ProductSuggestionResult> => {
    const prompt = `
      分析保養品名稱: "${name}"。
      回傳 JSON，productType 必填且必須是以下 ID:
      ['CLEANSER', 'TONER', 'ESSENCE', 'SERUM', 'EYE_CREAM', 'LOTION', 'CREAM', 'OIL', 'SUNSCREEN', 'MASK', 'ACID', 'RETINOL', 'SCRUB', 'OTHER']
      其他欄位: timing ('MORNING'/'EVENING'/'BOTH'), days (0-6 陣列), reason (繁中), warning (繁中/null)
    `;

    try {
        const data = await callWorker({ contents: [{ parts: [{ text: prompt }] }] });
        return {
            productType: data.productType || 'OTHER',
            timing: data.timing || 'EVENING',
            days: data.days || [0,1,2,3,4,5,6],
            reason: data.reason || 'AI 分析',
            warning: data.warning
        };
    } catch (e) {
        console.error("AI Text Fallback", e);
        return analyzeProductInputRegex(name);
    }
};

// Image Analysis
export const analyzeProductImage = async (base64Image: string): Promise<ProductSuggestionResult & { name: string }> => {
    const prompt = `
      分析圖片中的保養品。
      回傳 JSON，productType 必須是 ID:
      ['CLEANSER', 'TONER', 'ESSENCE', 'SERUM', 'EYE_CREAM', 'LOTION', 'CREAM', 'OIL', 'SUNSCREEN', 'MASK', 'ACID', 'RETINOL', 'SCRUB', 'OTHER']
      包含: name, timing, days, reason, warning
    `;

    try {
        const data = await callWorker({
            contents: [{
                parts: [
                    { text: prompt },
                    { inline_data: { mime_type: "image/jpeg", data: base64Image } }
                ]
            }]
        });

        return {
            name: data.name || "未知產品",
            productType: data.productType || "OTHER",
            timing: data.timing || "EVENING",
            days: data.days || [0,1,2,3,4,5,6],
            reason: data.reason || "圖片辨識",
            warning: data.warning
        };
    } catch (e) {
        console.error("Vision AI Error", e);
        return {
            name: "辨識失敗",
            productType: "OTHER",
            timing: "EVENING",
            days: [0,1,2,3,4,5,6],
            reason: "無法連線",
            warning: undefined
        };
    }
}

// 預設匯出
export const analyzeProductInput = analyzeProductWithAI;

// 取得排序
export const getOptimalProductOrder = (productType?: string): number => {
    if (!productType) return 99;
    return PRODUCT_ORDER_WEIGHTS[productType] || 99;
};

// ==========================================
// 6. 排程資料
// ==========================================

export const DEFAULT_WEEKLY_SCHEDULE: Record<number, DayRoutine> = {
    1: { theme: '毛孔清潔日 (Pore Care)', description: '深度清潔', machineModes: [ALL_MACHINE_MODES[3], ALL_MACHINE_MODES[0]], isRestDay: false },
    2: { theme: '彈力拉提日 (Lifting)', description: 'EMS 拉提', machineModes: [ALL_MACHINE_MODES[2], ALL_MACHINE_MODES[0]], isRestDay: false },
    3: { theme: '豐盈光澤日 (Plumping)', description: 'MC 膠原蛋白', machineModes: [ALL_MACHINE_MODES[1], ALL_MACHINE_MODES[0]], isRestDay: false },
    4: { theme: '毛孔清潔日 (Pore Care)', description: '深度清潔', machineModes: [ALL_MACHINE_MODES[3], ALL_MACHINE_MODES[0]], isRestDay: false },
    5: { theme: '彈力拉提日 (Lifting)', description: 'EMS 拉提', machineModes: [ALL_MACHINE_MODES[2], ALL_MACHINE_MODES[0]], isRestDay: false },
    6: { theme: '週末煥膚日 (Acid Care)', description: '角質代謝，停用機器', machineModes: [], isRestDay: true },
    0: { theme: '深度保濕日 (Moisturizing)', description: '修復保濕，停用機器', machineModes: [], isRestDay: true }
};

export const getRoutineForDay = (date: Date, customSchedule?: Record<number, DayRoutine>): DayRoutine => {
  const day = date.getDay();
  const schedule = customSchedule || DEFAULT_WEEKLY_SCHEDULE;
  return schedule[day] || { theme: '日常保養', description: '', machineModes: [], isRestDay: true };
};
