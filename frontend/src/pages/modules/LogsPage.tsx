import { useState, useDeferredValue, useEffect } from 'react';
import { 
  FiRefreshCw, FiInfo, FiAlertTriangle, FiXCircle, FiCheckCircle, 
  FiSearch, FiActivity, FiShield, FiCpu, FiClock, FiFilter, FiGlobe, FiUser
} from 'react-icons/fi';
import { logsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DataTable, Column } from '../../components/common/DataTable';
import { useSort } from '../../hooks/useSort';
import { queryKeys } from '../../services/queryKeys';
import { formatDisplayDateTime } from '../../utils/date.helper';
import { translateLog } from '../../utils/logTranslator';

interface SystemLog {
  id: number;
  userId: number;
  username: string;
  fullName: string;
  action: string;
  module: string;
  tag: string;
  details: string;
  ipAddress: string;
  createdAt: string;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function LogsPage() {
  const queryClient = useQueryClient();
  const [filterModule, setFilterModule] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearch = useDeferredValue(searchTerm);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sort, setSort] = useState<{ key: string; order: 'ASC' | 'DESC' }>({ key: 'createdAt', order: 'DESC' });

  const { data: logsData, isLoading: loading } = useQuery<PaginatedResponse<SystemLog>>({
    queryKey: queryKeys.logs.all({ page, limit, deferredSearch, filterModule, sort }),
    queryFn: async ({ signal }: { signal: AbortSignal }) => {
      const res = await logsAPI.getAll({ 
        page, 
        limit, 
        search: deferredSearch,
        module: filterModule || undefined,
        sortBy: sort.key,
        sortOrder: sort.order
      }, { signal });
      return res.data;
    },
    staleTime: 30000,
  });

  const logs = logsData?.data || [];
  const paginationMeta = logsData?.meta || { total: 0, page: 1, limit: 20, totalPages: 0 };

  const { sortedData, sortConfigs, toggleSort } = useSort<SystemLog>(
    logs, 
    [{ key: sort.key, direction: sort.order.toLowerCase() as 'asc' | 'desc' }],
    (configs: { key: string; direction: string }[]) => {
      if (configs.length > 0) {
        setSort({ 
          key: configs[0].key, 
          order: configs[0].direction.toUpperCase() as 'ASC' | 'DESC' 
        });
        setPage(1);
      }
    }
  );

  useEffect(() => {
    // FE-09: Force refresh on mount for real-time monitoring
    queryClient.invalidateQueries({ queryKey: queryKeys.logs.all({}) });
  }, [queryClient]);


  // FE-08: Empty Page Trap Fix
  useEffect(() => {
    if (!loading && logs.length === 0 && paginationMeta.total > 0 && page > 1) {
      setPage(prev => Math.max(1, prev - 1));
    }
  }, [logs.length, loading, page, paginationMeta.total]);

  const getTagStyle = (tag: string) => {
    switch(tag) {
      case 'WARNING': return { background: 'var(--warning-glow)', color: 'var(--warning)' };
      case 'ERROR':   return { background: 'var(--error-glow)', color: 'var(--error)' };
      case 'CRITICAL':return { background: '#7f1d1d', color: '#fca5a5' };
      case 'SUCCESS': return { background: 'var(--success-glow)', color: 'var(--success)' };
      default:        return { background: 'var(--primary-glow)', color: 'var(--primary)' };
    }
  };

  const getTagIcon = (tag: string) => {
    switch(tag) {
      case 'WARNING': return <FiAlertTriangle size={12} />;
      case 'ERROR':   return <FiXCircle size={12} />;
      case 'CRITICAL':return <FiXCircle size={12} />;
      case 'SUCCESS': return <FiCheckCircle size={12} />;
      default:        return <FiInfo size={12} />;
    }
  };

  // Fetch all modules for the dropdown (might need a separate endpoint for efficiency, but using current logs for now)
  const modules = ['auth', 'users', 'parties', 'items', 'sales', 'production', 'inventory', 'finance', 'system'];

