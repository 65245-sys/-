import React from 'react';
import { X, Trash2, Plus, Edit2, Archive, Package } from 'lucide-react';
import { Product } from '../types';
import { getDayLabel, getTimingLabel } from '../utils/routineLogic';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onRemove: (id: string) => void;
  onEdit: (product: Product) => void;
  onOpenAddModal: () => void;
}

const ProductManager: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  products,
  onRemove,
  onEdit,
  onOpenAddModal
}) => {
  if (!isOpen) return null;

  // Sort purely by name for an inventory-like feel, ignoring execution order
  const displayProducts = [...products].sort((a, b) => a.name.localeCompare(b.name, 'zh-TW'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-rose-950/20 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      {/* Responsive Width: max-w-md on mobile, max-w-3xl on desktop */}
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md md:max-w-3xl h-[85vh] flex flex-col overflow-hidden animate-[scaleUp_0.2s_ease-out]">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-rose-50 to-white border-b border-rose-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-rose-100 p-2.5 rounded-xl text-rose-500">
               <Archive size={22} />
            </div>
            <div>
                <h3 className="text-xl font-bold text-gray-800">我的保養櫃</h3>
                <p className="text-xs text-rose-400">管理所有擁有的保養品</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={26} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar bg-gray-50/50">
            
            {/* List */}
            <ul className="space-y-3 md:grid md:grid-cols-2 md:space-y-0 md:gap-4">
                {displayProducts.map((p) => (
                    <li key={p.id} className="flex items-center justify-between bg-white border border-gray-100 p-3 rounded-2xl shadow-sm hover:border-rose-200 transition-colors group h-full">
                      
                      <div className="flex items-center gap-3 overflow-hidden flex-1">
                        {/* Generic Icon instead of Number */}
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-rose-50 text-rose-300">
                           <Package size={20} />
                        </div>
                        
                        <div className="flex flex-col min-w-0 pr-2">
                           <span className="font-medium text-gray-800 text-sm break-words leading-relaxed truncate block max-w-[150px]">{p.name}</span>
                           
                           {/* Meta Info */}
                           <div className="flex flex-wrap gap-1 mt-1 items-center">
                               {p.productType && (
                                   <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 flex items-center gap-0.5">
                                       {p.productType}
                                   </span>
                               )}
                               <span className="text-[10px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded border border-rose-100">
                                   {getTimingLabel(p.timing)}
                               </span>
                           </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-1 shrink-0">
                          <button 
                            onClick={() => onEdit(p)}
                            className="text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 p-2 rounded-lg transition-all"
                            title="編輯"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => onRemove(p.id)}
                            className="text-gray-300 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-all"
                            title="刪除"
                          >
                            <Trash2 size={18} />
                          </button>
                      </div>
                    </li>
                ))}

                {/* Add Button Item */}
                <li className="pt-0 md:col-span-2">
                    <button 
                        onClick={onOpenAddModal}
                        className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-rose-200 rounded-2xl text-rose-400 font-bold text-sm hover:bg-rose-50 hover:border-rose-300 transition-all active:scale-95"
                    >
                        <Plus size={18} /> 新增保養品
                    </button>
                </li>
            </ul>

        </div>
      </div>
    </div>
  );
};

export default ProductManager;