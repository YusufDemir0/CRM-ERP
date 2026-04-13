import React, { useState } from 'react';
import { partiesAPI } from '../../services/api';
import { FiCheck } from 'react-icons/fi';

interface PartyFormProps {
  initialData?: any;
  editingId?: number | null;
  onSuccess: (data: any) => void;
  onCancel: () => void;
}

export const PartyForm: React.FC<PartyFormProps> = ({
  initialData,
  editingId,
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState(initialData || {
    name: '',
    type: 'customer',
    taxOffice: '',
    taxNumber: '',
    phone: '',
    email: '',
    address: '',
    commercialCreditLimit: 0,
    riskLimit: 0,
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const res = await partiesAPI.update(editingId, formData);
        onSuccess(res.data);
      } else {
        const res = await partiesAPI.create(formData);
        onSuccess(res.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px' }}>
        <div className="form-group">
          <label>Cari Unvan / Ad-Soyad (Zorunlu)</label>
          <input required className="uppercase-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value.toLocaleUpperCase('tr-TR') })} placeholder="ÖR: ERMAY LOJİSTİK A.Ş." />
        </div>
        <div className="form-group">
          <label>Cari Tipi</label>
          <select required className="uppercase-input" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
            <option value="customer">Müşteri</option>
            <option value="supplier">Tedarikçi</option>
            <option value="both">Hem Müşteri Hem Tedarikçi</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        <div className="form-group">
          <label>Vergi Dairesi</label>
          <input className="uppercase-input" value={formData.taxOffice} onChange={e => setFormData({ ...formData, taxOffice: e.target.value.toLocaleUpperCase('tr-TR') })} placeholder="..." />
        </div>
        <div className="form-group">
          <label>Vergi No / TC No</label>
          <input className="uppercase-input" value={formData.taxNumber} onChange={e => setFormData({ ...formData, taxNumber: e.target.value.replace(/\D/g, '') })} placeholder="0000000000" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        <div className="form-group">
          <label>Telefon</label>
          <input className="uppercase-input" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="05XX XXX XX XX" />
        </div>
        <div className="form-group">
          <label>E-Posta</label>
          <input type="email" className="uppercase-input" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value.toLowerCase() })} placeholder="info@company.com" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        <div className="form-group">
          <label>Ticari Kredi Limiti</label>
          <input type="number" className="uppercase-input" value={formData.commercialCreditLimit} onChange={e => setFormData({ ...formData, commercialCreditLimit: Number(e.target.value) })} />
        </div>
        <div className="form-group">
          <label>Risk Limiti</label>
          <input type="number" className="uppercase-input" value={formData.riskLimit} onChange={e => setFormData({ ...formData, riskLimit: Number(e.target.value) })} />
        </div>
      </div>

      <div className="form-group">
        <label>Adres Bilgisi</label>
        <textarea className="uppercase-input" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', minHeight: '80px' }} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value.toLocaleUpperCase('tr-TR') })} placeholder="Açık adres..." />
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
