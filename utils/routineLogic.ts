import { DayRoutine, Product, ProductSuggestionResult, MachineMode } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

// Helper to generate initial products with new structure
export const INITIAL_PRODUCTS: Product[] = [
  { id: 'init-1', name: 'SK-II 洗面乳', timing: 'EVENING', days: [0,1,2,3,4,5,6], productType: '潔顏', order: 0, isCustom: false },
  { id: 'init-2', name: 'Zero Pore Pad / 酸類精華', timing: 'EVENING', days: [6], productType: '酸類', order: 1, isCustom: false },
  { id: 'init-3', name: 'Green Tomato Ampoule (綠番茄)', timing: 'MORNING', days: [0,1,2,3,4,5,6], productType: '精華液', order: 2, isCustom: false },
  { id: 'init-4', name: 'PDRN Ampoule', timing: 'EVENING', days: [0,1,2,3,4,5,6], productType: '精華液', order: 3, isCustom: false },
  { id: 'init-5', name: 'Arden Gel (雅頓膠囊)', timing: 'EVENING', days: [0,1,2,3,4,5,6], productType: '精華液', order: 4, isCustom: false },
  { id: 'init-6', name: 'Lierac Cream', timing: 'EVENING', days: [0,1,2,3,4,5,6], productType: '乳霜', order: 5, isCustom: false },
  { id: 'init-7', name: '防曬 (Sunscreen)', timing: 'MORNING', days: [0,1,2,3,4,5,6], productType: '防曬', order: 6, isCustom: false },
];

export const PRODUCT_TAGS = [
    '潔顏', '酸類', '化妝水', '面膜', '前導精華', '精華液', 'A醇', '眼霜', '乳液', '乳霜', '保養油', '防曬', '其他'
];

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

// Pre-defined Themes for Dropdown
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

// Helper to determine theme type from string (for colors/images)
export const getThemeType = (themeName: string): 'PORE' | 'LIFTING' | 'PLUMPING' | 'ACID' | 'MOISTURE' | 'DEFAULT' => {
    const name = themeName || '';
    if (name.includes('毛孔') || name.includes('Pore')) return 'PORE';
    if (name.includes('拉提') || name.includes('Lifting')) return 'LIFTING';
    if (name.includes('光澤') || name.includes('Plumping') || name.includes('豐盈')) return 'PLUMPING';
    if (name.includes('煥膚') || name.includes('酸') || name.includes('Acid')) return 'ACID';
    if (name.includes('保濕') || name.includes('Moisturizing')) return 'MOISTURE';
    return 'DEFAULT';
};

// Weights for auto-sorting (Smaller number = Earlier step)
export const PRODUCT_ORDER_WEIGHTS: Record<string, number> = {
    '潔顏': 10,
    '酸類': 20, 
    '化妝水': 30,
    '面膜': 35,
    '前導精華': 38,
    '精華液': 40,
    'A醇': 45,
    '眼霜': 50,
    '乳液': 55,
    '乳霜': 60,
    '保養油': 70,
    '防曬': 80,
    '其他': 90
};

export const getDayLabel = (dayIndex: number) => {
    const map = ['日', '一', '二', '三', '四', '五', '六'];
    return map[dayIndex];
};

export const getTimingLabel = (t: string) => {
    switch(t) {
        case 'MORNING': return '☀️ 晨間';
        case 'EVENING': return '🌙 晚間';
        case 'BOTH': return '☀️🌙 早晚皆可';
        default: return t;
    }
};

export const getOptimalProductOrder = (productType?: string): number => {
    if (!productType) return 99;
    return PRODUCT_ORDER_WEIGHTS[productType] || 99;
};

const detectProductType = (name: string): string => {
    const n = name.toLowerCase();
    if (/sun|uv|防曬|隔離/.test(n)) return '防曬';
    if (/cleanser|wash|soap|洗面|潔顏/.test(n)) return '潔顏';
    if (/toner|pad|水|露|棉片/.test(n)) return '化妝水';
    if (/acid|bha|aha|酸/.test(n)) return '酸類';
    if (/retinol|a醇/.test(n)) return 'A醇';
    if (/eye|眼/.test(n)) return '眼霜';
    if (/oil|油/.test(n)) return '保養油';
    if (/serum|ampoule|essence|精華|安瓶/.test(n)) return '精華液';
    if (/cream|lotion|gel|balm|霜|乳|膠|凍/.test(n)) return '乳霜';
    if (/mask|pack|面膜/.test(n)) return '面膜';
    return '一般保養';
};

