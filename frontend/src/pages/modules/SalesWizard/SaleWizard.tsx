import React, { useState, useEffect, useMemo, memo } from 'react';
import { FiPlus, FiInfo, FiCheck, FiArrowRight } from 'react-icons/fi';
import { useFormContext, useWatch, FieldErrors } from 'react-hook-form';
import { formatDecimal, formatCurrency } from '../../../utils/formatters';
import { Party, Staff, Account } from '../../../types';
import { useSalesWizardStore } from '../../../store/useSalesWizardStore';
import { useSalesWizard } from '../../../hooks/useSalesWizard';
import { ProductPhase } from './components/ProductPhase';
import { WizardSummary } from './components/WizardSummary';
import { CustomerPhase } from './components/CustomerPhase';
import { LogisticsPhase } from './components/LogisticsPhase';
import { StepStatusPanel } from './components/StepStatusPanel';
import { SalesWizardFormData } from './schema';
import toast from 'react-hot-toast';

const WizardHeader = memo(({ phase }: { phase: string }) => {
  return (
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-[var(--primary-glow)] text-[var(--primary)] rounded-2xl flex items-center justify-center shadow-inner">
         <FiPlus size={24} strokeWidth={3} />
      </div>
      <div className="relative h-10 overflow-hidden min-w-[200px]">
         <div className={`absolute inset-0 flex flex-col justify-center transition-all duration-500 transform ${phase === 'customer' ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
            <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none uppercase">Müşteri & İletişim</h1>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">ADIM 1: CARİ SEÇİMİ VE ADRES DOĞRULAMA</span>
         </div>
         <div className={`absolute inset-0 flex flex-col justify-center transition-all duration-500 transform ${phase === 'logistics' ? 'translate-y-0 opacity-100' : phase === 'customer' ? 'translate-y-full opacity-0' : '-translate-y-full opacity-0'}`}>
            <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none uppercase">Lojistik & Ödeme</h1>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">ADIM 2: SEVKİYAT VE ÖDEME DETAYLARI</span>
         </div>
         <div className={`absolute inset-0 flex flex-col justify-center transition-all duration-500 transform ${phase === 'products' ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
            <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none uppercase">Ürün Seçimi</h1>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">ADIM 3: SEPET VE FİYATLANDIRMA</span>
         </div>
      </div>
    </div>
  );
});

const WizardControls = memo(({ 
  phase, 
  loading, 
  handleBack, 
  handleNext, 
  onCompleted 
}: { 
  phase: string, 
  loading: boolean, 
  handleBack: () => void, 
  handleNext: () => void, 
  onCompleted: () => void 
}) => {
  const { control } = useFormContext<SalesWizardFormData>();
  const currentCustomerId = useWatch({ control, name: 'customerId' });
  const selectedItems = useWatch({ control, name: 'items' }) || [];
  const reset = useSalesWizardStore(s => s.reset);

  return (
    <div className="flex items-center gap-3">
       {phase !== 'customer' && (
          <button 
            type="button" 
            onClick={handleBack}
            className="h-10 px-6 bg-slate-100 text-slate-600 font-black text-xs rounded-xl hover:bg-slate-200 active:scale-95 transition-[background-color,transform] duration-200"
          >
            GERİ
          </button>
       )}
       
       {phase !== 'products' ? (
         <button 
           type="button"
           onClick={handleNext}
           disabled={phase === 'customer' && !currentCustomerId}
           className={`h-10 px-8 bg-[var(--primary)] text-white font-black text-xs rounded-xl shadow-lg shadow-[var(--primary-glow)] flex items-center gap-2 transition-[background-color,transform,opacity,filter] duration-200 ${phase === 'customer' && !currentCustomerId ? 'opacity-30 grayscale cursor-not-allowed' : 'hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]'}`}
         >
           DEVAM ET <FiArrowRight />
         </button>
       ) : (
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={() => { reset(); onCompleted(); }}
              className="h-10 px-5 text-[10px] font-black text-slate-400 hover:text-slate-600 active:scale-95 transition-all uppercase"
            >
              İPTAL
            </button>
            <button 
              type="submit"
              disabled={loading || selectedItems.length === 0}
              className={`h-11 px-8 bg-[var(--success)] text-white font-black text-xs rounded-xl shadow-lg shadow-[var(--success-glow)] transition-[background-color,transform,opacity,filter] duration-200 flex items-center gap-2 ${loading || selectedItems.length === 0 ? 'opacity-30 grayscale cursor-not-allowed' : 'hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]'}`}
            >
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiCheck size={18} strokeWidth={3} />}
              SATIŞI TAMAMLA
            </button>
          </div>
       )}
    </div>
  );
});

export const SaleWizard: React.FC<{ onCompleted: () => void }> = ({ onCompleted }) => {
  const phase = useSalesWizardStore(s => s.draftData.phase);
  const setPhase = useSalesWizardStore(s => s.setPhase);
  const setStep = useSalesWizardStore(s => s.setStep);
  const reset = useSalesWizardStore(s => s.reset);
  
  const { customers, accounts, staff, items, submitForm, refreshLookups, department, loading } = useSalesWizard(onCompleted);
  const { control, handleSubmit, trigger, getValues } = useFormContext<SalesWizardFormData>();

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const values = getValues();
      if ((values.items && values.items.length > 0) || values.customerId) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [getValues]);

  const onSubmit = (data: SalesWizardFormData) => {
    submitForm(data);
  };

  const onError = (errors: FieldErrors<SalesWizardFormData>) => {
    toast.error("Lütfen tüm adımlardaki zorunlu alanları (Müşteri, Lojistik, Ürünler) eksiksiz doldurun.");
    console.error("Sales Wizard Validation Errors:", errors);
  };

  const saveDraftToStore = () => {
    const values = getValues();
    const setDraftData = useSalesWizardStore.getState().setDraftData;
    setDraftData({
      phone: values.phone || '',
      phone2: values.phone2 || '',
      email: values.email || '',
      taxId: values.taxId || '',
      cityId: values.cityId || '',
      district: values.district || '',
      address: values.address || '',
      date: values.date || '',
      deliveryDate: values.deliveryDate || '',
      deposit: values.deposit !== undefined && values.deposit !== null && !isNaN(values.deposit) ? String(values.deposit) : '',
      discountAmount: String(values.discountAmount || 0),
      source: values.source || '',
      isTaxed: !!values.isTaxed,
      isInvoiced: values.isInvoiced ?? true,
      representativePrice: values.representativePrice || '0',
      description: values.description || '',
      staffId: values.staffId || '',
      maturityDays: values.maturityDays || 0,
      paymentType: values.paymentType || 'NAKİT',
      installments: values.installments || 1,
      selectedItems: (values.items || []).map(item => ({
        id: String(item.id),
        name: item.name || '',
        quantity: item.quantity || 0,
        unitPrice: item.unitPrice || 0,
        taxRate: item.taxRate || 20,
      })) as import('./types').SelectedItem[]
    });
  };

  const handleNext = async () => {
    if (phase === 'customer') {
      const isValid = await trigger(['customerId', 'cityId', 'district', 'phone']);
      if (!isValid) {
        toast.error("Lütfen müşteri ve iletişim bilgilerini eksiksiz doldurun.");
        return;
      }
      saveDraftToStore();
      setPhase('logistics');
      setStep(2);
    } else if (phase === 'logistics') {
      const isValid = await trigger(['staffId', 'date', 'deliveryDate', 'paymentAccountId', 'deposit']);
      if (!isValid) {
        toast.error("Lütfen lojistik ve personel bilgilerini eksiksiz doldurun.");
        return;
      }
      saveDraftToStore();
      setPhase('products');
      setStep(8);
    }
  };

  const handleBack = () => {
    saveDraftToStore();
    if (phase === 'products') {
      setPhase('logistics');
      setStep(7);
    } else if (phase === 'logistics') {
      setPhase('customer');
      setStep(1);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onError)} className="flex h-full bg-[#f8fafc] rounded-3xl border border-slate-200/60 shadow-2xl overflow-hidden animate-in">
      
      {/* Left Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        
        {/* Dynamic Header Label */}
        <div className="px-8 py-4 border-b border-slate-100 bg-white/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-20">
          <WizardHeader phase={phase} />

          <WizardControls 
            phase={phase} 
            loading={loading} 
            handleBack={handleBack} 
            handleNext={handleNext} 
            onCompleted={onCompleted} 
          />
        </div>

        {/* Main Phases Content */}
        <div className="flex-1 overflow-y-auto p-8 relative flex flex-col gap-10">
          
          {/* Phase: Customer & Logistics (Top Area) */}
          <div className="grid grid-cols-1 gap-6 transition-[transform,opacity] duration-500">
             {phase === 'customer' && (
               <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                  <CustomerPhase customers={customers} refreshLookups={refreshLookups} department={department} />
               </div>
             )}
             {phase === 'logistics' && (
               <div className="animate-in fade-in slide-in-from-top-4 duration-500 max-w-4xl mx-auto w-full">
                  <LogisticsPhase staff={staff} accounts={accounts} refreshLookups={refreshLookups} />
               </div>
             )}
          </div>

          {/* Phase: Products (Bottom Area with Simple Opacity) */}
          <div className={`flex-1 transition-[opacity,transform] duration-700 transform ${
            phase === 'customer' ? 'opacity-5 scale-[0.98] pointer-events-none' : 
            phase === 'logistics' ? 'opacity-30 scale-[0.99] pointer-events-none' : 
            'opacity-100 scale-100'
          }`}>
             <div className="h-full min-h-[500px] bg-white rounded-3xl border border-slate-200 shadow-inner overflow-hidden flex flex-col relative">
                <div className="absolute top-4 left-6 z-10 flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-[var(--primary)]" />
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ÜRÜN SEPETİ</h4>
                </div>
                <ProductPhase items={items} />
             </div>
          </div>
        </div>
      </div>

      {/* Right Side Progress Panel */}
      <StepStatusPanel />
      
      {/* Summary / Confirmation Modal would go here as an overlay if phase === 'summary' */}
    </form>
  );
};
