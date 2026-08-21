import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffAPI } from '../../services/api';
import { Staff } from '../../types';
import { DataTable, Column } from '../../components/common/DataTable';
import { useDebounce } from '../../hooks/useDebounce';
import toast from 'react-hot-toast';
import { FiUsers, FiSliders, FiCheckCircle } from 'react-icons/fi';

export default function PersonnelUnitsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Queries
  const { data: staffData, isLoading } = useQuery({
    queryKey: ['staff', 'units-page', { page, limit, search: debouncedSearch }],
    queryFn: async () => {
      const res = await staffAPI.getAll({ page, limit, state: 1 }); // limit to active personnel
      return res.data;
    }
  });

  const staff = staffData?.data || [];
  const paginationMeta = staffData?.meta;

  // Mutation to update staff unit
  const updateUnitMutation = useMutation({
    mutationFn: ({ id, unit }: { id: string | number; unit: string }) => 
      staffAPI.update(id, { unit }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Birim başarıyla güncellendi.');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Güncelleme başarısız oldu.';
      toast.error(msg);
    }
  });

  const handleUnitChange = (staffId: string | number, newUnit: string) => {
    updateUnitMutation.mutate({ id: staffId, unit: newUnit });
  };

  // Filter staff locally based on search term (since backend search might be partial)
  const filteredStaff = staff.filter(s => {
    if (!debouncedSearch.trim()) return true;
    const q = debouncedSearch.toLowerCase();
    const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
    const deptName = s.department?.name?.toLowerCase() || '';
    return fullName.includes(q) || deptName.includes(q);
  });

  const columns: Column<Staff>[] = [
    {
      header: 'PERSONEL ADI SOYADI',
      accessor: (s) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm uppercase">
            {s.firstName[0]}{s.lastName[0]}
          </div>
          <div>
            <div className="font-black text-on-surface text-sm">{s.firstName} {s.lastName}</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{s.phone || 'Telefon Belirtilmemiş'}</div>
          </div>
        </div>
      ),
      sortKey: 'firstName'
    },
    {
      header: 'DEPARTMAN',
      accessor: (s) => (
        <span className="font-bold text-xs uppercase tracking-tight text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
          {s.department?.name || 'Departman Yok'}
        </span>
      ),
      sortKey: 'department.name'
    },
    {
      header: 'GÖREV BİRİMİ',
      accessor: (s) => (
        <div className="flex items-center gap-2">
          <select
            value={s.unit || ''}
            onChange={(e) => handleUnitChange(s.id, e.target.value)}
            className="input-premium py-1.5 px-3 font-black text-xs min-w-[150px] !h-9 bg-white border border-slate-200 focus:border-primary rounded-xl"
          >
            <option value="">SEÇİLMEMİŞ</option>
            <option value="MAĞAZA">MAĞAZA</option>
            <option value="SEVK">SEVK</option>
            <option value="DİĞER">DİĞER</option>
          </select>
          {s.unit && (
            <span className="text-emerald-500" title="Birim Tanımlı">
              <FiCheckCircle size={14} />
            </span>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="animate-in flex flex-col gap-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 pb-4 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
            <FiSliders /> YÖNETİM MODÜLÜ
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-on-surface">
            Personel <span className="text-primary">Birim Yetkileri</span>
          </h1>
          <p className="text-xs text-slate-400 font-bold mt-1">
            Personellerin sevk veya mağaza bazlı çalışma birimlerini düzenleyin.
          </p>
        </div>
      </div>

      {/* DATA TABLE */}
      <DataTable<Staff>
        data={filteredStaff}
        columns={columns}
        isLoading={isLoading}
        getRowKey={(s) => s.id}
        search={searchTerm}
        onSearchChange={setSearchTerm}
        total={paginationMeta?.total || filteredStaff.length}
        page={page}
        limit={limit}
        onPageChange={setPage}
        virtualized={true}
      />
    </div>
  );
}
