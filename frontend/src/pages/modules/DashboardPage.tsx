import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI, transactionsAPI } from '../../services/api';
import { FiUsers, FiShoppingCart, FiPackage, FiLayers, FiAlertTriangle, FiActivity, FiPlusCircle, FiArrowUpRight, FiClock, FiCalendar, FiDollarSign } from 'react-icons/fi';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState({ users: 0, salesCount: 0, items: 0, parties: 0, criticalStocks: 0, departments: 0 });
  const[recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Günaydın' : hour < 18 ? 'İyi Günler' : 'İyi Akşamlar';

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      try {
        const [summary, latestTx] = await Promise.all([
          dashboardAPI.getSummary().catch(() => ({ data: {} })),
          transactionsAPI.getAll({ limit: 5 }).catch(() => ({ data: { data: [] } })),
        ]);
        const s = summary.data;
        setData({
          users: s.users || 0, salesCount: s.transactions || 0, items: s.items || 0,
          parties: s.parties || 0, criticalStocks: s.criticalStocks || 0, departments: s.departments || 0
        });
        setRecentTransactions(latestTx.data?.data ||[]);
      } catch (err) { console.error("Dashboard datası alınamadı", err); } 
      finally { setLoading(false); }
    }
    loadDashboard();
  },[]);

  const stats =[
    { label: 'Aktif Sistem Kullanıcısı', value: data.users, icon: <FiUsers />, color: 'var(--primary)' },
    { label: 'Toplam Finansal İşlem', value: data.salesCount, icon: <FiActivity />, color: 'var(--success)' },
    { label: 'Kritik Stok Uyarısı', value: data.criticalStocks, icon: <FiAlertTriangle />, color: 'var(--danger)' },
    { label: 'Kayıtlı Cari Hesap', value: data.parties, icon: <FiLayers />, color: 'var(--warning)' },
  ];

  return (
    <div className="page-container" style={{ maxWidth: '1400px', margin: '0 auto', background: 'transparent', boxShadow: 'none', border: 'none' }}>
      
      <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div className="badge badge-accent" style={{ marginBottom: '12px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <FiCalendar /> {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-1px', color: 'var(--primary)' }}>
            {greeting}, {user?.fullName?.split(' ')[0] || 'Kullanıcı'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>ERP Operasyon merkeziniz hazır. Bugün sisteminizde neler oluyor?</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn" style={{ background: 'var(--surface-container-highest)' }} onClick={() => window.location.reload()}><FiActivity /> Ekranı Yenile</button>
          <button className="btn btn-primary" onClick={() => navigate('/sales')}><FiPlusCircle /> YENİ SİPARİŞ AÇ</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' }}>
        {stats.map((stat, idx) => (
          <div className="table-card" key={idx} style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ width: '48px', height: '48px', background: `${stat.color}20`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color, fontSize: '24px', marginBottom: '20px' }}>
              {stat.icon}
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--on-surface)', lineHeight: 1 }}>{loading ? '...' : stat.value}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 700, marginTop: '10px', textTransform: 'uppercase' }}>{stat.label}</div>
            <div style={{ position: 'absolute', bottom: '-20px', right: '-10px', fontSize: '120px', opacity: 0.03, pointerEvents: 'none', color: stat.color }}>{stat.icon}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Hızlı İşlemler */}
        <div className="table-card" style={{ padding: '32px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '32px' }}>HIZLI ERİŞİM VE İŞLEMLER</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <button className="btn" style={{ height: '100px', display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--surface-container-low)' }} onClick={() => navigate('/transactions')}>
              <FiDollarSign size={24} color="var(--success)" /> FİNANSAL İŞLEM
            </button>
            <button className="btn" style={{ height: '100px', display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--surface-container-low)' }} onClick={() => navigate('/items')}>
              <FiPackage size={24} color="var(--primary)" /> ÜRÜN & STOK KARTI
            </button>
            <button className="btn" style={{ height: '100px', display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--surface-container-low)' }} onClick={() => navigate('/parties')}>
              <FiUsers size={24} color="var(--warning)" /> YENİ CARİ (MÜŞTERİ)
            </button>
          </div>
        </div>

        {/* Son Hareketler */}
        <div className="table-card" style={{ padding: '32px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '32px' }}>SON FİNANS HAREKETLERİ</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentTransactions.length > 0 ? recentTransactions.map((t, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', background: 'var(--surface-container-low)', borderRadius: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: t.type === 'in' ? '#d1fae5' : '#ffe4e6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.type === 'in' ? '#10b981' : '#ef4444', fontWeight: 800 }}>
                  {t.type === 'in' ? <FiArrowUpRight /> : <FiArrowUpRight style={{ transform: 'rotate(90deg)' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--on-surface)' }}>{t.party?.name || 'BELİRSİZ'}</div>
                  <div style={{ fontSize: '0.75rem', color: 'gray', display: 'flex', alignItems: 'center', gap: '5px' }}><FiClock size={10} /> {new Date(t.date).toLocaleDateString()}</div>
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 900, color: t.type === 'in' ? 'var(--success)' : 'var(--danger)' }}>
                  {t.type === 'in' ? '+' : '-'}{Number(t.amount).toLocaleString('tr-TR')} ₺
                </div>
              </div>
            )) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'gray', fontSize: '0.9rem' }}>Henüz kayıt yok.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}