  const columns: Column<SystemLog>[] = [
    { 
      header: 'ZAMAN & BAĞLANTI (IP)', 
      className: 'tabular-nums',
      accessor: (log) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <FiClock size={13} className="text-slate-400 shrink-0" />
            <span className="text-xs font-bold text-slate-800 tabular-nums">
              {formatDisplayDateTime(log.createdAt)}
            </span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px] font-bold w-fit border border-slate-200/60 shadow-2xs">
            <FiGlobe size={11} className="text-primary shrink-0" />
            <span>{log.ipAddress || '127.0.0.1'}</span>
          </div>
        </div>
      ),
      sortKey: 'createdAt'
    },
    { 
      header: 'DURUM', 
      accessor: (log) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
          log.tag === 'ERROR' || log.tag === 'CRITICAL' ? 'bg-red-100 text-red-600' :
          log.tag === 'WARNING' ? 'bg-amber-100 text-amber-600' :
          log.tag === 'SUCCESS' ? 'bg-emerald-100 text-emerald-600' :
          'bg-slate-100 text-slate-600'
        }`}>
          {getTagIcon(log.tag)} {log.tag}
        </span>
      ),
      sortKey: 'tag'
    },
    { 
      header: 'İŞLEMİ YAPAN HESAP', 
      accessor: (log) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-black text-primary shrink-0">
            {(log.fullName || log.username || 'S')[0].toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black text-slate-900 leading-tight">
              {log.fullName || log.username || 'SİSTEM'}
            </span>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 mt-0.5">
              <span className="text-primary font-semibold">@{log.username || 'system'}</span>
              <span className="text-slate-300">•</span>
              <span className="font-mono text-slate-500 flex items-center gap-1">
                <FiGlobe size={10} className="text-slate-400" />
                {log.ipAddress || '127.0.0.1'}
              </span>
            </div>
          </div>
        </div>
      ),
      sortKey: 'username'
    },
    { 
      header: 'YAPILAN İŞLEM & MODÜL', 
      accessor: (log) => {
        const translated = translateLog(log);
        return (
          <div>
            <div className="text-sm font-black text-slate-800 mb-0.5">{translated.title}</div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
              <FiCpu size={10} /> {log.module?.toUpperCase() || 'SİSTEM ÇEKİRDEĞİ'}
            </div>
          </div>
        );
      },
      sortKey: 'action'
    },
    { 
      header: 'İŞLEM DETAYLARI', 
      accessor: (log) => (
        <div className="text-xs font-medium text-slate-600 max-w-[320px] truncate-2-lines line-clamp-2" title={log.details || ''}>
          {log.details || 'Ek detay bulunmuyor.'}
        </div>
      )
    }
  ];

  return (
    <div className="animate-in flex flex-col gap-8">
      
      {/* 🔴 HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
            <FiShield /> AUDIT TRAIL & DENETİM
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-on-surface">
            Sistem <span className="text-primary">Aktivite Logları</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex-1 bg-white pl-4 pr-1 rounded-2xl border border-slate-100 shadow-premium flex items-center gap-2 min-w-[200px]">
            <FiFilter className="text-slate-400 shrink-0" />
            <select 
              value={filterModule}
              onChange={e => { setFilterModule(e.target.value); setPage(1); }}
              className="border-none bg-transparent h-12 w-full text-xs font-black text-slate-600 focus:ring-0 cursor-pointer uppercase tracking-tight"
            >
              <option value="">TÜM MODÜLLER</option>
              {modules.map(m => (
                <option key={m} value={m}>{m.toUpperCase()}</option>
              ))}
            </select>
          </div>
          <button 
            className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl border border-slate-100 text-slate-400 hover:text-primary transition-colors shadow-premium shrink-0"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: queryKeys.logs.all({}) });
              toast.success('Loglar güncellendi');
            }}
          >
            <FiRefreshCw className="hover:rotate-180 transition-transform duration-500" />
          </button>
        </div>
      </div>
      
      <div className="flex flex-col gap-4">
        <DataTable<SystemLog>
          data={sortedData}
          columns={columns}
          isLoading={loading}
          sortConfigs={sortConfigs}
          onSort={toggleSort}
          getRowKey={(log) => log.id}
          
          // Integrated Search & Pagination
          search={searchTerm}
          onSearchChange={setSearchTerm}
          total={paginationMeta.total}
          page={page}
          limit={limit}
          onPageChange={setPage}
          placeholder="Kullanıcı adı, işlem veya detay içeriği ile ara..."
        />
      </div>
    </div>
  );
}
