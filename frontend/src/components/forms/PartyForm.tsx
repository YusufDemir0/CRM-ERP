import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { partiesAPI, currenciesAPI } from '../../services/api';
import { FiCheck, FiSave, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useTurkiyeCities, useTurkiyeDistricts } from '../../hooks/useTurkiyeApi';
import type { Party, Currency } from '../../types';
import { useQuickCreateStore } from '../../store/useQuickCreateStore';
import { PhoneInput } from '../common/PhoneInput';
import { FormField } from '../common/FormField';
import { PremiumNumberInput } from '../common/PremiumNumberInput';

import { useAuthStore } from '../../store/useAuthStore';

interface PartyFormData {
  name: string;
  type: 'customer' | 'provider';
  taxNumber: string;
  phone1: string;
  phone2: string;
  email: string;
  address: string;
  cityId: string;
  districtName: string;
  creditLimit: number;
  currencyId: string;
  notes: string;
}

interface PartyFormProps {
  initialData?: Partial<PartyFormData>;
  editingId?: string | number | null;
  mode?: 'quick' | 'full';
  onSuccess: (data: Party) => void;
  onCancel: () => void;
}

export const PartyForm: React.FC<PartyFormProps> = ({
  initialData,
  editingId,
  mode = 'full',
  onSuccess,
  onCancel,
}) => {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const { cities } = useTurkiyeCities();
  const { updateCache, getCache, clearCache } = useQuickCreateStore();
  const user = useAuthStore(state => state.user);
  
  const cacheKey = editingId ? `party_edit_${editingId}` : 'party_create';
  
  // Default cityId: from initialData, else from user's department, else empty
  const defaultCityId = initialData?.cityId 
    ? String(initialData.cityId) 
    : (user?.department?.cityId ? String(user.department.cityId) : '');

  const { register, handleSubmit, watch, setValue, getValues, control, formState: { errors, isSubmitting } } = useForm<PartyFormData>({
    defaultValues: (editingId ? null : getCache(cacheKey) as PartyFormData | null) || {
      name: initialData?.name || '',
      type: (initialData?.type === 'provider' || initialData?.type === 'customer') ? initialData.type : 'provider',
      taxNumber: initialData?.taxNumber || '',
      phone1: initialData?.phone1 || '+90 ',
      phone2: initialData?.phone2 || '+90 ',
      email: initialData?.email || '',
      address: initialData?.address || '',
      cityId: defaultCityId,
      districtName: initialData?.districtName || '',
      creditLimit: initialData?.creditLimit || 0,
      currencyId: initialData?.currencyId ? String(initialData.currencyId) : '',
      notes: initialData?.notes || ''
    }
  });

  const cityIdWatcher = watch('cityId');
  const taxNumberWatcher = watch('taxNumber');
  const emailWatcher = watch('email');
  const phone1Watcher = watch('phone1');
  const phone2Watcher = watch('phone2');
  
  const { districts } = useTurkiyeDistricts(cityIdWatcher ? Number(cityIdWatcher) : null);
  const [emailFocus, setEmailFocus] = useState(false);

  const saveDraft = useCallback(() => {
    updateCache(cacheKey, getValues());
  }, [getValues, updateCache, cacheKey]);

  useEffect(() => {
    const controller = new AbortController();
    currenciesAPI.getAll({ limit: 500 }, { signal: controller.signal }).then(res => {
      setCurrencies(res.data.data);
    }).catch(err => {
      if (err.name !== 'AbortError') console.error(err);
    });
    return () => controller.abort();
  }, []);

  /* 🔥 DEFAULT CURRENCY SELECTION */
  useEffect(() => {
    if (currencies.length > 0 && !editingId) {
      const current = getValues('currencyId');
      if (!current || current === '0' || current === '') {
        const defaultCur = currencies.find(c => c.isDefault === 1);
        if (defaultCur) setValue('currencyId', String(defaultCur.id));
      }
    }
  }, [currencies, editingId, getValues, setValue]);

  const onSubmit = async (data: PartyFormData) => {
    try {
      const dataToSubmit = {
        ...data,
        cityId: data.cityId ? String(data.cityId) : undefined,
        currencyId: data.currencyId ? String(data.currencyId) : undefined,
        creditLimit: data.creditLimit ? Number(data.creditLimit) : 0,
        email: data.email?.trim() === '' ? undefined : data.email?.trim(),
        taxNumber: data.taxNumber?.trim() === '' ? undefined : data.taxNumber?.trim(),
      };

      if (editingId) {
        const res = await partiesAPI.update(editingId, dataToSubmit);
        onSuccess(res.data);
      } else {
        const res = await partiesAPI.create(dataToSubmit);
        clearCache(cacheKey);
        onSuccess(res.data);
      }
    } catch (error: unknown) {
      console.error(error);
      let errorMsg = 'İşlem başarısız';
      if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as { response: { data?: { message?: string | string[] } } }).response;
        if (response.data?.message) {
          errorMsg = Array.isArray(response.data.message) ? response.data.message[0] : response.data.message;
        }
      }
      toast.error(errorMsg);
    }
  };

  const getTaxLabel = () => {
    const len = taxNumberWatcher?.length || 0;
    if (len === 10) return 'VKN';
    if (len === 11) return 'TCKN';
    return 'VERGİ NO / T.C NO';
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} onBlur={saveDraft} className="flex flex-col gap-6 animate-in pb-4">
      <FormField label="Cari Unvan / Şirket Adı" required error={errors.name?.message}>
        <input 
          required 
          className="input-premium uppercase-input font-black tracking-tight" 
          {...register('name', { onChange: (e) => e.target.value = e.target.value.toLocaleUpperCase('tr-TR') })}
          placeholder="ÖR: ERMAY TEKSTİL VE DIŞ TİC. A.Ş." 
        />
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FormField
          label="Cari Tipi"
          error={errors.type?.message}
          required
        >
          <select {...register('type')} className="form-input">
            <option value="customer">Müşteri</option>
            <option value="provider">Tedarikçi</option>
          </select>
        </FormField>
        <FormField label={getTaxLabel()}>
          <input 
            className="input-premium font-black tabular-nums tracking-widest text-center" 
            {...register('taxNumber', { onChange: (e) => e.target.value = e.target.value.replace(/\D/g, '').substring(0, 11) })}
            placeholder="0000000000"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FormField label="Birincil İletişim Hattı">
          <PhoneInput 
            value={phone1Watcher}
            onChange={(val) => setValue('phone1', val)}
          />
        </FormField>
        <FormField label="İkincil İletişim Hattı (Gsm)">
          <PhoneInput 
            value={phone2Watcher}
            onChange={(val) => setValue('phone2', val)}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FormField label="Kurumsal E-Posta" className="relative">
          <input 
            type="text" 
            className="input-premium lowercase font-bold text-[var(--primary)]" 
            {...register('email', { onChange: (e) => e.target.value = e.target.value.toLowerCase() })}
            onFocus={() => setEmailFocus(true)}
            onBlur={() => setTimeout(() => setEmailFocus(false), 200)}
            placeholder="muhasebe@sirket.com" 
          />
          {emailFocus && emailWatcher && (
            <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-2xl z-50 shadow-2xl mt-2 overflow-hidden ring-4 ring-[var(--primary-glow)]">
              {emailWatcher.includes('@') ? (
                /* 🔥 Hızlı Domain Değiştirme — @ varsa domain'i değiştir */
                ['@gmail.com', '@hotmail.com', '@outlook.com'].map(ext => (
                  <div 
                    key={ext} 
                    className="p-3 cursor-pointer hover:bg-slate-50 text-sm font-black flex justify-between items-center group"
                    onClick={() => setValue('email', emailWatcher.split('@')[0] + ext)}
                  >
                    <span className="text-slate-600">{emailWatcher.split('@')[0]}</span>
                    <span className="text-[var(--primary)] group-hover:scale-110 transition-transform">{ext}</span>
                  </div>
                ))
              ) : (
                /* Domain önerisi — @ yoksa */
                ['@gmail.com', '@hotmail.com', '@outlook.com'].map(ext => (
                  <div 
                    key={ext} 
                    className="p-3 cursor-pointer hover:bg-slate-50 text-sm font-black flex justify-between items-center group"
                    onClick={() => setValue('email', emailWatcher + ext)}
                  >
                    <span className="text-slate-600">{emailWatcher}</span>
                    <span className="text-[var(--primary)] group-hover:scale-110 transition-transform">{ext}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <FormField label="Şehir / İl">
          <Controller
            name="cityId"
            control={control}
            render={({ field }) => (
              <select 
                className="input-premium font-black" 
                {...field} 
                value={field.value || ''}
                onChange={(e) => {
                  field.onChange(e);
                  setValue('districtName', '');
                }}
              >
                <option value="">SEÇİNİZ...</option>
                {(cities || []).map((c) => <option key={c.id} value={String(c.id)}>{c.name.toUpperCase()}</option>)}
              </select>
            )}
          />
        </FormField>
        <FormField label="İlçe / Bölge">
          <Controller
            name="districtName"
            control={control}
            render={({ field }) => (
              <select className="input-premium font-black" {...field} value={field.value || ''} disabled={!cityIdWatcher}>
                <option value="">SEÇİNİZ...</option>
                {(districts || []).map((d) => <option key={d.id} value={d.name.toUpperCase()}>{d.name.toUpperCase()}</option>)}
              </select>
            )}
          />
        </FormField>
        <FormField label="Detaylı Adres">
          <input 
            className="input-premium uppercase-input font-medium" 
            {...register('address', { onChange: (e) => e.target.value = e.target.value.toLocaleUpperCase('tr-TR') })}
            placeholder="MAHALLE, CADDE, NO..." 
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-100">
        {mode !== 'quick' && (
          <FormField label="Kredi Limiti">
            <div className="flex flex-col gap-2">
              <div className="relative">
                <PremiumNumberInput 
                  value={watch('creditLimit')} 
                  onChange={val => setValue('creditLimit', val)} 
                  className="h-14"
                />
                <span className="absolute right-12 top-1/2 -translate-y-1/2 font-black text-slate-400 pointer-events-none">TRY</span>
              </div>
              <div className="flex gap-1">
                {[-10000, -1000, 1000, 10000].map(val => (
                  <button 
                    key={val}
                    type="button" 
                    className="flex-1 h-8 rounded-lg bg-slate-50 border border-slate-200 text-[10px] font-black text-slate-600 hover:bg-[var(--primary)] hover:text-white transition-all"
                    onClick={() => setValue('creditLimit', Number(getValues('creditLimit') || 0) + val)}
                  >
                    {val > 0 ? `+${val/1000}K` : `${val/1000}K`}
                  </button>
                ))}
              </div>
            </div>
          </FormField>
        )}
        <div className="flex flex-col gap-5">
          <FormField label="Çalışma Para Birimi">
            <select className="input-premium font-black h-14" {...register('currencyId')}>
              {currencies.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name.toUpperCase()}</option>)}
            </select>
          </FormField>
          <FormField label="Özel Notlar">
            <input 
              className="input-premium h-14 font-medium" 
              {...register('notes')}
              placeholder="Vadesine sadık, VIP müşteri..." 
            />
          </FormField>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-100">
        <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-lg flex-1 shadow-2xl shadow-[var(--primary-glow)]">
          <FiSave size={20} /> {editingId ? 'DEĞİŞİKLİKLERİ KAYDET' : 'YENİ CARİ KART OLUŞTUR'}
        </button>
        <button type="button" className="btn bg-slate-100 text-slate-500 btn-lg px-10 font-black hover:bg-slate-200 transition-all" onClick={() => { clearCache(cacheKey); onCancel(); }}>
          <FiX size={20} /> İPTAL
        </button>
      </div>
    </form>
  );
};
