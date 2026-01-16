import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, AlertCircle, CalendarDays, Clock, Tag, Loader2, ImagePlus } from 'lucide-react';
import { getDayLabel } from '../utils/routineLogic';
import { Product, ProductTiming } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (product: Product) => void;
  onUpdate?: (product: Product) => void;
  initialProduct?: Product | null;
}

const WORKER_URL = "https://skincare.65245.workers.dev";

const PRODUCT_TYPE_OPTIONS = [
    { id: 'CLEANSER', label: '潔顏 (Cleanser)' },
    { id: 'TONER', label: '化妝水 (Toner)' },
    { id: 'ESSENCE', label: '精華液 (Essence)' },
    { id: 'SERUM', label: '精華/安瓶 (Serum)' },
    { id: 'EYE_CREAM', label: '眼霜 (Eye Cream)' },
    { id: 'LOTION', label: '乳液 (Lotion)' },
    { id: 'CREAM', label: '乳霜 (Cream)' },
    { id: 'OIL', label: '保養油 (Oil)' },
    { id: 'SUNSCREEN', label: '防曬 (Sunscreen)' },
    { id: 'MASK', label: '面膜 (Mask)' },
    { id: 'ACID', label: '酸類 (Acid)' },
    { id: 'RETINOL', label: 'A醇 (Retinol)' },
    { id: 'SCRUB', label: '去角質 (Scrub)' },
    { id: 'OTHER', label: '其他 (Other)' },
];

const AddProductModal: React.FC<Props> = ({ isOpen, onClose, onAdd, onUpdate, initialProduct }) => {
  const [name, setName] = useState('');
  const [timing, setTiming] = useState<ProductTiming | null>(null);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [productType, setProductType] = useState<string>('');
  
  const [aiAnalysis, setAiAnalysis] = useState<{reason: string, warning?: string} | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [isAnalyzingText, setIsAnalyzingText] = useState(false);
  
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && initialProduct) {
        setName(initialProduct.name || '');
        setTiming(initialProduct.timing);
        setSelectedDays(initialProduct.days || []);
        setProductType(initialProduct.productType || 'OTHER');
        setAiAnalysis(null);
    } else if (isOpen) {
        setName('');
        setTiming(null);
        setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
        setProductType('');
        setAiAnalysis(null);
    }
  }, [isOpen, initialProduct]);

  const isEditing = !!initialProduct;
  const isNameEmpty = name.trim().length === 0;

  // 🆕 新增：圖片壓縮函式 (幫照片瘦身)
  const compressImage = async (file: File, maxWidth: number = 1024, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // 計算縮放比例
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                // 轉成壓縮後的 Base64 (JPEG 格式)
                const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                // 去除前綴
                resolve(compressedDataUrl.split(',')[1]);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

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

      // 設定較長的 timeout，避免大圖傳輸時瀏覽器放棄
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60秒超時

      const response = await fetch(WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal
      }).finally(() => clearTimeout(timeoutId));

      if (!response.ok) throw new Error(`Worker 連線失敗: ${response.status}`);

      const data = await response.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!aiText) throw new Error("AI 回傳空值");

      const jsonStr = aiText.replace(/```json|```/g, "").trim();
      return JSON.parse(jsonStr);

    } catch (error) {
      console.error("AI Analysis Error:", error);
      throw error;
    }
  };

  // 📸 處理圖片上傳與辨識 (使用壓縮)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzingImage(true);
    try {
      // 1. 壓縮圖片！ (關鍵步驟)
      const base64Data = await compressImage(file);

      // 2. 設定提示詞 (稍微增強一點)
      const prompt = `
        你是一位專業保養品辨識專家。請仔細分析這張圖片中的產品包裝文字。
        請盡可能辨識出品牌和產品名稱 (例如: SK-II 青春露)。
        回傳 JSON 格式：
        {
          "identifiedName": "辨識出的完整產品名稱 (繁體中文為主，或英文)",
          "productType": "從以下清單選擇最接近的: CLEANSER, TONER, ESSENCE, SERUM, EYE_CREAM, LOTION, CREAM, OIL, SUNSCREEN, MASK, ACID, RETINOL, SCRUB",
          "timing": "MORNING, EVENING, 或 BOTH",
          "reason": "一句話解釋判斷依據 (例如：瓶身有清楚的 SK-II Logo)",
          "warning": "如果有酸類或A醇，請簡短提醒，否則留空"
        }
      `;

      // 3. 呼叫 AI
      const result = await callAIWorker(prompt, base64Data);

      // 4. 填入資料
      if (result.identifiedName) setName(result.identifiedName);
      if (result.productType) setProductType(result.productType);
      if (result.timing) setTiming(result.timing);
      
      setAiAnalysis({
        reason: result.reason || "AI 透過圖片辨識",
        warning: result.warning
      });

    } catch (error) {
      console.error(error);
      alert("圖片辨識失敗，可能是網路問題或圖片太模糊，請手動輸入。");
    } finally {
      setIsAnalyzingImage(false);
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  const handleNameBlur = async () => {
    if (isNameEmpty || isAnalyzingImage || isAnalyzingText) return;
    if (productType && timing) return;

    setIsAnalyzingText(true);
    try {
        const prompt = `
            使用者輸入了保養品名稱: "${name}"
            請分析它是什麼類型的產品。
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
        console.log("文字分析略過或失敗");
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
      <div className="absolute inset-0 bg-rose-900/20 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-lg relative overflow-hidden animate-[scaleIn_0.3s_ease-out] border border-white">
        
        <div className="bg-gradient-to-r from-rose-50 to-pink-50 p-6 flex justify-between items-center border-b border-rose-100">
            <h3 className="text-xl font-serif font-bold text-rose-900 flex items-center gap-2">
                {isEditing ? <><Tag size={20}/> 編輯保養品</> : <><Sparkles size={20}/> 新增保養步驟</>}
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-full transition-colors text-gray-500 hover:text-rose-500">
                <X size={20} />
            </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
            
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">產品名稱</label>
            <div className="relative group">
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={handleNameBlur}
                    placeholder="例如：雅詩蘭黛 小棕瓶"
                    className="w-full p-4 pl-5 pr-14 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-rose-200 focus:outline-none transition-all shadow-sm group-hover:border-rose-200"
                />
                
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
            {isAnalyzingText && <p className="text-xs text-rose-400 mt-2 ml-1 animate-pulse">正在分析產品成分與類型...</p>}
          </div>

          {aiAnalysis && (
             <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3 animate-[fadeIn_0.5s]">
                 <Sparkles size={18} className="text-blue-400 shrink-0 mt-0.5" />
                 <div className="text-sm">
                     <p className="text-blue-900 font-medium mb-1">AI 智慧辨識：{PRODUCT_TYPE_OPTIONS.find(o => o.id === productType)?.label.split('(')[0] || productType}</p>
                     <p className="text-blue-600/
