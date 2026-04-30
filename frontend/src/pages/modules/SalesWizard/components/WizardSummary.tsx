import React from 'react';
import { Decimal } from 'decimal.js';
import { useFormContext, useWatch } from 'react-hook-form';
import { SalesWizardFormData } from '../schema';

export const WizardSummary: React.FC = () => {
  const { register } = useFormContext<SalesWizardFormData>();
  
  const items = useWatch<SalesWizardFormData, 'items'>({ name: 'items' }) || [];
  const discountAmount = useWatch<SalesWizardFormData, 'discountAmount'>({ name: 'discountAmount' }) || 0;
  const isTaxed = useWatch<SalesWizardFormData, 'isTaxed'>({ name: 'isTaxed' });

  const subtotal = items.reduce(
    (acc, i) => acc.add(new Decimal(i.unitPrice || 0).mul(i.quantity || 0)),
    new Decimal(0)
  );

  const totalTax = items.reduce((acc, i) => {
    const rate = isTaxed ? new Decimal(i.taxRate || 20) : new Decimal(0);
    const lineAmount = new Decimal(i.unitPrice || 0).mul(i.quantity || 0);
    return acc.add(lineAmount.mul(rate).div(100));
  }, new Decimal(0));

  const grandTotal = subtotal.add(totalTax).sub(new Decimal(discountAmount || 0));

  return (
    <div className="flex gap-4 h-[120px]">
      {/* Ara Tutar */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group shadow-sm">
        <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
           <FiBox size={60} />
        </div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ara Tutar (Matrah)</span>
        <div className="text-2xl font-black text-slate-800 text-right tabular-nums tracking-tighter">
          {subtotal.toDecimalPlaces(2).toNumber().toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-xs font-bold opacity-50">₺</span>
        </div>
      </div>

      {/* KDV */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group shadow-sm">
        <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity text-emerald-600">
           <FiCheck size={60} />
        </div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">KDV Toplamı</span>
        <div className="text-2xl font-black text-emerald-600 text-right tabular-nums tracking-tighter">
          {totalTax.toDecimalPlaces(2).toNumber().toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-xs font-bold opacity-50">₺</span>
        </div>
      </div>

      {/* İskonto & Toplam */}
      <div className="w-[400px] bg-[var(--primary)] border border-[var(--primary)] rounded-3xl p-4 flex flex-col justify-between relative overflow-hidden shadow-2xl shadow-[var(--primary-glow)]">
         <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
         <div className="flex items-center justify-between gap-4">
            <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Ek İskonto (Özel) :</span>
            <input 
              type="number"
              className="bg-white/10 border border-white/20 h-10 w-32 rounded-xl px-4 text-right font-black text-sm text-white placeholder-white/30 focus:bg-white/20 outline-none transition-all" 
              {...register('discountAmount', { valueAsNumber: true })}
              placeholder="0,00"
            />
         </div>
         <div className="flex items-center justify-between gap-4 pt-2 border-t border-white/10">
            <span className="text-xs font-black text-white uppercase tracking-[3px]">Genel Toplam</span>
            <div className="text-3xl font-black text-white tabular-nums tracking-tighter">
              {grandTotal.toDecimalPlaces(2).toNumber().toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-sm opacity-60">₺</span>
            </div>
         </div>
      </div>
    </div>
  );
};
