import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productionOrdersAPI, bomsAPI, departmentsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { ProductionOrder, ProductionOrderFormData } from '../../types';
import { getLocalDateString } from '../../utils/date.helper';
import { DataTable } from '../../components/common/DataTable';
import { PaginationControls } from '../../components/common/PaginationControls';
import { Decimal } from 'decimal.js';
import { useSort } from '../../hooks/useSort';

// Sub-components
import { ProductionHeader } from './Production/ProductionHeader';
import { ProductionFilters } from './Production/ProductionFilters';
import { getProductionColumns } from './Production/ProductionColumns';
import { ProductionModal } from './Production/ProductionModal';

export function ProductionPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState<{ key: string; order: 'ASC' | 'DESC' }>({ key: 'createdAt', order: 'DESC' });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: ordersData, isLoading: loading } = useQuery({
    queryKey: ['production-orders', page, limit, debouncedSearch, sort],
    queryFn: async () => {
      const res = await productionOrdersAPI.getAll({ 
        page, limit, search: debouncedSearch, sortBy: sort.key, sortOrder: sort.order
      });
      return res.data;
    }
  });

  const { data: boms = [] } = useQuery({
    queryKey: ['boms', 'active'],
    queryFn: async () => {
      const res = await bomsAPI.getAll({ limit: 100, state: 1 });
      return res.data.data || res.data;
    }
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments', 'active'],
    queryFn: async () => {
      const res = await departmentsAPI.getAll({ limit: 100, state: 1 });
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

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(searchTerm); setPage(1); }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const [formData, setFormData] = useState<ProductionOrderFormData>({
    bomId: '', plannedQuantity: 0, startDate: getLocalDateString(), endDate: '', 
    notes: '', status: 'draft', producedQuantity: 0, wastageQuantity: 0,
    sourceDepartmentId: '', targetDepartmentId: ''
  });

  const mutation = useMutation({
    mutationFn: async ({ id, data }: { id: number | null; data: any }) => {
      if (id) return productionOrdersAPI.update(id, data);
      return productionOrdersAPI.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-orders'] });
      setIsModalOpen(false);
      toast.success(editingId ? "İş emri güncellendi" : "Yeni iş emri oluşturuldu");
    },
    onError: () => toast.error("İşlem başarısız")
  });

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
      plannedQuantity: formData.plannedQuantity,
      producedQuantity: formData.producedQuantity,
      wastageQuantity: formData.wastageQuantity,
      sourceDepartmentId: formData.sourceDepartmentId ? Number(formData.sourceDepartmentId) : undefined,
      targetDepartmentId: formData.targetDepartmentId ? Number(formData.targetDepartmentId) : undefined
    } : {
      bomId: Number(formData.bomId),
      plannedQuantity: formData.plannedQuantity,
      startDate: formData.startDate,
      endDate: formData.endDate || undefined,
      notes: formData.notes
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

  const columns = getProductionColumns();

  return (
    <div className="animate-in flex flex-col gap-8">
      <ProductionHeader 
        setEditingId={setEditingId} setFormData={setFormData} setIsModalOpen={setIsModalOpen} 
      />

      <ProductionFilters 
        searchTerm={searchTerm} setSearchTerm={setSearchTerm} 
      />

      <div className="flex flex-col gap-4">
        <DataTable<ProductionOrder>
          data={sortedData} columns={columns} isLoading={loading} sortConfigs={sortConfigs} onSort={toggleSort}
          getRowKey={(o) => o.id}
          onEdit={(o) => o.status !== 'completed' && o.status !== 'cancelled' ? handleEdit(o) : undefined}
        />
        <div className="flex justify-end">
          <PaginationControls 
            meta={paginationMeta} onPageChange={setPage} onLimitChange={setLimit} loading={loading} 
          />
        </div>
      </div>

      <ProductionModal 
        isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleSubmit}
        editingId={editingId} formData={formData} setFormData={setFormData}
        boms={boms} departments={departments}
      />
    </div>
  );
}