import React, { memo, useState, useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { FiPlus } from 'react-icons/fi';
import { SearchableSelect } from '../../../../components/common/SearchableSelect';
import { PhoneInput } from '../../../../components/common/PhoneInput';
import { FormField } from '../../../../components/common/FormField';
import { useTurkiyeCities, useTurkiyeDistricts } from '../../../../hooks/useTurkiyeApi';
import { useQuickCreateStore } from '../../../../store/useQuickCreateStore';
import { useSalesWizardStore } from '../../../../store/useSalesWizardStore';
import { Party } from '../../../../types';
import { SalesWizardFormData } from '../schema';

export const CustomerPhase = memo(({ customers, refreshLookups }: { customers: Party[], refreshLookups: () => void }) => {
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
  const { districts } = useTurkiyeDistricts(currentCityId ? Number(currentCityId) : null); // External API requires numeric province ID

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
                  setValue('cityId', customer.cityId || '');
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
                setValue('cityId', '');
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
              cityId: String(customer?.cityId || ''),
              district: customer?.districtName || '',
            });

            if (customer && !isNewInfo) {
              setValue('phone', customer.phone1 || '');
              setValue('phone2', customer.phone2 || '');
              setValue('email', customer.email || '');
              setValue('taxId', customer.taxNumber || '');
              setValue('address', customer.address || '');
              setValue('cityId', String(customer.cityId || ''));
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
              {...register('cityId')}
              onChange={(e) => {
                setValue('cityId', String(e.target.value), { shouldValidate: true });
                setValue('district', '', { shouldValidate: true });
              }}
            >
              <option value="">ŞEHİR SEÇİN...</option>
              {(cities || []).map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
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
