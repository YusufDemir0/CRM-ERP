
import { Sale } from '../../types';
import { Decimal } from 'decimal.js';
import { DataTable, Column } from '../common/DataTable';
import { useMemo } from 'react';
import { formatDisplayDate } from '../../utils/date.helper';

import { PaginationMeta } from '../../types';

interface SalesTableProps {
  sales: Sale[];
  isLoading: boolean;
  paginationMeta: PaginationMeta | undefined;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  sortConfigs: { key: string; direction: 'asc' | 'desc' }[];
  onSort: (key: string, multi: boolean) => void;
  onView: (id: string | number) => void;
  onEdit?: (id: string | number) => void;
  onApprove?: (id: string | number) => void;
  onShip?: (id: string | number) => void;
  onCancel?: (id: string | number) => void;
  onRevertToDraft?: (id: string | number) => void;
  onReportError?: (sale: Sale) => void;
  isReadOnly?: boolean;
  hideApprove?: boolean;
  isEditable?: (sale: Sale) => boolean;
  extraSearchFilters?: React.ReactNode;
}

import { FiClock, FiCheckCircle, FiTruck, FiXCircle, FiCheck, FiEye, FiEdit2, FiRotateCcw, FiAlertOctagon } from 'react-icons/fi';

import { formatCurrency } from '../../utils/formatters';

