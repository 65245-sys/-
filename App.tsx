import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Plus, CheckCircle, Undo2, ChevronLeft, ChevronRight, Moon, Sun, Edit3, Save, Sparkles, Archive, Loader2, Quote, ArrowRight, Settings2, CalendarDays, BookOpen, Feather } from 'lucide-react';
import { DailyLog, DailyLogsMap, Product, RoutineType, MachineMode, DayRoutine } from './types';
import { getDisplayDate, formatDateKey, isSameDay } from './utils/dateUtils';
import { getRoutineForDay, INITIAL_PRODUCTS, analyzeProductInput, getOptimalProductOrder, PRODUCT_ORDER_WEIGHTS, PRODUCT_TAGS, DEFAULT_WEEKLY_SCHEDULE, getThemeType } from './utils/routineLogic';

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

// Helper: Dynamic Theme Background Colors (Based on Theme String, not Day Index)
const getThemeBackgroundClass = (themeName: string) => {
    const type = getThemeType(themeName);
    
    switch(type) {
        case 'PORE':
            return 'bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/60';
        case 'LIFTING':
            return 'bg-gradient-to-br from-violet-50 via-fuchsia-50 to-purple-100/60';
        case 'PLUMPING':
            return 'bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100/60';
        case 'ACID':
            return 'bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100/60';
        case 'MOISTURE':
            return 'bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100/60';
        default:
            return 'bg-gradient-to-br from-gray-50 to-slate-100';
    }
};

