import React from 'react';
import { parseTurkishDecimal } from '../../utils/number.helper';

interface StockAdjustmentModalProps {
  items: any[];
  departments: any[];
  formData: {
    itemId: string;
    departmentId: string;
    quantity: number;
    type: string;
    description: string;
  };
  onFormDataChange: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  items,
  departments,
  formData,
  onFormDataChange,
  onSubmit,
  onClose,
}) => {
  return (
    <div className="loader-overlay" style={{ alignItems: 'flex-start', paddingTop: '5%' }}>
      <div className="login-box" style={{ maxWidth: '600px', width: '100%' }}>
        <h3 style={{ marginBottom: '20px' }}>Manuel Stok Fişi</h3>
        <form onSubmit={onSubmit} className="login-form">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>İşlem Yönü</label>
              <select required value={formData.type} onChange={e => onFormDataChange({...formData, type: e.target.value})}>
                <option value="in">STOK GİRİŞİ (+)</option>
                <option value="out">STOK ÇIKIŞI / FİRE (-)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Depo / Şube</label>
              <select required value={formData.departmentId} onChange={e => onFormDataChange({...formData, departmentId: e.target.value})}>
                <option value="">-- SEÇİNİZ --</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>İşlem Yapılacak Ürün</label>
            <select required value={formData.itemId} onChange={e => onFormDataChange({...formData, itemId: e.target.value})}>
              <option value="">-- ÜRÜN SEÇİNİZ --</option>
              {items.map(i => <option key={i.id} value={i.id}>{i.code} - {i.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Miktar</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input 
                type="number" 
                step="0.0001" 
                required 
                className="tabular-nums" 
                style={{ width: '150px', color: formData.type === 'in' ? 'var(--success)' : 'var(--error)', fontWeight: 900, fontSize: '1.4rem', height: '45px', border: '2px solid var(--primary-glow)', borderRadius: '10px', textAlign: 'center' }} 
                value={formData.quantity === 0 ? '' : formData.quantity} 
                onChange={e => {
                  const val = e.target.value;
                  onFormDataChange({...formData, quantity: val === '' ? 0 : parseTurkishDecimal(val)});
                }} 
              />
            </div>
          </div>
          <div className="form-group">
            <label>Açıklama</label>
            <textarea rows={2} required value={formData.description} onChange={e => onFormDataChange({...formData, description: e.target.value.toLocaleUpperCase('tr-TR')})} placeholder="ÖR: SAYIM FARKI, FİRE VB." />
          </div>
          <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '50px' }}>ONAYLA</button>
            <button type="button" className="btn" style={{ flex: 0.5, height: '50px' }} onClick={onClose}>İPTAL</button>
          </div>
        </form>
      </div>
    </div>
  );
};
