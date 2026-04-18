import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { accountsAPI, currenciesAPI } from '../../services/api';
import { FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';

import { useQuickCreateStore } from '../../store/useQuickCreateStore';
import { Account, Currency } from '../../types';

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
        const res = await currenciesAPI.getAll({}, { signal: controller.signal });
        const curList = res.data;
        if (curList && Array.isArray(curList)) {
          setCurrencies(curList);
          const currentCur = getValues('currencyId');
          if (!currentCur && curList.length > 0) {
            const defaultCur = curList.find((c: Currency) => c.isDefault === 1);
            if (defaultCur) setValue('currencyId', String(defaultCur.id));
          }
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
    <form onSubmit={handleSubmit(onSubmit)} onBlur={saveDraft} className="login-form">
      <div className="form-group">
        <label>Hesap Adı (Zorunlu)</label>
        <input 
          required 
          className="uppercase-input" 
          {...register('name')}
          onInput={(e) => {
            e.currentTarget.value = e.currentTarget.value.replace(/[0-9]/g, '').toLocaleUpperCase('tr-TR');
          }}
          placeholder="ÖR: MERKEZ NAKİT KASA" 
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label>Banka Adı</label>
          <input 
            className="uppercase-input" 
            {...register('bankName')}
            onInput={(e) => {
              e.currentTarget.value = e.currentTarget.value.replace(/[0-9]/g, '').toLocaleUpperCase('tr-TR');
            }}
            placeholder="ÖR: ZİRAAT BANKASI" 
          />
        </div>
        <div className="form-group">
          <label>Para Birimi</label>
          <select required className="uppercase-input" {...register('currencyId')}>
            {currencies.map(c => <option key={c.id} value={c.id}>{c.code} ({c.symbol})</option>)}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label>IBAN Bilgisi</label>
        <input 
          className="uppercase-input" 
          {...register('iban')}
          onInput={(e) => {
            e.currentTarget.value = formatIban(e.currentTarget.value);
          }}
          placeholder="TR00 0000 0000 0000 0000 0000 00" 
        />
      </div>

      <div className="form-group">
        <label>IBAN Sahibi Ad-Soyad</label>
        <input 
          className="uppercase-input" 
          {...register('ibanName')}
          onInput={(e) => {
            e.currentTarget.value = e.currentTarget.value.replace(/[0-9]/g, '').toLocaleUpperCase('tr-TR');
          }}
          placeholder="AD SOYAD" 
        />
      </div>

      <div className="form-group">
        <label>Kritik Bakiye / Eksi Limit Tutarı</label>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <button type="button" className="btn btn-sm bg-slate-50 border border-border px-2 py-1 text-[10px]" onClick={() => setValue('criticalLimit', Number(criticalLimit) - 10000)}>-10K</button>
            <button type="button" className="btn btn-sm bg-slate-50 border border-border px-2 py-1 text-[10px]" onClick={() => setValue('criticalLimit', Number(criticalLimit) - 1000)}>-1K</button>
          </div>
          
          <input 
            type="number" 
            className="uppercase-input tabular-nums w-[150px] text-center font-black text-2xl h-[45px] border-2 border-primary/20 rounded-xl" 
            {...register('criticalLimit')} 
          />

          <div className="flex gap-1">
            <button type="button" className="btn btn-sm bg-slate-50 border border-border px-2 py-1 text-[10px]" onClick={() => setValue('criticalLimit', Number(criticalLimit) + 1000)}>+1K</button>
            <button type="button" className="btn btn-sm bg-slate-50 border border-border px-2 py-1 text-[10px]" onClick={() => setValue('criticalLimit', Number(criticalLimit) + 10000)}>+10K</button>
          </div>
        </div>
      </div>

      <div className="form-group">
        <label>Kısa Açıklama</label>
        <input 
          className="uppercase-input" 
          {...register('description')}
          onInput={(e) => {
            e.currentTarget.value = e.currentTarget.value.toLocaleUpperCase('tr-TR');
          }}
          placeholder="..." 
        />
      </div>

      <div className="flex gap-4 mt-5">
        <button type="submit" className="btn btn-primary flex-1 h-[50px]">
          <FiCheck /> {editingId ? 'GÜNCELLE' : 'HESABI KAYDET'}
        </button>
        <button type="button" className="btn flex-[0.5] bg-slate-200 h-[50px]" onClick={onCancel}>İPTAL</button>
      </div>
    </form>
  );
};
