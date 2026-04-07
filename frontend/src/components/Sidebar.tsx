import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiLogOut } from 'react-icons/fi';
import { navItems } from '../config/navigation';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.fullName
    ? user.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const isAdmin = user?.roles?.some(r => ['admin', 'superadmin'].includes(r.toLowerCase()));

  // Filter items within sections
  const filteredNavItems = navItems.map(section => ({
    ...section,
    items: section.items.filter(item => {
      if (item.to === '/roles' && !isAdmin) return false;
      return true;
    })
  })).filter(section => section.items.length > 0);

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>Cognitive CRM</h1>
        <p>Enterprise Admin</p>
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
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">
            {initials}
          </div>
          <div className="user-info">
            <p className="user-name">{user?.fullName || 'Admin User'}</p>
            <p className="user-email">{user?.email || 'admin@cognitive.com'}</p>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <FiLogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
