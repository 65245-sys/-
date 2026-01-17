import React from 'react';
import { X, Trash2, Plus, Edit2, Archive, Package, CheckCircle2 } from 'lucide-react';
import { Product } from '../types';
import { getTimingLabel } from '../utils/routineLogic';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onRemove: (id: string) => void;
  onEdit: (product: Product) => void;
  onOpenAddModal: () => void;
  // 新增：選擇模式用的 Props
  onSelect?: (product: Product) => void;
  isSelectMode?: boolean;
}

const ProductManager: React.FC<Props> = ({
  isOpen,
  onClose,
  products,
  onRemove,
  onEdit,
  onOpenAddModal,
  onSelect,
  isSelectMode = false
}) => {
  if (!isOpen) return null;

  const displayProducts = [...products].sort((a, b) => a.name.localeCompare(b.name, 'zh-TW'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-rose-950/20 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md md:max-w-3xl h-[85vh] flex flex-col overflow-hidden animate-[scaleUp_0.2s_ease-out]">
        
        {/* Header */}
        <div className={`p-6 border-b flex justify-between items-center shrink-0 ${isSelectMode ? 'bg-indigo-50 border-indigo-100' : 'bg-gradient-to-r from-rose-50 to-white border-rose-100'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isSelectMode ? 'bg-indigo-100 text-indigo-500' : 'bg-rose-100 text-rose-500'}`}>
               {isSelectMode ? <CheckCircle2 size={22} /> : <Archive size={22} />}
            </div>
            <div>
                <h3 className="text-xl font-bold text-gray-800">{isSelectMode ? '選擇要加入的保養品' : '我的保養櫃'}</h3>
                <p className={`text-xs ${isSelectMode ? 'text-indigo-400' : 'text-rose-400'}`}>
                    {isSelectMode ? '點擊產品即可加入今日行程' : '管理所有擁有的保養品'}
                </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={26} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar bg-gray-50/50">
            
            <ul className="space-y-3 md:grid md:grid-cols-2 md:space-y-0 md:gap-4">
                {displayProducts.map((p) => (
                    <li
                        key={p.id}
                        // 如果是選擇模式，點擊整個卡片就觸發選擇
                        onClick={() => isSelectMode && onSelect && onSelect(p)}
                        className={`
                            flex items-center justify-between bg-white border p-3 rounded-2xl shadow-sm transition-all group h-full
                            ${isSelectMode 
                                ? 'cursor-pointer hover:border-indigo-300 hover:shadow-md hover:bg-indigo-50/30 border-gray-200' 
                                : 'border-gray-100 hover:border-rose-200'}
                        `}
                    >
                      <div className="flex items-center gap-3 overflow-hidden flex-1">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isSelectMode ? 'bg-indigo-50 text-indigo-300' : 'bg-rose-50 text-rose-300'}`}>
                           <Package size={20} />
                        </div>
                        
                        <div className="flex flex-col min-w-0 pr-2">
                           <span className="font-medium text-gray-800 text-sm break-words leading-relaxed truncate block max-w-[150px]">{p.name}</span>
                           <div className="flex flex-wrap gap-1 mt-1 items-center">
                               {p.productType && (
                                   <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                                       {p.productType}
                                   </span>
                               )}
                               <span className={`text-[10px] px-1.5 py-0.5 rounded border ${isSelectMode ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                   {getTimingLabel(p.timing)}
                               </span>
                           </div>
                        </div>
                      </div>
                      
                      {/* 只有在「管理模式」才顯示編輯/刪除按鈕 */}
                      {!isSelectMode && (
                          <div className="flex gap-1 shrink-0">
                              <button
                                onClick={(e) => { e.stopPropagation(); onEdit(p); }}
                                className="text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 p-2 rounded-lg transition-all"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); onRemove(p.id); }}
                                className="text-gray-300 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-all"
                              >
                                <Trash2 size={18} />
                              </button>
                          </div>
                      )}
                      
                      {/* 選擇模式顯示加號 */}
                      {isSelectMode && (
                          <div className="text-indigo-200 group-hover:text-indigo-500 pr-2">
                              <Plus size={20} />
                          </div>
                      )}
                    </li>
                ))}

                <li className="pt-0 md:col-span-2">
                    <button
                        onClick={onOpenAddModal}
                        className={`w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed rounded-2xl font-bold text-sm transition-all active:scale-95
                            ${isSelectMode 
                                ? 'border-indigo-200 text-indigo-400 hover:bg-indigo-50 hover:border-indigo-300' 
                                : 'border-rose-200 text-rose-400 hover:bg-rose-50 hover:border-rose-300'}
                        `}
                    >
                        <Plus size={18} /> 建立新保養品
                    </button>
                </li>
            </ul>
        </div>
      </div>
    </div>
  );
};

export default ProductManager;
