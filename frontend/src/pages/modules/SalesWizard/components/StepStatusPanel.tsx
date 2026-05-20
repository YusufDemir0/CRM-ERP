import React, { memo, useMemo } from 'react';
import { FiCheck, FiUser, FiMapPin, FiCalendar, FiUsers, FiCreditCard, FiPackage, FiZap } from 'react-icons/fi';
import { useSalesWizardStore } from '../../../../store/useSalesWizardStore';
import { useFormContext, useWatch } from 'react-hook-form';
import { SalesWizardFormData } from '../schema';

type StepField = keyof SalesWizardFormData;

interface StepConfig {
  id: number;
  label: string;
  icon: React.ReactNode;
  fields: StepField[];
}

const STEPS: StepConfig[] = [
  { id: 1, label: 'Müşteri Seçimi', icon: <FiUser size={14} />, fields: ['customerId'] },
  { id: 2, label: 'Adres & İletişim', icon: <FiMapPin size={14} />, fields: ['address', 'phone', 'cityId', 'district'] },
  { id: 3, label: 'İşlem Tarihleri', icon: <FiCalendar size={14} />, fields: ['date', 'deliveryDate'] },
  { id: 4, label: 'Temsilci & Kaynak', icon: <FiUsers size={14} />, fields: ['staffId', 'source'] },
  { id: 5, label: 'Ödeme & Kasa', icon: <FiCreditCard size={14} />, fields: ['paymentAccountId'] },
  { id: 6, label: 'Ürün Seçimi', icon: <FiPackage size={14} />, fields: ['items'] },
  { id: 7, label: 'Onay & Kayıt', icon: <FiZap size={14} />, fields: [] },
];

const StepItem = memo(({ step, phase }: { step: StepConfig; phase: string }) => {
  const { control } = useFormContext<SalesWizardFormData>();
  
  // Watch only fields relevant to this step
  const fieldValues = useWatch({
    control,
    name: step.fields,
  });

  const status = useMemo(() => {
    // Check if fields are filled
    const isFilled = step.fields.some((_, idx) => {
      const val = fieldValues[idx];
      if (Array.isArray(val)) return val.length > 0;
      return !!val;
    });

    const isAllValidated = step.fields.every((_, idx) => {
      const val = fieldValues[idx];
      if (Array.isArray(val)) return val.length > 0;
      return !!val;
    });

    const currentPhaseIndex = ['customer', 'logistics', 'products'].indexOf(phase);
    const stepPhaseIndex = step.id <= 2 ? 0 : step.id <= 5 ? 1 : 2;

    if (currentPhaseIndex > stepPhaseIndex) return 'completed';
    if (isAllValidated && step.fields.length > 0) return 'completed';
    if (isFilled) return 'filled';
    return 'empty';
  }, [fieldValues, step.fields, step.id, phase]);

  const stepPhaseLabel = step.id <= 2 ? 'customer' : step.id <= 5 ? 'logistics' : 'products';
  const isActive = phase === stepPhaseLabel;

  const colors = {
    completed: 'bg-emerald-500 text-white shadow-lg shadow-emerald-100',
    filled: 'bg-blue-500 text-white shadow-lg shadow-blue-100',
    empty: 'bg-slate-900 text-slate-400 shadow-sm'
  };

  return (
    <div className={`flex items-center gap-3 transition-all duration-300 ${isActive ? 'scale-[1.02] opacity-100' : 'opacity-50'}`}>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform duration-300 ${colors[status]} ${isActive ? 'ring-2 ring-offset-2 ring-primary' : ''}`}>
        {status === 'completed' ? <FiCheck size={14} strokeWidth={4} /> : step.icon}
      </div>
      
      <div className="flex flex-col">
        <span className={`text-[10px] font-black uppercase tracking-tight ${isActive ? 'text-primary' : 'text-slate-600'}`}>
          {step.label}
        </span>
        {isActive && status === 'empty' && (
          <span className="text-[8px] font-bold text-slate-300 uppercase">BİLGİ BEKLENİYOR</span>
        )}
        {isActive && status === 'filled' && (
          <span className="text-[8px] font-bold text-blue-400 animate-pulse uppercase">DOLDURULUYOR...</span>
        )}
        {status === 'completed' && (
           <span className="text-[8px] font-bold text-emerald-500 uppercase">TAMAMLANDI</span>
        )}
      </div>
    </div>
  );
});

export const StepStatusPanel: React.FC = memo(() => {
  const phase = useSalesWizardStore(s => s.draftData.phase);
  
  return (
    <div className="w-72 bg-white/40 backdrop-blur-xl border-l border-slate-200/60 p-6 flex flex-col gap-6 h-full">
      <div className="flex flex-col">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SATIŞ SÜRECİ</h3>
        <p className="text-xs font-bold text-slate-800">7 ADIMDA KONTROL</p>
      </div>

      <div className="flex flex-col gap-2.5 overflow-y-auto pr-1 modern-scrollbar">
        {STEPS.map((step) => (
          <StepItem key={step.id} step={step} phase={phase} />
        ))}
      </div>

      <div className="mt-auto p-4 bg-white/60 rounded-2xl border border-white shadow-inner">
         <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">GENEL İLERLEME</span>
              <span className="text-[10px] font-black text-primary tabular-nums">
                PANEL AKTİF
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-primary-light transition-all duration-500" 
                  style={{ width: '100%' }}
                />
            </div>
         </div>
      </div>
    </div>
  );
});
