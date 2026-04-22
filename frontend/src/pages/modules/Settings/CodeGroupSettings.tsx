
import { FiPlus } from 'react-icons/fi';
import { DataTable, Column } from '../../../components/common/DataTable';
import { useSort } from '../../../hooks/useSort';

export interface CodeGroup {
  id: number;
  name: string;
  prefix: string;
  state: number;
}

interface CodeGroupSettingsProps {
  groups: CodeGroup[];
  newGroup: { name: string; prefix: string };
  setNewGroup: (group: { name: string; prefix: string }) => void;
  onAdd: () => void;
  onToggle: (id: number, state: number) => void;
}

export const CodeGroupSettings: React.FC<CodeGroupSettingsProps> = ({
  groups, newGroup, setNewGroup, onAdd, onToggle
}) => {
  const { sortedData, sortConfigs, toggleSort } = useSort(groups, [{ key: 'name', direction: 'asc' }]);

  const columns: Column<CodeGroup>[] = [
    { 
      header: 'Grup Adı', 
      accessor: (g) => <div className="font-extrabold text-slate-800">{g.name}</div>, 
      sortKey: 'name' 
    },
    { 
      header: 'Ön Ek', 
      accessor: (g) => <span className="font-black text-primary bg-primary/5 px-3 py-1 rounded-lg border border-primary/10 tracking-widest">{g.prefix}</span>, 
      sortKey: 'prefix' 
    },
    { 
      header: 'Durum', 
      accessor: (g) => (
        <span className={`text-[10px] font-black px-3 py-1.5 rounded-full border transition-colors ${
          g.state === 1 
            ? 'text-success bg-success/5 border-success/10' 
            : 'text-slate-400 bg-slate-50 border-slate-200'
        }`}>
          {g.state === 1 ? 'AKTİF' : 'PASİF'}
        </span>
      ) 
    }
  ];

  return (
    <div className="animate-in">
      <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-8">Ürün Kod Grupları</h3>
      
      <DataTable<CodeGroup>
        data={sortedData}
        columns={columns}
        sortConfigs={sortConfigs}
        onSort={toggleSort}
        getRowKey={(g) => g.id}
        onArchive={(g) => g.state === 1 ? onToggle(g.id, g.state) : undefined}
        onRestore={(g) => g.state === 0 ? onToggle(g.id, g.state) : undefined}
        getRowOpacity={(g) => g.state === 0 ? 0.6 : 1}
      />

      <div className="mt-10 p-8 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 grid grid-cols-1 md:grid-cols-[1fr_150px_auto] gap-4 items-end">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">GRUP İSMİ</label>
          <input 
            placeholder="ÖRN: MOBİLYA" 
            className="h-12 px-4 rounded-xl border border-slate-200 bg-white font-bold uppercase transition-colors focus:ring-2 focus:ring-primary/20 outline-none" 
            value={newGroup.name} 
            onChange={e => setNewGroup({...newGroup, name: e.target.value.toLocaleUpperCase('tr-TR')})} 
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">KOD ÖNEKİ</label>
          <input 
            placeholder="KOD" 
            className="h-12 px-4 rounded-xl border border-slate-200 bg-white font-bold uppercase transition-colors focus:ring-2 focus:ring-primary/20 outline-none" 
            value={newGroup.prefix} 
            onChange={e => setNewGroup({...newGroup, prefix: e.target.value.toUpperCase()})} 
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
