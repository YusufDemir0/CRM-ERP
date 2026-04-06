import { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { FiSave, FiSettings, FiDollarSign, FiPhone, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';

const CURRENCY_OPTIONS = [
  { code: 'TRY', label: 'Türk Lirası (₺)', symbol: '₺' },
  { code: 'USD', label: 'ABD Doları ($)', symbol: '$' },
  { code: 'EUR', label: 'Euro (€)', symbol: '€' },
  { code: 'GBP', label: 'İngiliz Sterlini (£)', symbol: '£' },
  { code: 'CHF', label: 'İsviçre Frangı (CHF)', symbol: 'CHF' },
  { code: 'JPY', label: 'Japon Yeni (¥)', symbol: '¥' },
  { code: 'SAR', label: 'Suudi Riyali (SAR)', symbol: 'SAR' },
  { code: 'AED', label: 'BAE Dirhemi (AED)', symbol: 'AED' },
];

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const [currency, setCurrency] = useState(settings.defaultCurrency);
  const [phone, setPhone] = useState(settings.authorizedPhone);
  const [saved, setSaved] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    setCurrency(settings.defaultCurrency);
    setPhone(settings.authorizedPhone);
  }, [settings]);

  const validatePhone = (value: string): boolean => {
    // Allow digits, spaces, +, -, (, )
    const cleaned = value.replace(/[\s\-\(\)]/g, '');
    if (cleaned.length < 7) {
      setPhoneError('Telefon numarası en az 7 haneli olmalıdır.');
      return false;
    }
    if (!/^\+?\d+$/.test(cleaned)) {
      setPhoneError('Geçersiz telefon numarası formatı.');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handleSave = () => {
    if (!validatePhone(phone)) return;

    updateSettings({
      defaultCurrency: currency,
      authorizedPhone: phone,
    });

    setSaved(true);
    toast.success('Ayarlar başarıyla kaydedildi.');
    setTimeout(() => setSaved(false), 2000);
  };

  const hasChanges = currency !== settings.defaultCurrency || phone !== settings.authorizedPhone;

  return (
    <div>
      <div className="page-header">
        <h1>
          <FiSettings style={{ marginRight: 12, verticalAlign: 'middle' }} />
          Ayarlar
        </h1>
      </div>

      <div className="settings-container">
        {/* Varsayılan Tercihler */}
        <div className="settings-section">
          <div className="settings-section-header">
            <h2>Varsayılan Tercihler</h2>
            <p>Uygulama genelinde kullanılacak varsayılan ayarlar.</p>
          </div>

          <div className="settings-section-body">
            {/* Para Birimi */}
            <div className="settings-field">
              <div className="settings-field-label">
                <FiDollarSign className="settings-field-icon" />
                <div>
                  <label htmlFor="settings-currency">Varsayılan Para Birimi</label>
                  <p>İşlemlerde kullanılacak varsayılan para birimi.</p>
                </div>
              </div>
              <div className="settings-field-input">
                <select
                  id="settings-currency"
                  className="form-input"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  {CURRENCY_OPTIONS.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Yetkili Telefon Numarası */}
            <div className="settings-field">
              <div className="settings-field-label">
                <FiPhone className="settings-field-icon" />
                <div>
                  <label htmlFor="settings-phone">Yetkili Telefon Numarası</label>
                  <p>Şifre sıfırlama taleplerinde gösterilecek iletişim numarası.</p>
                </div>
              </div>
              <div className="settings-field-input">
                <input
                  id="settings-phone"
                  className={`form-input ${phoneError ? 'form-input--error' : ''}`}
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (phoneError) validatePhone(e.target.value);
                  }}
                  placeholder="+90 555 555 55 55"
                />
                {phoneError && <span className="field-error">{phoneError}</span>}
              </div>
            </div>
          </div>

          <div className="settings-section-footer">
            <div className="settings-footer-info">
              {saved && (
                <span className="settings-saved-badge">
                  <FiCheck /> Kaydedildi
                </span>
              )}
              {hasChanges && !saved && (
                <span className="settings-unsaved-badge">
                  Kaydedilmemiş değişiklikler var
                </span>
              )}
            </div>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={!hasChanges && !phoneError}
            >
              <FiSave />
              Kaydet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
