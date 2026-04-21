import { useState, useEffect, useRef, useMemo } from 'react';
import { FiSearch, FiBell, FiHelpCircle, FiChevronRight, FiCommand, FiZap, FiMenu, FiLogOut, FiBox, FiUsers, FiShoppingCart } from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllNavItems } from '../config/navigation';
import { useDebounce } from '../hooks/useDebounce';
import { itemsAPI, partiesAPI, salesAPI } from '../services/api';
import { Item, Party, Sale } from '../types';
import { formatDisplayDate } from '../utils/date.helper';

export default function Navbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    items: Item[];
    parties: Party[];
    sales: Sale[];
  }>({ items: [], parties: [], sales: [] });
  const searchRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(searchQuery, 300);

  const pathSegments = location.pathname.split('/').filter(p => p);
  const currentPath = pathSegments.length > 0 
    ? pathSegments[0].charAt(0).toUpperCase() + pathSegments[0].slice(1) 
    : 'Dashboard';

  const allItems = useMemo(() => getAllNavItems(), []);
  const filteredNavItems = useMemo(() => {
    if (searchQuery.trim() === '') return [];
    const q = searchQuery.toLowerCase();
    return allItems.filter(item => 
      item.label.toLowerCase().includes(q) || 
      item.keywords?.some(k => k.toLowerCase().includes(q))
    );
  }, [searchQuery, allItems]);

  useEffect(() => {
    if (debouncedQuery.trim() === '') {
      setSearchResults({ items: [], parties: [], sales: [] });
      return;
    }

    const performSearch = async () => {
      setIsSearching(true);
      try {
        const [itemsRes, partiesRes, salesRes] = await Promise.all([
          itemsAPI.getAll({ search: debouncedQuery, limit: 5 }),
          partiesAPI.getAll({ search: debouncedQuery, limit: 5 }),
          salesAPI.getAll({ search: debouncedQuery, limit: 5 })
        ]);
        setSearchResults({
          items: itemsRes.data.data,
          parties: partiesRes.data.data,
          sales: salesRes.data.data
        });
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // P1-5: Global keyboard shortcuts (always active)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        const input = searchRef.current?.querySelector('input');
        input?.focus();
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // P1-5: Click-outside only when search is open
  useEffect(() => {
    if (!isSearchOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSearchOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (filteredNavItems.length > 0) {
      navigate(filteredNavItems[0].to);
      setSearchQuery('');
      setIsSearchOpen(false);
    }
  };

  const initials = user?.fullName
    ? user.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <header className="navbar" style={{ marginLeft: 'var(--sidebar-w)' }}>
      <div className="navbar-left">
        <button className="nav-action-btn mr-6" onClick={onToggleSidebar} title="Menüyü Daralt/Genişlet">
          <FiMenu size={22} />
        </button>

        <div className="navbar-search-container relative max-w-[480px] w-full flex items-center" ref={searchRef}>
          <div className="absolute left-4 flex text-[var(--text-muted)]">
            <FiSearch size={16} />
          </div>
          <form onSubmit={handleSearchSubmit} className="flex-1">
            <input 
              type="text" 
              className="navbar-search-input w-full py-3 pl-11 pr-4 rounded-xl border-2 border-slate-200 bg-white text-sm font-bold transition-all focus:border-[var(--primary)] focus:bg-white focus:ring-4 focus:ring-[var(--primary-glow)]"
              placeholder="Hızlı arama yapın... ( / )" 
              value={searchQuery}
              autoComplete="off"
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
            />
          </form>
          <div className="absolute right-3 bg-[var(--surface)] border border-[var(--border)] py-1 px-2 rounded-lg flex items-center gap-1 shadow-sm">
            <FiCommand size={10} className="opacity-40" />
            <span className="text-[10px] font-extrabold text-[var(--text-muted)]">K</span>
          </div>
          {isSearchOpen && searchQuery.trim() !== '' && (
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
                        onClick={() => { navigate(item.to); setSearchQuery(''); setIsSearchOpen(false); }}
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
                    {searchResults.items.map(item => (
                      <div 
                        key={item.id} 
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-emerald-50/50 cursor-pointer transition-all group border border-transparent hover:border-emerald-100"
                        onClick={() => { navigate(`/items?id=${item.id}`); setSearchQuery(''); setIsSearchOpen(false); }}
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
                    {searchResults.parties.map(party => (
                      <div 
                        key={party.id} 
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-blue-50/50 cursor-pointer transition-all group border border-transparent hover:border-blue-100"
                        onClick={() => { navigate(`/parties?id=${party.id}`); setSearchQuery(''); setIsSearchOpen(false); }}
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
                    <FiShoppingCart size={14} /> Satış Siparişleri
                  </p>
                  <div className="grid grid-cols-1 gap-1">
                    {searchResults.sales.map(sale => (
                      <div 
                        key={sale.id} 
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-rose-50/50 cursor-pointer transition-all group border border-transparent hover:border-rose-100"
                        onClick={() => { navigate(`/sales?id=${sale.id}`); setSearchQuery(''); setIsSearchOpen(false); }}
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
                <div className="p-10 text-center">
                   <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FiSearch size={24} className="text-slate-300" />
                   </div>
                   <p className="text-sm font-bold text-slate-400">"{searchQuery}" ile eşleşen sonuç bulunamadı.</p>
                   <p className="text-[11px] text-slate-300 font-bold mt-1 uppercase tracking-tighter">İpucu: SKU, Cari Adı veya Fatura No ile arama yapın</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="navbar-right flex items-center gap-4">
        <div className="nav-actions flex items-center gap-2 pr-4 border-r border-[var(--border)]">
          <button className="nav-action-btn bg-transparent border-none text-[var(--text-muted)] p-2.5 rounded-xl cursor-pointer transition-colors hover:text-[var(--primary)]" title="Yardım">
            <FiHelpCircle size={20} />
          </button>
          <button className="nav-action-btn relative bg-[var(--surface)] border-[1.5px] border-[var(--border)] text-[var(--text-primary)] p-2.5 rounded-[14px] cursor-pointer transition-colors hover:border-[var(--primary)]" title="Bildirimler">
            <FiBell size={20} />
            <div className="absolute top-2.5 right-[11px] w-2 h-2 bg-[var(--error)] rounded-full border-2 border-white"></div>
          </button>
        </div>
        
        <div className="nav-user-info flex items-center gap-3 pl-4 border-l border-[var(--border)]">
          <div className="user-meta text-right hidden sm:block">
            <p className="user-meta-name text-[13px] font-extrabold text-slate-800 leading-tight">{user?.fullName || 'Yönetici'}</p>
            <p className="user-meta-role text-[10px] font-bold text-emerald-500 uppercase tracking-wide">{user?.roles?.[0] || 'Admin'}</p>
          </div>
          <div className="group relative">
            <div className="nav-user-avatar w-[42px] h-[42px] bg-slate-900 text-white rounded-[14px] flex items-center justify-center font-black text-sm shadow-lg transition-transform hover:scale-105 cursor-pointer">
              {initials}
            </div>
            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all -translate-y-2 group-hover:translate-y-0 z-[110]">
               <div className="px-4 py-2 border-b border-slate-50 mb-1">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hesap Ayarları</p>
               </div>
               <button className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-bold text-slate-600 hover:bg-slate-50 hover:text-[var(--primary)] transition-colors">
                 <FiSearch size={16} className="opacity-50" /> Profilim
               </button>
               <button 
                 className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-bold text-rose-500 hover:bg-rose-50 transition-colors"
                 onClick={handleLogout}
               >
                 <FiLogOut size={16} /> Güvenli Çıkış
               </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
