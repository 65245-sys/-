import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, AlertCircle, CalendarDays, Clock, Tag, Loader2, ImagePlus, Check } from 'lucide-react';
import { getDayLabel } from '../utils/routineLogic';
import { Product, ProductTiming } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (product: Product) => void;
  onUpdate?: (product: Product) => void;
  initialProduct?: Product | null;
}

// ✅ Cloudflare Worker 網址
const WORKER_URL = "https://skincare.65245.workers.dev";

// ✅ 產品類型清單 (中文)
const PRODUCT_TYPE_OPTIONS = [
    { id: 'CLEANSER', label: '潔顏/洗面乳' },
    { id: 'TONER', label: '化妝水/爽膚水' },
    { id: 'ESSENCE', label: '精華液/露' },
    { id: 'SERUM', label: '高效安瓶/精萃' },
    { id: 'EYE_CREAM', label: '眼部護理' },
    { id: 'LOTION', label: '乳液/凝乳' },
    { id: 'CREAM', label: '乳霜/凝霜' },
    { id: 'OIL', label: '保養油' },
    { id: 'SUNSCREEN', label: '防曬/隔離' },
    { id: 'MASK', label: '面膜/凍膜' },
    { id: 'ACID', label: '酸類煥膚 (杏仁酸等)' },
    { id: 'RETINOL', label: 'A醇/A醛抗老' },
    { id: 'SCRUB', label: '去角質/磨砂膏' },
    { id: 'OTHER', label: '其他特殊護理' },
];

// ✅ 新增：快速頻率選項
const FREQUENCY_PRESETS = [
    { label: '每天', days: [0, 1, 2, 3, 4, 5, 6] },
    { label: '平日 (一~五)', days: [1, 2, 3, 4, 5] },
    { label: '週末', days: [0, 6] },
    { label: '做一休一 (1,3,5,日)', days: [1, 3, 5, 0] },
    { label: '每三天 (一,四,日)', days: [1, 4, 0] },
];

