
import { FiPlus, FiUsers, FiActivity, FiArchive, FiFilter } from 'react-icons/fi';

interface PartiesHeaderProps {
  filterTab: string;
  setFilterTab: (tab: 'active' | 'passive' | 'all') => void;
  setPage: (page: number) => void;
  openCreate: (type: 'party', options: { onSuccess: () => void }) => void;
  handleFormSuccess: () => void;
}

export const PartiesHeader: React.FC<PartiesHeaderProps> = ({
  filterTab, setFilterTab, setPage, openCreate, handleFormSuccess
}) => {
  const tabs = [
    { id: 'active', label: 'Aktif', icon: <FiActivity /> },
    { id: 'passive', label: 'Arşiv', icon: <FiArchive /> },
    { id: 'all', label: 'Tümü', icon: <FiFilter /> }
  ];

  return (
    <div className="flex justify-between items-end">
      <div>
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3.5 py-1.5 rounded-xl text-xs font-black mb-4 uppercase tracking-tight">
          <FiUsers /> CARİ HESAP YÖNETİMİ
        </div>
        <h1 className="text-3xl font-black tracking-tighter text-slate-800">
          Müşteriler & <span className="text-primary italic">Tedarikçiler</span>
        </h1>
      </div>
      
      <div className="flex gap-3">
        <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-200 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setFilterTab(tab.id as 'active' | 'passive' | 'all'); setPage(1); }}
              className={`h-9 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors ${
                filterTab === tab.id 
                  ? 'bg-white text-primary shadow-sm ring-1 ring-slate-100' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.icon} {tab.label.toUpperCase()}
            </button>
          ))}
        </div>
        <button 
          className="btn btn-primary h-11 px-6 shadow-lg shadow-primary/20 flex items-center gap-2 font-bold" 
          onClick={() => openCreate('party', { onSuccess: handleFormSuccess })}
        >
          <FiPlus size={18} /> Yeni Kayıt
        </button>
      </div>
    </div>
  );
};
