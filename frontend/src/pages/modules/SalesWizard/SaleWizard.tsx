import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { FiPlus, FiInfo, FiCheck, FiArrowRight, FiArrowLeft, FiUser, FiCalendar, FiDollarSign, FiBriefcase } from 'react-icons/fi';
import { useFormContext, useWatch } from 'react-hook-form';
import { formatCurrency } from '../../../utils/formatters';
import { useSalesWizardStore } from '../../../store/useSalesWizardStore';
import { useSalesWizard } from '../../../hooks/useSalesWizard';
import { ProductPhase } from './components/ProductPhase';
import { CustomerPhase } from './components/CustomerPhase';
import { LogisticsPhase } from './components/LogisticsPhase';
import { PreviewPhase } from './components/PreviewPhase';
import { SalesWizardFormData } from './schema';
import toast from 'react-hot-toast';
import { Decimal } from 'decimal.js';

interface StepConfig {
  id: number;
  label: string;
}

const STEPS: StepConfig[] = [
  { id: 1, label: 'Cari Seçimi' },
  { id: 2, label: 'Bilgi Doğrulama' },
  { id: 3, label: 'Teslimat Tarihi' },
  { id: 4, label: 'Kasa Seçimi' },
  { id: 5, label: 'Referans Seçimi' },
  { id: 6, label: 'Kapora & Temsilci' },
  { id: 7, label: 'Açıklama' },
  { id: 8, label: 'Ürün Seçimi' },
  { id: 9, label: 'Anlaşılan Tutar' },
  { id: 10, label: 'Fatura Tipi' },
  { id: 11, label: 'Satış Onayı' },
];

const WizardHeader = memo(({ phase }: { phase: string }) => {
  const title = useMemo(() => {
    switch (phase) {
      case 'customer': return 'MÜŞTERİ & İLETİŞİM BİLGİLERİ';
      case 'logistics': return 'LOJİSTİK & ÖDEME BİLGİLERİ';
      case 'products': return 'ÜRÜN SEÇİMİ & FİYATLANDIRMA';
      case 'preview': return 'SATIŞ ÖNİZLEME & ONAY';
      default: return 'SATIŞ SÜRECİ';
    }
  }, [phase]);

  const desc = useMemo(() => {
    switch (phase) {
      case 'customer': return 'Cari seçimi yapın ve adres/telefon bilgilerini doğrulayın';
      case 'logistics': return 'Teslimat tarihi, temsilci, kapora, kasa ve referans bilgilerini girin';
      case 'products': return 'Sepeti oluşturun, anlaşılan tutarı girin ve faturayı onaylayın';
      case 'preview': return 'Satış detaylarını kontrol edin ve onaylayın';
      default: return '';
    }
  }, [phase]);

  return (
    <div className="flex items-center gap-3.5 animate-in fade-in duration-300">
      <div className="w-10 h-10 bg-[var(--primary-glow)] text-[var(--primary)] rounded-2xl flex items-center justify-center shadow-inner">
         <span className="font-black text-base">★</span>
      </div>
      <div>
         <h1 className="text-sm font-black text-slate-800 tracking-tight leading-none uppercase">{title}</h1>
         <span className="text-[9px] font-bold text-slate-450 uppercase tracking-widest mt-1 block">{desc}</span>
      </div>
    </div>
  );
});