const AddProductModal: React.FC<Props> = ({ isOpen, onClose, onAdd, onUpdate, initialProduct }) => {
  const [name, setName] = useState('');
  const [timing, setTiming] = useState<ProductTiming | null>(null);
  const [selectedDays, setSelectedDays] = useState<number[]>([]); // 0-6
  const [productType, setProductType] = useState<string>('');
  
  // AI 分析結果
  const [aiAnalysis, setAiAnalysis] = useState<{reason: string, warning?: string} | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [isAnalyzingText, setIsAnalyzingText] = useState(false);
  
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // 初始化資料
  useEffect(() => {
    if (isOpen && initialProduct) {
        setName(initialProduct.name || '');
        setTiming(initialProduct.timing);
        setSelectedDays(initialProduct.days || []);
        setProductType(initialProduct.productType || 'OTHER');
        setAiAnalysis(null);
    } else if (isOpen) {
        // 新增模式預設值
        setName('');
        setTiming(null);
        setSelectedDays([0, 1, 2, 3, 4, 5, 6]); // 預設每天
        setProductType('');
        setAiAnalysis(null);
    }
  }, [isOpen, initialProduct]);

  const isEditing = !!initialProduct;
  const isNameEmpty = name.trim().length === 0;

  // 🛠️ 圖片轉 Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = error => reject(error);
    });
  };

  // 🤖 AI 核心
  const callAIWorker = async (promptText: string, base64Image?: string) => {
    try {
      const payload: any = {
        contents: [{
          parts: [{ text: promptText }]
        }]
      };

      if (base64Image) {
        payload.contents[0].parts.push({
          inline_data: {
            mime_type: "image/jpeg",
            data: base64Image
          }
        });
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 放寬到20秒

      const response = await fetch(WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `連線失敗 (${response.status})`);
      }

      const data = await response.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!aiText) throw new Error("AI 回傳空內容");

      const jsonStr = aiText.replace(/```json|```/g, "").trim();
      return JSON.parse(jsonStr);

    } catch (error: any) {
      console.error("AI Analysis Error:", error);
      if (error.name === 'AbortError') throw new Error("連線逾時，請稍後再試。");
      throw error;
    }
  };

  // 📸 圖片處理
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzingImage(true);
    setAiAnalysis(null);
    try {
      const base64Data = await fileToBase64(file);
      const prompt = `
        你是一位專業保養品辨識專家。請分析這張圖片。
        回傳 JSON：
        {
          "identifiedName": "品牌與產品名稱",
          "productType": "從以下選: CLEANSER, TONER, ESSENCE, SERUM, EYE_CREAM, LOTION, CREAM, OIL, SUNSCREEN, MASK, ACID, RETINOL, SCRUB",
          "timing": "MORNING, EVENING, 或 BOTH",
          "reason": "簡短判斷依據",
          "warning": "若有酸類/A醇請提醒"
        }
      `;
      const result = await callAIWorker(prompt, base64Data);

      if (result.identifiedName) setName(result.identifiedName);
      if (result.productType) setProductType(result.productType);
      if (result.timing) setTiming(result.timing);
      
      setAiAnalysis({
        reason: result.reason || "AI 辨識成功",
        warning: result.warning
      });

    } catch (error: any) {
      alert(`圖片辨識失敗：${error.message}`);
    } finally {
      setIsAnalyzingImage(false);
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  // ✍️ 文字自動分析
  const handleNameBlur = async () => {
    if (isNameEmpty || isAnalyzingImage || isAnalyzingText) return;
    setIsAnalyzingText(true);
    setAiAnalysis(null);
    try {
        const prompt = `
            保養品名稱: "${name}"
            請分析類型與建議。
            回傳 JSON：
            {
              "productType": "從以下選: CLEANSER, TONER, ESSENCE, SERUM, EYE_CREAM, LOTION, CREAM, OIL, SUNSCREEN, MASK, ACID, RETINOL, SCRUB",
              "timing": "MORNING, EVENING, 或 BOTH",
              "reason": "簡短判斷理由",
              "warning": "若有刺激性成分請提醒"
            }
        `;
        const result = await callAIWorker(prompt);
        if (result.productType) setProductType(result.productType);
        if (result.timing) setTiming(result.timing);
        setAiAnalysis({ reason: result.reason, warning: result.warning });
    } catch (error) {
        console.log("文字分析略過");
    } finally {
        setIsAnalyzingText(false);
    }
  };

  // 切換單一日期
  const toggleDay = (dayIndex: number) => {
      setSelectedDays(prev =>
        prev.includes(dayIndex)
            ? prev.filter(d => d !== dayIndex)
            : [...prev, dayIndex].sort()
      );
  };

  // 🚀 套用頻率範本 (檢查兩陣列是否相等來決定按鈕是否亮起)
  const applyFrequency = (presetDays: number[]) => {
      setSelectedDays(presetDays);
  };

  const isPresetActive = (presetDays: number[]) => {
      if (presetDays.length !== selectedDays.length) return false;
      const sortedPreset = [...presetDays].sort();
      const sortedSelected = [...selectedDays].sort();
      return sortedPreset.every((value, index) => value === sortedSelected[index]);
  };

  const handleConfirm = () => {
      if (isNameEmpty || !timing || selectedDays.length === 0) return;

      const productData: Product = {
          id: initialProduct?.id || crypto.randomUUID(),
          name,
          productType: productType || 'OTHER',
          timing,
          days: selectedDays,
          order: initialProduct?.order || 0
      };

      isEditing && onUpdate ? onUpdate(productData) : onAdd(productData);
      onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-rose-900/20 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-lg relative overflow-hidden animate-[scaleIn_0.3s_ease-out] border border-white">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-50 to-pink-50 p-6 flex justify-between items-center border-b border-rose-100">
            <h3 className="text-xl font-serif font-bold text-rose-900 flex items-center gap-2">
                {isEditing ? <><Tag size={20}/> 編輯保養品</> : <><Sparkles size={20}/> 新增保養步驟</>}
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-full transition-colors text-gray-500 hover:text-rose-500">
                <X size={20} />
            </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
            
          {/* 1. Name Input */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">產品名稱</label>
            <div className="relative group">
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={handleNameBlur}
                    placeholder="例如：SK-II 青春露"
                    className="w-full p-4 pl-5 pr-14 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-rose-200 focus:outline-none transition-all shadow-sm group-hover:border-rose-200"
                />
                <button
                    onClick={() => galleryInputRef.current?.click()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                    disabled={isAnalyzingImage}
                >
                    {isAnalyzingImage ? <Loader2 size={20} className="animate-spin text-rose-500"/> : <ImagePlus size={20} />}
                </button>
                <input type="file" ref={galleryInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            </div>
            {isAnalyzingText && <p className="text-xs text-rose-400 mt-2 ml-1 animate-pulse">AI 正在分析...</p>}
          </div>

          {/* AI Banner */}
          {aiAnalysis && (
             <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3 animate-[fadeIn_0.5s]">
                 <Sparkles size={18} className="text-blue-400 shrink-0 mt-0.5" />
                 <div className="text-sm">
                     <p className="text-blue-900 font-medium mb-1">AI 辨識結果</p>
                     <p className="text-blue-600/80 leading-relaxed text-xs">{aiAnalysis.reason}</p>
                     {aiAnalysis.warning && (
                         <div className="flex items-center gap-1.5 mt-2 text-rose-500 font-bold text-xs bg-white/60 p-1.5 rounded-lg inline-flex">
                             <AlertCircle size={12} /> {aiAnalysis.warning}
                         </div>
                     )}
                 </div>
             </div>
          )}

          {/* 2. Timing */}
          <div>
             <label className="block text-sm font-bold text-gray-700 mb-3 ml-1 flex items-center gap-2">
                 <Clock size={16} className="text-rose-400"/> 使用時段
             </label>
             <div className="grid grid-cols-3 gap-3">
                 {[
                     { value: 'MORNING', label: '早晨', icon: '☀️' },
                     { value: 'EVENING', label: '夜間', icon: '🌙' },
                     { value: 'BOTH', label: '早晚', icon: '✨' }
                 ].map((opt) => (
                     <button
                        key={opt.value}
                        onClick={() => setTiming(opt.value as ProductTiming)}
                        className={`py-3 rounded-xl text-sm font-bold transition-all border-2 flex flex-col items-center gap-1
                            ${timing === opt.value 
                                ? 'border-rose-400 bg-rose-50 text-rose-600 shadow-sm scale-[1.02]' 
                                : 'border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100'}
                        `}
                     >
                        <span className="text-lg">{opt.icon}</span>
                        {opt.label}
                     </button>
                 ))}
             </div>
          </div>

          {/* 3. Product Type */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3 ml-1 flex items-center gap-2">
                <Tag size={16} className="text-rose-400"/> 產品類型
            </label>
            <div className="flex flex-wrap gap-2">
                {PRODUCT_TYPE_OPTIONS.map(tag => (
                    <button
                        key={tag.id}
                        onClick={() => setProductType(tag.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border
                            ${productType === tag.id
                                ? 'bg-gray-800 text-white border-gray-800 shadow-md'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}
                        `}
                    >
                        {tag.label}
                    </button>
                ))}
            </div>
          </div>

          {/* 4. Days Selection (Updated) */}
          <div>
             <div className="flex justify-between items-end mb-3">
                 <label className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-2">
                     <CalendarDays size={16} className="text-rose-400"/> 使用頻率
                 </label>
             </div>

             {/* 🌟 快速選擇按鈕區 */}
             <div className="flex flex-wrap gap-2 mb-4">
                {FREQUENCY_PRESETS.map((preset) => {
                    const isActive = isPresetActive(preset.days);
                    return (
                        <button
                            key={preset.label}
                            onClick={() => applyFrequency(preset.days)}
                            className={`
                                px-3 py-1.5 rounded-full text-xs font-bold transition-all border flex items-center gap-1
                                ${isActive 
                                    ? 'bg-rose-100 text-rose-600 border-rose-200' 
                                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}
                            `}
                        >
                            {isActive && <Check size={12} />}
                            {preset.label}
                        </button>
                    );
                })}
             </div>

             {/* 星期圓圈圈 (會即時連動) */}
             <div className="flex justify-between px-1">
                 {[1, 2, 3, 4, 5, 6, 0].map(d => {
                     const isSelected = selectedDays.includes(d);
                     const isWeekend = d === 0 || d === 6;
                     return (
                         <button
                            key={d}
                            onClick={() => toggleDay(d)}
                            className={`
                                w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
                                ${isSelected 
                                    ? 'bg-rose-400 text-white shadow-md scale-110' 
                                    : 'bg-white border border-gray-100 text-gray-400 hover:border-rose-200'}
                                ${!isSelected && isWeekend ? 'text-rose-300' : ''}
                            `}
                         >
                            {getDayLabel(d)}
                         </button>
                     )
                 })}
             </div>
          </div>

          <button
            onClick={handleConfirm}
            disabled={isNameEmpty || !timing || selectedDays.length === 0}
            className="w-full py-3.5 bg-rose-500 text-white rounded-2xl font-bold text-base shadow-lg hover:bg-rose-600 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
           >
             {isEditing ? '儲存變更' : '確認加入清單'}
           </button>

        </div>
      </div>
    </div>
  );
};

export default AddProductModal;
