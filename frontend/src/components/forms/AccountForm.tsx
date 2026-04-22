import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { accountsAPI, currenciesAPI } from '../../services/api';
import { FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';

import { useQuickCreateStore } from '../../store/useQuickCreateStore';
import { Account, Currency } from '../../types';
import { FormField } from '../common/FormField';
import { PremiumNumberInput } from '../common/PremiumNumberInput';

interface AccountFormProps {
  initialData?: Partial<Account>;
  editingId?: number | null;
  onSuccess: (data: unknown) => void;
  onCancel: () => void;
}

type AccountFormData = {
  name: string;
  bankName: string;
  iban: string;
  ibanName: string;
  currencyId: string;
  criticalLimit: number;
  description: string;
}

export const AccountForm: React.FC<AccountFormProps> = ({
  initialData,
  editingId,
  onSuccess,
  onCancel,
}) => {
  const { updateCache, getCache, clearCache } = useQuickCreateStore();
  const cacheKey = editingId ? `account_edit_${editingId}` : 'account_create';

  const [currencies, setCurrencies] = useState<Currency[]>([]);
  
  const { register, handleSubmit, setValue, getValues, watch } = useForm<AccountFormData>({
    defaultValues: (getCache(cacheKey) as AccountFormData) || {
      name: initialData?.name || '',
      bankName: initialData?.bankName || '',
      iban: initialData?.iban || '',
      ibanName: initialData?.ibanName || '',
      currencyId: String(initialData?.currencyId || ''),
      criticalLimit: Number(initialData?.criticalLimit || 0),
      description: initialData?.description || ''
    }
  });

  const criticalLimit = watch('criticalLimit');

  const saveDraft = useCallback(() => {
    updateCache(cacheKey, getValues());
  }, [getValues, cacheKey, updateCache]);

  useEffect(() => {
    const controller = new AbortController();
    
    async function fetchCurrencies() {
      try {
        const res = await currenciesAPI.getAll({ limit: 500 }, { signal: controller.signal });
        const curList = res.data.data;
        if (curList && Array.isArray(curList)) {
          setCurrencies(curList);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error(err);
        }
      }
    }
    
    fetchCurrencies();
    return () => controller.abort();
  }, [getValues, setValue]);

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

  const formatIban = (val: string) => {
    let raw = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (!raw.startsWith('TR')) raw = 'TR' + raw.replace(/[^0-9]/g, '');
    else raw = 'TR' + raw.substring(2).replace(/[^0-9]/g, '');
    let res = '';
    for (let i = 0; i < raw.length; i++) {
        if (i > 0 && i % 4 === 0) res += ' ';
        res += raw[i];
    }
    return res.substring(0, 32);
  };

  const onSubmit = async (data: AccountFormData) => {
    const rawIban = data.iban.replace(/\s/g, '');
    if (rawIban.length > 0 && rawIban.length !== 26) {
      toast.error("IBAN eksik veya fazla girilmiş. TR + 24 rakam olmalıdır.");
      return;
    }

    try {
      const payload = {
        ...data,
        currencyId: Number(data.currencyId),
        criticalLimit: String(data.criticalLimit)
      };
      if (editingId) {
        const res = await accountsAPI.update(editingId, payload);
        clearCache(cacheKey);
        onSuccess(res.data);
      } else {
        const res = await accountsAPI.create(payload);
        clearCache(cacheKey);
        onSuccess(res.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} onBlur={saveDraft} className="flex flex-col gap-6 animate-in">
      <FormField label="Hesap Adı" required>
        <input 
          required 
          className="input-premium uppercase-input font-black tracking-tight" 
          {...register('name')}
          onInput={(e) => {
            e.currentTarget.value = e.currentTarget.value.replace(/[0-9]/g, '').toLocaleUpperCase('tr-TR');
          }}
          placeholder="ÖR: MERKEZ NAKİT KASA" 
        />
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Banka Adı">
          <input 
            className="input-premium uppercase-input font-bold" 
            {...register('bankName')}
            onInput={(e) => {
              e.currentTarget.value = e.currentTarget.value.replace(/[0-9]/g, '').toLocaleUpperCase('tr-TR');
            }}
            placeholder="ÖR: ZİRAAT BANKASI" 
          />
        </FormField>
        <FormField label="Para Birimi" required>
          <select required className="input-premium font-black" {...register('currencyId')}>
            <option value="">Seçiniz...</option>
            {currencies.map(c => <option key={c.id} value={c.id}>{c.code} ({c.symbol})</option>)}
          </select>
        </FormField>
      </div>

      <FormField label="IBAN Bilgisi">
        <input 
          className="input-premium font-black tabular-nums tracking-widest" 
          {...register('iban')}
          onInput={(e) => {
            e.currentTarget.value = formatIban(e.currentTarget.value);
          }}
          placeholder="TR00 0000 0000 0000 0000 0000 00" 
        />
      </FormField>

      <FormField label="IBAN Sahibi Ad-Soyad">
        <input 
          className="input-premium uppercase-input font-bold" 
          {...register('ibanName')}
          onInput={(e) => {
            e.currentTarget.value = e.currentTarget.value.replace(/[0-9]/g, '').toLocaleUpperCase('tr-TR');
          }}
          placeholder="HESAP SAHİBİ" 
        />
      </FormField>

      <FormField label="Kritik Bakiye / Eksi Limit" className="bg-[var(--primary-glow)] p-5 rounded-2xl border border-[var(--primary-glow)]">
        <div className="flex items-center gap-2">
          <PremiumNumberInput 
            value={watch('criticalLimit')} 
            onChange={val => setValue('criticalLimit', val)} 
            className="h-14"
          />
        </div>
      </FormField>

      <FormField label="Açıklama">
        <input 
          className="input-premium uppercase-input font-medium" 
          {...register('description')}
          onInput={(e) => {
            e.currentTarget.value = e.currentTarget.value.toLocaleUpperCase('tr-TR');
          }}
          placeholder="..." 
        />
      </FormField>

      <div className="flex flex-col sm:flex-row gap-4 mt-4 pt-6 border-t border-slate-100">
        <button type="submit" className="btn btn-primary btn-lg flex-1 shadow-2xl shadow-[var(--primary-glow)]">
          <FiCheck size={20} /> {editingId ? 'GÜNCELLEMELERİ KAYDET' : 'HESABI SİSTEME KAYDET'}
        </button>
        <button type="button" className="btn bg-slate-100 text-slate-500 btn-lg px-10 font-black hover:bg-slate-200 transition-all" onClick={() => { clearCache(cacheKey); onCancel(); }}>
          İPTAL
        </button>
      </div>
    </form>
  );
};
