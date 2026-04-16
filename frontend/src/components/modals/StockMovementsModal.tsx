import React from 'react';
import { FiX } from 'react-icons/fi';

interface StockMovementsModalProps {
  stock: any;
  loading: boolean;
  movements: any[];
  onClose: () => void;
}

export const StockMovementsModal: React.FC<StockMovementsModalProps> = ({
  stock,
  loading,
  movements,
  onClose,
}) => {
  return (
    <div className="loader-overlay" style={{ alignItems: 'flex-start', paddingTop: '3%' }}>
      <div className="login-box" style={{ maxWidth: '900px', width: '100%', position: 'relative' }}>
        <button className="btn-icon circle" style={{ position: 'absolute', top: '15px', right: '15px' }} onClick={onClose}><FiX size={20}/></button>
        <h3 style={{ color: 'var(--primary)' }}>Stok Hareket Özeti</h3>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '5px', marginBottom: '15px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
          <strong style={{color:'var(--on-surface)'}}>[{stock?.item?.code}] {stock?.item?.name}</strong> için ({stock?.department?.name}) hareketleri
        </p>

        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 10px auto' }}></div>
            Veriler alınıyor...
          </div>
        ) : (
          <div style={{ maxHeight: '60vh', overflowY: 'auto' }} className="modern-scrollbar">
            <table style={{ width: '100%', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: 'var(--surface-container-highest)', textAlign: 'left' }}>
                  <th style={{ padding: '12px' }}>TARİH</th>
                  <th>YÖN</th>
                  <th>MİKTAR</th>
                  <th>ÖNCEKİ</th>
                  <th>SONRAKİ</th>
                  <th>AÇIKLAMA</th>
                </tr>
              </thead>
              <tbody>
                {movements.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: 'gray' }}>Hareket kaydı bulunamadı.</td></tr>
                ) : (
                  movements.map((m: any) => (
                    <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px' }}>{new Date(m.createdAt).toLocaleString('tr-TR')}</td>
                      <td>
                        <span style={{ fontWeight: 800, color: m.type === 'in' ? 'var(--success)' : 'var(--error)' }}>
                          {m.type === 'in' ? '↑ GİRİŞ' : '↓ ÇIKIŞ'}
                        </span>
                      </td>
                      <td className="tabular-nums" style={{ fontWeight: 800 }}>{Number(m.quantity).toLocaleString('tr-TR')}</td>
                      <td className="tabular-nums" style={{ color: 'var(--text-secondary)' }}>{Number(m.quantityBefore).toLocaleString('tr-TR')}</td>
                      <td className="tabular-nums" style={{ color: 'var(--primary)', fontWeight: 800 }}>{Number(m.quantityAfter).toLocaleString('tr-TR')}</td>
                      <td>{m.description || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
