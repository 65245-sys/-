import { DayRoutine, Product, ProductSuggestionResult, MachineMode } from '../types';

// ✅ Cloudflare Worker 網址 (與 Modal 一致)
const WORKER_URL = "https://skincare.65245.workers.dev";

// 1. 定義產品類型 ID 與顯示名稱對照 (供全 App 使用)
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

// 2. 排序權重 (數字越小越前面) - 使用 ID
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

// 3. 初始產品資料 - ✅ productType 全部改成 ID
export const INITIAL_PRODUCTS: Product[] = [
  { id: 'init-1', name: 'SK-II 洗面乳', timing: 'EVENING', days: [0,1,2,3,4,5,6], productType: 'CLEANSER', order: 0, isCustom: false },
  { id: 'init-2', name: 'Zero Pore Pad', timing: 'EVENING', days: [6], productType: 'ACID', order: 1, isCustom: false },
  { id: 'init-3', name: 'Green Tomato Ampoule', timing: 'MORNING', days: [0,1,2,3,4,5,6], productType: 'ESSENCE', order: 2, isCustom: false },
  { id: 'init-4', name: 'PDRN Ampoule', timing: 'EVENING', days: [0,1,2,3,4,5,6], productType: 'SERUM', order: 3, isCustom: false },
  { id: 'init-6', name: 'Lierac Cream', timing: 'EVENING', days: [0,1,2,3,4,5,6], productType: 'CREAM', order: 5, isCustom: false },
  { id: 'init-7', name: '防曬 (Sunscreen)', timing: 'MORNING', days: [0,1,2,3,4,5,6], productType: 'SUNSCREEN', order: 6, isCustom: false },
];

export const ALL_MACHINE_MODES: MachineMode[] = [
    { id: 'booster', name: 'Booster', color: 'bg-orange-400', description: '橘光 - 促進吸收、光澤護理' },
    { id: 'mc', name: 'MC', color: 'bg-green-500', description: '綠光 - 微電流、膠原蛋白增生' },
    { id: 'ems', name: 'EMS', color: 'bg-red-500', description: '紅光 - 肌肉層提拉、輪廓管理' },
    { id: 'airshot', name: 'Air Shot', color: 'bg-blue-500', description: '藍光 - 毛孔護理 (限乾臉)' },
    { id: 'derma', name: 'Derma Shot', color: 'bg-purple-500', description: '紫光 - 綜合按摩' },
];

// 4. 星期標籤 Helper (0 = 週日)
export const getDayLabel = (dayIndex: number) => {
    // 陣列索引 0 對應 '日'，1 對應 '一'...
    const map = ['日', '一', '二', '三', '四', '五', '六'];
    return map[dayIndex] || '';
};

// Helper API Call
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

// --- ✅ Regex Fallback Logic (已更新為回傳 ID) ---
// 當 Worker 連線失敗或是離線時，會使用這個邏輯
export const analyzeProductInputRegex = (name: string): ProductSuggestionResult => {
  const n = name.toLowerCase();
  
  // 1. 特殊成分優先判斷 (安全性與時段相關)
  
  // 防曬 -> 晨間
  if (/sun|spf|uv|防曬|隔離|day/.test(n) && !/night/.test(n)) {
    return {
        productType: 'SUNSCREEN',
        timing: 'MORNING',
        days: [0,1,2,3,4,5,6],
        reason: '日間紫外線防護'
    };
  }

  // 酸類 -> 週六晚
  if (/acid|bha|aha|salicylic|glycolic|mandelic|酸|煥膚|杏仁酸|水楊酸/.test(n)) {
    return {
        productType: 'ACID',
        timing: 'EVENING',
        days: [6],
        warning: '酸類建議在「週六煥膚日」晚間使用。',
        reason: '含有酸類去角質成分'
    };
  }

  // A醇 -> 平日晚 (避開週六)
  if (/retinol|retinal|a醇|a醛|抗老|wrinkle/.test(n)) {
    return {
        productType: 'RETINOL',
        timing: 'EVENING',
        days: [0, 1, 2, 3, 4, 5],
        warning: '建議避開週六酸類煥膚日。',
        reason: '含A醇抗老成分'
    };
  }

  // 去角質 -> 晚間
  if (/scrub|exfoli|peel|去角質|磨砂/.test(n)) {
    return { productType: 'SCRUB', timing: 'EVENING', days: [6], reason: '物理性去角質', warning: '建議一週一次，避開敏弱期' };
  }

  // 2. 質地與功能判斷 (回傳 ID)
  
  // 潔顏
  if (/cleanser|wash|soap|foam|洗面|潔顏/.test(n)) {
      return { productType: 'CLEANSER', timing: 'EVENING', days: [0,1,2,3,4,5,6], reason: '臉部清潔' };
  }
  
  // 化妝水
  if (/toner|pad|mist|water|水|露|爽膚|棉片/.test(n) && !/lotion/.test(n)) { // 排除 lotion 以免誤判
      return { productType: 'TONER', timing: 'BOTH', days: [0,1,2,3,4,5,6], reason: '基礎補水' };
  }

  // 面膜
  if (/mask|pack|sheet|面膜|凍膜/.test(n)) {
      return { productType: 'MASK', timing: 'EVENING', days: [0,1,2,3,4,5,6], reason: '加強護理' };
  }

  // 眼霜
  if (/eye|眼/.test(n)) {
      return { productType: 'EYE_CREAM', timing: 'BOTH', days: [0,1,2,3,4,5,6], reason: '眼周護理' };
  }

  // 保養油
  if (/oil|油/.test(n) && !/control/.test(n)) { // 避免 oil control
      return { productType: 'OIL', timing: 'EVENING', days: [0,1,2,3,4,5,6], reason: '滋潤鎖水' };
  }

  // 安瓶 / 高效精萃 (比精華液更濃縮)
  if (/ampoule|concentrate|安瓶|精萃/.test(n)) {
      return { productType: 'SERUM', timing: 'EVENING', days: [0,1,2,3,4,5,6], reason: '高濃度修護' };
  }

  // 精華液
  if (/serum|essence|精華/.test(n)) {
      return { productType: 'ESSENCE', timing: 'BOTH', days: [0,1,2,3,4,5,6], reason: '進階修護' };
  }

  // 乳液
  if (/lotion|emulsion|乳液|凝乳/.test(n)) {
      return { productType: 'LOTION', timing: 'BOTH', days: [0,1,2,3,4,5,6], reason: '保濕鎖水' };
  }

  // 乳霜
  if (/cream|balm|moist|霜/.test(n) && !/eye|sun|bb|cc/.test(n)) {
      return { productType: 'CREAM', timing: 'EVENING', days: [0,1,2,3,4,5,6], reason: '深層滋潤' };
  }

  // 預設
  return {
    productType: 'OTHER',
    timing: 'EVENING',
    days: [0,1,2,3,4,5,6],
    reason: '一般保養品'
  };
};

