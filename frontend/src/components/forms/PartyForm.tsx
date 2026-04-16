import React, { useState, useEffect, useCallback } from 'react';
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
  
  const [formData, setFormData] = useState<PartyFormData>(() => {
    // Only use cache if NOT editing
    if (!editingId) {
      const cached = getCache('party') as PartyFormData | null;
      if (cached) return cached;
    }
    return {
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
      currencyId: initialData?.currencyId || 1, // Assume 1 is TRY as default
      notes: initialData?.notes || ''
    };
  });

  const { districts, loading: districtsLoading } = useTurkiyeDistricts(formData.cityId || null);
  const [emailFocus, setEmailFocus] = useState(false);

  // Caching strategy: Update only on blur or unmount to prevent re-render loops
  const saveDraft = useCallback(() => {
    if (!editingId) {
      updateCache('party', formData);
    }
  }, [formData, updateCache, editingId]);

  useEffect(() => {
    const controller = new AbortController();
    currenciesAPI.getAll({}, { signal: controller.signal }).then(res => {
      const curList = res.data;
      setCurrencies(curList);
      
      if (!formData.currencyId && curList.length > 0) {
        const defaultCur = curList.find((c) => c.isDefault === 1);
        if (defaultCur) setFormData(prev => ({ ...prev, currencyId: defaultCur.id }));
      }
    }).catch(err => {
      if (err.name !== 'AbortError') {
        console.error(err);
      }
    });
    return () => controller.abort();
  }, []);

  const handleNameChange = (val: string) => {
    // İsim soyisim sayı alamaz
    const filtered = val.replace(/[0-9]/g, '');
    setFormData({ ...formData, name: filtered.toLocaleUpperCase('tr-TR') });
  };

  const handleTaxOfficeChange = (val: string) => {
    // Vergi dairesi sayı alamaz
    const filtered = val.replace(/[0-9]/g, '');
    setFormData({ ...formData, taxOffice: filtered.toLocaleUpperCase('tr-TR') });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSubmit = {
        ...formData,
        cityId: formData.cityId ? Number(formData.cityId) : undefined,
        currencyId: formData.currencyId ? Number(formData.currencyId) : undefined,
        creditLimit: formData.creditLimit ? Number(formData.creditLimit) : 0,
        email: formData.email.trim() === '' ? undefined : formData.email.trim(),
        taxNumber: formData.taxNumber.trim() === '' ? undefined : formData.taxNumber.trim(),
        taxOffice: formData.taxOffice.trim() === '' ? undefined : formData.taxOffice.trim(),
        phone1: formData.phone1.trim() === '' ? undefined : formData.phone1.trim(),
        phone2: formData.phone2.trim() === '' ? undefined : formData.phone2.trim(),
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
    const len = formData.taxNumber.length;
    if (len === 10) return 'VKN';
    if (len === 11) return 'TCKN';
    return 'Vergi No / TC No';
  };

  return (
    <form onSubmit={handleSubmit} onBlur={saveDraft} className="login-form">
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px' }}>
        <div className="form-group">
          <label>Cari Unvan / Ad-Soyad (Zorunlu)</label>
          <input 
            required 
            className="uppercase-input" 
            value={formData.name} 
            onChange={e => handleNameChange(e.target.value)} 
            placeholder="ÖR: ERMAY LOJİSTİK A.Ş." 
          />
        </div>
        <div className="form-group">
          <label>Cari Tipi</label>
          <select 
            required 
            className="uppercase-input" 
            value={formData.type} 
            onChange={e => setFormData({ ...formData, type: e.target.value as Party['type'] })}
          >
            <option value="customer">Müşteri</option>
            <option value="provider">Tedarikçi</option>
            <option value="both">Hem Müşteri Hem Tedarikçi</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        <div className="form-group">
          <label style={{ 
            color: (formData.taxNumber.length === 10 || formData.taxNumber.length === 11) ? 'var(--primary)' : 'inherit',
            fontWeight: (formData.taxNumber.length === 10 || formData.taxNumber.length === 11) ? '800' : '400'
          }}>
            {getTaxLabel()} { (formData.taxNumber.length === 10 || formData.taxNumber.length === 11) && <FiCheck style={{ verticalAlign: 'middle' }} /> }
          </label>
          <input 
            className="uppercase-input" 
            value={formData.taxNumber} 
            onChange={e => setFormData({ ...formData, taxNumber: e.target.value.replace(/\D/g, '').substring(0, 11) })} 
            placeholder="0000000000"
            type="text"
            inputMode="numeric"
          />
        </div>
        {formData.taxNumber.length > 0 && (
          <div className="form-group">
            <label>Vergi Dairesi (Opsiyonel)</label>
            <input 
              className="uppercase-input" 
              value={formData.taxOffice} 
              onChange={e => handleTaxOfficeChange(e.target.value)} 
              placeholder="ÖR: GÜNEŞLİ" 
            />
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        <div className="form-group">
          <label>Telefon 1</label>
          <div style={{ display: 'flex', gap: '5px' }}>
            <span style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)' }}>+90</span>
            <input 
              className="uppercase-input" 
              value={formData.phone1} 
              onChange={e => setFormData({ ...formData, phone1: e.target.value.replace(/\D/g, '').substring(0, 10) })} 
              placeholder="5XX XXX XX XX"
              style={{ flex: 1 }}
              type="tel"
            />
          </div>
        </div>
        <div className="form-group">
          <label>Telefon 2</label>
          <div style={{ display: 'flex', gap: '5px' }}>
            <span style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)' }}>+90</span>
            <input 
              className="uppercase-input" 
              value={formData.phone2} 
              onChange={e => setFormData({ ...formData, phone2: e.target.value.replace(/\D/g, '').substring(0, 10) })} 
              placeholder="5XX XXX XX XX"
              style={{ flex: 1 }}
              type="tel"
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        <div className="form-group">
          <label>E-Posta</label>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              className="uppercase-input" 
              value={formData.email} 
              onChange={e => setFormData({ ...formData, email: e.target.value.toLowerCase() })} 
              onFocus={() => setEmailFocus(true)}
              onBlur={() => setTimeout(() => setEmailFocus(false), 200)}
              placeholder="yusuf..." 
            />
            {emailFocus && formData.email && !formData.email.includes('@') && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid var(--border)', borderRadius: '8px', zIndex: 10, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', marginTop: '5px', overflow: 'hidden' }}>
                {['@gmail.com', '@hotmail.com', '@outlook.com', '@icloud.com'].map(ext => (
                  <div 
                    key={ext} 
                    style={{ padding: '10px', cursor: 'pointer', transition: 'background 0.2s', fontSize: '13px' }}
                    onClick={() => setFormData({ ...formData, email: formData.email + ext })}
                    onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => (e.target as HTMLElement).style.background = '#f1f5f9'}
                    onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => (e.target as HTMLElement).style.background = 'transparent'}
                  >
                    <strong>{formData.email}</strong>{ext}
                  </div>
                ))}
              </div>
            )}
            {emailFocus && formData.email && formData.email.includes('@') && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid var(--border)', borderRadius: '8px', zIndex: 10, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', marginTop: '5px', overflow: 'hidden' }}>
                 {[ '@gmail.com', '@hotmail.com', '@outlook.com', '@icloud.com'].map(ext => (
                  <div 
                    key={ext} 
                    style={{ padding: '10px', cursor: 'pointer', transition: 'background 0.2s', fontSize: '13px', display: formData.email.split('@')[1] !== ext.substring(1) ? 'block' : 'none' }}
                    onClick={() => setFormData({ ...formData, email: formData.email.split('@')[0] + ext })}
                    onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => (e.target as HTMLElement).style.background = '#f1f5f9'}
                    onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => (e.target as HTMLElement).style.background = 'transparent'}
                  >
                    Hızlı Değiştir: <strong>{formData.email.split('@')[0]}</strong>{ext}
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
            value={formData.currencyId} 
            onChange={e => setFormData({ ...formData, currencyId: Number(e.target.value) })}
          >
            {currencies.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        <div className="form-group">
          <label>İl</label>
          <select 
            className="uppercase-input" 
            value={formData.cityId} 
            onChange={e => setFormData({ ...formData, cityId: Number(e.target.value), districtName: '' })}
          >
            <option value={0}>Seçiniz...</option>
            {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>İlçe</label>
          <select 
            className="uppercase-input" 
            value={formData.districtName} 
            onChange={e => setFormData({ ...formData, districtName: e.target.value })}
            disabled={!formData.cityId}
          >
            <option value="">Seçiniz...</option>
            {districts.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label>Adres Detayı</label>
        <textarea 
          className="uppercase-input" 
          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', minHeight: '60px' }} 
          value={formData.address} 
          onChange={e => setFormData({ ...formData, address: e.target.value.toLocaleUpperCase('tr-TR') })} 
          placeholder="Mahalle, Sokak, No..." 
        />
      </div>

      <div className="form-group" style={{ 
        background: 'var(--surface-container-low)', 
        padding: '20px', 
        borderRadius: '24px', 
        border: '1px solid var(--border-strong)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <label style={{ display: 'block', marginBottom: '15px', fontWeight: '800', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          KREDİ LİMİTİ / RİSK YÖNETİMİ
        </label>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Eksiler (Sol) */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button 
              type="button" 
              className="btn btn-secondary circle" 
              style={{ width: '42px', height: '42px', background: 'var(--error-glow)', color: 'var(--error)', border: '1px solid var(--error-glow)' }}
              onClick={() => setFormData(prev => ({ ...prev, creditLimit: Number(prev.creditLimit) - 10000 }))}
              title="-10,000"
            >
              -10K
            </button>
            <button 
              type="button" 
              className="btn btn-secondary circle" 
              style={{ width: '42px', height: '42px', background: 'var(--error-glow)', color: 'var(--error)', border: '1px solid var(--error-glow)' }}
              onClick={() => setFormData(prev => ({ ...prev, creditLimit: Number(prev.creditLimit) - 1000 }))}
              title="-1,000"
            >
              -1K
            </button>
          </div>
          
          <div style={{ flex: 1, position: 'relative' }}>
            <input 
              type="number" 
              className="uppercase-input tabular-nums" 
              style={{ 
                width: '100%',
                fontWeight: '950', 
                fontSize: '1.8rem', 
                color: formData.creditLimit < 0 ? 'var(--error)' : (formData.creditLimit > 0 ? 'var(--success)' : 'var(--text-main)'), 
                textAlign: 'center', 
                border: '2px solid var(--primary-glow)', 
                borderRadius: '16px', 
                height: '64px', 
                background: 'white',
                letterSpacing: '-1px'
              }}
              value={formData.creditLimit} 
              onChange={e => setFormData({ ...formData, creditLimit: Number(e.target.value) })} 
            />
            <div style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', fontWeight: '900', color: 'var(--text-muted)', fontSize: '0.8rem' }}>TRY</div>
          </div>

          {/* Artılar (Sağ) */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button 
              type="button" 
              className="btn btn-secondary circle" 
              style={{ width: '42px', height: '42px', background: 'var(--success-glow)', color: 'var(--success)', border: '1px solid var(--success-glow)' }}
              onClick={() => setFormData(prev => ({ ...prev, creditLimit: Number(prev.creditLimit) + 1000 }))}
              title="+1,000"
            >
              +1K
            </button>
            <button 
              type="button" 
              className="btn btn-secondary circle" 
              style={{ width: '42px', height: '42px', background: 'var(--success-glow)', color: 'var(--success)', border: '1px solid var(--success-glow)' }}
              onClick={() => setFormData(prev => ({ ...prev, creditLimit: Number(prev.creditLimit) + 10000 }))}
              title="+10,000"
            >
              +10K
            </button>
          </div>
        </div>
        
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px', textAlign: 'center', fontWeight: '600', fontStyle: 'italic' }}>
          {formData.creditLimit > 0 
            ? `Bu cari firma sizden en fazla ${formData.creditLimit.toLocaleString('tr-TR')} TL borç alabilir.` 
            : (formData.creditLimit < 0 
              ? `Bu cariye olan maksimum borçlanma sınırınız ${Math.abs(formData.creditLimit).toLocaleString('tr-TR')} TL.` 
              : 'Herhangi bir kredi limiti tanımlanmadı.')}
        </p>
      </div>

      <div className="form-group">
        <label>Özel Notlar</label>
        <textarea 
          className="uppercase-input" 
          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', minHeight: '60px' }} 
          value={formData.notes} 
          onChange={e => setFormData({ ...formData, notes: e.target.value })} 
          placeholder="Cari hakkında notlar..." 
        />
      </div>

      <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
        <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '50px' }}>
          <FiCheck /> {editingId ? 'GÜNCELLE' : 'CARİ KARTI KAYDET'}
        </button>
        <button type="button" className="btn" style={{ flex: 0.5, background: '#e2e8f0', height: '50px' }} onClick={onCancel}>İPTAL</button>
      </div>
    </form>
  );
};
