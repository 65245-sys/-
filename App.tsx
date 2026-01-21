import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Calendar, Plus, CheckCircle, Undo2, ChevronDown, Moon, Sun, Edit3, Sparkles, Archive, Loader2, Quote, Settings, Download, Upload, AlertCircle, Settings2, CalendarDays, BookOpen, Feather, Lock, History } from 'lucide-react';
import { DailyLog, DailyLogsMap, Product, MachineMode, DayRoutine } from './types';
import { getDisplayDate, formatDateKey } from './utils/dateUtils';
import { getRoutineForDay, INITIAL_PRODUCTS, analyzeProductInput, getOptimalProductOrder, DEFAULT_WEEKLY_SCHEDULE, getThemeType } from './utils/routineLogic';

// Components
import Timeline from './components/Timeline';
import MachineIndicator from './components/MachineIndicator';
import ProductList from './components/ProductList';
import AddProductModal from './components/AddProductModal';
import MonthCalendar from './components/MonthCalendar';
import ProductManager from './components/ProductManager';
import SkinConditionSelector from './components/SkinConditionSelector';
import MachineSelectorModal from './components/MachineSelectorModal';
import WeeklyScheduleModal from './components/WeeklyScheduleModal';

// Helper: Dynamic Theme Background Colors
const getThemeBackgroundClass = (themeName: string) => {
    const type = getThemeType(themeName);
    switch(type) {
        case 'PORE': return 'bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/60';
        case 'LIFTING': return 'bg-gradient-to-br from-violet-50 via-fuchsia-50 to-purple-100/60';
        case 'PLUMPING': return 'bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100/60';
        case 'ACID': return 'bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100/60';
        case 'MOISTURE': return 'bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100/60';
        default: return 'bg-gradient-to-br from-gray-50 to-slate-100';
    }
};

const ThemeFlowerPattern = ({ themeName }: { themeName: string }) => {
    const type = getThemeType(themeName);
    const themeImages: Record<string, string> = {
        PORE: "https://i.ibb.co/GQVS5HpK/Gemini-Generated-Image-33a1lz33a1lz33a1.png",
        LIFTING: "https://i.ibb.co/ccL0sjyw/Gemini-Generated-Image-llis6tllis6tllis.png",
        PLUMPING: "https://i.ibb.co/99NrBg9H/Gemini-Generated-Image-b0gs8ub0gs8ub0gs.png",
        ACID: "https://i.ibb.co/x8td9hTN/Gemini-Generated-Image-5e5pep5e5pep5e5p.png",
        MOISTURE: "https://i.ibb.co/XfWzp5WY/IMG-7336.png",
        DEFAULT: "https://i.ibb.co/XfWzp5WY/IMG-7336.png"
    };
    return (
        <div className="absolute right-0 top-0 bottom-0 w-3/4 md:w-2/3 pointer-events-none" style={{ maskImage: 'linear-gradient(to left, black 0%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to left, black 0%, transparent 100%)' }}>
            <img src={themeImages[type] || themeImages.DEFAULT} alt="Theme Background" className="w-full h-full object-cover object-center opacity-50 mix-blend-multiply contrast-110" />
        </div>
    );
};

