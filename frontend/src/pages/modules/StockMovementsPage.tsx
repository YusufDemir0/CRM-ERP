import { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { stocksAPI } from '../../services/api';
import { 
  FiSearch, FiActivity, FiArrowUpCircle, FiArrowDownCircle, FiFilter, FiCalendar
} from 'react-icons/fi';
import { StockMovement } from '../../types';
import { DataTable, Column } from '../../components/common/DataTable';
import { Decimal } from 'decimal.js';
import { queryKeys } from '../../services/queryKeys';
import { useDeferredValue } from 'react';

export default function StockMovementsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const page = Number(searchParams.get('page')) || 1;
  const searchTerm = searchParams.get('q') || '';
  const typeFilter = (searchParams.get('type') as 'in' | 'out' | 'all') || 'all';
  const limit = Number(searchParams.get('limit')) || 20;

  const deferredSearch = useDeferredValue(searchTerm);

  const updateParams = useCallback((newParams: Record<string, string | number | undefined>) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      Object.entries(newParams).forEach(([key, value]) => {
        if (value === undefined || value === '' || (key === 'page' && value === 1)) {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      });
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const setPage = (p: number) => updateParams({ page: p });
  const setTypeFilter = (type: string) => updateParams({ type, page: 1 });
  const setSearchTerm = (q: string) => updateParams({ q, page: 1 });

  const { data: movementsData, isLoading } = useQuery({
    queryKey: ['stockMovements', { page, limit, deferredSearch, typeFilter }],
    queryFn: async ({ signal }) => {
      const res = await stocksAPI.getAllMovements({
        page,
        limit,
        search: deferredSearch,
        type: typeFilter === 'all' ? undefined : typeFilter
      }, { signal });
      return res.data;
    }
  });

  const movements = movementsData?.data || [];
  const paginationMeta = movementsData?.meta || { total: 0, page: 1, limit: 20, totalPages: 0 };

  const columns: Column<StockMovement>[] = [
    { 
      header: 'TARİH / SAAT', 
      accessor: (m) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
            <FiCalendar />
          </div>
          <div>
            <div className="font-black text-on-surface text-sm">{new Date(m.createdAt).toLocaleDateString('tr-TR')}</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(m.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>
      ),
      sortKey: 'createdAt'
    },
    { 
      header: 'ÜRÜN / DEPO', 
      accessor: (m) => (
        <div>
          <div className="font-black text-on-surface text-sm uppercase tracking-tighter">{m.stock?.item?.name}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-primary font-bold uppercase tracking-widest bg-primary/5 px-1.5 py-0.5 rounded">
              {m.stock?.department?.name}
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">#{m.stock?.item?.code}</span>
          </div>
        </div>
      )
    },
    { 
      header: 'İŞLEM TÜRÜ', 
      accessor: (m) => (
        <div className="flex items-center gap-2">
          {m.type === 'in' ? (
            <div className="flex items-center gap-2 text-success">
              <FiArrowUpCircle size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">STOK GİRİŞİ</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-danger">
              <FiArrowDownCircle size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">STOK ÇIKIŞI</span>
            </div>
          )}
        </div>
      ),
      sortKey: 'type'
    },
    { 
      header: 'MİKTAR', 
      accessor: (m) => {
        const formatDecimal = (val: any) => {
          if (val === null || val === undefined) return '0';
          let numStr = '0';
          if (typeof val === 'object') {
            numStr = val.value !== undefined ? String(val.value) : (val.amount !== undefined ? String(val.amount) : '0');
          } else {
            numStr = String(val);
          }
          try {
            return new Decimal(numStr).toNumber().toLocaleString('tr-TR');
          } catch (e) {
            return '0';
          }
        };
        return (
          <div className="text-right">
            <div className={`text-sm font-black tabular-nums ${m.type === 'in' ? 'text-success' : 'text-danger'}`}>
              {m.type === 'in' ? '+' : '-'}{formatDecimal(m.quantity)}
            </div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
               {formatDecimal(m.quantityAfter)} KALAN
            </div>
          </div>
        );
      },
      className: 'text-right'
    },
    { 
      header: 'AÇIKLAMA / REFERANS', 
      accessor: (m) => (
        <div className="max-w-xs">
          <div className="text-xs font-bold text-on-surface-variant line-clamp-1 uppercase tracking-tight">{m.description || 'MANUEL İŞLEM'}</div>
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
            {m.referenceType.toUpperCase()} {m.referenceId ? `#${m.referenceId}` : ''}
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="animate-in flex flex-col gap-8">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
            <FiActivity /> ENVANTER TARİHÇESİ
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-on-surface">
            Stok <span className="text-primary">Hareketleri</span>
          </h1>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex bg-surface-container-low p-1 rounded-2xl border border-surface-container">
            {[
              { id: 'all', label: 'Tümü', icon: <FiFilter /> },
              { id: 'in', label: 'Girişler', icon: <FiArrowUpCircle /> },
              { id: 'out', label: 'Çıkışlar', icon: <FiArrowDownCircle /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTypeFilter(tab.id)}
                className={`h-9 px-4 rounded-xl text-xs font-black flex items-center gap-2 transition-colors ${
                  typeFilter === tab.id ? 'bg-white text-primary shadow-premium' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab.icon} {tab.label.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <DataTable<StockMovement>
          data={movements}
          columns={columns}
          isLoading={isLoading}
          getRowKey={(m) => m.id}
          search={searchTerm}
          onSearchChange={setSearchTerm}
          total={paginationMeta.total}
          page={page}
          limit={limit}
          onPageChange={setPage}
          placeholder="Ürün adı, kod veya açıklama ile ara..."
          virtualized={true}
          containerHeight={700}
        />
      </div>
    </div>
  );
}
