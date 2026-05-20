import React, { useState, memo, useMemo, useCallback } from 'react';
import { FiPlus, FiMinus, FiTrash2, FiShoppingCart, FiCheck } from 'react-icons/fi';
import Decimal from 'decimal.js';
import { Item } from '../../../../types';
import { SearchableSelect } from '../../../../components/common/SearchableSelect';
import toast from 'react-hot-toast';
import { useFormContext, useFieldArray, useWatch } from 'react-hook-form';
import { SalesWizardFormData } from '../schema';
import { useSalesWizardStore } from '../../../../store/useSalesWizardStore';
import { formatCurrency } from '../../../../utils/formatters';

interface ProductPhaseProps {
  items: Item[];
}

const ProductRow = memo(({ 
  index, 
  isInvoiced, 
  onRemove 
}: { 
  index: number; 
  isInvoiced: boolean; 
  onRemove: (index: number) => void; 
}) => {
  const { control } = useFormContext<SalesWizardFormData>();
  const item = useWatch({ control, name: `items.${index}` });

  if (!item) return null;

  return (
    <tr className="group hover:bg-white hover:shadow-lg hover:shadow-slate-100 hover:-translate-y-[1px] transition-[background-color,box-shadow,transform] duration-200">
      <td className="p-3 text-[10px] font-bold text-slate-300">{index + 1}</td>
      <td className="p-3">
        <div className="text-xs font-black text-slate-700">{item.name}</div>
        <div className="text-[9px] text-slate-400 font-bold">KDV: %{isInvoiced ? (item.taxRate || 20) : 0}</div>
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
          onClick={() => onRemove(index)}
        >
          <FiTrash2 size={14} />
        </button>
      </td>
    </tr>
  );
});

const SubtotalPanel = memo(() => {
  const { control, setValue } = useFormContext<SalesWizardFormData>();
  const formItems = useWatch({ control, name: 'items' }) || [];
  const representativePrice = useWatch({ control, name: 'representativePrice' }) || '0';
  const isInvoiced = useWatch({ control, name: 'isInvoiced' }) ?? true;

  const subtotal = useMemo(() => {
    return formItems.reduce((acc, i) => acc.add(new Decimal(i?.unitPrice || 0).mul(i?.quantity || 0)), new Decimal(0));
  }, [formItems]);

  const calculatedDiscount = useMemo(() => {
    return Decimal.max(0, subtotal.minus(new Decimal(representativePrice || 0)));
  }, [subtotal, representativePrice]);

  return (
    <>
      <div className="p-4 bg-slate-50 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TEKLİF EDİLEN TOPLAM (REVİZYON)</label>
          <div className="relative">
            <input 
              type="number" 
              className="input-premium h-12 w-full text-lg font-black text-[var(--primary)] tabular-nums pl-4 pr-10"
              placeholder="0.00"
              value={representativePrice}
              onChange={(e) => setValue('representativePrice', e.target.value, { shouldValidate: true })}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-400">₺</span>
          </div>
          <span className="text-[9px] font-bold text-slate-400 uppercase mt-1">İstediğiniz son tutarı girin, iskonto otomatik hesaplanacaktır</span>
        </div>

        <div className="flex flex-col justify-center gap-2 p-4 bg-white rounded-2xl border border-slate-200 shadow-inner">
           <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase">MATRAH TOPLAMI:</span>
              <span className="text-sm font-black text-slate-800 tabular-nums">
                {formatCurrency(subtotal.toString())}
              </span>
           </div>
           <div className="flex justify-between items-center border-t border-slate-50 pt-2">
              <span className="text-[10px] font-black text-[var(--error)] uppercase">HESAPLANAN İSKONTO:</span>
              <span className="text-sm font-black text-[var(--error)] tabular-nums">
                -{formatCurrency(calculatedDiscount.toString())}
              </span>
           </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">FATURA DURUMU</label>
          <div className="flex bg-slate-200/50 p-1 rounded-xl border border-slate-200 h-12">
            <button 
              type="button"
              onClick={() => setValue('isInvoiced', true, { shouldValidate: true })}
              className={`flex-1 rounded-lg font-black text-xs transition-all flex items-center justify-center gap-2 ${isInvoiced ? 'bg-white shadow-md text-[var(--primary)]' : 'text-slate-400'}`}
            >
              {isInvoiced && <FiCheck />} FATURALI
            </button>
            <button 
              type="button"
              onClick={() => setValue('isInvoiced', false, { shouldValidate: true })}
              className={`flex-1 rounded-lg font-black text-xs transition-all flex items-center justify-center gap-2 ${!isInvoiced ? 'bg-white shadow-md text-[var(--primary)]' : 'text-slate-400'}`}
            >
              {!isInvoiced && <FiCheck />} PERAKENDE
            </button>
          </div>
        </div>
      </div>

      <div className="p-2 px-4 bg-slate-900 text-white flex justify-end gap-6 font-black shrink-0">
        <div className="flex items-center gap-2">
           <span className="text-[9px] text-white/40 uppercase tracking-widest">KALEM:</span>
           <span className="text-xs">{formItems.length}</span>
        </div>
        <div className="flex items-center gap-2 border-l border-white/10 pl-6">
           <span className="text-[9px] text-white/40 uppercase tracking-widest">GENEL TOPLAM:</span>
           <span className="text-sm text-[var(--success-glow)]">
            {formatCurrency(representativePrice || '0')}
           </span>
        </div>
      </div>
    </>
  );
});

