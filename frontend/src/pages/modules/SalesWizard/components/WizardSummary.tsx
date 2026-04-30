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
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ara Tutar</span>
        <div className="text-xl font-black text-slate-700 text-right tabular-nums">
          {subtotal.toDecimalPlaces(2).toNumber().toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-xs font-bold opacity-50">₺</span>
        </div>
      </div>

      {/* KDV */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group shadow-sm">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">KDV</span>
        <div className="text-xl font-black text-slate-700 text-right tabular-nums">
          {totalTax.toDecimalPlaces(2).toNumber().toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-xs font-bold opacity-50">₺</span>
        </div>
      </div>

      {/* İskonto & Toplam */}
      <div className="w-[400px] bg-white border border-slate-200 rounded-2xl p-3 flex flex-col gap-2 relative overflow-hidden group shadow-sm">
         <div className="flex items-center justify-between gap-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">İskonto Tutarı :</span>
            <input 
              type="number"
              className="bg-slate-50 border border-slate-100 h-8 w-32 rounded-lg px-3 text-right font-black text-sm text-[var(--error)]" 
              {...register('discountAmount', { valueAsNumber: true })}
              placeholder="0,00"
            />
         </div>
         <div className="flex items-center justify-between gap-4 border-t border-slate-50 pt-2">
            <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Genel Toplam :</span>
            <div className="text-2xl font-black text-[var(--primary)] tabular-nums">
              {grandTotal.toDecimalPlaces(2).toNumber().toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-sm">₺</span>
            </div>
         </div>
      </div>
    </div>
  );
};
