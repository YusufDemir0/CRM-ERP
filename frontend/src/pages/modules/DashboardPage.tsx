import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dashboardAPI } from '../../services/api';
import { 
  FiUsers, FiActivity, FiArrowUpRight, FiClock, FiCalendar, 
  FiDollarSign, FiTrendingUp, FiZap, FiTarget,
  FiShoppingBag, FiInfo, FiLayers, FiCreditCard
} from 'react-icons/fi';
import dayjs from 'dayjs';

interface DashboardStats {
  revenue: number;
  count: number;
  profit: number;
}

interface RecentAction {
  id: number;
  code: string;
  type: 'in' | 'out' | 'other';
  amount: number;
  date: string;
  partyName: string;
  referenceType: string;
  description: string;
}

interface DashboardData {
  totalUsers: number;
  totalParties: number;
  totalItems: number;
  todaySales: number;
  thisMonth: DashboardStats;
  lastMonth: DashboardStats;
  recentActions: RecentAction[];
}

const motivationQuotes: Record<string, string[]> = {
  '0-20': [
    "Başlangıç yapıldı, şimdi hızlanma zamanı.",
    "İlk adımı attın, devamını getirelim.",
    "Yolun başındasın, her büyük başarı küçük bir adımla başlar.",
    "Hadi, motorları ısıtalım!"
  ],
  '20-40': [
    "İyi gidiyorsun ama daha fazlası mümkün.",
    "Potansiyelin var, biraz daha zorla.",
    "Ritim yakalamaya başladın, tempo artırabiliriz.",
    "Gelişimi hisset, durmak yok!"
  ],
  '40-60': [
    "Yarısına geldin, sakın bırakma.",
    "Hedef artık görünmeye başladı, odağını koru.",
    "Dengeli gidiyorsun, şimdi vites büyütme vakti.",
    "Dönüm noktasındasın, azimle devam!"
  ],
  '60-80': [
    "Ciddi ilerleme, bu hızla devam et.",
    "Hedefe çok yaklaştın, durmak sana yakışmaz.",
    "Performansın yükseliyor, momentum artık seninle.",
    "Göz kamaştıran bir gayret, böyle devam!"
  ],
  '80-100': [
    "Son düzlüktesin, şimdi bitirme zamanı.",
    "Bu ay senin ayın, tarih yazıyorsun.",
    "Zirveye ramak kaldı, tüm gücünü topla.",
    "Mükemmel bir final bizi bekliyor, harikasın!"
  ],
  '100-110': [
    "Hedef tamam! Şimdi fark yaratma zamanı.",
    "Standartları aştın, sınır tanımıyorsun!",
    "Limitleri zorladın, şirket vizyonunu yukarı taşıyorsun.",
    "Kendi rekorunu kırdın, yeni hedefler seni bekler!"
  ],
  '110+': [
    "Sen artık oyunu değiştiren taraftasın.",
    "Bu performans üst seviye, efsaneleşiyorsun!",
    "Diğerlerinden tamamen ayrıldın, zirve senin evin.",
    "Kusursuz icraat! Başarın tüm ekibe ilham veriyor."
  ]
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const response = await dashboardAPI.getSummary();
        setData(response.data);
      } catch (error) {
        console.error("Dashboard verisi alınamadı:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  const { progress, quote, color, gradient } = useMemo(() => {
    if (!data) {
      return { 
        progress: 0, 
        quote: motivationQuotes['0-20'][0], 
        color: '#94a3b8',
        gradient: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)'
      };
    }

    // Fix: If last month was 0 and this month has revenue, it's 100% growth (or more)
    let p = 0;
    if (data.lastMonth && data.lastMonth.revenue > 0) {
      p = Math.round((data.thisMonth.revenue / data.lastMonth.revenue) * 100);
    } else if (data.thisMonth && data.thisMonth.revenue > 0) {
      p = 100;
    }

    let b = '0-20';
    let c = '#94a3b8';
    let g = 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)';

    if (p < 20) { b = '0-20'; c = '#94a3b8'; g = 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)'; }
    else if (p < 40) { b = '20-40'; c = '#f97316'; g = 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'; }
    else if (p < 60) { b = '40-60'; c = '#eab308'; g = 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)'; }
    else if (p < 80) { b = '60-80'; c = '#22c55e'; g = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'; }
    else if (p < 100) { b = '80-100'; c = '#3b82f6'; g = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'; }
    else if (p < 110) { b = '100-110'; c = '#a855f7'; g = 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)'; }
    else { b = '110+'; c = '#10b981'; g = 'linear-gradient(135deg, #10b981 0%, #059669 100%)'; }

    const quotes = motivationQuotes[b];
    const q = quotes[Math.floor(Math.random() * quotes.length)];

    return { progress: p, quote: q, color: c, gradient: g };
  }, [data]);

  if (loading || !data) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  const formatCurrency = (val: any) => {
    const num = Number(val || 0);
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(num);
  };

  return (
    <div className="page-container" style={{ maxWidth: '1400px', margin: '0 auto', background: 'transparent', boxShadow: 'none', border: 'none' }}>
      
      {/* 🟢 TOP SECTION: WELCOME & QUICK ACTIONS */}
      <div style={{ marginBottom: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="badge" style={{ background: 'var(--surface-container-highest)', color: 'var(--primary)', marginBottom: '16px', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: '12px' }}>
            <FiCalendar /> {dayjs().format('D MMMM YYYY')}
          </div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-1.5px', color: 'var(--on-surface)', lineHeight: 1.2, marginBottom: '8px' }}>
            Merhaba, <span style={{ color: 'var(--primary)' }}>{user?.fullName?.split(' ')[0] || 'Kullanıcı'}</span> 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', fontWeight: 500 }}>
            İşletmenizin nabzı burada atıyor. Bugün her şey kontrol altında.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '16px' }}>
           <button 
              className="btn" 
              disabled 
              style={{ 
                height: '56px', 
                padding: '0 24px', 
                fontSize: '1rem', 
                borderRadius: '16px', 
                background: 'var(--primary)', 
                color: 'white', 
                opacity: 0.8, 
                cursor: 'not-allowed', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                border: 'none',
                boxShadow: '0 8px 16px rgba(77, 68, 227, 0.2)'
              }}
            >
              <FiZap size={20} /> HIZLI SATIŞ YAP
            </button>
        </div>
      </div>

      {/* 🟠 COMPARISON GRID: PREMIUM CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '32px' }}>
        
        {/* GEÇEN AY - SLEEK CARD */}
        <div className="table-card" style={{ padding: '40px', background: 'white', position: 'relative', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div>
              <p style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>ÖNCEKİ DÖNEM</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--on-surface)' }}>{dayjs().subtract(1, 'month').format('MMMM YYYY')}</h3>
            </div>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
              <FiClock size={28} />
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '4px' }}>{formatCurrency(data.lastMonth.revenue)}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700 }}>TOPLAM CİRO</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '4px' }}>{data.lastMonth.count}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700 }}>İŞLEM ADEDİ</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '4px', color: '#10b981' }}>{formatCurrency(data.lastMonth.profit)}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700 }}>NET KÂR</div>
            </div>
          </div>
        </div>

        {/* BU AY - VIBRANT CARD */}
        <div className="table-card" style={{ 
          padding: '40px', 
          background: 'var(--primary)', 
          color: 'white', 
          position: 'relative', 
          border: 'none', 
          boxShadow: '0 20px 50px rgba(77, 68, 227, 0.25)',
          overflow: 'hidden'
        }}>
          {/* Decorative Pattern */}
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }}></div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', position: 'relative', zIndex: 1 }}>
            <div>
              <p style={{ fontSize: '0.85rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '1px' }}>GÜNCEL DURUM</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 900 }}>{dayjs().format('MMMM YYYY')}</h3>
            </div>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <FiTrendingUp size={28} />
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', position: 'relative', zIndex: 1 }}>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '4px' }}>{formatCurrency(data.thisMonth.revenue)}</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: 700 }}>TOPLAM CİRO</div>
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '4px' }}>{data.thisMonth.count}</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: 700 }}>İŞLEM ADEDİ</div>
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '4px', color: '#4ade80' }}>{formatCurrency(data.thisMonth.profit)}</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: 700 }}>NET KÂR</div>
            </div>
          </div>
        </div>
      </div>

      {/* 🔵 PROGRESS & DYNAMIC MOTIVATION (GLASSMORPHISM) */}
      <div style={{ 
        marginBottom: '48px', 
        padding: '40px', 
        borderRadius: '32px', 
        background: 'rgba(255, 255, 255, 0.4)', 
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.5)',
        boxShadow: '0 30px 60px rgba(0, 52, 94, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Aylık Büyüme Performanceansı</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '2.8rem', fontWeight: 900, color: color, letterSpacing: '-2px' }}>%{progress}</span>
              <div style={{ background: color + '20', color: color, padding: '4px 12px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 800 }}>
                {progress >= 100 ? (data.lastMonth.revenue === 0 ? 'YENI BAŞLANGIÇ' : 'HEDEF AŞILDI') : 'İLERLEME'}
              </div>
            </div>
          </div>
          <div style={{ flex: 1, textAlign: 'right', paddingLeft: '40px' }}>
            <div style={{ 
              fontSize: '1.4rem', 
              fontWeight: 700, 
              lineHeight: 1.4, 
              color: 'var(--on-surface)',
              fontStyle: 'italic'
            }}>
              "{quote}"
            </div>
          </div>
        </div>
        
        <div style={{ position: 'relative', height: '24px', background: 'rgba(0,0,0,0.05)', borderRadius: '12px', padding: '4px' }}>
          <div style={{ 
            height: '100%', 
            width: `${Math.min(progress, 100)}%`, 
            background: gradient, 
            borderRadius: '8px',
            transition: 'width 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
            boxShadow: `0 10px 20px ${color}40`,
            position: 'relative'
          }}>
            <div style={{ position: 'absolute', right: '0', top: '-40px', background: color, color: 'white', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 900 }}>
              GÜNCEL
            </div>
          </div>
        </div>
      </div>

      {/* 🟣 QUICK STATS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '48px' }}>
        {[
          { icon: <FiShoppingBag />, label: 'TOPLAM SATIŞ', val: data.thisMonth.count, color: 'var(--primary)', bg: 'var(--primary-glow)' },
          { icon: <FiUsers />, label: 'AKTİF MÜŞTERİ', val: data.totalParties, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
          { icon: <FiLayers />, label: 'ÜRÜN SAYISI', val: data.totalItems, color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.1)' },
          { icon: <FiCreditCard />, label: 'GÜNLÜK CİRO', val: formatCurrency(data.todaySales), color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' }
        ].map((stat, i) => (
          <div key={i} className="table-card" style={{ padding: '24px', border: 'none', display: 'flex', alignItems: 'center', gap: '20px', transition: 'transform 0.2s' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: stat.bg, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
              {stat.icon}
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                {typeof stat.val === 'string' ? stat.val : Number(stat.val || 0).toLocaleString('tr-TR')}
              </div>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 🔴 RECENT ACTIONS SECTION */}
      <div className="table-card" style={{ padding: '40px', border: 'none', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
           <div>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--on-surface)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FiActivity size={32} color="var(--primary)" /> SON HAREKETLER
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>İşletmenizdeki son 10 ticari faaliyet.</p>
           </div>
           <div style={{ textAlign: 'right' }}>
              <button 
                className="btn-icon circle" 
                onClick={() => window.location.href='/transactions'}
                title="Tümünü Gör"
              >
                <FiActivity size={20} />
              </button>
           </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {data.recentActions.length > 0 ? data.recentActions.map((t, idx) => (
            <div key={idx} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '24px', 
              padding: '20px', 
              background: 'var(--surface-container-low)', 
              borderRadius: '20px',
              border: '1px solid transparent',
              transition: 'all 0.2s ease'
            }} className="hover-lift">
              <div style={{ 
                width: '52px', 
                height: '52px', 
                borderRadius: '16px', 
                background: t.type === 'in' ? '#d1fae5' : t.type === 'out' ? '#fee2e2' : '#f1f5f9', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: t.type === 'in' ? '#10b981' : t.type === 'out' ? '#ef4444' : '#64748b', 
                fontSize: '24px' 
              }}>
                {t.type === 'in' ? <FiArrowUpRight /> : t.type === 'out' ? <FiArrowUpRight style={{ transform: 'rotate(90deg)' }} /> : <FiInfo />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--on-surface)' }}>{t.partyName}</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 900, background: 'var(--surface-container-highest)', color: 'var(--primary)', padding: '2px 10px', borderRadius: '8px', letterSpacing: '0.5px' }}>{t.code}</span>
                </div>
                <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{t.description || 'İşlem detayı yok'}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: t.type === 'in' ? '#10b981' : t.type === 'out' ? '#ef4444' : 'var(--on-surface)', letterSpacing: '-0.5px' }}>
                  {t.type === 'in' ? '+' : t.type === 'out' ? '-' : ''}{formatCurrency(t.amount)}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                  <FiClock size={14} /> {dayjs(t.date).format('DD.MM.YYYY')}
                </div>
              </div>
            </div>
          )) : (
            <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
              <FiClock size={64} style={{ opacity: 0.1, marginBottom: '24px' }} />
              <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>Son işlem kaydı bulunamadı.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}