export const ProductPhase: React.FC<ProductPhaseProps> = memo(({ items }) => {
  const { control, getValues } = useFormContext<SalesWizardFormData>();
  
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'items'
  });

  const isInvoiced = useWatch({ control, name: 'isInvoiced' }) ?? true;

  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [quantity, setQuantity] = useState(1);

  const productOptions = useMemo(() => {
    return (items || []).map(i => ({ id: String(i.id), label: i.name }));
  }, [items]);

  const handleAddItem = useCallback(() => {
    if (!selectedItem) return toast.error("Lütfen bir ürün seçin.");
    
    const currentItems = getValues('items') || [];
    const existingIndex = currentItems.findIndex(i => String(i.id) === String(selectedItem.id));
    if (existingIndex > -1) {
      const existing = currentItems[existingIndex];
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
  }, [selectedItem, quantity, getValues, update, append]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white/40">
      <div className="p-3 border-b border-slate-100 bg-white/80 backdrop-blur-md flex items-end gap-2 shrink-0 z-20 relative">
        <div className="flex-1">
          <SearchableSelect
            placeholder="Ürün Ara (Barkod, İsim, SKU)..."
            options={productOptions}
            value={selectedItem ? String(selectedItem.id) : null}
            onChange={(opt) => setSelectedItem(items.find(x => String(x.id) === opt?.id) || null)}
          />
        </div>
        
        <div className="flex items-center bg-slate-900 rounded-xl overflow-hidden shadow-lg h-9">
          <div className="flex items-center border-r border-white/10 px-1 bg-white/5">
            <button 
              className="w-7 h-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-transform duration-200"
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
              className="w-7 h-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-transform duration-200"
              type="button"
              onClick={() => setQuantity(quantity + 1)}
            >
              <FiPlus size={12} />
            </button>
          </div>

          <button 
            type="button"
            className="px-6 h-full text-[10px] font-black text-white hover:bg-[var(--primary)] transition-[background-color,transform] duration-200 uppercase tracking-widest flex items-center gap-2 active:scale-95"
            onClick={handleAddItem}
          >
            <FiPlus size={14} />
            EKLE
          </button>
        </div>
      </div>

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
            {fields.map((field, index) => (
              <ProductRow 
                key={field.id}
                index={index}
                isInvoiced={isInvoiced}
                onRemove={remove}
              />
            ))}
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

      <SubtotalPanel />
    </div>
  );
});
