import React, { useState, useEffect, useMemo, memo } from 'react';
import { FiPlus, FiInfo, FiCheck } from 'react-icons/fi';
import { useFormContext, useWatch } from 'react-hook-form';
import { useSalesWizardStore } from '../../../store/useSalesWizardStore';
import { useSalesWizard } from '../../../hooks/useSalesWizard';
import { SearchableSelect } from '../../../components/common/SearchableSelect';
import { ProductPhase } from './components/ProductPhase';
import { WizardSummary } from './components/WizardSummary';
import { PhoneInput } from '../../../components/common/PhoneInput';
import { FormField } from '../../../components/common/FormField';
import { useTurkiyeCities, useTurkiyeDistricts } from '../../../hooks/useTurkiyeApi';
import { useQuickCreateStore } from '../../../store/useQuickCreateStore';
import { Party } from '../../../types';
import { SalesWizardFormData } from './schema';

// ─── OPTIMIZED SUB-COMPONENTS ───

const CustomerSection = memo(({ customers, refreshLookups }: { customers: any[], refreshLookups: () => void }) => {
  const { setValue, watch, register, formState: { errors }, control } = useFormContext<SalesWizardFormData>();
  const { openCreate } = useQuickCreateStore();
  const store = useSalesWizardStore();
  const [isNewInfo, setIsNewInfo] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);

  const currentCustomerId = useWatch({ control, name: 'customerId' });
  const currentCityId = useWatch({ control, name: 'cityId' });
  const taxId = useWatch({ control, name: 'taxId' });
  const email = useWatch({ control, name: 'email' });

  const { cities } = useTurkiyeCities();
  const { districts } = useTurkiyeDistricts(currentCityId ? Number(currentCityId) : null);

  const customerOptions = useMemo(() => {
    const base = (customers || []).map(c => ({ id: String(c.id), label: c.name }));
    if (store.draftData.customer && !base.find(o => String(o.id) === String(store.draftData.customer?.id))) {
      base.unshift({ id: String(store.draftData.customer.id), label: store.draftData.customer.name });
    }
    return base;
  }, [customers, store.draftData.customer]);

  const domainExtensions = ['@gmail.com', '@hotmail.com', '@outlook.com'];

  return (
    <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
         <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
           <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
           MÜŞTERİ BİLGİLERİ
         </h3>
         <div className="flex bg-slate-100/50 p-0.5 rounded-lg border border-slate-200">
            <button 
              type="button"
              onClick={() => {
                setIsNewInfo(false);
                const customer = customers.find(c => String(c.id) === String(currentCustomerId));
                if (customer) {
                  setValue('phone', customer.phone1 || '');
                  setValue('phone2', customer.phone2 || '');
                  setValue('email', customer.email || '');
                  setValue('taxId', customer.taxNumber || '');
                  setValue('address', customer.address || '');
                  setValue('cityId', customer.cityId || 0);
                  setValue('district', customer.districtName || '');
                }
              }}
              className={`px-3 py-1 text-[9px] font-black rounded-md transition-all ${!isNewInfo ? 'bg-white shadow-sm text-[var(--primary)]' : 'text-slate-400 hover:text-slate-600'}`}
            >
              KAYITLI
            </button>
            <button 
              type="button"
              onClick={() => {
                setIsNewInfo(true);
                setValue('phone', '');
                setValue('phone2', '');
                setValue('email', '');
                setValue('taxId', '');
                setValue('address', '');
                setValue('cityId', 0);
                setValue('district', '');
              }}
              className={`px-3 py-1 text-[9px] font-black rounded-md transition-all ${isNewInfo ? 'bg-white shadow-sm text-[var(--primary)]' : 'text-slate-400 hover:text-slate-600'}`}
            >
              YENİ / FARKLI
            </button>
         </div>
      </div>

      <div className="relative">
        <SearchableSelect
          placeholder="Müşteri ara veya seç..."
          options={customerOptions}
          value={currentCustomerId ? String(currentCustomerId) : null}
          onChange={(opt) => {
            const id = opt ? opt.id : '';
            setValue('customerId', id as any, { shouldValidate: true });
            const customer = customers.find(c => String(c.id) === String(id)) || null;
            
            // Sync with store
            store.setDraftData({
              ...store.draftData,
              customer,
              phone: customer?.phone1 || '',
              phone2: customer?.phone2 || '',
              email: customer?.email || '',
              taxId: customer?.taxNumber || '',
              address: customer?.address || '',
              cityId: customer?.cityId || 0,
              district: customer?.districtName || '',
            });

            if (customer && !isNewInfo) {
              setValue('phone', customer.phone1 || '');
              setValue('phone2', customer.phone2 || '');
              setValue('email', customer.email || '');
              setValue('taxId', customer.taxNumber || '');
              setValue('address', customer.address || '');
              setValue('cityId', customer.cityId || 0);
              setValue('district', customer.districtName || '');
            }
          }}
        />
        <button 
          type="button"
          onClick={() => openCreate('party', { 
            onSuccess: (res: any) => {
              refreshLookups();
              const newParty = res?.data || res;
              if (newParty?.id) setValue('customerId', newParty.id, { shouldValidate: true });
            }
          })}
          className="absolute right-0 -top-8 p-1.5 bg-[var(--success-glow)] text-[var(--success)] rounded-lg hover:bg-[var(--success)] hover:text-white transition-all z-10"
          title="Yeni Müşteri Ekle"
        >
          <FiPlus size={14} />
        </button>
        {errors.customerId && <span className="text-[10px] text-[var(--error)] font-bold mt-1 block">{errors.customerId.message}</span>}
      </div>

      <div className="grid grid-cols-2 gap-2">
         <FormField label="İLETİŞİM HATTI" className="!mb-0">
            <PhoneInput 
              value={watch('phone') || ''}
              onChange={(val) => setValue('phone', val, { shouldValidate: true })}
            />
            {errors.phone && <span className="text-[10px] text-[var(--error)] font-bold mt-1 block">{errors.phone.message}</span>}
         </FormField>
        <FormField label="E-POSTA" className="relative !mb-0">
          <input 
            type="email"
            className="input-premium h-8 text-xs font-bold"
            placeholder="ornek@mail.com"
            {...register('email')}
            onFocus={() => setEmailFocus(true)}
            onBlur={(e) => {
              register('email').onBlur(e);
              setTimeout(() => setEmailFocus(false), 200);
            }}
          />
          {emailFocus && email && !email.includes('@') && (
            <div className="absolute left-0 right-0 bg-white border border-slate-200 rounded-xl z-[110] shadow-2xl mt-1 overflow-hidden">
              {domainExtensions.map(ext => (
                <div 
                  key={ext} 
                  className="p-2 cursor-pointer hover:bg-slate-50 text-[10px] font-bold"
                  onClick={() => setValue('email', (email || '') + ext, { shouldValidate: true })}
                >
                  {email}<span className="text-[var(--primary)]">{ext}</span>
                </div>
              ))}
            </div>
          )}
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <FormField label="YEDEK TELEFON" className="!mb-0">
          <PhoneInput 
            value={watch('phone2') || ''}
            onChange={(val) => setValue('phone2', val)}
          />
        </FormField>
        <FormField label={taxId?.length === 11 ? 'T.C. KİMLİK NO' : 'VERGİ NUMARASI'} className="!mb-0">
          <input 
            className="input-premium h-8 text-xs font-bold tabular-nums"
            placeholder="TCKN / VKN"
            {...register('taxId')}
            onChange={(e) => setValue('taxId', e.target.value.replace(/\D/g, '').substring(0, 11))}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-2">
         <FormField label="TESLİMAT ŞEHRİ" className="!mb-0">
            <select 
              className="input-premium h-8 text-xs font-black cursor-pointer"
              {...register('cityId', { valueAsNumber: true })}
              onChange={(e) => {
                setValue('cityId', Number(e.target.value), { shouldValidate: true });
                setValue('district', '', { shouldValidate: true });
              }}
            >
              <option value={0}>ŞEHİR SEÇİN...</option>
              {(cities || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.cityId && <span className="text-[10px] text-[var(--error)] font-bold mt-1 block">{errors.cityId.message}</span>}
         </FormField>
         <FormField label="TESLİMAT İLÇESİ" className="!mb-0">
            <select 
              className="input-premium h-8 text-xs font-black cursor-pointer"
              disabled={!currentCityId}
              {...register('district')}
            >
              <option value="">İLÇE SEÇİN...</option>
              {(districts || []).map(d => <option key={d.id} value={d.name.toUpperCase()}>{d.name}</option>)}
            </select>
            {errors.district && <span className="text-[10px] text-[var(--error)] font-bold mt-1 block">{errors.district.message}</span>}
         </FormField>
      </div>

      <FormField label="ADRES DETAYI" className="!mb-0">
        <textarea 
          className="input-premium w-full p-2 rounded-xl min-h-[50px] text-xs font-bold"
          {...register('address')}
          onChange={(e) => setValue('address', e.target.value.toLocaleUpperCase('tr-TR'))}
          placeholder="Mahalle, cadde, no..."
        />
      </FormField>
    </div>
  );
});

