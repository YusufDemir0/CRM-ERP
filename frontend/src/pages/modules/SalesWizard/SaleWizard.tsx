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
  
  const { control, handleSubmit, watch, formState: { errors } } = useFormContext<SalesWizardFormData>();
  
  const currentCustomerId = useWatch({ control, name: 'customerId' });
  const staffId = useWatch({ control, name: 'staffId' });
  const paymentAccountId = useWatch({ control, name: 'paymentAccountId' });
  const phone = useWatch({ control, name: 'phone' });
  const cityId = useWatch({ control, name: 'cityId' });
  const district = useWatch({ control, name: 'district' });
  const selectedItems = useWatch({ control, name: 'items' }) || [];

  const isMandatoryFilled = !!(
    currentCustomerId && 
    staffId && 
    paymentAccountId && 
    phone && 
    cityId && 
    district?.trim()
  );

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
        <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--primary-glow)] text-[var(--primary)] rounded-2xl shadow-inner">
              <FiPlus size={20} strokeWidth={3} />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-800 tracking-tight leading-none">YENİ SATIŞ</h1>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">TOPTAN & PERAKENDE SİHİRBAZI</span>
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
          <button 
            type="submit"
            className={`h-10 px-8 bg-[var(--primary)] text-white font-black text-xs rounded-xl shadow-lg shadow-[var(--primary-glow)] transition-all flex items-center gap-2 ${!isMandatoryFilled || selectedItems.length === 0 ? 'opacity-30 grayscale cursor-not-allowed' : 'hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]'}`}
            disabled={!isMandatoryFilled || selectedItems.length === 0 || loading}
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiCheck size={16} strokeWidth={3} />}
            {loading ? 'İŞLENİYOR' : 'SATIŞI TAMAMLA'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden p-4 gap-4">
        
        {/* Left Side (Scrollable) */}
        <div className="w-1/2 flex flex-col gap-4 overflow-y-auto pr-1 custom-scrollbar">
          <CustomerSection customers={customers} refreshLookups={refreshLookups} />
          <LogisticsSection staff={staff} accounts={accounts} />
        </div>

        {/* Right Side (Fixed) */}
        <div className="w-1/2 flex flex-col gap-4 overflow-hidden">
          <div className={`flex-1 bg-white/60 backdrop-blur-sm rounded-3xl border border-slate-200 shadow-inner flex flex-col overflow-hidden relative transition-all duration-500 ${!isMandatoryFilled ? 'opacity-40 grayscale pointer-events-none scale-[0.98]' : 'scale-100'}`}>
            {!isMandatoryFilled && (
              <div className="absolute inset-0 z-50 flex items-center justify-center">
                <div className="bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-2xl border border-slate-200 text-center max-w-xs animate-slide-up">
                  <div className="w-12 h-12 bg-[var(--primary-glow)] text-[var(--primary)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FiInfo size={24} />
                  </div>
                  <h4 className="font-black text-slate-800 text-xs uppercase mb-2">ADIM 1: BİLGİLERİ DOLDURUN</h4>
                  <p className="font-bold text-slate-500 text-[10px] leading-relaxed uppercase tracking-tight">Ürün eklemek için önce müşteri, temsilci ve kasa bilgilerini eksiksiz girmelisiniz.</p>
                </div>
              </div>
            )}
            <ProductPhase items={items} />
          </div>

          <div className={`shrink-0 transition-all duration-500 ${!isMandatoryFilled ? 'opacity-40 grayscale translate-y-2' : 'translate-y-0'}`}>
            <WizardSummary />
          </div>
        </div>

      </div>
    </form>
  );
};
