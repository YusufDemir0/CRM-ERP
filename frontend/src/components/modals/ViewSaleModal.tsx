
import { FiX } from 'react-icons/fi';
import { Sale, SaleItem } from '../../types';
import { formatDisplayDate } from '../../utils/date.helper';

interface ViewSaleModalProps {
  sale: Sale;
  onClose: () => void;
}

export const ViewSaleModal: React.FC<ViewSaleModalProps> = ({ sale, onClose }) => {
  return (
    <div className="loader-overlay items-start pt-[5%] pb-[5%] overflow-y-auto">
      <div className="login-box !max-w-[1600px] w-[95%] relative">
        <button className="btn-icon circle absolute top-4 right-4" onClick={onClose}>
          <FiX size={20}/>
        </button>
        <h3 className="text-[var(--primary)] mb-1">Sipariş İnceleme: {sale.code}</h3>
        <p className="text-xs text-gray-500 mb-5">
          Tarih: {formatDisplayDate(sale.createdAt)} | 
          Durum: <strong className={
            sale.status === 'approved' ? 'text-[var(--success)]' : 
            sale.status === 'cancelled' ? 'text-[var(--danger)]' : 
            'text-[var(--warning)]'
          }>{sale.status.toUpperCase()}</strong>
        </p>

        <div className="grid grid-cols-2 gap-5 mb-5">
          <div className="bg-[var(--surface-container-low)] p-4 rounded-xl">
            <h4 className="text-xs text-[var(--text-muted)] mb-2.5">MÜŞTERİ (CARİ) BİLGİSİ</h4>
            <div className="font-extrabold text-sm">{sale.party?.name}</div>
            {sale.party?.taxNumber && <div className="text-xs mt-1">VKN/TC: {sale.party?.taxNumber}</div>}
            <div className="text-xs mt-1">Tel: {sale.party?.phone1 || '-'}</div>
          </div>
          <div className="bg-[var(--surface-container-low)] p-4 rounded-xl">
            <h4 className="text-xs text-[var(--text-muted)] mb-2.5">SİPARİŞ ÖZETİ</h4>
            <div className="text-xs mb-1"><strong>Teslimat:</strong> {sale.deliveryDate ? formatDisplayDate(sale.deliveryDate) : 'Belirtilmedi'}</div>
            <div className="text-xs mb-1"><strong>Satış Tipi:</strong> {sale.saleType?.name || '-'}</div>
            <div className="text-xs mb-1"><strong>Para Birimi:</strong> {sale.currency?.name || 'TRY'} ({sale.currency?.symbol || '₺'})</div>
          </div>
        </div>

        {/* SEPET LİSTESİ */}
        <div className="overflow-x-auto mb-5 border border-[var(--border)] rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-[var(--surface-container-highest)]">
              <tr>
                <th className="p-2.5">Ürün Adı</th>
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
                <tr key={item.itemId} className="border-b border-[var(--border)]">
                  <td className="p-2.5 font-semibold">{item.item?.name} <br/><span className="text-[10px] text-gray-400 font-normal">{item.item?.code}</span></td>
                  <td className="tabular-nums">{Number(item.price).toLocaleString('tr-TR')} {sale.currency?.symbol || '₺'}</td>
                  <td className="tabular-nums"><strong>{item.quantity}</strong></td>
                  <td className="tabular-nums text-[var(--error)]">
                    {Number(item.discountAmount) > 0 ? `-${Number(item.discountAmount)} ₺` : Number(item.discountPercent) > 0 ? `-${Number(item.discountPercent)}%` : '-'}
                  </td>
                  <td className="tabular-nums">{Number(item.netPrice).toLocaleString('tr-TR')} {sale.currency?.symbol || '₺'}</td>
                  <td className="tabular-nums">%{item.kdvRate} ({Number(item.kdvAmount).toLocaleString('tr-TR')} {sale.currency?.symbol || '₺'})</td>
                  <td className="tabular-nums font-extrabold">{Number(item.lineTotal).toLocaleString('tr-TR')} {sale.currency?.symbol || '₺'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* NOTLAR VE TOPLAM ÖZETİ */}
        <div className="flex gap-5 items-start">
          <div className="flex-1 bg-orange-50 p-4 rounded-xl border border-dashed border-red-100">
            <h4 className="text-xs text-[var(--text-muted)] mb-1">NOTLAR / SÖZLEŞME METNİ</h4>
            <p className="text-xs whitespace-pre-wrap leading-relaxed">{sale.notes || 'Not bulunmuyor.'}</p>
          </div>
          <div className="flex-1 bg-[var(--surface-container)] p-4 rounded-xl border border-[var(--border)]">
            <div className="flex justify-between mb-2 text-xs">
              <span>Ara Toplam (Mal/Hizmet):</span>
              <span className="tabular-nums">{Number(sale.totalAmount).toLocaleString('tr-TR')} {sale.currency?.symbol || '₺'}</span>
            </div>
            {Number(sale.discountAmount) > 0 && (
              <div className="flex justify-between mb-2 text-xs text-[var(--error)]">
                <span>Alt İndirim (Fatura Altı):</span>
                <span className="tabular-nums">-{Number(sale.discountAmount).toLocaleString('tr-TR')} {sale.currency?.symbol || '₺'}</span>
              </div>
            )}
            {Number(sale.discountPercent) > 0 && (
              <div className="flex justify-between mb-2 text-xs text-[var(--error)]">
                <span>Alt İndirim (Yüzde):</span>
                <span className="tabular-nums">-%{Number(sale.discountPercent)}</span>
              </div>
            )}
            <div className="flex justify-between mb-2 text-xs">
              <span>Toplam KDV:</span>
              <span className="tabular-nums">+{Number(sale.kdv).toLocaleString('tr-TR')} {sale.currency?.symbol || '₺'}</span>
            </div>
            {Number(sale.deposit) > 0 && (
              <div className="flex justify-between mb-2 text-xs text-[var(--error)]">
                <span>Kapora / Ön Ödeme:</span>
                <span className="tabular-nums">-{Number(sale.deposit).toLocaleString('tr-TR')} {sale.currency?.symbol || '₺'}</span>
              </div>
            )}
            <div className="h-px bg-[var(--border)] my-2.5" />
            <div className="flex justify-between text-base font-black text-[var(--primary)]">
              <span>ÖDENECEK NET TUTAR:</span>
              <span className="tabular-nums">{(Number(sale.grandTotal) - Number(sale.deposit)).toLocaleString('tr-TR')} {sale.currency?.symbol || '₺'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
