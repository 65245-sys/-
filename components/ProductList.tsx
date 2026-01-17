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
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const lastSwapTime = useRef<number>(0);

  // Filter Logic
  const relevantProducts = products.filter(p => {
    // 🛡️ [修復白屏關鍵]：加上 ?. 防止舊資料沒有 days 欄位時當機
    // 如果 p.days 不存在，我們預設顯示 (return true) 或略過，這裡設為 return false 比較安全
    if (!p.days?.includes(dayOfWeek)) {
        // 如果沒有 days 屬性 (舊資料)，為了不讓它消失，我們暫時預設「每天都顯示」
        if (!p.days) return true;
        return false;
    }

    if (type === 'MORNING') return p.timing === 'MORNING' || p.timing === 'BOTH';
    if (type === 'EVENING') return p.timing === 'EVENING' || p.timing === 'BOTH' || (p.timing as string) === 'POST_BOOSTER';
    return false;
  });

  relevantProducts.sort((a, b) => a.order - b.order);

  // ... (以下拖曳邏輯保持不變) ...
  const handleDragStart = (e: React.DragEvent<HTMLLIElement>, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setActiveDragId(id);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLIElement>, targetId: string) => {
    e.preventDefault();
    if (!activeDragId || activeDragId === targetId) return;
    const now = Date.now();
    if (now - lastSwapTime.current < 100) return;
    if (onDropItem) {
        onDropItem(activeDragId, targetId);
        lastSwapTime.current = now;
    }
  };

  const handleDragEnd = () => { setActiveDragId(null); };

  const handleTouchStart = (id: string) => {
    setActiveDragId(id);
    if (navigator.vibrate) navigator.vibrate(50);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>, currentId: string) => {
    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;
    const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!targetElement) return;
    const listRow = targetElement.closest('li[data-product-id]');
    if (listRow) {
        const targetId = listRow.getAttribute('data-product-id');
        if (targetId && targetId !== currentId && onDropItem) {
             const now = Date.now();
             if (now - lastSwapTime.current > 150) {
                 onDropItem(currentId, targetId);
                 lastSwapTime.current = now;
                 if (navigator.vibrate) navigator.vibrate(20);
             }
        }
    }
  };

  const handleTouchEnd = () => { setActiveDragId(null); };

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
                    {isSorting ? <><Loader2 size={10} className="animate-spin"/> Sorting...</> : <><Sparkles size={10} /> Smart Sort</>}
                </button>
            </div>
        )}

        <ul className="space-y-3 relative">
        {relevantProducts.length > 1 && (
            <div className="absolute left-[13px] top-6 bottom-6 w-px bg-gradient-to-b from-gray-200 via-rose-200 to-gray-200 z-0" />
        )}

        {relevantProducts.map((p, index) => {
            const isDragging = activeDragId === p.id;
            return (
                <li
                    key={p.id}
                    data-product-id={p.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, p.id)}
                    onDragOver={(e) => handleDragOver(e, p.id)}
                    onDragEnd={handleDragEnd}
                    className={`
                        group flex items-center justify-between text-gray-700 text-sm 
                        border p-3.5 rounded-2xl shadow-sm relative z-10 select-none 
                        transition-all duration-200 ease-out
                        ${isDragging ? 'bg-rose-50 border-rose-300 shadow-xl scale-105 z-50 ring-2 ring-rose-200 opacity-90' : 'bg-white/70 backdrop-blur-sm border-white hover:border-rose-200 hover:shadow-md'}
                    `}
                >
                <div className="flex items-center flex-1 min-w-0 pointer-events-none">
                    <div
                        className="mr-1 text-gray-300 p-3 -ml-3 pointer-events-auto cursor-grab active:cursor-grabbing touch-none"
                        style={{ touchAction: 'none' }}
                        onTouchStart={() => handleTouchStart(p.id)}
                        onTouchMove={(e) => handleTouchMove(e, p.id)}
                        onTouchEnd={handleTouchEnd}
                    >
                        <GripVertical size={18} className={`transition-colors ${isDragging ? 'text-rose-500' : 'group-hover:text-rose-300'}`} />
                    </div>

                    <div className="mr-3 shrink-0 flex flex-col items-center justify-center">
                        {(p.timing as string) === 'POST_BOOSTER' ? (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 text-orange-500 border border-orange-200 flex items-center justify-center text-[10px] font-bold shadow-sm">B+</div>
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-white to-rose-50 text-rose-400 border border-rose-100 flex items-center justify-center text-[10px] font-bold shadow-sm font-serif">{index + 1}</div>
                        )}
                    </div>

                    <div className="flex flex-col min-w-0 pr-2">
                        <span className="break-words leading-relaxed font-medium text-gray-800">{p.name}</span>
                        <div className="flex gap-1 mt-1.5">
                            {(p.timing as string) === 'POST_BOOSTER' && <span className="text-[9px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded border border-orange-100/50">Booster First</span>}
                            {p.productType && <span className="text-[9px] bg-gray-50/80 text-gray-500 px-1.5 py-0.5 rounded border border-gray-100">{p.productType}</span>}
                        </div>
                    </div>
                </div>
                
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
