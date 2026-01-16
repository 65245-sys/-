import { DayRoutine, Product, ProductSuggestionResult, MachineMode } from '../types';

// ✅ Cloudflare Worker 網址
const WORKER_URL = "https://skincare.65245.workers.dev";

// ==========================================
// 1. 產品相關定義
// ==========================================
export const PRODUCT_TYPE_LABELS: Record<string, string> = {
    'CLEANSER': '潔顏',
    'TONER': '化妝水',
    'ESSENCE': '精華液',
    'SERUM': '精華液',
    'EYE_CREAM': '眼霜',
    'LOTION': '乳液',
    'CREAM': '乳霜',
    'OIL': '保養油',
    'SUNSCREEN': '防曬',
    'MASK': '面膜',
    'ACID': '酸類',
    'RETINOL': 'A醇',
    'SCRUB': '去角質',
    'OTHER': '其他'
};

export const PRODUCT_TAGS = Object.values(PRODUCT_TYPE_LABELS);

export const PRODUCT_ORDER_WEIGHTS: Record<string, number> = {
    'CLEANSER': 10,
    'ACID': 20,
    'TONER': 30,
    'MASK': 35,
    'ESSENCE': 40,
    'SERUM': 40,
    'RETINOL': 45,
    'EYE_CREAM': 50,
    'LOTION': 55,
    'CREAM': 60,
    'OIL': 70,
    'SUNSCREEN': 80,
    'OTHER': 90
};

export const getOptimalProductOrder = (productType?: string): number => {
    if (!productType) return 99;
    return PRODUCT_ORDER_WEIGHTS[productType] || 99;
};

export const INITIAL_PRODUCTS: Product[] = [
  { id: 'init-1', name: 'SK-II 洗面乳', timing: 'EVENING', days: [0,1,2,3,4,5,6], productType: 'CLEANSER', order: 0, isCustom: false },
  { id: 'init-2', name: 'Zero Pore Pad / 酸類精華', timing: 'EVENING', days: [6], productType: 'ACID', order: 1, isCustom: false },
  { id: 'init-3', name: 'Green Tomato Ampoule (綠番茄)', timing: 'MORNING', days: [0,1,2,3,4,5,6], productType: 'ESSENCE', order: 2, isCustom: false },
  { id: 'init-4', name: 'PDRN Ampoule', timing: 'EVENING', days: [0,1,2,3,4,5,6], productType: 'SERUM', order: 3, isCustom: false },
  { id: 'init-5', name: 'Arden Gel (雅頓膠囊)', timing: 'EVENING', days: [0,1,2,3,4,5,6], productType: 'SERUM', order: 4, isCustom: false },
  { id: 'init-6', name: 'Lierac Cream', timing: 'EVENING', days: [0,1,2,3,4,5,6], productType: 'CREAM', order: 5, isCustom: false },
  { id: 'init-7', name: '防曬 (Sunscreen)', timing: 'MORNING', days: [0,1,2,3,4,5,6], productType: 'SUNSCREEN', order: 6, isCustom: false },
];

// ==========================================
// 2. 機器與膚況定義
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
// 3. 主題定義
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
// 4. 分析邏輯
// ==========================================
export const getDayLabel = (dayIndex: number) => {
    const map = ['日', '一', '二', '三', '四', '五', '六'];
    return map[dayIndex] || '';
};

export const getTimingLabel = (t: string) => {
    switch(t) {
        case 'MORNING': return '☀️ 晨間';
        case 'EVENING': return '🌙 晚間';
        case 'BOTH': return '☀️🌙 早晚皆可';
        default: return t;
    }
};

const detectProductTypeID = (name: string): string => {
    const n = name.toLowerCase();
    if (/sun|uv|防曬|隔離/.test(n)) return 'SUNSCREEN';
    if (/cleanser|wash|soap|洗面|潔顏/.test(n)) return 'CLEANSER';
    if (/toner|pad|水|露|棉片/.test(n)) return 'TONER';
    if (/acid|bha|aha|酸/.test(n)) return 'ACID';
    if (/retinol|a醇/.test(n)) return 'RETINOL';
    if (/eye|眼/.test(n)) return 'EYE_CREAM';
    if (/oil|油/.test(n)) return 'OIL';
    if (/serum|ampoule|essence|精華|安瓶/.test(n)) return 'SERUM';
    if (/cream|lotion|gel|balm|霜|乳|膠|凍/.test(n)) return 'CREAM';
    if (/mask|pack|面膜/.test(n)) return 'MASK';
    return 'OTHER';
};

