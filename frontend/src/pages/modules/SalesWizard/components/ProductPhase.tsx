import React, { useState, memo, useMemo, useCallback } from 'react';
import { FiPlus, FiMinus, FiTrash2, FiShoppingCart, FiCheck, FiPercent, FiFileText, FiTag } from 'react-icons/fi';
import Decimal from 'decimal.js';
import { Item } from '../../../../types';
import { SearchableSelect } from '../../../../components/common/SearchableSelect';
import toast from 'react-hot-toast';
import { useFormContext, useFieldArray, useWatch } from 'react-hook-form';
import { SalesWizardFormData } from '../schema';
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
  isInvoiced: boolean | null;
  onRemove: (index: number) => void;
}) => {
  const { control } = useFormContext<SalesWizardFormData>();
  const item = useWatch({ control, name: `items.${index}` });

  if (!item) return null;

  return (
    <tr className="group hover:bg-slate-50/80 transition-colors">
      <td className="p-3">
        <div className="text-xs font-black text-slate-700">{item.name}</div>
        {isInvoiced && <div className="text-[9px] text-slate-400 font-bold">KDV: %{item.taxRate || 20}</div>}
      </td>
      <td className="p-3 text-right text-xs font-bold tabular-nums text-slate-600">
        {new Decimal(item.unitPrice || 0).toDecimalPlaces(2).toNumber().toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
      </td>
      <td className="p-3 text-center">
        <span className="inline-block px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-black tabular-nums">
          {item.quantity}
        </span>
      </td>
      <td className="p-3 text-right text-xs font-black tabular-nums text-[var(--primary)]">
        {new Decimal(item.unitPrice || 0).mul(item.quantity || 0).toDecimalPlaces(2).toNumber().toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
      </td>
      <td className="p-3 text-center">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-[10px] font-black uppercase tracking-wider border border-amber-200/50">
          🔒 BEKLEYEN
        </span>
      </td>
      <td className="p-3 text-center">
        <button
          type="button"
          className="p-1.5 text-slate-350 hover:text-[var(--error)] hover:bg-[var(--error-glow)] rounded-lg transition-all opacity-0 group-hover:opacity-100"
          onClick={() => onRemove(index)}
        >
          <FiTrash2 size={14} />
        </button>
      </td>
    </tr>
  );
});

export const ProductPhase: React.FC<ProductPhaseProps> = memo(({ items }) => {
  const { control, getValues, setValue } = useFormContext<SalesWizardFormData>();

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'items'
  });
  const handleRemove = useCallback((index: number) => {
    remove(index);
  }, [remove]);

  const isInvoiced = useWatch({ control, name: 'isInvoiced' });
  const representativePrice = useWatch({ control, name: 'representativePrice' }) || '';
  const formItems = useWatch({ control, name: 'items' }) || [];

  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [quantity, setQuantity] = useState(1);

  const productOptions = useMemo(() => {
    return (items || []).map(i => {
      let stockSummary = '';
      const stocks = i.stocks;
      if (stocks && Array.isArray(stocks) && stocks.length > 0) {
        const parts = stocks
          .filter(s => s.department && Number(s.quantity || 0) > 0)
          .map(s => `${s.department?.name || s.department?.abbreviation || 'DEPO'}: ${s.quantity}`);
        if (parts.length > 0) {
          stockSummary = ` (${parts.join(' - ')})`;
        }
      }
      return { id: String(i.id), label: `${i.name}${stockSummary}` };
    });
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
        taxRate: selectedItem.kdv !== undefined && selectedItem.kdv !== null ? selectedItem.kdv : 20,
      });
    }
    setSelectedItem(null);
    setQuantity(1);
    toast.success("Ürün listeye eklendi.");
  }, [selectedItem, quantity, getValues, update, append]);

  const subtotal = useMemo(() => {
    return formItems.reduce((acc, i) => acc.add(new Decimal(i?.unitPrice || 0).mul(i?.quantity || 0)), new Decimal(0));
  }, [formItems]);

  const totalTax = useMemo(() => {
    if (!isInvoiced) return new Decimal(0);
    const totalInput = new Decimal(representativePrice || 0);
    return formItems.reduce((acc, i) => {
      const rate = new Decimal(i?.taxRate || 20);
      const lineAmount = new Decimal(i?.unitPrice || 0).mul(i?.quantity || 0);
      const lineRatio = subtotal.gt(0) ? lineAmount.div(subtotal) : new Decimal(0);
      const lineTotal = totalInput.mul(lineRatio);

      const lineMatrah = lineTotal.div(new Decimal(1).add(rate.div(100)));
      const lineKdv = lineTotal.minus(lineMatrah);
      return acc.add(lineKdv.toDecimalPlaces(2));
    }, new Decimal(0));
  }, [formItems, subtotal, representativePrice, isInvoiced]);

  const calculatedDiscount = useMemo(() => {
    if (!representativePrice || isNaN(Number(representativePrice))) return new Decimal(0);
    const gt = new Decimal(representativePrice);
    if (gt.gt(subtotal)) {
      return subtotal.minus(gt);
    }
    const dm = gt.minus(totalTax);
    return isInvoiced ? subtotal.minus(dm) : subtotal.minus(gt);
  }, [subtotal, representativePrice, totalTax, isInvoiced]);

  const grandTotal = useMemo(() => {
    return new Decimal(representativePrice || 0);
  }, [representativePrice]);

  // Steps active conditions
  const isStep8Complete = formItems.length > 0;
  const isStep9And10Complete = isStep8Complete && representativePrice !== undefined && representativePrice !== '' && Number(representativePrice) > 0 && (isInvoiced === true || isInvoiced === false);

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-300">

      {/* ADIM 8: Ürün Seçimi — STABLE NON-SHRINKING HEIGHT */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-md flex flex-col h-[380px] shrink-0 overflow-visible">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3 shrink-0">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[var(--primary)] text-white text-[10px] flex items-center justify-center font-bold">8</span>
            ÜRÜN / HİZMET SEÇİMİ VE SEPET
          </h3>
          {isStep8Complete && (
            <span className="text-[10px] font-black text-emerald-600 flex items-center gap-1.5">
              <FiCheck strokeWidth={3} /> TAMAMLANDI ({formItems.length} Kalem)
            </span>
          )}
        </div>

        <div className="flex items-end gap-3 shrink-0 z-20 relative mb-3">
          <div className="flex-1">
            <SearchableSelect
              placeholder="Ürün Ara (Barkod, İsim, SKU)..."
              options={productOptions}
              value={selectedItem ? String(selectedItem.id) : null}
              onChange={(opt) => setSelectedItem(items.find(x => String(x.id) === opt?.id) || null)}
            />
          </div>

          <div className="flex items-center bg-emerald-600 rounded-xl overflow-hidden shadow-lg h-9 border border-emerald-500 shrink-0">
            <div className="flex items-center border-r border-white/20 px-1 bg-white/10 h-full">
              <button
                className="w-7 h-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-transform duration-200"
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <FiMinus size={13} />
              </button>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-12 h-full bg-transparent border-none text-center font-black text-xs tabular-nums text-white focus:outline-none"
                value={quantity}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setQuantity(val ? Math.max(1, Number(val)) : 1);
                }}
              />
              <button
                className="w-6 h-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-transform duration-200"
                type="button"
                onClick={() => setQuantity(quantity + 1)}
              >
                <FiPlus size={13} />
              </button>
            </div>

            <button
              type="button"
              className="px-5 h-full text-[10px] font-black text-white hover:bg-emerald-700 transition-[background-color,transform] duration-200 uppercase tracking-widest flex items-center gap-2 active:scale-95"
              onClick={handleAddItem}
            >
              <FiPlus size={14} />
              EKLE
            </button>
          </div>
        </div>

        {/* Scrollable table area */}
        <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50/50">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-slate-200 bg-slate-100/95 backdrop-blur-sm">
                <th className="p-3 text-left font-black text-[9px] text-slate-400 uppercase tracking-widest">ÜRÜN / HİZMET</th>
                <th className="p-3 text-right font-black text-[9px] text-slate-400 uppercase tracking-widest">BİRİM FİYAT</th>
                <th className="p-3 text-center font-black text-[9px] text-slate-400 uppercase tracking-widest w-20">ADET</th>
                <th className="p-3 text-right font-black text-[9px] text-slate-400 uppercase tracking-widest">TOPLAM</th>
                <th className="p-3 text-center font-black text-[9px] text-slate-400 uppercase tracking-widest w-28">SEVK / DEPO</th>
                <th className="p-3 text-center w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fields.map((field, index) => (
                <ProductRow
                  key={field.id}
                  index={index}
                  isInvoiced={isInvoiced}
                  onRemove={handleRemove}
                />
              ))}
              {fields.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-30 py-6">
                      <FiShoppingCart size={36} className="text-slate-455 animate-bounce" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sepetiniz boş — yukarıdan ürün ekleyin</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADIM 9+10: Anlaşılan Tutar + Fatura Tipi — WIDE, PREMIUM, SPACIOUS AND HIGHLY READABLE DESIGN */}
      {isStep8Complete && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-lg space-y-4 transition-all hover:shadow-xl animate-in slide-in-from-top-4 duration-300 shrink-0">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[var(--primary)] text-white text-[10px] flex items-center justify-center font-bold">9</span>
              <span className="w-5 h-5 rounded-full bg-[var(--primary)] text-white text-[10px] flex items-center justify-center font-bold">10</span>
              ANLAŞILAN TUTAR VE FATURA TİPİ
            </h3>
            {isStep9And10Complete && (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <FiCheck strokeWidth={3} /> {formatCurrency(grandTotal.toString())}
                </span>
                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                  {isInvoiced === true ? 'FATURALI' : isInvoiced === false ? 'PERAKENDE (KDV DAHİL)' : 'SEÇİLMEDİ'}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

            {/* Left side: Offered Price & Discounts (7 cols) */}
            <div className="md:col-span-7 bg-slate-50/50 p-5 rounded-2xl border border-slate-200/60 flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <FiTag className="text-[var(--primary)]" size={14} />
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">TEKLİF EDİLEN TUTAR *</label>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    className="input-premium h-11 w-full text-lg font-black text-center text-[var(--primary)] tabular-nums pl-4 pr-10 focus:ring-2 focus:ring-[var(--primary-glow)] border-slate-250 rounded-xl"
                    placeholder="0"
                    value={(() => {
                      if (!representativePrice) return '';
                      const num = Number(representativePrice);
                      if (isNaN(num)) return '';
                      return new Intl.NumberFormat('tr-TR').format(num);
                    })()}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const clean = raw.replace(/\D/g, '');
                      setValue('representativePrice', clean, { shouldValidate: true });
                    }}
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">₺</span>
                </div>
                <span className="text-[9px] text-slate-400 font-bold leading-normal">
                  * Müşteriyle anlaştığınız KDV dahil son tutarı buraya girin. KDV bu tutardan geri hesaplanacaktır.
                </span>
              </div>

              {/* DÜZELTİLEN BÖLÜM: YAPILAN İSKONTO VE LİSTE TOPLAMI ALANI */}
              <div className="grid grid-cols-2 gap-3 mt-1">
                <div className="p-3 bg-white rounded-xl border border-slate-150 flex flex-col justify-center shadow-sm">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">LİSTE TOPLAMI (SEPET)</span>
                  <span className="text-sm font-black text-slate-700 mt-1 tabular-nums">
                    {formatCurrency(subtotal.toString())}
                  </span>
                </div>
                {(() => {
                  const isPositiveDiscount = calculatedDiscount.gte(0);
                  return (
                    <div className="p-3 bg-white rounded-xl border border-slate-150 flex flex-col justify-center shadow-sm">
                      <span className={`text-[8px] font-black uppercase tracking-widest ${isPositiveDiscount ? 'text-red-500' : 'text-emerald-500'}`}>
                        {isPositiveDiscount ? 'YAPILAN İSKONTO' : 'İLAVE BEDEL (ARTIRIM)'}
                      </span>
                      <span className={`text-sm font-black mt-1 tabular-nums ${isPositiveDiscount ? 'text-red-600' : 'text-emerald-600'}`}>
                        {isPositiveDiscount ? '-' : '+'}{formatCurrency(calculatedDiscount.abs().toString())}
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Right side: Invoice & Taxes (5 cols) - RESTORED AND SAVED FROM ACCIDENTAL OVERWRITE */}
            <div className="md:col-span-5 bg-slate-50/50 p-5 rounded-2xl border border-slate-200/60 flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <FiFileText className="text-[var(--primary)]" size={14} />
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">FATURA KATEGORİSİ *</label>
                </div>
                <div className="flex bg-slate-200/60 p-0.5 rounded-xl border border-slate-250 h-9 w-full">
                  <button
                    type="button"
                    onClick={() => setValue('isInvoiced', true, { shouldValidate: true })}
                    className={`flex-1 rounded-lg font-black text-[10px] transition-all flex items-center justify-center gap-1.5 uppercase ${isInvoiced === true ? 'bg-white shadow-md text-[var(--primary)] border border-slate-200/30' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {isInvoiced === true && <FiCheck strokeWidth={3} />} FATURALI
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue('isInvoiced', false, { shouldValidate: true })}
                    className={`flex-1 rounded-lg font-black text-[10px] transition-all flex items-center justify-center gap-1.5 uppercase ${isInvoiced === false ? 'bg-white shadow-md text-[var(--primary)] border border-slate-200/30' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {isInvoiced === false && <FiCheck strokeWidth={3} />} PERAKENDE
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-1">
                <div className="p-3 bg-white rounded-xl border border-slate-150 flex flex-col justify-center shadow-sm">
                  <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">HESAPLANAN KDV</span>
                  <span className="text-sm font-black text-emerald-600 mt-1 tabular-nums">
                    {formatCurrency(totalTax.toString())}
                  </span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-150 flex flex-col justify-center shadow-sm ring-1 ring-[var(--primary-glow)]">
                  <span className="text-[8px] font-black text-[var(--primary)] uppercase tracking-widest">ÖDENECEK TUTAR</span>
                  <span className="text-sm font-black text-[var(--primary)] mt-1 tabular-nums">
                    {formatCurrency(grandTotal.toString())}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
});