// --- 設定與備份 Modal ---
const SettingsModal = ({ isOpen, onClose, onImport, onExport }: { isOpen: boolean; onClose: () => void; onImport: (e: React.ChangeEvent<HTMLInputElement>) => void; onExport: () => void }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-[scaleIn_0.2s_ease-out]">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-serif font-bold text-xl text-gray-800 flex items-center gap-2">
                        <Settings className="text-gray-400" size={20} /> 設定與備份
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-700 flex gap-3 items-start">
                        <AlertCircle size={20} className="shrink-0 mt-0.5" />
                        <p>資料目前僅儲存在此手機中。建議定期備份，以免清除瀏覽紀錄後資料遺失。</p>
                    </div>
                    <button onClick={onExport} className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors group">
                        <div className="flex items-center gap-3">
                            <div className="bg-white p-2 rounded-full shadow-sm text-emerald-500"><Download size={20} /></div>
                            <div className="text-left">
                                <span className="block font-bold text-gray-700">匯出備份 (Export)</span>
                                <span className="text-xs text-gray-500">下載資料檔到手機</span>
                            </div>
                        </div>
                    </button>
                    <label className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer group">
                        <div className="flex items-center gap-3">
                            <div className="bg-white p-2 rounded-full shadow-sm text-amber-500"><Upload size={20} /></div>
                            <div className="text-left">
                                <span className="block font-bold text-gray-700">匯入還原 (Import)</span>
                                <span className="text-xs text-gray-500">選擇之前的備份檔 (.json)</span>
                            </div>
                        </div>
                        <input type="file" accept=".json" onChange={onImport} className="hidden" />
                    </label>
                </div>
            </div>
        </div>
    );
};