export const analyzeProductInput = (name: string): ProductSuggestionResult => {
  const n = name.toLowerCase();
  const typeID = detectProductTypeID(n);
  
  if (/酸|acid|bha|aha|pha|peel/.test(n)) {
    return {
      timing: 'EVENING',
      days: [6],
      productType: 'ACID',
      warning: '酸類建議在「週六煥膚日」晚間使用，避開美容儀。',
      reason: '偵測到酸類成分'
    };
  }

  if (/vit c|維他命c|美白|white|bright/.test(n)) {
    return {
      timing: 'MORNING',
      days: [0,1,2,3,4,5,6],
      productType: typeID === 'OTHER' ? 'SERUM' : typeID,
      reason: '美白產品建議日間使用並搭配防曬'
    };
  }

  if (/retinol|a醇|a醛|抗老|wrinkle/.test(n)) {
    return {
      timing: 'EVENING',
      days: [0, 1, 2, 3, 4, 5],
      productType: 'RETINOL',
      warning: '建議避開週六酸類煥膚日，且盡量晚間使用。',
      reason: '偵測到 A 醇/抗老成分'
    };
  }

  if (/mask|面膜/.test(n)) {
    return {
      timing: 'EVENING',
      days: [0,1,2,3,4,5,6],
      productType: 'MASK',
      warning: '建議在晚間使用。',
      reason: '面膜類產品'
    };
  }
  
  if (/oil|cream|balm|油|霜|arden|雅頓/.test(n)) {
     return {
        timing: 'EVENING',
        days: [0,1,2,3,4,5,6],
        productType: typeID === 'OTHER' ? 'CREAM' : typeID,
        warning: '滋潤型產品建議晚間使用。',
        reason: '滋潤/修復類產品'
     };
  }

  return {
    timing: 'EVENING',
    days: [0,1,2,3,4,5,6],
    productType: typeID,
    reason: '一般保養品'
  };
};

// ✅ 使用 Worker 進行 AI 分析 (加強版)
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
        
        // 🛡️ 安全解析 JSON
        try {
            return JSON.parse(text.replace(/```json|```/g, "").trim());
        } catch (e) {
            console.error("AI JSON Parse Error, raw text:", text);
            // 回傳一個安全預設值，防止當機
            return {
                name: "辨識失敗",
                productType: "OTHER",
                reason: "AI 回應格式錯誤",
                timing: "EVENING",
                days: [0,1,2,3,4,5,6]
            };
        }
    } catch (error) {
        console.error("AI API Error:", error);
        throw error;
    }
};

export const analyzeProductWithAI = async (name: string): Promise<ProductSuggestionResult> => {
    return analyzeProductInput(name);
};

export const analyzeProductImage = async (base64Image: string): Promise<ProductSuggestionResult & { name: string }> => {
    const prompt = `
      You are a skincare expert. Analyze the attached image.
      Output JSON only:
      - name: Product name (Traditional Chinese).
      - productType: One of ['CLEANSER', 'TONER', 'ESSENCE', 'SERUM', 'EYE_CREAM', 'LOTION', 'CREAM', 'OIL', 'SUNSCREEN', 'MASK', 'ACID', 'RETINOL', 'OTHER'].
      - timing: 'MORNING' or 'EVENING' or 'BOTH'.
      - days: Array of 0-6.
      - reason: Brief reason in Traditional Chinese.
    `;

    try {
        const data = await callWorker({
            contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: "image/jpeg", data: base64Image } }] }]
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
        return { name: "辨識失敗", productType: "OTHER", timing: "EVENING", days: [0,1,2,3,4,5,6], reason: "無法連線" };
    }
}

// ==========================================
// 5. 排程資料
// ==========================================
export const DEFAULT_WEEKLY_SCHEDULE: Record<number, DayRoutine> = {
    1: { theme: '毛孔清潔日 (Pore Care)', description: '深度清潔毛孔，加強吸收。請務必在乾臉狀態使用 Air Shot。', machineModes: [ALL_MACHINE_MODES[3], ALL_MACHINE_MODES[0]], isRestDay: false },
    2: { theme: '彈力拉提日 (Lifting)', description: 'EMS 刺激肌肉層，提升輪廓線。', machineModes: [ALL_MACHINE_MODES[2], ALL_MACHINE_MODES[0]], isRestDay: false },
    3: { theme: '豐盈光澤日 (Plumping)', description: 'MC 模式促進膠原蛋白，恢復肌膚彈性。', machineModes: [ALL_MACHINE_MODES[1], ALL_MACHINE_MODES[0]], isRestDay: false },
    4: { theme: '毛孔清潔日 (Pore Care)', description: '深度清潔毛孔，加強吸收。請務必在乾臉狀態使用 Air Shot。', machineModes: [ALL_MACHINE_MODES[3], ALL_MACHINE_MODES[0]], isRestDay: false },
    5: { theme: '彈力拉提日 (Lifting)', description: 'EMS 刺激肌肉層，提升輪廓線。', machineModes: [ALL_MACHINE_MODES[2], ALL_MACHINE_MODES[0]], isRestDay: false },
    6: { theme: '週末煥膚日 (Acid Care)', description: '肌膚休息日，專注於角質代謝。勿使用美容儀。', machineModes: [], isRestDay: true },
    0: { theme: '深度保濕日 (Moisturizing)', description: '一週的結尾，給予肌膚深層滋潤修復。勿使用美容儀。', machineModes: [], isRestDay: true }
};

export const getRoutineForDay = (date: Date, customSchedule?: Record<number, DayRoutine>): DayRoutine => {
  const day = date.getDay();
  const schedule = customSchedule || DEFAULT_WEEKLY_SCHEDULE;
  return schedule[day] || { theme: '日常保養', description: '', machineModes: [], isRestDay: true };
};
