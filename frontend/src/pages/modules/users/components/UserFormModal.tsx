import React, { useState, useEffect } from 'react';
import { Department, Role } from '../../../../types';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => void;
  editingId: number | null;
  initialData: any;
  departments: Department[];
  availableRoles: Role[];
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingId,
  initialData,
  departments,
  availableRoles,
}) => {
  const [formData, setFormData] = useState(initialData);
  const [countryCode, setCountryCode] = useState('+90');

  useEffect(() => {
    setFormData(initialData);
    if (initialData.phone.startsWith('+90 ')) {
      setCountryCode('+90');
      setFormData((prev: any) => ({ ...prev, phone: initialData.phone.substring(4) }));
    }
  }, [initialData]);

  const formatPhone = (val: string) => {
    let d = val.replace(/\D/g, '');
    if (d.startsWith('0')) d = d.substring(1);
    d = d.substring(0, 10);
    let res = '';
    if (d.length > 0) res += d.substring(0, 3);
    if (d.length > 3) res += ' ' + d.substring(3, 6);
    if (d.length > 6) res += ' ' + d.substring(6, 8);
    if (d.length > 8) res += ' ' + d.substring(8, 10);
    return res;
  };

  const handleRoleToggle = (roleId: number) => {
    setFormData((prev: any) => ({
      ...prev,
      selectedRoles: prev.selectedRoles.includes(roleId)
        ? prev.selectedRoles.filter((id: number) => id !== roleId)
        : [...prev.selectedRoles, roleId],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      fullPhone: `${countryCode} ${formData.phone}`,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="loader-overlay" style={{ alignItems: 'flex-start', paddingTop: '3%', overflowY: 'auto' }}>
      <div className="login-box" style={{ maxWidth: '800px', width: '100%', marginBottom: '5%' }}>
        <h3 style={{ marginBottom: '20px', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
          {editingId ? 'Personel Güncelle' : 'Sisteme Personel Ekle'}
        </h3>
        <form onSubmit={handleSubmit} className="login-form">
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
            {/* SOL TARAF: KİŞİ BİLGİLERİ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div className="form-group">
                <label>Personel Ad Soyad</label>
                <input
                  required
                  className="uppercase-input"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value.replace(/[0-9]/g, '').toLocaleUpperCase('tr-TR') })}
                  placeholder="ÖR: AHMET YILMAZ"
                />
              </div>
              <div style={{ display: 'flex', gap: '15px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Sistem Kullanıcı Adı</label>
                  <input
                    required
                    className="uppercase-input"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                    placeholder="ahmety"
                    disabled={!!editingId}
                    style={{ textTransform: 'lowercase' }}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>
                    Sistem Şifresi {editingId && <span style={{ fontSize: '9px', color: 'red' }}>(Boş=Aynı)</span>}
                  </label>
                  <input
                    type="password"
                    required={!editingId}
                    className="uppercase-input"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="****"
                    style={{ textTransform: 'none' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '15px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Departman *</label>
                  <select
                    required
                    className="uppercase-input"
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  >
                    <option value="">Lütfen Seçiniz</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Telefon *</label>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <select
                      required
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      style={{ width: '80px', padding: '0.75rem 0.5rem', appearance: 'none', textAlign: 'center' }}
                      className="uppercase-input"
                    >
                      <option value="+90">+90</option>
                      <option value="+1">+1</option>
                      <option value="+44">+44</option>
                      <option value="+49">+49</option>
                    </select>
                    <input
                      required
                      style={{ flex: 1 }}
                      className="uppercase-input tabular-nums"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                      placeholder="5XX XXX XX XX"
                    />
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label>Kurumsal E-Posta (Opsiyonel)</label>
                <input
                  type="email"
                  className="uppercase-input"
                  style={{ textTransform: 'lowercase' }}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })}
                  placeholder="personel@sirket.com"
                />
              </div>
            </div>

            {/* SAĞ TARAF: ROL ATAMA */}
            <div style={{ background: 'var(--surface-container-low)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <label style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 800, marginBottom: '10px', display: 'block' }}>Rolsüz Kullanıcı Eklenemez.</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto' }}>
                {availableRoles.map((r) => (
                  <label key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer', background: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <input type="checkbox" checked={formData.selectedRoles.includes(r.id)} onChange={() => handleRoleToggle(r.id)} />
                    <strong>{r.name}</strong>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
            <button type="submit" className="btn btn-primary" disabled={formData.selectedRoles.length === 0} style={{ flex: 1, height: '50px' }}>
              {editingId ? 'BİLGİLERİ GÜNCELLE' : 'KULLANICI OLUŞTUR VE YETKİLERİ ATA'}
            </button>
            <button type="button" className="btn" style={{ flex: 0.5, background: '#e2e8f0', height: '50px' }} onClick={onClose}>
              İPTAL
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
