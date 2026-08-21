import { FiPlus, FiUsers, FiActivity, FiArchive, FiFilter, FiBriefcase, FiTruck } from 'react-icons/fi';

interface PartiesHeaderProps {
  filterTab: string;
  setFilterTab: (tab: 'active' | 'passive' | 'all') => void;
  typeTab: string;
  setTypeTab: (tab: 'customer' | 'provider' | 'all') => void;
  setPage: (page: number) => void;
  openCreate: (type: 'party', options: { onSuccess: () => void }) => void;
  handleFormSuccess: () => void;
  isMovementsMode?: boolean;
  canCreate?: boolean;
}

export const PartiesHeader: React.FC<PartiesHeaderProps> = ({
  filterTab, setFilterTab, typeTab, setTypeTab, setPage, openCreate, handleFormSuccess, isMovementsMode, canCreate
}) => {
  const tabs = [
    { id: 'active', label: 'Aktif', icon: <FiActivity /> },
    { id: 'passive', label: 'Arşiv', icon: <FiArchive /> },
    { id: 'all', label: 'Tümü', icon: <FiFilter /> }
  ];

  const typeTabs = [
    { id: 'customer', label: 'Müşteriler', icon: <FiBriefcase /> },
    { id: 'provider', label: 'Tedarikçiler', icon: <FiTruck /> },
    { id: 'all', label: 'Tümü', icon: <FiFilter /> }
  ];

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
      <div>
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3.5 py-1.5 rounded-xl text-xs font-black mb-4 uppercase tracking-tight">
          <FiUsers /> {isMovementsMode ? 'MÜŞTERİ HAREKETLERİ' : 'CARİ HESAP YÖNETİMİ'}
        </div>
        <h1 className="text-3xl font-black tracking-tighter text-slate-800">
          {isMovementsMode ? (
            <>Müşteri & Tedarikçi <span className="text-primary italic">Hareketleri</span></>
          ) : (
            <>Müşteriler & <span className="text-primary italic">Tedarikçiler</span></>
          )}
        </h1>
      </div>
      
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-200 shadow-sm">
          {typeTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTypeTab(tab.id as 'customer' | 'provider' | 'all')}
              className={`h-9 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors ${
                typeTab === tab.id 
                  ? 'bg-white text-primary shadow-sm ring-1 ring-slate-100' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.icon} {tab.label.toUpperCase()}
            </button>
          ))}
        </div>

        {!isMovementsMode && (
          <>
            <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-200 shadow-sm">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterTab(tab.id as 'active' | 'passive' | 'all')}
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
            {canCreate && (
              <button 
                className="btn btn-primary h-11 px-6 shadow-lg shadow-primary/20 flex items-center gap-2 font-bold" 
                onClick={() => openCreate('party', { onSuccess: handleFormSuccess })}
              >
                <FiPlus size={18} /> Yeni Kayıt
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
