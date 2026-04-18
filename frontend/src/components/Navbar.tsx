import { useState, useEffect, useRef, useMemo } from 'react';
import { FiSearch, FiBell, FiHelpCircle, FiChevronRight, FiCommand, FiZap, FiMenu } from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllNavItems } from '../config/navigation';

export default function Navbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const pathSegments = location.pathname.split('/').filter(p => p);
  const currentPath = pathSegments.length > 0 
    ? pathSegments[0].charAt(0).toUpperCase() + pathSegments[0].slice(1) 
    : 'Dashboard';

  const allItems = useMemo(() => getAllNavItems(), []);
  const filteredItems = useMemo(() => {
    if (searchQuery.trim() === '') return [];
    const q = searchQuery.toLowerCase();
    return allItems.filter(item => 
      item.label.toLowerCase().includes(q) || 
      item.keywords?.some(k => k.toLowerCase().includes(q))
    );
  }, [searchQuery, allItems]);

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
    if (filteredItems.length > 0) {
      navigate(filteredItems[0].to);
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
        <button className="nav-action-btn mr-4" onClick={onToggleSidebar} title="Menüyü Daralt/Genişlet">
          <FiMenu size={20} />
        </button>
        <div className="nav-breadcrumb">
          <span className="breadcrumb-root text-[13px] font-semibold text-[var(--text-muted)]">Sistem</span>
          <FiChevronRight className="breadcrumb-separator opacity-30" size={10} />
          <span className="breadcrumb-current text-sm font-bold text-[var(--text-primary)]">{currentPath}</span>
        </div>

        <div className="navbar-search-container relative max-w-[480px] w-full flex items-center" ref={searchRef}>
          <div className="absolute left-4 flex text-[var(--text-muted)]">
            <FiSearch size={16} />
          </div>
          <form onSubmit={handleSearchSubmit} className="flex-1">
            <input 
              type="text" 
              className="navbar-search-input w-full py-3 pl-11 pr-4 rounded-2xl border border-[var(--border)] bg-slate-100/50 text-sm font-semibold transition-colors"
              placeholder="Komutları ara... ( / )" 
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
            <div className="glass-panel animate-in absolute top-14 left-0 w-full z-[1000] p-4 max-h-[440px] overflow-y-auto rounded-3xl shadow-lg">
              {/* NAVİGASYON SONUÇLARI */}
              {filteredItems.length > 0 && (
                <div className="mb-5">
                  <p className="text-[11px] font-extrabold text-[var(--primary)] mb-2.5 uppercase tracking-wide flex items-center gap-2">
                    <FiZap size={14} /> Modüller
                  </p>
                  {filteredItems.map(item => (
                    <div 
                      key={item.to} 
                      className="nav-link cursor-pointer rounded-xl py-2.5 px-3.5 flex items-center gap-3 transition-colors hover:bg-slate-50"
                      onClick={() => {
                        navigate(item.to);
                        setSearchQuery('');
                        setIsSearchOpen(false);
                      }}
                    >
                      <div className="text-[var(--primary)] flex">{item.icon}</div>
                      <span className="text-[13px] font-bold">{item.label}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* HIZLI AKSİYONLAR */}
              <div>
                <p className="text-[11px] font-extrabold text-[var(--text-muted)] mb-2.5 uppercase tracking-wide">Global Arama</p>
                {[
                  { label: 'Ürünlerde ara', path: '/items' },
                  { label: 'Carilerde ara', path: '/parties' },
                  { label: 'Satışlarda ara', path: '/sales' },
                ].map(action => (
                  <div 
                     key={action.path}
                     className="nav-link cursor-pointer rounded-xl p-3 flex items-center gap-3 hover:bg-slate-50"
                     onClick={() => { navigate(`${action.path}?search=${searchQuery}`); setSearchQuery(''); setIsSearchOpen(false); }}
                  >
                    <div className="w-7 h-7 bg-[var(--surface-container)] rounded-lg flex items-center justify-center">
                      <FiSearch size={12} />
                    </div>
                    <span className="text-[13px] font-medium"><strong>"{searchQuery}"</strong> {action.label}</span>
                  </div>
                ))}
              </div>
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
        
        <div className="nav-user-info flex items-center gap-3 pl-2">
          <div className="user-meta text-right">
            <p className="user-meta-name text-[13px] font-extrabold text-[var(--text-primary)] leading-tight">{user?.fullName || 'Yönetici'}</p>
            <p className="user-meta-role text-[10px] font-extrabold text-[var(--success)] uppercase tracking-wide">Aktif Oturum</p>
          </div>
          <div className="nav-user-avatar w-[42px] h-[42px] bg-[var(--primary-gradient)] text-white rounded-[15px] flex items-center justify-center font-extrabold text-[15px] shadow-[0_4px_12px_var(--primary-glow)]">
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}