const App: React.FC = () => {
  // State
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [logs, setLogs] = useState<DailyLogsMap>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [weeklySchedule, setWeeklySchedule] = useState<Record<number, DayRoutine>>(DEFAULT_WEEKLY_SCHEDULE);
  const isLoaded = useRef(false);
  
  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isTimelineOpen, setIsTimelineOpen] = useState(true);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isProductManagerOpen, setIsProductManagerOpen] = useState(false);
  const [isMachineModalOpen, setIsMachineModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // New: 產品選擇模式
  const [isProductSelectorOpen, setIsProductSelectorOpen] = useState(false);
  
  // Input States
  const [noteInput, setNoteInput] = useState('');
  const [skinConditionInput, setSkinConditionInput] = useState<string[]>([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<{ title: string; content: string } | null>(null);
  const [isSorting, setIsSorting] = useState(false);

  // Derived Data
  const dateKey = formatDateKey(selectedDate);
  const currentLog = logs[dateKey];
  const isCompleted = !!currentLog?.completed;
  const defaultRoutine = getRoutineForDay(selectedDate, weeklySchedule);
  const activeMachineModes = currentLog?.machineModes || defaultRoutine.machineModes;

  // --- Date Check ---
  const isPastDate = useMemo(() => {
      const today = new Date();
      today.setHours(0,0,0,0);
      const current = new Date(selectedDate);
      current.setHours(0,0,0,0);
      return current < today;
  }, [selectedDate]);

  // --- Display Logic ---
  const displayProducts = useMemo(() => {
      // 資料清洗：確保取出的產品資料都有 days 欄位
      const sanitize = (list?: Product[]) => {
          if (!list) return undefined;
          return list.map(p => ({
              ...p,
              days: Array.isArray(p.days) ? p.days : [0, 1, 2, 3, 4, 5, 6]
          }));
      };

      if (currentLog?.customRoutine) return sanitize(currentLog.customRoutine)!;
      if (currentLog?.routineSnapshot) return sanitize(currentLog.routineSnapshot)!;
      return products;
  }, [currentLog, products]);

  const hasCustomRoutine = !!(currentLog?.customRoutine || currentLog?.routineSnapshot);

  // Persistence (Load/Save)
  useEffect(() => {
    const savedLogs = localStorage.getItem('skin_logs');
    if (savedLogs) {
        try {
            setLogs(JSON.parse(savedLogs));
        } catch (e) {
            console.error("Failed to parse logs", e);
        }
    }

    const savedSchedule = localStorage.getItem('skin_weekly_schedule');
    if (savedSchedule) setWeeklySchedule(JSON.parse(savedSchedule));

    const savedUnifiedProducts = localStorage.getItem('skin_products_unified');
    let loadedProducts: Product[] = [];
    if (savedUnifiedProducts) {
      try {
          loadedProducts = JSON.parse(savedUnifiedProducts);
      } catch (e) {
          loadedProducts = [...INITIAL_PRODUCTS];
      }
    } else {
      loadedProducts = [...INITIAL_PRODUCTS];
    }

    loadedProducts = loadedProducts.map((p, index) => ({
        ...p,
        name: p.name || '未命名產品',
        timing: ((p.timing as string) === 'POST_BOOSTER' ? 'EVENING' : p.timing) as any,
        productType: p.productType || analyzeProductInput(p.name || '未命名產品').productType,
        order: typeof p.order === 'number' ? p.order : index,
        days: Array.isArray(p.days) ? p.days : [0, 1, 2, 3, 4, 5, 6]
    }));

    setProducts(loadedProducts);
    isLoaded.current = true;
  }, []);

  useEffect(() => { localStorage.setItem('skin_logs', JSON.stringify(logs)); }, [logs]);
  useEffect(() => { if (isLoaded.current) localStorage.setItem('skin_products_unified', JSON.stringify(products)); }, [products]);

  const handleSaveSchedule = (newSchedule: Record<number, DayRoutine>) => {
      setWeeklySchedule(newSchedule);
      localStorage.setItem('skin_weekly_schedule', JSON.stringify(newSchedule));
      setIsScheduleModalOpen(false);
  };

  // ✅ 關鍵：這就是之前消失的函式，現在補回來了！
  const handleDateChange = (date: Date) => {
      setSelectedDate(date);
  };

  // --- Date Change: Load Data ---
  useEffect(() => {
    setNoteInput(logs[dateKey]?.note || '');
    setSkinConditionInput(logs[dateKey]?.skinConditions || []);
    if (logs[dateKey]?.aiResponse) {
        setAiFeedback(logs[dateKey].aiResponse);
    } else if (typeof logs[dateKey]?.aiFeedback === 'string') {
        setAiFeedback({ title: 'AI 紀錄', content: logs[dateKey].aiFeedback as string });
    } else {
        setAiFeedback(null);
    }
  }, [dateKey, logs]);

  // Handlers
  const handleExportData = () => {
    const data = { logs, products, schedule: weeklySchedule, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-skin-diary-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm('確定要匯入此備份嗎？目前的資料將會被覆蓋！')) { e.target.value = ''; return; }
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const json = JSON.parse(event.target?.result as string);
            if (json.logs) { setLogs(json.logs); localStorage.setItem('skin_logs', JSON.stringify(json.logs)); }
            if (json.products) { setProducts(json.products); localStorage.setItem('skin_products_unified', JSON.stringify(json.products)); }
            if (json.schedule) { setWeeklySchedule(json.schedule); localStorage.setItem('skin_weekly_schedule', JSON.stringify(json.schedule)); }
            alert('資料還原成功！網頁將重新整理。');
            window.location.reload();
        } catch (error) { console.error(error); alert('匯入失敗：檔案格式錯誤。'); }
    };
    reader.readAsText(file);
  };

  const toggleComplete = () => {
    setLogs(prev => {
        const currentData = prev[dateKey];
        const isNowCompleted = !currentData?.completed;
        let snapshot = currentData?.customRoutine || currentData?.routineSnapshot;
        if (isNowCompleted && !snapshot) snapshot = [...products];
        return { ...prev, [dateKey]: { ...prev[dateKey], completed: isNowCompleted, timestamp: isNowCompleted ? Date.now() : undefined, note: noteInput, skinConditions: skinConditionInput, customRoutine: snapshot } };
    });
  };

  const saveJournal = async () => {
    const updatedLog = { ...logs[dateKey], completed: logs[dateKey]?.completed || false, note: noteInput, skinConditions: skinConditionInput, customRoutine: logs[dateKey]?.customRoutine };
    setLogs(prev => ({ ...prev, [dateKey]: updatedLog }));
    if (noteInput.trim().length > 1 || skinConditionInput.length > 0) { await generateAIFeedback(noteInput, skinConditionInput); }
  };

  const handleSaveMachineModes = (modes: MachineMode[]) => { setLogs(prev => ({ ...prev, [dateKey]: { ...prev[dateKey], machineModes: modes } })); };

  const generateAIFeedback = async (note: string, conditions: string[]) => {
        setIsGeneratingAI(true);
        try {
          const workerUrl = "https://skincare.65245.workers.dev";
          const promptText = `你是一位專業皮膚科顧問，同時也是一位溫暖、善解人意的閨蜜。今日膚況標籤: ${conditions.join(', ')}。日記與心情備註: "${note}"。請回傳 JSON 格式，包含: { "title": "...", "content": "...", "actionItem": "...", "historyStory": "...", "quote": "..." }`;
          const response = await fetch(workerUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] }), });
          if (!response.ok) throw new Error(`Worker 連線失敗: ${response.status}`);
          const data = await response.json();
          const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!aiText) throw new Error("AI 回應為空");
          const jsonStr = aiText.replace(/```json|```/g, "").trim();
          const result = JSON.parse(jsonStr);
          const feedbackData = { title: result.title || "肌膚的輕聲細語", content: result.content || "暫時無法讀取建議。", ...result };
          setAiFeedback(feedbackData);
          setLogs(prev => ({ ...prev, [dateKey]: { ...prev[dateKey], aiResponse: feedbackData } }));
        } catch (error: any) { console.error("AI Error:", error); alert("發生意外錯誤：\n" + error.message); setAiFeedback({ title: "連線小狀況", content: "目前無法連線到 AI 助理。", }); } finally { setIsGeneratingAI(false); }
  };

  const handleRemoveFromRitual = (id: string) => {
      const newList = displayProducts.filter(p => p.id !== id);
      setLogs(prev => ({ ...prev, [dateKey]: { ...prev[dateKey], customRoutine: newList } }));
  };

  const handleRemoveGlobal = (id: string) => { setProducts(prev => prev.filter(p => p.id !== id)); };

  const handleReorderRitual = (id: string, direction: 'up' | 'down') => {
      const list = [...displayProducts];
      const sortedList = list.sort((a, b) => a.order - b.order);
      const index = sortedList.findIndex(p => p.id === id);
      if (index === -1) return;
      if (direction === 'up' && index > 0) { const temp = sortedList[index].order; sortedList[index].order = sortedList[index - 1].order; sortedList[index - 1].order = temp; }
      else if (direction === 'down' && index < sortedList.length - 1) { const temp = sortedList[index].order; sortedList[index].order = sortedList[index + 1].order; sortedList[index + 1].order = temp; }
      const newList = [...sortedList];
      setLogs(prev => ({ ...prev, [dateKey]: { ...prev[dateKey], customRoutine: newList } }));
      if (!isPastDate) setProducts(newList);
  };

  const handleSelectProduct = (p: Product) => {
      const currentList = displayProducts;
      if (currentList.some(exist => exist.id === p.id)) { alert('這個產品已經在今天的清單囉！'); return; }
      const listWithNewItem = [...currentList, { ...p, order: 999 }];
      const sortedList = listWithNewItem.sort((a, b) => {
          const wA = getOptimalProductOrder(a.productType);
          const wB = getOptimalProductOrder(b.productType);
          if (wA !== wB) return wA - wB;
          return a.name.localeCompare(b.name, 'zh-TW');
      });
      const finalList = sortedList.map((item, idx) => ({ ...item, order: idx }));
      setLogs(prev => ({ ...prev, [dateKey]: { ...prev[dateKey], customRoutine: finalList } }));
      setIsProductSelectorOpen(false);
  };

  const handleCreateNewProduct = (p: Product) => {
      setProducts(prev => {
          const maxOrder = prev.length > 0 ? Math.max(...prev.map(x => x.order)) : 0;
          return [...prev, { ...p, order: maxOrder + 1 }];
      });
      handleSelectProduct({ ...p, order: 999 });
  };

  const handleEditProduct = (p: Product) => { setEditingProduct(p); setIsProductManagerOpen(false); setIsModalOpen(true); };
  const handleUpdateProduct = (updated: Product) => { setProducts(prev => prev.map(p => p.id === updated.id ? updated : p)); };
  const handleCloseModal = () => { setIsModalOpen(false); setEditingProduct(null); };

  const handleAutoSort = (scope: 'MORNING' | 'EVENING') => {
    setIsSorting(true);
    const currentList = [...displayProducts];
    const sortedList = currentList.sort((a, b) => {
        const wA = getOptimalProductOrder(a.productType);
        const wB = getOptimalProductOrder(b.productType);
        if (wA !== wB) return wA - wB;
        return a.name.localeCompare(b.name, 'zh-TW');
    });
    const finalList = sortedList.map((item, idx) => ({ ...item, order: idx }));
    setLogs(prev => ({ ...prev, [dateKey]: { ...prev[dateKey], customRoutine: finalList } }));
    if (!isPastDate) setProducts(finalList);
    setTimeout(() => setIsSorting(false), 300);
  };

  return (
    <div className="min-h-screen pb-24 font-sans text-gray-800 selection:bg-rose-200">
      <div className="fixed top-0 left-0 right-0 z-40 w-full transition-all duration-300">
        <header style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }} className="px-6 pb-4 flex justify-between items-center shadow-sm border-b border-white/40 glass-panel relative z-20 bg-white/80 backdrop-blur-md">
          <div onClick={() => setIsTimelineOpen(!isTimelineOpen)} className="cursor-pointer group select-none">
            <div className="flex items-center gap-2"><h1 className="text-3xl font-serif italic font-bold text-rose-900 tracking-wide text-glow">My Skin Diary</h1><ChevronDown className={`text-rose-400 transition-transform duration-300 ${isTimelineOpen ? 'rotate-180' : ''}`} size={20}/></div>
            <p className="text-[10px] text-rose-400 font-bold tracking-[0.2em] uppercase mt-1 group-hover:text-rose-500 transition-colors">Noble Edition</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setIsProductManagerOpen(true)} className="bg-white/50 text-rose-400 p-2.5 rounded-full hover:bg-white hover:text-rose-500 transition-all shadow-sm border border-rose-100 hover:shadow-md"><Archive size={20} /></button>
            <button onClick={() => setIsCalendarOpen(true)} className="bg-white/50 text-rose-400 p-2.5 rounded-full hover:bg-white hover:text-rose-500 transition-all shadow-sm border border-rose-100 hover:shadow-md"><Calendar size={20} /></button>
            <button onClick={() => setIsSettingsOpen(true)} className="bg-white/50 text-gray-400 p-2.5 rounded-full hover:bg-white hover:text-gray-600 transition-all shadow-sm border border-rose-100 hover:shadow-md"><Settings size={20} /></button>
          </div>
        </header>
        <div className={`overflow-hidden transition-all duration-500 ease-in-out bg-white/30 backdrop-blur-md border-b border-white/20 shadow-sm relative z-10 ${isTimelineOpen ? 'max-h-96 opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-4'}`}>
            <div className="py-1"><div className="max-w-6xl mx-auto"><Timeline selectedDate={selectedDate} onSelectDate={setSelectedDate} completedDates={Object.keys(logs).filter(k => logs[k].completed)} /></div></div>
        </div>
      </div>

      <main className={`max-w-6xl mx-auto px-4 sm:px-6 py-8 transition-all duration-500 ease-in-out ${isTimelineOpen ? 'pt-72' : 'pt-36'}`}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8 items-stretch">
            <div className="md:col-span-7 lg:col-span-8 flex flex-col justify-between">
                <h2 className="text-4xl font-serif font-medium text-gray-800 px-1 mb-4 flex items-center">{getDisplayDate(selectedDate)}</h2>
                <div className={`flex-1 p-8 rounded-3xl shadow-lg border border-white/60 relative overflow-hidden transition-all duration-500 group ${getThemeBackgroundClass(defaultRoutine.theme)} backdrop-blur-md`}>
                    <ThemeFlowerPattern themeName={defaultRoutine.theme} />
                    <div className="relative z-10">
                        <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold bg-white/70 backdrop-blur border border-white text-gray-500 mb-3 shadow-sm tracking-widest uppercase">Today's Theme</span>
                        <h3 className="text-3xl font-serif font-bold text-gray-800 mb-3 tracking-wide drop-shadow-sm">{defaultRoutine.theme}</h3>
                        <p className="text-gray-700 leading-relaxed font-light text-lg drop-shadow-sm mix-blend-hard-light">{defaultRoutine.description}</p>
                    </div>
                </div>
            </div>
            <div className="md:col-span-5 lg:col-span-4 h-full">
                <div className="glass-panel rounded-3xl p-6 h-full flex flex-col justify-center relative group hover:shadow-xl transition-shadow duration-300">
                    <div className="flex justify-between items-start mb-5">
                        <h3 className="font-bold text-gray-700 flex items-center gap-2 font-serif text-lg"><Sparkles size={18} className="text-rose-400"/> 美容儀模式</h3>
                        <div className="flex gap-1"><button onClick={() => setIsScheduleModalOpen(true)} className="p-2 rounded-full text-gray-400 hover:text-rose-500 hover:bg-rose-50/50 transition-colors"><CalendarDays size={18} /></button><button onClick={() => setIsMachineModalOpen(true)} className="p-2 rounded-full text-gray-400 hover:text-rose-500 hover:bg-rose-50/50 transition-colors"><Settings2 size={18} /></button></div>
                    </div>
                    <MachineIndicator modes={activeMachineModes} />
                    <button onClick={() => setIsMachineModalOpen(true)} className="w-full mt-4 py-2.5 text-xs font-bold text-rose-500 bg-rose-50/50 border border-rose-100/50 rounded-xl hover:bg-rose-100/50 transition-colors flex items-center justify-center gap-1"><Settings2 size={14} /> 編輯今日行程</button>
                </div>
            </div>
        </div>

        {hasCustomRoutine && (<div className="mb-4 flex items-center justify-center gap-2 text-gray-500 bg-gray-50/50 p-2 rounded-lg text-xs border border-gray-100">{isPastDate ? <><History size={14} /> <span>歷史紀錄 (編輯不會影響今日)</span></> : <><Lock size={14} /> <span>今日專屬設定 (已與全域連動)</span></>}</div>)}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <section className="bg-gradient-to-br from-amber-50/80 via-white to-orange-50/50 backdrop-blur-md border border-amber-100/50 rounded-3xl p-7 flex flex-col h-full shadow-sm hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-3 mb-6 border-b border-amber-100 pb-4"><div className="p-2 bg-amber-100 rounded-full border border-amber-200 text-amber-500 shadow-sm ring-2 ring-white"><Sun size={24} /></div><div><h3 className="font-serif font-bold text-2xl text-amber-950">Morning Ritual</h3><p className="text-xs text-amber-500 uppercase tracking-widest font-medium">Awaken & Protect</p></div></div>
                <div className="flex-1"><ProductList products={displayProducts} type="MORNING" dayOfWeek={selectedDate.getDay()} onRemove={handleRemoveFromRitual} onReorder={handleReorderRitual} isSorting={isSorting} onAutoSort={() => handleAutoSort('MORNING')} /></div>
                <button onClick={() => setIsProductSelectorOpen(true)} className="mt-6 w-full py-3.5 border border-dashed border-amber-200 rounded-2xl text-amber-500 text-sm font-bold bg-amber-50/30 hover:bg-amber-50 hover:border-amber-300 transition-all flex items-center justify-center gap-2 group"><Plus size={16} className="group-hover:scale-110 transition-transform"/> 加入保養品</button>
            </section>
            <section className="bg-gradient-to-br from-indigo-50/80 via-white to-slate-50/50 backdrop-blur-md border border-indigo-100/50 rounded-3xl p-7 flex flex-col h-full shadow-sm hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-3 mb-6 border-b border-indigo-100 pb-4"><div className="p-2 bg-indigo-100 rounded-full border border-indigo-200 text-indigo-500 shadow-sm ring-2 ring-white"><Moon size={24} /></div><div><h3 className="font-serif font-bold text-2xl text-indigo-950">Evening Ritual</h3><p className="text-xs text-indigo-500 uppercase tracking-widest font-medium">Repair & Nourish</p></div></div>
                <div className="flex-1"><ProductList products={displayProducts} type="EVENING" dayOfWeek={selectedDate.getDay()} onRemove={handleRemoveFromRitual} onReorder={handleReorderRitual} isSorting={isSorting} onAutoSort={() => handleAutoSort('EVENING')} /></div>
                <button onClick={() => setIsProductSelectorOpen(true)} className="mt-6 w-full py-3.5 border border-dashed border-indigo-200 rounded-2xl text-indigo-400 text-sm font-bold bg-indigo-50/30 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-500 transition-all flex items-center justify-center gap-2 group"><Plus size={16} className="group-hover:scale-110 transition-transform"/> 加入保養品</button>
            </section>
        </div>

        <section className="max-w-3xl mx-auto">
            <div className="flex justify-between items-end mb-4 px-2"><h3 className="font-serif font-bold text-2xl text-gray-800 flex items-center gap-3"><div className="p-1.5 bg-rose-100 rounded-lg text-rose-500"><Edit3 size={18} /></div>Skin Diary & AI Insights</h3></div>
            <div className="glass-panel rounded-3xl overflow-hidden p-8 mb-8 relative">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><Quote size={100} /></div>
                <SkinConditionSelector selected={skinConditionInput} onChange={setSkinConditionInput} />
                <textarea value={noteInput} onChange={(e) => setNoteInput(e.target.value)} placeholder="親愛的，今天過得如何？紀錄一下肌膚狀況，或是寫下任何想說的心情，我都在這裡聽..." className="w-full h-32 p-5 bg-white/60 backdrop-blur-sm rounded-2xl focus:ring-2 focus:ring-rose-200 focus:outline-none resize-none text-base text-gray-700 leading-relaxed appearance-none border border-rose-100 mb-6 transition-all placeholder:text-gray-400 shadow-inner" />
                <div className="flex justify-end"><button onClick={saveJournal} disabled={isGeneratingAI || (!noteInput.trim() && skinConditionInput.length === 0)} className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-rose-400 to-rose-500 text-white font-bold rounded-2xl shadow-lg shadow-rose-200 hover:shadow-rose-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 disabled:active:scale-100 disabled:hover:translate-y-0">{isGeneratingAI ? <><Loader2 size={18} className="animate-spin"/> 正在諮詢美容閨蜜...</> : <><Sparkles size={18} /> {currentLog ? '更新日記並分析' : '儲存日記並分析'}</>}</button></div>
                {aiFeedback && (<div className="animate-[fadeIn_0.5s_ease-out] mt-8 pt-8 border-t border-rose-100/50"><div className="glass-panel rounded-3xl border border-white/60 shadow-xl overflow-hidden relative"><div className="p-8 space-y-8 relative z-10"><div className="relative pl-6 border-l-2 border-rose-200"><Quote size={32} className="absolute -top-4 -left-5 text-rose-200/50 fill-rose-100" /><p className="text-gray-600 text-[15px] leading-8 font-light whitespace-pre-line">{aiFeedback.content}</p></div>{(aiFeedback as any).actionItem && <div className="bg-gradient-to-r from-rose-50/80 to-white border border-rose-100 rounded-2xl p-5 flex items-start gap-4 shadow-sm"><div className="mt-1 bg-rose-500 text-white text-[10px] px-2.5 py-1 rounded-md font-bold shrink-0 tracking-wider shadow-sm">ACTION</div><p className="text-rose-800 font-medium text-base">{(aiFeedback as any).actionItem}</p></div>}{(aiFeedback as any).historyStory && <div className="pt-2"><div className="bg-blue-50/60 rounded-xl p-5 border border-blue-100/50 flex items-start gap-4 text-sm text-gray-600 group hover:bg-blue-50 transition-colors"><div className="bg-white p-2 rounded-full shadow-sm text-blue-400 group-hover:scale-110 transition-transform mt-0.5"><BookOpen size={20} /></div><div className="flex-1"><span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-2">History & Culture</span><span className="leading-relaxed font-light text-gray-700 text-[15px]">{(aiFeedback as any).historyStory}</span></div></div></div>}{(aiFeedback as any).quote && <div className="mt-6 pt-6 border-t border-rose-100/50 flex flex-col items-center justify-center text-center"><Feather size={18} className="text-rose-300 mb-2" /><p className="font-serif italic text-gray-600 text-lg leading-relaxed">"{(aiFeedback as any).quote}"</p></div>}</div></div></div>)}
            </div>
        </section>

      </main>

      <div className="fixed bottom-0 left-0 w-full p-4 bg-white/70 backdrop-blur-xl border-t border-white/50 z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
        <div className="max-w-md mx-auto">{isCompleted ? <button onClick={toggleComplete} className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gray-100/80 text-gray-500 font-bold text-lg shadow-inner active:scale-98 transition-all hover:bg-gray-200/80"><Undo2 size={20} /> 撤銷完成 (Undo)</button> : <button onClick={toggleComplete} className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-rose-400 to-rose-600 text-white font-bold text-lg shadow-lg shadow-rose-200 hover:shadow-rose-300 hover:-translate-y-0.5 active:scale-95 transition-all"><CheckCircle size={24} /> 完成今日護膚</button>}</div>
      </div>

      <AddProductModal isOpen={isModalOpen} onClose={handleCloseModal} onAdd={handleCreateNewProduct} onUpdate={handleUpdateProduct} initialProduct={editingProduct} />
      <ProductManager isOpen={isProductManagerOpen} onClose={() => setIsProductManagerOpen(false)} products={products} onRemove={handleRemoveGlobal} onEdit={handleEditProduct} onOpenAddModal={() => { setEditingProduct(null); setIsProductManagerOpen(false); setIsModalOpen(true); }} />
      <ProductManager isOpen={isProductSelectorOpen} onClose={() => setIsProductSelectorOpen(false)} products={products} onRemove={() => {}} onEdit={() => {}} isSelectMode={true} onSelect={handleSelectProduct} onOpenAddModal={() => { setEditingProduct(null); setIsProductSelectorOpen(false); setIsModalOpen(true); }} />
      <MachineSelectorModal isOpen={isMachineModalOpen} onClose={() => setIsMachineModalOpen(false)} selectedDate={selectedDate} currentModes={activeMachineModes} defaultModes={defaultRoutine.machineModes} skinConditions={skinConditionInput} onSave={handleSaveMachineModes} />
      <WeeklyScheduleModal isOpen={isScheduleModalOpen} onClose={() => setIsScheduleModalOpen(false)} schedule={weeklySchedule} onSave={handleSaveSchedule} />
      <MonthCalendar isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} logs={logs} selectedDate={selectedDate} onSelectDate={handleDateChange} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onImport={handleImportData} onExport={handleExportData} />
    </div>
  );
};

export default App;
