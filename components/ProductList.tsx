import React, { useRef } from 'react';
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
  const dragItem = useRef<string | null>(null);
  const dragOverItem = useRef<string | null>(null);

  // Filter Logic
  const relevantProducts = products.filter(p => {
    // Check Day
    if (!p.days.includes(dayOfWeek)) return false;

    // Check Time
    if (type === 'MORNING') {
        return p.timing === 'MORNING' || p.timing === 'BOTH';
    }
    if (type === 'EVENING') {
        return p.timing === 'EVENING' || p.timing === 'BOTH' || (p.timing as string) === 'POST_BOOSTER';
    }
    return false;
  });

  // Sort by 'order' property
  relevantProducts.sort((a, b) => a.order - b.order);

  const handleDragStart = (e: React.DragEvent<HTMLLIElement>, id: string) => {
    dragItem.current = id;
    // 拖曳時的視覺效果
    e.currentTarget.classList.add('opacity-40', 'scale-95', 'ring-2', 'ring-rose-200');
    
    // 手機震動回饋 (Haptics)
    if (navigator.vibrate) navigator.vibrate(50);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLLIElement>, id: string) => {
    dragOverItem.current = id;
  };

  const handleDragEnd = (e: React.DragEvent<HTMLLIElement>) => {
    // 移除拖曳樣式
    e.currentTarget.classList.remove('opacity-40', 'scale-95', 'ring-2', 'ring-rose-200');
    
    if (dragItem.current && dragOverItem.current && dragItem.current !== dragOverItem.current) {
        if (onDropItem) {
            onDropItem(dragItem.current, dragOverItem.current);
        }
    }
    dragItem.current = null;
    dragOverItem.current = null;
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

        {relevantProducts.map((p, index) => (
            <li
                key={p.id}
                draggable
                onDragStart={(e) => handleDragStart(e, p.id)}
                onDragEnter={(e) => handleDragEnter(e, p.id)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                // 防止長按反白文字 + 優化觸控
                className="group flex items-center justify-between text-gray-700 text-sm bg-white/70 backdrop-blur-sm border border-white p-3.5 rounded-2xl shadow-sm transition-all hover:border-rose-200 relative z-10 hover:shadow-md select-none touch-manipulation"
            >
            <div className="flex items-center flex-1 min-w-0">
                {/* Drag Handle: 關鍵修改 (touch-none, p-3) */}
                <div
                    className="mr-1 text-gray-300 cursor-grab active:cursor-grabbing hover:text-rose-300 p-3 -ml-3 touch-none select-none"
                    onTouchStart={() => { if (navigator.vibrate) navigator.vibrate(50); }}
                >
                    <GripVertical size={18} />
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
            {/* 手機版(預設)直接顯示，桌面版(md)滑鼠移過去才顯示 */}
            <div className="flex items-center opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                <button
                    onClick={() => onRemove(p.id)}
                    className="text-gray-300 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-all active:scale-90"
                    title="刪除此產品"
                >
                    <Trash2 size={16} />
                </button>
            </div>
            </li>
        ))}
        </ul>
    </div>
  );
};

export default ProductList;
