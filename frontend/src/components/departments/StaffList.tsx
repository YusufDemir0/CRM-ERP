import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffAPI } from '../../services/api';
import { Staff } from '../../types';
import { FiPlus, FiTrash2, FiToggleLeft, FiToggleRight, FiPhone, FiCalendar, FiEdit2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useQuickCreateStore } from '../../store/useQuickCreateStore';
import { confirmDialog } from '../../utils/confirmDialog';
import dayjs from 'dayjs';

interface StaffListProps {
  departmentId: string | number;
}

export const StaffList: React.FC<StaffListProps> = ({ departmentId }) => {
  const queryClient = useQueryClient();
  const { openCreate } = useQuickCreateStore();

  const { data: staffData, isLoading } = useQuery({
    queryKey: ['staff', { departmentId }],
    queryFn: async () => {
      const res = await staffAPI.getAll({ departmentId });
      return res.data;
    }
  });

  const staff = staffData?.data || [];

  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => staffAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Personel silindi.');
    }
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string | number) => staffAPI.toggleActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Durum güncellendi.');
    }
  });

  const handleAddStaff = () => {
    openCreate('staff', {
      initialData: { departmentId },
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff'] })
    });
  };
  
  const handleEditStaff = (s: Staff) => {
    openCreate('staff', {
      editingId: s.id,
      initialData: s as unknown as Record<string, unknown>,
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff'] })
    });
  };

  const handleDelete = async (id: string | number) => {
    const confirmed = await confirmDialog('Bu personeli silmek istediğinize emin misiniz?', true);
    if (confirmed) deleteMutation.mutate(id);
  };

  if (isLoading) return <div className="p-8 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Yükleniyor...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">DEPARTMAN PERSONELLERİ</h3>
        <button 
          onClick={handleAddStaff}
          className="h-9 px-4 bg-primary/10 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-primary hover:text-white transition-all shadow-sm"
        >
          <FiPlus /> Personel Ekle
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {staff.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-100 rounded-3xl text-slate-300 font-bold">
            Bu departmanda henüz personel bulunmuyor.
          </div>
        ) : (
          staff.map((s: Staff) => (
            <div key={s.id} className="p-5 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-between group hover:border-primary/20 transition-all">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black ${s.isActive ? 'bg-primary/10 text-primary' : 'bg-slate-200 text-slate-400'}`}>
                  {s.firstName[0]}{s.lastName[0]}
                </div>
                <div>
                  <div className="font-black text-sm text-slate-800">{s.firstName} {s.lastName}</div>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                      <FiPhone size={10} /> {s.phone || 'NO TEL'}
                    </div>
                    {s.tckn && (
                      <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                        TC: {s.tckn}
                      </div>
                    )}
                    {s.entryDate && (
                      <div className="text-[10px] text-emerald-500 font-bold flex items-center gap-1 uppercase">
                        GİRİŞ: {dayjs(s.entryDate).format('DD.MM.YYYY')}
                      </div>
                    )}
                    {!s.isActive && s.lastDeactivationDate && (
                      <div className="text-[10px] text-rose-500 font-bold flex items-center gap-1 uppercase">
                        ÇIKIŞ: {dayjs(s.lastDeactivationDate).format('DD.MM.YYYY')}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleEditStaff(s)}
                  className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-colors"
                  title="Düzenle"
                >
                  <FiEdit2 size={18} />
                </button>
                <button 
                  onClick={() => toggleMutation.mutate(s.id)}
                  className={`p-2 rounded-xl transition-colors ${s.isActive ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'}`}
                  title={s.isActive ? 'Pasife Al' : 'Aktife Al'}
                >
                  {s.isActive ? <FiToggleRight size={20} /> : <FiToggleLeft size={20} />}
                </button>
                <button 
                  onClick={() => handleDelete(s.id)}
                  className="p-2 text-danger hover:bg-danger/10 rounded-xl transition-colors"
                  title="Sil"
                >
                  <FiTrash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
