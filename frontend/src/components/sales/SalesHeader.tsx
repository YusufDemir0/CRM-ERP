
import { FiShoppingBag, FiPlus, FiClock, FiCheckCircle, FiTruck, FiInfo, FiSearch } from 'react-icons/fi';

interface SalesHeaderProps {
  filterStatus: 'draft' | 'approved' | 'shipped' | 'cancelled' | 'all';
  onFilterStatusChange: (status: 'draft' | 'approved' | 'shipped' | 'cancelled' | 'all') => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  onNewSale: () => void;
}

export const SalesHeader: React.FC<SalesHeaderProps> = ({
  filterStatus,
  onFilterStatusChange,
  searchTerm,
  onSearchTermChange,
  onNewSale
}) => {
  return (
    <div className="flex flex-col gap-8">
      {/* 🔵 TOP SECTION */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-xl text-[10px] font-black mb-4 uppercase tracking-widest">
            <FiShoppingBag /> SATIŞ VE PAZARLAMA
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-on-surface">
            Sipariş Takibi & <span className="text-primary italic text-shadow-sm">Sevkiyat</span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-surface-container-low p-1.5 rounded-2xl border border-surface-container shadow-sm">
            {[
              { id: 'draft', label: 'Bekleyenler', icon: <FiClock /> },
              { id: 'approved', label: 'Onaylılar', icon: <FiCheckCircle /> },
              { id: 'shipped', label: 'Sevk Edilenler', icon: <FiTruck /> },
              { id: 'all', label: 'Tümü', icon: <FiInfo /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => onFilterStatusChange(tab.id as 'all' | 'draft' | 'approved' | 'shipped' | 'cancelled')}
                className={`h-10 px-4 rounded-xl text-[11px] font-black flex items-center gap-2 transition-colors uppercase tracking-tight ${
                  filterStatus === tab.id 
                    ? 'bg-white text-primary shadow-premium border border-surface-container' 
                    : 'text-slate-400 hover:text-on-surface hover:bg-white/50'
                }`}
              >
                <span className="text-sm">{tab.icon}</span> {tab.label}
              </button>
            ))}
          </div>
          
          <button 
            className="h-14 px-8 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:shadow-2xl hover:-translate-y-1 active:scale-95 transition-colors flex items-center gap-3" 
            onClick={onNewSale}
          >
            <FiPlus size={20} /> YENİ SİPARİŞ
          </button>
        </div>
      </div>

      {/* 🔍 SEARCH SECTION */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-[2.5rem] shadow-premium border border-surface-container">
        <div className="relative flex-1 group w-full">
          <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors text-lg" />
          <input 
            type="text" 
            placeholder="Sipariş no veya müşteri adı ile hızlı ara..." 
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="w-full pl-14 h-14 bg-surface-container-low border border-transparent focus:border-primary/20 focus:bg-white rounded-3xl transition-colors outline-none font-bold text-slate-700 placeholder:text-slate-300 placeholder:font-black placeholder:uppercase placeholder:text-[10px] placeholder:tracking-widest" 
          />
        </div>
      </div>
    </div>
  );
};
