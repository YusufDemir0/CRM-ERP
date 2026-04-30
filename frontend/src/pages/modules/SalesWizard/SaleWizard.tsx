import React, { useState, useEffect, useMemo } from 'react';
import { FiPlus, FiInfo } from 'react-icons/fi';
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

export const SaleWizard: React.FC<{ onCompleted: () => void }> = ({ onCompleted }) => {
  const store = useSalesWizardStore();
  const { openCreate } = useQuickCreateStore();
  const { customers, accounts, staff, items, submitForm, refreshLookups, department, loading } = useSalesWizard(onCompleted);
  const [emailFocus, setEmailFocus] = useState(false);
  const [isNewInfo, setIsNewInfo] = useState(false);
  
  const { register, control, setValue, handleSubmit, watch, formState: { errors } } = useFormContext<SalesWizardFormData>();
  
  const currentCityId = useWatch({ control, name: 'cityId' });
  const currentCustomerId = useWatch({ control, name: 'customerId' });
  const selectedItems = useWatch({ control, name: 'items' }) || [];
  const taxId = useWatch({ control, name: 'taxId' });
  const isTaxed = useWatch({ control, name: 'isTaxed' });
  
  const { cities } = useTurkiyeCities();
  const { districts } = useTurkiyeDistricts(currentCityId || null);

  const customerOptions = useMemo(() => {
    const base = (customers || []).map(c => ({ id: String(c.id), label: c.name }));
    if (store.draftData.customer && !base.find(o => String(o.id) === String(store.draftData.customer?.id))) {
      base.unshift({ id: String(store.draftData.customer.id), label: store.draftData.customer.name });
    }
    return base;
  }, [customers, store.draftData.customer]);

  const domainExtensions = ['@gmail.com', '@hotmail.com', '@outlook.com'];

  const getTaxLabel = () => {
    const len = taxId?.length || 0;
    if (len === 10) return 'VKN';
    if (len === 11) return 'TCKN';
    return 'VERGİ NO / T.C NO';
  };

  const isMandatoryFilled = !!(
    currentCustomerId && 
    watch('staffId') && 
    watch('paymentAccountId') && 
    watch('phone') && 
    watch('cityId') && 
    watch('district')?.trim()
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
  }, [selectedItems, currentCustomerId]);

  const onSubmit = (data: SalesWizardFormData) => {
    submitForm(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full bg-slate-50/50 backdrop-blur-xl rounded-2xl border border-white/20 shadow-premium overflow-hidden animate-in">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-100 shrink-0">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <span className="p-1.5 bg-[var(--primary-glow)] text-[var(--primary)] rounded-xl">
              <FiPlus size={20} />
            </span>
            SATIŞ SİHİRBAZI
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end mr-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SATIŞ NUMARASI</span>
            <span className="text-sm font-bold text-[var(--primary)] tracking-wider">
              S-{(department?.abbreviation || 'GEN').toUpperCase()}-2024-XXX
            </span>
          </div>
          <button 
            type="button"
            className="btn bg-slate-100 text-slate-500 font-bold h-10 px-6 rounded-xl hover:bg-slate-200 transition-all"
            onClick={() => { store.reset(); onCompleted(); }}
          >
            İPTAL
          </button>
          <button 
            type="submit"
            className={`btn btn-primary px-8 h-10 font-black rounded-xl shadow-lg transition-all ${!isMandatoryFilled || selectedItems.length === 0 ? 'opacity-30 grayscale cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
            disabled={!isMandatoryFilled || selectedItems.length === 0 || loading}
          >
            {loading ? 'İŞLENİYOR...' : 'SATIŞI TAMAMLA'}
          </button>
        </div>
      </div>

      {/* Main Content: 50/50 Split */}
      <div className="flex flex-1 overflow-hidden p-3 gap-3">
        
        {/* Left Side: Customer & Sale Details (50%) */}
        <div className="w-1/2 flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
          
          {/* Section 1: Customer Selection */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">MÜŞTERİ SEÇİMİ</h3>
               <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-100">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsNewInfo(false);
                      const customer = customers.find(c => c.id === currentCustomerId);
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
                    className={`px-3 py-1 text-[10px] font-black rounded-md transition-all ${!isNewInfo ? 'bg-white shadow-sm text-[var(--primary)]' : 'text-slate-400'}`}
                  >
                    MEVCUT BİLGİLER
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
                    className={`px-3 py-1 text-[10px] font-black rounded-md transition-all ${isNewInfo ? 'bg-white shadow-sm text-[var(--primary)]' : 'text-slate-400'}`}
                  >
                    YENİ BİLGİLER
                  </button>
               </div>
            </div>

            <div className="relative">
              <SearchableSelect
                placeholder="Müşteri ara veya seç..."
                options={customerOptions}
                value={currentCustomerId ? String(currentCustomerId) : null}
                onChange={(opt) => {
                  const id = opt ? Number(opt.id) : 0;
                  setValue('customerId', id, { shouldValidate: true });
                  const customer = customers.find(c => c.id === id);
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
                  onSuccess: (res: unknown) => {
                    refreshLookups();
                    const response = res as { data?: Party } & Party;
                    const newParty = response?.data ? response.data : response;
                    if (newParty && typeof newParty === 'object' && 'id' in newParty) {
                      setValue('customerId', newParty.id, { shouldValidate: true });
                    }
                  }
                })}
                className="absolute right-0 -top-8 p-1.5 bg-[var(--success-glow)] text-[var(--success)] rounded-lg hover:bg-[var(--success)] hover:text-white transition-all z-10"
                title="Yeni Müşteri Ekle"
              >
                <FiPlus size={14} />
              </button>
              {errors.customerId && <span className="text-xs text-[var(--error)] mt-1">{errors.customerId.message}</span>}
            </div>

            {/* Customer Details Form */}
            <div className="grid grid-cols-2 gap-3">
               <FormField label="TEL 1">
                  <PhoneInput 
                    value={watch('phone') || ''}
                    onChange={(val) => setValue('phone', val, { shouldValidate: true })}
                  />
                  {errors.phone && <span className="text-xs text-[var(--error)] mt-1">{errors.phone.message}</span>}
               </FormField>
              <FormField label="E-POSTA" className="relative">
                <input 
                  type="email"
                  className="input-premium h-9 text-sm font-bold"
                  placeholder="ornek@mail.com"
                  {...register('email')}
                  onFocus={() => setEmailFocus(true)}
                  onBlur={(e) => {
                    register('email').onBlur(e);
                    setTimeout(() => setEmailFocus(false), 200);
                  }}
                />
                {emailFocus && watch('email') && !watch('email')?.includes('@') && (
                  <div className="absolute left-0 right-0 bg-white border border-slate-200 rounded-xl z-[110] shadow-2xl mt-1 overflow-hidden">
                    {domainExtensions.map(ext => (
                      <div 
                        key={ext} 
                        className="p-2 cursor-pointer hover:bg-slate-50 text-xs font-bold"
                        onClick={() => setValue('email', (watch('email') || '') + ext, { shouldValidate: true })}
                      >
                        {watch('email')}<span className="text-[var(--primary)]">{ext}</span>
                      </div>
                    ))}
                  </div>
                )}
                {errors.email && <span className="text-xs text-[var(--error)] mt-1">{errors.email.message}</span>}
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="TEL 2">
                <PhoneInput 
                  value={watch('phone2') || ''}
                  onChange={(val) => setValue('phone2', val)}
                />
              </FormField>
              <FormField label={getTaxLabel()}>
                <input 
                  className="input-premium h-9 text-sm font-bold tabular-nums"
                  placeholder="TCKN / VKN"
                  value={watch('taxId') || ''}
                  onChange={(e) => setValue('taxId', e.target.value.replace(/\D/g, '').substring(0, 11))}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
               <FormField label="ŞEHİR / İL">
                  <select 
                    className="input-premium h-9 text-sm font-black"
                    {...register('cityId', { valueAsNumber: true })}
                    onChange={(e) => {
                      setValue('cityId', Number(e.target.value), { shouldValidate: true });
                      setValue('district', '', { shouldValidate: true });
                    }}
                  >
                    <option value={0}>SEÇİNİZ...</option>
                    {(cities || []).map(c => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
                  </select>
                  {errors.cityId && <span className="text-xs text-[var(--error)] mt-1">{errors.cityId.message}</span>}
               </FormField>
               <FormField label="İLÇE / BÖLGE">
                  <select 
                    className="input-premium h-9 text-sm font-black"
                    disabled={!currentCityId}
                    {...register('district')}
                  >
                    <option value="">SEÇİNİZ...</option>
                    {(districts || []).map(d => <option key={d.id} value={d.name.toUpperCase()}>{d.name.toUpperCase()}</option>)}
                  </select>
                  {errors.district && <span className="text-xs text-[var(--error)] mt-1">{errors.district.message}</span>}
               </FormField>
            </div>

            <FormField label="ADRES DETAYI">
              <textarea 
                className="input-premium w-full p-3 rounded-xl min-h-[60px] text-sm font-bold"
                {...register('address')}
                onChange={(e) => setValue('address', e.target.value.toLocaleUpperCase('tr-TR'))}
                placeholder="Mahalle, cadde, no..."
              />
            </FormField>
          </div>

          {/* Section 2: Sale Logistics */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
             <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">SATIŞ VE TESLİMAT</h3>
             
             <div className="grid grid-cols-2 gap-3">
                <FormField label="SATIŞ TARİHİ">
                  <input 
                    type="date"
                    className="input-premium h-9 text-sm font-bold"
                    {...register('date')}
                  />
                  {errors.date && <span className="text-xs text-[var(--error)] mt-1">{errors.date.message}</span>}
                </FormField>
                <FormField label="TESLİMAT TARİHİ">
                  <input 
                    type="date"
                    className="input-premium h-9 text-sm font-bold"
                    {...register('deliveryDate')}
                    min={watch('date')}
                  />
                  {errors.deliveryDate && <span className="text-xs text-[var(--error)] mt-1">{errors.deliveryDate.message}</span>}
                </FormField>
             </div>

             <div className="grid grid-cols-2 gap-3">
                <FormField label="ALINAN KAPORA (TL)">
                  <input 
                    type="number"
                    className="input-premium h-10 text-lg font-black text-[var(--success)] tabular-nums"
                    placeholder="0.00"
                    {...register('deposit', { valueAsNumber: true })}
                  />
                </FormField>
                <div className="relative">
                  <SearchableSelect
                    label="SATIŞ TEMSİLCİSİ"
                    placeholder="Temsilci seç"
                    options={(staff || []).map(s => ({ id: String(s.id), label: `${s.firstName} ${s.lastName}` }))}
                    value={watch('staffId') ? String(watch('staffId')) : null}
                    onChange={(opt) => setValue('staffId', opt ? Number(opt.id) : 0, { shouldValidate: true })}
                  />
                  {errors.staffId && <span className="text-xs text-[var(--error)] mt-1">{errors.staffId.message}</span>}
                </div>
             </div>

             <div className="relative">
                <SearchableSelect
                  label="ÖDEME HESABI / KASA"
                  placeholder="Kasa seçin"
                  options={(accounts || []).map(a => ({ id: String(a.id), label: a.name }))}
                  value={watch('paymentAccountId') ? String(watch('paymentAccountId')) : null}
                  onChange={(opt) => setValue('paymentAccountId', opt ? Number(opt.id) : 0, { shouldValidate: true })}
                />
                {errors.paymentAccountId && <span className="text-xs text-[var(--error)] mt-1">{errors.paymentAccountId.message}</span>}
             </div>

             <div className="grid grid-cols-2 gap-3">
                <FormField label="NEREDEN DUYDU?">
                  <select 
                    className="input-premium h-9 text-sm font-black"
                    {...register('source')}
                  >
                    <option value="">SEÇİNİZ...</option>
                    <option value="INSTAGRAM">INSTAGRAM</option>
                    <option value="SAHIBINDEN">SAHİBİNDEN</option>
                    <option value="TAVSIYE">TAVSİYE</option>
                  </select>
                </FormField>
                <div className="flex bg-slate-50 p-1 mt-6 rounded-lg border border-slate-100 h-10">
                  <button 
                    type="button"
                    onClick={() => setValue('isTaxed', true)}
                    className={`flex-1 py-1 rounded-md font-black text-[10px] transition-all ${isTaxed ? 'bg-white shadow-sm text-[var(--primary)]' : 'text-slate-400'}`}
                  >
                    FATURALI
                  </button>
                  <button 
                    type="button"
                    onClick={() => setValue('isTaxed', false)}
                    className={`flex-1 py-1 rounded-md font-black text-[10px] transition-all ${!isTaxed ? 'bg-white shadow-sm text-[var(--primary)]' : 'text-slate-400'}`}
                  >
                    FATURASIZ
                  </button>
                </div>
             </div>

             <FormField label="SATIŞ NOTLARI">
                <textarea 
                  className="input-premium w-full p-3 rounded-xl min-h-[60px] text-sm font-bold"
                  placeholder="Notlarınızı buraya yazın..."
                  {...register('description')}
                />
              </FormField>
          </div>
        </div>

        {/* Right Side: Products & Summary (50%) */}
        <div className="w-1/2 flex flex-col gap-3 overflow-hidden">
          <div className={`flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden relative transition-opacity ${!isMandatoryFilled ? 'opacity-50 pointer-events-none' : ''}`}>
            {!isMandatoryFilled && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
                <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200 text-center max-w-xs">
                  <FiInfo className="text-3xl text-[var(--primary)] mx-auto mb-2" />
                  <p className="font-bold text-slate-700 text-sm">Ürün eklemek için önce müşteri ve temsilci bilgilerini doldurmalısınız.</p>
                </div>
              </div>
            )}
            <ProductPhase items={items} />
          </div>

          <div className={`shrink-0 transition-opacity ${!isMandatoryFilled ? 'opacity-50 pointer-events-none' : ''}`}>
            <WizardSummary />
          </div>
        </div>

      </div>
    </form>
  );
};
