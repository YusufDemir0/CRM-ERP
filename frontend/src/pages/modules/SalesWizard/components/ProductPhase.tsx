import React, { useState } from 'react';
import { FiPlus, FiMinus, FiTrash2 } from 'react-icons/fi';
import { Decimal } from 'decimal.js';
import { Item } from '../../../../types';
import { SearchableSelect } from '../../../../components/common/SearchableSelect';
import toast from 'react-hot-toast';
import { useFormContext, useFieldArray, useWatch } from 'react-hook-form';
import { SalesWizardFormData } from '../schema';

interface ProductPhaseProps {
  items: Item[];
}

export const ProductPhase: React.FC<ProductPhaseProps> = ({ items }) => {
  const { control } = useFormContext<SalesWizardFormData>();
  
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'items'
  });

  const formItems = useWatch({ control, name: 'items' }) || [];

  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [quantity, setQuantity] = useState(1);

  const handleAddItem = () => {
    if (!selectedItem) return toast.error("Lütfen bir ürün seçin.");
    
    const existingIndex = fields.findIndex(i => (formItems[fields.indexOf(i)]?.id || (i as { id?: string | number }).id)?.toString() === selectedItem.id?.toString());
    if (existingIndex > -1) {
      const existing = fields[existingIndex];
      update(existingIndex, {
        ...existing,
        quantity: existing.quantity + quantity
      });
    } else {
      append({
        id: selectedItem.id,
        name: selectedItem.name,
        quantity: quantity,
        unitPrice: Number(selectedItem.salePrice || 0),
        taxRate: 20, // Default tax rate
      });
    }
    setSelectedItem(null);
    setQuantity(1);
    toast.success("Ürün eklendi.");
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Product Selection Header */}
      <div className="p-3 border-b border-slate-100 bg-white flex items-end gap-3">
        <div className="flex-1">
          <SearchableSelect
            placeholder="Ürün Seç"
            options={(items || []).map(i => ({ id: String(i.id), label: i.name }))}
            value={selectedItem ? String(selectedItem.id) : null}
            onChange={(opt) => setSelectedItem(items.find(x => String(x.id) === opt?.id) || null)}
          />
        </div>
        
        <div className="flex items-center bg-[var(--success)] rounded-lg overflow-hidden shadow-md h-8">
          {/* Quantity Section */}
          <div className="flex items-center border-r border-white/20 px-1">
            <button 
              className="w-7 h-full flex items-center justify-center text-white hover:bg-black/10 active:scale-90 transition-all"
              type="button"
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
              type="button"
              onClick={() => setQuantity(quantity + 1)}
            >
              <FiPlus size={14} />
            </button>
          </div>

          {/* Add Button Section */}
          <button 
            type="button"
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
            {fields.map((field, index) => {
              const item = formItems[index] || field;
              return (
                <tr key={field.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="p-3 text-[10px] font-bold text-slate-300">{index + 1}</td>
                  <td className="p-3 text-xs font-black text-slate-700">{item.name}</td>
                  <td className="p-3 text-right text-xs font-bold tabular-nums">
                    {Number(item.unitPrice || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                  </td>
                  <td className="p-3 text-center text-xs font-bold tabular-nums">{item.quantity}</td>
                  <td className="p-3 text-right text-xs font-black tabular-nums text-[var(--primary)]">
                    {new Decimal(item.unitPrice || 0).mul(item.quantity || 0).toDecimalPlaces(2).toNumber().toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                  </td>
                  <td className="p-3 text-center">
                    <button 
                      type="button"
                      className="p-1.5 text-[var(--error)] hover:bg-[var(--error-glow)] rounded-lg transition-colors"
                      onClick={() => remove(index)}
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {fields.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-300 italic font-bold text-xs uppercase tracking-widest">
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
           <span className="text-sm text-slate-700">{formItems.reduce((acc, i) => acc + (i.quantity || 0), 0)}</span>
        </div>
        <div className="flex items-baseline gap-2">
           <span className="text-xs text-slate-400 uppercase tracking-tighter">ARA TOPLAM:</span>
           <span className="text-sm text-[var(--primary)]">
            {formItems.reduce((acc, i) => acc.add(new Decimal(i.unitPrice || 0).mul(i.quantity || 0)), new Decimal(0)).toDecimalPlaces(2).toNumber().toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
           </span>
        </div>
      </div>
    </div>
  );
};
