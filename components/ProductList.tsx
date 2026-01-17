import React, { useRef, useState } from 'react';
import { Product } from '../types';
import { Trash2, GripVertical, Sparkles, Loader2 } from 'lucide-react';

interface Props {
  products: Product[];
  type: 'MORNING' | 'EVENING';
  dayOfWeek: number; // 0-6
  onRemove: (id: string) => void;
  onReorder?: (id: string, direction: 'up' | 'down') => void;
  onDropItem?: (draggedId: string, targetId: string) => void;
  onAutoSort?: () => void;
  isSorting?: boolean;
}

const ProductList: React.FC<Props> = ({
  products,
  type,
  dayOfWeek,
  onRemove,
  onReorder,
  onDropItem,
  onAutoSort,
  isSorting = false
}) => {
  // 用來記錄目前正在被手指「抓著」的項目 ID
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  
  // 用來防止過度頻繁觸發排序 (簡單的節流閥)
  const lastSwapTime = useRef<number>(0);

  // Filter Logic
  const relevantProducts = products.filter(p => {
    if (!p.days.includes(dayOfWeek)) return false;
    if (type === 'MORNING') return p.timing === 'MORNING' || p.timing === 'BOTH';
    if (type === 'EVENING') return p.timing === 'EVENING' || p.timing === 'BOTH' || (p.timing as string) === 'POST_BOOSTER';
    return false;
  });

  // Sort by 'order' property
  relevantProducts.sort((a, b) => a.order - b.order);

  // --- PC 版的原生拖曳 (保留給電腦用) ---
  const handleDragStart = (e: React.DragEvent<HTMLLIElement>, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setActiveDragId(id);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLIElement>, targetId: string) => {
    e.preventDefault(); // 必要：允許 Drop
    if (!activeDragId || activeDragId === targetId) return;
    
    // 簡單節流，避免畫面閃爍
    const now = Date.now();
    if (now - lastSwapTime.current < 100) return;

    if (onDropItem) {
        onDropItem(activeDragId, targetId);
        lastSwapTime.current = now;
    }
  };

  const handleDragEnd = () => {
    setActiveDragId(null);
  };

  // --- iPhone / Mobile 專用的觸控拖曳邏輯 ---
  const handleTouchStart = (id: string) => {
    setActiveDragId(id);
    // 嘗試觸發震動 (Android 有效，iOS 無效但寫著無妨)
    if (navigator.vibrate) navigator.vibrate(50);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>, currentId: string) => {
    // 1. 阻止畫面捲動 (關鍵！讓手指專注在拖曳)
    e.preventDefault();
    
    // 2. 取得手指現在的座標
    const touch = e.touches[0];
    if (!touch) return;

    // 3. 找出手指底下的元件
    const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!targetElement) return;

    // 4. 往上找，看看手指是不是停在某個 list item 上
    const listRow = targetElement.closest('li[data-product-id]');
    
    if (listRow) {
        const targetId = listRow.getAttribute('data-product-id');
        
        // 5. 如果手指移到了別的項目上，就交換位置
        if (targetId && targetId !== currentId && onDropItem) {
             const now = Date.now();
             // 增加一點延遲防止太敏感亂跳
             if (now - lastSwapTime.current > 150) {
                 onDropItem(currentId, targetId);
                 lastSwapTime.current = now;
                 // 交換瞬間再震動一次 (如果支援)
                 if (navigator.vibrate) navigator.vibrate(20);
             }
        }
    }
  };

  const handleTouchEnd = () => {
    setActiveDragId(null);
  };


  if (relevantProducts.length === 0) {
      return (
          <div className="text-center py-8 text-gray-300 text-sm italic font-serif">
            No routines scheduled
          </div>
      )
  }

  return (
    <div>
        {/* Header Actions */}
        {onAutoSort && relevantProducts.length > 1 && (
            <div className="flex justify-end mb-3">
                <button
                    onClick={onAutoSort}
                    disabled={isSorting}
                    className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-rose-500 bg-rose-50/50 border border-rose-100 px-3 py-1.5 rounded-full hover:bg-rose-100/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSorting ? (
                        <>
                            <Loader2 size={10} className="animate-spin"/> Sorting...
                        </>
                    ) : (
                        <>
                            <Sparkles size={10} /> Smart Sort
                        </>
                    )}
                </button>
            </div>
        )}

        <ul className="space-y-3 relative">
        {/* Connector Line */}
        {relevantProducts.length > 1 && (
            <div className="absolute left-[13px] top-6 bottom-6 w-px bg-gradient-to-b from-gray-200 via-rose-200 to-gray-200 z-0" />
        )}

        {relevantProducts.map((p, index) => {
            const isDragging = activeDragId === p.id;
            
            return (
                <li
                    key={p.id}
                    // 為了觸控邏輯，我們需要把 ID 藏在 DOM 屬性裡
                    data-product-id={p.id}
                    
                    // PC 拖曳設定
                    draggable
                    onDragStart={(e) => handleDragStart(e, p.id)}
                    onDragOver={(e) => handleDragOver(e, p.id)}
                    onDragEnd={handleDragEnd}
                    
                    // 樣式：被拖曳時放大並改變透明度
                    className={`
                        group flex items-center justify-between text-gray-700 text-sm 
                        border p-3.5 rounded-2xl shadow-sm relative z-10 select-none 
                        transition-all duration-200 ease-out
                        ${isDragging 
                            ? 'bg-rose-50 border-rose-300 shadow-xl scale-105 z-50 ring-2 ring-rose-200 opacity-90' 
                            : 'bg-white/70 backdrop-blur-sm border-white hover:border-rose-200 hover:shadow-md'
                        }
                    `}
                >
                <div className="flex items-center flex-1 min-w-0 pointer-events-none">
                    {/* pointer-events-none on content ensures touch logic works smoothly on the handle */}
                    
                    {/* --- 拖曳手把 (Drag Handle) --- */}
                    {/* 我們把觸控事件全部綁定在這裡，確保手指只有按這裡才能拖曳 */}
                    <div
                        className="mr-1 text-gray-300 p-3 -ml-3 pointer-events-auto cursor-grab active:cursor-grabbing touch-none"
                        style={{ touchAction: 'none' }} // 強制關閉瀏覽器預設手勢
                        onTouchStart={() => handleTouchStart(p.id)}
                        onTouchMove={(e) => handleTouchMove(e, p.id)}
                        onTouchEnd={handleTouchEnd}
                    >
                        {/* 這裡我們根據狀態改變圖示顏色，當作視覺回饋 */}
                        <GripVertical size={18} className={`transition-colors ${isDragging ? 'text-rose-500' : 'group-hover:text-rose-300'}`} />
                    </div>

                    {/* Order Number / Icon */}
                    <div className="mr-3 shrink-0 flex flex-col items-center justify-center">
                        {(p.timing as string) === 'POST_BOOSTER' ? (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 text-orange-500 border border-orange-200 flex items-center justify-center text-[10px] font-bold shadow-sm">
                                B+
                            </div>
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-white to-rose-50 text-rose-400 border border-rose-100 flex items-center justify-center text-[10px] font-bold shadow-sm font-serif">
                                {index + 1}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col min-w-0 pr-2">
                        <span className="break-words leading-relaxed font-medium text-gray-800">{p.name}</span>
                        <div className="flex gap-1 mt-1.5">
                            {(p.timing as string) === 'POST_BOOSTER' && (
                                <span className="text-[9px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded border border-orange-100/50">Booster First</span>
                            )}
                            {p.productType && (
                                <span className="text-[9px] bg-gray-50/80 text-gray-500 px-1.5 py-0.5 rounded border border-gray-100">{p.productType}</span>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Actions: 只保留刪除 */}
                <div className="flex items-center pl-2">
                    <button
                        onClick={() => onRemove(p.id)}
                        className="text-gray-300 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-all active:scale-90 pointer-events-auto"
                        title="刪除此產品"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
                </li>
            );
        })}
        </ul>
    </div>
  );
};

export default ProductList;
