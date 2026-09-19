/**
 * reportPrintUtils.ts — Sade, kurumsal ve A4 formatında PDF yazdırma yardımcıları
 */

export interface SalesReportSummary {
  totalRevenue: number;
  completedRevenue: number;
  pendingRevenue: number;
  cancelledRevenue: number;
  totalCount: number;
  completedCount: number;
  pendingCount: number;
  cancelledCount: number;
}

export interface SaleReportItem {
  id: string;
  code: string;
  date: string;
  partyName: string;
  departmentName: string;
  status: string;
  grandTotal: number;
  tlTotal: number;
  currencySymbol: string;
  paymentType: string;
}

export interface SalesReportData {
  period: {
    type: 'monthly' | 'yearly';
    year: number;
    month: number | null;
    label: string;
    startDate: string;
    endDate: string;
  };
  departmentName: string;
  summary: SalesReportSummary;
  sales: SaleReportItem[];
}

export interface StockItemDto {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  reservedQuantity: number;
  criticalLimit: number;
}

export interface DepartmentStockSummary {
  departmentId: string;
  departmentName: string;
  counts: {
    totalItems: number;
    inStockCount: number;
    criticalCount: number;
    outOfStockCount: number;
  };
  inStock: StockItemDto[];
  criticalStock: StockItemDto[];
  outOfStock: StockItemDto[];
}

export interface StockReportData {
  reportDate: string;
  departmentCount: number;
  scope: string;
  departments: DepartmentStockSummary[];
}

const formatTL = (amount: number): string => {
  return (amount || 0).toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' ₺';
};

