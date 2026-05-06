import React, { memo } from 'react';
import { FiBox, FiCheck, FiPercent } from 'react-icons/fi';
import { Decimal } from 'decimal.js';
import { useFormContext, useWatch } from 'react-hook-form';
import { SalesWizardFormData } from '../schema';

export const WizardSummary: React.FC = memo(() => {
  const { register, control } = useFormContext<SalesWizardFormData>();
  
  const items = useWatch<SalesWizardFormData, 'items'>({ control, name: 'items' }) || [];
  const discountAmount = useWatch<SalesWizardFormData, 'discountAmount'>({ control, name: 'discountAmount' }) || 0;
  const isTaxed = useWatch<SalesWizardFormData, 'isTaxed'>({ control, name: 'isTaxed' });

  const subtotal = items.reduce(
    (acc, i) => acc.add(new Decimal(i.unitPrice || 0).mul(i.quantity || 0)),
    new Decimal(0)
  );

  // Backend logic: discount is subtracted from matrah BEFORE KDV is calculated
  const discountedMatrah = subtotal.sub(new Decimal(discountAmount || 0));

  const totalTax = items.reduce((acc, i) => {
    const rate = isTaxed ? new Decimal(i.taxRate || 20) : new Decimal(0);
    const lineAmount = new Decimal(i.unitPrice || 0).mul(i.quantity || 0);
    // Pro-rata: distribute discount proportionally across lines for KDV calculation
    const lineRatio = subtotal.gt(0) ? lineAmount.div(subtotal) : new Decimal(0);
    const lineMatrah = discountedMatrah.mul(lineRatio);
    return acc.add(lineMatrah.mul(rate).div(100).toDecimalPlaces(2));
  }, new Decimal(0));

  const grandTotal = discountedMatrah.add(totalTax);

  return (
    <div className="flex gap-3 h-[100px]">
      {/* Ara Tutar */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-3 flex flex-col justify-between relative overflow-hidden group shadow-sm transition-all hover:shadow-md">
        <div className="absolute -right-2 -top-2 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-all group-hover:scale-110">
           <FiBox size={50} />
        </div>
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ARA TOPLAM</span>
        <div className="text-xl font-black text-slate-800 text-right tabular-nums tracking-tighter">
          {subtotal.toDecimalPlaces(2).toNumber().toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-[10px] font-bold opacity-30">₺</span>
        </div>
      </div>

      {/* KDV */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-3 flex flex-col justify-between relative overflow-hidden group shadow-sm transition-all hover:shadow-md">
        <div className="absolute -right-2 -top-2 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-all group-hover:scale-110 text-emerald-600">
           <FiCheck size={50} />
        </div>
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">KDV TOPLAMI</span>
        <div className="text-xl font-black text-emerald-600 text-right tabular-nums tracking-tighter">
          {totalTax.toDecimalPlaces(2).toNumber().toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-[10px] font-bold opacity-30">₺</span>
        </div>
      </div>

      {/* İskonto & Toplam */}
      <div className="w-[300px] bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dim)] border border-[var(--primary)] rounded-3xl p-3 flex flex-col justify-between relative overflow-hidden shadow-xl shadow-[var(--primary-glow)] group">
         <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-700" />
         <div className="flex items-center justify-between gap-2">
            <span className="text-[9px] font-black text-white/60 uppercase tracking-widest flex items-center gap-1">
              <FiPercent size={10} /> İSKONTO :
            </span>
            <input 
              type="number"
              className="bg-white/10 border border-white/20 h-7 w-24 rounded-lg px-3 text-right font-black text-xs text-white placeholder-white/30 focus:bg-white/20 outline-none transition-all" 
              {...register('discountAmount', { valueAsNumber: true })}
              placeholder="0,00"
            />
         </div>
         <div className="flex items-center justify-between gap-4 pt-1 border-t border-white/10">
            <span className="text-[10px] font-black text-white uppercase tracking-[2px]">GENEL TOPLAM</span>
            <div className="text-2xl font-black text-white tabular-nums tracking-tighter">
              {grandTotal.toDecimalPlaces(2).toNumber().toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-xs opacity-60">₺</span>
            </div>
         </div>
      </div>
    </div>
  );
});
