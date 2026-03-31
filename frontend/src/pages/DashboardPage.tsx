import { useAuth } from '../context/AuthContext';
import {
  FiUsers, FiShoppingCart, FiPackage, FiDollarSign,
  FiTrendingUp, FiAlertTriangle, FiActivity, FiLayers
} from 'react-icons/fi';

export default function DashboardPage() {
  const { user } = useAuth();

  const stats = [
    { label: 'Toplam Kullanıcı', value: '—', icon: <FiUsers />, color: 'purple' },
    { label: 'Aktif Siparişler', value: '—', icon: <FiShoppingCart />, color: 'blue' },
    { label: 'Ürün Çeşidi', value: '—', icon: <FiPackage />, color: 'green' },
    { label: 'Toplam Cari', value: '—', icon: <FiDollarSign />, color: 'orange' },
    { label: 'Günlük İşlem', value: '—', icon: <FiActivity />, color: 'blue' },
    { label: 'Kritik Stok', value: '—', icon: <FiAlertTriangle />, color: 'red' },
    { label: 'Departmanlar', value: '—', icon: <FiLayers />, color: 'purple' },
    { label: 'Aylık Ciro', value: '—', icon: <FiTrendingUp />, color: 'green' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Hoş Geldiniz, {user?.fullName?.split(' ')[0] || 'Kullanıcı'}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            Ermay ERP Yönetim Paneline hoş geldiniz
          </p>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((stat) => (
          <div className="stat-card" key={stat.label}>
            <div className="stat-card-header">
              <span className="stat-card-label">{stat.label}</span>
              <div className={`stat-card-icon ${stat.color}`}>{stat.icon}</div>
            </div>
            <div className="stat-card-value">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="table-container" style={{ padding: 32, textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>
          📊 Dashboard verileri backend'e bağlandığında otomatik yüklenecektir.
        </p>
      </div>
    </div>
  );
}
