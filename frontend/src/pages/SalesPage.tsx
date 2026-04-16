import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesAPI, departmentsAPI } from '../services/api';
import { 
  FiEye, FiCheck, FiXCircle, FiArrowLeft, FiPlus, 
  FiShoppingBag, FiTruck, FiClock, FiCheckCircle, FiInfo 
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { confirmDialog } from '../utils/confirmDialog';
import { Sale, Department } from '../types';
import { ApproveSaleModal } from '../components/modals/ApproveSaleModal';
import { ViewSaleModal } from '../components/modals/ViewSaleModal';
import { DataTable, Column } from '../components/common/DataTable';
import { PaginationControls } from '../components/common/PaginationControls';
import SalesWizard from './modules/SalesWizard/SalesWizard';
import { Decimal } from 'decimal.js';
import { useSort } from '../hooks/useSort';

export default function SalesPage() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<'draft' | 'approved' | 'shipped' | 'cancelled' | 'all'>('draft');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sort, setSort] = useState<{ key: string; order: 'ASC' | 'DESC' }>({ key: 'createdAt', order: 'DESC' });
  const [filters] = useState<Record<string, any>>({});

  // Modals
  const [approveSaleId, setApproveSaleId] = useState<number | null>(null);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [innerView, setInnerView] = useState<'list' | 'new' | 'edit'>('list');
  
  // View/Ship Modal State
  const [viewSaleData, setViewSaleData] = useState<Sale | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // ────── QUERIES ──────

  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['sales', page, limit, searchTerm, filterStatus, sort, filters],
    queryFn: async () => {
      const res = await salesAPI.getAll({
        page, limit, search: searchTerm,
        status: filterStatus === 'all' ? undefined : filterStatus,
        sortBy: sort.key, sortOrder: sort.order, ...filters
      });
      return res.data;
    }
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments', 'active'],
    queryFn: async () => {
      const res = await departmentsAPI.getAll({ limit: 50 });
      return res.data.data.filter((d: Department) => d.state === 1);
    }
  });

  const sales = salesData?.data || [];
  const paginationMeta = salesData?.meta;
  const loading = salesLoading;

  const { sortedData, sortConfigs, toggleSort } = useSort<Sale>(
    sales, 
    [{ key: sort.key, direction: sort.order.toLowerCase() as 'asc' | 'desc' }],
    (configs) => {
      if (configs.length > 0) {
        setSort({ key: configs[0].key, order: configs[0].direction.toUpperCase() as 'ASC' | 'DESC' });
        setPage(1);
      }
    }
  );

  const approveMutation = useMutation({
    mutationFn: ({ id, params }: { id: number; params: any }) => salesAPI.approve(id, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      setApproveSaleId(null);
      toast.success("Sipariş başarıyla onaylandı.");
    },
    onError: () => toast.error("Onaylama işlemi başarısız oldu.")
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => salesAPI.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success("Sipariş iptal edildi.");
    },
    onError: () => toast.error("İptal işlemi başarısız oldu.")
  });

  const shipMutation = useMutation({
    mutationFn: (id: number) => salesAPI.ship(id, {}), // Tam sevkiyat varsayımı
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success("Sevkiyat başarıyla gerçekleştirildi.");
    },
    onError: () => toast.error("Sevkiyat işlemi başarısız oldu.")
  });

  const handleApprove = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeptId) {
      toast.error("Lütfen stokların düşüleceği depoyu seçin.");
      return;
    }
    approveMutation.mutate({ 
      id: approveSaleId!, 
      params: { departmentId: Number(selectedDeptId) } 
    });
  };

  const handleCancelSale = async (id: number) => {
    const confirmed = await confirmDialog('Bu siparişi iptal etmek istediğinize emin misiniz?', true);
    if (confirmed) cancelMutation.mutate(id);
  };

  const handleShipSale = async (id: number) => {
    const confirmed = await confirmDialog('Tüm ürünlerin sevkiyatı yapılsın mı?', false);
    if (confirmed) shipMutation.mutate(id);
  };

  const openViewModal = async (id: number) => {
    try {
      const res = await salesAPI.getOne(id);
      setViewSaleData(res.data);
      setIsViewModalOpen(true);
    } catch (error) {
      toast.error("Satış detayı getirilemedi.");
    }
  };

  const formatCurrency = (val: any, symbol: string = '₺') => {
    return new Decimal(val || 0).toNumber().toLocaleString('tr-TR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }) + ' ' + symbol;
  };

  const columns: Column<Sale>[] = [
    { 
      header: 'SİPARİŞ NO', 
      accessor: (s) => (
        <div className="flex items-center gap-2">
           <span className="bg-primary/5 text-primary px-2.5 py-1 rounded-lg font-black text-[10px] tracking-widest border border-primary/10 uppercase">
             {s.code}
           </span>
        </div>
      ),
      sortKey: 'code'
    },
    { 
      header: 'TARİH', 
      accessor: (s) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-700">{new Date(s.createdAt).toLocaleDateString('tr-TR')}</span>
          <span className="text-[10px] text-slate-400 font-black tracking-tighter uppercase">{new Date(s.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      ),
      sortKey: 'createdAt'
    },
    { 
      header: 'MÜŞTERİ (CARİ)', 
      accessor: (s) => <div className="font-black text-slate-800 tracking-tight group-hover:text-primary transition-colors">{s.party?.name}</div>,
      sortKey: 'party.name'
    },
    { 
      header: 'TUTAR', 
      accessor: (s: Sale) => (
        <div className="flex flex-col items-end">
          <span className="tabular-nums font-black text-on-surface tracking-tighter">{formatCurrency(s.grandTotal, s.currency?.symbol)}</span>
          {new Decimal(s.deposit || 0).gt(0) && (
            <span className="text-[9px] text-success font-black uppercase tracking-widest">KAPORA: {formatCurrency(s.deposit, s.currency?.symbol)}</span>
          )}
        </div>
      ),
      sortKey: 'grandTotal',
      className: 'text-right'
    },
    { 
      header: 'DURUM', 
      accessor: (s) => {
        const config: Record<string, any> = {
          draft: { label: 'TASLAK', icon: <FiClock />, cls: 'bg-warning/10 text-warning border-warning/20' },
          approved: { label: 'ONAYLI', icon: <FiCheckCircle />, cls: 'bg-info/10 text-info border-info/20' },
          shipped: { label: 'SEVK EDİLDİ', icon: <FiTruck />, cls: 'bg-success/10 text-success border-success/20' },
          cancelled: { label: 'İPTAL', icon: <FiXCircle />, cls: 'bg-danger/10 text-danger border-danger/20' },
        };
        const st = config[s.status] || config.draft;
        return (
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black tracking-widest ${st.cls}`}>
            {st.icon} {st.label}
          </div>
        );
      },
      sortKey: 'status'
    }
  ];

  if (innerView === 'new') {
    return (
      <div className="animate-in flex flex-col gap-6">
        <div className="flex justify-between items-center pb-6 border-b border-surface-container">
          <button 
            className="group flex items-center gap-2 text-slate-400 hover:text-primary transition-all font-black text-xs uppercase tracking-widest" 
            onClick={() => { setInnerView('list'); queryClient.invalidateQueries({ queryKey: ['sales'] }); }}
          >
            <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Listeye Dön
          </button>
          <div className="text-right">
             <h2 className="text-2xl font-black tracking-tighter text-on-surface">Yeni Satis Sihirbazi</h2>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Hızlı satış ve teklif hazırlama ekranı</p>
          </div>
        </div>
        
        <div className="bg-white p-8 sm:p-12 rounded-[3.5rem] shadow-premium border border-surface-container">
          <SalesWizard onCompleted={() => {
            setInnerView('list');
            queryClient.invalidateQueries({ queryKey: ['sales'] });
          }} />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in flex flex-col gap-8">
      {/* 🔵 HEADER SECTION */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-xl text-[10px] font-black mb-4 uppercase tracking-widest">
            <FiShoppingBag /> SATIŞ VE PAZARLAMA
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-on-surface">
            Sipariş Takibi & <span className="text-primary italic text-shadow-sm">Sevkiyat</span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-surface-container-low p-1.5 rounded-2xl border border-surface-container shadow-sm">
            {[
              { id: 'draft', label: 'Bekleyenler', icon: <FiClock /> },
              { id: 'approved', label: 'Onaylılar', icon: <FiCheckCircle /> },
              { id: 'shipped', label: 'Sevk Edilenler', icon: <FiTruck /> },
              { id: 'all', label: 'Tümü', icon: <FiInfo /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setFilterStatus(tab.id as any); setPage(1); }}
                className={`h-10 px-4 rounded-xl text-[11px] font-black flex items-center gap-2 transition-all uppercase tracking-tight ${
                  filterStatus === tab.id 
                    ? 'bg-white text-primary shadow-premium border border-surface-container' 
                    : 'text-slate-400 hover:text-on-surface hover:bg-white/50'
                }`}
              >
                <span className="text-sm">{tab.icon}</span> {tab.label}
              </button>
            ))}
          </div>
          
          <button 
            className="h-14 px-8 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:shadow-2xl hover:-translate-y-1 active:scale-95 transition-all flex items-center gap-3" 
            onClick={() => setInnerView('new')}
          >
            <FiPlus size={20} /> YENİ SİPARİŞ
          </button>
        </div>
      </div>

      {/* 🟡 DATA TABLE SECTION */}
      <div className="flex flex-col gap-4">
        <DataTable<Sale>
          data={sortedData}
          columns={columns}
          isLoading={loading}
          sortConfigs={sortConfigs}
          onSort={toggleSort}
          getRowKey={(s) => s.id}
          onEdit={(s) => openViewModal(s.id)}
          onRestore={s => {
            if (s.status === 'draft') return (setApproveSaleId(s.id) as any);
            if (s.status === 'approved') return handleShipSale(s.id);
            return undefined;
          }}
          onArchive={s => s.status === 'draft' || s.status === 'approved' ? handleCancelSale(s.id) : undefined}
          // Icon overrides for semantic actions
          customIcons={{
            restore: (s: Sale) => s.status === 'approved' ? <FiTruck /> : <FiCheck />,
            archive: () => <FiXCircle />
          }}
        />

        <div className="flex justify-end">
          <PaginationControls 
            meta={paginationMeta || { total: 0, page: 1, limit: 20, totalPages: 0 }} 
            onPageChange={setPage} 
            onLimitChange={setLimit} 
            loading={loading}
          />
        </div>
      </div>

      {/* 🟣 MODALS */}
      {approveSaleId && (
        <ApproveSaleModal 
          departments={departments}
          selectedDeptId={selectedDeptId}
          onSelectedDeptIdChange={setSelectedDeptId}
          onSubmit={handleApprove}
          onClose={() => setApproveSaleId(null)}
        />
      )}

      {isViewModalOpen && viewSaleData && (
        <ViewSaleModal 
          sale={viewSaleData}
          onClose={() => setIsViewModalOpen(false)}
        />
      )}
    </div>
  );
}