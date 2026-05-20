
import { FiActivity, FiAlertTriangle, FiArchive, FiFilter, FiLayers, FiPlus } from 'react-icons/fi';
import { QuickCreateType, QuickCreateOptions } from '../../../store/useQuickCreateStore';

interface ItemHeaderProps {
  filterTab: string;
  setFilterTab: (tab: 'active' | 'passive' | 'all' | 'critical') => void;
  setPage: (page: number) => void;
  openCreate: (type: QuickCreateType, options: QuickCreateOptions) => void;
  handleFormSuccess: (data?: unknown) => void;
  onImport: () => void;
  onExport: () => void;
}

export const ItemHeader: React.FC<ItemHeaderProps> = ({
  filterTab, setFilterTab, setPage, openCreate, handleFormSuccess, onImport, onExport
}) => {
  const tabs = [
    { id: 'active', label: 'Aktif', icon: <FiActivity /> },
    { id: 'critical', label: 'Kritik', icon: <FiAlertTriangle /> },
    { id: 'passive', label: 'Arşiv', icon: <FiArchive /> },
    { id: 'all', label: 'Tümü', icon: <FiFilter /> }
  ];

  return (
    <div className="flex justify-between items-end">
      <div>
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3.5 py-1.5 rounded-xl text-xs font-black mb-4 uppercase tracking-tight">
          <FiLayers /> ÜRÜN & ENVANTER YÖNETİMİ
        </div>
        <h1 className="text-3xl font-black tracking-tighter text-slate-800">
          Malzeme <span className="text-primary italic">Portföyü</span>
        </h1>
      </div>
      
      <div className="flex gap-3">
        <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-200 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id as 'active' | 'passive' | 'all' | 'critical')}
              className={`h-9 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors ${
                filterTab === tab.id 
                  ? 'bg-white text-primary shadow-sm ring-1 ring-slate-100' 
                  : 'text-slate-500 hover:text-slate-800'
              } ${filterTab === tab.id && tab.id === 'critical' ? 'text-danger' : ''}`}
            >
              {tab.icon} {tab.label.toUpperCase()}
            </button>
          ))}
        </div>
        <button 
          className="btn bg-slate-100 hover:bg-slate-200 text-slate-700 h-11 px-6 border border-slate-200 flex items-center gap-2 font-bold transition-all" 
          onClick={onExport}
        >
          <FiFilter size={18} /> RAPOR AL
        </button>
        <button 
          className="btn bg-emerald-600 hover:bg-emerald-700 text-white h-11 px-6 shadow-lg shadow-emerald-200 flex items-center gap-2 font-bold" 
          onClick={onImport}
        >
          <FiLayers size={18} /> TOPLU AKTAR
        </button>
        <button 
          className="btn btn-primary h-11 px-6 shadow-lg shadow-primary/20 flex items-center gap-2 font-bold" 
          onClick={() => openCreate('item', { onSuccess: handleFormSuccess })}
        >
          <FiPlus size={18} /> Yeni Ürün
        </button>
      </div>
    </div>
  );
};
