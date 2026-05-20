
import { FiBriefcase, FiShoppingCart } from 'react-icons/fi';
import { Column } from '../../../components/common/DataTable';
import { Party } from '../../../types';
import { Decimal } from 'decimal.js';

export const getPartiesColumns = (onQuickSale?: (partyId: string | number) => void): Column<Party>[] => [
  { 
    header: 'CARİ ADI', 
    accessor: (p) => (
      <div className="flex items-center gap-4 group/item">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-colors shadow-sm ${
          p.type === 'customer' ? 'bg-primary/10 text-primary border border-primary/20 bg-gradient-to-br from-primary/10 to-transparent' : 
          'bg-amber-100 text-amber-700 border border-amber-200'
        }`}>
          <FiBriefcase />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <div className="font-black text-slate-800 text-[15px] tracking-tight group-hover/item:text-primary transition-colors">{p.name}</div>
            {onQuickSale && p.state === 1 && (
              <button 
                onClick={(e) => { e.stopPropagation(); onQuickSale(p.id); }}
                className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-all border border-emerald-100 shadow-sm"
                title="Hızlı Satış Başlat"
              >
                <FiShoppingCart size={14} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
             <span className="text-[9px] text-slate-400 font-black tracking-widest uppercase opacity-70">
               {p.type === 'customer' ? 'MÜŞTERİ' : 'TEDARİKÇİ'}
             </span>
             {p.state === 0 && <span className="bg-danger/10 text-danger text-[8px] px-1.5 py-0.5 rounded font-black uppercase">PASİF</span>}
          </div>
        </div>
      </div>
    ),
    sortKey: 'name'
  },
  { 
    header: 'İLETİŞİM', 
    accessor: (p) => (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
           <span className="w-1 h-1 rounded-full bg-slate-300" />
           <strong className="text-sm text-slate-700 tracking-tight font-black tabular-nums">{p.phone1 || '—'}</strong>
        </div>
        {p.phone2 && (
          <div className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <strong className="text-[11px] text-slate-500 tracking-tight font-black tabular-nums">{p.phone2}</strong>
          </div>
        )}
        <span className="text-slate-400 text-[11px] font-bold pl-3 truncate max-w-[150px]">{p.email || '—'}</span>
      </div>
    ),
    sortKey: 'phone1'
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
  },
  {
    header: 'SATIŞ ÖZETİ',
    accessor: (p) => (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 font-black uppercase">Adet:</span>
          <span className="font-black text-slate-700 tabular-nums">{p.totalSalesCount || 0}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 font-black uppercase">Son:</span>
          <span className="text-[11px] font-bold text-slate-600">
            {p.lastSaleDate ? new Date(p.lastSaleDate).toLocaleDateString('tr-TR') : '—'}
          </span>
        </div>
      </div>
    ),
    sortKey: 'last_sale_date'
  }
];
