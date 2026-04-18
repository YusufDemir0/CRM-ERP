
import { FiBriefcase } from 'react-icons/fi';
import { Column } from '../../../components/common/DataTable';
import { Party } from '../../../types';
import { Decimal } from 'decimal.js';

export const getPartiesColumns = (): Column<Party>[] => [
  { 
    header: 'CARİ ADI', 
    accessor: (p) => (
      <div className="flex items-center gap-4 group/item">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-colors shadow-sm ${
          p.type === 'customer' ? 'bg-primary/10 text-primary border border-primary/20 bg-gradient-to-br from-primary/10 to-transparent' : 
          p.type === 'provider' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
        }`}>
          <FiBriefcase />
        </div>
        <div className="flex flex-col">
          <div className="font-black text-slate-800 text-[15px] tracking-tight group-hover/item:text-primary transition-colors">{p.name}</div>
          <div className="flex items-center gap-2">
             <span className="text-[9px] text-slate-400 font-black tracking-widest uppercase opacity-70">
               {p.type === 'customer' ? 'MÜŞTERİ' : (p.type === 'provider' ? 'TEDARİKÇİ' : 'HİBRİT')}
             </span>
             {p.state === 0 && <span className="bg-danger/10 text-danger text-[8px] px-1.5 py-0.5 rounded font-black uppercase">PASİF</span>}
          </div>
        </div>
      </div>
    ),
    sortKey: 'name'
  },
  { 
    header: 'KİMLİK / VERGİ', 
    accessor: (p) => (
      <div className="flex flex-col">
        <span className="font-black text-[12px] text-slate-600 bg-slate-100/50 px-3 py-1.5 rounded-xl border border-slate-200/50 inline-flex items-center gap-2 tabular-nums">
           <span className="opacity-30 text-[9px]">ID:</span> {p.taxNumber || '—'}
        </span>
      </div>
    ),
    sortKey: 'taxNumber'
  },
  { 
    header: 'İLETİŞİM', 
    accessor: (p) => (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
           <span className="w-1 h-1 rounded-full bg-slate-300" />
           <strong className="text-sm text-slate-700 tracking-tight font-black tabular-nums">{p.phone1 || '—'}</strong>
        </div>
        <span className="text-slate-400 text-[11px] font-bold pl-3 truncate max-w-[150px]">{p.email || '—'}</span>
      </div>
    )
  },
  { 
    header: 'BAKİYE DURUMU', 
    accessor: (p) => {
      const balance = new Decimal(p.balance || 0);
      const isDebt = balance.gt(0);
      return (
        <div className="text-right flex flex-col items-end">
          <div className={`tabular-nums font-black text-[17px] tracking-tighter ${isDebt ? 'text-danger' : 'text-success'}`}>
            {isDebt ? '' : '-'}{balance.abs().toNumber().toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {p.currency?.symbol || '₺'}
          </div>
          <div className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border ${
            isDebt ? 'bg-danger/5 text-danger border-danger/10' : 'bg-success/5 text-success border-success/10'
          }`}>
            {isDebt ? 'ALACAKLI' : 'BORÇLU'}
          </div>
        </div>
      );
    },
    sortKey: 'balance',
    className: 'text-right'
  }
];
