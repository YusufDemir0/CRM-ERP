import { useState } from 'react';
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
import SalesWizard from './modules/SalesWizard/SalesWizard';
import { Decimal } from 'decimal.js';
import { SalesHeader } from '../components/sales/SalesHeader';
import { SalesTable } from '../components/sales/SalesTable';
import { useDebounce } from '../hooks/useDebounce';
import { queryKeys } from '../services/queryKeys';

export default function SalesPage() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<'draft' | 'approved' | 'shipped' | 'cancelled' | 'all'>('draft');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sort, setSort] = useState<{ key: string; order: 'ASC' | 'DESC' }>({ key: 'createdAt', order: 'DESC' });
  const [filters] = useState<Record<string, string | number | undefined>>({});

  // Modals
  const [approveSaleId, setApproveSaleId] = useState<number | null>(null);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [innerView, setInnerView] = useState<'list' | 'new' | 'edit'>('list');
  
  // View/Ship Modal State
  const [viewSaleData, setViewSaleData] = useState<Sale | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // ────── QUERIES ──────

  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: queryKeys.sales.all({ 
      page, limit, search: debouncedSearch, 
      status: filterStatus === 'all' ? undefined : filterStatus, 
      sort, filters 
    }),
    queryFn: async ({ signal }) => {
      const res = await salesAPI.getAll({
        page, limit, search: debouncedSearch,
        status: filterStatus === 'all' ? undefined : filterStatus,
        sortBy: sort.key, sortOrder: sort.order, ...filters
      }, { signal });
      return res.data;
    }
  });

  const { data: departments = [] } = useQuery({
    queryKey: queryKeys.departments.active,
    queryFn: async ({ signal }) => {
      const res = await departmentsAPI.getAll({ limit: 50 }, { signal });
      return res.data.data.filter((d: Department) => d.state === 1);
    }
  });

  const sales = salesData?.data || [];
  const paginationMeta = salesData?.meta;
  const loading = salesLoading;

  const approveMutation = useMutation({
    mutationFn: ({ id, params }: { id: number; params: { departmentId: number; commercialAccountId?: number } }) => salesAPI.approve(id, params),
    onSuccess: (data, variables) => {
      queryClient.setQueriesData({ queryKey: queryKeys.sales.all({}) }, (old: { data: Sale[] } | undefined) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((sale: Sale) => 
            sale.id === variables.id ? { ...sale, status: 'approved' } : sale
          )
        };
      });
      setApproveSaleId(null);
      toast.success("Sipariş başarıyla onaylandı.");
    },
    onError: () => toast.error("Onaylama işlemi başarısız oldu.")
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => salesAPI.cancel(id),
    onSuccess: (data, id) => {
      queryClient.setQueriesData({ queryKey: queryKeys.sales.all({}) }, (old: { data: Sale[] } | undefined) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((sale: Sale) => 
            sale.id === id ? { ...sale, status: 'cancelled' } : sale
          )
        };
      });
      toast.success("Sipariş iptal edildi.");
    },
    onError: () => toast.error("İptal işlemi başarısız oldu.")
  });

  const shipMutation = useMutation({
    mutationFn: (id: number) => salesAPI.ship(id, { items: [] }), 
    onSuccess: (data, id) => {
      queryClient.setQueriesData({ queryKey: queryKeys.sales.all({}) }, (old: { data: Sale[] } | undefined) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((sale: Sale) => 
            sale.id === id ? { ...sale, status: 'shipped' } : sale
          )
        };
      });
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

  if (innerView === 'new') {
    return (
      <div className="animate-in flex flex-col gap-6">
        <div className="flex justify-between items-center pb-6 border-b border-surface-container">
          <button 
            className="group flex items-center gap-2 text-slate-400 hover:text-primary transition-colors font-black text-xs uppercase tracking-widest" 
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
      <SalesHeader 
        filterStatus={filterStatus}
        onFilterStatusChange={(id) => { setFilterStatus(id); setPage(1); }}
        searchTerm={searchTerm}
        onSearchTermChange={(term) => { setSearchTerm(term); setPage(1); }}
        onNewSale={() => setInnerView('new')}
      />

      <SalesTable 
        sales={sales}
        isLoading={loading}
        paginationMeta={paginationMeta}
        onPageChange={setPage}
        onLimitChange={setLimit}
        sortConfigs={[{ key: sort.key, direction: sort.order.toLowerCase() as 'asc' | 'desc' }]}
        onSort={(key: string) => {
          const isAsc = sort.key === key && sort.order === 'ASC';
          setSort({ key, order: isAsc ? 'DESC' : 'ASC' });
          setPage(1);
        }}
        onView={openViewModal}
        onApprove={setApproveSaleId}
        onShip={handleShipSale}
        onCancel={handleCancelSale}
      />

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