// Original Regex-based analysis (fallback)
export const analyzeProductInputRegex = (name: string): ProductSuggestionResult => {
  const n = name.toLowerCase();
  const type = detectProductType(n);
  
  // 1. Acid / BHA -> Saturday Night
  if (/酸|acid|bha|aha|pha|peel/.test(n)) {
    return {
      timing: 'EVENING',
      days: [6], // Sat
      productType: '酸類',
      warning: '酸類建議在「週六煥膚日」晚間使用，避開美容儀。',
      reason: '偵測到酸類成分'
    };
  }

  // 2. Vitamin C / Whitening -> Morning Daily
  if (/vit c|維他命c|美白|white|bright/.test(n)) {
    return {
      timing: 'MORNING',
      days: [0,1,2,3,4,5,6],
      productType: type === '一般保養' ? '精華液' : type,
      reason: '美白產品建議日間使用並搭配防曬'
    };
  }

  // 3. Retinol -> Weekdays Evening (avoid Acid day Sat)
  if (/retinol|a醇|a醛|抗老|wrinkle/.test(n)) {
    return {
      timing: 'EVENING',
      // Sun, Mon, Tue, Wed, Thu, Fri (Skip Sat)
      days: [0, 1, 2, 3, 4, 5], 
      productType: 'A醇',
      warning: '建議避開週六酸類煥膚日，且盡量晚間使用。',
      reason: '偵測到 A 醇/抗老成分'
    };
  }

  // 4. Mask -> Evening
  if (/mask|面膜/.test(n)) {
    return {
      timing: 'EVENING',
      days: [0,1,2,3,4,5,6], 
      productType: '面膜',
      warning: '建議在晚間使用。',
      reason: '面膜類產品'
    };
  }
  
  // 5. Heavy Cream / Oil -> Sunday or Daily Night
  if (/oil|cream|balm|油|霜|arden|雅頓/.test(n)) {
     return {
        timing: 'EVENING',
        days: [0,1,2,3,4,5,6],
        productType: type === '一般保養' ? '乳霜' : type,
        warning: '滋潤型產品建議晚間使用。',
        reason: '滋潤/修復類產品'
     };
  }

  // Default fallback -> Daily Evening
  return {
    timing: 'EVENING',
    days: [0,1,2,3,4,5,6],
    productType: type,
    reason: '一般保養品'
  };
};

// Alias for backward compatibility if needed, though we will prioritize the AI one
export const analyzeProductInput = analyzeProductInputRegex;

// New AI Analysis with Google Search Grounding
export const analyzeProductWithAI = async (name: string): Promise<ProductSuggestionResult> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const modelId = 'gemini-3-flash-preview'; 

    const prompt = `
      Search for the skincare product "${name}". 
      Identify its key ingredients, main efficacy (功效), and usage instructions.
      
      Return a JSON object with:
      1. "productType": Best fit from ['潔顏', '酸類', '化妝水', '面膜', '前導精華', '精華液', 'A醇', '眼霜', '乳液', '乳霜', '保養油', '防曬', '其他'].
      2. "timing": 'MORNING', 'EVENING', or 'BOTH'.
      3. "days": Array of integers 0-6 (0=Sun, 6=Sat).
      4. "reason": A short 1-sentence description of the product's main benefit/efficacy. **MUST BE IN TRADITIONAL CHINESE (繁體中文)**.
      5. "warning": Optional short warning. **MUST BE IN TRADITIONAL CHINESE (繁體中文)** (e.g. "建議避開陽光").

      Strict Application Rules for "days" and "timing":
      - Acids/Peels (BHA/AHA/Salicylic) -> Saturday (6) Evening only.
      - Retinol (A醇) -> Evening, Daily EXCEPT Saturday (0,1,2,3,4,5).
      - Vitamin C / Whitening -> Morning, Daily (0-6).
      - Sunscreen -> Morning, Daily (0-6).
      - Heavy Creams/Oils -> Evening, Daily (0-6).
      - General Hydration -> Both or Evening, Daily (0-6).
    `;

    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        productType: { type: Type.STRING },
                        timing: { type: Type.STRING },
                        days: { type: Type.ARRAY, items: { type: Type.INTEGER } },
                        reason: { type: Type.STRING },
                        warning: { type: Type.STRING },
                    }
                }
            }
        });

        const text = response.text;
        if (!text) throw new Error("No response from AI");
        
        const data = JSON.parse(text);

        // Map AI result to our strict types
        return {
            productType: data.productType || '其他',
            timing: (['MORNING', 'EVENING', 'BOTH'].includes(data.timing) ? data.timing : 'EVENING') as any,
            days: Array.isArray(data.days) ? data.days : [0,1,2,3,4,5,6],
            reason: data.reason || 'AI 自動分析',
            warning: data.warning
        };

    } catch (e) {
        console.error("AI Text Analysis Error", e);
        // Fallback to Regex if AI fails
        return analyzeProductInputRegex(name);
    }
};


