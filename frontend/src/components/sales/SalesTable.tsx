
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
  onApprove: (id: string | number) => void;
  onShip: (id: string | number) => void;
  onCancel: (id: string | number) => void;
}

import { FiClock, FiCheckCircle, FiTruck, FiXCircle, FiCheck } from 'react-icons/fi';

// P0-7: Use native Intl.NumberFormat instead of Decimal.js for display-only formatting
const trNumberFormatter = new Intl.NumberFormat('tr-TR', { 
  minimumFractionDigits: 2, 
  maximumFractionDigits: 2 
});

const formatCurrency = (val: string | number | undefined | null, symbol: string = '₺') => {
  if (val === undefined || val === null) return '0.00 ' + symbol;
  const num = new Decimal(val).toNumber();
  return trNumberFormatter.format(num) + ' ' + symbol;
};

export const SalesTable: React.FC<SalesTableProps> = ({
  sales,
  isLoading,
  paginationMeta,
  onPageChange,
  onLimitChange,
  sortConfigs,
  onSort,
  onView,
  onApprove,
  onShip,
  onCancel
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
        const total = new Decimal(s.grandTotal || 0);
        const profit = new Decimal(s.profit || 0);
        const isProfitPositive = profit.gt(0);
        return (
          <div className="flex flex-col items-end">
            <span className="tabular-nums font-black text-on-surface tracking-tighter">{formatCurrency(s.grandTotal, s.currency?.symbol)}</span>
            <span className={`text-[9px] font-black uppercase tracking-widest ${isProfitPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
              KAR: {formatCurrency(s.profit || 0, s.currency?.symbol)}
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
          draft: { label: 'BEKLİYOR', icon: <FiClock />, cls: 'bg-warning/10 text-warning border-warning/20' },
          approved: { label: 'ONAYLI', icon: <FiCheckCircle />, cls: 'bg-info/10 text-info border-info/20' },
          shipped: { label: 'TESLİM EDİLDİ', icon: <FiTruck />, cls: 'bg-success/10 text-success border-success/20' },
          cancelled: { label: 'İPTAL', icon: <FiXCircle />, cls: 'bg-danger/10 text-danger border-danger/20' },
        };
        const st = config[s.status] || config.draft;
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
      onEdit={(s) => onView(s.id)}
      onRestore={s => {
        if (s.status === 'draft') return onApprove(s.id);
        if (s.status === 'approved') return onShip(s.id);
        return undefined;
      }}
      onArchive={s => s.status === 'draft' || s.status === 'approved' ? onCancel(s.id) : undefined}
      customIcons={{
        restore: (s: Sale) => s.status === 'approved' ? <FiTruck /> : <FiCheck />,
        archive: () => <FiXCircle />
      }}

      // Integrated Pagination
      total={paginationMeta?.total || 0}
      page={paginationMeta?.page || 1}
      limit={paginationMeta?.limit || 20}
      onPageChange={onPageChange}
    />
  );
};
