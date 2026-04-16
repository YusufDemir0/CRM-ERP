import React, { useState, useEffect, useCallback } from 'react';
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

export const AccountForm: React.FC<AccountFormProps> = ({
  initialData,
  editingId,
  onSuccess,
  onCancel,
}) => {
  const { updateCache, getCache, clearCache } = useQuickCreateStore();
  const cacheKey = editingId ? `account_edit_${editingId}` : 'account_create';

  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [formData, setFormData] = useState<Record<string, string | number>>(() => {
    const cached = getCache(cacheKey) as Record<string, string | number> | null;
    return cached || {
      name: initialData?.name || '',
      bankName: initialData?.bankName || '',
      iban: initialData?.iban || '',
      ibanName: initialData?.ibanName || '',
      currencyId: (initialData?.currencyId as number) || '',
      criticalLimit: (initialData?.criticalLimit as string | number) || 0,
      description: initialData?.description || ''
    };
  });

  // Caching strategy: Update only on blur or unmount to prevent re-render loops
  const saveDraft = useCallback(() => {
    updateCache(cacheKey, formData);
  }, [formData, cacheKey, updateCache]);

  useEffect(() => {
    const controller = new AbortController();
    
    async function fetchCurrencies() {
      try {
        const res = await currenciesAPI.getAll({}, { signal: controller.signal });
        const curList = res.data;
        if (curList && Array.isArray(curList)) {
          setCurrencies(curList);
          if (!formData.currencyId && curList.length > 0) {
            const defaultCur = curList.find((c: Currency) => c.isDefault === 1);
            if (defaultCur) setFormData((prev) => ({ ...prev, currencyId: defaultCur.id }));
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error(err);
        }
      }
    }
    
    fetchCurrencies();
    return () => controller.abort();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawIban = (formData.iban as string).replace(/\s/g, '');
    if (rawIban.length > 0 && rawIban.length !== 26) {
      toast.error("IBAN eksik veya fazla girilmiş. TR + 24 rakam olmalıdır.");
      return;
    }

    try {
      const payload = {
        ...formData,
        currencyId: Number(formData.currencyId),
        criticalLimit: Number(formData.criticalLimit)
      } as any;
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
    <form onSubmit={handleSubmit} onBlur={saveDraft} className="login-form">
      <div className="form-group">
        <label>Hesap Adı (Zorunlu)</label>
        <input required className="uppercase-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value.replace(/[0-9]/g, '').toLocaleUpperCase('tr-TR') })} placeholder="ÖR: MERKEZ NAKİT KASA" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        <div className="form-group">
          <label>Banka Adı</label>
          <input className="uppercase-input" value={formData.bankName} onChange={e => setFormData({ ...formData, bankName: e.target.value.replace(/[0-9]/g, '').toLocaleUpperCase('tr-TR') })} placeholder="ÖR: ZİRAAT BANKASI" />
        </div>
        <div className="form-group">
          <label>Para Birimi</label>
          <select required className="uppercase-input" value={formData.currencyId} onChange={e => setFormData({ ...formData, currencyId: e.target.value })}>
            {currencies.map(c => <option key={c.id} value={c.id}>{c.code} ({c.symbol})</option>)}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label>IBAN Bilgisi</label>
        <input className="uppercase-input" value={formData.iban} onChange={e => setFormData({ ...formData, iban: formatIban(e.target.value) })} placeholder="TR00 0000 0000 0000 0000 0000 00" />
      </div>

      <div className="form-group">
        <label>IBAN Sahibi Ad-Soyad</label>
        <input className="uppercase-input" value={formData.ibanName} onChange={e => setFormData({ ...formData, ibanName: e.target.value.replace(/[0-9]/g, '').toLocaleUpperCase('tr-TR') })} placeholder="AD SOYAD" />
      </div>

      <div className="form-group">
        <label>Kritik Bakiye / Eksi Limit Tutarı</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button type="button" className="btn btn-sm" style={{ background: '#f8fafc', border: '1px solid var(--border)', padding: '5px 8px', fontSize: '10px' }} onClick={() => setFormData((p) => ({ ...p, criticalLimit: Number(p.criticalLimit) - 10000 }))}>-10K</button>
            <button type="button" className="btn btn-sm" style={{ background: '#f8fafc', border: '1px solid var(--border)', padding: '5px 8px', fontSize: '10px' }} onClick={() => setFormData((p) => ({ ...p, criticalLimit: Number(p.criticalLimit) - 1000 }))}>-1K</button>
          </div>
          
          <input 
            type="number" 
            className="uppercase-input tabular-nums" 
            style={{ width: '150px', textAlign: 'center', fontWeight: '900', fontSize: '1.4rem', height: '45px', border: '2px solid var(--primary-glow)', borderRadius: '10px' }} 
            value={formData.criticalLimit} 
            onChange={e => setFormData({ ...formData, criticalLimit: e.target.value })} 
          />

          <div style={{ display: 'flex', gap: '4px' }}>
            <button type="button" className="btn btn-sm" style={{ background: '#f8fafc', border: '1px solid var(--border)', padding: '5px 8px', fontSize: '10px' }} onClick={() => setFormData((p) => ({ ...p, criticalLimit: Number(p.criticalLimit) + 1000 }))}>+1K</button>
            <button type="button" className="btn btn-sm" style={{ background: '#f8fafc', border: '1px solid var(--border)', padding: '5px 8px', fontSize: '10px' }} onClick={() => setFormData((p) => ({ ...p, criticalLimit: Number(p.criticalLimit) + 10000 }))}>+10K</button>
          </div>
        </div>
      </div>

      <div className="form-group">
        <label>Kısa Açıklama</label>
        <input className="uppercase-input" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value.toLocaleUpperCase('tr-TR') })} placeholder="..." />
      </div>

      <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
        <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '50px' }}>
          <FiCheck /> {editingId ? 'GÜNCELLE' : 'HESABI KAYDET'}
        </button>
        <button type="button" className="btn" style={{ flex: 0.5, background: '#e2e8f0', height: '50px' }} onClick={onCancel}>İPTAL</button>
      </div>
    </form>
  );
};
