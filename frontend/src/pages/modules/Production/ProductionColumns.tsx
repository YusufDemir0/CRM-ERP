import React from 'react';
import { 
  FiArrowRight, FiCheckCircle, FiClock, 
  FiSettings, FiX, FiCalendar 
} from 'react-icons/fi';
import { Column } from '../../../components/common/DataTable';
import { ProductionOrder } from '../../../types';
import { formatDisplayDate } from '../../../utils/date.helper';

export const getProductionColumns = (): Column<ProductionOrder>[] => [
  { 
    header: 'İŞ EMRİ KODU', 
    accessor: (o) => (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary text-lg">
          <FiSettings />
        </div>
        <div>
          <div className="font-extrabold text-slate-800 text-sm">{o.code}</div>
          <div className="text-[10px] text-slate-400 font-bold tracking-tight uppercase">TİP: ÜRETİM EMRİ</div>
        </div>
      </div>
    ),
    sortKey: 'code'
  },
  { 
    header: 'ÜRÜN / REÇETE', 
    accessor: (o) => (
      <div className="flex flex-col">
        <strong className="text-sm text-slate-800">{o.bom?.name}</strong>
        <span className="text-[10px] text-primary font-bold uppercase tracking-wide">{o.bom?.targetItem?.code || '-'}</span>
      </div>
    ),
    sortKey: 'bom.name'
  },
  { 
    header: 'PLANLANAN / GERÇEKLEŞEN', 
    accessor: (o) => {
      const progress = Math.min(100, Math.round(((o.producedQuantity || 0) / (o.plannedQuantity || 1)) * 100));
      return (
        <div className="w-44">
          <div className="flex justify-between mb-1.5 text-[11px] font-black uppercase tracking-tighter">
            <span className="text-slate-400">{o.plannedQuantity} Plan</span>
            <span className="text-success">{o.producedQuantity || 0} Ürt.</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-success transition-all duration-500 ease-out shadow-[0_0_10px_rgba(34,197,94,0.3)]" 
              style={{ width: `${progress}%` }} 
            />
          </div>
        </div>
      );
    },
    sortKey: 'plannedQuantity',
    className: 'tabular-nums'
  },
  { 
    header: 'TARİH AKIŞI', 
    accessor: (o) => (
      <div className="text-[11px] font-bold">
        <div className="text-slate-400 flex items-center gap-1">
          <FiClock size={10} /> {formatDisplayDate(o.startDate || null)}
        </div>
        <div className="text-primary flex items-center gap-1 mt-0.5">
          <FiArrowRight size={10} /> {formatDisplayDate(o.endDate || null)}
        </div>
      </div>
    ),
    sortKey: 'startDate'
  },
  { 
    header: 'DURUM', 
    accessor: (o) => {
      const statusColors: any = {
        completed: { bg: 'bg-success/10', text: 'text-success', icon: <FiCheckCircle /> },
        in_progress: { bg: 'bg-primary/10', text: 'text-primary', icon: <FiClock /> },
        cancelled: { bg: 'bg-danger/10', text: 'text-danger', icon: <FiX /> },
        draft: { bg: 'bg-slate-100', text: 'text-slate-500', icon: <FiSettings /> },
        planned: { bg: 'bg-secondary/10', text: 'text-secondary', icon: <FiCalendar /> }
      };
      const config = statusColors[o.status] || statusColors.draft;
      return (
        <div className={`inline-flex items-center gap-1.5 ${config.bg} ${config.text} px-2.5 py-1 rounded-lg text-[10px] font-black uppercase shadow-sm border border-black/5`}>
          {config.icon} {o.status.replace('_', ' ')}
        </div>
      );
    },
    sortKey: 'status'
  }
];
