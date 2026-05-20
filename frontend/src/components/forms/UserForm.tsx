import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Department, Role, CreateUserDto } from '../../types';
import { departmentsAPI, rolesAPI, usersAPI } from '../../services/api';
import { FiCheck, FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useQuickCreateStore } from '../../store/useQuickCreateStore';
import { PhoneInput } from '../common/PhoneInput';
import { FormField } from '../common/FormField';
import { formatPhoneNumber } from '../../utils/formatters';

interface UserFormData {
  fullName: string;
  username: string;
  password?: string;
  email: string;
  phone: string;
  departmentId: string;
  selectedRoles: string[];
}

interface UserFormProps {
  initialData?: Partial<UserFormData>;
  editingId?: string | number | null;
  onSuccess: (data: unknown) => void;
  onCancel: () => void;
}

export const UserForm: React.FC<UserFormProps> = ({
  initialData,
  editingId,
  onSuccess,
  onCancel,
}) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const { openCreate, updateCache, getCache, clearCache } = useQuickCreateStore();
  const cacheKey = editingId ? `user_edit_${editingId}` : 'user_create';
  const getCachedData = () => {
    const cached = getCache(cacheKey) as UserFormData | null;
    if (cached) return cached;
    return {
      fullName: initialData?.fullName || '',
      username: initialData?.username || '',
      password: initialData?.password || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      departmentId: String(initialData?.departmentId || ''),
      selectedRoles: initialData?.selectedRoles || [],
    };
  };

  const { register, handleSubmit, setValue, getValues, watch } = useForm<UserFormData>({
    defaultValues: getCachedData()
  });

  const [emailFocus, setEmailFocus] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailValue = watch('email') || '';
  const selectedRoles = watch('selectedRoles') || [];

  const saveDraft = useCallback(() => {
    updateCache(cacheKey, getValues());
  }, [getValues, updateCache, cacheKey]);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchData() {
      try {
        const [dRes, rRes] = await Promise.all([
          departmentsAPI.getAll({ limit: 100 }, { signal: controller.signal }),
          rolesAPI.getAll({ limit: 100, state: 1 }, { signal: controller.signal }),
        ]);
        setDepartments(dRes.data.data.filter((d: Department) => d.state === 1));
        setAvailableRoles(rRes.data.data);
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'CanceledError' && err.name !== 'AbortError') {
          console.error(err);
        }
      }
    }
    fetchData();
    return () => controller.abort();
  }, []);

  // Re-apply departmentId AFTER departments list is populated so the <select> has matching <option>s
  useEffect(() => {
    if (departments.length > 0 && initialData?.departmentId) {
      setValue('departmentId', String(initialData.departmentId));
    }
  }, [departments, initialData?.departmentId, setValue]);

  useEffect(() => {
    if (initialData?.phone) {
      setValue('phone', initialData.phone);
    }
  }, [initialData, setValue]);

  const handleRoleToggle = (roleId: string) => {
    const currentRoles = getValues('selectedRoles') || [];
    if (currentRoles.includes(roleId)) {
      setValue('selectedRoles', currentRoles.filter(id => id !== roleId));
    } else {
      setValue('selectedRoles', [...currentRoles, roleId]);
    }
  };

  const onSubmit = async (data: UserFormData) => {
    if (!data.selectedRoles || data.selectedRoles.length === 0) {
      toast.error("En az bir rol seçilmelidir.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        username: data.username,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        departmentId: data.departmentId || undefined,
        roleIds: data.selectedRoles,
        password: data.password || undefined,
      };

      if (editingId) {
        const res = await usersAPI.update(editingId, payload);
        toast.success("Kullanıcı güncellendi.");
        onSuccess(res.data);
      } else {
        const res = await usersAPI.create(payload as CreateUserDto);
        toast.success("Yeni kullanıcı eklendi.");
        clearCache(cacheKey);
        onSuccess(res.data);
      }
    } catch (error: unknown) {
      console.error(error);
      const axiosErr = error as { response?: { data?: { message?: string | string[] } } };
      const msg = axiosErr.response?.data?.message || "İşlem başarısız";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddDepartment = () => {
    openCreate('department', {
      onSuccess: (newDept: unknown) => {
        const dept = newDept as Department;
        setValue('departmentId', String(dept.id));
        departmentsAPI.getAll({ limit: 100 }).then(res => setDepartments(res.data.data.filter((d: Department) => d.state === 1)));
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} onBlur={saveDraft} className="flex flex-col gap-6 animate-in">
      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-8">
        <div className="flex flex-col gap-5">
          <FormField label="Personel Ad Soyad" required>
            <input
              required
              className="input-premium uppercase-input font-black tracking-tight"
              {...register('fullName')}
              onInput={(e) => {
                e.currentTarget.value = e.currentTarget.value.replace(/[0-9]/g, '').toLocaleUpperCase('tr-TR');
              }}
              placeholder="ÖR: AHMET YILMAZ"
            />
          </FormField>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Kullanıcı Adı" required>
              <input
                required
                className="input-premium font-bold text-[var(--primary)]"
                {...register('username')}
                onInput={(e) => {
                  e.currentTarget.value = e.currentTarget.value.toLowerCase().replace(/\s/g, '');
                }}
                placeholder="ahmety"
                disabled={!!editingId}
              />
            </FormField>
            <FormField label="E-Posta" required className="relative">
              <input
                required
                type="text"
                className="input-premium lowercase font-bold"
                {...register('email')}
                onInput={(e) => { e.currentTarget.value = e.currentTarget.value.toLowerCase(); }}
                onFocus={() => setEmailFocus(true)}
                onBlur={() => setTimeout(() => setEmailFocus(false), 200)}
                placeholder="ahmet@ermay.com"
              />
              {emailFocus && emailValue && !emailValue.includes('@') && (
                <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-2xl z-50 shadow-2xl mt-2 overflow-hidden ring-4 ring-[var(--primary-glow)]">
                  {['@gmail.com', '@hotmail.com', '@outlook.com'].map(ext => (
                    <div 
                      key={ext} 
                      className="p-3 cursor-pointer hover:bg-slate-50 text-sm font-black flex justify-between items-center group"
                      onClick={() => setValue('email', emailValue + ext)}
                    >
                      <span className="text-slate-600">{emailValue}</span>
                      <span className="text-[var(--primary)] group-hover:scale-110 transition-transform">{ext}</span>
                    </div>
                  ))}
                </div>
              )}
            </FormField>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField 
              label={`Şifre ${editingId ? '(BOŞ=DEĞİŞMEZ)' : ''}`} 
              required={!editingId}
              helperText="En az 8 karakter olmalıdır"
            >
              <input
                type="password"
                required={!editingId}
                minLength={8}
                className="input-premium font-black tracking-widest"
                {...register('password')}
                placeholder="••••••••"
                title="Şifre minimum 8 hane olmalı"
              />
            </FormField>
            <FormField label="İletişim Hattı" required>
              <PhoneInput 
                value={watch('phone') || ''}
                onChange={(val) => setValue('phone', val)}
              />
            </FormField>
          </div>
          <FormField 
            label="Bağlı Olduğu Departman" 
            required
            helperText="YENİ DEPARTMAN EKLEMEK İÇİN YANDAKİ BUTONU KULLANIN"
          >
            <div className="flex flex-col gap-2">
              <select
                required
                className="input-premium font-black"
                {...register('departmentId')}
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
        </div>

        <div className="bg-[var(--primary-glow)] p-6 rounded-2xl border border-[var(--primary-glow)] shadow-inner flex flex-col gap-4">
          <label className="text-[10px] text-[var(--primary)] font-black uppercase tracking-widest text-center">Erişim Rolü Atama</label>
          <div className="flex flex-col gap-2 overflow-y-auto pr-1">
            {availableRoles.map((r) => (
              <label key={r.id} className={`flex items-center gap-3 cursor-pointer p-4 rounded-2xl border transition-all ${
                selectedRoles.includes(String(r.id)) ? 'bg-white border-primary shadow-xl scale-[1.02]' : 'bg-white/50 border-transparent text-slate-500 hover:bg-white'
              }`}>
                <input 
                  type="radio" 
                  name="roleSelection"
                  checked={selectedRoles.includes(String(r.id))} 
                  onChange={() => setValue('selectedRoles', [String(r.id)])} 
                  className="hidden"
                />
                <div className={`w-5 h-5 rounded-full border-[5px] flex-shrink-0 transition-colors ${
                  selectedRoles.includes(String(r.id)) ? 'border-primary bg-white' : 'border-slate-300 bg-white'
                }`} />
                <span className="font-black text-xs uppercase tracking-tight">{r.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-100">
        <button type="submit" disabled={selectedRoles.length === 0 || isSubmitting} className="btn btn-primary btn-lg flex-1 shadow-2xl shadow-[var(--primary-glow)]">
          {isSubmitting ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : <FiCheck size={20} />} 
          {editingId ? 'GÜNCELLEMELERİ KAYDET' : 'YENİ PERSONELİ SİSTEME KAYDET'}
        </button>
        <button type="button" className="btn bg-slate-100 text-slate-500 btn-lg px-10 font-black hover:bg-slate-200 transition-all" onClick={() => { clearCache(cacheKey); onCancel(); }} disabled={isSubmitting}>
          İPTAL
        </button>
      </div>
    </form>
  );
};
