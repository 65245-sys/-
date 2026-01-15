import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Plus, CheckCircle, Undo2, ChevronLeft, ChevronRight, Moon, Sun, Edit3, Save, Sparkles, Archive, Loader2, Quote, ArrowRight, Settings2, CalendarDays } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { DailyLog, DailyLogsMap, Product, RoutineType, MachineMode, DayRoutine } from './types';
import { getDisplayDate, formatDateKey, isSameDay } from './utils/dateUtils';
import { getRoutineForDay, INITIAL_PRODUCTS, analyzeProductInput, getOptimalProductOrder, PRODUCT_ORDER_WEIGHTS, PRODUCT_TAGS, DEFAULT_WEEKLY_SCHEDULE } from './utils/routineLogic';

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

const App: React.FC = () => {
  // State
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [logs, setLogs] = useState<DailyLogsMap>({});
  // Unified Product State: This is the ONLY source of truth for products
  const [products, setProducts] = useState<Product[]>([]);
  
  // Weekly Schedule State
  const [weeklySchedule, setWeeklySchedule] = useState<Record<number, DayRoutine>>(DEFAULT_WEEKLY_SCHEDULE);

  const isLoaded = useRef(false); // Ref to track if data has been loaded from LS
  
  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isProductManagerOpen, setIsProductManagerOpen] = useState(false);
  const [isMachineModalOpen, setIsMachineModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  
  // Input States
  const [noteInput, setNoteInput] = useState('');
  const [skinConditionInput, setSkinConditionInput] = useState<string[]>([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isSorting, setIsSorting] = useState(false);

  // Derived Data
  const dateKey = formatDateKey(selectedDate);
  const currentLog = logs[dateKey];
  const isCompleted = !!currentLog?.completed;
  
  // Machine Routine Logic (Priority: Log > Custom Schedule > Default)
  const defaultRoutine = getRoutineForDay(selectedDate, weeklySchedule);
  const activeMachineModes = currentLog?.machineModes || defaultRoutine.machineModes;

  // Persistence (Load)
  useEffect(() => {
    const savedLogs = localStorage.getItem('skin_logs');
    if (savedLogs) setLogs(JSON.parse(savedLogs));

    // Load Schedule
    const savedSchedule = localStorage.getItem('skin_weekly_schedule');
    if (savedSchedule) {
        setWeeklySchedule(JSON.parse(savedSchedule));
    }

    // Migration & Load Logic for Products
    const savedUnifiedProducts = localStorage.getItem('skin_products_unified');
    let loadedProducts: Product[] = [];
    
    if (savedUnifiedProducts) {
      loadedProducts = JSON.parse(savedUnifiedProducts);
    } else {
      loadedProducts = [...INITIAL_PRODUCTS];
    }

    // Ensure types and orders exist (Migration safeguard)
    loadedProducts = loadedProducts.map((p, index) => ({
        ...p,
        // Remove legacy POST_BOOSTER if it exists in old data
        timing: ((p.timing as string) === 'POST_BOOSTER' ? 'EVENING' : p.timing) as any,
        productType: p.productType || analyzeProductInput(p.name).productType,
        order: typeof p.order === 'number' ? p.order : index
    }));

    setProducts(loadedProducts);
    isLoaded.current = true; 
  }, []);

  // Persistence (Save)
  useEffect(() => {
    localStorage.setItem('skin_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    if (isLoaded.current) {
        localStorage.setItem('skin_products_unified', JSON.stringify(products));
    }
  }, [products]);

  // Save Schedule
  const handleSaveSchedule = (newSchedule: Record<number, DayRoutine>) => {
      setWeeklySchedule(newSchedule);
      localStorage.setItem('skin_weekly_schedule', JSON.stringify(newSchedule));
      setIsScheduleModalOpen(false);
  };

  // Sync inputs when date changes
  useEffect(() => {
    setNoteInput(logs[dateKey]?.note || '');
    setSkinConditionInput(logs[dateKey]?.skinConditions || []);
  }, [dateKey, logs]);

  // Handlers
  const toggleComplete = () => {
    setLogs(prev => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        completed: !prev[dateKey]?.completed,
        timestamp: !prev[dateKey]?.completed ? Date.now() : undefined,
        note: noteInput,
        skinConditions: skinConditionInput
      }
    }));
  };

  const saveJournal = async () => {
    const updatedLog = {
      ...logs[dateKey],
      completed: logs[dateKey]?.completed || false,
      note: noteInput,
      skinConditions: skinConditionInput
    };

    setLogs(prev => ({
      ...prev,
      [dateKey]: updatedLog
    }));

    // Trigger AI if there's data to analyze
    if (noteInput.trim().length > 1 || skinConditionInput.length > 0) {
      await generateAIFeedback(noteInput, skinConditionInput);
    }
  };

  const handleSaveMachineModes = (modes: MachineMode[]) => {
      setLogs(prev => ({
          ...prev,
          [dateKey]: {
              ...prev[dateKey], // preserve other log data
              completed: prev[dateKey]?.completed || false,
              note: prev[dateKey]?.note || '',
              machineModes: modes
          }
      }));
  };

  const generateAIFeedback = async (note: string, conditions: string[]) => {
    setIsGeneratingAI(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        你是一位專業、優雅且富有同理心的皮膚科美容顧問。
        
        [使用者資料]
        今日膚況: ${conditions.length > 0 ? conditions.join(', ') : '未特別標註'}
        日記備註: "${note}"

        請以 **JSON 格式** 回傳分析，包含以下欄位：
        
        1. title: 一句優雅、充滿詩意的短標語 (例如：讓肌膚深呼吸的時刻)。
        2. content: **不需要列出具體產品步驟**。請專注於「情緒價值」與「深層保養原理」。
           - 請將內容擴充至 **約 300 字**。
           - 務必 **分段撰寫** (在 JSON 字串中使用 \\n\\n 換行)，至少分為 3 段。
           - 第一段：針對今日膚況與心情的同理與觀察。
           - 第二段：分析膚況成因與保養原理。
           - 第三段：給予溫暖的鼓勵與結尾。
           - 語氣保持溫柔、高雅、專業。
        3. actionItem: 一個具體、簡單的改善小撇步 (例如：多喝一杯溫水，或早點休息)。

        Response Format:
        {
          "title": "...",
          "content": "...",
          "actionItem": "..."
        }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });

      const feedback = response.text;
      
      if (feedback) {
        setLogs(prev => ({
          ...prev,
          [dateKey]: {
            ...prev[dateKey],
            aiFeedback: feedback
          }
        }));
      }

    } catch (error) {
      console.error("AI Generation Error", error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const addProduct = (p: Product) => {
    setProducts(prev => {
        // Assign new product to the end of the list
        const maxOrder = prev.length > 0 ? Math.max(...prev.map(x => x.order)) : 0;
        return [...prev, { ...p, order: maxOrder + 1 }];
    });
  };

  const updateProduct = (updated: Product) => {
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const removeProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const reorderProduct = (id: string, direction: 'up' | 'down') => {
      setProducts(prev => {
          const list = [...prev].sort((a, b) => a.order - b.order);
          const index = list.findIndex(p => p.id === id);
          if (index === -1) return prev;

          if (direction === 'up' && index > 0) {
              const temp = list[index].order;
              list[index].order = list[index - 1].order;
              list[index - 1].order = temp;
          } else if (direction === 'down' && index < list.length - 1) {
              const temp = list[index].order;
              list[index].order = list[index + 1].order;
              list[index + 1].order = temp;
          }
          return [...list]; 
      });
  };

  const handleDragDrop = (draggedId: string, targetId: string) => {
      setProducts(prev => {
          const list = [...prev].sort((a, b) => a.order - b.order);
          const draggedIndex = list.findIndex(p => p.id === draggedId);
          const targetIndex = list.findIndex(p => p.id === targetId);

          if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) return prev;

          // Remove dragged item
          const [removed] = list.splice(draggedIndex, 1);
          // Insert at new position
          list.splice(targetIndex, 0, removed);

          // Re-assign orders
          return list.map((p, idx) => ({ ...p, order: idx }));
      });
  };

  // Local Rules Sort (Scoped & Isolated)
  // This ensures that sorting "Morning" does not affect the relative order of pure "Evening" items
  const handleAutoSort = (scope: 'MORNING' | 'EVENING') => {
    setIsSorting(true);

    const performLocalSort = (currentProducts: Product[]) => {
        // 1. Identify products that belong to this scope
        // We include 'BOTH' because they need to be sorted within this routine, 
        // but this logic preserves the "slots" used by these items so it doesn't 
        // arbitrarily push pure-other-scope items around.
        const scopeProducts = currentProducts.filter(p => {
             if (scope === 'MORNING') return p.timing === 'MORNING' || p.timing === 'BOTH';
             if (scope === 'EVENING') return p.timing === 'EVENING' || p.timing === 'BOTH';
             return false;
        });

        // 2. Capture the set of "order" indices currently used by these products.
        // We will recycle these indices. This is the key to isolation.
        // It ensures we don't steal index '5' if it belongs to a product purely in the other routine.
        const availableIndices = scopeProducts.map(p => p.order).sort((a, b) => a - b);

        // 3. Sort the scope products based on the business logic (Type Weight -> Name)
        const sortedScopeProducts = [...scopeProducts].sort((a, b) => {
            const wA = getOptimalProductOrder(a.productType);
            const wB = getOptimalProductOrder(b.productType);
            // Sort by type weight first
            if (wA !== wB) return wA - wB;
            // Then by name for stability within same type (using TW locale)
            return a.name.localeCompare(b.name, 'zh-TW');
        });

        // 4. Map the sorted products to the recycled indices
        const newOrderMap = new Map<string, number>();
        sortedScopeProducts.forEach((p, idx) => {
            newOrderMap.set(p.id, availableIndices[idx]);
        });

        // 5. Apply updates to the full product list
        return currentProducts.map(p => {
            if (newOrderMap.has(p.id)) {
                return { ...p, order: newOrderMap.get(p.id)! };
            }
            return p;
        });
    };

    setProducts(prev => performLocalSort(prev));
    setTimeout(() => setIsSorting(false), 300);
  };

  const handleEditProduct = (p: Product) => {
      setEditingProduct(p);
      setIsProductManagerOpen(false); // Close manager
      setIsModalOpen(true); // Open modal
  };

  const handleCloseModal = () => {
      setIsModalOpen(false);
      setEditingProduct(null); // Clear editing state
  };

  const handleDateChange = (date: Date) => {
      setSelectedDate(date);
  };

  // Helper to parse AI Feedback
  const parseFeedback = (jsonString: string) => {
      try {
          return JSON.parse(jsonString);
      } catch (e) {
          // Fallback if not JSON
          return { content: jsonString };
      }
  };

  const feedbackData = currentLog?.aiFeedback ? parseFeedback(currentLog.aiFeedback) : null;

  return (
    <div className="min-h-screen pb-24 font-sans text-gray-800 selection:bg-rose-200 bg-[#FDF2F8]">
      
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md sticky top-0 z-40 border-b border-rose-100 px-6 py-4 flex justify-between items-center shadow-sm">
        <div>
           <h1 className="text-2xl font-bold text-rose-900 tracking-tight">My Skin Diary</h1>
           <p className="text-xs text-rose-400 font-medium tracking-widest uppercase">Noble Edition</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsProductManagerOpen(true)}
            className="bg-rose-50 text-rose-500 p-2.5 rounded-full hover:bg-rose-100 transition-colors shadow-sm"
            aria-label="我的保養櫃"
          >
            <Archive size={20} />
          </button>
          <button 
            onClick={() => setIsCalendarOpen(true)}
            className="bg-rose-50 text-rose-500 p-2.5 rounded-full hover:bg-rose-100 transition-colors shadow-sm"
            aria-label="開啟月曆"
          >
            <Calendar size={20} />
          </button>
        </div>
      </header>

      {/* Timeline - Sticky Added */}
      <section className="sticky top-[73px] z-30 bg-[#FDF2F8]/95 backdrop-blur-sm border-b border-rose-100/50 shadow-sm transition-all">
        <div className="max-w-6xl mx-auto">
             <Timeline 
                selectedDate={selectedDate} 
                onSelectDate={handleDateChange} 
                completedDates={Object.keys(logs).filter(k => logs[k].completed)}
            />
        </div>
      </section>

      {/* Main Content: Responsive Grid */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Top Section: Date Info & Machine (Grid on Desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8 items-start">
            
            {/* Left: Date/Theme */}
            <div className="md:col-span-7 lg:col-span-8 space-y-2">
                <h2 className="text-3xl font-bold text-gray-800 px-1">{getDisplayDate(selectedDate)}</h2>
                <div className={`p-6 rounded-2xl shadow-sm border border-opacity-50 relative overflow-hidden transition-all duration-500
                ${defaultRoutine.isRestDay ? 'bg-gradient-to-br from-gray-50 to-slate-100 border-gray-200' : 'bg-gradient-to-br from-rose-50 to-pink-100 border-rose-200'}`}>
                    
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white opacity-40 rounded-full blur-2xl pointer-events-none"></div>

                    <div className="relative z-10">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-white/60 backdrop-blur text-gray-600 mb-2 shadow-sm">
                        今日主題
                        </span>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{defaultRoutine.theme}</h3>
                        <p className="text-gray-600 leading-relaxed opacity-90">{defaultRoutine.description}</p>
                    </div>
                </div>
            </div>

            {/* Right: Machine Guide */}
            <div className="md:col-span-5 lg:col-span-4 h-full">
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm h-full flex flex-col justify-center relative group">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <Sparkles size={18} className="text-rose-400"/> 美容儀模式
                        </h3>
                        <div className="flex gap-1">
                             {/* New Edit Weekly Schedule Button */}
                             <button 
                                onClick={() => setIsScheduleModalOpen(true)}
                                className="p-2 rounded-full text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                                title="編輯療程安排"
                            >
                                <CalendarDays size={18} />
                            </button>
                            {/* Existing Daily Adjust Button */}
                            <button 
                                onClick={() => setIsMachineModalOpen(true)}
                                className="p-2 rounded-full text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                                title="今日調整"
                            >
                                <Settings2 size={18} />
                            </button>
                        </div>
                    </div>
                    <MachineIndicator modes={activeMachineModes} />
                    <button 
                         onClick={() => setIsScheduleModalOpen(true)}
                         className="w-full mt-3 py-2 text-xs font-bold text-rose-400 bg-rose-50/50 rounded-lg hover:bg-rose-100/50 transition-colors flex items-center justify-center gap-1"
                    >
                        <CalendarDays size={14} /> 編輯每週行程
                    </button>
                </div>
            </div>
        </div>

        {/* Middle Section: Routines (Split Grid on Desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            {/* Morning Routine */}
            <section className="bg-white rounded-3xl p-6 shadow-lg shadow-gray-100 border border-gray-50 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                    <Sun className="text-amber-500" size={24} />
                    <h3 className="font-bold text-xl text-gray-800">早間護膚</h3>
                </div>
                <div className="flex-1">
                    <ProductList 
                        products={products}
                        type="MORNING"
                        dayOfWeek={selectedDate.getDay()}
                        onRemove={removeProduct}
                        onReorder={reorderProduct}
                        onDropItem={handleDragDrop}
                        onAutoSort={() => handleAutoSort('MORNING')}
                        isSorting={isSorting}
                    />
                </div>
            </section>

            {/* Evening Routine */}
            <section className="bg-white rounded-3xl p-6 shadow-lg shadow-gray-100 border border-gray-50 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                    <Moon className="text-indigo-500" size={24} />
                    <h3 className="font-bold text-xl text-gray-800">晚間護膚</h3>
                </div>
                <div className="flex-1">
                    <ProductList 
                        products={products}
                        type="EVENING"
                        dayOfWeek={selectedDate.getDay()}
                        onRemove={removeProduct}
                        onReorder={reorderProduct}
                        onDropItem={handleDragDrop}
                        onAutoSort={() => handleAutoSort('EVENING')}
                        isSorting={isSorting}
                    />
                </div>
                
                <button 
                    onClick={() => {
                        setEditingProduct(null);
                        setIsModalOpen(true);
                    }}
                    className="mt-6 w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm font-medium hover:border-rose-300 hover:text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center gap-2"
                >
                    <Plus size={16} /> 加入新產品
                </button>
            </section>
        </div>

        {/* Bottom Section: Journal & Diagnosis (Centered) */}
        <section className="max-w-3xl mx-auto">
            <div className="flex justify-between items-end mb-3">
              <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                  <Edit3 size={20} className="text-rose-400"/>
                  肌膚日記與診斷
              </h3>
            </div>
            
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden p-6 mb-6">
                
                {/* Skin Condition Selector */}
                <SkinConditionSelector 
                    selected={skinConditionInput}
                    onChange={setSkinConditionInput}
                />

                <textarea
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder="紀錄更多細節（例如：昨晚用 A 醇後有點刺痛...）"
                    className="w-full h-32 p-4 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-rose-100 focus:outline-none resize-none text-base text-gray-600 leading-relaxed appearance-none border border-gray-100 mb-4 transition-all"
                />
                
                <div className="flex justify-end">
                    <button 
                        onClick={saveJournal}
                        disabled={isGeneratingAI || (!noteInput.trim() && skinConditionInput.length === 0)}
                        className="flex items-center gap-2 px-8 py-3 bg-rose-500 text-white font-bold rounded-xl shadow-md hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                    >
                        {isGeneratingAI ? (
                            <><Loader2 size={18} className="animate-spin"/> AI 診斷中...</>
                        ) : (
                            <><Sparkles size={18} /> {currentLog ? '更新並重新分析' : '儲存並分析'}</>
                        )}
                    </button>
                </div>
            </div>

            {/* AI Feedback Card */}
            {feedbackData && (
                <div className="animate-[fadeIn_0.5s_ease-out]">
                    <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/50 shadow-sm overflow-hidden">
                        {/* 1. Header & Title */}
                        <div className="px-6 py-5 border-b border-rose-50/50 flex items-center gap-3">
                             <div className="bg-rose-100 p-2.5 rounded-full text-rose-500">
                                <Sparkles size={20} />
                             </div>
                             <div>
                                 <h4 className="font-serif text-rose-900 font-bold text-xl tracking-wide">
                                     {feedbackData.title || "AI 美容顧問"}
                                 </h4>
                             </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* 2. Diagnosis Content */}
                            <div className="relative">
                                <Quote size={24} className="absolute -top-3 -left-2 text-rose-200 fill-rose-50" />
                                <p className="text-gray-600 text-base leading-8 pl-8 relative z-10 whitespace-pre-line">
                                    {feedbackData.content}
                                </p>
                            </div>

                            {/* 3. Action Item */}
                            {feedbackData.actionItem && (
                                <div className="bg-gradient-to-r from-rose-50 to-white border border-rose-100 rounded-2xl p-4 flex items-start gap-4 shadow-sm">
                                    <div className="mt-0.5 bg-rose-500 text-white text-[10px] px-2 py-1 rounded font-bold shrink-0">
                                        ACTION
                                    </div>
                                    <p className="text-rose-700 font-medium text-base">
                                        {feedbackData.actionItem}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>

      </main>

      {/* Floating Action Button Bar */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-white/80 backdrop-blur-lg border-t border-gray-100 z-20 shadow-[0_-5px_15px_rgba(0,0,0,0.02)]">
        <div className="max-w-md mx-auto">
            {isCompleted ? (
                <button 
                    onClick={toggleComplete}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gray-100 text-gray-500 font-bold text-lg shadow-inner active:scale-98 transition-all"
                >
                    <Undo2 size={20} /> 撤銷完成 (Undo)
                </button>
            ) : (
                <button 
                    onClick={toggleComplete}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-rose-400 to-pink-500 text-white font-bold text-lg shadow-lg shadow-rose-200 hover:shadow-rose-300 active:scale-95 transition-all"
                >
                    <CheckCircle size={24} /> 完成今日護膚
                </button>
            )}
        </div>
      </div>

      {/* Modals */}
      <AddProductModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        onAdd={addProduct} 
        onUpdate={updateProduct}
        initialProduct={editingProduct}
      />

      <ProductManager
        isOpen={isProductManagerOpen}
        onClose={() => setIsProductManagerOpen(false)}
        products={products}
        onRemove={removeProduct}
        onEdit={handleEditProduct}
        onOpenAddModal={() => {
            setEditingProduct(null);
            setIsProductManagerOpen(false);
            setIsModalOpen(true);
        }}
      />

      <MachineSelectorModal
        isOpen={isMachineModalOpen}
        onClose={() => setIsMachineModalOpen(false)}
        selectedDate={selectedDate}
        currentModes={activeMachineModes}
        defaultModes={defaultRoutine.machineModes}
        skinConditions={skinConditionInput}
        onSave={handleSaveMachineModes}
      />

      <WeeklyScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        schedule={weeklySchedule}
        onSave={handleSaveSchedule}
      />

      <MonthCalendar 
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        logs={logs}
        selectedDate={selectedDate}
        onSelectDate={handleDateChange}
      />

    </div>
  );
};

export default App;