const AirShot = ALL_MACHINE_MODES.find(m => m.id === 'airshot')!;
const Booster = ALL_MACHINE_MODES.find(m => m.id === 'booster')!;
const EMS = ALL_MACHINE_MODES.find(m => m.id === 'ems')!;
const MC = ALL_MACHINE_MODES.find(m => m.id === 'mc')!;

export const DEFAULT_WEEKLY_SCHEDULE: Record<number, DayRoutine> = {
    1: { // Mon
        theme: '毛孔清潔日 (Pore Care)',
        description: '深度清潔毛孔，加強吸收。請務必在乾臉狀態使用 Air Shot。',
        machineModes: [AirShot, Booster],
        isRestDay: false,
    },
    2: { // Tue
        theme: '彈力拉提日 (Lifting)',
        description: 'EMS 刺激肌肉層，提升輪廓線。',
        machineModes: [EMS, Booster],
        isRestDay: false,
    },
    3: { // Wed
        theme: '豐盈光澤日 (Plumping)',
        description: 'MC 模式促進膠原蛋白，恢復肌膚彈性。',
        machineModes: [MC, Booster],
        isRestDay: false,
    },
    4: { // Thu
        theme: '毛孔清潔日 (Pore Care)',
        description: '深度清潔毛孔，加強吸收。請務必在乾臉狀態使用 Air Shot。',
        machineModes: [AirShot, Booster],
        isRestDay: false,
    },
    5: { // Fri
        theme: '彈力拉提日 (Lifting)',
        description: 'EMS 刺激肌肉層，提升輪廓線。',
        machineModes: [EMS, Booster],
        isRestDay: false,
    },
    6: { // Sat
        theme: '週末煥膚日 (Acid Care)',
        description: '肌膚休息日，專注於角質代謝。勿使用美容儀。',
        machineModes: [],
        isRestDay: true,
    },
    0: { // Sun
        theme: '深度保濕日 (Moisturizing)',
        description: '一週的結尾，給予肌膚深層滋潤修復。勿使用美容儀。',
        machineModes: [],
        isRestDay: true,
    }
};

export const getRoutineForDay = (date: Date, customSchedule?: Record<number, DayRoutine>): DayRoutine => {
  const day = date.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
  const schedule = customSchedule || DEFAULT_WEEKLY_SCHEDULE;
  
  return schedule[day] || {
    theme: '日常保養',
    description: '',
    machineModes: [],
    isRestDay: true,
  };
};

// AI Image Analysis
export const analyzeProductImage = async (base64Image: string): Promise<ProductSuggestionResult & { name: string }> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      You are a skincare expert. Analyze the attached image of a skincare product.
      
      Output a JSON object with the following keys:
      - name: The product name (in Traditional Chinese if possible, otherwise English).
      - productType: One of ['精華液', '乳霜', '化妝水', '潔顏', '防曬', '面膜', '酸類', 'A醇', '眼霜', '保養油', '其他'].
      - timing: One of ['MORNING', 'EVENING', 'BOTH'].
      - days: An array of numbers (0-6) representing Sunday(0) to Saturday(6).
      - reason: A short string explaining the product's main function/efficacy. **MUST BE IN TRADITIONAL CHINESE (繁體中文)**.

      Apply these rules for 'days' and 'timing':
      1. Acids/Peels (BHA/AHA) -> Saturday (6) Evening only.
      2. Retinol (A醇) -> Evening, Avoid Saturday (0,1,2,3,4,5).
      3. Vitamin C / Whitening -> Morning, Daily (0-6).
      4. Heavy Creams / Oils -> Evening, Daily (0-6).
      5. Masks -> EVENING, Daily (0-6).
      6. Sunscreen -> Morning, Daily (0-6).
      7. Cleanser -> Evening, Daily (0-6).
      8. General Serum -> Both or Evening, Daily (0-6).
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
                    { text: prompt }
                ]
            },
            config: {
                responseMimeType: 'application/json'
            }
        });

        const text = response.text;
        if (!text) throw new Error("No response");
        return JSON.parse(text);
    } catch (e) {
        console.error("Vision AI Error", e);
        // Fallback
        return {
            name: "未知產品",
            productType: "其他",
            timing: "EVENING",
            days: [0,1,2,3,4,5,6],
            reason: "無法辨識圖片"
        };
    }
}