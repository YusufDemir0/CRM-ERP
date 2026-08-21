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
import CancelSaleModal from '../components/modals/CancelSaleModal';
import { ReportErrorModal } from '../components/modals/ReportErrorModal';
import { DataTable, Column } from '../components/common/DataTable';
import { SaleWizard } from './modules/SalesWizard/SaleWizard';
import { Decimal } from 'decimal.js';
import { SalesHeader } from '../components/sales/SalesHeader';
import { SalesTable } from '../components/sales/SalesTable';
import { useDebounce } from '../hooks/useDebounce';
import { queryKeys } from '../services/queryKeys';
import { useSalesWizardStore } from '../store/useSalesWizardStore';
import { useAuth } from '../hooks/useAuth';

export default function SalesPage() {
  const { user, hasPermission } = useAuth();
  const canCreate = hasPermission('SALES_CREATE');
  const canEditOwn = hasPermission('SALES_EDIT_OWN');
  const canEditAll = hasPermission('SALES_EDIT_ALL');
  const canCancel = hasPermission('SALES_CANCEL');
  const canApprove = hasPermission('SALES_APPROVE');

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
  const selectedDeptFilterId = searchParams.get('departmentId') || '';

  const setSort = (key: string, order: 'ASC' | 'DESC') => updateParams({ sortBy: key, sortOrder: order, page: 1 });

  // Modals
  const [approveSaleId, setApproveSaleId] = useState<string | number | null>(null);
  const [selectedDeptId, setSelectedDeptId] = useState('');

  // View/Ship Modal State
  const [viewSaleData, setViewSaleData] = useState<Sale | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isReportErrorOpen, setIsReportErrorOpen] = useState(false);
  const [selectedSaleForError, setSelectedSaleForError] = useState<Sale | null>(null);

  const handleReportError = (sale: Sale) => {
    setSelectedSaleForError(sale);
    setIsReportErrorOpen(true);
  };

  // ────── QUERIES ──────

  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: queryKeys.sales.all({
      page, limit, search: debouncedSearch,
      status: filterStatus === 'all' ? undefined : filterStatus,
      sort, filters: { ...filters, departmentId: selectedDeptFilterId }
    }),
    queryFn: async ({ signal }) => {
      const res = await salesAPI.getAll({
        page, limit, search: debouncedSearch,
        status: filterStatus === 'all' ? undefined : filterStatus,
        sortBy: sort.key, sortOrder: sort.order,
        departmentId: selectedDeptFilterId || undefined,
        ...filters
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
    mutationFn: ({ id, params }: { id: string | number; params: { departmentId: string | number; commercialAccountId?: string | number } }) => salesAPI.approve(id, params),
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
    mutationFn: ({ id, reason }: { id: string | number; reason: string }) => salesAPI.cancel(id, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.all({}) });
      toast.success("Satış iptal edildi.");
    },
    onError: () => toast.error("İptal işlemi başarısız oldu.")
  });

  const revertMutation = useMutation({
    mutationFn: ({ id }: { id: string | number }) => salesAPI.revertToDraft(id),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.all({}) });
      toast.success("Sipariş başarıyla taslağa döndürüldü.");
      const sale = sales.find(s => String(s.id) === String(variables.id));
      if (sale) {
        updateParams({ status: 'draft', q: sale.code, page: 1 });
      } else {
        updateParams({ status: 'draft', page: 1 });
      }
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'İşlem başarısız oldu.';
      toast.error(msg);
    }
  });

  const shipMutation = useMutation({
    mutationFn: (arg: string | number | { id: string | number; payments?: Array<{ commercialAccountId: string | number; amount: string | number }> }) => {
      const id = typeof arg === 'object' && arg !== null ? arg.id : arg;
      const payments = typeof arg === 'object' && arg !== null ? arg.payments : undefined;
      return salesAPI.ship(id, { payments });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.all({}) });
      toast.success("Sevkiyat başarıyla gerçekleştirildi.");
    },
    onError: () => toast.error("Sevkiyat işlemi başarısız oldu.")
  });

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeptId) {
      toast.error("Lütfen stokların düşüleceği depoyu seçin.");
      return;
    }

    const sale = sales.find(s => String(s.id) === String(approveSaleId));
    if (sale && sale.party) {
      const balance = Number(sale.party.balance || 0);
      const creditLimit = Number(sale.party.creditLimit || 0);
      const exchangeRate = Number(sale.exchangeRate || 1);
      const totalInTL = Number(sale.grandTotal || 0) * exchangeRate;

      if (creditLimit > 0 && (balance + totalInTL) > creditLimit) {
        const confirmed = await confirmDialog(
          `DİKKAT: Bu müşterinin toplam bakiyesi (${(balance + totalInTL).toLocaleString('tr-TR')} ₺), kritik risk limitini (${creditLimit.toLocaleString('tr-TR')} ₺) aşmaktadır! Yine de satışı onaylamak istiyor musunuz?`,
          true
        );
        if (!confirmed) {
          return;
        }
      }
    }

    approveMutation.mutate({
      id: approveSaleId!,
      params: { departmentId: selectedDeptId }
    });
    setSelectedDeptId('');
  };

  const handleCloseApproveModal = () => {
    setApproveSaleId(null);
    setSelectedDeptId('');
  };

  const [cancellingSaleId, setCancellingSaleId] = useState<string | number | null>(null);

  const handleCancelSale = useCallback((id: string | number) => {
    setCancellingSaleId(id);
  }, []);

  const handleRevertToDraft = useCallback(async (id: string | number) => {
    const sale = sales.find(s => String(s.id) === String(id));
    const codeStr = sale ? ` (${sale.code})` : '';
    const confirmed = await confirmDialog(
      `Bu siparişi${codeStr} taslağa geri döndürmek istediğinize emin misiniz?`,
      false
    );
    if (confirmed) {
      revertMutation.mutate({ id });
    }
  }, [sales, revertMutation]);

  const handleShipSale = useCallback(async (id: string | number) => {
    const confirmed = await confirmDialog('Tüm ürünlerin sevkiyatı yapılsın mı?', false);
    if (confirmed) shipMutation.mutate(id);
  }, [shipMutation]);

  const openViewModal = useCallback(async (id: string | number) => {
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

  const handleEditSale = useCallback(async (id: string | number) => {
    try {
      const res = await salesAPI.getOne(id);
      const salesStore = useSalesWizardStore.getState();
      salesStore.loadDraftSale(res.data);
      navigate('/sales/wizard');
    } catch (error) {
      toast.error("Satış bilgileri alınamadı.");
    }
  }, [navigate]);
  const handlePageChange = useCallback((p: number) => updateParams({ page: p }), []);
  const handleLimitChange = useCallback((l: number) => updateParams({ limit: l, page: 1 }), []);
  const handleFilterStatusChange = useCallback((status: string) => updateParams({ status, page: 1 }), []);

  const handleSortChange = useCallback((key: string) => {
    const isAsc = sort.key === key && sort.order === 'ASC';
    setSort(key, isAsc ? 'DESC' : 'ASC');
  }, [sort, setSort]);

  const handleExport = useCallback(async () => {
    const params = {
      status: filterStatus === 'all' ? undefined : filterStatus,
      search: searchTerm,
      sortBy: sort.key,
      sortOrder: sort.order,
      ...filters
    };

    try {
      const response = await salesAPI.export(params);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Satis_Raporu_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Rapor dışa aktarılırken bir hata oluştu.');
    }
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
        canCreate={canCreate}
        departments={departments}
        selectedDeptFilterId={selectedDeptFilterId}
        onDeptFilterChange={(id) => {
          updateParams({ departmentId: id || undefined, page: 1 });
        }}
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
        onEdit={canEditOwn || canEditAll ? handleEditSale : undefined}
        isEditable={(s) => canEditAll || (canEditOwn && String(s.createdBy) === String(user?.id))}
        onCancel={canCancel ? handleCancelSale : undefined}
        onRevertToDraft={canApprove ? handleRevertToDraft : undefined}
        onReportError={handleReportError}
        isReadOnly={false}
        hideApprove={true}
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

      {cancellingSaleId && (
        <CancelSaleModal
          isOpen={!!cancellingSaleId}
          onClose={() => setCancellingSaleId(null)}
          onSubmit={(reason) => {
            cancelMutation.mutate({ id: cancellingSaleId, reason });
            setCancellingSaleId(null);
          }}
          loading={cancelMutation.isPending}
        />
      )}

      <ReportErrorModal
        isOpen={isReportErrorOpen}
        onClose={() => {
          setIsReportErrorOpen(false);
          setSelectedSaleForError(null);
        }}
        sale={selectedSaleForError}
      />
    </div>
  );
}