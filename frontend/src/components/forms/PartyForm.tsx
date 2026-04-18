import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { partiesAPI, currenciesAPI } from '../../services/api';
import { FiCheck } from 'react-icons/fi';
import { useTurkiyeCities, useTurkiyeDistricts } from '../../hooks/useTurkiyeApi';
import type { Party, Currency } from '../../types';
import { useQuickCreateStore } from '../../store/useQuickCreateStore';

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
  onSuccess: (data: unknown) => void;
  onCancel: () => void;
}

export const PartyForm: React.FC<PartyFormProps> = ({
  initialData,
  editingId,
  onSuccess,
  onCancel,
}) => {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const { cities, loading: citiesLoading } = useTurkiyeCities();
  const { updateCache, getCache, clearCache } = useQuickCreateStore();
  
  const { register, handleSubmit, watch, setValue, getValues, formState: { errors } } = useForm<PartyFormData>({
    defaultValues: (!editingId ? (getCache('party') as PartyFormData) : null) || {
      name: initialData?.name || '',
      type: initialData?.type || 'customer',
      taxOffice: initialData?.taxOffice || '',
      taxNumber: initialData?.taxNumber || '',
      phone1: initialData?.phone1 || '',
      phone2: initialData?.phone2 || '',
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
  
  const { districts, loading: districtsLoading } = useTurkiyeDistricts(cityIdWatcher || null);
  const [emailFocus, setEmailFocus] = useState(false);

  // Caching strategy: Update only on blur or unmount to prevent re-render loops
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
      if (err.name !== 'AbortError') {
        console.error(err);
      }
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
        phone1: data.phone1?.trim() === '' ? undefined : data.phone1?.trim(),
        phone2: data.phone2?.trim() === '' ? undefined : data.phone2?.trim(),
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
    return 'Vergi No / TC No';
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} onBlur={saveDraft} className="login-form">
      <div className="grid grid-cols-[2fr_1fr] gap-4">
        <div className="form-group">
          <label>Cari Unvan / Ad-Soyad (Zorunlu)</label>
          <input 
            required 
            className="uppercase-input" 
            {...register('name', {
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                const filtered = e.target.value.replace(/[0-9]/g, '');
                e.target.value = filtered.toLocaleUpperCase('tr-TR');
              }
            })}
            placeholder="ÖR: ERMAY LOJİSTİK A.Ş." 
          />
        </div>
        <div className="form-group">
          <label>Cari Tipi</label>
          <select 
            required 
            className="uppercase-input" 
            {...register('type')}
          >
            <option value="customer">Müşteri</option>
            <option value="provider">Tedarikçi</option>
            <option value="both">Hem Müşteri Hem Tedarikçi</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label className={
            (taxNumberWatcher?.length === 10 || taxNumberWatcher?.length === 11) 
              ? 'text-[var(--primary)] font-extrabold' 
              : ''
          }>
            {getTaxLabel()} { (taxNumberWatcher?.length === 10 || taxNumberWatcher?.length === 11) && <FiCheck className="inline align-middle" /> }
          </label>
          <input 
            className="uppercase-input" 
            {...register('taxNumber', {
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                e.target.value = e.target.value.replace(/\D/g, '').substring(0, 11);
              }
            })}
            placeholder="0000000000"
            type="text"
            inputMode="numeric"
          />
        </div>
        {(taxNumberWatcher?.length || 0) > 0 && (
          <div className="form-group">
            <label>Vergi Dairesi (Opsiyonel)</label>
            <input 
              className="uppercase-input" 
              {...register('taxOffice', {
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                  const filtered = e.target.value.replace(/[0-9]/g, '');
                  e.target.value = filtered.toLocaleUpperCase('tr-TR');
                }
              })}
              placeholder="ÖR: GÜNEŞLİ" 
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label>Telefon 1</label>
          <div className="flex gap-1">
            <span className="p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)]">+90</span>
            <input 
              className="uppercase-input flex-1" 
              {...register('phone1', {
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                  e.target.value = e.target.value.replace(/\D/g, '').substring(0, 10);
                }
              })}
              placeholder="5XX XXX XX XX"
              type="tel"
            />
          </div>
        </div>
        <div className="form-group">
          <label>Telefon 2</label>
          <div className="flex gap-1">
            <span className="p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)]">+90</span>
            <input 
              className="uppercase-input flex-1" 
              {...register('phone2', {
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                  e.target.value = e.target.value.replace(/\D/g, '').substring(0, 10);
                }
              })}
              placeholder="5XX XXX XX XX"
              type="tel"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label>E-Posta</label>
          <div className="relative">
            <input 
              type="text" 
              className="uppercase-input" 
              {...register('email', {
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                  e.target.value = e.target.value.toLowerCase();
                }
              })}
              onFocus={() => setEmailFocus(true)}
              onBlur={() => setTimeout(() => setEmailFocus(false), 200)}
              placeholder="yusuf..." 
            />
            {emailFocus && emailWatcher && !emailWatcher.includes('@') && (
              <div className="absolute top-full left-0 right-0 bg-white border border-[var(--border)] rounded-lg z-10 shadow-md mt-1 overflow-hidden">
                {['@gmail.com', '@hotmail.com', '@outlook.com', '@icloud.com'].map(ext => (
                  <div 
                    key={ext} 
                    className="p-2.5 cursor-pointer transition-colors text-[13px] hover:bg-slate-100"
                    onClick={() => setValue('email', emailWatcher + ext)}
                  >
                    <strong>{emailWatcher}</strong>{ext}
                  </div>
                ))}
              </div>
            )}
            {emailFocus && emailWatcher && emailWatcher.includes('@') && (
              <div className="absolute top-full left-0 right-0 bg-white border border-[var(--border)] rounded-lg z-10 shadow-md mt-1 overflow-hidden">
                 {[ '@gmail.com', '@hotmail.com', '@outlook.com', '@icloud.com'].map(ext => (
                  <div 
                    key={ext} 
                    className={`p-2.5 cursor-pointer transition-colors text-[13px] hover:bg-slate-100 ${emailWatcher.split('@')[1] !== ext.substring(1) ? 'block' : 'hidden'}`}
                    onClick={() => setValue('email', emailWatcher.split('@')[0] + ext)}
                  >
                    Hızlı Değiştir: <strong>{emailWatcher.split('@')[0]}</strong>{ext}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="form-group">
          <label>Para Birimi</label>
          <select 
            className="uppercase-input" 
            {...register('currencyId')}
          >
            {currencies.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label>İl</label>
          <select 
            className="uppercase-input" 
            {...register('cityId', {
              onChange: () => setValue('districtName', '')
            })}
          >
            <option value={0}>Seçiniz...</option>
            {cities.map((c: { id: number; name: string }) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>İlçe</label>
          <select 
            className="uppercase-input" 
            {...register('districtName')}
            disabled={!cityIdWatcher}
          >
            <option value="">Seçiniz...</option>
            {districts.map((d: { id: number; name: string }) => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label>Adres Detayı</label>
        <textarea 
          className="uppercase-input w-full p-2.5 rounded-lg border border-[var(--border)] min-h-[60px]" 
          {...register('address', {
            onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => {
              e.target.value = e.target.value.toLocaleUpperCase('tr-TR');
            }
          })}
          placeholder="Mahalle, Sokak, No..." 
        />
      </div>

      <div className="form-group bg-[var(--surface-container-low)] p-5 rounded-3xl border border-[var(--border-strong)] shadow-sm">
        <label className="block mb-4 font-extrabold text-[0.9rem] text-[var(--text-muted)]">
          KREDİ LİMİTİ / RİSK YÖNETİMİ
        </label>
        
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <button 
              type="button" 
              className="btn btn-secondary circle w-[42px] h-[42px] bg-[var(--error-glow)] text-[var(--error)] border border-[var(--error-glow)]"
              onClick={() => setValue('creditLimit', Number(getValues('creditLimit')) - 10000)}
              title="-10,000"
            >
              -10K
            </button>
            <button 
              type="button" 
              className="btn btn-secondary circle w-[42px] h-[42px] bg-[var(--error-glow)] text-[var(--error)] border border-[var(--error-glow)]"
              onClick={() => setValue('creditLimit', Number(getValues('creditLimit')) - 1000)}
              title="-1,000"
            >
              -1K
            </button>
          </div>
          
          <div className="flex-1 relative">
            <input 
              type="number" 
              className={`uppercase-input tabular-nums w-full font-black text-3xl text-center border-2 border-[var(--primary-glow)] rounded-2xl h-16 bg-white tracking-tight ${
                creditLimitWatcher < 0 ? 'text-[var(--error)]' : creditLimitWatcher > 0 ? 'text-[var(--success)]' : 'text-[var(--text-main)]'
              }`}
              {...register('creditLimit')}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-[var(--text-muted)] text-[0.8rem]">TRY</div>
          </div>

          <div className="flex gap-1.5">
            <button 
              type="button" 
              className="btn btn-secondary circle w-[42px] h-[42px] bg-[var(--success-glow)] text-[var(--success)] border border-[var(--success-glow)]"
              onClick={() => setValue('creditLimit', Number(getValues('creditLimit')) + 1000)}
              title="+1,000"
            >
              +1K
            </button>
            <button 
              type="button" 
              className="btn btn-secondary circle w-[42px] h-[42px] bg-[var(--success-glow)] text-[var(--success)] border border-[var(--success-glow)]"
              onClick={() => setValue('creditLimit', Number(getValues('creditLimit')) + 10000)}
              title="+10,000"
            >
              +10K
            </button>
          </div>
        </div>
        
        <p className="text-xs text-[var(--text-muted)] mt-3 text-center font-semibold italic">
          {creditLimitWatcher > 0 
            ? `Bu cari firma sizden en fazla ${Number(creditLimitWatcher).toLocaleString('tr-TR')} TL borç alabilir.` 
            : (creditLimitWatcher < 0 
              ? `Bu cariye olan maksimum borçlanma sınırınız ${Math.abs(Number(creditLimitWatcher)).toLocaleString('tr-TR')} TL.` 
              : 'Herhangi bir kredi limiti tanımlanmadı.')}
        </p>
      </div>

      <div className="form-group">
        <label>Özel Notlar</label>
        <textarea 
          className="uppercase-input w-full p-2.5 rounded-lg border border-[var(--border)] min-h-[60px]" 
          {...register('notes')}
          placeholder="Cari hakkında notlar..." 
        />
      </div>

      <div className="flex gap-4 mt-5">
        <button type="submit" className="btn btn-primary flex-1 h-[50px]">
          <FiCheck /> {editingId ? 'GÜNCELLE' : 'CARİ KARTI KAYDET'}
        </button>
        <button type="button" className="btn flex-[0.5] bg-slate-200 h-[50px]" onClick={onCancel}>İPTAL</button>
      </div>
    </form>
  );
};
