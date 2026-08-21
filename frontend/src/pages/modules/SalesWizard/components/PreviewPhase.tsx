import React, { memo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { SalesWizardFormData } from '../schema';
import { useSalesWizardStore } from '../../../../store/useSalesWizardStore';
import { formatCurrency } from '../../../../utils/formatters';
import { FiAlertTriangle } from 'react-icons/fi';

export const PreviewPhase = memo(() => {
  const { control, getValues } = useFormContext<SalesWizardFormData>();
  const representativePrice = useWatch({ control, name: 'representativePrice' }) || '0';
  const deliveryDate = useWatch({ control, name: 'deliveryDate' }) || 'BELİRTİLMEMİŞ';
  const address = getValues('address') || 'BELİRTİLMEMİŞ';
  const district = getValues('district') || '';
  const customer = useSalesWizardStore.getState().draftData.customer;

  const fullAddress = district ? `${address}, ${district}` : address;

  return (
    <div className="flex flex-col h-full items-center justify-center p-6 animate-in fade-in duration-300">
      
      {/* Basit Uyarı Kutusu */}
      <div className="max-w-2xl w-full bg-amber-50/70 border border-amber-200/80 rounded-3xl p-8 shadow-lg flex flex-col items-center text-center gap-6">
        <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shadow-inner animate-pulse">
          <FiAlertTriangle size={28} />
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-black tracking-widest text-amber-800 uppercase">SATIŞ ONAYI BEKLENİYOR</h2>
          
          <p className="text-base font-bold text-slate-700 leading-relaxed max-w-xl">
            <span className="text-[var(--primary)] font-black uppercase underline decoration-2 decoration-[var(--primary-glow)]">
              {customer?.name || 'BELİRTİLMEMİŞ'}
            </span>{' '}
            müşterisinin,{' '}
            <span className="text-slate-900 font-black uppercase">
              {fullAddress}
            </span>{' '}
            adresine,{' '}
            <span className="text-indigo-650 font-black">
              {deliveryDate}
            </span>{' '}
            teslimat tarihli,{' '}
            <span className="text-emerald-650 font-black tabular-nums bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 shadow-sm">
              {formatCurrency(representativePrice)}
            </span>{' '}
            tutarlı siparişini onaylıyor musunuz?
          </p>
        </div>

        <div className="w-full border-t border-amber-200/60 pt-4 text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center justify-center gap-2">
          <span>⚠️ İşlemi tamamlamak için aşağıdaki "SATIŞI TAMAMLA" butonuna basın.</span>
        </div>
      </div>

    </div>
  );
});
