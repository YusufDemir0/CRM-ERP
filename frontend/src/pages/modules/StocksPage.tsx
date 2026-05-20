import { useState, useEffect, useCallback } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stocksAPI, itemsAPI, departmentsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { 
  FiX, FiRepeat, FiSearch, FiArrowRight, FiPlus, 
  FiFilter, FiPackage, FiHome, FiActivity, FiAlertTriangle, FiArchive
} from 'react-icons/fi';
import { StockAdjustmentModal } from '../../components/modals/StockAdjustmentModal';
import { StockTransferModal } from '../../components/modals/StockTransferModal';
import { StockMovementsModal } from '../../components/modals/StockMovementsModal';
import { Stock, Item, Department, StockMovement, StockAdjustmentDto, StockTransferDto } from '../../types';
import { DataTable, Column, ActionButton } from '../../components/common/DataTable';
import { Decimal } from 'decimal.js';
import { useSort } from '../../hooks/useSort';
import { useDebounce } from '../../hooks/useDebounce';
import { queryKeys } from '../../services/queryKeys';

export function StocksPage() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const page = Number(searchParams.get('page')) || 1;
  const searchTerm = searchParams.get('q') || '';
  const filterTab = (searchParams.get('tab') as 'active' | 'passive' | 'all' | 'critical') || 'all';
  const limit = Number(searchParams.get('limit')) || 20;

  const debouncedSearch = useDebounce(searchTerm, 500);

  const sort = {
    key: searchParams.get('sortBy') || 'quantity',
    order: (searchParams.get('sortOrder') as 'ASC' | 'DESC') || 'DESC'
  };

  const [filters] = useState<Record<string, unknown>>({});
  
  const [isModalOpen, setIsModalOpen] = useState(false);

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
  const setFilterTab = (tab: string) => updateParams({ tab, page: 1 });
  const setSearchTerm = (q: string) => updateParams({ q, page: 1 });
  const setSort = useCallback((key: string, order: 'ASC' | 'DESC') => updateParams({ sortBy: key, sortOrder: order, page: 1 }), [updateParams]);
  const [formData, setFormData] = useState({
    itemId: '',
    departmentId: '',
    quantity: 0,
    type: 'in',
    description: ''
  });

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferData, setTransferData] = useState({
    itemId: '',
    fromDepartmentId: '',
    toDepartmentId: '',
    quantity: 0,
    description: ''
  });

  const [isMovementsModalOpen, setIsMovementsModalOpen] = useState(false);
  const [selectedStockForLog, setSelectedStockForLog] = useState<Stock | null>(null);

  // ────── QUERIES ──────

  const { data: stocksData, isLoading: loading } = useQuery({
    queryKey: queryKeys.stocks.all({ page, limit, search: debouncedSearch, filterTab, sort, filters }),
    queryFn: async ({ signal }) => {
      const res = await stocksAPI.getAll({
        page, limit, search: debouncedSearch, 
        isCritical: filterTab === 'critical' ? 1 : undefined,
        state: filterTab === 'all' || filterTab === 'critical' ? undefined : (filterTab === 'active' ? 1 : 0),
        sortBy: sort.key, sortOrder: sort.order, ...filters
      }, { signal });
      return res.data;
    }
  });

  const { data: items = [] } = useQuery({
    queryKey: queryKeys.items.lookup,
    queryFn: async ({ signal }) => {
      const res = await itemsAPI.getAll({ state: 1, limit: 1000 }, { signal });
      return res.data.data;
    }
  });

  const { data: departments = [] } = useQuery({
    queryKey: queryKeys.departments.lookup,
    queryFn: async ({ signal }) => {
      const res = await departmentsAPI.getAll({ state: 1, limit: 100 }, { signal });
      return res.data.data;
    }
  });

  const stocks = stocksData?.data || [];
  const paginationMeta = stocksData?.meta;

  const handleSortChange = useCallback((configs: { key: string; direction: 'asc' | 'desc' }[]) => {
    if (configs.length > 0) {
      setSort(configs[0].key, configs[0].direction.toUpperCase() as 'ASC' | 'DESC');
    }
  }, [setSort]);

  const { sortedData, sortConfigs, toggleSort } = useSort<Stock>(
    stocks, 
    [{ key: sort.key, direction: sort.order.toLowerCase() as 'asc' | 'desc' }],
    handleSortChange
  );

  const { data: movementsData = [], isLoading: movementsLoading } = useQuery({
    queryKey: queryKeys.stocks.movements(selectedStockForLog?.id || 0),
    enabled: !!selectedStockForLog,
    queryFn: async ({ signal }) => {
      const res = await stocksAPI.getMovements(selectedStockForLog!.id, { limit: 100 }, { signal });
      return res.data.data;
    }
  });


  // Removed redundant useEffect as searchParams handles initialization

  const handleCloseAdjustment = () => {
    setIsModalOpen(false);
    setFormData({ itemId: '', departmentId: '', quantity: 0, type: 'in', description: '' });
  };

  const handleCloseTransfer = () => {
    setIsTransferModalOpen(false);
    setTransferData({ itemId: '', fromDepartmentId: '', toDepartmentId: '', quantity: 0, description: '' });
  };

  const adjustMutation = useMutation({
    mutationFn: (data: StockAdjustmentDto) => stocksAPI.adjust(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stocks.all({}) });
      setIsModalOpen(false);
      toast.success("Stok işlemi başarıyla kaydedildi.");
    },
    onError: () => {
      toast.error("Hata oluştu.");
    }
  });

  const transferMutation = useMutation({
    mutationFn: (data: StockTransferDto) => stocksAPI.transfer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stocks.all({}) });
      setIsTransferModalOpen(false);
      toast.success("Transfer işlemi tamamlandı.");
    },
    onError: () => {
      toast.error("Hata oluştu.");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.quantity <= 0) {
      toast.error("Miktar 0'dan büyük olmalıdır.");
      return;
    }
    adjustMutation.mutate({
      itemId: Number(formData.itemId),
      departmentId: Number(formData.departmentId),
      quantity: new Decimal(formData.quantity).toNumber(),
      type: formData.type as 'in' | 'out',
      description: formData.description
    });
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (transferData.quantity <= 0) {
      toast.error("Miktar 0'dan büyük olmalıdır.");
      return;
    }
    if (transferData.fromDepartmentId === transferData.toDepartmentId) {
      toast.error("Çıkış yapılacak depo ile Hedef depo aynı olamaz.");
      return;
    }
    
    transferMutation.mutate({
      itemId: Number(transferData.itemId),
      fromDepartmentId: Number(transferData.fromDepartmentId),
      toDepartmentId: Number(transferData.toDepartmentId),
      quantity: new Decimal(transferData.quantity).toNumber(),
      description: transferData.description
    });
  };

  const fetchMovements = (stock: Stock) => {
    setSelectedStockForLog(stock);
    setIsMovementsModalOpen(true);
  };

  const columns: Column<Stock>[] = [
    { 
      header: 'ÜRÜN / KOD', 
      accessor: (s) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-lg">
            <FiPackage />
          </div>
          <div>
            <div className="font-black text-on-surface text-sm">{s.item?.name}</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{s.item?.code}</div>
          </div>
        </div>
      ),
      sortKey: 'item.name'
    },
    { 
      header: 'DEPO / KONUM', 
      accessor: (s) => (
        <div className="flex items-center gap-2">
          <FiHome className="text-primary text-sm" />
          <span className="font-bold text-xs sm:text-sm text-on-surface-variant uppercase tracking-tighter">{s.department?.name}</span>
        </div>
      ),
      sortKey: 'department.name'
    },
    { 
      header: 'GÜNCEL STOK', 
      accessor: (s) => {
        const quantity = new Decimal(s.quantity || 0);
        const itemCriticalLimit = new Decimal(s.item?.criticalLimit || 0);
        const isCritical = !itemCriticalLimit.isZero() && quantity.lte(itemCriticalLimit) && quantity.gt(0);
        const isNegative = quantity.lt(0);

        return (
          <div className="text-right flex flex-col items-end">
            <span className={`tabular-nums font-black text-base tracking-tighter ${isNegative ? 'text-red-600' : (isCritical ? 'text-danger' : 'text-on-surface')}`}>
              {quantity.toNumber().toLocaleString('tr-TR')} {s.item?.quantityType?.abbreviation || 'ADET'}
            </span>
            {isNegative && (
              <span className="text-[9px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1 mt-0.5 animate-pulse">
                <FiAlertTriangle size={10} /> EKSİ STOK
              </span>
            )}
            {isCritical && !isNegative && (
              <span className="text-[9px] font-black text-danger uppercase tracking-widest flex items-center gap-1 mt-0.5">
                <FiAlertTriangle size={10} /> KRİTİK SEVİYE
              </span>
            )}
          </div>
        );
      },
      sortKey: 'quantity',
      className: 'text-right'
    },
    { 
      header: 'DURUM ANALİZİ', 
      accessor: (s) => {
        const quantity = new Decimal(s.quantity || 0);
        const itemCriticalLimit = new Decimal(s.item?.criticalLimit || 0);
        const isCritical = !itemCriticalLimit.isZero() && quantity.lte(itemCriticalLimit) && quantity.gt(0);
        const isNegative = quantity.lt(0);
        
        if (isNegative) {
          return (
            <span className="text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest bg-red-600 text-white shadow-sm">
              STOK AÇIĞI
            </span>
          );
        }

        return (
          <span className={`text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest ${
            isCritical ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'
          }`}>
            {isCritical ? 'ACİL TEDARİK' : 'STOK YETERLİ'}
          </span>
        );
      },
      sortKey: 'quantity'
    },
    {
      header: 'İŞLEMLER',
      accessor: (s) => (
        <div className="flex items-center gap-2">
          <ActionButton
            icon={<FiActivity />}
            onClick={() => fetchMovements(s)}
            tooltip="Hareket Kayıtları"
            variant="secondary"
          />
          <ActionButton
            icon={<FiArrowRight />}
            onClick={() => window.location.href = `/items?id=${s.itemId}`}
            tooltip="Ürün Detayı"
            variant="primary"
          />
        </div>
      )
    }
  ];

  return (
    <div className="animate-in flex flex-col gap-8">
      
      {/* 🔴 HEADER SECTION */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
            <FiActivity /> STOK & ENVANTER YÖNETİMİ
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-on-surface">
            Depo Bazlı <span className="text-primary">Stok Takibi</span>
          </h1>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex bg-surface-container-low p-1 rounded-2xl border border-surface-container">
            {[
              { id: 'all', label: 'Tümü', icon: <FiFilter /> },
              { id: 'active', label: 'Aktif', icon: <FiActivity /> },
              { id: 'passive', label: 'Arşiv', icon: <FiArchive /> },
              { id: 'critical', label: 'Kritik', icon: <FiAlertTriangle /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id as 'active' | 'passive' | 'all' | 'critical')}
                className={`h-9 px-4 rounded-xl text-xs font-black flex items-center gap-2 transition-colors ${
                  filterTab === tab.id 
                    ? (tab.id === 'critical' ? 'bg-danger text-white' : 'bg-white text-primary shadow-premium') 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
          <button className="h-12 px-6 bg-amber-500 text-white rounded-2xl font-black text-sm shadow-premium flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-colors" onClick={() => {
            setTransferData({ itemId: '', fromDepartmentId: '', toDepartmentId: '', quantity: 0, description: '' });
            setIsTransferModalOpen(true);
          }}>
            <FiRepeat size={20} /> Transfer / Sevk
          </button>
          <button className="h-12 px-6 bg-primary text-white rounded-2xl font-black text-sm shadow-premium flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-colors" onClick={() => {
            setFormData({ itemId: '', departmentId: '', quantity: 0, type: 'in', description: '' });
            setIsModalOpen(true);
          }}>
            <FiPlus size={20} /> Manuel Fiş Ekle
          </button>
        </div>
      </div>

      {/* 🟠 DATA TABLE */}
      <DataTable<Stock>
        data={sortedData}
        columns={columns}
        isLoading={loading}
        sortConfigs={sortConfigs}
        onSort={toggleSort}
        getRowKey={(s) => s.id}
        onEdit={(s) => fetchMovements(s)}
        
        // Integrated Search & Pagination
        search={searchTerm}
        onSearchChange={setSearchTerm}
        total={paginationMeta?.total || 0}
        page={page}
        limit={limit}
        onPageChange={setPage}
        virtualized={true}
      />

      {/* MODALS */}
      {isModalOpen && (
        <StockAdjustmentModal 
          items={items}
          departments={departments}
          formData={formData}
          onFormDataChange={setFormData}
          onSubmit={handleSubmit}
          onClose={handleCloseAdjustment}
        />
      )}

      {isTransferModalOpen && (
        <StockTransferModal 
          items={items}
          departments={departments}
          transferData={transferData}
          onTransferDataChange={setTransferData}
          onSubmit={handleTransferSubmit}
          onClose={handleCloseTransfer}
        />
      )}

      {isMovementsModalOpen && selectedStockForLog && (
        <StockMovementsModal 
          stock={selectedStockForLog}
          loading={movementsLoading}
          movements={movementsData}
          onClose={() => setIsMovementsModalOpen(false)}
        />
      )}
    </div>
  );
}