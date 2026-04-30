import { useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
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
import { SaleWizard } from './modules/SalesWizard/SaleWizard';
import { Decimal } from 'decimal.js';
import { SalesHeader } from '../components/sales/SalesHeader';
import { SalesTable } from '../components/sales/SalesTable';
import { useDebounce } from '../hooks/useDebounce';
import { queryKeys } from '../services/queryKeys';
import { useSalesWizardStore } from '../store/useSalesWizardStore';

export default function SalesPage() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const page = Number(searchParams.get('page')) || 1;
  const searchTerm = searchParams.get('q') || '';
  const filterStatus = (searchParams.get('status') as 'draft' | 'approved' | 'shipped' | 'cancelled' | 'all') || 'draft';
  const limit = Number(searchParams.get('limit')) || 20;

  const debouncedSearch = useDebounce(searchTerm, 500);

  const updateParams = (newParams: Record<string, string | number | undefined>) => {
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
  };

  const setPage = (p: number) => updateParams({ page: p });
  const setFilterStatus = (status: string) => updateParams({ status, page: 1 });
  const setSearchTerm = (q: string) => updateParams({ q, page: 1 });
  const setLimit = (l: number) => updateParams({ limit: l, page: 1 });

  const sort = {
    key: searchParams.get('sortBy') || 'createdAt',
    order: (searchParams.get('sortOrder') as 'ASC' | 'DESC') || 'DESC'
  };

  const [filters] = useState<Record<string, string | number | undefined>>({});

  const setSort = (key: string, order: 'ASC' | 'DESC') => updateParams({ sortBy: key, sortOrder: order, page: 1 });

  // Modals
  const [approveSaleId, setApproveSaleId] = useState<number | null>(null);
  const [selectedDeptId, setSelectedDeptId] = useState('');

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.all({}) });
      setApproveSaleId(null);
      setSelectedDeptId('');
      toast.success("Satış başarıyla onaylandı.");
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Onaylama işlemi başarısız oldu.';
      toast.error(msg);
    }
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => salesAPI.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.all({}) });
      toast.success("Satış iptal edildi.");
    },
    onError: () => toast.error("İptal işlemi başarısız oldu.")
  });

  const shipMutation = useMutation({
    mutationFn: (id: number) => salesAPI.ship(id, { items: [] }), 
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.all({}) });
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
    setSelectedDeptId('');
  };

  const handleCloseApproveModal = () => {
    setApproveSaleId(null);
    setSelectedDeptId('');
  };

  const handleCancelSale = useCallback(async (id: number) => {
    const confirmed = await confirmDialog('Bu satışı iptal etmek istediğinize emin misiniz?', true);
    if (confirmed) cancelMutation.mutate(id);
  }, [cancelMutation]);

  const handleShipSale = useCallback(async (id: number) => {
    const confirmed = await confirmDialog('Tüm ürünlerin sevkiyatı yapılsın mı?', false);
    if (confirmed) shipMutation.mutate(id);
  }, [shipMutation]);

  const openViewModal = useCallback(async (id: number) => {
    try {
      const res = await salesAPI.getOne(id);
      setViewSaleData(res.data);
      setIsViewModalOpen(true);
    } catch (error) {
      toast.error("Satış detayı getirilemedi.");
    }
  }, []);

  const handleNewSale = useCallback(() => {
    const salesStore = useSalesWizardStore.getState();
    salesStore.reset();
    navigate('/sales/wizard');
  }, [navigate]);
  const handlePageChange = useCallback((p: number) => updateParams({ page: p }), []);
  const handleLimitChange = useCallback((l: number) => updateParams({ limit: l, page: 1 }), []);
  const handleFilterStatusChange = useCallback((status: string) => updateParams({ status, page: 1 }), []);

  const handleSortChange = useCallback((key: string) => {
    const isAsc = sort.key === key && sort.order === 'ASC';
    setSort(key, isAsc ? 'DESC' : 'ASC');
  }, [sort, setSort]);

  const handleExport = useCallback(() => {
    const params = new URLSearchParams({
      status: filterStatus === 'all' ? '' : filterStatus,
      q: searchTerm,
      sortBy: sort.key,
      sortOrder: sort.order,
      ...filters
    });
    window.open(`${import.meta.env.VITE_API_URL}/sales/export?${params.toString()}`, '_blank');
  }, [filterStatus, searchTerm, sort, filters]);

  return (
    <div className="animate-in flex flex-col gap-8">
      <SalesHeader 
        filterStatus={filterStatus}
        onFilterStatusChange={handleFilterStatusChange}
        searchTerm={searchTerm}
        onSearchTermChange={(term) => updateParams({ q: term, page: 1 })}
        onNewSale={handleNewSale}
        onExport={handleExport}
      />

      <SalesTable 
        sales={sales}
        isLoading={loading}
        paginationMeta={paginationMeta}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        sortConfigs={[{ key: sort.key, direction: sort.order.toLowerCase() as 'asc' | 'desc' }]}
        onSort={handleSortChange}
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
          onClose={handleCloseApproveModal}
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