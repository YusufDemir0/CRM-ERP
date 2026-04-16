import React from 'react';
import { FiFilter, FiSearch } from 'react-icons/fi';

interface PartiesFiltersProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
}

export const PartiesFilters: React.FC<PartiesFiltersProps> = ({
  searchTerm, setSearchTerm
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-[2.5rem] shadow-premium border border-surface-container">
      <div className="relative flex-1 group w-full">
        <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors text-lg" />
        <input 
          type="text" 
          placeholder="Cari adı, vergi no veya telefon ile hızlı ara..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-14 h-14 bg-surface-container-low border border-transparent focus:border-primary/20 focus:bg-white rounded-3xl transition-all outline-none font-bold text-slate-700 placeholder:text-slate-300 placeholder:font-black placeholder:uppercase placeholder:text-[10px] placeholder:tracking-widest" 
        />
      </div>
      <button className="h-14 px-8 rounded-3xl bg-white border border-surface-container hover:border-primary/30 hover:shadow-lg transition-all flex items-center gap-3 font-black text-[10px] uppercase tracking-widest text-slate-600 whitespace-nowrap">
        <FiFilter className="text-primary text-sm" /> Gelişmiş Filtrele
      </button>
    </div>
  );
};
