import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiLogOut } from 'react-icons/fi';
import { navItems } from '../config/navigation';

export default function Sidebar({ isCollapsed }: { isCollapsed: boolean }) {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.fullName
    ? user.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  // Filter items within sections
  const filteredNavItems = navItems.map(section => ({
    ...section,
    items: section.items.filter(item => {
      if (item.permission) {
        return hasPermission(item.permission);
      }
      return true;
    })
  })).filter(section => section.items.length > 0);

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-logo flex items-center justify-center py-8">
        {isCollapsed ? (
          <div className="w-10 h-10 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dim)] rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-[var(--primary-glow)]">
            E
          </div>
        ) : (
          <div className="flex flex-col">
            <h2 className="text-white text-xl font-black tracking-tighter">ERMAY <span className="text-[var(--primary)]">ERP</span></h2>
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-[0.2em]">Enterprise System v1.0</span>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {filteredNavItems.map((section) => (
          <div className="nav-section" key={section.section}>
            <div className="nav-section-title">{section.section}</div>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                title={isCollapsed ? item.label : undefined}
              >
                {item.icon}
                {!isCollapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer p-4 border-t border-white/5">
        <div className={`sidebar-user flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="sidebar-user-avatar w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-white font-bold text-sm border border-white/10">
            {initials}
          </div>
          {!isCollapsed && (
            <div className="sidebar-user-info flex-1 min-w-0">
              <p className="text-white text-xs font-bold truncate">{user?.fullName || 'Kullanıcı'}</p>
              <span className="text-[10px] text-slate-500 font-bold uppercase truncate block">{user?.roles?.[0] || 'Kullanıcı'}</span>
            </div>
          )}
          {!isCollapsed && (
            <button className="btn-icon text-slate-400 hover:text-white transition-colors" onClick={handleLogout} title="Çıkış Yap">
              <FiLogOut size={18} />
            </button>
          )}
        </div>
        {isCollapsed && (
           <button className="w-full mt-4 py-2 flex justify-center text-slate-500 hover:text-rose-400 transition-colors" onClick={handleLogout} title="Çıkış Yap">
             <FiLogOut size={18} />
           </button>
        )}
      </div>
    </aside>
  );
}
