import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { partiesAPI, currenciesAPI } from '../../services/api';
import { FiCheck, FiSave, FiX } from 'react-icons/fi';
import { useTurkiyeCities, useTurkiyeDistricts } from '../../hooks/useTurkiyeApi';
import type { Party, Currency } from '../../types';
import { useQuickCreateStore } from '../../store/useQuickCreateStore';
import { PhoneInput } from '../common/PhoneInput';
import { FormField } from '../common/FormField';

interface PartyFormData {
  name: string;
  type: 'customer' | 'provider' | 'both';
  taxOffice: string;
  taxNumber: string;
  phone1: string;
  phone2: string;
  email: string;
  address: string;
  cityId: number;
  districtName: string;
  creditLimit: number;
  currencyId: number;
  notes: string;
}

interface PartyFormProps {
  initialData?: Partial<PartyFormData>;
  editingId?: number | null;
  onSuccess: (data: Party) => void;
  onCancel: () => void;
}

export const PartyForm: React.FC<PartyFormProps> = ({
  initialData,
  editingId,
  onSuccess,
  onCancel,
}) => {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const { cities } = useTurkiyeCities();
  const { updateCache, getCache, clearCache } = useQuickCreateStore();
  
  const { register, handleSubmit, watch, setValue, getValues, formState: { errors, isSubmitting } } = useForm<PartyFormData>({
    defaultValues: (!editingId ? (getCache('party') as PartyFormData) : null) || {
      name: initialData?.name || '',
      type: initialData?.type || 'customer',
      taxOffice: initialData?.taxOffice || '',
      taxNumber: initialData?.taxNumber || '',
      phone1: initialData?.phone1 || '+90 ',
      phone2: initialData?.phone2 || '+90 ',
      email: initialData?.email || '',
      address: initialData?.address || '',
      cityId: initialData?.cityId || 0,
      districtName: initialData?.districtName || '',
      creditLimit: initialData?.creditLimit || 0,
      currencyId: initialData?.currencyId || 1,
      notes: initialData?.notes || ''
    }
  });

  const cityIdWatcher = watch('cityId');
  const taxNumberWatcher = watch('taxNumber');
  const emailWatcher = watch('email');
  const creditLimitWatcher = watch('creditLimit');
  const phone1Watcher = watch('phone1');
  const phone2Watcher = watch('phone2');
  
  const { districts } = useTurkiyeDistricts(cityIdWatcher || null);
  const [emailFocus, setEmailFocus] = useState(false);

  const saveDraft = useCallback(() => {
    if (!editingId) {
      updateCache('party', getValues());
    }
  }, [getValues, updateCache, editingId]);

  useEffect(() => {
    const controller = new AbortController();
    currenciesAPI.getAll({}, { signal: controller.signal }).then(res => {
      const curList = res.data;
      setCurrencies(curList);
      
      const currentCurrency = getValues('currencyId');
      if (!currentCurrency && curList.length > 0) {
        const defaultCur = curList.find((c: Currency) => c.isDefault === 1);
        if (defaultCur) setValue('currencyId', defaultCur.id);
      }
    }).catch(err => {
      if (err.name !== 'AbortError') console.error(err);
    });
    return () => controller.abort();
  }, [setValue, getValues]);

  const onSubmit = async (data: PartyFormData) => {
    try {
      const dataToSubmit = {
        ...data,
        cityId: data.cityId ? Number(data.cityId) : undefined,
        currencyId: data.currencyId ? Number(data.currencyId) : undefined,
        creditLimit: data.creditLimit ? Number(data.creditLimit) : 0,
        email: data.email?.trim() === '' ? undefined : data.email?.trim(),
        taxNumber: data.taxNumber?.trim() === '' ? undefined : data.taxNumber?.trim(),
        taxOffice: data.taxOffice?.trim() === '' ? undefined : data.taxOffice?.trim(),
      };

      if (editingId) {
        const res = await partiesAPI.update(editingId, dataToSubmit);
        onSuccess(res.data);
      } else {
        const res = await partiesAPI.create(dataToSubmit);
        onSuccess(res.data);
        clearCache('party');
      }
    } catch (error) {
      console.error(error);
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
        <FormField label="Cari Kategori">
          <select required className="input-premium font-black" {...register('type')}>
            <option value="customer">MÜŞTERİ</option>
            <option value="provider">TEDARİKÇİ</option>
            <option value="both">HEM MÜŞTERİ HEM TEDARİKÇİ</option>
          </select>
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label={getTaxLabel()}>
            <input 
              className="input-premium font-black tabular-nums tracking-widest text-center" 
              {...register('taxNumber', { onChange: (e) => e.target.value = e.target.value.replace(/\D/g, '').substring(0, 11) })}
              placeholder="0000000000"
            />
          </FormField>
          <FormField label="Vergi Dairesi">
            <input 
              className="input-premium uppercase-input font-bold" 
              {...register('taxOffice', { onChange: (e) => e.target.value = e.target.value.toLocaleUpperCase('tr-TR') })}
              placeholder="BOĞAZİÇİ" 
            />
          </FormField>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FormField label="Birincil İletişim Hattı">
          <PhoneInput 
            value={phone1Watcher}
            onChange={(val) => setValue('phone1', val)}
          />
        </FormField>
        <FormField label="Kurumsal E-Posta" className="relative">
          <input 
            type="text" 
            className="input-premium lowercase font-bold text-[var(--primary)]" 
            {...register('email', { onChange: (e) => e.target.value = e.target.value.toLowerCase() })}
            onFocus={() => setEmailFocus(true)}
            onBlur={() => setTimeout(() => setEmailFocus(false), 200)}
            placeholder="muhasebe@sirket.com" 
          />
          {emailFocus && emailWatcher && !emailWatcher.includes('@') && (
            <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-2xl z-50 shadow-2xl mt-2 overflow-hidden ring-4 ring-[var(--primary-glow)]">
              {['@gmail.com', '@hotmail.com', '@outlook.com'].map(ext => (
                <div 
                  key={ext} 
                  className="p-3 cursor-pointer hover:bg-slate-50 text-sm font-black flex justify-between items-center group"
                  onClick={() => setValue('email', emailWatcher + ext)}
                >
                  <span className="text-slate-600">{emailWatcher}</span>
                  <span className="text-[var(--primary)] group-hover:scale-110 transition-transform">{ext}</span>
                </div>
              ))}
            </div>
          )}
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <FormField label="Şehir / İl">
          <select className="input-premium font-black" {...register('cityId', { onChange: () => setValue('districtName', '') })}>
            <option value={0}>SEÇİNİZ...</option>
            {(cities || []).map((c) => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
          </select>
        </FormField>
        <FormField label="İlçe / Bölge">
          <select className="input-premium font-black" {...register('districtName')} disabled={!cityIdWatcher}>
            <option value="">SEÇİNİZ...</option>
            {(districts || []).map((d) => <option key={d.id} value={d.name.toUpperCase()}>{d.name.toUpperCase()}</option>)}
          </select>
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
        <FormField label="Kredi Limiti">
          <div className="flex flex-col gap-2">
            <div className="relative">
              <input 
                type="number" 
                className="input-premium font-black text-2xl tabular-nums text-[var(--primary)] pl-4 pr-12 h-14"
                {...register('creditLimit')}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-400">TRY</span>
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
        <button type="button" className="btn bg-slate-100 text-slate-500 btn-lg px-10 font-black hover:bg-slate-200 transition-all" onClick={onCancel}>
          <FiX size={20} /> İPTAL
        </button>
      </div>
    </form>
  );
};
