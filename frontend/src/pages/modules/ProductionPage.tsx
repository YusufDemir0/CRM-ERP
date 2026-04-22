import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productionOrdersAPI, bomsAPI, departmentsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { ProductionOrder, ProductionOrderFormData } from '../../types';
import { getLocalDateString } from '../../utils/date.helper';
import { DataTable } from '../../components/common/DataTable';
import { Decimal } from 'decimal.js';
import { useSort } from '../../hooks/useSort';
import { useDeferredValue } from 'react';
import { queryKeys } from '../../services/queryKeys';

// Sub-components
import { ProductionHeader } from './Production/ProductionHeader';
import { getProductionColumns } from './Production/ProductionColumns';
import { ProductionModal } from './Production/ProductionModal';

export function ProductionPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearch = useDeferredValue(searchTerm);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sort, setSort] = useState<{ key: string; order: 'ASC' | 'DESC' }>({ key: 'createdAt', order: 'DESC' });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: ordersData, isLoading: loading } = useQuery({
    queryKey: queryKeys.productionOrders.all({ page, limit, deferredSearch, sort }),
    queryFn: async ({ signal }) => {
      const res = await productionOrdersAPI.getAll({ 
        page, limit, search: deferredSearch, sortBy: sort.key, sortOrder: sort.order
      }, { signal });
      return res.data;
    }
  });

  const { data: boms = [] } = useQuery({
    queryKey: queryKeys.boms.lookup,
    queryFn: async ({ signal }) => {
      const res = await bomsAPI.getAll({ limit: 100, state: 1 }, { signal });
      return res.data.data || res.data;
    }
  });

  const { data: departments = [] } = useQuery({
    queryKey: queryKeys.departments.lookup,
    queryFn: async ({ signal }) => {
      const res = await departmentsAPI.getAll({ limit: 100, state: 1 }, { signal });
      return res.data.data || res.data;
    }
  });

  const orders = ordersData?.data || [];
  const paginationMeta = ordersData?.meta || { total: 0, page: 1, limit: 20, totalPages: 0 };

  const { sortedData, sortConfigs, toggleSort } = useSort<ProductionOrder>(
    orders, 
    [{ key: sort.key, direction: sort.order.toLowerCase() as 'asc' | 'desc' }],
    (configs) => {
      if (configs.length > 0) {
        setSort({ key: configs[0].key, order: configs[0].direction.toUpperCase() as 'ASC' | 'DESC' });
        setPage(1);
      }
    }
  );


  const [formData, setFormData] = useState<ProductionOrderFormData>({
    bomId: '', plannedQuantity: 0, startDate: getLocalDateString(), endDate: '', 
    notes: '', status: 'draft', producedQuantity: 0, wastageQuantity: 0,
    sourceDepartmentId: '', targetDepartmentId: ''
  });

  const mutation = useMutation({
    mutationFn: async ({ id, data }: { id: number | null; data: Partial<ProductionOrder> }) => {
      if (id) return productionOrdersAPI.update(id, data);
      return productionOrdersAPI.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.productionOrders.all({}) });
      setIsModalOpen(false);
      toast.success(editingId ? "İş emri güncellendi" : "Yeni iş emri oluşturuldu");
    },
    onError: () => toast.error("İşlem başarısız")
  });

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      bomId: '', plannedQuantity: 0, startDate: getLocalDateString(), endDate: '', 
      notes: '', status: 'draft', producedQuantity: 0, wastageQuantity: 0,
      sourceDepartmentId: '', targetDepartmentId: ''
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currentOrder = orders.find((o: ProductionOrder) => o.id === editingId);
    if ((!currentOrder || currentOrder.status !== 'completed') && formData.status === 'completed') {
       if(!formData.sourceDepartmentId || !formData.targetDepartmentId) {
         toast.error("Üretimi TAMAMLA işlemini bitirmek için depo seçmelisiniz.", { duration: 5000 });
         return;
       }
       if (new Decimal(formData.producedQuantity).lte(0)) {
         toast.error("Üretilen Miktar sıfır (0) olamaz!", { duration: 4000 });
         return;
       }
    }
    const payload = editingId ? {
      ...formData,
      bomId: Number(formData.bomId),
      plannedQuantity: Number(formData.plannedQuantity),
      producedQuantity: Number(formData.producedQuantity),
      wastageQuantity: Number(formData.wastageQuantity),
      sourceDepartmentId: formData.sourceDepartmentId ? Number(formData.sourceDepartmentId) : undefined,
      targetDepartmentId: formData.targetDepartmentId ? Number(formData.targetDepartmentId) : undefined
    } : {
      bomId: Number(formData.bomId),
      plannedQuantity: Number(formData.plannedQuantity),
      startDate: formData.startDate,
      endDate: formData.endDate || undefined,
      notes: formData.notes,
      unitCost: "0",
      totalCost: "0"
    };
    mutation.mutate({ id: editingId, data: payload });
  };

  const handleEdit = (o: ProductionOrder) => {
    setEditingId(o.id);
    setFormData({
      bomId: String(o.bomId || ''), plannedQuantity: o.plannedQuantity || 0,
      startDate: o.startDate || getLocalDateString(), endDate: o.endDate || '', notes: o.notes || '',
      status: o.status as ProductionOrderFormData['status'], producedQuantity: o.producedQuantity || 0, 
      wastageQuantity: o.wastageQuantity || 0, sourceDepartmentId: '', targetDepartmentId: ''
    });
    setIsModalOpen(true);
  };

  const columns = useMemo(() => getProductionColumns(), []);

  return (
    <div className="animate-in flex flex-col gap-8">
      <ProductionHeader 
        setEditingId={setEditingId} setFormData={setFormData} setIsModalOpen={setIsModalOpen} 
      />

      <div className="flex flex-col gap-4">
        <DataTable<ProductionOrder>
          data={sortedData} 
          columns={columns} 
          isLoading={loading} 
          sortConfigs={sortConfigs} 
          onSort={toggleSort}
          getRowKey={(o) => o.id}
          onEdit={(o) => o.status !== 'completed' && o.status !== 'cancelled' ? handleEdit(o) : undefined}
          
          // Integrated Search & Pagination
          search={searchTerm}
          onSearchChange={(val) => { setSearchTerm(val); setPage(1); }}
          total={paginationMeta.total}
          page={page}
          limit={limit}
          onPageChange={setPage}
          placeholder="İş emri no, ürün veya notlarda ara..."
        />
      </div>

      <ProductionModal 
        isOpen={isModalOpen} onClose={handleCloseModal} onSubmit={handleSubmit}
        editingId={editingId} formData={formData} setFormData={setFormData}
        boms={boms} departments={departments}
      />
    </div>
  );
}