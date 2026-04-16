import React from 'react';
import { FiRepeat } from 'react-icons/fi';

interface StockTransferModalProps {
  items: any[];
  departments: any[];
  transferData: {
    itemId: string;
    fromDepartmentId: string;
    toDepartmentId: string;
    quantity: number;
    description: string;
  };
  onTransferDataChange: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const StockTransferModal: React.FC<StockTransferModalProps> = ({
  items,
  departments,
  transferData,
  onTransferDataChange,
  onSubmit,
  onClose,
}) => {
  return (
    <div className="loader-overlay" style={{ alignItems: 'flex-start', paddingTop: '5%' }}>
      <div className="login-box" style={{ maxWidth: '650px', width: '100%' }}>
        <h3 style={{ marginBottom: '20px', color: 'var(--warning)' }}><FiRepeat style={{ marginRight: '8px' }}/>Depolar Arası Transfer</h3>
        <form onSubmit={onSubmit} className="login-form">
          <div className="form-group">
            <label>Ürün</label>
            <select required value={transferData.itemId} onChange={e => onTransferDataChange({...transferData, itemId: e.target.value})}>
              <option value="">-- SEÇİNİZ --</option>
              {items.map(i => <option key={i.id} value={i.id}>{i.code} - {i.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', background: 'var(--surface-container-highest)', padding: '15px', borderRadius: '12px' }}>
            <div className="form-group">
              <label style={{ color: 'var(--error)' }}>Çıkış Deposu</label>
              <select required value={transferData.fromDepartmentId} onChange={e => onTransferDataChange({...transferData, fromDepartmentId: e.target.value})}>
                <option value="">-- SEÇİNİZ --</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label style={{ color: 'var(--success)' }}>Giriş Deposu</label>
              <select required value={transferData.toDepartmentId} onChange={e => onTransferDataChange({...transferData, toDepartmentId: e.target.value})}>
                <option value="">-- SEÇİNİZ --</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group" style={{ marginTop: '15px' }}>
            <label>Miktar</label>
            <input 
              type="number" 
              step="0.0001" 
              required 
              className="tabular-nums" 
              style={{ width: '150px', fontWeight: 900, fontSize: '1.4rem', height: '45px', border: '2px solid var(--primary-glow)', borderRadius: '10px', textAlign: 'center' }} 
              value={transferData.quantity} 
              onChange={e => onTransferDataChange({...transferData, quantity: Number(e.target.value)})} 
            />
          </div>
          <div className="form-group">
            <label>Açıklama</label>
            <input className="uppercase-input" value={transferData.description} onChange={e => onTransferDataChange({...transferData, description: e.target.value.toLocaleUpperCase('tr-TR')})} placeholder="PLAKA, ŞOFÖR VB." />
          </div>
          <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
            <button type="submit" className="btn" style={{ flex: 1, background: 'var(--warning)', color: 'white', height: '50px' }}>TRANSFERİ BAŞLAT</button>
            <button type="button" className="btn" style={{ flex: 0.5, height: '50px' }} onClick={onClose}>İPTAL</button>
          </div>
        </form>
      </div>
    </div>
  );
};
