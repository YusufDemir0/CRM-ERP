import React, { useState, useCallback, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { staffAPI, departmentsAPI } from '../../services/api';
import { Staff, CreateStaffDto, UpdateStaffDto, Department } from '../../types';
import { FiCalendar, FiCheck, FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { PhoneInput } from '../common/PhoneInput';
import { FormField } from '../common/FormField';
import dayjs from 'dayjs';
import { useQuickCreateStore } from '../../store/useQuickCreateStore';
import { useAuthStore } from '../../store/useAuthStore';

interface StaffFormProps {
  initialData?: Partial<Staff>;
  editingId?: string | number | null;
  onSuccess: (data: Staff) => void;
  onCancel: () => void;
  mode?: 'quick' | 'full';
}

export const StaffForm: React.FC<StaffFormProps> = ({ initialData, editingId, onSuccess, onCancel, mode = 'full' }) => {
  const { openCreate, updateCache, getCache, clearCache } = useQuickCreateStore();
  const authUser = useAuthStore(s => s.user);
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchDepts() {
      try {
        const res = await departmentsAPI.getAll({ limit: 100 }, { signal: controller.signal });
        setDepartments(res.data.data.filter((d: Department) => d.state === 1));
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'CanceledError' && err.name !== 'AbortError') {
          console.error(err);
        }
      }
    }
    fetchDepts();
    return () => controller.abort();
  }, []);

  const handleAddDepartment = () => {
    openCreate('department', {
      onSuccess: (newDept: unknown) => {
        const dept = newDept as Department;
        setFormData(prev => ({ ...prev, departmentId: String(dept.id) }));
        departmentsAPI.getAll({ limit: 100 }).then(res => setDepartments(res.data.data.filter((d: Department) => d.state === 1)));
      }
    });
  };
  const cacheKey = editingId ? `staff_edit_${editingId}` : 'staff_create';
  const queryClient = useQueryClient();
  interface StaffFormData {
    firstName: string;
    lastName: string;
    fullName: string;
    phone: string;
    entryDate: string;
    departmentId?: string;
    isActive: boolean;
    tckn: string;
    unit: string;
  }

  const [formData, setFormData] = useState<StaffFormData>(() => {
    const cached = getCache(cacheKey) as StaffFormData | null;
    return {
      firstName: initialData?.firstName || cached?.firstName || '',
      lastName: initialData?.lastName || cached?.lastName || '',
      fullName: initialData ? `${initialData.firstName || ''} ${initialData.lastName || ''}`.trim() : (cached?.fullName || ''),
      phone: initialData?.phone || cached?.phone || '',
      entryDate: initialData?.entryDate ? dayjs(initialData.entryDate).format('YYYY-MM-DD') : (cached?.entryDate || dayjs().format('YYYY-MM-DD')),
      departmentId: initialData?.departmentId 
        ? String(initialData.departmentId)
        : (mode === 'quick' 
            ? (authUser?.departmentId ? String(authUser.departmentId) : undefined)
            : (cached?.departmentId || undefined)),
      isActive: initialData?.isActive ?? cached?.isActive ?? true,
      tckn: initialData?.tckn || cached?.tckn || '',
      unit: initialData?.unit || cached?.unit || '',
    };
  });

  const saveDraft = useCallback(() => {
    updateCache(cacheKey, formData);
  }, [formData, cacheKey, updateCache]);

  const mutation = useMutation({
    mutationFn: (data: CreateStaffDto | UpdateStaffDto) => editingId ? staffAPI.update(editingId, data as UpdateStaffDto) : staffAPI.create(data as CreateStaffDto),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      clearCache(cacheKey);
      onSuccess(res.data);
    },
    onError: (error: unknown) => {
      console.error(error);
      let errorMsg = 'İşlem başarısız';
      if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as { response: { data?: { message?: string | string[] } } }).response;
        if (response.data?.message) {
          errorMsg = Array.isArray(response.data.message) ? response.data.message[0] : response.data.message;
        }
      }
      toast.error(errorMsg);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let firstName = formData.firstName;
    let lastName = formData.lastName;

    if (formData.entryDate && (dayjs(formData.entryDate).isSame(dayjs(), 'day') || dayjs(formData.entryDate).isAfter(dayjs(), 'day'))) {
      toast.error('İşe giriş tarihi bugünün veya geleceğin bir tarihi olamaz!');
      return;
    }

    // Quick modda: tek fullName inputundan ad/soyad ayır
    if (mode === 'quick') {
      const parts = formData.fullName.trim().split(/\s+/);
      if (parts.length < 2 || parts[0] === '' || parts[1] === '') {
        toast.error('Lütfen ad ve soyad bilgisini birlikte girin (örn: Ahmet Yılmaz).');
        return;
      }
      lastName = parts[parts.length - 1];
      firstName = parts.slice(0, -1).join(' ');
    } else {
      if (!formData.firstName) {
        toast.error('Lütfen ad alanını doldurun.');
        return;
      }
    }
    
    const dataToSubmit = {
      firstName: firstName.toLocaleUpperCase('tr-TR'),
      lastName: lastName.toLocaleUpperCase('tr-TR'),
      phone: formData.phone.replace(/\s/g, ''),
      entryDate: formData.entryDate,
      departmentId: formData.departmentId ? String(formData.departmentId) : undefined,
      isActive: formData.isActive,
      tckn: formData.tckn || undefined,
      unit: formData.unit || undefined
    };
    
    mutation.mutate(dataToSubmit);
  };

  const handleNameChange = (field: 'firstName' | 'lastName', value: string) => {
    const filtered = value.replace(/[0-9]/g, '');
    setFormData(prev => ({ ...prev, [field]: filtered.toLocaleUpperCase('tr-TR') }));
  };


  return (
    <form onSubmit={handleSubmit} onBlur={saveDraft} className="flex flex-col gap-6 animate-in pb-4">
      {mode === 'quick' ? (
        /* Quick mod: Tek Ad Soyad input */
        <FormField label="Ad Soyad" required>
          <input 
            type="text"
            className="input-premium uppercase-input font-black tracking-tight"
            value={formData.fullName}
            onChange={(e) => {
              const filtered = e.target.value.replace(/[0-9]/g, '');
              setFormData(prev => ({ ...prev, fullName: filtered.toLocaleUpperCase('tr-TR') }));
            }}
            placeholder="ÖR: AHMET YILMAZ"
            required
          />
        </FormField>
      ) : (
        /* Full mod: Ayrı Ad / Soyad inputları */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Ad" required>
            <input 
              type="text"
              className="input-premium uppercase-input font-black tracking-tight"
              value={formData.firstName}
              onChange={(e) => handleNameChange('firstName', e.target.value)}
              placeholder="ÖR: AHMET"
              required
            />
          </FormField>
          <FormField label="Soyad" required>
            <input 
              type="text"
              className="input-premium uppercase-input font-black tracking-tight"
              value={formData.lastName}
              onChange={(e) => handleNameChange('lastName', e.target.value)}
              placeholder="ÖR: YILMAZ"
              required
            />
          </FormField>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="İletişim Hattı" required>
          <PhoneInput 
            value={formData.phone.startsWith('+') ? formData.phone : `+90 ${formData.phone}`}
            onChange={(val) => setFormData(prev => ({ ...prev, phone: val }))}
          />
        </FormField>
        <FormField label="TC Kimlik No">
          <input 
            type="text"
            maxLength={11}
            className="input-premium font-black tracking-tight tabular-nums"
            value={formData.tckn}
            onChange={(e) => setFormData(prev => ({ ...prev, tckn: e.target.value.replace(/\D/g, '') }))}
            placeholder="11 Haneli TCKN"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="İşe Giriş Tarihi">
          <div className="relative">
            <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="date"
              className="input-premium pl-12 font-black tabular-nums"
              value={formData.entryDate}
              onChange={(e) => setFormData(prev => ({ ...prev, entryDate: e.target.value }))}
              min="2000-01-01"
              max={dayjs().subtract(1, 'day').format('YYYY-MM-DD')}
              onKeyDown={(e) => e.preventDefault()}
            />
          </div>
        </FormField>
        {mode !== 'quick' && (
          <FormField label="Bağlı Olduğu Departman" required helperText="YENİ DEPARTMAN EKLEMEK İÇİN BUTONU KULLANIN">
            <div className="flex flex-col gap-2">
              <select
                required
                className="input-premium font-black"
                value={formData.departmentId || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, departmentId: e.target.value }))}
              >
                <option value="">Lütfen Seçiniz...</option>
                {departments.map((d) => (
                  <option key={d.id} value={String(d.id)}>{d.name.toUpperCase()}</option>
                ))}
              </select>
              <button
                type="button"
                className="text-[10px] font-black text-primary flex items-center justify-center gap-1 p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                onClick={handleAddDepartment}
              >
                <FiPlus size={12} /> YENİ DEPARTMAN TANIMLA
              </button>
            </div>
          </FormField>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mt-4 pt-6 border-t border-slate-100">
        <button 
          type="submit" 
          disabled={mutation.isPending}
          className="btn btn-primary btn-lg flex-1 shadow-2xl shadow-[var(--primary-glow)]"
        >
          {mutation.isPending ? 'KAYDEDİLİYOR...' : <><FiCheck size={20} /> {editingId ? 'GÜNCELLEMELERİ KAYDET' : 'PERSONELİ SİSTEME KAYDET'}</>}
        </button>
        <button 
          type="button" 
          onClick={() => { clearCache(cacheKey); onCancel(); }}
          className="btn bg-slate-100 text-slate-500 btn-lg px-10 font-black hover:bg-slate-200 transition-all"
        >
          İPTAL
        </button>
      </div>
    </form>
  );
};