const LogisticsSection = memo(({ staff, accounts }: { staff: any[], accounts: any[] }) => {
  const store = useSalesWizardStore();
  const { register, setValue, control, formState: { errors }, watch } = useFormContext<SalesWizardFormData>();
  const isTaxed = useWatch({ control, name: 'isTaxed' });
  const staffId = useWatch({ control, name: 'staffId' });
  const paymentAccountId = useWatch({ control, name: 'paymentAccountId' });

  return (
    <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 transition-all hover:shadow-md">
       <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
         <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
         SATIŞ VE LOJİSTİK
       </h3>
       
       <div className="grid grid-cols-2 gap-2">
          <FormField label="İŞLEM TARİHİ" className="!mb-0">
            <input type="date" className="input-premium h-8 text-xs font-bold" {...register('date')} />
          </FormField>
          <FormField label="TESLİMAT TARİHİ" className="!mb-0">
            <input type="date" className="input-premium h-8 text-xs font-bold" {...register('deliveryDate')} />
          </FormField>
       </div>

       <div className="grid grid-cols-2 gap-2">
          <FormField label="ALINAN KAPORA" className="!mb-0">
            <div className="relative">
              <input 
                type="number"
                className="input-premium h-9 w-full pr-8 text-sm font-black text-[var(--success)] tabular-nums"
                placeholder="0.00"
                {...register('deposit', { valueAsNumber: true })}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">₺</span>
            </div>
          </FormField>
          <div className="relative">
            <SearchableSelect
              label="SATIŞ TEMSİLCİSİ"
              placeholder="Temsilci"
              options={(staff || []).map(s => ({ id: String(s.id), label: `${s.firstName} ${s.lastName}` }))}
              value={staffId ? String(staffId) : null}
              onChange={(opt) => setValue('staffId', opt ? Number(opt.id) : 0, { shouldValidate: true })}
            />
            {errors.staffId && <span className="text-[10px] text-[var(--error)] font-bold mt-1 block">{errors.staffId.message}</span>}
          </div>
       </div>

       <div className="relative">
          <SearchableSelect
            label="ÖDEME HESABI / KASA"
            placeholder="Tahsilat yapılacak hesap"
            options={(accounts || []).map(a => ({ id: String(a.id), label: a.name }))}
            value={paymentAccountId ? String(paymentAccountId) : null}
            onChange={(opt) => {
              const id = opt ? Number(opt.id) : 0;
              setValue('paymentAccountId', id, { shouldValidate: true });
              const account = accounts.find(a => Number(a.id) === id) || null;
              store.setDraftData({ ...store.draftData, paymentAccount: account });
            }}
          />
          {errors.paymentAccountId && <span className="text-[10px] text-[var(--error)] font-bold mt-1 block">{errors.paymentAccountId.message}</span>}
       </div>

       <div className="grid grid-cols-2 gap-2">
          <FormField label="REFERANS / KAYNAK" className="!mb-0">
            <select className="input-premium h-8 text-xs font-black" {...register('source')}>
              <option value="">SEÇİNİZ...</option>
              <option value="INSTAGRAM">INSTAGRAM</option>
              <option value="SAHIBINDEN">SAHİBİNDEN</option>
              <option value="TAVSIYE">TAVSİYE</option>
            </select>
          </FormField>
          <div className="flex bg-slate-100/50 p-0.5 mt-5 rounded-lg border border-slate-200 h-8">
            <button 
              type="button"
              onClick={() => setValue('isTaxed', true)}
              className={`flex-1 py-1 rounded-md font-black text-[9px] transition-all ${isTaxed ? 'bg-white shadow-sm text-[var(--primary)]' : 'text-slate-400 hover:text-slate-600'}`}
            >
              FATURALI
            </button>
            <button 
              type="button"
              onClick={() => setValue('isTaxed', false)}
              className={`flex-1 py-1 rounded-md font-black text-[9px] transition-all ${!isTaxed ? 'bg-white shadow-sm text-[var(--primary)]' : 'text-slate-400 hover:text-slate-600'}`}
            >
              PERAKENDE
            </button>
          </div>
       </div>

       <FormField label="SATIŞ NOTLARI" className="!mb-0">
          <textarea 
            className="input-premium w-full p-2 rounded-xl min-h-[50px] text-xs font-bold"
            placeholder="Dahili notlar..."
            {...register('description')}
          />
        </FormField>
    </div>
  );
});

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
            <CustomerSection customers={customers} refreshLookups={refreshLookups} />
          </div>
          <div className="w-1/2 flex flex-col gap-4 overflow-y-auto pr-1 custom-scrollbar">
            <LogisticsSection staff={staff} accounts={accounts} />
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
                         <span className="text-xs font-black text-slate-800">{staff.find(s => Number(s.id) === Number(staffId))?.firstName || ''} {staff.find(s => Number(s.id) === Number(staffId))?.lastName || ''}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                         <span className="text-[10px] font-bold text-slate-500 uppercase">ÖDEME KASASI:</span>
                         <span className="text-xs font-black text-slate-800">{accounts.find(a => Number(a.id) === Number(paymentAccountId))?.name || 'BELİRTİLMEDİ'}</span>
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
