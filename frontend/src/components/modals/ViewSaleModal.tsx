import React from 'react';
import { FiX, FiPrinter } from 'react-icons/fi';
import { Sale, SaleItem } from '../../types';
import { formatDisplayDate } from '../../utils/date.helper';
import { TURKIYE_CITIES } from '../../constants/locations';
interface ViewSaleModalProps {
  sale: Sale;
  onClose: () => void;
}

export const ViewSaleModal: React.FC<ViewSaleModalProps> = ({ sale, onClose }) => {

  const handlePrintReceipt = () => {
    // A5 Portre boyutlarına uygun pencere açılışı
    const printWindow = window.open('', '_blank', 'width=560,height=800');
    if (!printWindow) {
      alert('Lütfen pop-up engelleyicinizi devre dışı bırakın.');
      return;
    }

    // İl ID'sinden isim çözen fonksiyon (Mevcut TURKIYE_CITIES listesine bağlı)
    const getCityName = (cityVal: any): string => {
      if (!cityVal) return '';
      const idNum = Number(cityVal);
      const found = TURKIYE_CITIES.find(c => c.id === idNum);
      return found ? found.name : String(cityVal);
    };

    // Türkçe gün ismi bulucu yardımcı fonksiyon
    const getTurkishDayName = (dateStr: string | null | undefined) => {
      if (!dateStr) return '';
      const dateObj = new Date(dateStr);
      const days = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
      return days[dateObj.getDay()];
    };

    const deliveryDayName = getTurkishDayName(sale.deliveryDate);
    const deliveryDateFormatted = sale.deliveryDate ? new Date(sale.deliveryDate).toLocaleDateString('tr-TR') : 'GG.AA.YYYY';

    // Adres, İlçe ve İl (İsim olarak) bilgilerini birleştiriyoruz
    const buildFullAddress = () => {
      const addr = (sale.address || sale.party?.address || '').trim();
      const dist = (sale.district || sale.party?.districtName || '').trim();
      const cityVal = sale.city || sale.party?.cityId;
      const cityName = getCityName(cityVal).trim();

      const addressParts = [addr, dist, cityName].filter(Boolean);
      return addressParts.length > 0 ? addressParts.join(' / ').toUpperCase() : '-';
    };

    // İskonto değerini ve işaretini (+ / -) belirleyen güvenli hesaplama
    const discountVal = Number(sale.discountAmount || 0);
    const discountSign = discountVal > 0 ? '-' : (discountVal < 0 ? '+' : '');
    const discountFormatted = `${discountSign}${Math.abs(discountVal).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL`;

    // Kapora (Talep Edilen Tutar) formatı
    const depositVal = Number(sale.deposit || 0);
    const depositFormatted = depositVal > 0 
      ? `-${depositVal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL` 
      : '0,00 TL';

    // Form kaymasını önlemek için 15 satır sabit tablo yapısı
    const items = sale.items || [];
    const totalRowsNeeded = 15;
    let rowsHtml = '';

    for (let i = 0; i < totalRowsNeeded; i++) {
      if (i < items.length) {
        const item = items[i];
        rowsHtml += `
          <tr>
            <td style="text-align: center; font-weight: bold;">${Math.round(Number(item.quantity))}</td>
            <td>${(item.item?.quantityType?.name || 'ADET').toUpperCase()}</td>
            <td>${(item.item?.name || '').toUpperCase()}</td>
            <td>${(sale.department?.name || 'SATIS DEPO').toUpperCase()}</td>
          </tr>
        `;
      } else {
        rowsHtml += `
          <tr class="empty-row">
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
          </tr>
        `;
      }
    }

    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sipariş Formu - ${sale.code}</title>
        <style>
          @page {
            size: A5 portrait;
            margin: 8mm;
          }
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 11px;
            color: #000;
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            box-sizing: border-box;
            background-color: #fff;
          }
          .container {
            display: flex;
            flex-direction: column;
            height: 100%;
            justify-content: space-between;
          }
          .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            line-height: 1.4;
          }
          .header-left {
            width: 58%;
          }
          .header-right {
            width: 40%;
            text-align: left;
            padding-left: 10px;
          }
          .customer-name {
            font-size: 13px;
            font-weight: 800;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: -0.2px;
          }
          .meta-item {
            margin-bottom: 3px;
            font-size: 10.5px;
          }
          .meta-label {
            font-weight: bold;
            display: inline-block;
            width: 85px;
            color: #333;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
          }
          .items-table th {
            border-top: 1.5px solid #000;
            border-bottom: 1.5px solid #000;
            padding: 5px 4px;
            font-size: 10.5px;
            font-weight: bold;
            text-align: left;
            text-transform: uppercase;
          }
          .items-table td {
            padding: 5px 4px;
            border-bottom: 1px solid #f1f3f5;
            font-size: 10px;
            text-transform: uppercase;
          }
          .items-table .empty-row td {
            border-bottom: 1px solid #fafafa;
          }
          .delivery-banner {
            border-top: 1.5px solid #000;
            border-bottom: 1.5px solid #000;
            padding: 5px 0;
            text-align: center;
            font-size: 11px;
            font-weight: bold;
            margin-bottom: 12px;
            text-transform: uppercase;
            background-color: #fafafa;
          }
          .description-box {
            font-size: 10.5px;
            margin-bottom: 20px;
            line-height: 1.4;
          }
          .footer-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: auto;
          }
          .footer-left {
            width: 55%;
            font-weight: bold;
            font-size: 10.5px;
            line-height: 1.4;
            letter-spacing: -0.1px;
          }
          .footer-right {
            width: 40%;
          }
          .totals-table {
            width: 100%;
            border-collapse: collapse;
          }
          .totals-table td {
            padding: 2.5px 0;
            font-size: 10.5px;
          }
          .totals-table td:first-child {
            text-align: left;
            font-weight: bold;
            color: #444;
          }
          .totals-table td:last-child {
            text-align: right;
            font-weight: bold;
            white-space: nowrap;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div>
            <!-- ÜST ALAN (Cari Bilgileri & Sipariş Bilgileri) -->
            <div class="header">
              <div class="header-left">
                <div class="customer-name">${sale.party?.name?.toUpperCase() || '-'}</div>
                <div class="meta-item"><strong>Adres:</strong> ${buildFullAddress()}</div>
                <div class="meta-item"><strong>Telefon:</strong> ${sale.phone || sale.party?.phone1 || '-'}</div>
                <div class="meta-item"><strong>Telefon2:</strong> ${sale.party?.phone2 || '-'}</div>
              </div>
              <div class="header-right">
                <div class="meta-item"><span class="meta-label">Sipariş Tarihi</span>: ${sale.createdAt ? new Date(sale.createdAt).toLocaleString('tr-TR') : '-'}</div>
                <div class="meta-item"><span class="meta-label">Sipariş No</span>: ${sale.code}</div>
                <div class="meta-item"><span class="meta-label">Mağaza</span>: ${(sale.department?.name || 'İZMİT MAĞAZA').toUpperCase()}</div>
              </div>
            </div>

            <!-- TABLO ALANI -->
            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 10%; text-align: center;">Adet</th>
                  <th style="width: 15%;">Tipi</th>
                  <th style="width: 55%;">Ürün</th>
                  <th style="width: 20%;">Depo</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>

            <!-- TESLİMAT TARİHİ ALANI -->
            <div class="delivery-banner">
              Teslimat Tarihi : ${deliveryDateFormatted} / ${deliveryDayName ? deliveryDayName : 'GÜN'}
            </div>

            <!-- AÇIKLAMA ALANI -->
            <div class="description-box">
              <strong>Açıklama :</strong> ${(sale.notes || '').toUpperCase()}
            </div>
          </div>

          <!-- ALT BİLGİ & TOPLAMLAR -->
          <div class="footer-section">
            <div class="footer-left">
              LÜTFEN ADETLERİ VE KULPLARI KONTROL EDİNİZ.
            </div>
            <div class="footer-right">
              <table class="totals-table">
                <tr>
                  <td>Ara Tutar:</td>
                  <td>${Number(sale.totalAmount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</td>
                </tr>
                <tr>
                  <td>Uygulanan İskonto:</td>
                  <td>${discountFormatted}</td>
                </tr>
                <tr style="border-top: 1px solid #000; border-bottom: 1px solid #000;">
                  <td style="padding: 4px 0;">Satış Tutar:</td>
                  <td style="padding: 4px 0;">${Number(sale.grandTotal || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</td>
                </tr>
                <tr>
                  <td style="padding-top: 4px;">Talep Edilen Tutar:</td>
                  <td style="padding-top: 4px; color: #000;">${depositFormatted}</td>
                </tr>
              </table>
            </div>
          </div>
        </div>

        <script>
          // Gecikmeleri tamamen önlemek için doğrudan yazdırma komutu
          window.print();
          setTimeout(function() { window.close(); }, 150);
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(receiptHtml);
    printWindow.document.close();
  };

  return (
    <div className="loader-overlay items-start pt-[5%] pb-[5%] overflow-y-auto z-modal">
      <div className="login-box !max-w-[1600px] w-[95%] relative">
        <button className="btn-icon circle absolute top-4 right-4" onClick={onClose}>
          <FiX size={20}/>
        </button>

        {/* Dynamic header action buttons */}
        <div className="flex items-center gap-3 absolute top-4 right-14">
          <button 
            onClick={handlePrintReceipt}
            className="px-4 py-2 bg-emerald-600 text-white font-black text-xs rounded-xl hover:brightness-110 transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
          >
            <FiPrinter size={14} /> FİŞ YAZDIR
          </button>
        </div>

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
            
            <div className="text-xs mb-1">
              <strong>Teslimat:</strong>{' '}
              {sale.deliveryDate ? formatDisplayDate(sale.deliveryDate) : 'Belirtilmedi'}
            </div>

            <div className="text-xs mb-1">
              <strong>Satış Temsilcisi:</strong>{' '}
              {sale.staff ? `${sale.staff.firstName} ${sale.staff.lastName}`.toUpperCase() : 'BELİRTİLMEMİŞ'}
            </div>

            <div className="text-xs mb-1"><strong>Satış Tipi:</strong> {sale.saleType?.name || '-'}</div>
            <div className="text-xs mb-1"><strong>Para Birimi:</strong> {sale.currency?.name || 'TRY'} ({sale.currency?.symbol || '₺'})</div>
          </div>
        </div>

        {/* SEPET LİSTESİ */}
        <div className={`overflow-x-auto mb-5 border border-[var(--border)] rounded-xl ${(sale.items?.length || 0) > 5 ? 'max-h-[300px] overflow-y-auto' : ''}`}>
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

        {sale.status === 'cancelled' && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-5 text-left animate-in fade-in duration-300">
            <h4 className="text-xs font-black uppercase tracking-wider mb-1">SİPARİŞ İPTAL DETAYLARI</h4>
            <div className="text-xs space-y-1">
              <div><strong>İptal Sebebi:</strong> {sale.cancelReason || 'Belirtilmemiş'}</div>
              {sale.cancelledAt && (
                <div><strong>İptal Tarihi:</strong> {formatDisplayDate(sale.cancelledAt)}</div>
              )}
              {sale.cancelledBy && (
                <div><strong>İptal Eden:</strong> {sale.cancelledBy.fullName}</div>
              )}
            </div>
          </div>
        )}

        {/* NOTLAR VE TOPLAM ÖZETİ */}
        <div className="flex gap-5 items-start">
          <div className="flex-1 bg-orange-50 p-4 rounded-xl border border-dashed border-red-100 min-h-[140px] text-left">
            <h4 className="text-xs text-[var(--text-muted)] mb-1 font-black">NOTLAR / SÖZLEŞME METNİ</h4>
            <p className="text-xs whitespace-pre-wrap leading-relaxed">{sale.notes || 'Not bulunmuyor.'}</p>
          </div>
          <div className="flex-1 bg-[var(--surface-container)] p-4 rounded-xl border border-[var(--border)]">
            <div className="flex justify-between mb-2 text-xs">
              <span>Ara Toplam (Mal/Hizmet):</span>
              <span className="tabular-nums">{Number(sale.totalAmount).toLocaleString('tr-TR')} {sale.currency?.symbol || '₺'}</span>
            </div>
            {Number(sale.discountAmount) !== 0 && (
              <div className={`flex justify-between mb-2 text-xs ${Number(sale.discountAmount) > 0 ? 'text-[var(--error)]' : 'text-success'}`}>
                <span>{Number(sale.discountAmount) > 0 ? 'Alt İndirim (Fatura Altı):' : 'İlave Bedel (Artış):'}</span>
                <span className="tabular-nums">
                  {Number(sale.discountAmount) > 0 ? '-' : '+'}
                  {Math.abs(Number(sale.discountAmount)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}{' '}
                  {sale.currency?.symbol || '₺'}
                </span>
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
