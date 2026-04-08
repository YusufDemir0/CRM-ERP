import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiBell, FiHelpCircle, FiChevronRight, FiCommand } from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllNavItems } from '../config/navigation';

export default function Navbar() {
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

  const allItems = getAllNavItems();
  const filteredItems = searchQuery.trim() === '' 
    ? [] 
    : allItems.filter(item => 
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.keywords?.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))
      );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };

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

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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
    <header className="navbar">
      <div className="navbar-left">
        <div className="nav-breadcrumb">
          <span className="breadcrumb-root">Enterprise Admin</span>
          <FiChevronRight className="breadcrumb-separator" size={10} />
          <span className="breadcrumb-current">{currentPath}</span>
        </div>

        <div className="navbar-search-container" ref={searchRef}>
          <FiSearch className="navbar-search-icon" size={16} />
          <form onSubmit={handleSearchSubmit} style={{ flex: 1 }}>
            <input 
              type="text" 
              className="navbar-search-input"
              placeholder="Hızlı Erişim... (Kısayol: /)" 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
            />
          </form>
          <FiCommand size={14} style={{ opacity: 0.3, marginLeft: '8px' }} />
          
          {isSearchOpen && searchQuery.trim() !== '' && (
            <div className="table-card" style={{ 
              position: 'absolute', 
              top: '50px', 
              left: 0, 
              width: '450px', 
              zIndex: 1000, 
              padding: '12px',
              maxHeight: '400px',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border)'
            }}>
              {/* NAVİGASYON SONUÇLARI */}
              {filteredItems.length > 0 && (
                <div style={{ marginBottom: '15px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sayfalar / Menü</p>
                  {filteredItems.map(item => (
                    <div 
                      key={item.to} 
                      className="nav-link" 
                      style={{ cursor: 'pointer', borderRadius: '8px', padding: '8px 12px' }}
                      onClick={() => {
                        navigate(item.to);
                        setSearchQuery('');
                        setIsSearchOpen(false);
                      }}
                    >
                      {item.icon}
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>{item.label}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* MODÜLLERDE ARA (DINAMIK YONLENDIRME) */}
              <div>
                <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Hızlı Arama</p>
                <div 
                   className="nav-link" 
                   style={{ cursor: 'pointer', borderRadius: '8px', padding: '10px' }}
                   onClick={() => { navigate(`/items?search=${searchQuery}`); setSearchQuery(''); setIsSearchOpen(false); }}
                >
                  <FiSearch size={14} />
                  <span style={{ fontSize: '13px' }}><strong>"{searchQuery}"</strong> ürünlerde ara...</span>
                </div>
                <div 
                   className="nav-link" 
                   style={{ cursor: 'pointer', borderRadius: '8px', padding: '10px' }}
                   onClick={() => { navigate(`/parties?search=${searchQuery}`); setSearchQuery(''); setIsSearchOpen(false); }}
                >
                  <FiSearch size={14} />
                  <span style={{ fontSize: '13px' }}><strong>"{searchQuery}"</strong> carilerde ara...</span>
                </div>
                <div 
                   className="nav-link" 
                   style={{ cursor: 'pointer', borderRadius: '8px', padding: '10px' }}
                   onClick={() => { navigate(`/sales?search=${searchQuery}`); setSearchQuery(''); setIsSearchOpen(false); }}
                >
                  <FiSearch size={14} />
                  <span style={{ fontSize: '13px' }}><strong>"{searchQuery}"</strong> satışlarda ara...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="navbar-right">
        <div className="nav-actions">
          <button className="nav-action-btn" title="Bildirimler">
            <FiBell size={18} />
          </button>
          <button className="nav-action-btn" title="Yardım Merkezi">
            <FiHelpCircle size={18} />
          </button>
        </div>
        
        <div className="nav-user-info">
          <div className="user-meta">
            <p className="user-meta-name">{user?.fullName || 'Sistem Yöneticisi'}</p>
            <p className="user-meta-role">Admin Yetkisi</p>
          </div>
          <div className="nav-user-avatar">
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}
