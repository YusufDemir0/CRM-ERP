import React, { useState, memo } from 'react';
import { FiPlus, FiMinus, FiTrash2, FiShoppingCart } from 'react-icons/fi';
import { Decimal } from 'decimal.js';
import { Item } from '../../../../types';
import { SearchableSelect } from '../../../../components/common/SearchableSelect';
import toast from 'react-hot-toast';
import { useFormContext, useFieldArray, useWatch } from 'react-hook-form';
import { SalesWizardFormData } from '../schema';

interface ProductPhaseProps {
  items: Item[];
}

export const ProductPhase: React.FC<ProductPhaseProps> = memo(({ items }) => {
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
    
    const existingIndex = fields.findIndex(i => {
      const fieldId = formItems[fields.indexOf(i)]?.id || (i as any).id;
      return String(fieldId) === String(selectedItem.id);
    });
    if (existingIndex > -1) {
      const existing = formItems[existingIndex];
      update(existingIndex, {
        ...existing,
        quantity: new Decimal(existing.quantity || 0).add(quantity).toNumber()
      });
    } else {
      append({
        id: selectedItem.id,
        name: selectedItem.name,
        quantity: quantity,
        unitPrice: new Decimal(selectedItem.salePrice || 0).toNumber(),
        taxRate: 20,
      });
    }
    setSelectedItem(null);
    setQuantity(1);
    toast.success("Ürün listeye eklendi.");
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white/40">
      {/* Product Selection Header */}
      <div className="p-3 border-b border-slate-100 bg-white/80 backdrop-blur-md flex items-end gap-2 shrink-0">
        <div className="flex-1">
          <SearchableSelect
            placeholder="Ürün Ara (Barkod, İsim, SKU)..."
            options={(items || []).map(i => ({ id: String(i.id), label: i.name }))}
            value={selectedItem ? String(selectedItem.id) : null}
            onChange={(opt) => setSelectedItem(items.find(x => String(x.id) === opt?.id) || null)}
          />
        </div>
        
        <div className="flex items-center bg-slate-900 rounded-xl overflow-hidden shadow-lg h-9">
          <div className="flex items-center border-r border-white/10 px-1 bg-white/5">
            <button 
              className="w-7 h-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <FiMinus size={12} />
            </button>
            <input 
              type="number"
              className="w-10 h-full bg-transparent border-none text-center font-black text-xs tabular-nums text-white focus:outline-none"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            />
            <button 
              className="w-7 h-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
              type="button"
              onClick={() => setQuantity(quantity + 1)}
            >
              <FiPlus size={12} />
            </button>
          </div>

          <button 
            type="button"
            className="px-6 h-full text-[10px] font-black text-white hover:bg-[var(--primary)] transition-all uppercase tracking-widest flex items-center gap-2"
            onClick={handleAddItem}
          >
            <FiPlus size={14} />
            EKLE
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-slate-50/90 backdrop-blur-sm z-10">
            <tr className="border-b border-slate-100">
              <th className="p-3 text-left font-black text-[9px] text-slate-400 uppercase tracking-widest w-10">#</th>
              <th className="p-3 text-left font-black text-[9px] text-slate-400 uppercase tracking-widest">ÜRÜN / HİZMET</th>
              <th className="p-3 text-right font-black text-[9px] text-slate-400 uppercase tracking-widest">BİRİM FİYAT</th>
              <th className="p-3 text-center font-black text-[9px] text-slate-400 uppercase tracking-widest w-20">ADET</th>
              <th className="p-3 text-right font-black text-[9px] text-slate-400 uppercase tracking-widest">TOPLAM</th>
              <th className="p-3 text-center w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {fields.map((field, index) => {
              const item = formItems[index] || field;
              return (
                <tr key={field.id} className="group hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 text-[10px] font-bold text-slate-300">{index + 1}</td>
                  <td className="p-3">
                    <div className="text-xs font-black text-slate-700">{item.name}</div>
                    <div className="text-[9px] text-slate-400 font-bold">KDV: %{item.taxRate || 20}</div>
                  </td>
                  <td className="p-3 text-right text-xs font-bold tabular-nums text-slate-600">
                    {new Decimal(item.unitPrice || 0).toDecimalPlaces(2).toNumber().toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                  </td>
                  <td className="p-3 text-center">
                    <span className="inline-block px-2 py-1 bg-slate-100 rounded-lg text-xs font-black tabular-nums">
                      {item.quantity}
                    </span>
                  </td>
                  <td className="p-3 text-right text-xs font-black tabular-nums text-[var(--primary)]">
                    {new Decimal(item.unitPrice || 0).mul(item.quantity || 0).toDecimalPlaces(2).toNumber().toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                  </td>
                  <td className="p-3 text-center">
                    <button 
                      type="button"
                      className="p-1.5 text-slate-300 hover:text-[var(--error)] hover:bg-[var(--error-glow)] rounded-lg transition-all opacity-0 group-hover:opacity-100"
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
                <td colSpan={6} className="p-16 text-center">
                  <div className="flex flex-col items-center gap-2 opacity-20">
                    <FiShoppingCart size={40} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Sepetiniz boş</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mini Summary inside Section */}
      <div className="p-2 px-4 bg-slate-900 text-white flex justify-end gap-6 font-black shrink-0">
        <div className="flex items-center gap-2">
           <span className="text-[9px] text-white/40 uppercase tracking-widest">ADET:</span>
           <span className="text-xs">{formItems.reduce((acc, i) => acc.add(new Decimal(i.quantity || 0)), new Decimal(0)).toNumber()}</span>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-[9px] text-white/40 uppercase tracking-widest">MATRAH:</span>
           <span className="text-xs text-[var(--primary-glow)]">
            {formItems.reduce((acc, i) => acc.add(new Decimal(i.unitPrice || 0).mul(i.quantity || 0)), new Decimal(0)).toDecimalPlaces(2).toNumber().toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
           </span>
        </div>
      </div>
    </div>
  );
});
