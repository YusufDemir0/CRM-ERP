
import { FiAlertTriangle, FiPackage } from 'react-icons/fi';
import { Column } from '../../../components/common/DataTable';
import { Item } from '../../../types';
import { Decimal } from 'decimal.js';

export const getItemColumns = (
  getStockAlert: (id: number, qty: number) => { isOver: boolean; totalAvailable: number }
): Column<Item>[] => [
  { 
    header: 'ÜRÜN / MALZEME', 
    accessor: (item) => (
      <div className="flex items-center gap-3">
        {item.image ? (
          <img src={item.image} alt={item.name} className="w-11 h-11 rounded-xl object-cover border border-slate-200" />
        ) : (
          <div className="w-11 h-11 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200">
            <FiPackage size={20} className="opacity-30 text-primary" />
          </div>
        )}
        <div>
          <div className="font-extrabold text-sm text-slate-800">{item.name}</div>
          <div className="text-[11px] text-slate-500 font-semibold uppercase">
            {item.code} • {item.quantityType?.abbreviation || 'ADET'}
          </div>
        </div>
      </div>
    ),
    sortKey: 'name'
  },
  { 
    header: 'KATEGORİ', 
    accessor: (item) => (
      <span className="font-bold text-[12px] text-secondary bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
        {item.itemType?.name || 'BELİRSİZ'}
      </span>
    ),
    sortKey: 'itemType.name'
  },
  { 
    header: 'SATIŞ FİYATI', 
    accessor: (item) => {
      const price = new Decimal(item.salePrice || 0);
      return (
        <div className="flex flex-col items-start">
          <span className="tabular-nums font-extrabold text-sm text-primary">
            {price.toNumber().toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {item.currency?.symbol || '₺'}
          </span>
          <span className="text-[10px] font-bold text-slate-400">KDV DAHİL</span>
        </div>
      );
    },
    sortKey: 'salePrice',
    className: 'tabular-nums'
  },
  { 
    header: 'STOK DURUMU', 
    accessor: (item) => {
      const stock = new Decimal(item.totalStock || 0);
      const limit = new Decimal(item.criticalLimit || 0);
      const isCritical = !limit.isZero() && stock.lte(limit);

      return (
        <div className="flex flex-col items-end gap-0.5">
          <div className="flex items-center gap-1.5">
            {isCritical && <FiAlertTriangle size={14} className="text-danger" />}
            <span className={`tabular-nums font-black text-base ${isCritical ? 'text-danger' : 'text-success'}`}>
              {stock.toNumber().toLocaleString('tr-TR')}
            </span>
          </div>
          {isCritical && (
            <span className="text-[9px] font-black text-danger uppercase tracking-wider">
              KRİTİK SEVİYE
            </span>
          )}
        </div>
      );
    },
    sortKey: 'totalStock',
    className: 'tabular-nums'
  }
];
