import React, { useState, useEffect, useMemo, memo } from 'react';
import { FiPlus, FiInfo, FiCheck } from 'react-icons/fi';
import { useFormContext, useWatch } from 'react-hook-form';
import { formatDecimal, formatCurrency } from '../../../utils/formatters';
import { Party, Staff, Account } from '../../../types';
import { useSalesWizardStore } from '../../../store/useSalesWizardStore';
import { useSalesWizard } from '../../../hooks/useSalesWizard';
import { SearchableSelect } from '../../../components/common/SearchableSelect';
import { ProductPhase } from './components/ProductPhase';
import { WizardSummary } from './components/WizardSummary';
import { PhoneInput } from '../../../components/common/PhoneInput';
import { FormField } from '../../../components/common/FormField';
import { useTurkiyeCities, useTurkiyeDistricts } from '../../../hooks/useTurkiyeApi';
import { useQuickCreateStore } from '../../../store/useQuickCreateStore';
import { SalesWizardFormData } from './schema';

// ─── OPTIMIZED SUB-COMPONENTS ───

import { CustomerPhase } from './components/CustomerPhase';
import { LogisticsPhase } from './components/LogisticsPhase';

// ─── MAIN PAGE COMPONENT ───

export const SaleWizard: React.FC<{ onCompleted: () => void }> = ({ onCompleted }) => {
  const store = useSalesWizardStore();
  const { customers, accounts, staff, items, submitForm, refreshLookups, department, loading } = useSalesWizard(onCompleted);
  
  const { control, handleSubmit, watch, setValue, register, formState: { errors } } = useFormContext<SalesWizardFormData>();
  
  const currentCustomerId = useWatch({ control, name: 'customerId' });
  const staffId = useWatch({ control, name: 'staffId' });
  const paymentAccountId = useWatch({ control, name: 'paymentAccountId' });
  const phone = useWatch({ control, name: 'phone' });
  const cityId = useWatch({ control, name: 'cityId' });
  const district = useWatch({ control, name: 'district' });
  const selectedItems = useWatch({ control, name: 'items' }) || [];

  const [step, setStep] = useState(1);

  const isStep1Filled = useMemo(() => !!(
    currentCustomerId && 
    staffId && 
    paymentAccountId && 
    phone && 
    cityId && 
    district?.trim()
  ), [currentCustomerId, staffId, paymentAccountId, phone, cityId, district]);

  const isStep2Filled = useMemo(() => selectedItems.length > 0, [selectedItems.length]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (selectedItems.length > 0 || currentCustomerId) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [selectedItems.length, currentCustomerId]);

  const onSubmit = (data: SalesWizardFormData) => {
    submitForm(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full bg-[#f8fafc] rounded-3xl border border-slate-200/60 shadow-2xl overflow-hidden animate-in">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-3 bg-white/80 backdrop-blur-md border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--primary-glow)] text-[var(--primary)] rounded-2xl shadow-inner">
                <FiPlus size={20} strokeWidth={3} />
              </div>
              <div>
                <h1 className="text-lg font-black text-slate-800 tracking-tight leading-none">YENİ SATIŞ</h1>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">SİHİRBAZ ADIMI {step} / 3</span>
              </div>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black transition-all ${step === s ? 'bg-[var(--primary)] text-white shadow-lg' : s < step ? 'bg-[var(--success-glow)] text-[var(--success)]' : 'bg-slate-100 text-slate-400'}`}>
                    {s < step ? <FiCheck size={12} strokeWidth={4} /> : s}
                  </div>
                  {s < 3 && <div className={`w-8 h-0.5 rounded-full ${s < step ? 'bg-[var(--success)]' : 'bg-slate-100'}`} />}
                </div>
              ))}
            </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end mr-4">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">REFERANS</span>
            <span className="text-xs font-bold text-[var(--primary)] tracking-wider tabular-nums">
              S-{(department?.abbreviation || 'GEN').toUpperCase()}-{new Date().getFullYear()}-XXXX
            </span>
          </div>
          <button 
            type="button"
            className="h-9 px-5 text-[10px] font-black text-slate-400 hover:text-slate-600 transition-colors uppercase"
            onClick={() => { store.reset(); onCompleted(); }}
          >
            İPTAL
          </button>
          
          {step > 1 && (
            <button 
              type="button"
              className="h-10 px-6 bg-slate-100 text-slate-600 font-black text-xs rounded-xl hover:bg-slate-200 transition-all"
              onClick={() => setStep(s => s - 1)}
            >
              GERİ
            </button>
          )}

          {step < 3 ? (
            <button 
              type="button"
              className={`h-10 px-8 bg-[var(--primary)] text-white font-black text-xs rounded-xl shadow-lg shadow-[var(--primary-glow)] transition-all ${((step === 1 && !isStep1Filled) || (step === 2 && !isStep2Filled)) ? 'opacity-30 grayscale cursor-not-allowed' : 'hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]'}`}
              onClick={() => setStep(s => s + 1)}
              disabled={(step === 1 && !isStep1Filled) || (step === 2 && !isStep2Filled)}
            >
              SONRAKİ ADIM
            </button>
          ) : (
            <button 
              type="submit"
              className={`h-10 px-8 bg-[var(--success)] text-white font-black text-xs rounded-xl shadow-lg shadow-[var(--success-glow)] transition-all flex items-center gap-2 ${loading ? 'opacity-30 grayscale cursor-not-allowed' : 'hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]'}`}
              disabled={loading}
            >
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiCheck size={16} strokeWidth={3} />}
              SATIŞI TAMAMLA
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden p-6 relative">
        
        {/* Step 1: Customer & Logistics */}
        <div className={`absolute inset-6 flex gap-6 transition-all duration-500 transform ${step === 1 ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'}`}>
          <div className="w-1/2 flex flex-col gap-4 overflow-y-auto pr-1 custom-scrollbar">
            <CustomerPhase customers={customers} refreshLookups={refreshLookups} />
          </div>
          <div className="w-1/2 flex flex-col gap-4 overflow-y-auto pr-1 custom-scrollbar">
            <LogisticsPhase staff={staff} accounts={accounts} />
          </div>
        </div>

        {/* Step 2: Products */}
        <div className={`absolute inset-6 transition-all duration-500 transform ${step === 2 ? 'translate-x-0 opacity-100 scale-100' : step < 2 ? 'translate-x-full opacity-0' : '-translate-x-full opacity-0'} pointer-events-none`}>
          <div className={`h-full bg-white rounded-3xl border border-slate-200 shadow-inner flex flex-col overflow-hidden ${step === 2 ? 'pointer-events-auto' : ''}`}>
             <ProductPhase items={items} />
          </div>
        </div>

        {/* Step 3: Review & Summary */}
        <div className={`absolute inset-6 flex flex-col items-center justify-center transition-all duration-500 transform ${step === 3 ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0'} pointer-events-none`}>
          <div className={`w-full max-w-4xl space-y-8 ${step === 3 ? 'pointer-events-auto' : ''}`}>
             <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-[var(--success-glow)] text-[var(--success)] rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <FiCheck size={32} strokeWidth={3} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">SATIŞI GÖZDEN GEÇİRİN</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">İşlemi onaylamadan önce son kontrolleri yapın</p>
             </div>
             
             <div className="grid grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">MÜŞTERİ ÖZETİ</h4>
                   <div className="space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                         <span className="text-[10px] font-bold text-slate-500 uppercase">İSİM:</span>
                         <span className="text-xs font-black text-slate-800">{customers.find(c => String(c.id) === String(currentCustomerId))?.name || 'BELİRTİLMEDİ'}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                         <span className="text-[10px] font-bold text-slate-500 uppercase">TELEFON:</span>
                         <span className="text-xs font-black text-slate-800">{phone || 'BELİRTİLMEDİ'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                         <span className="text-[10px] font-bold text-slate-500 uppercase">TESLİMAT:</span>
                         <span className="text-xs font-black text-slate-800">{district}</span>
                      </div>
                   </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">LOJİSTİK ÖZETİ</h4>
                   <div className="space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                         <span className="text-[10px] font-bold text-slate-500 uppercase">TEMSİLCİ:</span>
                         <span className="text-xs font-black text-slate-800">{staff.find(s => String(s.id) === String(staffId))?.firstName || ''} {staff.find(s => String(s.id) === String(staffId))?.lastName || ''}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                         <span className="text-[10px] font-bold text-slate-500 uppercase">ÖDEME KASASI:</span>
                         <span className="text-xs font-black text-slate-800">{accounts.find(a => String(a.id) === String(paymentAccountId))?.name || 'BELİRTİLMEDİ'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                         <span className="text-[10px] font-bold text-slate-500 uppercase">ÜRÜN SAYISI:</span>
                         <span className="text-xs font-black text-slate-800">{selectedItems.length} KALEM</span>
                      </div>
                   </div>
                </div>
             </div>

             <WizardSummary />
          </div>
        </div>

      </div>
    </form>
  );
};
