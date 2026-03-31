import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiHome, FiUsers, FiShield, FiLayers, FiUserCheck,
  FiPackage, FiBox, FiShoppingCart, FiDollarSign,
  FiCreditCard, FiRepeat, FiSettings, FiLogOut, FiTool
} from 'react-icons/fi';

const navItems = [
  { section: 'Genel', items: [
    { to: '/', icon: <FiHome />, label: 'Dashboard' },
  ]},
  { section: 'Yönetim', items: [
    { to: '/users', icon: <FiUsers />, label: 'Kullanıcılar' },
    { to: '/roles', icon: <FiShield />, label: 'Roller & Yetkiler' },
    { to: '/departments', icon: <FiLayers />, label: 'Departmanlar' },
  ]},
  { section: 'CRM', items: [
    { to: '/parties', icon: <FiUserCheck />, label: 'Cari Hesaplar' },
  ]},
  { section: 'Stok', items: [
    { to: '/items', icon: <FiPackage />, label: 'Ürünler' },
    { to: '/stocks', icon: <FiBox />, label: 'Stok Durumu' },
  ]},
  { section: 'Satış', items: [
    { to: '/sales', icon: <FiShoppingCart />, label: 'Siparişler' },
  ]},
  { section: 'Finans', items: [
    { to: '/currencies', icon: <FiDollarSign />, label: 'Para Birimleri' },
    { to: '/accounts', icon: <FiCreditCard />, label: 'Hesaplar' },
    { to: '/transactions', icon: <FiRepeat />, label: 'İşlemler' },
  ]},
  { section: 'Üretim', items: [
    { to: '/production', icon: <FiTool />, label: 'Üretim' },
  ]},
];

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

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2>Ermay ERP</h2>
        <span>v1.0</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((section) => (
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
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <p>{user?.fullName || 'Kullanıcı'}</p>
            <span>{user?.roles?.[0] || 'Kullanıcı'}</span>
          </div>
          <button className="btn-icon" onClick={handleLogout} title="Çıkış Yap">
            <FiLogOut />
          </button>
        </div>
      </div>
    </aside>
  );
}