const StepProgressHeader = memo(({ activeStep, currentStep, onStepClick, isStepComplete, isStepUnlocked }: {
  activeStep: number;
  currentStep: number;
  onStepClick: (stepId: number) => void;
  isStepComplete: (stepId: number) => boolean;
  isStepUnlocked: (stepId: number) => boolean;
}) => {
  return (
    <div className="px-8 py-3.5 bg-slate-50 border-b border-slate-200/60 flex items-center gap-2.5 overflow-x-auto custom-scrollbar shadow-inner select-none">
      {STEPS.map((s) => {
        const isActive = currentStep === s.id;
        const isComplete = isStepComplete(s.id);
        const isUnlocked = isStepUnlocked(s.id);

        if (isActive) {
          return (
            <div 
              key={s.id}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-[var(--primary)] text-white px-4 py-2 rounded-2xl shadow-lg shadow-indigo-150 animate-in fade-in duration-300 font-black text-xs cursor-pointer shrink-0 transition-transform hover:scale-[1.02] active:scale-[0.98]"
              onClick={() => onStepClick(s.id)}
            >
              <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-[10px] font-bold">{s.id}</span>
              <span className="text-[10px] font-black uppercase tracking-wider">{s.label}</span>
            </div>
          );
        }

        if (isComplete) {
          return (
            <div 
              key={s.id}
              className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-black text-xs cursor-pointer shrink-0 transition-all hover:bg-emerald-100 hover:-translate-y-[1px] active:translate-y-0"
              onClick={() => onStepClick(s.id)}
              title={`${s.label} (Tamamlandı)`}
            >
              <span className="flex items-center gap-0.5">
                {s.id}
                <FiCheck size={10} strokeWidth={3} className="text-emerald-500" />
              </span>
            </div>
          );
        }

        return (
          <div 
            key={s.id}
            className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 transition-all ${
              isUnlocked 
                ? 'bg-white text-slate-650 border border-slate-300 shadow-sm cursor-pointer hover:bg-slate-50 hover:-translate-y-[1px] active:translate-y-0' 
                : 'bg-slate-50/50 text-slate-350 border border-slate-100 cursor-not-allowed opacity-50'
            }`}
            onClick={() => isUnlocked && onStepClick(s.id)}
            title={s.label}
          >
            {s.id}
          </div>
        );
      })}
    </div>
  );
});

export const SaleWizard: React.FC<{ onCompleted: () => void }> = ({ onCompleted }) => {
  const step = useSalesWizardStore(s => s.draftData.step);
  const phase = useSalesWizardStore(s => s.draftData.phase);
  const [confirmData, setConfirmData] = useState<SalesWizardFormData | null>(null);
  const setStep = useSalesWizardStore(s => s.setStep);
  const reset = useSalesWizardStore(s => s.reset);
  
  const { customers, accounts, staff, items, submitForm, refreshLookups, department, loading } = useSalesWizard(onCompleted);
  const { control, trigger, getValues, setValue } = useFormContext<SalesWizardFormData>();
  const watchedValues = useWatch({ control });

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

  // Dynamic step completeness verification
  const isStepSelfComplete = useCallback((stepId: number) => {
    const depVal = watchedValues.deposit !== undefined && watchedValues.deposit !== '' ? Number(watchedValues.deposit) : 0;
    const repPriceValStr = watchedValues.representativePrice;
    const hasRepPrice = repPriceValStr !== undefined && repPriceValStr !== null && String(repPriceValStr).trim() !== '';
    const repPriceVal = hasRepPrice ? Number(repPriceValStr) : 0;

    if ([3, 4, 5, 6].includes(stepId)) {
      if (hasRepPrice && !isNaN(repPriceVal) && depVal >= repPriceVal) {
        return false;
      }
    }

    switch (stepId) {
      case 1:
        return !!watchedValues.customerId;
      case 2:
        return !!watchedValues.phone && !!watchedValues.cityId && !!watchedValues.district;
      case 3:
        return !!watchedValues.deliveryDate;
      case 4:
        return !!watchedValues.paymentAccountId;
      case 5:
        return !!watchedValues.source;
      case 6:
        return !!watchedValues.staffId && watchedValues.deposit !== undefined && watchedValues.deposit !== '' && Number(watchedValues.deposit) >= 0;
      case 7:
        return true; // Notlar is optional, always true
      case 8:
        return Array.isArray(watchedValues.items) && watchedValues.items.length > 0;
      case 9:
        return watchedValues.representativePrice !== undefined && watchedValues.representativePrice !== '' && Number(watchedValues.representativePrice) >= 0;
      case 10:
        return watchedValues.isInvoiced === true || watchedValues.isInvoiced === false;
      case 11:
        return true;
      default:
        return false;
    }
  }, [watchedValues]);

  const isStepComplete = useCallback((stepId: number) => {
    for (let s = 1; s <= stepId; s++) {
      if (!isStepSelfComplete(s)) return false;
    }
    return true;
  }, [isStepSelfComplete]);

  const isStepUnlocked = useCallback((stepId: number) => {
    if (stepId === 1) return true;
    return isStepComplete(stepId - 1);
  }, [isStepComplete]);

  // First incomplete step
  const activeStep = useMemo(() => {
    for (let s = 1; s <= 11; s++) {
      if (!isStepComplete(s)) return s;
    }
    return 11;
  }, [isStepComplete]);

  // Automatically keep step synchronized if the computed activeStep is in the same phase as the store
  useEffect(() => {
    const storePhase = useSalesWizardStore.getState().draftData.phase;
    let computedPhase: 'customer' | 'logistics' | 'products' | 'preview' = 'customer';
    if (activeStep >= 3 && activeStep <= 7) computedPhase = 'logistics';
    else if (activeStep >= 8 && activeStep <= 10) computedPhase = 'products';
    else if (activeStep >= 11) computedPhase = 'preview';

    if (computedPhase === storePhase && activeStep !== step) {
      setStep(activeStep);
    }
  }, [activeStep, step, setStep]);

  // Validate deposit vs representativePrice when reaching step 11
  useEffect(() => {
    if (step === 11) {
      const dep = Number(getValues('deposit') || 0);
      const repPrice = Number(getValues('representativePrice') || 0);
      if (repPrice > 0 && dep > repPrice) {
        toast.error(`Kapora tutarı (${formatCurrency(dep.toString())}), anlaşılan toplam satış tutarından (${formatCurrency(repPrice.toString())}) büyük olamaz!`);
        saveDraftToStore();
        setStep(6);
        return;
      }

      const todayStr = new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Istanbul' }).format(new Date());
      const dateVal = getValues('date');
      const isNewSale = !useSalesWizardStore.getState().draftData.id;
      if (isNewSale && dateVal && dateVal !== todayStr) {
        toast.error("İşlem tarihi bugünün tarihi olmalıdır!");
        setValue('date', todayStr);
        setStep(3);
        return;
      }
      if (!isNewSale && dateVal && dateVal !== useSalesWizardStore.getState().draftData.date) {
        toast.error("İşlem tarihi değiştirilemez!");
        setValue('date', useSalesWizardStore.getState().draftData.date || todayStr);
        setStep(3);
        return;
      }

      const deliveryDateVal = getValues('deliveryDate');
      if (deliveryDateVal && deliveryDateVal < todayStr) {
        toast.error("Teslimat tarihi bugünden önceki bir tarih olamaz!");
        setStep(3);
        return;
      }
    }
  }, [step, getValues, setStep, setValue]);

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
      isInvoiced: values.isInvoiced,
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

  const handleNextPhase = async () => {
    if (phase === 'customer') {
      const isValid = await trigger(['customerId', 'phone', 'cityId', 'district', 'address']);
      if (isValid) {
        saveDraftToStore();
        setStep(3); // This automatically sets phase to 'logistics'
      } else {
        toast.error("Lütfen tüm müşteri ve adres alanlarını doldurun.");
      }
    } else if (phase === 'logistics') {
      const isValid = await trigger(['deliveryDate', 'staffId', 'deposit', 'paymentAccountId', 'source']);
      if (isValid) {
        saveDraftToStore();
        const dep = Number(getValues('deposit') || 0);
        const repPriceStr = getValues('representativePrice');
        if (repPriceStr && repPriceStr.trim() !== '') {
          const repPrice = Number(repPriceStr);
          if (!isNaN(repPrice) && dep > repPrice) {
            toast.error(`Kapora tutarı (${formatCurrency(dep.toString())}), anlaşılan toplam satış tutarından (${formatCurrency(repPrice.toString())}) büyük olamaz!`);
            setStep(6);
            return;
          }
        }
        setStep(8); // This automatically sets phase to 'products'
      } else {
        toast.error("Lütfen lojistik ve ödeme bilgilerini eksiksiz doldurun.");
      }
    } else if (phase === 'products') {
      saveDraftToStore();
      const dep = Number(getValues('deposit') || 0);
      const repPriceStr = getValues('representativePrice');
      if (!repPriceStr || repPriceStr.trim() === '') {
        toast.error("Anlaşılan toplam satış tutarı boş olamaz!");
        setStep(9);
        return;
      }
      const repPrice = Number(repPriceStr);
      if (dep > repPrice) {
        toast.error(`Kapora tutarı (${formatCurrency(dep.toString())}), anlaşılan toplam satış tutarından (${formatCurrency(repPrice.toString())}) büyük olamaz!`);
        setStep(6);
        return;
      }
      setStep(11); // This automatically sets phase to 'preview'
    }
  };

  const handleBackPhase = () => {
    saveDraftToStore();
    if (phase === 'logistics') {
      setStep(1);
    } else if (phase === 'products') {
      setStep(3);
    } else if (phase === 'preview') {
      setStep(8);
    }
  };

  const handleStepClick = async (stepId: number) => {
    if (!isStepUnlocked(stepId)) {
      toast.error("Bu adıma geçebilmek için önceki adımları eksiksiz doldurmalısınız.");
      return;
    }
    // If transitioning phases, trigger validation
    let targetPhase: 'customer' | 'logistics' | 'products' | 'preview' = 'customer';
    if (stepId >= 3 && stepId <= 7) targetPhase = 'logistics';
    else if (stepId >= 8 && stepId <= 10) targetPhase = 'products';
    else if (stepId >= 11) targetPhase = 'preview';

    if (phase === 'customer' && targetPhase !== 'customer') {
      const isValid = await trigger(['customerId', 'phone', 'cityId', 'district', 'address']);
      if (!isValid) {
        toast.error("Lütfen önce müşteri ve adres bilgilerini doldurun.");
        return;
      }
    } else if (phase === 'logistics' && targetPhase === 'products') {
      const isValid = await trigger(['deliveryDate', 'staffId', 'deposit', 'paymentAccountId', 'source']);
      if (!isValid) {
        toast.error("Lütfen önce lojistik ve ödeme bilgilerini doldurun.");
        return;
      }
    }

    const dep = Number(getValues('deposit') || 0);
    const repPriceStr = getValues('representativePrice');
    if (stepId >= 9 && (!repPriceStr || repPriceStr.trim() === '')) {
      toast.error("Anlaşılan toplam satış tutarı boş olamaz!");
      setStep(9);
      return;
    }
    if (repPriceStr && repPriceStr.trim() !== '') {
      const repPrice = Number(repPriceStr);
      if (!isNaN(repPrice) && dep >= repPrice) {
        toast.error(`Kapora tutarı (${formatCurrency(dep.toString())}), anlaşılan toplam satış tutarından (${formatCurrency(repPrice.toString())}) büyük veya eşit olamaz!`);
        saveDraftToStore();
        setStep(6);
        return;
      }
    }

    saveDraftToStore();
    setStep(stepId);
  };

  // Check phase completion status to highlight progress
  const isCustomerPhaseComplete = isStepComplete(2);
  const isLogisticsPhaseComplete = isStepComplete(7);
  const isProductsPhaseComplete = isStepComplete(10);

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] rounded-3xl border border-slate-200/60 shadow-2xl overflow-hidden animate-in">
      
      {/* Top Header Panel */}
      <div className="px-8 py-4 border-b border-slate-100 bg-white flex items-center justify-between sticky top-0 z-20 shrink-0">
        <WizardHeader phase={phase} />

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {phase !== 'customer' && (
            <button 
              type="button" 
              onClick={handleBackPhase}
              className="h-10 px-5 bg-slate-100 text-slate-600 font-black text-xs rounded-xl hover:bg-slate-200 active:scale-95 transition-[background-color,transform] duration-200 flex items-center gap-1.5 uppercase"
            >
              <FiArrowLeft size={14} /> GERİ DÖN
            </button>
          )}
          
          {phase !== 'preview' ? (
            <button 
              type="button"
              onClick={handleNextPhase}
              disabled={
                (phase === 'customer' && !isCustomerPhaseComplete) ||
                (phase === 'logistics' && !isLogisticsPhaseComplete) ||
                (phase === 'products' && !isProductsPhaseComplete)
              }
              className={`h-10 px-6 bg-[var(--primary)] text-white font-black text-xs rounded-xl shadow-lg transition-[background-color,transform,opacity,filter] duration-200 flex items-center gap-2 uppercase ${
                (phase === 'customer' && !isCustomerPhaseComplete) || (phase === 'logistics' && !isLogisticsPhaseComplete) || (phase === 'products' && !isProductsPhaseComplete)
                  ? 'opacity-40 cursor-not-allowed'
                  : 'shadow-[var(--primary-glow)] hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]'
              }`}
            >
              {phase === 'products' ? 'ÖNİZLEMEYE GEÇ' : 'DEVAM ET'} <FiArrowRight size={14} />
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
                type="button"
                onClick={() => { const data = getValues(); setConfirmData(data); }}
                disabled={loading || !watchedValues.items || watchedValues.items.length === 0 || !isStepComplete(10)}
                title="Satışı tamamla"
                className={`h-11 px-8 bg-[var(--success)] text-white font-black text-xs rounded-xl shadow-lg transition-[background-color,transform,opacity,filter] duration-200 flex items-center gap-2 ${
                  loading || !watchedValues.items || watchedValues.items.length === 0 || !isStepComplete(10)
                    ? 'opacity-30 grayscale cursor-not-allowed' 
                    : 'shadow-[var(--success-glow)] hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]'
                }`}
              >
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiCheck size={18} strokeWidth={3} />}
                SATIŞI TAMAMLA
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 11-Step Progress Stepper Header */}
      <StepProgressHeader 
        activeStep={activeStep} 
        currentStep={step}
        onStepClick={handleStepClick}
        isStepComplete={isStepComplete}
        isStepUnlocked={isStepUnlocked}
      />

      {/* Main Form Fields Content */}
      <div className="flex-1 overflow-y-auto p-8 relative flex flex-col">
        {phase === 'customer' && (
          <div className="max-w-4xl mx-auto w-full animate-in fade-in duration-300">
             <CustomerPhase 
               customers={customers} 
               refreshLookups={refreshLookups} 
               department={department} 
             />
          </div>
        )}
        
        {phase === 'logistics' && (
          <div className="max-w-4xl mx-auto w-full animate-in fade-in duration-300">
             <LogisticsPhase 
               staff={staff} 
               accounts={accounts} 
               refreshLookups={refreshLookups} 
             />
          </div>
        )}

        {phase === 'products' && (
          <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col min-h-0">
             <ProductPhase 
               items={items} 
             />
          </div>
        )}

        {phase === 'preview' && (
          <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col min-h-0">
             <PreviewPhase />
          </div>
        )}
      </div>

      {confirmData && (() => {
        const customer = customers.find(c => String(c.id) === String(confirmData.customerId));
        const representative = staff.find(s => String(s.id) === String(confirmData.staffId));
        
        const subtotal = (confirmData.items || []).reduce((acc, i) => acc.add(new Decimal(i?.unitPrice || 0).mul(i?.quantity || 0)), new Decimal(0));
        const totalInput = new Decimal(confirmData.representativePrice || 0);
        const totalTax = (() => {
          if (!confirmData.isInvoiced) return new Decimal(0);
          return (confirmData.items || []).reduce((acc, i) => {
            const rate = new Decimal(i?.taxRate || 20);
            const lineAmount = new Decimal(i?.unitPrice || 0).mul(i?.quantity || 0);
            const lineRatio = subtotal.gt(0) ? lineAmount.div(subtotal) : new Decimal(0);
            const lineTotal = totalInput.mul(lineRatio);
            const lineMatrah = lineTotal.div(new Decimal(1).add(rate.div(100)));
            const lineKdv = lineTotal.minus(lineMatrah);
            return acc.add(lineKdv.toDecimalPlaces(2));
          }, new Decimal(0));
        })();
        const grandTotal = totalInput;

        const turkishDayNames = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
        const dateObj = new Date(confirmData.date || new Date());
        const dayName = turkishDayNames[dateObj.getDay()];
        const formattedDate = dateObj.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });

        const paymentAccount = accounts.find(a => String(a.id) === String(confirmData.paymentAccountId));
        const depositAmount = new Decimal(confirmData.deposit || 0);
        const remainingAmount = grandTotal.sub(depositAmount);

        return (
          <div className="fixed inset-0 z-modal flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-2xl w-full overflow-hidden transform scale-100 animate-in zoom-in-95 duration-200">
              <div className="p-6 bg-gradient-to-r from-primary to-primary-light text-white flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <FiInfo size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight">SATIŞI ONAYLA</h3>
                  <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest mt-0.5">Lütfen bilgileri son kez kontrol edin</p>
                </div>
              </div>
              
              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* 1. Müşteri (Cari) Bilgisi - Full Width */}
                <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-100/80 flex gap-4 items-center">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-650 flex items-center justify-center shrink-0">
                    <FiUser size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">MÜŞTERİ (CARİ HESAP)</span>
                    <span className="text-sm font-black text-slate-800 uppercase mt-0.5 block break-words">
                      {customer ? customer.name.toUpperCase() : 'BİLİNMİYOR'}
                    </span>
                  </div>
                </div>

                {/* 2. Temsilci ve Tarih - Yan Yana */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-100/80 flex gap-4 items-center">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-655 flex items-center justify-center shrink-0">
                      <FiBriefcase size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">SATIŞ TEMSİLCİSİ</span>
                      <span className="text-xs font-black text-slate-800 uppercase mt-0.5 block truncate">
                        {representative ? `${representative.firstName} ${representative.lastName}`.toUpperCase() : 'BELİRTİLMEMİŞ'}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-100/80 flex gap-4 items-center">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-655 flex items-center justify-center shrink-0">
                      <FiCalendar size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">SATIŞ TARİHİ</span>
                      <span className="text-xs font-black text-slate-800 mt-0.5 block">
                        {formattedDate} <span className="text-slate-400 font-bold">({dayName})</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Finansal Özet Tablosu */}
                <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-200/60 space-y-3.5">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">FİNANSAL DETAYLAR</span>
                  
                  {/* Satış Tutarı */}
                  <div className="flex justify-between items-center py-2 border-b border-dashed border-slate-200">
                    <span className="text-xs font-bold text-slate-500 uppercase">Toplam Satış Tutarı</span>
                    <span className="text-sm font-black text-slate-800 tabular-nums">
                      {formatCurrency(grandTotal.toString())}
                    </span>
                  </div>

                  {/* Varsa Kapora Tutarı */}
                  {depositAmount.gt(0) && (
                    <>
                      <div className="flex justify-between items-center py-2 border-b border-dashed border-slate-200">
                        <span className="text-xs font-bold text-slate-555 uppercase">Alınan Kapora (Tahsilat)</span>
                        <span className="text-sm font-black text-emerald-600 tabular-nums">
                          - {formatCurrency(depositAmount.toString())}
                        </span>
                      </div>
                      
                      {/* Kapora Hesabı */}
                      {paymentAccount && (
                        <div className="flex justify-between items-center py-2 border-b border-dashed border-slate-200">
                          <span className="text-xs font-bold text-slate-555 uppercase">Kapora Kasa/Banka Hesabı</span>
                          <span className="text-xs font-black text-slate-600 uppercase truncate max-w-[320px]">
                            {paymentAccount.name}
                          </span>
                        </div>
                      )}

                      {/* Kalan Cari Borç */}
                      <div className="flex justify-between items-center py-2">
                        <span className="text-xs font-bold text-slate-555 uppercase">Kalan Cari Borç</span>
                        <span className="text-sm font-black text-indigo-600 tabular-nums">
                          {formatCurrency(remainingAmount.toString())}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  className="flex-1 btn bg-white border border-slate-200 text-slate-600 font-black text-xs hover:bg-slate-100 transition-all py-3 rounded-xl uppercase"
                  onClick={() => setConfirmData(null)}
                >
                  VAZGEÇ
                </button>
                <button
                  type="button"
                  className="flex-1 btn btn-primary font-black text-xs shadow-lg shadow-[var(--primary-glow)] py-3 rounded-xl uppercase"
                  onClick={() => {
                    submitForm(confirmData);
                    setConfirmData(null);
                  }}
                >
                  EVET, ONAYLIYORUM
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
