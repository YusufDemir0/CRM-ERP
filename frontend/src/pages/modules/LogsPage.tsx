import React, { useState } from 'react';
import { 
  FiRefreshCw, FiInfo, FiAlertTriangle, FiXCircle, FiCheckCircle, 
  FiSearch, FiActivity, FiShield, FiCpu, FiClock, FiFilter
} from 'react-icons/fi';
import { logsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DataTable, Column } from '../../components/common/DataTable';
import { PaginationControls } from '../../components/common/PaginationControls';
import { useSort } from '../../hooks/useSort';

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

export default function LogsPage() {
  const queryClient = useQueryClient();
  const [filterModule, setFilterModule] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sort, setSort] = useState<{ key: string; order: 'ASC' | 'DESC' }>({ key: 'createdAt', order: 'DESC' });

  const { data: logsData = [], isLoading: loading } = useQuery({
    queryKey: ['logs', page, limit, debouncedSearch, filterModule, sort],
    queryFn: async () => {
      const res = await logsAPI.getAll({ 
        page, 
        limit, 
        search: debouncedSearch,
        module: filterModule || undefined,
        sortBy: sort.key,
        sortOrder: sort.order
      });
      return res.data;
    },
    refetchInterval: 3000,
    staleTime: 0,
    refetchOnMount: 'always'
  });

  const logs = logsData?.data || [];
  const paginationMeta = logsData?.meta || { total: 0, page: 1, limit: 20, totalPages: 0 };

  const { sortedData, sortConfigs, toggleSort } = useSort<SystemLog>(
    logs, 
    [{ key: sort.key, direction: sort.order.toLowerCase() as 'asc' | 'desc' }],
    (configs) => {
      if (configs.length > 0) {
        setSort({ 
          key: configs[0].key, 
          order: configs[0].direction.toUpperCase() as 'ASC' | 'DESC' 
        });
        setPage(1);
      }
    }
  );

  React.useEffect(() => {
    // FE-09: Force refresh on mount for real-time monitoring
    queryClient.invalidateQueries({ queryKey: ['logs'] });
  }, [queryClient]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // FE-08: Empty Page Trap Fix
  React.useEffect(() => {
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
      header: 'ZAMAN DAMGASI', 
      className: 'tabular-nums',
      accessor: (log) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiClock size={14} color="var(--text-muted)" />
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--on-surface-variant)' }}>
            {new Date(log.createdAt).toLocaleString('tr-TR', { 
              day: '2-digit', month: '2-digit', year: 'numeric', 
              hour: '2-digit', minute: '2-digit', second: '2-digit' 
            })}
          </span>
        </div>
      ),
      sortKey: 'createdAt'
    },
    { 
      header: 'ÖNCELİK', 
      accessor: (log) => (
        <span style={{ 
          ...getTagStyle(log.tag), 
          display: 'inline-flex', alignItems: 'center', gap: '6px', 
          fontWeight: 900, fontSize: '10px', padding: '4px 10px',
          borderRadius: '8px', textTransform: 'uppercase', letterSpacing: '0.05em'
        }}>
          {getTagIcon(log.tag)} {log.tag}
        </span>
      ),
      sortKey: 'tag'
    },
    { 
      header: 'OPERATÖR', 
      accessor: (log) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ 
            width: '32px', height: '32px', borderRadius: '50%', 
            background: 'var(--surface-container)', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800
          }}>
            {(log.fullName || log.username || 'S')[0].toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 800, fontSize: '13px', color: 'var(--on-surface)' }}>{log.fullName || log.username || 'SİSTEM'}</span>
            <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700 }}>{log.ipAddress || 'INTERNAL'}</span>
          </div>
        </div>
      ),
      sortKey: 'username'
    },
    { 
      header: 'AKTİVİTE / MODÜL', 
      accessor: (log) => (
        <div>
          <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '13px' }}>{log.action}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--text-muted)', fontWeight: 800 }}>
            <FiCpu size={10} /> {log.module?.toUpperCase() || 'SİSTEM ÇEKİRDEĞİ'}
          </div>
        </div>
      ),
      sortKey: 'action'
    },
    { 
      header: 'İŞLEM DETAYLARI', 
      accessor: (log) => (
        <div style={{ 
          fontSize: '12px', color: 'var(--on-surface-variant)', fontWeight: 500, 
          maxWidth: '300px', whiteSpace: 'normal', lineHeight: '1.4' 
        }}>
          {log.details || 'EK VERİ YOK'}
        </div>
      )
    }
  ];

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* 🔴 HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ 
            display: 'inline-flex', alignItems: 'center', gap: '8px', 
            background: 'var(--error-glow)', color: 'var(--error)', 
            padding: '6px 14px', borderRadius: '12px', fontSize: '12px', 
            fontWeight: 800, marginBottom: '16px'
          }}>
            <FiShield /> AUDIT TRAIL & DENETİM
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--on-surface)' }}>
            Sistem <span style={{ color: 'var(--primary)' }}>Aktivite Logları</span>
          </h1>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="glass-panel" style={{ padding: '4px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '8px', background: 'white' }}>
            <FiFilter style={{ marginLeft: '12px', color: 'var(--text-muted)' }} />
            <select 
              value={filterModule}
              onChange={e => { setFilterModule(e.target.value); setPage(1); }}
              style={{ 
                border: 'none', background: 'transparent', height: '36px', 
                fontSize: '13px', fontWeight: 700, paddingRight: '20px', cursor: 'pointer'
              }}
            >
              <option value="">TÜM MODÜLLERİ GÖSTER</option>
              {modules.map(m => (
                <option key={m} value={m}>{m.toUpperCase()}</option>
              ))}
            </select>
          </div>
          <button 
            className="btn btn-secondary circle" 
            style={{ width: '44px', height: '44px', background: 'white' }}
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['logs'] });
              toast.success('Loglar güncellendi');
            }}
          >
            <FiRefreshCw />
          </button>
        </div>
      </div>
      
      {/* 🟠 SEARCH BAR */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: '24px' }}>
        <div style={{ position: 'relative' }}>
          <FiSearch style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Kullanıcı adı, işlem veya detay içeriği ile ara..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '48px', height: '52px', border: 'none', background: 'var(--surface-container-low)' }}
          />
        </div>
      </div>

      {/* 🟡 DATA TABLE SECTION */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <DataTable<SystemLog>
          data={sortedData}
          columns={columns}
          isLoading={loading}
          sortConfigs={sortConfigs}
          onSort={toggleSort}
          getRowKey={(log) => log.id}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <PaginationControls 
            meta={paginationMeta} 
            onPageChange={setPage} 
            onLimitChange={setLimit} 
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}
