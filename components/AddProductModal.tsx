import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, AlertCircle, CalendarDays, Clock, Tag, Loader2, ImagePlus } from 'lucide-react';
import { analyzeProductWithAI, getDayLabel, analyzeProductImage, PRODUCT_TAGS } from '../utils/routineLogic';
import { Product, ProductTiming } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (product: Product) => void;
  onUpdate?: (product: Product) => void;
  initialProduct?: Product | null;
}

const AddProductModal: React.FC<Props> = ({ isOpen, onClose, onAdd, onUpdate, initialProduct }) => {
  const [name, setName] = useState('');
  const [timing, setTiming] = useState<ProductTiming | null>(null);
  const [selectedDays, setSelectedDays] = useState<number[]>([]); // 0-6
  const [productType, setProductType] = useState<string>('');
  const [aiAnalysis, setAiAnalysis] = useState<{reason: string, warning?: string} | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [isAnalyzingText, setIsAnalyzingText] = useState(false);
  
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Populate data if editing
  useEffect(() => {
    if (isOpen && initialProduct) {
        setName(initialProduct.name || '');
        setTiming(initialProduct.timing);
        setSelectedDays(initialProduct.days || []);
        setProductType(initialProduct.productType || '一般保養');
    } else if (isOpen && !initialProduct) {
        // Reset for new entry
        setName('');
        setTiming(null);
        setSelectedDays([]);
        setProductType('');
        setAiAnalysis(null);
        setIsAnalyzingImage(false);
        setIsAnalyzingText(false);
    }
  }, [isOpen, initialProduct]);

  if (!isOpen) return null;

  const isEditing = !!initialProduct;

  const handleTextAnalyze = async () => {
    const trimmedName = name ? name.trim() : '';
    if (!trimmedName) return;
    
    setIsAnalyzingText(true);
    setAiAnalysis(null);

    try {
        const result = await analyzeProductWithAI(trimmedName);
        setTiming(result.timing);
        setSelectedDays(result.days);
        setProductType(result.productType);
        setAiAnalysis({
            reason: result.reason || '智慧分析完成',
            warning: result.warning
        });
    } catch (error) {
        console.error(error);
        alert("分析失敗，請稍後再試");
    } finally {
        setIsAnalyzingText(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsAnalyzingImage(true);
      try {
          const reader = new FileReader();
          reader.onloadend = async () => {
              const base64String = (reader.result as string).split(',')[1];
              const result = await analyzeProductImage(base64String);
              
              setName(result.name || '未知產品');
              setTiming(result.timing);
              setSelectedDays(result.days);
              setProductType(result.productType);
              setAiAnalysis({
                  reason: result.reason || '圖片辨識分析',
                  warning: result.warning
              });
              setIsAnalyzingImage(false);
          };
          reader.readAsDataURL(file);
      } catch (error) {
          console.error(error);
          setIsAnalyzingImage(false);
          alert("圖片分析失敗，請稍後再試");
      }
      // Reset input value to allow re-uploading the same file if needed
      e.target.value = '';
  };

  const toggleDay = (dayIndex: number) => {
    setSelectedDays(prev => 
      prev.includes(dayIndex) 
        ? prev.filter(d => d !== dayIndex) 
        : [...prev, dayIndex].sort()
    );
  };

  const selectDaysPreset = (type: 'ALL' | 'WEEKDAY' | 'WEEKEND') => {
      if (type === 'ALL') setSelectedDays([0,1,2,3,4,5,6]);
      if (type === 'WEEKDAY') setSelectedDays([1,2,3,4,5]);
      if (type === 'WEEKEND') setSelectedDays([0,6]);
  };

  const handleConfirm = () => {
    const trimmedName = name ? name.trim() : '';
    if (!trimmedName || !timing || selectedDays.length === 0) return;
    
    const productData: Product = {
      id: initialProduct ? initialProduct.id : Date.now().toString(),
      name: trimmedName,
      timing: timing,
      days: selectedDays,
      productType: productType || '一般保養',
      // Order is required by type. For new items, App.tsx will re-assign order. 
      // For updates, preserve existing order.
      order: initialProduct ? initialProduct.order : 0,
      isCustom: true
    };

    if (isEditing && onUpdate) {
        onUpdate(productData);
    } else {
        onAdd(productData);
    }
    
    onClose();
  };

  // 0 = Sun, 1 = Mon ... 6 = Sat
  const daysMap = [0, 1, 2, 3, 4, 5, 6]; 
  const isBusy = isAnalyzingImage || isAnalyzingText;
  const isNameEmpty = !name || !name.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      {/* Responsive Width: max-w-lg on desktop */}
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md md:max-w-lg overflow-hidden animate-[scaleUp_0.2s_ease-out] max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-50 to-white p-6 flex justify-between items-center border-b border-rose-100 sticky top-0 bg-white z-10">
          <h3 className="text-xl font-bold text-gray-800 flex items-center">
             {isEditing ? '編輯保養品' : '新增保養品'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          
          {/* Input Section */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">產品名稱 / 拍照辨識</label>
            <div className="flex gap-2">
               {/* Hidden File Input - Gallery */}
               <input 
                  type="file" 
                  accept="image/*" 
                  ref={galleryInputRef} 
                  className="hidden" 
                  onChange={handleImageUpload}
               />
               
               {/* Gallery/Photo Button */}
               <button 
                 onClick={() => galleryInputRef.current?.click()}
                 className="bg-gray-50 text-gray-500 p-3 rounded-2xl hover:bg-rose-100 hover:text-rose-600 transition-colors shrink-0 flex items-center justify-center border border-transparent"
                 title="上傳照片辨識"
                 disabled={isBusy}
               >
                 {isAnalyzingImage ? <Loader2 size={20} className="animate-spin" /> : <ImagePlus size={20} />}
               </button>

              <input 
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="輸入名稱，例如: 雅詩蘭黛小棕瓶"
                className="flex-1 px-4 py-3 rounded-2xl border border-transparent bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-200 text-gray-800 placeholder-gray-400 min-w-0 transition-all"
              />
              
              <button 
                onClick={handleTextAnalyze}
                disabled={isNameEmpty || isBusy}
                className="bg-rose-50 text-rose-500 px-4 rounded-2xl font-bold text-sm hover:bg-rose-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 shrink-0"
              >
                {isAnalyzingText ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} 
                {isAnalyzingText ? '搜尋中' : 'AI 分析'}
              </button>
            </div>
            
            {/* AI Analysis Result Box */}
            {aiAnalysis && (
                <div className="mt-3 bg-rose-50 p-4 rounded-2xl border border-rose-100 text-sm animate-[fadeIn_0.3s]">
                    <div className="flex items-center text-rose-700 font-bold mb-1">
                        <Sparkles size={14} className="mr-1.5"/> 產品功效與分析：
                    </div>
                    <div className="text-gray-600 leading-relaxed pl-5 mb-1">
                        {aiAnalysis.reason}
                    </div>
                    {aiAnalysis.warning && (
                        <div className="flex items-start text-xs text-amber-600 mt-2 pl-1 bg-amber-50 p-2 rounded-lg border border-amber-100">
                            <AlertCircle size={12} className="mr-1.5 mt-0.5 shrink-0" />
                            {aiAnalysis.warning}
                        </div>
                    )}
                </div>
            )}
          </div>

          {/* Tags Selection */}
          <div>
             <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <Tag size={16} className="text-gray-400" /> 產品分類 (Tag)
             </label>
             <div className="flex flex-wrap gap-2">
                {PRODUCT_TAGS.map(tag => (
                    <button
                        key={tag}
                        onClick={() => setProductType(tag)}
                        className={`
                            px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                            ${productType === tag 
                                ? 'bg-rose-400 text-white border-rose-400' 
                                : 'bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100'}
                        `}
                    >
                        {tag}
                    </button>
                ))}
                {/* Fallback Input if type is not in list but present (e.g. from AI) */}
                {!PRODUCT_TAGS.includes(productType) && productType && (
                     <button className="px-3 py-1.5 rounded-full text-xs font-medium border bg-rose-400 text-white border-rose-400">
                        {productType}
                     </button>
                )}
             </div>
          </div>

          {/* Timing Selection */}
          <div>
             <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <Clock size={16} className="text-gray-400" /> 使用時段
             </label>
             <div className="grid grid-cols-3 gap-2">
                {[
                    { id: 'MORNING', label: '☀️ 晨間' },
                    { id: 'EVENING', label: '🌙 晚間' },
                    { id: 'BOTH', label: '早晚皆可' },
                ].map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setTiming(t.id as ProductTiming)}
                        className={`
                            px-3 py-3 rounded-2xl border text-sm font-medium transition-all
                            ${timing === t.id 
                                ? 'bg-rose-400 text-white border-rose-400 shadow-md' 
                                : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'}
                        `}
                    >
                        {t.label}
                    </button>
                ))}
             </div>
          </div>

          {/* Days Selection */}
          <div>
             <div className="flex justify-between items-center mb-3">
                 <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <CalendarDays size={16} className="text-gray-400" /> 設定週期
                 </label>
                 <div className="flex gap-1">
                     <button onClick={() => selectDaysPreset('ALL')} className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-lg text-gray-600">每天</button>
                     <button onClick={() => selectDaysPreset('WEEKDAY')} className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-lg text-gray-600">平日</button>
                     <button onClick={() => selectDaysPreset('WEEKEND')} className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-lg text-gray-600">週末</button>
                 </div>
             </div>
             
             <div className="flex justify-between gap-1">
                 {daysMap.map((d) => {
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