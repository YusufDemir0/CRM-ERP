import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { navItems } from '../config/navigation';

export default function Sidebar({ isCollapsed }: { isCollapsed: boolean }) {
  const { hasPermission } = useAuth();



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

    </aside>
  );
}
