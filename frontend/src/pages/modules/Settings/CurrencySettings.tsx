
import { FiPlus, FiCheckCircle, FiStar } from 'react-icons/fi';
import { DataTable, Column } from '../../../components/common/DataTable';
import { useSort } from '../../../hooks/useSort';

import { Currency } from '../../../types';

interface CurrencySettingsProps {
  currencies: Currency[];
  newCurrency: { code: string; symbol: string; name: string };
  setNewCurrency: (curr: { code: string; symbol: string; name: string }) => void;
  onAdd: () => void;
  onSetDefault: (id: number) => void;
  onDelete: (id: number) => void;
}

export const CurrencySettings: React.FC<CurrencySettingsProps> = ({
  currencies, newCurrency, setNewCurrency, onAdd, onSetDefault, onDelete
}) => {
  const { sortedData, sortConfigs, toggleSort } = useSort(currencies, [{ key: 'code', direction: 'asc' }]);

  const columns: Column<Currency>[] = [
    { 
      header: 'Kod', 
      accessor: (c) => <div className="font-black text-primary tracking-wider">{c.code}</div>, 
      sortKey: 'code' 
    },
    { 
      header: 'Sembol', 
      accessor: (c) => <span className="font-extrabold px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg">{c.symbol}</span> 
    },
    { 
      header: 'Birim Adı', 
      accessor: (c) => <div className="font-bold text-slate-700">{c.name}</div>, 
      sortKey: 'name' 
    },
    { 
      header: 'Durum', 
      accessor: (c) => c.isDefault ? (
        <span className="text-[10px] font-black text-success flex items-center gap-1.5 bg-success/5 px-3 py-1.5 rounded-full border border-success/10">
          <FiCheckCircle /> VARSAYILAN
        </span>
      ) : (
        <button 
          className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-colors flex items-center justify-center border border-slate-100" 
          onClick={() => onSetDefault(c.id)} 
          title="Varsayılan Yap"
        >
          <FiStar />
        </button>
      )
    }
  ];

  return (
    <div className="animate-in">
      <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-8">Para Birimi Yönetimi</h3>
      
      <DataTable<Currency>
        data={sortedData}
        columns={columns}
        sortConfigs={sortConfigs}
        onSort={toggleSort}
        getRowKey={(c) => c.id}
        onDelete={(c) => !c.isDefault ? onDelete(c.id) : undefined}
      />

      <div className="mt-10 p-8 rounded-[2rem] bg-slate-50 border-2 border-dashed border-slate-200 grid grid-cols-1 md:grid-cols-[120px_100px_1fr_auto] gap-4 items-end">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">KOD</label>
          <input 
            placeholder="USD" 
            className="h-12 px-4 rounded-xl border border-slate-200 bg-white font-bold uppercase transition-colors focus:ring-2 focus:ring-primary/20 outline-none" 
            value={newCurrency.code} 
            onChange={e => setNewCurrency({...newCurrency, code: e.target.value.toUpperCase()})} 
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">SEMBOL</label>
          <input 
            placeholder="$" 
            className="h-12 px-4 rounded-xl border border-slate-200 bg-white font-bold transition-colors focus:ring-2 focus:ring-primary/20 outline-none" 
            value={newCurrency.symbol} 
            onChange={e => setNewCurrency({...newCurrency, symbol: e.target.value})} 
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">BİRİM ADI</label>
          <input 
            placeholder="DOLAR" 
            className="h-12 px-4 rounded-xl border border-slate-200 bg-white font-bold uppercase transition-colors focus:ring-2 focus:ring-primary/20 outline-none" 
            value={newCurrency.name} 
            onChange={e => setNewCurrency({...newCurrency, name: e.target.value.toLocaleUpperCase('tr-TR')})} 
          />
        </div>
        <button 
          className="h-12 w-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/25 hover:scale-105 active:scale-95 transition-colors" 
          onClick={onAdd}
        >
          <FiPlus size={24} />
        </button>
      </div>
    </div>
  );
};
