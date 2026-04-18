import { useState, useEffect, useCallback } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { departmentsAPI, accountsAPI } from '../../services/api';
import { FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useQuickCreateStore } from '../../store/useQuickCreateStore';
import { Account, Department } from '../../types';

interface DepartmentFormProps {
  initialData?: Record<string, unknown>;
  editingId?: number | null;
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
};

export const DepartmentForm: React.FC<DepartmentFormProps> = ({
  initialData,
  editingId,
  onSuccess,
  onCancel,
}) => {
  const { openCreate, updateCache, getCache, clearCache } = useQuickCreateStore();
  const cacheKey = editingId ? `dept_edit_${editingId}` : 'dept_create';

  const { register, handleSubmit, getValues, setValue } = useForm<DepartmentFormData>({
    defaultValues: (getCache(cacheKey) as DepartmentFormData) || {
      name: (initialData?.name as string) || '',
      description: (initialData?.description as string) || '',
      abbreviation: (initialData?.abbreviation as string) || '',
      departmentTypeId: initialData?.departmentTypeId ? String(initialData.departmentTypeId) : '',
      commercialAccountId: initialData?.commercialAccountId ? String(initialData.commercialAccountId) : ''
    }
  });

  const saveDraft = useCallback(() => {
    updateCache(cacheKey, getValues());
  }, [getValues, cacheKey, updateCache]);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [deptTypes, setDeptTypes] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchData() {
      try {
        const [accRes, typesRes] = await Promise.all([
          accountsAPI.getAll({ limit: 100 }, { signal: controller.signal }),
          departmentsAPI.getTypes({ signal: controller.signal })
        ]);
        setAccounts(accRes.data.data.filter((a: Account) => a.state === 1));
        setDeptTypes(typesRes.data as Record<string, unknown>[]);
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'CanceledError' && err.name !== 'AbortError') {
          console.error(err);
        }
      }
    }
    fetchData();
    return () => controller.abort();
  }, []);

  const onSubmit: SubmitHandler<DepartmentFormData> = async (data) => {
    const formattedAbbr = onlyAbbrLetters(data.abbreviation).slice(0, 4);
    if (formattedAbbr && formattedAbbr.length > 4) {
      toast.error('Kısa kod en fazla 4 karakter olmalıdır.');
      return;
    }
    const payload = {
      name: onlyLetters(data.name).toLocaleUpperCase('tr-TR'),
      description: data.description.toLocaleUpperCase('tr-TR'),
      abbreviation: formattedAbbr,
      departmentTypeId: data.departmentTypeId ? Number(data.departmentTypeId) : undefined,
      commercialAccountId: data.commercialAccountId ? Number(data.commercialAccountId) : undefined
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
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddAccount = () => {
    openCreate('account', {
      onSuccess: (newAcc: unknown) => {
        setValue('commercialAccountId', String((newAcc as Account).id));
        // Refresh accounts list
        accountsAPI.getAll({ limit: 100 }).then((res: { data: { data: Account[] } }) => setAccounts(res.data.data.filter((a: Account) => a.state === 1)));
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} onBlur={saveDraft} className="login-form">
      <div className="grid grid-cols-[2fr_1fr] gap-4">
        <div className="form-group">
          <label>Departman Adı (Zorunlu)</label>
          <input 
            required 
            className="uppercase-input" 
            {...register('name')} 
            placeholder="ÖR: MERKEZ DEPO" 
          />
        </div>
        <div className="form-group">
          <label>Kısa Kod (3-4 harf)</label>
          <input
            maxLength={4}
            className="uppercase-input font-extrabold tracking-[3px] text-center"
            {...register('abbreviation')}
            placeholder="MKZ"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="form-group">
          <label>Departman Tipi</label>
          <select 
            className="uppercase-input appearance-none" 
            {...register('departmentTypeId')}
          >
            <option value="">Lütfen Seçiniz</option>
            {deptTypes.map((dt) => <option key={String(dt.id)} value={String(dt.id)}>{String(dt.name)} ({String(dt.abbreviation)})</option>)}
          </select>
        </div>
        <div className="form-group">
          <div className="flex justify-between items-center mb-1">
            <label>Bağlı Finans/Kasa Hesabı</label>
            <button
              type="button"
              className="text-[11px] font-semibold text-primary hover:underline"
              onClick={handleAddAccount}
            >
              + YENİ HESAP EKLE
            </button>
          </div>
          <select 
            className="uppercase-input appearance-none" 
            {...register('commercialAccountId')}
          >
            <option value="">Lütfen Seçiniz</option>
            {accounts.map((acc: Account) => (
              <option key={acc.id} value={acc.id}>{acc.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group mt-4">
        <label>Departman Açıklaması</label>
        <input 
          className="uppercase-input" 
          {...register('description')} 
          placeholder="..." 
        />
      </div>

      <div className="flex gap-4 mt-5">
        <button type="submit" className="btn btn-primary flex-1 h-[50px]">
          <FiCheck /> {editingId ? 'GÜNCELLE' : 'DEPARTMANI KAYDET'}
        </button>
        <button type="button" className="btn bg-slate-200 flex-[0.5] h-[50px]" onClick={onCancel}>İPTAL</button>
      </div>
    </form>
  );
};
