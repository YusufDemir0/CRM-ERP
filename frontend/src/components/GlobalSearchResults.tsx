import React, { memo } from 'react';
import { FiZap, FiChevronRight, FiBox, FiUsers, FiShoppingCart, FiSearch } from 'react-icons/fi';
import { formatDisplayDate } from '../utils/date.helper';
import { GlobalSearchData } from '../hooks/useGlobalSearch';
import { NavItem } from '../config/navigation';

export const GlobalSearchResults = memo(({ 
  searchQuery, 
  filteredNavItems, 
  searchResults, 
  isSearching, 
  onNavigate 
}: { 
  searchQuery: string;
  filteredNavItems: NavItem[];
  searchResults: GlobalSearchData;
  isSearching: boolean;
  onNavigate: (to: string) => void;
}) => {
  return (
    <div className="glass-panel animate-in absolute top-[52px] left-0 w-full z-[1000] p-5 max-h-[500px] overflow-y-auto rounded-[20px] shadow-2xl border border-slate-200 shadow-slate-200/50">
      {/* MODÜLLER */}
      {filteredNavItems.length > 0 && (
        <div className="mb-6">
          <p className="text-[10px] font-black text-[var(--primary)] mb-3 uppercase tracking-[0.15em] flex items-center gap-2 px-1">
            <FiZap size={14} /> Modüller
          </p>
          <div className="grid grid-cols-1 gap-1">
            {filteredNavItems.map(item => (
              <div 
                key={item.to} 
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-100/80 cursor-pointer transition-all group"
                onClick={() => onNavigate(item.to)}
              >
                <div className="flex items-center gap-3">
                  <div className="text-[var(--primary)]">{item.icon}</div>
                  <span className="text-sm font-bold text-slate-700">{item.label}</span>
                </div>
                <FiChevronRight className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-[var(--primary)]" size={14} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ÜRÜNLER (DATA) */}
      {searchResults.items.length > 0 && (
        <div className="mb-6">
          <p className="text-[10px] font-black text-emerald-600 mb-3 uppercase tracking-[0.15em] flex items-center gap-2 px-1">
            <FiBox size={14} /> Ürünler
          </p>
          <div className="grid grid-cols-1 gap-1">
            {searchResults.items.map((item) => (
              <div 
                key={item.id} 
                className="flex items-center justify-between p-3 rounded-xl hover:bg-emerald-50/50 cursor-pointer transition-all group border border-transparent hover:border-emerald-100"
                onClick={() => onNavigate(`/items?id=${item.id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs font-black">
                    {item.code?.slice(-2)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-800">{item.name}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{item.code} • {item.itemType?.name}</span>
                  </div>
                </div>
                <div className="text-right">
                   <span className="text-xs font-black text-emerald-700">{item.totalStock || 0} {item.quantityType?.abbreviation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CARİLER (DATA) */}
      {searchResults.parties.length > 0 && (
        <div className="mb-6">
          <p className="text-[10px] font-black text-blue-600 mb-3 uppercase tracking-[0.15em] flex items-center gap-2 px-1">
            <FiUsers size={14} /> Cari Hesaplar
          </p>
          <div className="grid grid-cols-1 gap-1">
            {searchResults.parties.map((party) => (
              <div 
                key={party.id} 
                className="flex items-center justify-between p-3 rounded-xl hover:bg-blue-50/50 cursor-pointer transition-all group border border-transparent hover:border-blue-100"
                onClick={() => onNavigate(`/parties?id=${party.id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 text-[10px] font-black">
                    {party.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-800">{party.name}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{party.type === 'customer' ? 'Müşteri' : 'Tedarikçi'} • {party.taxNumber || 'V.N. Yok'}</span>
                  </div>
                </div>
                <FiChevronRight className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-blue-500" size={14} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SATIŞLAR (DATA) */}
      {searchResults.sales.length > 0 && (
        <div className="mb-6">
          <p className="text-[10px] font-black text-rose-600 mb-3 uppercase tracking-[0.15em] flex items-center gap-2 px-1">
            <FiShoppingCart size={14} /> Satışlar
          </p>
          <div className="grid grid-cols-1 gap-1">
            {searchResults.sales.map((sale) => (
              <div 
                key={sale.id} 
                className="flex items-center justify-between p-3 rounded-xl hover:bg-rose-50/50 cursor-pointer transition-all group border border-transparent hover:border-rose-100"
                onClick={() => onNavigate(`/sales?id=${sale.id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600 text-[10px] font-black">
                    {sale.code?.slice(-2) || 'S'}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-800">{sale.party?.name || 'Bilinmeyen Cari'}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{sale.code} • {formatDisplayDate(sale.createdAt)}</span>
                  </div>
                </div>
                <div className="text-right">
                   <span className="text-xs font-black text-rose-700">{sale.totalAmount} {sale.currency?.symbol}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isSearching && (
         <div className="p-4 text-center">
            <div className="spinner mx-auto w-6 h-6 border-2 border-[var(--primary)] border-t-transparent animate-spin rounded-full text-indigo-500"></div>
            <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-[0.2em]">Veritabanı taranıyor...</p>
         </div>
      )}

      {!isSearching && filteredNavItems.length === 0 && searchResults.items.length === 0 && searchResults.parties.length === 0 && searchResults.sales.length === 0 && (
        <div className="p-6 text-center">
           <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiSearch size={24} className="text-slate-300" />
           </div>
           <p className="text-sm font-bold text-slate-400">"{searchQuery}" ile eşleşen sonuç bulunamadı.</p>
           <p className="text-[11px] text-slate-300 font-bold mt-1 uppercase tracking-tighter">İpucu: SKU, Cari Adı veya Fatura No ile arama yapın</p>
        </div>
      )}
    </div>
  );
});
