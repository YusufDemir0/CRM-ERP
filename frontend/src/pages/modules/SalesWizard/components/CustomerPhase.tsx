import React, { memo, useState, useMemo } from 'react';
import { useFormContext, useWatch, Controller } from 'react-hook-form';
import { FiPlus } from 'react-icons/fi';
import { SearchableSelect } from '../../../../components/common/SearchableSelect';
import { PhoneInput } from '../../../../components/common/PhoneInput';
import { FormField } from '../../../../components/common/FormField';
import { useTurkiyeCities, useTurkiyeDistricts } from '../../../../hooks/useTurkiyeApi';
import { useQuickCreateStore } from '../../../../store/useQuickCreateStore';
import { useSalesWizardStore } from '../../../../store/useSalesWizardStore';
import { Party, Department } from '../../../../types';
import { SalesWizardFormData } from '../schema';

const EmailField = memo(({ isNewInfo }: { isNewInfo: boolean }) => {
  const { register, setValue, control } = useFormContext<SalesWizardFormData>();
  const email = useWatch({ control, name: 'email' });
  const [emailFocus, setEmailFocus] = useState(false);
  const domainExtensions = ['@gmail.com', '@hotmail.com', '@outlook.com'];

  return (
    <FormField label="E-POSTA" className="relative !mb-0">
      <input 
        type="email"
        readOnly={!isNewInfo}
        className={`input-premium h-8 text-xs font-bold ${!isNewInfo ? 'bg-slate-50/50 text-slate-500 cursor-not-allowed' : ''}`}
        placeholder="ornek@mail.com"
        {...register('email')}
        onFocus={() => isNewInfo && setEmailFocus(true)}
        onBlur={(e) => {
          register('email').onBlur(e);
          setTimeout(() => setEmailFocus(false), 200);
        }}
      />
      {emailFocus && isNewInfo && email && (
        <div className="absolute left-0 right-0 bg-white border border-slate-200 rounded-xl z-[110] shadow-2xl mt-1 overflow-hidden ring-2 ring-[var(--primary-glow)]">
          {email.includes('@') ? (
            domainExtensions.map(ext => (
              <div 
                key={ext} 
                className="p-2.5 cursor-pointer hover:bg-slate-50 text-[11px] font-bold flex justify-between items-center"
                onClick={() => setValue('email', email.split('@')[0] + ext, { shouldValidate: true })}
              >
                <span className="text-slate-600">{email.split('@')[0]}</span>
                <span className="text-[var(--primary)] font-black">{ext}</span>
              </div>
            ))
          ) : (
            domainExtensions.map(ext => (
              <div 
                key={ext} 
                className="p-2.5 cursor-pointer hover:bg-slate-50 text-[11px] font-bold flex justify-between items-center"
                onClick={() => setValue('email', (email || '') + ext, { shouldValidate: true })}
              >
                <span className="text-slate-600">{email}</span>
                <span className="text-[var(--primary)] font-black">{ext}</span>
              </div>
            ))
          )}
        </div>
      )}
    </FormField>
  );
});

const TaxIDField = memo(({ isNewInfo }: { isNewInfo: boolean }) => {
  const { register, setValue, control } = useFormContext<SalesWizardFormData>();
  const taxId = useWatch({ control, name: 'taxId' });

  return (
    <FormField label={taxId?.length === 11 ? 'T.C. KİMLİK NO' : 'VERGİ NUMARASI'} className="!mb-0">
      <input 
        readOnly={!isNewInfo}
        className={`input-premium h-8 text-xs font-bold tabular-nums ${!isNewInfo ? 'bg-slate-50/50 text-slate-500 cursor-not-allowed' : ''}`}
        placeholder="TCKN / VKN"
        {...register('taxId')}
        onChange={(e) => isNewInfo && setValue('taxId', e.target.value.replace(/\D/g, '').substring(0, 11))}
      />
    </FormField>
  );
});

