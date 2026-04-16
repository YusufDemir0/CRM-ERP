import React from 'react';
import { FiX } from 'react-icons/fi';
import { Sale, SaleItem } from '../../types';

interface ViewSaleModalProps {
  sale: Sale;
  onClose: () => void;
}

export const ViewSaleModal: React.FC<ViewSaleModalProps> = ({ sale, onClose }) => {
  return (
    <div className="loader-overlay" style={{ alignItems: 'flex-start', paddingTop: '5%', paddingBottom: '5%', overflowY: 'auto' }}>
      <div className="login-box" style={{ maxWidth: '900px', width: '100%', position: 'relative' }}>
        <button className="btn-icon circle" style={{ position: 'absolute', top: '15px', right: '15px' }} onClick={onClose}>
          <FiX size={20}/>
        </button>
        <h3 style={{ color: 'var(--primary)', marginBottom: '5px' }}>Sipariş İnceleme: {sale.code}</h3>
        <p style={{ fontSize: '12px', color: 'gray', marginBottom: '20px' }}>
          Tarih: {new Date(sale.createdAt).toLocaleString('tr-TR')} | 
          Durum: <strong style={{ color: sale.status === 'approved' ? 'var(--success)' : sale.status === 'cancelled' ? 'var(--danger)' : 'var(--warning)' }}>{sale.status.toUpperCase()}</strong>
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div style={{ background: 'var(--surface-container-low)', padding: '15px', borderRadius: '12px' }}>
            <h4 style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>MÜŞTERİ (CARİ) BİLGİSİ</h4>
            <div style={{ fontWeight: 800, fontSize: '14px' }}>{sale.party?.name}</div>
            {sale.party?.taxNumber && <div style={{ fontSize: '12px', marginTop: '5px' }}>VKN/TC: {sale.party?.taxNumber}</div>}
            <div style={{ fontSize: '12px', marginTop: '5px' }}>Tel: {sale.party?.phone1 || '-'}</div>
          </div>
          <div style={{ background: 'var(--surface-container-low)', padding: '15px', borderRadius: '12px' }}>
            <h4 style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>SİPARİŞ ÖZETİ</h4>
            <div style={{ fontSize: '12px', marginBottom: '5px' }}><strong>Teslimat:</strong> {sale.deliveryDate ? new Date(sale.deliveryDate).toLocaleDateString('tr-TR') : 'Belirtilmedi'}</div>
            <div style={{ fontSize: '12px', marginBottom: '5px' }}><strong>Satış Tipi:</strong> {sale.saleType?.name || '-'}</div>
            <div style={{ fontSize: '12px', marginBottom: '5px' }}><strong>Para Birimi:</strong> {sale.currency?.name || 'TRY'} ({sale.currency?.symbol || '₺'})</div>
          </div>
        </div>

        {/* SEPET LİSTESİ */}
        <div style={{ overflowX: 'auto', marginBottom: '20px', border: '1px solid var(--border)', borderRadius: '12px' }}>
          <table style={{ width: '100%', fontSize: '12px', textAlign: 'left' }}>
            <thead style={{ background: 'var(--surface-container-highest)' }}>
              <tr>
                <th style={{ padding: '10px' }}>Ürün Adı</th>
                <th>Birim Fiyat</th>
                <th>Miktar</th>
                <th>İndirim</th>
                <th>Net Fiyat</th>
                <th>KDV</th>
                <th>Toplam Tutar</th>
              </tr>
            </thead>
            <tbody>
              {sale.items?.map((item: SaleItem) => (
                <tr key={item.itemId} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px', fontWeight: 600 }}>{item.item?.name} <br/><span style={{ fontSize: '10px', color: 'gray', fontWeight: 'normal' }}>{item.item?.code}</span></td>
                  <td className="tabular-nums">{Number(item.price).toLocaleString('tr-TR')} {sale.currency?.symbol || '₺'}</td>
                  <td className="tabular-nums"><strong>{item.quantity}</strong></td>
                  <td className="tabular-nums" style={{ color: 'var(--error)' }}>
                    {Number(item.discountAmount) > 0 ? `-${Number(item.discountAmount)} ₺` : Number(item.discountPercent) > 0 ? `-${Number(item.discountPercent)}%` : '-'}
                  </td>
                  <td className="tabular-nums">{Number(item.netPrice).toLocaleString('tr-TR')} {sale.currency?.symbol || '₺'}</td>
                  <td className="tabular-nums">%{item.kdvRate} ({Number(item.kdvAmount).toLocaleString('tr-TR')} {sale.currency?.symbol || '₺'})</td>
                  <td className="tabular-nums" style={{ fontWeight: 800 }}>{Number(item.lineTotal).toLocaleString('tr-TR')} {sale.currency?.symbol || '₺'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* NOTLAR VE TOPLAM ÖZETİ */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, background: '#fdf8f6', padding: '15px', borderRadius: '12px', border: '1px dashed #fee2e2' }}>
            <h4 style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>NOTLAR / SÖZLEŞME METNİ</h4>
            <p style={{ fontSize: '12px', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{sale.notes || 'Not bulunmuyor.'}</p>
          </div>
          <div style={{ flex: 1, background: 'var(--surface-container)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
              <span>Ara Toplam (Mal/Hizmet):</span>
              <span className="tabular-nums">{Number(sale.totalAmount).toLocaleString('tr-TR')} {sale.currency?.symbol || '₺'}</span>
            </div>
            {Number(sale.discountAmount) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px', color: 'var(--error)' }}>
                <span>Alt İndirim (Fatura Altı):</span>
                <span className="tabular-nums">-{Number(sale.discountAmount).toLocaleString('tr-TR')} {sale.currency?.symbol || '₺'}</span>
              </div>
            )}
            {Number(sale.discountPercent) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px', color: 'var(--error)' }}>
                <span>Alt İndirim (Yüzde):</span>
                <span className="tabular-nums">-%{Number(sale.discountPercent)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
              <span>Toplam KDV:</span>
              <span className="tabular-nums">+{Number(sale.kdv).toLocaleString('tr-TR')} {sale.currency?.symbol || '₺'}</span>
            </div>
            {Number(sale.deposit) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px', color: 'var(--error)' }}>
                <span>Kapora / Ön Ödeme:</span>
                <span className="tabular-nums">-{Number(sale.deposit).toLocaleString('tr-TR')} {sale.currency?.symbol || '₺'}</span>
              </div>
            )}
            <div style={{ height: '1px', background: 'var(--border)', margin: '10px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 900, color: 'var(--primary)' }}>
              <span>ÖDENECEK NET TUTAR:</span>
              <span className="tabular-nums">{(Number(sale.grandTotal) - Number(sale.deposit)).toLocaleString('tr-TR')} {sale.currency?.symbol || '₺'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
