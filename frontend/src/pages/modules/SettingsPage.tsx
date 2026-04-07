import React, { useState, useEffect } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { FiSave, FiSettings, FiDollarSign, FiPhone, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';

const CURRENCY_OPTIONS =[
  { code: 'TRY', label: 'Türk Lirası (₺)', symbol: '₺' },
  { code: 'USD', label: 'ABD Doları ($)', symbol: '$' },
  { code: 'EUR', label: 'Euro (€)', symbol: '€' },
];

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const [currency, setCurrency] = useState(settings.defaultCurrency);
  const [phone, setPhone] = useState(settings.authorizedPhone);

  useEffect(() => {
    setCurrency(settings.defaultCurrency);
    setPhone(settings.authorizedPhone);
  },[settings]);

  const handleSave = () => {
    updateSettings({ defaultCurrency: currency, authorizedPhone: phone });
    toast.success('Sistem Ayarları Güncellendi');
  };

  return (
    <div className="page-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: '30px' }}>
        <h2 style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FiSettings /> Sistem Temel Ayarları
        </h2>
      </div>

      <div className="login-box" style={{ width: '100%', maxWidth: '100%' }}>
        <div className="form-group" style={{ marginBottom: '25px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--on-surface-variant)' }}>
            <FiDollarSign /> Varsayılan Sistem Para Birimi
          </label>
          <select className="uppercase-input" style={{ appearance: 'none', marginTop: '10px' }} value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {CURRENCY_OPTIONS.map((c) => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
          <p style={{ fontSize: '11px', color: 'gray', marginTop: '5px' }}>Uygulama genelinde gösterilecek ana baz kur.</p>
        </div>

        <div className="form-group" style={{ marginBottom: '30px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--on-surface-variant)' }}>
            <FiPhone /> Yetkili Destek / İletişim Numarası
          </label>
          <input className="uppercase-input" style={{ marginTop: '10px' }} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+90 555 555 55 55" />
          <p style={{ fontSize: '11px', color: 'gray', marginTop: '5px' }}>Şifre sıfırlama veya sistem kilitlenmelerinde login ekranında gösterilir.</p>
        </div>

        <button className="btn btn-primary" style={{ width: '100%', height: '55px', fontSize: '1.1rem' }} onClick={handleSave}>
          <FiSave style={{ marginRight: '8px' }} /> AYARLARI KAYDET
        </button>
      </div>
    </div>
  );
}