export const CustomerPhase = memo(({ customers, refreshLookups, department }: { customers: Party[], refreshLookups: () => void, department?: Department | null }) => {
  const { setValue, watch, register, formState: { errors }, control } = useFormContext<SalesWizardFormData>();
  const { openCreate } = useQuickCreateStore();
  const store = useSalesWizardStore();
  const [isNewInfo, setIsNewInfo] = useState(false);

  const currentCustomerId = useWatch({ control, name: 'customerId' });
  const currentCityId = useWatch({ control, name: 'cityId' });

  const { cities } = useTurkiyeCities();
  const { districts } = useTurkiyeDistricts(currentCityId ? Number(currentCityId) : null); // External API requires numeric province ID

  const customerOptions = useMemo(() => {
    const base = (customers || []).map(c => ({ id: String(c.id), label: c.name }));
    if (store.draftData.customer && !base.find(o => String(o.id) === String(store.draftData.customer?.id))) {
      base.unshift({ id: String(store.draftData.customer.id), label: store.draftData.customer.name });
    }
    return base;
  }, [customers, store.draftData.customer]);

  return (
    <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 transition-all hover:shadow-md">

      {/* Müşteri Seçimi */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <SearchableSelect
            label="MÜŞTERİ / CARİ SEÇİMİ"
            placeholder="Müşteri veya tedarikçi ara..."
            options={customerOptions}
            value={currentCustomerId ? String(currentCustomerId) : null}
            onChange={(opt) => {
              const id = opt?.id;
              const customer = customers.find(c => String(c.id) === String(id));
              
              setValue('customerId', id ? String(id) : '', { shouldValidate: true });

              if (customer && !isNewInfo) {
                const dataToSync: Partial<SalesWizardFormData> = {
                  phone: customer.phone1 || '',
                  phone2: customer.phone2 || '',
                  email: customer.email || '',
                  taxId: customer.taxNumber || '',
                  address: customer.address || '',
                  cityId: customer.cityId ? String(customer.cityId) : '',
                  district: customer.districtName || '',
                };

                (Object.entries(dataToSync) as [keyof SalesWizardFormData, string][]).forEach(([key, val]) => {
                  setValue(key, val, { shouldValidate: true });
                });

                store.setDraftData({ ...store.draftData, customer });
              } else if (customer) {
                 store.setDraftData({ ...store.draftData, customer });
              } else {
                 store.setDraftData({ ...store.draftData, customer: null });
              }
            }}
          />
          {errors.customerId && <span className="text-[10px] text-[var(--error)] font-bold mt-1 block">{errors.customerId.message}</span>}
        </div>
        <button 
          type="button"
          onClick={() => openCreate('party', { 
            mode: 'quick',
            onSuccess: (res: unknown) => {
              refreshLookups();
              const response = res as { data: Party } | Party;
              const newParty = 'data' in response ? response.data : response;
              if (newParty?.id) setValue('customerId', String(newParty.id), { shouldValidate: true });
            }
          })}
          className="h-10 w-10 mt-5 bg-slate-50 text-[var(--primary)] rounded-xl border border-slate-200 hover:bg-[var(--primary)] hover:text-white transition-all shadow-sm flex items-center justify-center group"
          title="Yeni Müşteri Ekle"
        >
          <FiPlus size={18} className="group-hover:scale-125 transition-transform" />
        </button>
      </div>

      {/* Adres Modu Seçimi — tek toggle */}
      <div className="flex bg-slate-100/50 p-1 rounded-xl border border-slate-200 w-fit">
        <button 
          type="button"
          onClick={() => {
            setIsNewInfo(false);
            const customer = customers.find(c => String(c.id) === String(currentCustomerId));
            if (customer) {
              setValue('phone', customer.phone1 || '', { shouldValidate: true });
              setValue('phone2', customer.phone2 || '', { shouldValidate: true });
              setValue('email', customer.email || '', { shouldValidate: true });
              setValue('taxId', customer.taxNumber || '', { shouldValidate: true });
              setValue('address', customer.address || '', { shouldValidate: true });
              setValue('cityId', customer.cityId ? String(customer.cityId) : '', { shouldValidate: true });
              setValue('district', customer.districtName || '', { shouldValidate: true });
            }
          }}
          className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${!isNewInfo ? 'bg-white shadow-premium text-[var(--primary)]' : 'text-slate-400 hover:text-slate-600'}`}
        >
          KAYITLI ADRES
        </button>
        <button 
          type="button"
          onClick={() => {
            setIsNewInfo(true);
            setValue('phone', '', { shouldValidate: true });
            setValue('phone2', '', { shouldValidate: true });
            setValue('email', '', { shouldValidate: true });
            setValue('taxId', '', { shouldValidate: true });
                  setValue('address', '', { shouldValidate: true });
                  setValue('cityId', department?.cityId ? String(department.cityId) : '', { shouldValidate: true });
                  setValue('district', '', { shouldValidate: true });
                }}
                className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${isNewInfo ? 'bg-white shadow-premium text-[var(--primary)]' : 'text-slate-400 hover:text-slate-600'}`}
        >
          FARKLI / YENİ ADRES
        </button>
      </div>

      {/* İletişim Bilgileri */}
      <div className="grid grid-cols-2 gap-3 pt-1">
         <FormField label="İLETİŞİM HATTI" className="!mb-0">
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <PhoneInput 
                  value={field.value || ''}
                  onChange={field.onChange}
                  disabled={!isNewInfo}
                />
              )}
            />
            {errors.phone && <span className="text-[10px] text-[var(--error)] font-bold mt-1 block">{errors.phone.message}</span>}
         </FormField>
         <EmailField isNewInfo={isNewInfo} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="YEDEK TELEFON" className="!mb-0">
          <Controller
            name="phone2"
            control={control}
            render={({ field }) => (
              <PhoneInput 
                value={field.value || ''}
                onChange={field.onChange}
                disabled={!isNewInfo}
              />
            )}
          />
        </FormField>
        <TaxIDField isNewInfo={isNewInfo} />
      </div>

      {/* Adres Bilgileri */}
      <div className="grid grid-cols-2 gap-3">
         <FormField label="TESLİMAT ŞEHRİ" className="!mb-0">
            <select 
              className={`input-premium h-8 text-xs font-black cursor-pointer ${!isNewInfo ? 'bg-slate-50/50 text-slate-500 pointer-events-none' : ''}`}
              {...register('cityId')}
              onChange={(e) => {
                if (!isNewInfo) return;
                setValue('cityId', String(e.target.value), { shouldValidate: true });
                setValue('district', '', { shouldValidate: true });
              }}
              tabIndex={!isNewInfo ? -1 : 0}
            >
              <option value="">ŞEHİR SEÇİN...</option>
              {(cities || []).map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
            </select>
            {errors.cityId && <span className="text-[10px] text-[var(--error)] font-bold mt-1 block">{errors.cityId.message}</span>}
         </FormField>
          <FormField label="TESLİMAT İLÇESİ" className="!mb-0">
            {!isNewInfo ? (
              <input 
                readOnly
                className="input-premium h-8 text-xs font-black bg-slate-50/50 text-slate-500 cursor-not-allowed"
                value={watch('district') || ''}
                placeholder="İLÇE BİLGİSİ YOK"
              />
            ) : (
              <select 
                className={`input-premium h-8 text-xs font-black cursor-pointer ${!currentCityId ? 'bg-slate-50/50 text-slate-500 pointer-events-none' : ''}`}
                disabled={!currentCityId}
                {...register('district')}
              >
                <option value="">İLÇE SEÇİN...</option>
                {(districts || []).map(d => <option key={d.id} value={d.name.toUpperCase()}>{d.name.toUpperCase()}</option>)}
              </select>
            )}
            {errors.district && <span className="text-[10px] text-[var(--error)] font-bold mt-1 block">{errors.district.message}</span>}
          </FormField>
      </div>

      <FormField label="ADRES DETAYI" className="!mb-0">
        <textarea 
          readOnly={!isNewInfo}
          className={`input-premium w-full p-2 rounded-xl min-h-[50px] text-xs font-bold ${!isNewInfo ? 'bg-slate-50/50 text-slate-500 cursor-not-allowed' : ''}`}
          {...register('address')}
          onChange={(e) => isNewInfo && setValue('address', e.target.value.toLocaleUpperCase('tr-TR'))}
          placeholder="Mahalle, cadde, no..."
        />
      </FormField>
    </div>
  );
});