// --- AI Text Analysis (Prompt 已更新為回傳 ID) ---
export const analyzeProductWithAI = async (name: string): Promise<ProductSuggestionResult> => {
    const prompt = `
      你是一位專業保養品成分專家。請分析產品名稱: "${name}"。
      
      請回傳 JSON 物件，其中 "productType" 必須是以下 ID 之一 (不要回傳中文)：
      ['CLEANSER', 'TONER', 'ESSENCE', 'SERUM', 'EYE_CREAM', 'LOTION', 'CREAM', 'OIL', 'SUNSCREEN', 'MASK', 'ACID', 'RETINOL', 'SCRUB', 'OTHER']
      
      定義說明：
      - ESSENCE: 一般精華液/露
      - SERUM: 高效安瓶/濃縮精萃
      - ACID: 酸類煥膚 (BHA, AHA, 水楊酸, 杏仁酸)
      - RETINOL: A醇/A醛/抗老
      - SCRUB: 磨砂膏/物理去角質

      其他欄位：
      - timing: 'MORNING', 'EVENING', 'BOTH'。
      - days: [0-6] (0=週日)。
      - reason: 短句說明 (繁中)。
      - warning: 使用警告 (繁中) 或 null。

      嚴格規則：
      - ACID/SCRUB -> 建議週六 (6) 晚上。
      - RETINOL -> 建議晚上，避開週六 (0-5)。
      - SUNSCREEN -> 絕對是 MORNING (0-6)。
      - CREAM/OIL -> 建議 EVENING。
    `;

    try {
        const data = await callWorker({
            contents: [{ parts: [{ text: prompt }] }]
        });
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

// --- AI Image Analysis (Prompt 已更新為回傳 ID) ---
export const analyzeProductImage = async (base64Image: string): Promise<ProductSuggestionResult & { name: string }> => {
    const prompt = `
      讀取圖片中的保養品文字。
      回傳 JSON，"productType" 必須從以下 ID 選擇 (精確匹配)：
      ['CLEANSER', 'TONER', 'ESSENCE', 'SERUM', 'EYE_CREAM', 'LOTION', 'CREAM', 'OIL', 'SUNSCREEN', 'MASK', 'ACID', 'RETINOL', 'SCRUB', 'OTHER']

      欄位：
      - name: 產品名稱 (繁中/英)。
      - productType: 上述 ID。
      - timing: 'MORNING', 'EVENING', 'BOTH'。
      - days: 數字陣列。
      - reason: 功效 (繁中)。
      - warning: 警告 (繁中)。

      規則：
      1. 酸類 (Acid/BHA) -> 週六 (6) 晚上。
      2. A醇 (Retinol) -> 晚上，避開週六。
      3. 防曬 (SPF) -> 白天。
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

// 預設匯出主要的分析函式
export const analyzeProductInput = analyzeProductWithAI;

// 取得最佳排序權重 (給 UI 用)
export const getOptimalProductOrder = (productType?: string): number => {
    if (!productType) return 99;
    return PRODUCT_ORDER_WEIGHTS[productType] || 99;
};

// 預設每週行程
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
