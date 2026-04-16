import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dashboardAPI } from '../../services/api';
import { 
  FiActivity, FiArrowUpRight, FiClock, FiCalendar, 
  FiDollarSign, FiZap, FiTarget,
  FiShoppingBag, FiInfo, FiTrendingUp, FiCheckCircle
} from 'react-icons/fi';
import dayjs from 'dayjs';
import { Decimal } from 'decimal.js';

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
  '0-20': ["Başlangıç yapıldı, şimdi hızlanma zamanı.", "İlk adımı attın, devamını getirelim."],
  '20-40': ["İyi gidiyorsun ama daha fazlası mümkün.", "Potansiyelin var, biraz daha zorla."],
  '40-60': ["Yarısına geldin, sakın bırakma.", "Hedef artık görünmeye başladı, odağını koru."],
  '60-80': ["Ciddi ilerleme, bu hızla devam et.", "Performansın yükseliyor, momentum artık seninle."],
  '80-100': ["Son düzlüktesin, şimdi bitirme zamanı.", "Bu ay senin ayın, tarih yazıyorsun."],
  '100-110': ["Hedef tamam! Şimdi fark yaratma zamanı.", "Standartları aştın, sınır tanımıyorsun!"],
  '110+': ["Sen artık oyunu değiştiren taraftasın.", "Bu performans üst seviye, efsaneleşiyorsun!"]
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const { data, isLoading: loading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const response = await dashboardAPI.getSummary();
      return response.data as DashboardData;
    }
  });

  const { progress, quote, gradient } = useMemo(() => {
    if (!data) return { progress: 0, quote: motivationQuotes['0-20'][0], gradient: 'var(--border)' };

    let p = 0;
    const thisMonthRevenue = new Decimal(data.thisMonth?.revenue || 0);
    const lastMonthRevenue = new Decimal(data.lastMonth?.revenue || 0);

    if (lastMonthRevenue.gt(0)) {
      p = thisMonthRevenue.div(lastMonthRevenue).mul(100).toDecimalPlaces(0).toNumber();
    } else if (thisMonthRevenue.gt(0)) {
      p = 100;
    }

    let b = '0-20';
    let g = 'var(--secondary)';

    if (p < 20) { b = '0-20'; g = 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)'; }
    else if (p < 50) { b = '20-40'; g = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'; }
    else if (p < 100) { b = '60-80'; g = 'var(--primary-gradient)'; }
    else { b = '110+'; g = 'linear-gradient(135deg, #10b981 0%, #059669 100%)'; }

    const quotes = motivationQuotes[b] || motivationQuotes['110+'];
    const q = quotes[Math.floor(Math.random() * quotes.length)];

    return { progress: p, quote: q, gradient: g };
  }, [data]);

  if (loading || !data) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  const formatCurrency = (val: number | string | null | undefined) => {
    const num = new Decimal(val || 0);
    return new Intl.NumberFormat('tr-TR', { 
      style: 'currency', 
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num.toNumber());
  };

  const calculateTrend = (current: number, previous: number) => {
    if (!previous || previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  return (
    <div className="animate-in px-5 pb-16 max-w-[1600px] mx-auto">
      
      {/* 🟠 TOP BAR: QUICK ACTIONS */}
      <div className="my-5 mb-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'YENİ CARİ EKLE', icon: <FiActivity />, path: '/parties', color: 'primary', desc: 'Müşteri veya Tedarikçi' },
          { label: 'YENİ ÜRÜN EKLE', icon: <FiZap />, path: '/items', color: '[#8b5cf6]', desc: 'Stok ve Hammadde' },
          { label: 'SATIŞ YAP', icon: <FiArrowUpRight />, path: '/sales', color: 'success', desc: 'Hızlı Satış Ekranı' },
          { label: 'HESAP HAREKETİ', icon: <FiDollarSign />, path: '/transactions', color: 'warning', desc: 'Ödeme veya Tahsilat' },
        ].map((act, i) => (
          <div 
            key={i} 
            className="group p-6 bg-white border border-surface-container rounded-3xl shadow-soft hover:shadow-premium hover:-translate-y-1 transition-all cursor-pointer flex items-center gap-4"
            onClick={() => navigate(act.path)}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-colors ${
              act.color === 'primary' ? 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white' : 
              act.color === 'success' ? 'bg-success/10 text-success group-hover:bg-success group-hover:text-white' :
              act.color === 'warning' ? 'bg-warning/10 text-warning group-hover:bg-warning group-hover:text-white' :
              'bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'
            }`}>
              {act.icon}
            </div>
            <div>
              <div className="font-black text-sm text-on-surface tracking-tight leading-tight">{act.label}</div>
              <div className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">{act.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 mb-10">
        
        {/* 🟡 PROGRESS & PERFORMANCE SECTION */}
        <div className="xl:col-span-2 relative overflow-hidden p-8 sm:p-12 rounded-4xl text-white shadow-2xl flex flex-col justify-center min-h-[320px]" style={{ background: gradient }}>
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 flex flex-col gap-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div>
                <div className="inline-block px-4 py-1.5 rounded-full bg-white/20 border border-white/30 text-[10px] font-black uppercase tracking-widest mb-4">
                  AYLIK PERFORMANS SKORU
                </div>
                <h3 className="text-3xl sm:text-5xl font-black tracking-tighter leading-tight">
                  Mükemmel Gidiyorsun, <br />İşte Bu Ayın Özeti!
                </h3>
              </div>
              <div className="text-left sm:text-right">
                <div className="text-6xl sm:text-8xl font-black tracking-tighter leading-none pulse-slow flex items-baseline">
                  <span className="text-3xl sm:text-4xl opacity-50 mr-1">%</span>{progress}
                </div>
                <div className="text-[10px] sm:text-xs font-black uppercase tracking-widest opacity-70 mt-2">HEDEF TAMAMLANMA</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="h-4 bg-white/15 rounded-full overflow-hidden border border-white/10 p-0.5">
                <div 
                  className="h-full bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.5)] transition-all duration-[2000ms] ease-out-back relative"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
                </div>
              </div>
              
              <p className="text-lg sm:text-xl font-medium italic opacity-90 leading-relaxed max-w-2xl">
                "{quote}"
              </p>
            </div>
          </div>
        </div>

        {/* 🟢 MINI KPI SECTION */}
        <div className="flex flex-col gap-5">
           {[
             { label: 'TOPLAM CARİ', value: data?.totalParties || 0, icon: <FiTarget />, color: 'primary' },
             { label: 'AKTİF ÜRÜNLER', value: data?.totalItems || 0, icon: <FiCheckCircle />, color: 'success' },
             { label: 'SİSTEM PERSONELİ', value: data?.totalUsers || 0, icon: <FiActivity />, color: '[#8b5cf6]' },
           ].map((stat, i) => (
             <div key={i} className="p-6 bg-white border border-surface-container rounded-3xl shadow-soft flex items-center gap-5">
               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${
                 stat.color === 'primary' ? 'bg-primary/10 text-primary' : 
                 stat.color === 'success' ? 'bg-success/10 text-success' : 
                 'bg-blue-100 text-blue-600'
               }`}>
                 {stat.icon}
               </div>
               <div>
                 <div className="text-xs font-black text-slate-400 uppercase tracking-widest">{stat.label}</div>
                 <div className="text-2xl font-black text-on-surface tabular-nums">{stat.value}</div>
               </div>
             </div>
           ))}
        </div>
      </div>

      {/* 🟣 KPI CARDS: CIRO, SATIŞ ADEDİ, KAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
        {[
          { label: 'AYLIK CİRO', current: data?.thisMonth?.revenue || 0, last: data?.lastMonth?.revenue || 0, icon: <FiDollarSign />, isMoney: true, color: 'primary' },
          { label: 'SATIŞ ADEDİ', current: data?.thisMonth?.count || 0, last: data?.lastMonth?.count || 0, icon: <FiShoppingBag />, isMoney: false, color: '[#8b5cf6]' },
          { label: 'TAHMİNİ KAR', current: data?.thisMonth?.profit || 0, last: data?.lastMonth?.profit || 0, icon: <FiTrendingUp />, isMoney: true, color: 'success' },
        ].map((kpi, idx) => {
          const trend = calculateTrend(kpi.current, kpi.last);
          return (
            <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-surface-container shadow-soft hover:shadow-premium transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border ${
                  kpi.color === 'primary' ? 'bg-primary/5 text-primary border-primary/10' :
                  kpi.color === 'success' ? 'bg-success/5 text-success border-success/10' :
                  'bg-blue-50 text-blue-600 border-blue-100'
                }`}>
                  {kpi.icon}
                </div>
                <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-1 ${
                  trend >= 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                }`}>
                  {trend >= 0 ? <FiArrowUpRight /> : <FiArrowUpRight className="rotate-90" />}
                  %{Math.abs(trend)}
                </div>
              </div>
              <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</div>
              <div className="text-3xl sm:text-4xl font-black text-on-surface tracking-tighter tabular-nums truncate">
                {kpi.isMoney ? formatCurrency(kpi.current) : kpi.current}
              </div>
              <div className="mt-6 pt-6 border-t border-slate-50 flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                <span className="text-slate-300">GEÇEN AY</span>
                <span className="text-on-surface-variant font-black">
                  {kpi.isMoney ? formatCurrency(kpi.last) : kpi.last}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 🔴 RECENT ACTIONS SECTION */}
      <div className="bg-white p-8 sm:p-10 rounded-4xl border border-surface-container shadow-soft">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
          <div>
            <h3 className="text-2xl font-black tracking-tighter text-on-surface flex items-center gap-3">
              <FiActivity className="text-3xl text-primary" /> SON TİCARİ HAREKETLER
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Sistemdeki en güncel 5 finansal işlem</p>
          </div>
          <button 
            className="h-14 px-8 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95"
            onClick={() => navigate('/transactions')}
          >
            Tüm Kayıtları Gör
          </button>
        </div>

        <div className="space-y-3">
          {data?.recentActions?.map((t) => (
            <div 
              key={t.id} 
              onClick={() => navigate('/transactions')} 
              className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 bg-surface-low/50 hover:bg-white rounded-3xl border border-transparent hover:border-surface-container hover:shadow-premium transition-all cursor-pointer"
            >
              <div className="flex items-center gap-6 w-full sm:w-auto">
                <div className="hidden sm:block text-[10px] font-black text-slate-400 uppercase leading-none text-center">
                  {dayjs(t.date).format('DD')}<br/>
                  <span className="text-[8px] opacity-60">{dayjs(t.date).format('MMM')}</span>
                </div>
                <div>
                  <div className="font-black text-on-surface group-hover:text-primary transition-colors">{t.partyName}</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{t.code}</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between sm:justify-end gap-10 w-full sm:w-auto mt-4 sm:mt-0">
                <div className={`px-3 py-1 rounded-lg text-[9px] font-black tracking-widest border ${
                  t.type === 'in' ? 'bg-success/10 text-success border-success/20' : 'bg-danger/10 text-danger border-danger/20'
                }`}>
                  {t.type === 'in' ? 'GİRİŞ' : 'ÇIKIŞ'}
                </div>
                <div className={`text-xl font-black tabular-nums tracking-tighter ${
                  t.type === 'in' ? 'text-success' : 'text-danger'
                }`}>
                  {t.type === 'in' ? '+' : '-'}{formatCurrency(t.amount)}
                </div>
                <div className="hidden lg:flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                  <FiCheckCircle className="text-success text-sm" /> TAMAMLANDI
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}