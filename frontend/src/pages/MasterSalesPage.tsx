import { useState, useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesAPI, departmentsAPI, transactionsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { confirmDialog } from '../utils/confirmDialog';
import { Sale, Department } from '../types';
import { SalesCheckWizardModal } from '../components/modals/SalesCheckWizardModal';
import { ShipmentWizardModal } from '../components/modals/ShipmentWizardModal';
import { ViewSaleModal } from '../components/modals/ViewSaleModal';
import CancelSaleModal from '../components/modals/CancelSaleModal';
import { ReportErrorModal } from '../components/modals/ReportErrorModal';
import { SalesReportModal } from '../components/modals/SalesReportModal';
import { SalesHeader } from '../components/sales/SalesHeader';
import { SalesTable } from '../components/sales/SalesTable';
import { useDebounce } from '../hooks/useDebounce';
import { queryKeys } from '../services/queryKeys';
import { useSalesWizardStore } from '../store/useSalesWizardStore';
import { useAuth } from '../hooks/useAuth';

export default function MasterSalesPage() {
  const { user, hasPermission } = useAuth();
  const canCreate = hasPermission('SALES_CREATE');
  const canApprove = hasPermission('SALES_APPROVE');
  const canShip = hasPermission('SALES_SHIP');
  const canCancel = hasPermission('SALES_CANCEL');
  const canEditOwn = hasPermission('SALES_EDIT_OWN');
  const canEditAll = hasPermission('SALES_EDIT_ALL');

  const queryClient = useQueryClient();
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

  const handlePageChange = useCallback((p: number) => updateParams({ page: p }), []);
  const handleLimitChange = useCallback((l: number) => updateParams({ limit: l, page: 1 }), []);
  const handleFilterStatusChange = useCallback((status: string) => updateParams({ status, page: 1 }), []);

  const sort = {
    key: searchParams.get('sortBy') || 'createdAt',
    order: (searchParams.get('sortOrder') as 'ASC' | 'DESC') || 'DESC'
  };

  const [filters] = useState<Record<string, string | number | undefined>>({});
  const selectedDeptFilterId = searchParams.get('departmentId') || '';

  const setSort = (key: string, order: 'ASC' | 'DESC') => updateParams({ sortBy: key, sortOrder: order, page: 1 });

  // Modals state
  const [approveSaleData, setApproveSaleData] = useState<Sale | null>(null);
  const [shipSaleData, setShipSaleData] = useState<Sale | null>(null);

  // View Modal State
  const [viewSaleData, setViewSaleData] = useState<Sale | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isReportErrorOpen, setIsReportErrorOpen] = useState(false);
  const [selectedSaleForError, setSelectedSaleForError] = useState<Sale | null>(null);

  const handleReportError = (sale: Sale) => {
    setSelectedSaleForError(sale);
    setIsReportErrorOpen(true);
  };

  const [isPdfReportModalOpen, setIsPdfReportModalOpen] = useState(false);

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
      const res = await departmentsAPI.getAll({ limit: 100, state: 1 }, { signal });
      const list = res.data.data || [];
      return list.filter((d: Department) => d.state === 1 || Number(d.state) === 1);
    }
  });

  const sales = salesData?.data || [];
  const paginationMeta = salesData?.meta;
  const loading = salesLoading;

  const approveMutation = useMutation({
    mutationFn: ({ id, params }: { id: string | number; params: { departmentId: string | number; commercialAccountId?: string | number; items?: Array<{ itemId: string; departmentId: string; quantity: number }> } }) => salesAPI.approve(id, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.all({}) });
      setApproveSaleData(null);
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
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'İşlem başarısız oldu.';
      toast.error(msg);
    }
  });

  const shipMutation = useMutation({
    mutationFn: ({ id, payments, vehicleIds, assignedStaffIds }: { id: string | number; payments?: Array<{ commercialAccountId: string | number; amount: string | number }>; vehicleIds?: string[]; assignedStaffIds?: string[] }) => 
      salesAPI.ship(id, { payments, vehicleIds, assignedStaffIds }), 
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.all({}) });
      toast.success("Sevkiyat başarıyla gerçekleştirildi.");
    },
    onError: () => toast.error("Sevkiyat işlemi başarısız oldu.")
  });

  const handleApproveConfirm = async (allocations: Array<{ itemId: string; departmentId: string; quantity: number }>, commercialAccountId?: string) => {
    if (!approveSaleData) return;
    const fallbackDeptId = allocations[0]?.departmentId || '';
    
    if (approveSaleData.party) {
      const balance = Number(approveSaleData.party.balance || 0);
      const creditLimit = Number(approveSaleData.party.creditLimit || 0);
      const exchangeRate = Number(approveSaleData.exchangeRate || 1);
      const totalInTL = Number(approveSaleData.grandTotal || 0) * exchangeRate;

      if (creditLimit > 0 && (balance + totalInTL) > creditLimit) {
        const confirmed = await confirmDialog(
          `DİKKAT: Bu müşterinin toplam bakiyesi (${(balance + totalInTL).toLocaleString('tr-TR')} ₺), kritik risk limitini (${creditLimit.toLocaleString('tr-TR')} ₺) aşmaktadır! Yine de satışı onaylamak istiyor musunuz?`,
          true,
          'Evet, Onayla'
        );
        if (!confirmed) {
          return;
        }
      }
    }

    approveMutation.mutate({ 
      id: approveSaleData.id, 
      params: { 
        departmentId: fallbackDeptId,
        commercialAccountId,
        items: allocations 
      } 
    });
  };

  const handleCloseApproveModal = () => {
    setApproveSaleData(null);
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
    try {
      const res = await salesAPI.getOne(id);
      setShipSaleData(res.data);
    } catch (error) {
      toast.error("Satış detayı getirilemedi.");
    }
  }, []);

  const handleShipConfirm = async (
    payments: Array<{ commercialAccountId: string; amount: number }>,
    vehicleIds: string[],
    assignedStaffIds: string[]
  ) => {
    if (!shipSaleData) return;

    try {
      await shipMutation.mutateAsync({ id: shipSaleData.id, payments, vehicleIds, assignedStaffIds });
      setShipSaleData(null);
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.all({}) });
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Sevkiyat ve tahsilat işlemleri sırasında hata oluştu.';
      toast.error(msg);
    }
  };

  const openViewModal = useCallback(async (id: string | number) => {
    try {
      const res = await salesAPI.getOne(id);
      setViewSaleData(res.data);
      setIsViewModalOpen(true);
    } catch (error) {
      toast.error("Satış detayı getirilemedi.");
    }
  }, []);

  const openApproveModal = useCallback(async (id: string | number) => {
    try {
      const res = await salesAPI.getOne(id);
      setApproveSaleData(res.data);
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
      link.setAttribute('download', `Master_Satis_Raporu_${new Date().toISOString().slice(0,10).replace(/-/g, '')}.xlsx`);
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
      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
        <div className="text-left">
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">YETKİLİ SATIŞLAR (TÜMÜ)</h2>
          <p className="text-xs text-slate-400 font-bold">Onay ve sevkiyat yetkili genel yönetim satış ekranı</p>
        </div>
      </div>

      <SalesHeader 
        filterStatus={filterStatus}
        onFilterStatusChange={handleFilterStatusChange}
        searchTerm={searchTerm}
        onSearchTermChange={(term) => updateParams({ q: term, page: 1 })}
        onNewSale={handleNewSale}
        onExport={handleExport}
        onPdfReport={() => setIsPdfReportModalOpen(true)}
        canCreate={canCreate}
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
        onApprove={canApprove ? openApproveModal : undefined}
        onShip={canShip ? handleShipSale : undefined}
        onCancel={canCancel ? handleCancelSale : undefined}
        onRevertToDraft={canApprove ? handleRevertToDraft : undefined}
        onReportError={handleReportError}
        isReadOnly={false}
        extraSearchFilters={
          <select
            value={selectedDeptFilterId}
            onChange={(e) => updateParams({ departmentId: e.target.value || undefined, page: 1 })}
            className="h-12 px-4 bg-slate-50 border-2 border-transparent focus:border-primary/10 focus:bg-white rounded-2xl text-xs font-black text-slate-700 outline-none transition-all uppercase"
          >
            <option value="">Depo / Birim (Tümü)</option>
            {departments.map((dept: Department) => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
        }
      />

      {/* 🟣 MODALS */}
      {approveSaleData && (
        <SalesCheckWizardModal 
          sale={approveSaleData}
          departments={departments}
          onSubmit={handleApproveConfirm}
          onClose={handleCloseApproveModal}
        />
      )}

      {shipSaleData && (
        <ShipmentWizardModal 
          sale={shipSaleData}
          departments={departments}
          onSubmit={handleShipConfirm}
          onClose={() => setShipSaleData(null)}
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

      <SalesReportModal
        isOpen={isPdfReportModalOpen}
        onClose={() => setIsPdfReportModalOpen(false)}
      />
    </div>
  );
}