export const SalesTable: React.FC<SalesTableProps> = ({
  sales,
  isLoading,
  paginationMeta,
  onPageChange,
  onLimitChange,
  sortConfigs,
  onSort,
  onView,
  onEdit,
  onApprove,
  onShip,
  onCancel,
  onRevertToDraft,
  onReportError,
  isReadOnly = false,
  hideApprove = false,
  isEditable,
  extraSearchFilters
}) => {
  const columns = useMemo<Column<Sale>[]>(() => [
    { 
      header: 'SATIŞ NO', 
      accessor: (s) => (
        <div className="flex items-center gap-2">
           <span className="bg-primary/5 text-primary px-2.5 py-1 rounded-lg font-black text-[10px] tracking-widest border border-primary/10 uppercase">
             {s.code}
           </span>
        </div>
      ),
      sortKey: 'code'
    },
    { 
      header: 'MÜŞTERİ BİLGİSİ', 
      accessor: (s) => (
        <div className="flex flex-col">
          <div className="font-black text-slate-800 tracking-tight group-hover:text-primary transition-colors">{s.party?.name}</div>
          <div className="text-[10px] text-slate-400 font-bold tabular-nums">{s.phone || s.party?.phone1 || '—'}</div>
        </div>
      ),
      sortKey: 'party.name'
    },
    { 
      header: 'TUTAR & KAR', 
      accessor: (s: Sale) => {
        const toSafeDecimal = (val: unknown): Decimal => {
          if (val === null || val === undefined) return new Decimal(0);
          if (typeof val === 'object' && !Decimal.isDecimal(val)) {
            const vObj = val as { value?: string | number };
            return new Decimal(val.toString() === '[object Object]' ? (vObj.value || 0) : val.toString());
          }
          return new Decimal(val as Decimal.Value);
        };
        const total = toSafeDecimal(s.grandTotal);
        const profit = toSafeDecimal(s.profit);
        const kdvAmount = toSafeDecimal(s.kdv);
        const revenue = total.minus(kdvAmount);
        const cost = toSafeDecimal(s.totalCost).gt(0) ? toSafeDecimal(s.totalCost) : revenue.minus(profit);
        let profitPercent = new Decimal(0);
        if (cost.gt(0)) {
          profitPercent = profit.div(cost).mul(100);
        }
        const isProfitPositive = profit.gt(0);
        const isTPT = s.saleType?.abbreviation === 'TPT';

        // Format grandTotal without cents (kuruş)
        const totalNoCents = Math.round(total.toNumber()).toLocaleString('tr-TR');
        const formattedTotal = `${totalNoCents} ${s.currency?.symbol || '₺'}`;

        return (
          <div className="flex flex-col items-end">
            <span className="tabular-nums font-black text-on-surface tracking-tighter">{formattedTotal}</span>
            {isTPT && kdvAmount.gt(0) && (
              <span className="text-[9px] font-bold text-slate-400 mt-0.5">
                KDV: {formatCurrency(kdvAmount, s.currency?.symbol)}
              </span>
            )}
            <span className={`text-[9px] font-black uppercase tracking-widest ${isProfitPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
              KAR: %{Math.round(profitPercent.toNumber())}
            </span>
          </div>
        );
      },
      sortKey: 'grandTotal',
      className: 'text-right'
    },
    { 
      header: 'DURUM', 
      accessor: (s) => {
        const config: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
          draft: { label: 'TASLAK', icon: <FiClock />, cls: 'bg-slate-100 text-slate-600 border border-slate-200' },
          approved: { label: 'ONAYLANDI', icon: <FiCheckCircle />, cls: 'bg-blue-50 text-blue-600 border border-blue-100' },
          shipped: { label: 'SEVK EDİLDİ', icon: <FiTruck />, cls: 'bg-amber-50 text-amber-600 border border-amber-100' },
          invoiced: { label: 'TAMAMLANDI', icon: <FiCheckCircle />, cls: 'bg-emerald-50 text-emerald-600 border border-emerald-100' },
          cancelled: { label: 'İPTAL EDİLDİ', icon: <FiXCircle />, cls: 'bg-rose-50 text-rose-600 border border-rose-100' },
        };
        const st = config[s.status] || { label: s.status.toUpperCase(), icon: <FiClock />, cls: 'bg-slate-50 text-slate-400 border border-slate-250' };
        return (
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black tracking-widest ${st.cls}`}>
            {st.icon} {st.label}
          </div>
        );
      },
      sortKey: 'status'
    },
    { 
      header: 'TARİHLER', 
      accessor: (s) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-black text-slate-300 uppercase">Satış:</span>
            <span className="font-bold text-slate-700 text-xs">{formatDisplayDate(s.createdAt)}</span>
          </div>
          {s.deliveryDate && (
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-black text-emerald-400 uppercase">Teslim:</span>
              <span className="font-bold text-emerald-600 text-xs">{formatDisplayDate(s.deliveryDate)}</span>
            </div>
          )}
        </div>
      ),
      sortKey: 'createdAt'
    }
  ], []);

  return (
    <DataTable<Sale>
      data={sales}
      columns={columns}
      isLoading={isLoading}
      sortConfigs={sortConfigs}
      onSort={onSort}
      getRowKey={(s) => s.id}
      extraSearchFilters={extraSearchFilters}
      renderExtraActions={(s) => (
        <div className="flex items-center gap-1.5">
          {/* Göz (Detail/View) - Blue */}
          <button
            onClick={() => onView(s.id)}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all bg-blue-50 hover:bg-blue-100 hover:scale-105 active:scale-95 text-blue-600 border border-blue-200 shadow-sm"
            title="Detay Görüntüle"
          >
            <FiEye size={15} />
          </button>

          {/* Kalem (Edit) - Yellow - Only if draft & not read-only */}
          {!isReadOnly && s.status === 'draft' && onEdit && (!isEditable || isEditable(s)) && (
            <button
              onClick={() => onEdit(s.id)}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all bg-amber-50 hover:bg-amber-100 hover:scale-105 active:scale-95 text-amber-600 border border-amber-200 shadow-sm"
              title="Düzenle"
            >
              <FiEdit2 size={14} />
            </button>
          )}

          {/* Tik (Approve / Confirm / Ship) - Green */}
          {!isReadOnly && s.status === 'draft' && onApprove && !hideApprove && (
            <button
              onClick={() => onApprove(s.id)}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all bg-emerald-50 hover:bg-emerald-100 hover:scale-105 active:scale-95 text-emerald-600 border border-emerald-200 shadow-sm"
              title="Satışı Onayla"
            >
              <FiCheck size={16} />
            </button>
          )}

          {!isReadOnly && s.status === 'approved' && onShip && (
            <button
              onClick={() => onShip(s.id)}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all bg-emerald-50 hover:bg-emerald-100 hover:scale-105 active:scale-95 text-emerald-600 border border-emerald-200 shadow-sm"
              title="Sevkiyatı Onayla"
            >
              <FiTruck size={15} />
            </button>
          )}

          {!isReadOnly && s.status === 'approved' && onRevertToDraft && (
            <button
              onClick={() => onRevertToDraft(s.id)}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all bg-slate-50 hover:bg-slate-100 hover:scale-105 active:scale-95 text-slate-600 border border-slate-200 shadow-sm"
              title="Taslağa Geri Döndür"
            >
              <FiRotateCcw size={15} />
            </button>
          )}

          {/* X (Cancel) - Red */}
          {!isReadOnly && (s.status === 'draft' || s.status === 'approved') && onCancel && (
            <button
              onClick={() => onCancel(s.id)}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all bg-rose-50 hover:bg-rose-100 hover:scale-105 active:scale-95 text-rose-600 border border-rose-200 shadow-sm"
              title="İptal Et"
            >
              <FiXCircle size={15} />
            </button>
          )}

          {/* Hata Bildir - Red Warning */}
          {!isReadOnly && onReportError && (
            <button
              onClick={() => onReportError(s)}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all bg-red-50 hover:bg-red-100 hover:scale-105 active:scale-95 text-red-650 border border-red-200 shadow-sm"
              title="Hata Bildir"
            >
              <FiAlertOctagon size={15} />
            </button>
          )}
        </div>
      )}

      // Integrated Pagination
      total={paginationMeta?.total || 0}
      page={paginationMeta?.page || 1}
      limit={paginationMeta?.limit || 20}
      onPageChange={onPageChange}
      virtualized={true}
    />
  );
};