// Internal Component: Theme Image Pattern (Replaces Lines) - Based on Theme String
const ThemeFlowerPattern = ({ themeName }: { themeName: string }) => {
    const type = getThemeType(themeName);

    // [圖片欄位設定] - 使用者指定的圖片
    const themeImages = {
        PORE: "https://i.ibb.co/GQVS5HpK/Gemini-Generated-Image-33a1lz33a1lz33a1.png", 
        LIFTING: "https://i.ibb.co/ccL0sjyw/Gemini-Generated-Image-llis6tllis6tllis.png",
        PLUMPING: "https://i.ibb.co/99NrBg9H/Gemini-Generated-Image-b0gs8ub0gs8ub0gs.png",
        ACID: "https://i.ibb.co/x8td9hTN/Gemini-Generated-Image-5e5pep5e5pep5e5p.png",
        MOISTURE: "https://i.ibb.co/XfWzp5WY/IMG-7336.png",
        DEFAULT: "https://i.ibb.co/XfWzp5WY/IMG-7336.png"
    };

    const imageUrl = themeImages[type] || themeImages.DEFAULT;

    return (
        <div 
            className="absolute right-0 top-0 bottom-0 w-3/4 md:w-2/3 pointer-events-none"
            style={{
                // Standard CSS mask-image for fading effect (Left to Right: Transparent -> Opaque)
                maskImage: 'linear-gradient(to left, black 0%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to left, black 0%, transparent 100%)'
            }}
        >
            <img 
                src={imageUrl} 
                alt="Theme Background" 
                // mix-blend-multiply: 讓白色背景變透明，融入卡片底色
                // opacity-50: 稍微調低透明度，呈現浮水印質感
                className="w-full h-full object-cover object-center opacity-50 mix-blend-multiply contrast-110"
            />
        </div>
    );
};

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
  const [aiFeedback, setAiFeedback] = useState<{ title: string; content: string } | null>(null);
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
        name: p.name || '未命名產品', // Safeguard against undefined name
        // Remove legacy POST_BOOSTER if it exists in old data
        timing: ((p.timing as string) === 'POST_BOOSTER' ? 'EVENING' : p.timing) as any,
        productType: p.productType || analyzeProductInput(p.name || '未命名產品').productType,
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
          // 1. 設定 Cloudflare Worker 網址
          const workerUrl = "https://skincare.65245.workers.dev";

          // 2. 準備提示詞
          const promptText = `你是一位專業皮膚科顧問。
    今日膚況: ${conditions.length > 0 ? conditions.join(', ') : '未標註'}
    日記備註: "${note}"

    請回傳 JSON 格式：
    {
      "title": "一句優雅的標題",
      "content": "200字以內的保養建議"
    }`;

          // 3. 發送請求
          const response = await fetch(workerUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: promptText }] }]
            }),
          });

          // 4. 檢查 Cloudflare 是否連線成功
          if (!response.ok) {
            throw new Error(`Worker 連線失敗: ${response.status}`);
          }

          const data = await response.json();

          // 🚨🚨🚨【超級偵探功能】在這裡！🚨🚨🚨
          // 如果 Google 回傳錯誤，這裡會直接跳出視窗告訴你原因
          if (data.error) {
            alert(`Google 拒絕請求！\n錯誤代碼: ${data.error.code}\n錯誤訊息: ${data.error.message}`);
            setIsGeneratingAI(false);
            return; // 停在這裡，不要再往下跑了
          }

          // 5. 如果沒有錯誤，才開始讀取資料
          const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          
          if (!aiText) {
            alert("Google 有回應，但內容是空的！\n完整回應：" + JSON.stringify(data));
            throw new Error("AI 回應為空");
          }

          const jsonStr = aiText.replace(/```json|```/g, "").trim();
          const result = JSON.parse(jsonStr);

          setAiFeedback({
            title: result.title || "肌膚的輕聲細語",
            content: result.content || "暫時無法讀取建議。",
          });

        } catch (error: any) {
          console.error("AI Error:", error);
          // 顯示最後的錯誤訊息
          alert("發生意外錯誤：\n" + error.message);
          
          setAiFeedback({
            title: "連線小狀況",
            content: "目前無法連線到 AI 助理。",
          });
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
    <div className="min-h-screen pb-24 font-sans text-gray-800 selection:bg-rose-200">
      
      {/* Combined Sticky Header Wrapper */}
      <div className="sticky top-0 z-40">
        {/* Header - Glassmorphic */}
        <header className="px-6 py-4 flex justify-between items-center shadow-sm border-b border-white/40 glass-panel relative z-20">
          <div>
            <h1 className="text-3xl font-serif italic font-bold text-rose-900 tracking-wide text-glow">My Skin Diary</h1>
            <p className="text-[10px] text-rose-400 font-bold tracking-[0.2em] uppercase mt-1">Noble Edition</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setIsProductManagerOpen(true)}
              className="bg-white/50 text-rose-400 p-2.5 rounded-full hover:bg-white hover:text-rose-500 transition-all shadow-sm border border-rose-100 hover:shadow-md"
              aria-label="我的保養櫃"
            >
              <Archive size={20} />
            </button>
            <button 
              onClick={() => setIsCalendarOpen(true)}
              className="bg-white/50 text-rose-400 p-2.5 rounded-full hover:bg-white hover:text-rose-500 transition-all shadow-sm border border-rose-100 hover:shadow-md"
              aria-label="開啟月曆"
            >
              <Calendar size={20} />
            </button>
          </div>
        </header>
          {aiFeedback && (
                  <div className="mb-6 mx-4 bg-gradient-to-r from-rose-50 to-orange-50 p-6 rounded-2xl border border-rose-100 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-white rounded-full shadow-sm">
                        <Sparkles className="w-6 h-6 text-rose-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-serif font-medium text-gray-800 mb-2">
                          {aiFeedback.title}
                        </h3>
                        <p className="text-gray-600 leading-relaxed text-sm">
                          {aiFeedback.content}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
        {/* Timeline */}
        <section className="bg-white/30 backdrop-blur-md border-b border-white/20 shadow-sm transition-all py-1 relative z-10">
          <div className="max-w-6xl mx-auto">
              <Timeline 
                  selectedDate={selectedDate} 
                  onSelectDate={handleDateChange} 
                  completedDates={Object.keys(logs).filter(k => logs[k].completed)}
              />
          </div>
        </section>
      </div>

      {/* Main Content: Responsive Grid */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Top Section: Date Info & Machine (Grid on Desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8 items-stretch">
            
            {/* Left: Date/Theme */}
            <div className="md:col-span-7 lg:col-span-8 flex flex-col justify-between">
                <h2 className="text-4xl font-serif font-medium text-gray-800 px-1 mb-4 flex items-center">
                    {getDisplayDate(selectedDate)}
                </h2>
                
                {/* Dynamic Background Card */}
                <div className={`flex-1 p-8 rounded-3xl shadow-lg border border-white/60 relative overflow-hidden transition-all duration-500 group
                    ${getThemeBackgroundClass(defaultRoutine.theme)} backdrop-blur-md`}>
                    
                    {/* Decorative Background Pattern (Image Based) */}
                    <ThemeFlowerPattern themeName={defaultRoutine.theme} />

                    {/* Decorative Elements (Blobs) */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-white/40 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-white/60 to-transparent rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>

                    <div className="relative z-10">
                        <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold bg-white/70 backdrop-blur border border-white text-gray-500 mb-3 shadow-sm tracking-widest uppercase">
                        Today's Theme
                        </span>
                        <h3 className="text-3xl font-serif font-bold text-gray-800 mb-3 tracking-wide drop-shadow-sm">{defaultRoutine.theme}</h3>
                        <p className="text-gray-700 leading-relaxed font-light text-lg drop-shadow-sm mix-blend-hard-light">{defaultRoutine.description}</p>
                    </div>
                </div>
            </div>

            {/* Right: Machine Guide */}
            <div className="md:col-span-5 lg:col-span-4 h-full">
                <div className="glass-panel rounded-3xl p-6 h-full flex flex-col justify-center relative group hover:shadow-xl transition-shadow duration-300">
                    <div className="flex justify-between items-start mb-5">
                        <h3 className="font-bold text-gray-700 flex items-center gap-2 font-serif text-lg">
                            <Sparkles size={18} className="text-rose-400"/> 美容儀模式
                        </h3>
                        <div className="flex gap-1">
                             <button 
                                onClick={() => setIsScheduleModalOpen(true)}
                                className="p-2 rounded-full text-gray-400 hover:text-rose-500 hover:bg-rose-50/50 transition-colors"
                                title="編輯療程安排"
                            >
                                <CalendarDays size={18} />
                            </button>
                            <button 
                                onClick={() => setIsMachineModalOpen(true)}
                                className="p-2 rounded-full text-gray-400 hover:text-rose-500 hover:bg-rose-50/50 transition-colors"
                                title="今日調整"
                            >
                                <Settings2 size={18} />
                            </button>
                        </div>
                    </div>
                    <MachineIndicator modes={activeMachineModes} />
                    <button 
                         onClick={() => setIsMachineModalOpen(true)}
                         className="w-full mt-4 py-2.5 text-xs font-bold text-rose-500 bg-rose-50/50 border border-rose-100/50 rounded-xl hover:bg-rose-100/50 transition-colors flex items-center justify-center gap-1"
                    >
                        <Settings2 size={14} /> 編輯今日行程
                    </button>
                </div>
            </div>
        </div>

        {/* Middle Section: Routines (Split Grid on Desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Morning Routine - WARM/SUN TINT */}
            <section className="bg-gradient-to-br from-amber-50/80 via-white to-orange-50/50 backdrop-blur-md border border-amber-100/50 rounded-3xl p-7 flex flex-col h-full shadow-sm hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-3 mb-6 border-b border-amber-100 pb-4">
                    <div className="p-2 bg-amber-100 rounded-full border border-amber-200 text-amber-500 shadow-sm ring-2 ring-white">
                        <Sun size={24} />
                    </div>
                    <div>
                        <h3 className="font-serif font-bold text-2xl text-amber-950">Morning Ritual</h3>
                        <p className="text-xs text-amber-500 uppercase tracking-widest font-medium">Awaken & Protect</p>
                    </div>
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

            {/* Evening Routine - COOL/MOON TINT */}
            <section className="bg-gradient-to-br from-indigo-50/80 via-white to-slate-50/50 backdrop-blur-md border border-indigo-100/50 rounded-3xl p-7 flex flex-col h-full shadow-sm hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-3 mb-6 border-b border-indigo-100 pb-4">
                    <div className="p-2 bg-indigo-100 rounded-full border border-indigo-200 text-indigo-500 shadow-sm ring-2 ring-white">
                        <Moon size={24} />
                    </div>
                    <div>
                        <h3 className="font-serif font-bold text-2xl text-indigo-950">Evening Ritual</h3>
                        <p className="text-xs text-indigo-500 uppercase tracking-widest font-medium">Repair & Nourish</p>
                    </div>
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
                    className="mt-6 w-full py-3.5 border border-dashed border-indigo-200 rounded-2xl text-indigo-400 text-sm font-bold bg-indigo-50/30 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-500 transition-all flex items-center justify-center gap-2 group"
                >
                    <Plus size={16} className="group-hover:scale-110 transition-transform"/> 加入保養步驟
                </button>
            </section>
        </div>

        {/* Bottom Section: Journal & Diagnosis (Centered) */}
        <section className="max-w-3xl mx-auto">
            <div className="flex justify-between items-end mb-4 px-2">
              <h3 className="font-serif font-bold text-2xl text-gray-800 flex items-center gap-3">
                  <div className="p-1.5 bg-rose-100 rounded-lg text-rose-500">
                    <Edit3 size={18} />
                  </div>
                  Skin Diary & AI Insights
              </h3>
            </div>
            
            <div className="glass-panel rounded-3xl overflow-hidden p-8 mb-8 relative">
                {/* Decoration */}
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                    <Quote size={100} />
                </div>

                {/* Skin Condition Selector */}
                <SkinConditionSelector 
                    selected={skinConditionInput}
                    onChange={setSkinConditionInput}
                />

                <textarea
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder="紀錄更多細節，例如：昨晚使用 A 醇後的肌膚反應..."
                    className="w-full h-32 p-5 bg-white/60 backdrop-blur-sm rounded-2xl focus:ring-2 focus:ring-rose-200 focus:outline-none resize-none text-base text-gray-700 leading-relaxed appearance-none border border-rose-100 mb-6 transition-all placeholder:text-gray-400 shadow-inner"
                />
                
                <div className="flex justify-end">
                    <button 
                        onClick={saveJournal}
                        disabled={isGeneratingAI || (!noteInput.trim() && skinConditionInput.length === 0)}
                        className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-rose-400 to-rose-500 text-white font-bold rounded-2xl shadow-lg shadow-rose-200 hover:shadow-rose-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 disabled:active:scale-100 disabled:hover:translate-y-0"
                    >
                        {isGeneratingAI ? (
                            <><Loader2 size={18} className="animate-spin"/> 正在諮詢 AI 顧問...</>
                        ) : (
                            <><Sparkles size={18} /> {currentLog ? '更新日記並分析' : '儲存日記並分析'}</>
                        )}
                    </button>
                </div>
            </div>

            {/* AI Feedback Card */}
            {feedbackData && (
                <div className="animate-[fadeIn_0.5s_ease-out]">
                    <div className="glass-panel rounded-3xl border border-white/60 shadow-xl overflow-hidden relative">
                        {/* Shimmer overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-rose-50/30 pointer-events-none"></div>

                        {/* 1. Header & Title */}
                        <div className="px-8 py-6 border-b border-rose-100/50 flex items-center gap-4 relative z-10">
                             <div className="bg-gradient-to-br from-rose-100 to-pink-200 p-3 rounded-2xl text-rose-600 shadow-sm ring-4 ring-rose-50">
                                <Sparkles size={22} />
                             </div>
                             <div>
                                 <h4 className="font-serif text-rose-900 font-bold text-2xl tracking-wide">
                                     {feedbackData.title || "AI 美容顧問"}
                                 </h4>
                                 <p className="text-xs text-rose-400 uppercase tracking-widest font-medium mt-1">Personalized Analysis</p>
                             </div>
                        </div>

                        <div className="p-8 space-y-8 relative z-10">
                            {/* 2. Diagnosis Content */}
                            <div className="relative pl-6 border-l-2 border-rose-200">
                                <Quote size={32} className="absolute -top-4 -left-5 text-rose-200/50 fill-rose-100" />
                                <p className="text-gray-600 text-[15px] leading-8 font-light whitespace-pre-line">
                                    {feedbackData.content}
                                </p>
                            </div>

                            {/* 3. Action Item */}
                            {feedbackData.actionItem && (
                                <div className="bg-gradient-to-r from-rose-50/80 to-white border border-rose-100 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
                                    <div className="mt-1 bg-rose-500 text-white text-[10px] px-2.5 py-1 rounded-md font-bold shrink-0 tracking-wider shadow-sm">
                                        ACTION
                                    </div>
                                    <p className="text-rose-800 font-medium text-base">
                                        {feedbackData.actionItem}
                                    </p>
                                </div>
                            )}

                            {/* 4. History Story (Replaces Joke) */}
                            {feedbackData.historyStory && (
                                <div className="pt-2">
                                    <div className="bg-blue-50/60 rounded-xl p-5 border border-blue-100/50 flex items-start gap-4 text-sm text-gray-600 group hover:bg-blue-50 transition-colors">
                                         <div className="bg-white p-2 rounded-full shadow-sm text-blue-400 group-hover:scale-110 transition-transform mt-0.5">
                                            <BookOpen size={20} />
                                         </div>
                                         <div className="flex-1">
                                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-2">History & Culture</span>
                                            <span className="leading-relaxed font-light text-gray-700 text-[15px]">{feedbackData.historyStory}</span>
                                         </div>
                                    </div>
                                </div>
                            )}

                            {/* 5. Quote Section (Motto) - Moved to Bottom */}
                            {feedbackData.quote && (
                                <div className="mt-6 pt-6 border-t border-rose-100/50 flex flex-col items-center justify-center text-center">
                                    <Feather size={18} className="text-rose-300 mb-2" />
                                    <p className="font-serif italic text-gray-600 text-lg leading-relaxed">
                                        "{feedbackData.quote}"
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
      <div className="fixed bottom-0 left-0 w-full p-4 bg-white/70 backdrop-blur-xl border-t border-white/50 z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
        <div className="max-w-md mx-auto">
            {isCompleted ? (
                <button 
                    onClick={toggleComplete}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gray-100/80 text-gray-500 font-bold text-lg shadow-inner active:scale-98 transition-all hover:bg-gray-200/80"
                >
                    <Undo2 size={20} /> 撤銷完成 (Undo)
                </button>
            ) : (
                <button 
                    onClick={toggleComplete}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-rose-400 to-rose-600 text-white font-bold text-lg shadow-lg shadow-rose-200 hover:shadow-rose-300 hover:-translate-y-0.5 active:scale-95 transition-all"
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
