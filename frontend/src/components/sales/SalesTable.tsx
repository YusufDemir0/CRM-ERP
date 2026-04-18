
import { Sale } from '../../types';
import { DataTable, Column } from '../common/DataTable';
import { useMemo } from 'react';

import { PaginationMeta } from '../../types';

interface SalesTableProps {
  sales: Sale[];
  isLoading: boolean;
  paginationMeta: PaginationMeta | undefined;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  sortConfigs: { key: string; direction: 'asc' | 'desc' }[];
  onSort: (key: string, multi: boolean) => void;
  onView: (id: number) => void;
  onApprove: (id: number) => void;
  onShip: (id: number) => void;
  onCancel: (id: number) => void;
}

import { FiClock, FiCheckCircle, FiTruck, FiXCircle, FiCheck } from 'react-icons/fi';

// P0-7: Use native Intl.NumberFormat instead of Decimal.js for display-only formatting
const trNumberFormatter = new Intl.NumberFormat('tr-TR', { 
  minimumFractionDigits: 2, 
  maximumFractionDigits: 2 
});

const formatCurrency = (val: string | number, symbol: string = '₺') => {
  const num = typeof val === 'string' ? parseFloat(val) || 0 : val || 0;
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
      header: 'SİPARİŞ NO', 
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
      header: 'TARİH', 
      accessor: (s) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-700">{new Date(s.createdAt).toLocaleDateString('tr-TR')}</span>
          <span className="text-[10px] text-slate-400 font-black tracking-tighter uppercase">{new Date(s.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      ),
      sortKey: 'createdAt'
    },
    { 
      header: 'MÜŞTERİ (CARİ)', 
      accessor: (s) => <div className="font-black text-slate-800 tracking-tight group-hover:text-primary transition-colors">{s.party?.name}</div>,
      sortKey: 'party.name'
    },
    { 
      header: 'TUTAR', 
      accessor: (s: Sale) => (
        <div className="flex flex-col items-end">
          <span className="tabular-nums font-black text-on-surface tracking-tighter">{formatCurrency(s.grandTotal, s.currency?.symbol)}</span>
          {(parseFloat(String(s.deposit)) || 0) > 0 && (
            <span className="text-[9px] text-success font-black uppercase tracking-widest">KAPORA: {formatCurrency(s.deposit, s.currency?.symbol)}</span>
          )}
        </div>
      ),
      sortKey: 'grandTotal',
      className: 'text-right'
    },
    { 
      header: 'DURUM', 
      accessor: (s) => {
        const config: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
          draft: { label: 'TASLAK', icon: <FiClock />, cls: 'bg-warning/10 text-warning border-warning/20' },
          approved: { label: 'ONAYLI', icon: <FiCheckCircle />, cls: 'bg-info/10 text-info border-info/20' },
          shipped: { label: 'SEVK EDİLDİ', icon: <FiTruck />, cls: 'bg-success/10 text-success border-success/20' },
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
