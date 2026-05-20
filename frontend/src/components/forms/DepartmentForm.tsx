import { useState, useEffect, useCallback } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { departmentsAPI, accountsAPI } from '../../services/api';
import { FiCheck, FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useQuickCreateStore } from '../../store/useQuickCreateStore';
import { useTurkiyeCities } from '../../hooks/useTurkiyeApi';
import { Account, Department, DepartmentType } from '../../types';
import { FormField } from '../common/FormField';

interface DepartmentFormProps {
  initialData?: Record<string, unknown>;
  editingId?: string | number | null;
  onSuccess: (data: unknown) => void;
  onCancel: () => void;
}

const onlyLetters = (val: string) => val.replace(/[0-9]/g, '');
const onlyAbbrLetters = (val: string) => val.replace(/[^A-ZÇĞİÖŞÜa-zçğıöşü]/g, '').toLocaleUpperCase('tr-TR');

type DepartmentFormData = {
  name: string;
  abbreviation: string;
  departmentTypeId: string;
  commercialAccountId: string;
  description: string;
  cityId: string;
};

export const DepartmentForm: React.FC<DepartmentFormProps> = ({
  initialData,
  editingId,
  onSuccess,
  onCancel,
}) => {
  const { openCreate, updateCache, getCache, clearCache } = useQuickCreateStore();
  const cacheKey = editingId ? `department_edit_${editingId}` : 'department_create';

  const getInitialValues = (): DepartmentFormData => {
    const cached = getCache(cacheKey) as DepartmentFormData | null;
    return {
      name: (initialData?.name as string) || cached?.name || '',
      description: (initialData?.description as string) || cached?.description || '',
      abbreviation: (initialData?.abbreviation as string) || cached?.abbreviation || '',
      departmentTypeId: initialData?.departmentTypeId ? String(initialData.departmentTypeId) : (cached?.departmentTypeId || ''),
      commercialAccountId: initialData?.commercialAccountId ? String(initialData.commercialAccountId) : (cached?.commercialAccountId || ''),
      cityId: initialData?.cityId ? String(initialData.cityId) : (cached?.cityId || ''),
    };
  };

  const { register, handleSubmit, getValues, setValue, control } = useForm<DepartmentFormData>({
    defaultValues: getInitialValues()
  });

  const saveDraft = useCallback(() => {
    updateCache(cacheKey, getValues());
  }, [getValues, cacheKey, updateCache]);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [deptTypes, setDeptTypes] = useState<DepartmentType[]>([]);
  const { cities } = useTurkiyeCities();

  useEffect(() => {
    const controller = new AbortController();
    async function fetchData() {
      try {
        const [accRes, typesRes] = await Promise.all([
          accountsAPI.getAll({ limit: 100 }, { signal: controller.signal }),
          departmentsAPI.getTypes({ signal: controller.signal })
        ]);
        setAccounts(accRes.data.data.filter((a: Account) => a.state === 1));
        setDeptTypes(typesRes.data as DepartmentType[]);
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'CanceledError' && err.name !== 'AbortError') {
          console.error(err);
        }
      }
    }
    fetchData();
    return () => controller.abort();
  }, []);

  // Sync initialData changes for better hydration
  useEffect(() => {
    if (initialData && editingId) {
      (Object.entries(initialData) as [string, unknown][]).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (['departmentTypeId', 'commercialAccountId', 'cityId', 'name', 'abbreviation', 'description'].includes(key)) {
          setValue(key as keyof DepartmentFormData, String(value));
        }
      });
    }
  }, [initialData, editingId, setValue]);

  const onSubmit: SubmitHandler<DepartmentFormData> = async (data) => {
    const formattedAbbr = onlyAbbrLetters(data.abbreviation).slice(0, 3);
    if (formattedAbbr && formattedAbbr.length > 3) {
      toast.error('Kısa kod en fazla 3 karakter olmalıdır.');
      return;
    }
    const payload = {
      name: onlyLetters(data.name).toLocaleUpperCase('tr-TR'),
      description: data.description.toLocaleUpperCase('tr-TR'),
      abbreviation: formattedAbbr,
      departmentTypeId: data.departmentTypeId || null,
      commercialAccountId: data.commercialAccountId || null,
      cityId: data.cityId || null,
    } as Partial<Department>;

    try {
      if (editingId) {
        const res = await departmentsAPI.update(editingId, payload);
        clearCache(cacheKey);
        onSuccess(res.data);
      } else {
        const res = await departmentsAPI.create(payload);
        clearCache(cacheKey);
        onSuccess(res.data);
      }
    } catch (error: unknown) {
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
  };

  const handleAddAccount = () => {
    openCreate('account', {
      onSuccess: (newAcc: unknown) => {
        setValue('commercialAccountId', String((newAcc as Account).id));
        accountsAPI.getAll({ limit: 100 }).then((res: { data: { data: Account[] } }) => setAccounts(res.data.data.filter((a: Account) => a.state === 1)));
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} onBlur={saveDraft} className="flex flex-col gap-6 animate-in">
      <div className="grid grid-cols-1 md:grid-cols-[2.5fr_1fr] gap-4">
        <FormField label="Departman Adı" required>
          <input 
            required 
            className="input-premium uppercase-input font-black tracking-tight" 
            {...register('name')} 
            placeholder="ÖR: MERKEZ DEPO" 
          />
        </FormField>
        <FormField label="Kısa Kod (Maks. 3 Harf)">
          <input
            maxLength={3}
            className="input-premium font-black tracking-[4px] text-center"
            {...register('abbreviation')}
            placeholder="MKZ"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Bulunduğu Şehir (İl)">
          <Controller
            name="cityId"
            control={control}
            render={({ field }) => (
              <select className="input-premium font-black" {...field} value={field.value || ''}>
                <option value="">ŞEHİR SEÇİNİZ...</option>
                {cities.map(c => <option key={String(c.id)} value={String(c.id)}>{c.name.toUpperCase()}</option>)}
              </select>
            )}
          />
        </FormField>
        <FormField label="Departman Tipi" required>
          <Controller
            name="departmentTypeId"
            control={control}
            render={({ field }) => (
              <select required className="input-premium font-black" {...field} value={field.value || ''}>
                <option value="">Lütfen Seçiniz...</option>
                {deptTypes.map((dt) => <option key={String(dt.id)} value={String(dt.id)}>{String(dt.name).toUpperCase()}</option>)}
              </select>
            )}
          />
        </FormField>
      </div>
      
      <FormField label="Finans/Kasa Hesabı" helperText="YENİ KASA EKLEMEK İÇİN YANDAKİ BUTONU KULLANIN">
        <div className="flex flex-col gap-2">
          <Controller
            name="commercialAccountId"
            control={control}
            render={({ field }) => (
              <select className="input-premium font-black" {...field} value={field.value || ''}>
                <option value="">Lütfen Seçiniz...</option>
                {accounts.map((acc: Account) => (
                  <option key={acc.id} value={acc.id}>{acc.name.toUpperCase()}</option>
                ))}
              </select>
            )}
          />
          <button
            type="button"
            className="text-[10px] font-black text-primary flex items-center justify-center gap-1 p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
            onClick={handleAddAccount}
          >
            <FiPlus size={12} /> YENİ HESAP TANIMLA
          </button>
        </div>
      </FormField>

      <FormField label="Operasyonel Açıklama">
        <input 
          className="input-premium uppercase-input font-medium" 
          {...register('description')} 
          placeholder="Departman görevi, sorumlulukları..." 
        />
      </FormField>

      <div className="flex flex-col sm:flex-row gap-4 mt-4 pt-6 border-t border-slate-100">
        <button type="submit" className="btn btn-primary btn-lg flex-1 shadow-2xl shadow-[var(--primary-glow)]">
          <FiCheck size={20} /> {editingId ? 'GÜNCELLEMELERİ KAYDET' : 'DEPARTMANI SİSTEME KAYDET'}
        </button>
        <button type="button" className="btn bg-slate-100 text-slate-500 btn-lg px-10 font-black hover:bg-slate-200 transition-all" onClick={() => { clearCache(cacheKey); onCancel(); }}>İPTAL</button>
      </div>
    </form>
  );
};
