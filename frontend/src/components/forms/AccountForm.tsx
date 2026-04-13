import React, { useState, useEffect } from 'react';
import { accountsAPI, currenciesAPI } from '../../services/api';
import { FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface AccountFormProps {
  initialData?: any;
  editingId?: number | null;
  onSuccess: (data: any) => void;
  onCancel: () => void;
}

export const AccountForm: React.FC<AccountFormProps> = ({
  initialData,
  editingId,
  onSuccess,
  onCancel,
}) => {
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [formData, setFormData] = useState(initialData || {
    name: '',
    bankName: '',
    iban: '',
    ibanName: '',
    currencyId: '',
    criticalLimit: 0,
    description: ''
  });

  useEffect(() => {
    async function fetchCurrencies() {
      try {
        const res = await currenciesAPI.getAll();
        const curList = res.data;
        setCurrencies(curList);
        if (!formData.currencyId && curList.length > 0) {
          const defaultCur = curList.find((c: any) => c.isDefault === 1);
          if (defaultCur) setFormData((prev: any) => ({ ...prev, currencyId: defaultCur.id }));
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchCurrencies();
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
    const rawIban = formData.iban.replace(/\s/g, '');
    if (rawIban.length > 0 && rawIban.length !== 26) {
      toast.error("IBAN eksik veya fazla girilmiş. TR + 24 rakam olmalıdır.");
      return;
    }

    try {
      if (editingId) {
        const res = await accountsAPI.update(editingId, formData);
        onSuccess(res.data);
      } else {
        const res = await accountsAPI.create(formData);
        onSuccess(res.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button type="button" className="btn" style={{ background: '#f1f5f9' }} onClick={() => setFormData((p: any) => ({ ...p, criticalLimit: p.criticalLimit - 1000 }))}>-1K</button>
          <div style={{ flex: 1, textAlign: 'center', fontWeight: '800', fontSize: '18px', padding: '10px', border: '2px dashed var(--border)', borderRadius: '12px' }}>
            {Number(formData.criticalLimit).toLocaleString('tr-TR')} TL
          </div>
          <button type="button" className="btn" style={{ background: '#f1f5f9' }} onClick={() => setFormData((p: any) => ({ ...p, criticalLimit: p.criticalLimit + 1000 }))}>+1K</button>
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