const formatQty = (qty: number): string => {
  return (qty || 0).toLocaleString('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

/**
 * Aylık ve Yıllık Satış Raporu PDF Yazdırma Motoru
 */
export const printSalesReport = (data: SalesReportData) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Açılır pencere (pop-up) tarayıcınız tarafından engellendi. Lütfen izin verin.');
    return;
  }

  const { period, departmentName, summary, sales } = data;

  const statusLabel = (status: string) => {
    switch (status) {
      case 'approved': return { text: 'Onaylandı', color: '#047857', bg: '#ecfdf5' };
      case 'shipped': return { text: 'Sevk Edildi', color: '#047857', bg: '#ecfdf5' };
      case 'completed': return { text: 'Tamamlandı', color: '#047857', bg: '#ecfdf5' };
      case 'invoiced': return { text: 'Faturalandı', color: '#0369a1', bg: '#f0f9ff' };
      case 'cancelled': return { text: 'İptal Edildi', color: '#b91c1c', bg: '#fef2f2' };
      case 'draft':
      default: return { text: 'Beklemede (Taslak)', color: '#b45309', bg: '#fffbeb' };
    }
  };

  const rowsHtml = sales.map((s, idx) => {
    const st = statusLabel(s.status);
    return `
      <tr>
        <td style="text-align: center; color: #64748b; font-size: 11px;">${idx + 1}</td>
        <td style="font-weight: 700; color: #0f172a; font-family: monospace;">${s.code}</td>
        <td>${s.date}</td>
        <td style="font-weight: 600; color: #1e293b;">${s.partyName}</td>
        <td style="color: #475569;">${s.departmentName}</td>
        <td><span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; background: ${st.bg}; color: ${st.color};">${st.text}</span></td>
        <td style="text-align: center; color: #64748b; font-size: 11px;">${s.paymentType}</td>
        <td style="text-align: right; font-weight: 800; color: #0f172a;">${formatTL(s.tlTotal)}</td>
      </tr>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <title>Satış Raporu - ${period.label}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 10mm 12mm 10mm 12mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #0f172a;
          background: #fff;
          font-size: 12px;
          line-height: 1.4;
          padding: 15px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #0f172a;
          padding-bottom: 12px;
          margin-bottom: 16px;
        }
        .brand {
          font-size: 20px;
          font-weight: 900;
          letter-spacing: -0.5px;
          color: #0f172a;
        }
        .brand-sub {
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .meta-box {
          text-align: right;
          font-size: 11px;
          color: #475569;
        }
        .meta-box strong {
          color: #0f172a;
        }
        .report-title-badge {
          display: inline-block;
          background: #0f172a;
          color: #fff;
          font-size: 12px;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 6px;
          margin-top: 4px;
        }
        /* KPI Cards Grid */
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 18px;
        }
        .kpi-card {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px 12px;
          background: #f8fafc;
        }
        .kpi-card.total {
          border-left: 4px solid #0f172a;
        }
        .kpi-card.completed {
          border-left: 4px solid #059669;
          background: #f0fdf4;
        }
        .kpi-card.pending {
          border-left: 4px solid #d97706;
          background: #fffbeb;
        }
        .kpi-card.cancelled {
          border-left: 4px solid #dc2626;
          background: #fef2f2;
        }
        .kpi-title {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #64748b;
          margin-bottom: 4px;
        }
        .kpi-val {
          font-size: 16px;
          font-weight: 900;
          color: #0f172a;
        }
        .kpi-sub {
          font-size: 10px;
          color: #64748b;
          margin-top: 2px;
          font-weight: 600;
        }
        /* Table */
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8px;
          font-size: 11px;
        }
        th {
          background: #f1f5f9;
          color: #334155;
          text-align: left;
          padding: 8px 6px;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #cbd5e1;
        }
        td {
          padding: 7px 6px;
          border-bottom: 1px solid #e2e8f0;
        }
        tr:nth-child(even) {
          background-color: #f8fafc;
        }
        .section-title {
          font-size: 12px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .footer {
          margin-top: 20px;
          padding-top: 8px;
          border-top: 1px solid #cbd5e1;
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: #94a3b8;
        }
        @media print {
          body {
            padding: 0;
          }
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="brand">ERMAY CRM ERP</div>
          <div class="brand-sub">Kurumsal Satış Performans Raporu</div>
        </div>
        <div class="meta-box">
          <div>Dönem: <strong>${period.label}</strong></div>
          <div>Kapsam: <strong>${departmentName}</strong></div>
          <div>Tarih Aralığı: <strong>${period.startDate} / ${period.endDate}</strong></div>
          <div class="report-title-badge">${period.type === 'monthly' ? 'AYLIK RAPOR' : 'YILLIK RAPOR'}</div>
        </div>
      </div>

      <!-- 4 KPI CARDS -->
      <div class="kpi-grid">
        <div class="kpi-card total">
          <div class="kpi-title">Toplam Ciro</div>
          <div class="kpi-val">${formatTL(summary.totalRevenue)}</div>
          <div class="kpi-sub">${summary.totalCount} Adet Toplam Sipariş</div>
        </div>
        <div class="kpi-card completed">
          <div class="kpi-title" style="color: #059669;">Tamamlanan Ciro</div>
          <div class="kpi-val" style="color: #059669;">${formatTL(summary.completedRevenue)}</div>
          <div class="kpi-sub">${summary.completedCount} Adet Sevk / Onaylı</div>
        </div>
        <div class="kpi-card pending">
          <div class="kpi-title" style="color: #d97706;">Beklemede Olan Ciro</div>
          <div class="kpi-val" style="color: #d97706;">${formatTL(summary.pendingRevenue)}</div>
          <div class="kpi-sub">${summary.pendingCount} Adet Taslak Sipariş</div>
        </div>
        <div class="kpi-card cancelled">
          <div class="kpi-title" style="color: #dc2626;">İptal Edilen Ciro</div>
          <div class="kpi-val" style="color: #dc2626;">${formatTL(summary.cancelledRevenue)}</div>
          <div class="kpi-sub">${summary.cancelledCount} Adet İptal Sipariş</div>
        </div>
      </div>

      <!-- SATIŞ DETAYLARI TABLOSU -->
      <div class="section-title">Satış Sipariş Dökümü (${sales.length} Kayıt)</div>
      <table>
        <thead>
          <tr>
            <th style="width: 30px; text-align: center;">#</th>
            <th style="width: 80px;">Satış No</th>
            <th style="width: 75px;">Tarih</th>
            <th>Müşteri / Cari</th>
            <th>Departman</th>
            <th style="width: 100px;">Durum</th>
            <th style="width: 75px; text-align: center;">Ödeme</th>
            <th style="width: 100px; text-align: right;">Tutar (TL)</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml.length > 0 ? rowsHtml : '<tr><td colspan="8" style="text-align: center; padding: 20px; color: #94a3b8;">Bu dönemde kayıtlı satış bulunmamaktadır.</td></tr>'}
        </tbody>
      </table>

      <div class="footer">
        <div>Ermay ERP Raporlama Servisi • Belge ID: R-${Date.now()}</div>
        <div>Rapor Üretilme Tarihi: ${new Date().toLocaleString('tr-TR')}</div>
      </div>

      <script>
        window.print();
        setTimeout(function() { window.close(); }, 300);
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};

/**
 * Departman Bazlı Stok Envanter PDF Yazdırma Motoru
 */
export const printStockReport = (data: StockReportData, categoryFilter: 'all' | 'inStock' | 'critical' | 'outOfStock' = 'all') => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Açılır pencere (pop-up) tarayıcınız tarafından engellendi. Lütfen izin verin.');
    return;
  }

  const { reportDate, scope, departments } = data;

  const departmentSectionsHtml = departments.map((dept) => {
    const showInStock = categoryFilter === 'all' || categoryFilter === 'inStock';
    const showCritical = categoryFilter === 'all' || categoryFilter === 'critical';
    const showOutOfStock = categoryFilter === 'all' || categoryFilter === 'outOfStock';

    const renderTableRows = (items: StockItemDto[], type: 'inStock' | 'critical' | 'outOfStock') => {
      if (items.length === 0) {
        return `<tr><td colspan="6" style="text-align: center; padding: 10px; color: #94a3b8; font-style: italic;">Bu kategoride ürün bulunmamaktadır.</td></tr>`;
      }
      return items.map((i, idx) => {
        let qtyColor = '#0f172a';
        let qtyBg = 'transparent';
        if (type === 'outOfStock') {
          qtyColor = '#dc2626';
          qtyBg = '#fef2f2';
        } else if (type === 'critical') {
          qtyColor = '#d97706';
          qtyBg = '#fffbeb';
        }

        return `
          <tr>
            <td style="text-align: center; color: #64748b; font-size: 10px;">${idx + 1}</td>
            <td style="font-weight: 700; color: #0f172a; font-family: monospace;">${i.code}</td>
            <td style="font-weight: 600; color: #1e293b;">${i.name}</td>
            <td style="color: #64748b;">${i.category}</td>
            <td style="text-align: right; font-weight: 800; color: ${qtyColor}; background: ${qtyBg};">
              ${formatQty(i.quantity)} ${i.unit}
            </td>
            <td style="text-align: right; color: #64748b; font-weight: 600;">
              ${i.criticalLimit > 0 ? formatQty(i.criticalLimit) + ' ' + i.unit : '—'}
            </td>
          </tr>
        `;
      }).join('');
    };

    return `
      <div class="dept-card">
        <div class="dept-header">
          <div class="dept-name">🏢 ${dept.departmentName}</div>
          <div class="dept-badges">
            <span class="badge in-stock">Mevcut: ${dept.counts.inStockCount}</span>
            <span class="badge critical">Kritik: ${dept.counts.criticalCount}</span>
            <span class="badge out-of-stock">Tükenen: ${dept.counts.outOfStockCount}</span>
            <span class="badge total">Toplam: ${dept.counts.totalItems}</span>
          </div>
        </div>

        ${showInStock ? `
          <div class="sub-section-title in-stock-title">🟢 Stoğu Olan Ürünler (${dept.inStock.length} Kalem)</div>
          <table>
            <thead>
              <tr>
                <th style="width: 25px; text-align: center;">#</th>
                <th style="width: 110px;">Ürün Kodu</th>
                <th>Ürün Adı</th>
                <th style="width: 110px;">Kategori</th>
                <th style="width: 90px; text-align: right;">Stok Miktarı</th>
                <th style="width: 80px; text-align: right;">Kritik Eşik</th>
              </tr>
            </thead>
            <tbody>
              ${renderTableRows(dept.inStock, 'inStock')}
            </tbody>
          </table>
        ` : ''}

        ${showCritical ? `
          <div class="sub-section-title critical-title" style="margin-top: 14px;">🟡 Kritik Seviyedeki Ürünler (${dept.criticalStock.length} Kalem)</div>
          <table>
            <thead>
              <tr>
                <th style="width: 25px; text-align: center;">#</th>
                <th style="width: 110px;">Ürün Kodu</th>
                <th>Ürün Adı</th>
                <th style="width: 110px;">Kategori</th>
                <th style="width: 90px; text-align: right;">Stok Miktarı</th>
                <th style="width: 80px; text-align: right;">Kritik Eşik</th>
              </tr>
            </thead>
            <tbody>
              ${renderTableRows(dept.criticalStock, 'critical')}
            </tbody>
          </table>
        ` : ''}

        ${showOutOfStock ? `
          <div class="sub-section-title out-of-stock-title" style="margin-top: 14px;">🔴 Stoğu Olmayan / Tükenen Ürünler (${dept.outOfStock.length} Kalem)</div>
          <table>
            <thead>
              <tr>
                <th style="width: 25px; text-align: center;">#</th>
                <th style="width: 110px;">Ürün Kodu</th>
                <th>Ürün Adı</th>
                <th style="width: 110px;">Kategori</th>
                <th style="width: 90px; text-align: right;">Stok Miktarı</th>
                <th style="width: 80px; text-align: right;">Kritik Eşik</th>
              </tr>
            </thead>
            <tbody>
              ${renderTableRows(dept.outOfStock, 'outOfStock')}
            </tbody>
          </table>
        ` : ''}
      </div>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <title>Stok Envanter Raporu - ${scope}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 10mm 12mm 10mm 12mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #0f172a;
          background: #fff;
          font-size: 11px;
          line-height: 1.4;
          padding: 15px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #0f172a;
          padding-bottom: 10px;
          margin-bottom: 14px;
        }
        .brand {
          font-size: 18px;
          font-weight: 900;
          letter-spacing: -0.5px;
          color: #0f172a;
        }
        .brand-sub {
          font-size: 10px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .meta-box {
          text-align: right;
          font-size: 11px;
          color: #475569;
        }
        .meta-box strong {
          color: #0f172a;
        }
        .dept-card {
          margin-bottom: 22px;
          page-break-inside: avoid;
        }
        .dept-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #0f172a;
          color: #fff;
          padding: 6px 12px;
          border-radius: 6px;
          margin-bottom: 8px;
        }
        .dept-name {
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.5px;
        }
        .dept-badges {
          display: flex;
          gap: 6px;
        }
        .badge {
          display: inline-block;
          font-size: 9px;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .badge.in-stock { background: #059669; color: #fff; }
        .badge.critical { background: #d97706; color: #fff; }
        .badge.out-of-stock { background: #dc2626; color: #fff; }
        .badge.total { background: #334155; color: #fff; }

        .sub-section-title {
          font-size: 11px;
          font-weight: 800;
          padding: 4px 6px;
          border-radius: 4px;
          margin-bottom: 4px;
          letter-spacing: 0.3px;
        }
        .in-stock-title { background: #ecfdf5; color: #065f46; border-left: 3px solid #059669; }
        .critical-title { background: #fffbeb; color: #92400e; border-left: 3px solid #d97706; }
        .out-of-stock-title { background: #fef2f2; color: #991b1b; border-left: 3px solid #dc2626; }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 8px;
          font-size: 10px;
        }
        th {
          background: #f8fafc;
          color: #475569;
          text-align: left;
          padding: 5px 6px;
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          border-bottom: 1px solid #cbd5e1;
        }
        td {
          padding: 5px 6px;
          border-bottom: 1px solid #f1f5f9;
        }
        tr:nth-child(even) {
          background-color: #fbfcfe;
        }
        .footer {
          margin-top: 15px;
          padding-top: 6px;
          border-top: 1px solid #cbd5e1;
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          color: #94a3b8;
        }
        @media print {
          body {
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="brand">ERMAY CRM ERP</div>
          <div class="brand-sub">Departman Bazlı Stok Envanter Raporu</div>
        </div>
        <div class="meta-box">
          <div>Kapsam: <strong>${scope}</strong></div>
          <div>Toplam Departman: <strong>${departments.length}</strong></div>
          <div>Rapor Tarihi: <strong>${reportDate}</strong></div>
        </div>
      </div>

      ${departmentSectionsHtml}

      <div class="footer">
        <div>Ermay ERP Envanter Servisi • Belge ID: STK-${Date.now()}</div>
        <div>Yazdırma Zamanı: ${new Date().toLocaleString('tr-TR')}</div>
      </div>

      <script>
        window.print();
        setTimeout(function() { window.close(); }, 300);
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
