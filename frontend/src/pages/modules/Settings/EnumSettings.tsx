
import { FiPlus, FiLock, FiStar, FiTrash2 } from 'react-icons/fi';
import { DataTable, Column } from '../../../components/common/DataTable';
import { useSort } from '../../../hooks/useSort';

export interface EnumItem {
  id: number;
  name: string;
  abbreviation: string;
  state: number;
  isExcludedFromBom?: boolean;
}

interface EnumSettingsProps {
  title: string;
  data: EnumItem[];
  newItem: { name: string; abbreviation: string };
  setNewItem: (item: { name: string; abbreviation: string }) => void;
  onAdd: () => void;
  onToggle: (id: number, state: number) => void;
  onDelete: (id: number) => void;
  onStarToggle?: (id: number, current: boolean) => void;
  showStar?: boolean;
  lockedAbbreviations?: string[];
}

export const EnumSettings: React.FC<EnumSettingsProps> = ({
  title, data, newItem, setNewItem, onAdd, onToggle, onDelete, onStarToggle, showStar, lockedAbbreviations = []
}) => {
  const { sortedData, sortConfigs, toggleSort } = useSort(data, [{ key: 'name', direction: 'asc' }]);

  const columns: Column<EnumItem>[] = [
    { 
      header: 'İsim / Tanım', 
      accessor: (t) => (
        <div className="flex items-center gap-2 font-extrabold text-slate-800">
          {t.name}
          {lockedAbbreviations.includes(t.abbreviation?.toUpperCase()) && (
            <FiLock className="text-slate-400" size={14} title="Sistem Tarafından Kilitlendi" />
          )}
        </div>
      ), 
      sortKey: 'name' 
    },
    { 
      header: 'Kısaltma', 
      accessor: (t) => <span className="font-black text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/10 tracking-tight">{t.abbreviation}</span>, 
      sortKey: 'abbreviation' 
    },
    ...(showStar ? [{
      header: 'Reçete Hariç',
      accessor: (t: EnumItem) => (
        <button 
          onClick={() => onStarToggle?.(t.id, !!t.isExcludedFromBom)}
          className={`p-2 rounded-xl transition-all ${t.isExcludedFromBom ? 'bg-amber-100 text-amber-600' : 'bg-slate-50 text-slate-300 hover:text-amber-400'}`}
          title="Reçete (BOM) seçim listesinden gizle/göster"
        >
          <FiStar fill={t.isExcludedFromBom ? 'currentColor' : 'none'} size={18} />
        </button>
      )
    }] : [])
  ];

  return (
    <div className="animate-in">
      <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-8">{title}</h3>
      
      <DataTable<EnumItem>
        data={sortedData}
        columns={columns}
        sortConfigs={sortConfigs}
        onSort={toggleSort}
        getRowKey={(t) => t.id}
        onArchive={(t) => onToggle(t.id, t.state)}
        onDelete={(t) => {
          if (!lockedAbbreviations.includes(t.abbreviation?.toUpperCase())) {
            onDelete(t.id);
          }
        }}
      />

      <div className="mt-10 p-8 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 grid grid-cols-1 md:grid-cols-[1fr_120px_auto] gap-4 items-end">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">TANIM</label>
          <input 
            placeholder="İSİM" 
            className="h-12 px-4 rounded-xl border border-slate-200 bg-white font-bold uppercase transition-colors focus:ring-2 focus:ring-primary/20 outline-none" 
            value={newItem.name} 
            onChange={e => setNewItem({...newItem, name: e.target.value.toLocaleUpperCase('tr-TR')})} 
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">KISALTMA</label>
          <input 
            placeholder="KOD" 
            className="h-12 px-4 rounded-xl border border-slate-200 bg-white font-bold uppercase transition-colors focus:ring-2 focus:ring-primary/20 outline-none" 
            value={newItem.abbreviation} 
            onChange={e => setNewItem({...newItem, abbreviation: e.target.value.toUpperCase()})} 
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
