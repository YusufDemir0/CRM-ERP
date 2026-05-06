import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { staffAPI } from '../../services/api';
import { Staff, CreateStaffDto, UpdateStaffDto } from '../../types';
import { FiCalendar, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { PhoneInput } from '../common/PhoneInput';
import { FormField } from '../common/FormField';
import dayjs from 'dayjs';

interface StaffFormProps {
  initialData?: Partial<Staff>;
  editingId?: string | number | null;
  onSuccess: (data: Staff) => void;
  onCancel: () => void;
}

export const StaffForm: React.FC<StaffFormProps> = ({ initialData, editingId, onSuccess, onCancel }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    phone: initialData?.phone || '',
    entryDate: initialData?.entryDate ? dayjs(initialData.entryDate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
    departmentId: initialData?.departmentId || undefined,
    isActive: initialData?.isActive ?? true,
    tckn: initialData?.tckn || '',
  });

  const mutation = useMutation({
    mutationFn: (data: CreateStaffDto | UpdateStaffDto) => editingId ? staffAPI.update(editingId, data as UpdateStaffDto) : staffAPI.create(data as CreateStaffDto),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      onSuccess(res.data);
    },
    onError: () => toast.error('Hata oluştu.')
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName) {
      toast.error('Lütfen ad ve soyad alanlarını doldurun.');
      return;
    }
    
    // Strip spaces before sending
    const dataToSubmit = {
      ...formData,
      departmentId: formData.departmentId ? String(formData.departmentId) : undefined,
      phone: formData.phone.replace(/\s/g, ''),
      tckn: formData.tckn || undefined
    };
    
    mutation.mutate(dataToSubmit);
  };

  const handleNameChange = (field: 'firstName' | 'lastName', value: string) => {
    const filtered = value.replace(/[0-9]/g, '');
    setFormData(prev => ({ ...prev, [field]: filtered.toLocaleUpperCase('tr-TR') }));
  };


  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 animate-in pb-4">
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

      <FormField label="İşe Giriş Tarihi">
        <div className="relative">
          <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="date"
            className="input-premium pl-12 font-black tabular-nums"
            value={formData.entryDate}
            onChange={(e) => setFormData(prev => ({ ...prev, entryDate: e.target.value }))}
            min="2000-01-01"
          />
        </div>
      </FormField>

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
          onClick={onCancel}
          className="btn bg-slate-100 text-slate-500 btn-lg px-10 font-black hover:bg-slate-200 transition-all"
        >
          İPTAL
        </button>
      </div>
    </form>
  );
};
