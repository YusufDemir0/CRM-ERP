import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  usersAPI, salesAPI, itemsAPI, partiesAPI, stocksAPI, departmentsAPI
} from '../services/api';
import {
  FiUsers, FiShoppingCart, FiPackage, FiDollarSign,
  FiTrendingUp, FiAlertTriangle, FiActivity, FiLayers
} from 'react-icons/fi';

export default function DashboardPage() {
  const { user } = useAuth();
  
  const [data, setData] = useState({
    users: 'Yükleniyor...',
    sales: 'Yükleniyor...',
    items: 'Yükleniyor...',
    parties: 'Yükleniyor...',
    criticalStocks: 'Yükleniyor...',
    departments: 'Yükleniyor...'
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const [u, s, i, p, c, d] = await Promise.all([
          usersAPI.getAll({ limit: 1 }).catch(() => ({ data: { meta: { total: '-' } } })),
          salesAPI.getAll({ limit: 1 }).catch(() => ({ data: { meta: { total: '-' } } })),
          itemsAPI.getAll({ limit: 1 }).catch(() => ({ data: { meta: { total: '-' } } })),
          partiesAPI.getAll({ limit: 1 }).catch(() => ({ data: { meta: { total: '-' } } })),
          stocksAPI.getCritical().catch(() => ({ data: [] })),
          departmentsAPI.getAll({ limit: 1 }).catch(() => ({ data: { meta: { total: '-' } } })),
        ]);

        setData({
          users: u.data?.meta?.total ?? u.data?.length ?? '-',
          sales: s.data?.meta?.total ?? s.data?.length ?? '-',
          items: i.data?.meta?.total ?? i.data?.length ?? '-',
          parties: p.data?.meta?.total ?? p.data?.length ?? '-',
          criticalStocks: Array.isArray(c.data) ? c.data.length.toString() : '-',
          departments: d.data?.meta?.total ?? d.data?.length ?? '-'
        });
      } catch (err) {
        console.error("Dashboard datası alınamadı", err);
      }
    }
    loadStats();
  }, []);

  const stats = [
    { label: 'Toplam Kullanıcı', value: data.users, icon: <FiUsers />, color: 'purple' },
    { label: 'Siparişler', value: data.sales, icon: <FiShoppingCart />, color: 'blue' },
    { label: 'Ürün Çeşidi', value: data.items, icon: <FiPackage />, color: 'green' },
    { label: 'Toplam Cari', value: data.parties, icon: <FiDollarSign />, color: 'orange' },
    { label: 'Departmanlar', value: data.departments, icon: <FiLayers />, color: 'purple' },
    { label: 'Kritik Stok Uyarıları', value: data.criticalStocks, icon: <FiAlertTriangle />, color: 'red' },
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
    </div>
  );
}
