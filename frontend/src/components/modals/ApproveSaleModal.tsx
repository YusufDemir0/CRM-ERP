import React from 'react';
import { Department } from '../../types';

interface ApproveSaleModalProps {
  departments: Department[];
  selectedDeptId: string;
  onSelectedDeptIdChange: (id: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const ApproveSaleModal: React.FC<ApproveSaleModalProps> = ({
  departments,
  selectedDeptId,
  onSelectedDeptIdChange,
  onSubmit,
  onClose,
}) => {
  return (
    <div className="loader-overlay" style={{ alignItems: 'flex-start', paddingTop: '10%' }}>
      <div className="login-box" style={{ maxWidth: '500px', width: '100%' }}>
        <h3 style={{ marginBottom: '20px', color: 'var(--success)', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>Satışı Onayla ve Stok Düş</h3>
        <p style={{ fontSize: '13px', color: 'gray', marginBottom: '20px' }}>
          Bu siparişi onayladığınızda, siparişteki kalemlerin stokları belirteceğiniz depodan otomatik düşülecektir. İşlem geri alınamaz.
        </p>
        <form onSubmit={onSubmit} className="login-form">
          <div className="form-group">
            <label>Stokların Düşüleceği Depo</label>
            <select required className="uppercase-input" style={{ appearance: 'none' }} value={selectedDeptId} onChange={e => onSelectedDeptIdChange(e.target.value)}>
              <option value="">-- DEPO SEÇİNİZ --</option>
              {departments.filter(d => d.state === 1).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
            <button type="submit" className="btn" style={{ flex: 1, background: 'var(--success)', color: 'white', height: '50px' }}>ONAYLA VE STOK DÜŞ</button>
            <button type="button" className="btn" style={{ flex: 1, background: '#e2e8f0', height: '50px' }} onClick={onClose}>İPTAL</button>
          </div>
        </form>
      </div>
    </div>
  );
};
