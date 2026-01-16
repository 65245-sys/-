import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, AlertCircle, CalendarDays, Clock, Tag, Loader2, ImagePlus } from 'lucide-react';
import { getDayLabel } from '../utils/routineLogic'; // 這裡不需要再引入 PRODUCT_TAGS 了
import { Product, ProductTiming } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (product: Product) => void;
  onUpdate?: (product: Product) => void;
  initialProduct?: Product | null;
}

// ✅ 設定 Cloudflare Worker 網址
const WORKER_URL = "https://skincare.65245.workers.dev";

// ✅ 【重點修正】直接在這裡定義完整的中文標籤，確保文字一定會顯示！不會再不見了！
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

  // 初始化資料 (編輯模式)
  useEffect(() => {
    if (isOpen && initialProduct) {
        setName(initialProduct.name || '');
        setTiming(initialProduct.timing);
        setSelectedDays(initialProduct.days || []);
        setProductType(initialProduct.productType || 'OTHER');
        setAiAnalysis(null);
    } else if (isOpen) {
        // 新增模式重置
        setName('');
        setTiming(null);
        setSelectedDays([0, 1, 2, 3, 4, 5, 6]); // 預設每天
        setProductType('');
        setAiAnalysis(null);
    }
  }, [isOpen, initialProduct]);

  const isEditing = !!initialProduct;
  const isNameEmpty = name.trim().length === 0;

  // 🛠️ 工具：將圖片檔案轉為 Base64 字串
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

  // 🤖 AI 核心：呼叫 Worker 進行分析 (共用函式)
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

      // 設定一個較短的 timeout，避免卡住太久
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超時

      const response = await fetch(WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("AI Response Error:", errorData);
          throw new Error(errorData.error?.message || `連線失敗 (${response.status})，可能是 AI 伺服器繁忙，請稍後再試。`);
      }

      const data = await response.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!aiText) throw new Error("AI 回傳了空內容，請重試。");

      const jsonStr = aiText.replace(/```json|```/g, "").trim();
      return JSON.parse(jsonStr);

    } catch (error: any) {
      console.error("AI Analysis Error:", error);
      // 如果是 AbortError 表示超時
      if (error.name === 'AbortError') {
          throw new Error("連線逾時，AI 伺服器回應太慢，請稍後再試。");
      }
      throw error;
    }
  };

  // 📸 處理圖片上傳與辨識
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzingImage(true);
    setAiAnalysis(null); // 清除舊訊息
    try {
      const base64Data = await fileToBase64(file);

      const prompt = `
        你是一位專業保養品辨識專家。請仔細分析這張圖片中的產品包裝文字和外觀。
        請盡力辨識知名品牌 (如 SK-II, Estée Lauder 等)。
        回傳 JSON 格式：
        {
          "identifiedName": "辨識出的品牌與產品名稱 (繁體中文優先，若無則英文)",
          "productType": "從以下清單選擇最接近的: CLEANSER, TONER, ESSENCE, SERUM, EYE_CREAM, LOTION, CREAM, OIL, SUNSCREEN, MASK, ACID, RETINOL, SCRUB",
          "timing": "MORNING, EVENING, 或 BOTH",
          "reason": "一句話解釋判斷依據",
          "warning": "如果有酸類或A醇，請簡短提醒，否則留空"
        }
      `;

      const result = await callAIWorker(prompt, base64Data);

      if (result.identifiedName) setName(result.identifiedName);
      if (result.productType) setProductType(result.productType);
      if (result.timing) setTiming(result.timing);
      
      setAiAnalysis({
        reason: result.reason || "AI 透過圖片辨識成功",
        warning: result.warning
      });

    } catch (error: any) {
      alert(`圖片辨識失敗：\n${error.message}\n\n(如果是伺服器繁忙，請等待幾秒後再試一次)`);
    } finally {
      setIsAnalyzingImage(false);
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  // ✍️ 處理文字輸入後的自動分析 (onBlur)
  const handleNameBlur = async () => {
    if (isNameEmpty || isAnalyzingImage || isAnalyzingText) return;
    // 這裡拿掉「已有資料就不分析」的限制，讓使用者修改名稱時也能觸發重新分析
    // if (productType && timing) return;

    setIsAnalyzingText(true);
    setAiAnalysis(null);
    try {
        const prompt = `
            使用者輸入了保養品名稱: "${name}"
            請分析它是什麼類型的產品，並給予使用建議。
            對於知名產品 (如 SK-II 青春露, 小棕瓶)，請提供準確資訊。
            回傳 JSON 格式：
            {
              "productType": "從以下清單選擇: CLEANSER, TONER, ESSENCE, SERUM, EYE_CREAM, LOTION, CREAM, OIL, SUNSCREEN, MASK, ACID, RETINOL, SCRUB",
              "timing": "MORNING, EVENING, 或 BOTH",
              "reason": "簡短判斷理由",
              "warning": "如果是刺激性成分請提醒，否則 null"
            }
        `;

        const result = await callAIWorker(prompt);

        if (result.productType) setProductType(result.productType);
        if (result.timing) setTiming(result.timing);
        setAiAnalysis({
            reason: result.reason,
            warning: result.warning
        });

    } catch (error) {
        console.log("文字分析失敗 (可能是伺服器忙碌，略過提示)");
    } finally {
        setIsAnalyzingText(false);
    }
  };

  const toggleDay = (dayIndex: number) => {
      setSelectedDays(prev =>
        prev.includes(dayIndex)
            ? prev.filter(d => d !== dayIndex)
            : [...prev, dayIndex].sort()
      );
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

      if (isEditing && onUpdate) {
          onUpdate(productData);
      } else {
          onAdd(productData);
      }
      onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-rose-900/20 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      {/* Modal Content */}
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
            
          {/* 1. Name Input with AI & Camera */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">產品名稱</label>
            <div className="relative group">
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={handleNameBlur}
                    placeholder="例如：SK-II 青春露 (輸入後點擊旁邊，AI 將自動分析)"
                    className="w-full p-4 pl-5 pr-14 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-rose-200 focus:outline-none transition-all shadow-sm group-hover:border-rose-200"
                />
                
                {/* Camera Button */}
                <button
                    onClick={() => galleryInputRef.current?.click()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                    title="上傳照片辨識"
                    disabled={isAnalyzingImage}
                >
                    {isAnalyzingImage ? <Loader2 size={20} className="animate-spin text-rose-500"/> : <ImagePlus size={20} />}
                </button>
                <input
                    type="file"
                    ref={galleryInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                />
            </div>
            {isAnalyzingText && <p className="text-xs text-rose-400 mt-2 ml-1 animate-pulse">AI 正在努力分析產品資訊中 (請稍候)...</p>}
          </div>

          {/* AI Feedback Banner */}
          {aiAnalysis && (
             <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3 animate-[fadeIn_0.5s]">
                 <Sparkles size={18} className="text-blue-400 shrink-0 mt-0.5" />
                 <div className="text-sm">
                     <p className="text-blue-900 font-medium mb-1">AI 智慧辨識結果：</p>
                     <p className="text-blue-600/80 leading-relaxed text-xs">{aiAnalysis.reason}</p>
                     {aiAnalysis.warning && (
                         <div className="flex items-center gap-1.5 mt-2 text-rose-500 font-bold text-xs bg-white/60 p-1.5 rounded-lg inline-flex">
                             <AlertCircle size={12} /> {aiAnalysis.warning}
                         </div>
                     )}
                 </div>
             </div>
          )}

          {/* 2. Timing Selection */}
          <div>
             <label className="block text-sm font-bold text-gray-700 mb-3 ml-1 flex items-center gap-2">
                 <Clock size={16} className="text-rose-400"/> 使用時段 (AI 建議)
             </label>
             <div className="grid grid-cols-3 gap-3">
                 {[
                     { value: 'MORNING', label: '早晨 (Day)', icon: '☀️' },
                     { value: 'EVENING', label: '夜間 (Night)', icon: '🌙' },
                     { value: 'BOTH', label: '早晚皆用', icon: '✨' }
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

          {/* 3. Product Type Selector (Manual Override) */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3 ml-1 flex items-center gap-2">
                <Tag size={16} className="text-rose-400"/> 產品類型 (AI 建議，可手動修改)
            </label>
            <div className="flex flex-wrap gap-2">
                {/* ✅ 這裡改用本地定義的清單，保證有字！ */}
                {PRODUCT_TYPE_OPTIONS.map(tag => (
                    <button
                        key={tag.id}
                        onClick={() => setProductType(tag.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border
                            ${productType === tag.id
                                ? 'bg-gray-800 text-white border-gray-800 shadow-md scale-105'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}
                        `}
                    >
                        {tag.label}
                    </button>
                ))}
            </div>
          </div>

          {/* 4. Days Selection */}
          <div>
             <label className="block text-sm font-bold text-gray-700 mb-3 ml-1 flex items-center gap-2">
                 <CalendarDays size={16} className="text-rose-400"/> 使用頻率
             </label>
             <div className="flex justify-between px-1">
                 {[1, 2, 3, 4, 5, 6, 0].map(d => {
                     const isSelected = selectedDays.includes(d);
                     const isWeekend = d === 0 || d === 6;
                     return (
                         <button
                            key={d}
                            onClick={() => toggleDay(d)}
                            className={`
                                w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all
                                ${isSelected 
                                    ? 'bg-rose-400 text-white shadow-md scale-105' 
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

          {/* Action Button */}
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
