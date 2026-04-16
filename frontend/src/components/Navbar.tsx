import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiBell, FiHelpCircle, FiChevronRight, FiCommand, FiUser, FiZap } from 'react-icons/fi';
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
    <header className="navbar glass-panel" style={{ 
      height: 'var(--navbar-height)',
      position: 'fixed',
      top: 0,
      right: 0,
      left: 0,
      marginLeft: 'var(--sidebar-width)',
      zIndex: 90,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 40px',
      borderBottom: '1px solid var(--border)',
      background: 'rgba(255, 255, 255, 0.7)',
      backdropFilter: 'blur(12px)',
      boxShadow: 'none'
    }}>
      <div className="navbar-left" style={{ display: 'flex', alignItems: 'center', gap: '40px', flex: 1 }}>
        <div className="nav-breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="breadcrumb-root" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Sistem</span>
          <FiChevronRight className="breadcrumb-separator" size={10} style={{ opacity: 0.3 }} />
          <span className="breadcrumb-current" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{currentPath}</span>
        </div>

        <div className="navbar-search-container" ref={searchRef} style={{ 
          position: 'relative', 
          maxWidth: '480px', 
          width: '100%',
          display: 'flex',
          alignItems: 'center'
        }}>
          <div style={{
            position: 'absolute',
            left: '16px',
            display: 'flex',
            color: 'var(--text-muted)'
          }}>
            <FiSearch size={16} />
          </div>
          <form onSubmit={handleSearchSubmit} style={{ flex: 1 }}>
            <input 
              type="text" 
              className="navbar-search-input"
              placeholder="Komutları ara... ( / )" 
              value={searchQuery}
              autoComplete="off"
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              style={{
                width: '100%',
                padding: '12px 16px 12px 44px',
                borderRadius: '16px',
                border: '1px solid var(--border)',
                background: 'rgba(241, 245, 249, 0.5)',
                fontSize: '14px',
                fontWeight: 600,
                transition: 'var(--transition)'
              }}
            />
          </form>
          <div style={{
            position: 'absolute',
            right: '12px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            padding: '4px 8px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <FiCommand size={10} style={{ opacity: 0.4 }} />
            <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)' }}>K</span>
          </div>
          
          {isSearchOpen && searchQuery.trim() !== '' && (
            <div className="glass-panel animate-in" style={{ 
              position: 'absolute', 
              top: '56px', 
              left: 0, 
              width: '100%', 
              zIndex: 1000, 
              padding: '16px',
              maxHeight: '440px',
              overflowY: 'auto',
              borderRadius: '24px',
              boxShadow: 'var(--shadow-lg)'
            }}>
              {/* NAVİGASYON SONUÇLARI */}
              {filteredItems.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiZap size={14} /> Modüller
                  </p>
                  {filteredItems.map(item => (
                    <div 
                      key={item.to} 
                      className="nav-link" 
                      style={{ 
                        cursor: 'pointer', 
                        borderRadius: '12px', 
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        transition: 'var(--transition)'
                      }}
                      onClick={() => {
                        navigate(item.to);
                        setSearchQuery('');
                        setIsSearchOpen(false);
                      }}
                    >
                      <div style={{ color: 'var(--primary)', display: 'flex' }}>{item.icon}</div>
                      <span style={{ fontSize: '13px', fontWeight: 700 }}>{item.label}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* HIZLI AKSİYONLAR */}
              <div>
                <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Global Arama</p>
                {[
                  { label: 'Ürünlerde ara', path: '/items' },
                  { label: 'Carilerde ara', path: '/parties' },
                  { label: 'Satışlarda ara', path: '/sales' },
                ].map(action => (
                  <div 
                     key={action.path}
                     className="nav-link" 
                     style={{ cursor: 'pointer', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}
                     onClick={() => { navigate(`${action.path}?search=${searchQuery}`); setSearchQuery(''); setIsSearchOpen(false); }}
                  >
                    <div style={{ width: '28px', height: '28px', background: 'var(--surface-container)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FiSearch size={12} />
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 500 }}><strong>"{searchQuery}"</strong> {action.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="navbar-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '16px', borderRight: '1px solid var(--border)' }}>
          <button className="nav-action-btn" title="Yardım" style={{ 
            background: 'transparent', border: 'none', color: 'var(--text-muted)', padding: '10px', borderRadius: '12px', cursor: 'pointer', transition: '0.2s'
          }}>
            <FiHelpCircle size={20} />
          </button>
          <button className="nav-action-btn" title="Bildirimler" style={{ 
            background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text-primary)', padding: '10px', borderRadius: '14px', cursor: 'pointer', transition: '0.2s', position: 'relative'
          }}>
            <FiBell size={20} />
            <div style={{ position: 'absolute', top: '10px', right: '11px', width: '8px', height: '8px', background: 'var(--error)', borderRadius: '50%', border: '2px solid white' }}></div>
          </button>
        </div>
        
        <div className="nav-user-info" style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '8px' }}>
          <div className="user-meta" style={{ textAlign: 'right' }}>
            <p className="user-meta-name" style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>{user?.fullName || 'Yönetici'}</p>
            <p className="user-meta-role" style={{ fontSize: '10px', fontWeight: 800, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Aktif Oturum</p>
          </div>
          <div className="nav-user-avatar" style={{ 
            width: '42px', height: '42px', background: 'var(--primary-gradient)', color: 'white', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '15px', boxShadow: '0 4px 12px var(--primary-glow)'
          }}>
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}
