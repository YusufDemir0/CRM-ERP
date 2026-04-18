import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Department, Role, CreateUserDto } from '../../types';
import { departmentsAPI, rolesAPI, usersAPI } from '../../services/api';
import { FiCheck, FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useQuickCreateStore } from '../../store/useQuickCreateStore';
import { formatPhoneNumber } from '../../utils/formatters';

interface UserFormData {
  fullName: string;
  username: string;
  password?: string;
  email: string;
  phone: string;
  departmentId: string;
  selectedRoles: number[];
}

interface UserFormProps {
  initialData?: Partial<UserFormData>;
  editingId?: number | null;
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

  const getCachedData = () => {
    if (!editingId) {
      const cached = getCache('user') as { formData?: UserFormData; countryCode?: string } | null;
      if (cached?.formData) return cached.formData;
    }
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

  const getCachedCountryCode = () => {
    if (!editingId) {
      const cached = getCache('user') as { formData?: UserFormData; countryCode?: string } | null;
      if (cached?.countryCode) return cached.countryCode;
    }
    return '+90';
  };

  const { register, handleSubmit, setValue, getValues, watch } = useForm<UserFormData>({
    defaultValues: getCachedData()
  });

  const [countryCode, setCountryCode] = useState(getCachedCountryCode());
  const [emailFocus, setEmailFocus] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailValue = watch('email') || '';
  const selectedRoles = watch('selectedRoles') || [];

  const saveDraft = useCallback(() => {
    if (!editingId) {
      updateCache('user', { formData: getValues(), countryCode });
    }
  }, [getValues, countryCode, updateCache, editingId]);

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
    if (initialData?.phone?.startsWith('+90 ')) {
      setCountryCode('+90');
      setValue('phone', initialData.phone?.substring(4) || '');
    }
  }, [initialData, setValue]);

  const handleRoleToggle = (roleId: number) => {
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
        phone: `${countryCode} ${data.phone}`,
        departmentId: data.departmentId ? Number(data.departmentId) : undefined,
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
        clearCache('user');
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
        const dept = newDept as { id: number };
        setValue('departmentId', String(dept.id));
        departmentsAPI.getAll({ limit: 100 }).then(res => setDepartments(res.data.data.filter((d: Department) => d.state === 1)));
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} onBlur={saveDraft} className="login-form">
      <div className="grid grid-cols-[2fr_1fr] gap-8">
        <div className="flex flex-col gap-4">
          <div className="form-group">
            <label>Personel Ad Soyad</label>
            <input
              required
              className="uppercase-input"
              {...register('fullName')}
              onInput={(e) => {
                e.currentTarget.value = e.currentTarget.value.replace(/[0-9]/g, '').toLocaleUpperCase('tr-TR');
              }}
              placeholder="ÖR: AHMET YILMAZ"
            />
          </div>
          <div className="flex gap-4">
            <div className="form-group flex-1">
              <label>Kullanıcı Adı</label>
              <input
                required
                className="uppercase-input"
                {...register('username')}
                onInput={(e) => {
                  e.currentTarget.value = e.currentTarget.value.toLowerCase().replace(/\s/g, '');
                }}
                placeholder="ahmety"
                disabled={!!editingId}
              />
            </div>
            <div className="form-group flex-1">
              <label>E-Posta *</label>
              <div className="relative">
                <input
                  required
                  type="text"
                  {...register('email')}
                  onInput={(e) => {
                    e.currentTarget.value = e.currentTarget.value.toLowerCase();
                  }}
                  onFocus={() => setEmailFocus(true)}
                  onBlur={() => setTimeout(() => setEmailFocus(false), 200)}
                  placeholder="ahmet@ermay.com"
                />
                {emailFocus && emailValue && !emailValue.includes('@') && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-border rounded-lg z-10 shadow-sm mt-1 overflow-hidden">
                    {['@gmail.com', '@hotmail.com', '@outlook.com', '@icloud.com'].map(ext => (
                      <div 
                        key={ext} 
                        className="p-2 cursor-pointer transition-colors text-sm hover:bg-slate-100"
                        onClick={() => setValue('email', emailValue + ext)}
                      >
                        <strong>{emailValue}</strong>{ext}
                      </div>
                    ))}
                  </div>
                )}
                {emailFocus && emailValue && emailValue.includes('@') && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-border rounded-lg z-10 shadow-sm mt-1 overflow-hidden">
                    {[ '@gmail.com', '@hotmail.com', '@outlook.com', '@icloud.com'].map(ext => (
                      <div 
                        key={ext} 
                        className={`p-2 cursor-pointer transition-colors text-sm hover:bg-slate-100 ${emailValue.split('@')[1] !== ext.substring(1) ? 'block' : 'hidden'}`}
                        onClick={() => setValue('email', emailValue.split('@')[0] + ext)}
                      >
                        Hızlı Değiştir: <strong>{emailValue.split('@')[0]}</strong>{ext}
                      </div>
                    ))}
                  </div>
                 )}
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="form-group flex-1">
              <label>Şifre (Minimum 8 karakter) {editingId && <span className="text-[9px] text-danger">(Boş=Aynı)</span>}</label>
              <input
                type="password"
                required={!editingId}
                className="uppercase-input"
                {...register('password')}
                placeholder="****"
              />
            </div>
            <div className="form-group flex-1">
              <label>Telefon *</label>
              <div className="flex gap-1">
                <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} className="w-20">
                  <option value="+90">+90</option><option value="+1">+1</option>
                </select>
                <input 
                  required 
                  className="uppercase-input tabular-nums flex-1" 
                  {...register('phone')}
                  onInput={(e) => {
                    e.currentTarget.value = formatPhoneNumber(e.currentTarget.value);
                  }}
                  placeholder="5XX XXX XX XX" 
                />
              </div>
            </div>
          </div>
          <div className="form-group">
            <div className="flex justify-between items-center">
              <label>Departman *</label>
              <button
                type="button"
                className="btn-link text-[11px] font-semibold text-primary mb-1 flex items-center gap-1"
                onClick={handleAddDepartment}
              >
                <FiPlus size={12} /> YENİ
              </button>
            </div>
            <select
              required
              className="uppercase-input"
              {...register('departmentId')}
            >
              <option value="">Lütfen Seçiniz</option>
              {departments.map((d) => (
                <option key={d.id} value={String(d.id)}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-surface-container-low p-4 rounded-xl border border-border">
          <label className="text-sm text-primary font-extrabold mb-3 block">Rolsüz Kullanıcı Eklenemez (Tek Rol Seçilebilir).</label>
          <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto">
            {availableRoles.map((r) => (
              <label key={r.id} className={`flex items-center gap-2 text-sm cursor-pointer p-3 rounded-xl border transition-all ${
                selectedRoles.includes(r.id) ? 'bg-primary/5 border-primary text-primary shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-primary/30'
              }`}>
                <input 
                  type="radio" 
                  name="roleSelection"
                  checked={selectedRoles.includes(r.id)} 
                  onChange={() => setValue('selectedRoles', [r.id])} 
                  className="hidden"
                />
                <div className={`w-4 h-4 rounded-full border-[4px] flex-shrink-0 transition-colors ${
                  selectedRoles.includes(r.id) ? 'border-primary bg-white' : 'border-slate-300 bg-white'
                }`} />
                <strong className="font-bold tracking-wide">{r.name}</strong>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-4 mt-8">
        <button type="submit" className="btn btn-primary flex-1 h-[50px]" disabled={selectedRoles.length === 0 || isSubmitting}>
          {isSubmitting ? <FiPlus className="animate-spin" /> : <FiCheck />} {editingId ? 'GÜNCELLE' : 'PERSONELİ KAYDET'}
        </button>
        <button type="button" className="btn flex-[0.5] bg-slate-200 h-[50px]" onClick={onCancel} disabled={isSubmitting}>İPTAL</button>
      </div>
    </form>
  );
};
