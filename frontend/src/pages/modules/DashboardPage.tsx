import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { dashboardAPI } from '../../services/api';
import { 
  FiActivity, FiArrowUpRight, FiArrowDownRight,
  FiDollarSign, FiZap, FiTarget,
  FiShoppingBag, FiTrendingUp, FiCheckCircle,
  FiUsers, FiBox, FiShoppingCart, FiCalendar,
  FiAlertCircle
} from 'react-icons/fi';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import { Decimal } from 'decimal.js';
import { queryKeys } from '../../services/queryKeys';
import { formatCurrency, calculateTrend } from '../../utils/formatters';
import { useSalesWizardStore } from '../../store/useSalesWizardStore';

dayjs.locale('tr');

interface DashboardStats {
  revenue: number;
  count: number;
  profit: number;
}

// Removed RecentAction interface

interface DashboardData {
  totalCustomers: number;
  totalSalesCount: number;
  todaySales: number;
  thisMonth: DashboardStats;
  lastMonth: DashboardStats;
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

interface QuickAction {
  label: string;
  icon: React.ReactNode;
  path: string;
  action?: () => void;
  color: string;
  bg: string;
  hover: string;
  desc: string;
}

export default function DashboardPage() {
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [hoveredKpi, setHoveredKpi] = useState<number | null>(null);
  
  const { data, isLoading: loading, isError } = useQuery({
    queryKey: queryKeys.dashboard.summary,
    queryFn: async ({ signal }) => {
      const response = await dashboardAPI.getSummary({ signal });
      return response.data as DashboardData;
    }
  });

  const { progress, quote } = useMemo(() => {
    if (!data) return { progress: 0, quote: motivationQuotes['0-20'][0] };

    const calculateP = (current: number | string, previous: number | string) => {
      const cur = new Decimal(current || 0);
      const pre = new Decimal(previous || 0);
      if (pre.gt(0)) {
        return cur.div(pre).mul(100).toDecimalPlaces(0).toNumber();
      }
      return cur.gt(0) ? 100 : 0;
    };

    const pRevenue = calculateP(data.thisMonth?.revenue, data.lastMonth?.revenue);
    const pCount = calculateP(data.thisMonth?.count, data.lastMonth?.count);

    // Ortalama ilerleme (Hem ciro hem adet bazında genel performans)
    const p = Math.round((pRevenue + pCount) / 2);

    let b = '0-20';
    if (p < 20) b = '0-20';
    else if (p < 40) b = '20-40';
    else if (p < 60) b = '40-60';
    else if (p < 80) b = '60-80';
    else if (p < 100) b = '80-100';
    else if (p < 110) b = '100-110';
    else b = '110+';

    const quotes = motivationQuotes[b] || motivationQuotes['110+'];
    const q = quotes[Math.floor(Math.random() * quotes.length)];

    return { progress: p, quote: q };
  }, [data]);

  if (isError) {
    return (
      <div className="flex flex-col h-[400px] items-center justify-center gap-4 text-center px-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 border border-rose-100 animate-bounce">
          <FiAlertCircle size={24} />
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Veri Yüklenemedi</h3>
          <p className="text-xs font-bold text-slate-400 mt-1">Lütfen sayfayı yenilemeyi deneyin veya sistem yöneticinize danışın.</p>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-black text-xs rounded-xl shadow-sm transition-all"
        >
          YENİDEN DENE
        </button>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  const quickActions: (QuickAction | false)[] = [
    hasPermission('SALES_CREATE') && { 
      label: 'SATIŞ YAP', 
      icon: <FiShoppingCart />, 
      path: '/sales/wizard', 
      action: () => { useSalesWizardStore.getState().reset(); navigate('/sales/wizard'); }, 
      color: 'text-emerald-500', 
      bg: 'bg-emerald-50', 
      hover: 'hover:border-emerald-200', 
      desc: 'Hızlı Satış Ekranı' 
    },
    hasPermission('PARTIES_CREATE') && { 
      label: 'YENİ CARİ EKLE', 
      icon: <FiUsers />, 
      path: '/parties', 
      action: undefined, 
      color: 'text-blue-500', 
      bg: 'bg-blue-50', 
      hover: 'hover:border-blue-200', 
      desc: 'Müşteri veya Tedarikçi' 
    },
  ];

  return (
    <div className="animate-in px-8 pb-16 max-w-[1600px] mx-auto space-y-8 pt-4">
      
      {/* 🔹 HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-slate-500 font-medium mt-1">Hoş geldiniz, {user?.fullName}. {user?.roles?.includes('admin') ? 'İşte sistem geneli özeti.' : 'İşte bugünün özeti.'}</p>
        </div>
        <div className="text-sm font-bold text-slate-400 uppercase tracking-widest bg-white border border-slate-100 px-4 py-2 rounded-xl shadow-sm">
          {dayjs().format('DD MMMM YYYY')}
        </div>
      </div>

      {/* 🔹 ROW 1: QUICK ACTIONS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        {quickActions.filter((act): act is QuickAction => Boolean(act)).map((act, i) => (
          <div 
            key={i} 
            className={`group p-5 bg-white border border-slate-100 rounded-3xl shadow-sm ${act.hover} transition-colors cursor-pointer flex items-center gap-4`}
            onClick={() => act.action ? act.action() : navigate(act.path)}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-colors ${act.bg} ${act.color}`}>
              {act.icon}
            </div>
            <div>
              <div className="font-black text-sm text-slate-800 tracking-tight leading-tight">{act.label}</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{act.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 🔹 ROW 2: MONTHLY COMPARISON CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        
        {/* GEÇEN AY */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6 opacity-80">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
              <FiCalendar />
            </div>
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Geçen Ay</h2>
          </div>
          
          <div className="flex flex-col gap-3">
            {[
              { label: 'SATIŞ ADEDİ', value: data?.lastMonth?.count || 0, isMoney: false },
              { label: 'AYLIK CİRO', value: data?.lastMonth?.revenue || 0, isMoney: true },
            ].map((kpi, i) => (
              <div 
                key={i} 
                className={`flex justify-between items-center p-4 rounded-2xl bg-slate-50/50 border transition-all duration-300 ${hoveredKpi === i ? 'border-slate-300 bg-slate-100/50' : 'border-slate-100'}`}
                onMouseEnter={() => setHoveredKpi(i)}
                onMouseLeave={() => setHoveredKpi(null)}
              >
                <span className={`text-[10px] font-black uppercase tracking-widest transition-colors duration-300 ${hoveredKpi === i ? 'text-slate-600' : 'text-slate-400'}`}>{kpi.label}</span>
                <span className={`text-lg font-black tabular-nums transition-all duration-300 origin-right ${hoveredKpi === i ? 'text-slate-800 scale-125' : 'text-slate-500'}`}>
                  {kpi.isMoney ? formatCurrency(kpi.value) : kpi.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* BU AY */}
        <div className="bg-white border border-blue-100 rounded-3xl shadow-[0_8px_30px_rgb(59,130,246,0.08)] p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-50/50 rounded-full blur-3xl -z-10"></div>
          
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 border border-blue-100">
                <FiActivity />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest text-blue-600">Bu Ay</h2>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            {[
              { label: 'SATIŞ ADEDİ', current: data?.thisMonth?.count || 0, last: data?.lastMonth?.count || 0, isMoney: false },
              { label: 'AYLIK CİRO', current: data?.thisMonth?.revenue || 0, last: data?.lastMonth?.revenue || 0, isMoney: true },
            ].map((kpi, i) => {
              const trend = calculateTrend(kpi.current, kpi.last);
              const isPositive = trend >= 0;
              return (
                <div 
                  key={i} 
                  className={`flex justify-between items-center p-4 rounded-2xl bg-white border shadow-sm transition-all duration-300 cursor-default ${hoveredKpi === i ? 'border-blue-300 shadow-md' : 'border-slate-100 hover:border-blue-200'}`}
                  onMouseEnter={() => setHoveredKpi(i)}
                  onMouseLeave={() => setHoveredKpi(null)}
                >
                  <span className={`text-[10px] font-black uppercase tracking-widest transition-colors duration-300 ${hoveredKpi === i ? 'text-blue-600' : 'text-slate-600'}`}>{kpi.label}</span>
                  <div className="flex items-center gap-4">
                    <span className={`text-xl font-black tabular-nums transition-all duration-300 origin-right ${hoveredKpi === i ? 'text-blue-600 scale-125' : 'text-slate-900'}`}>
                      {kpi.isMoney ? formatCurrency(kpi.current) : kpi.current}
                    </span>
                    <div className="w-[4.5rem] flex justify-end">
                      <div className={`px-2 py-1 rounded-lg text-[9px] font-black flex items-center gap-0.5 border transition-transform duration-300 ${
                          isPositive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                        } ${hoveredKpi === i ? 'scale-110 origin-right' : ''}`}>
                          {isPositive ? <FiArrowUpRight /> : <FiArrowDownRight />}
                          %{Math.abs(trend)}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>

      {/* 🔹 ROW 3: BENTO SPLIT (PERFORMANCE & MINI KPIS) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Performance Widget (Left - 2/3) */}
        <div className="xl:col-span-2 bg-white border border-slate-100 rounded-3xl p-8 shadow-sm flex flex-col justify-between min-h-[280px]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
            <div>
              <div className="inline-block px-3 py-1 rounded-lg bg-slate-50 border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                AYLIK PERFORMANS SKORU
              </div>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-800 leading-tight">
                Hedefinize ulaşıyor musunuz?
              </h3>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-5xl sm:text-6xl font-black tracking-tighter text-slate-900 flex items-baseline">
                <span className="text-2xl sm:text-3xl text-slate-300 mr-1">%</span>{progress}
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">HEDEF TAMAMLANMA</div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-slate-800 rounded-full transition-all duration-1000 ease-out relative"
                style={{ width: `${Math.min(progress, 100)}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
              </div>
            </div>
            <p className="text-sm font-semibold text-slate-500 italic">
              "{quote}"
            </p>
          </div>
        </div>

        {/* Mini KPIs (Right - 1/3) */}
        <div className="flex flex-col gap-4">
           {[
             { label: 'TOPLAM MÜŞTERİ', value: data?.totalCustomers || 0, icon: <FiUsers />, color: 'text-blue-500', bg: 'bg-blue-50', isMoney: false },
             { label: 'TOPLAM SATIŞ', value: data?.totalSalesCount || 0, icon: <FiShoppingCart />, color: 'text-emerald-500', bg: 'bg-emerald-50', isMoney: false },
             { label: 'GÜNÜN CİROSU', value: data?.todaySales || 0, icon: <FiDollarSign />, color: 'text-indigo-500', bg: 'bg-indigo-50', isMoney: true },
           ].map((stat, i) => (
             <div key={i} className="flex-1 bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex items-center justify-between">
               <div className="flex items-center gap-4">
                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${stat.bg} ${stat.color}`}>
                   {stat.icon}
                 </div>
                 <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</div>
               </div>
               <div className="text-xl font-black text-slate-800 tabular-nums">
                 {stat.isMoney ? formatCurrency(stat.value) : stat.value}
               </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}