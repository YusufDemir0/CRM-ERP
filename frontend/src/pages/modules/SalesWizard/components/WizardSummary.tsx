import React, { memo, useMemo } from 'react';
import { FiBox, FiCheck, FiPercent } from 'react-icons/fi';
import Decimal from 'decimal.js';
import { useFormContext, useWatch } from 'react-hook-form';
import { SalesWizardFormData } from '../schema';
import { useSalesWizardStore } from '../../../../store/useSalesWizardStore';
import { formatCurrency } from '../../../../utils/formatters';

export const WizardSummary: React.FC = memo(() => {
  const { control } = useFormContext<SalesWizardFormData>();
  
  const items = useWatch<SalesWizardFormData, 'items'>({ control, name: 'items' }) || [];
  const representativePriceStr = useWatch<SalesWizardFormData, 'representativePrice'>({ control, name: 'representativePrice' }) || '0';
  const isInvoiced = useWatch<SalesWizardFormData, 'isInvoiced'>({ control, name: 'isInvoiced' }) ?? true;
  
  const representativePrice = useMemo(() => new Decimal(representativePriceStr), [representativePriceStr]);

  const { subtotal, discountAmount, discountedMatrah, totalTax, grandTotal } = useMemo(() => {
    const s = items.reduce(
      (acc, i) => acc.add(new Decimal(i.unitPrice || 0).mul(i.quantity || 0)),
      new Decimal(0)
    );

    const d = s.gt(representativePrice) && !representativePrice.isZero() 
      ? s.minus(representativePrice) 
      : new Decimal(0);

    const dm = s.minus(d);

    const tt = items.reduce((acc, i) => {
      const rate = isInvoiced ? new Decimal(i.taxRate || 20) : new Decimal(0);
      const lineAmount = new Decimal(i.unitPrice || 0).mul(i.quantity || 0);
      const lineRatio = s.gt(0) ? lineAmount.div(s) : new Decimal(0);
      const lineMatrah = dm.mul(lineRatio);
      return acc.add(lineMatrah.mul(rate).div(100).toDecimalPlaces(2));
    }, new Decimal(0));

    const gt = dm.add(tt);

    return { subtotal: s, discountAmount: d, discountedMatrah: dm, totalTax: tt, grandTotal: gt };
  }, [items, representativePrice, isInvoiced]);

  return (
    <div className="flex gap-3 h-[100px]">
      {/* Matrah (Ara Tutar) */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-3 flex flex-col justify-between relative overflow-hidden group shadow-sm transition-all hover:shadow-md">
        <div className="absolute -right-2 -top-2 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-all group-hover:scale-110">
           <FiBox size={50} />
        </div>
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">MATRAH TOPLAMI</span>
        <div className="text-xl font-black text-slate-800 text-right tabular-nums tracking-tighter">
          {formatCurrency(subtotal.toString())}
        </div>
      </div>

      {/* KDV */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-3 flex flex-col justify-between relative overflow-hidden group shadow-sm transition-all hover:shadow-md">
        <div className="absolute -right-2 -top-2 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-all group-hover:scale-110 text-emerald-600">
           <FiCheck size={50} />
        </div>
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">KDV TOPLAMI (%{isInvoiced ? 20 : 0})</span>
        <div className="text-xl font-black text-emerald-600 text-right tabular-nums tracking-tighter">
          {formatCurrency(totalTax.toString())}
        </div>
      </div>

      {/* İskonto & Toplam */}
      <div className="w-[350px] bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dim)] border border-[var(--primary)] rounded-3xl p-3 flex flex-col justify-between relative overflow-hidden shadow-xl shadow-[var(--primary-glow)] group">
         <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-700" />
         <div className="flex items-center justify-between gap-2">
            <span className="text-[9px] font-black text-white/60 uppercase tracking-widest flex items-center gap-1">
              <FiPercent size={10} /> İSKONTO (REVİZYON) :
            </span>
            <span className="text-xs font-black text-white/90">
              -{formatCurrency(discountAmount.toString())}
            </span>
         </div>
         <div className="flex items-center justify-between gap-4 pt-1 border-t border-white/10">
            <span className="text-[10px] font-black text-white uppercase tracking-[2px]">GENEL TOPLAM</span>
            <div className="text-2xl font-black text-white tabular-nums tracking-tighter">
              {formatCurrency(grandTotal.toString())}
            </div>
         </div>
      </div>
    </div>
  );
});
