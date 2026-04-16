import React from 'react';
import { FiFilter, FiSearch } from 'react-icons/fi';

interface ItemFiltersProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
}

export const ItemFilters: React.FC<ItemFiltersProps> = ({
  searchTerm, setSearchTerm
}) => {
  return (
    <div className="glass-panel p-5 rounded-[24px] flex gap-5 items-center bg-white/50 backdrop-blur-xl border border-white/20 shadow-xl shadow-slate-200/50">
      <div className="relative flex-1 group">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
        <input 
          type="text" 
          placeholder="Ürün adı, kodu veya barkod ile hızlı ara..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 h-13 border-none bg-slate-100/50 rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all outline-none font-medium text-slate-700"
        />
      </div>
      <button className="btn btn-secondary h-13 px-6 rounded-2xl bg-white border border-slate-200 hover:border-primary/30 transition-all flex items-center gap-2 font-bold text-slate-600">
        <FiFilter /> Gelişmiş Filtrele
      </button>
    </div>
  );
};
