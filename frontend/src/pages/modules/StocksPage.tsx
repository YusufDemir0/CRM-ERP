import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stocksAPI, itemsAPI, departmentsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { 
  FiX, FiRepeat, FiSearch, FiArrowRight, FiPlus, 
  FiFilter, FiPackage, FiHome, FiActivity, FiAlertTriangle
} from 'react-icons/fi';
import { StockAdjustmentModal } from '../../components/modals/StockAdjustmentModal';
import { StockTransferModal } from '../../components/modals/StockTransferModal';
import { StockMovementsModal } from '../../components/modals/StockMovementsModal';
import { Stock, Item, Department, StockMovement } from '../../types';
import { DataTable, Column } from '../../components/common/DataTable';
import { PaginationControls } from '../../components/common/PaginationControls';
import { Decimal } from 'decimal.js';
import { useSort } from '../../hooks/useSort';

export function StocksPage() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialFilter = queryParams.get('filter') === 'critical' ? 'critical' : 'all';

  const [filterTab, setFilterTab] = useState<'all' | 'critical'>(initialFilter);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sort, setSort] = useState<{ key: string; order: 'ASC' | 'DESC' }>({ key: 'quantity', order: 'ASC' });
  const [filters, setFilters] = useState<Record<string, any>>({});
  
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    queryKey: ['stocks', page, limit, debouncedSearch, filterTab, sort, filters],
    queryFn: async () => {
      const res = await stocksAPI.getAll({
        page,
        limit,
        search: debouncedSearch,
        isCritical: filterTab === 'critical' ? 1 : undefined,
        sortBy: sort.key,
        sortOrder: sort.order,
        ...filters
      });
      return res.data;
    }
  });

  const { data: items = [] } = useQuery({
    queryKey: ['items', 'lookup'],
    queryFn: async () => {
      const res = await itemsAPI.getAll({ state: 1, limit: 1000 });
      return res.data.data;
    }
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments', 'lookup'],
    queryFn: async () => {
      const res = await departmentsAPI.getAll({ state: 1, limit: 100 });
      return res.data.data;
    }
  });

  const stocks = stocksData?.data || [];
  const paginationMeta = stocksData?.meta;

  const { sortedData, sortConfigs, toggleSort } = useSort<Stock>(
    stocks, 
    [{ key: sort.key, direction: sort.order.toLowerCase() as 'asc' | 'desc' }],
    (configs) => {
      if (configs.length > 0) {
        setSort({ 
          key: configs[0].key, 
          order: configs[0].direction.toUpperCase() as 'ASC' | 'DESC' 
        });
        setPage(1); // FE-01: Reset page on sort change
      }
    }
  );

  const { data: movementsData = [], isLoading: movementsLoading } = useQuery({
    queryKey: ['stock-movements', selectedStockForLog?.id],
    enabled: !!selectedStockForLog,
    queryFn: async () => {
      const res = await stocksAPI.getMovements(selectedStockForLog!.id, { limit: 100 });
      return res.data.data;
    }
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); 
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const f = queryParams.get('filter');
    if (f === 'critical') setFilterTab('critical');
    else setFilterTab('all');
  }, [location.search]);

  const adjustMutation = useMutation({
    mutationFn: (data: any) => stocksAPI.adjust(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stocks'] });
      setIsModalOpen(false);
      toast.success("Stok işlemi başarıyla kaydedildi.");
    },
    onError: () => toast.error("Hata oluştu.")
  });

  const transferMutation = useMutation({
    mutationFn: (data: any) => stocksAPI.transfer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stocks'] });
      setIsTransferModalOpen(false);
      toast.success("Transfer işlemi tamamlandı.");
    },
    onError: () => toast.error("Hata oluştu.")
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '40px', height: '40px', borderRadius: '12px', 
            background: 'var(--primary-glow)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--primary)',
            fontSize: '18px'
          }}>
            <FiPackage />
          </div>
          <div>
            <div style={{ fontWeight: 800, color: 'var(--on-surface)', fontSize: '14px' }}>{s.item?.name}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>{s.item?.code}</div>
          </div>
        </div>
      ),
      sortKey: 'item.name'
    },
    { 
      header: 'DEPO / KONUM', 
      accessor: (s) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiHome size={14} color="var(--primary)" />
          <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--on-surface-variant)' }}>{s.department?.name}</span>
        </div>
      ),
      sortKey: 'department.name'
    },
    { 
      header: 'GÜNCEL STOK', 
      accessor: (s) => {
        const quantity = new Decimal(s.quantity || 0);
        const itemCriticalLimit = new Decimal(s.item?.criticalLimit || 0);
        const isCritical = !itemCriticalLimit.isZero() && quantity.lte(itemCriticalLimit);
        return (
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span className="tabular-nums" style={{ 
              fontWeight: 900, 
              fontSize: '15px',
              color: isCritical ? 'var(--error)' : 'var(--on-surface)',
              letterSpacing: '-0.5px'
            }}>
              {quantity.toNumber().toLocaleString('tr-TR')} {s.item?.quantityType?.abbreviation || 'ADET'}
            </span>
            {isCritical && (
              <span style={{ fontSize: '9px', fontWeight: 900, color: 'var(--error)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <FiAlertTriangle style={{ verticalAlign: 'middle', marginRight: '3px' }} /> KRİTİK SEVİYE
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
        const isCritical = !itemCriticalLimit.isZero() && quantity.lte(itemCriticalLimit);
        
        return (
          <span style={{ 
            fontSize: '10px', fontWeight: 800, 
            padding: '4px 10px', borderRadius: '8px',
            background: isCritical ? 'var(--error-glow)' : 'var(--success-glow)',
            color: isCritical ? 'var(--error)' : 'var(--success)',
            textTransform: 'uppercase'
          }}>
            {isCritical ? 'ACİL TEDARİK' : 'STOK YETERLİ'}
          </span>
        );
      }
    }
  ];

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* 🔴 HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ 
            display: 'inline-flex', alignItems: 'center', gap: '8px', 
            background: 'var(--secondary-glow)', color: 'var(--secondary)', 
            padding: '6px 14px', borderRadius: '12px', fontSize: '12px', 
            fontWeight: 800, marginBottom: '16px'
          }}>
            <FiActivity /> STOK & ENVANTER YÖNETİMİ
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--on-surface)' }}>
            Depo Bazlı <span style={{ color: 'var(--primary)' }}>Stok Takibi</span>
          </h1>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ display: 'flex', background: 'var(--surface-container-low)', padding: '4px', borderRadius: '14px', border: '1px solid var(--border)' }}>
            {[
              { id: 'all', label: 'Tüm Liste', icon: <FiPackage /> },
              { id: 'critical', label: 'Kritik Stok', icon: <FiAlertTriangle /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setFilterTab(tab.id as any); setPage(1); }}
                style={{
                  height: '36px', padding: '0 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: '8px', border: 'none', transition: '0.2s',
                  background: filterTab === tab.id ? (tab.id === 'critical' ? 'var(--error)' : 'white') : 'transparent',
                  color: filterTab === tab.id ? (tab.id === 'critical' ? 'white' : 'var(--primary)') : 'var(--text-muted)',
                  boxShadow: filterTab === tab.id ? 'var(--shadow-md)' : 'none',
                  cursor: 'pointer'
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
          <button className="btn btn-warning" style={{ height: '44px', fontWeight: 800, color: 'white' }} onClick={() => {
            setTransferData({ itemId: '', fromDepartmentId: '', toDepartmentId: '', quantity: 0, description: '' });
            setIsTransferModalOpen(true);
          }}>
            <FiRepeat size={18} /> Transfer / Sevk
          </button>
          <button className="btn btn-primary" style={{ height: '44px', boxShadow: '0 10px 20px var(--primary-glow)' }} onClick={() => {
            setFormData({ itemId: '', departmentId: '', quantity: 0, type: 'in', description: '' });
            setIsModalOpen(true);
          }}>
            <FiPlus size={18} /> Manuel Fiş Ekle
          </button>
        </div>
      </div>

      {/* 🟠 SEARCH & FILTERS */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: '24px', display: 'flex', gap: '20px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <FiSearch style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Ürün adı, stok kodu veya depo ismi ile hızlı ara..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '48px', height: '52px', border: 'none', background: 'var(--surface-container-low)' }}
          />
        </div>
        <button className="btn btn-secondary" style={{ height: '52px', background: 'white' }}>
          <FiFilter /> Gelişmiş Filtrele
        </button>
      </div>

      {/* 🟡 DATA TABLE SECTION */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <DataTable<Stock>
          data={sortedData}
          columns={columns}
          isLoading={loading}
          sortConfigs={sortConfigs}
          onSort={toggleSort}
          getRowKey={(s) => s.id}
          onEdit={(s) => fetchMovements(s)}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <PaginationControls 
            meta={paginationMeta || { total: 0, page: 1, limit: 20, totalPages: 0 }} 
            onPageChange={setPage} 
            onLimitChange={setLimit} 
            loading={loading}
          />
        </div>
      </div>

      {/* MODALS */}
      {isModalOpen && (
        <StockAdjustmentModal 
          items={items}
          departments={departments}
          formData={formData}
          onFormDataChange={setFormData}
          onSubmit={handleSubmit}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      {isTransferModalOpen && (
        <StockTransferModal 
          items={items}
          departments={departments}
          transferData={transferData}
          onTransferDataChange={setTransferData}
          onSubmit={handleTransferSubmit}
          onClose={() => setIsTransferModalOpen(false)}
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