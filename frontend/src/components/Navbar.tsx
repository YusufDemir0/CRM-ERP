import { useState, useEffect, useRef, useMemo, memo } from 'react';
import { FiSearch, FiBell, FiHelpCircle, FiChevronRight, FiCommand, FiZap, FiMenu, FiLogOut, FiBox, FiUsers, FiShoppingCart } from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Item, Party, Sale } from '../types';
import { formatDisplayDate } from '../utils/date.helper';
import { NotificationCenter } from './NotificationCenter';
import { GlobalSearchResults } from './GlobalSearchResults';
import { useGlobalSearch } from '../hooks/useGlobalSearch';

// ────── NAVBAR COMPONENT ──────

const NavbarInner = ({ onToggleSidebar }: { onToggleSidebar: () => void }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const { isSearching, searchResults, filteredNavItems } = useGlobalSearch(searchQuery);

  const initials = useMemo(() => user?.fullName
    ? user.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U', [user?.fullName]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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

  return (
    <header className="navbar">
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
            <GlobalSearchResults 
               searchQuery={searchQuery}
               filteredNavItems={filteredNavItems}
               searchResults={searchResults}
               isSearching={isSearching}
               onNavigate={(to) => {
                 navigate(to);
                 setSearchQuery('');
                 setIsSearchOpen(false);
               }}
            />
          )}
        </div>
      </div>

      <div className="navbar-right flex items-center gap-4">
        <div className="nav-actions flex items-center gap-2 pr-4 border-r border-[var(--border)]">
          <button className="nav-action-btn bg-transparent border-none text-[var(--text-muted)] p-2.5 rounded-xl cursor-pointer transition-colors hover:text-[var(--primary)]" title="Yardım">
            <FiHelpCircle size={20} />
          </button>
          <NotificationCenter />
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
};

// ────── SEARCH RESULTS SUB-COMPONENT ──────

// Component moved to GlobalSearchResults.tsx

export const Navbar = memo(NavbarInner);
export default Navbar;
