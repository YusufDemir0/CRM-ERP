import React, { useState } from 'react';
import { FiPlus, FiMinus, FiTrash2, FiSearch } from 'react-icons/fi';
import { Item } from '../../../../types';
import { useSalesWizardStore } from '../../../../store/useSalesWizardStore';
import { SearchableSelect } from '../../../../components/common/SearchableSelect';
import toast from 'react-hot-toast';

interface ProductPhaseProps {
  items: Item[];
}

export const ProductPhase: React.FC<ProductPhaseProps> = ({ items }) => {
  const store = useSalesWizardStore();
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [quantity, setQuantity] = useState(1);

  const handleAddItem = () => {
    if (!selectedItem) return toast.error("Lütfen bir ürün seçin.");
    
    const existing = store.selectedItems.find(i => i.id === selectedItem.id);
    if (existing) {
      store.setSelectedItems(store.selectedItems.map(i => 
        i.id === selectedItem.id ? { ...i, quantity: i.quantity + quantity } : i
      ));
    } else {
      store.setSelectedItems([
        ...store.selectedItems,
        {
          ...selectedItem,
          quantity: quantity,
          unitPrice: Number(selectedItem.salePrice || 0),
          taxRate: 20, // Default tax rate
        }
      ]);
    }
    setSelectedItem(null);
    setQuantity(1);
    toast.success("Ürün eklendi.");
  };

  const handleRemoveItem = (id: number) => {
    store.setSelectedItems(store.selectedItems.filter(i => i.id !== id));
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Product Selection Header */}
      <div className="p-3 border-b border-slate-100 bg-white flex items-end gap-3">
        <div className="flex-1">
          <SearchableSelect
            placeholder="Ürün Seç"
            options={(items || []).map(i => ({ id: i.id, label: i.name }))}
            value={selectedItem?.id || null}
            onChange={(opt) => setSelectedItem(items.find(x => x.id === opt?.id) || null)}
          />
        </div>
        
        <div className="flex items-center bg-[var(--success)] rounded-lg overflow-hidden shadow-md h-8">
          {/* Quantity Section */}
          <div className="flex items-center border-r border-white/20 px-1">
            <button 
              className="w-7 h-full flex items-center justify-center text-white hover:bg-black/10 active:scale-90 transition-all"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <FiMinus size={14} />
            </button>
            <input 
              type="number"
              className="w-10 h-full bg-transparent border-none text-center font-black text-xs tabular-nums text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            />
            <button 
              className="w-7 h-full flex items-center justify-center text-white hover:bg-black/10 active:scale-90 transition-all"
              onClick={() => setQuantity(quantity + 1)}
            >
              <FiPlus size={14} />
            </button>
          </div>

          {/* Add Button Section */}
          <button 
            className="px-5 h-full text-[10px] font-black text-white hover:bg-black/10 active:bg-black/20 transition-all uppercase tracking-widest"
            onClick={handleAddItem}
          >
            EKLE
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="flex-1 overflow-auto bg-white">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-slate-50 shadow-sm z-10">
            <tr className="border-b border-slate-100">
              <th className="p-3 text-left font-black text-[10px] text-slate-400 uppercase tracking-widest w-10">#</th>
              <th className="p-3 text-left font-black text-[10px] text-slate-400 uppercase tracking-widest">Ürün adı</th>
              <th className="p-3 text-right font-black text-[10px] text-slate-400 uppercase tracking-widest">Fiyat</th>
              <th className="p-3 text-center font-black text-[10px] text-slate-400 uppercase tracking-widest w-20">Adet</th>
              <th className="p-3 text-right font-black text-[10px] text-slate-400 uppercase tracking-widest">Tutar</th>
              <th className="p-3 text-center font-black text-[10px] text-slate-400 uppercase tracking-widest w-12"></th>
            </tr>
          </thead>
          <tbody>
            {(store.selectedItems || []).map((item, index) => (
              <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="p-3 text-[10px] font-bold text-slate-300">{index + 1}</td>
                <td className="p-3 text-xs font-black text-slate-700">{item.name}</td>
                <td className="p-3 text-right text-xs font-bold tabular-nums">
                  {item.unitPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                </td>
                <td className="p-3 text-center text-xs font-bold tabular-nums">{item.quantity}</td>
                <td className="p-3 text-right text-xs font-black tabular-nums text-[var(--primary)]">
                  {(item.unitPrice * item.quantity).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                </td>
                <td className="p-3 text-center">
                  <button 
                    className="p-1.5 text-[var(--error)] hover:bg-[var(--error-glow)] rounded-lg transition-colors"
                    onClick={() => handleRemoveItem(item.id)}
                  >
                    <FiTrash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {store.selectedItems.length === 0 && (
              <tr>
                <td colSpan={6} className="p-12 text-center text-slate-300 italic font-bold text-xs uppercase tracking-widest">
                  Henüz ürün eklenmedi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Footer in the table box */}
      <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end gap-8 font-black">
        <div className="flex items-baseline gap-2">
           <span className="text-xs text-slate-400 uppercase tracking-tighter">TOPLAM ADET:</span>
           <span className="text-sm text-slate-700">{store.selectedItems.reduce((acc, i) => acc + i.quantity, 0)}</span>
        </div>
        <div className="flex items-baseline gap-2">
           <span className="text-xs text-slate-400 uppercase tracking-tighter">ARA TOPLAM:</span>
           <span className="text-sm text-[var(--primary)]">
            {store.selectedItems.reduce((acc, i) => acc + (i.unitPrice * i.quantity), 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
           </span>
        </div>
      </div>
    </div>
  );
};
