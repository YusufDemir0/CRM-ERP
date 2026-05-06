import { useState, useEffect, useCallback, useDeferredValue, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { DataTable, Column } from '../components/common/DataTable';
import { FiPlus, FiEdit2, FiTrash2, FiRefreshCw } from 'react-icons/fi';
import type { BaseEntity, PaginationParams, PaginatedResult } from '../types';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';
import { confirmDialog } from '../utils/confirmDialog';

// ────── TYPE-SAFE INTERFACES ──────

interface SelectOption {
  value: string;
  label: string;
}

interface FormField<T extends BaseEntity> {
  key: keyof T & string;
  label: string;
  type?: string;
  options?: SelectOption[];
  apiOptions?: {
    apiFn: (params?: PaginationParams | AxiosRequestConfig) => Promise<AxiosResponse>;
    valueKey: string;
    labelKey: string;
    labelFn?: (item: Record<string, unknown>) => string;
  };
  required?: boolean;
  placeholder?: string;
  gridCols?: number;
}

interface ColumnDef<T extends BaseEntity> {
  key: keyof T & string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
}

interface CrudApiModule<T extends BaseEntity> {
  getAll: (params?: PaginationParams, config?: AxiosRequestConfig) => Promise<AxiosResponse<PaginatedResult<T>>>;
  create?: (data: Partial<T>, config?: AxiosRequestConfig) => Promise<AxiosResponse>;
  update?: (id: string | number, data: Partial<T>, config?: AxiosRequestConfig) => Promise<AxiosResponse>;
  delete?: (id: string | number, config?: AxiosRequestConfig) => Promise<AxiosResponse>;
}

interface CrudConfig<T extends BaseEntity> {
  title: string;
  apiModule: CrudApiModule<T>;
  columns: ColumnDef<T>[];
  formFields: FormField<T>[];
  defaultForm: Partial<T>;
  readOnly?: boolean;
}

// ────── FORM MODAL COMPONENT (Uncontrolled) ──────

function CrudFormModal<T extends BaseEntity>({
  config,
  editing,
  dynamicOptions,
  onSave,
  onClose,
}: {
  config: CrudConfig<T>;
  editing: T | null;
  dynamicOptions: Record<string, SelectOption[]>;
  onSave: (data: Record<string, unknown>) => void;
  onClose: () => void;
}) {
  const { register, handleSubmit, reset } = useForm<Record<string, unknown>>({
    defaultValues: editing
      ? (editing as unknown as Record<string, unknown>)
      : (config.defaultForm as Record<string, unknown>),
  });

  // Reset form when editing target changes
  const prevEditingRef = useRef(editing);
  useEffect(() => {
    if (prevEditingRef.current !== editing) {
      prevEditingRef.current = editing;
      reset(
        editing
          ? (editing as unknown as Record<string, unknown>)
          : (config.defaultForm as Record<string, unknown>)
      );
    }
  }, [editing, reset, config.defaultForm]);

  const onSubmit = (data: Record<string, unknown>) => {
    onSave(data);
  };

  return (
    <div className="loader-overlay items-start pt-[5%]">
      <div className="login-box max-w-[600px] w-full">
        <h3 className="mb-5 text-primary">{editing ? 'Kayıt Düzenle' : 'Yeni Kayıt'}</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="login-form">
          {config.formFields.map(f => (
            <div key={f.key} className="form-group">
              <label>{f.label}</label>
              {f.type === 'textarea' ? (
                <textarea
                  className="uppercase-input h-[80px]"
                  {...register(f.key)}
                />
              ) : f.options || dynamicOptions[f.key] ? (
                <select
                  className="uppercase-input appearance-none"
                  {...register(f.key)}
                >
                  <option value="">-- SEÇİNİZ --</option>
                  {(f.options || dynamicOptions[f.key] || []).map((o: SelectOption) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={f.type || 'text'}
                  className="uppercase-input"
                  {...register(f.key)}
                />
              )}
            </div>
          ))}
          <div className="flex gap-4 mt-5">
            <button type="submit" className="btn btn-primary flex-1 h-[50px]">KAYDET</button>
            <button type="button" className="btn flex-[0.5] bg-slate-200 h-[50px]" onClick={onClose}>İPTAL</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ────── FACTORY FUNCTION ──────

export function createCrudPage<T extends BaseEntity>(config: CrudConfig<T>) {
  return function CrudPage() {
    const [data, setData] = useState<T[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const deferredSearch = useDeferredValue(search);
    
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<T | null>(null);
    const [dynamicOptions, setDynamicOptions] = useState<Record<string, SelectOption[]>>({});

    const fetchData = useCallback(async (signal?: AbortSignal) => {
      setLoading(true);
      try {
        const res = await config.apiModule.getAll({ 
          page, 
          search: deferredSearch, 
          limit: 20 
        }, { signal }); 
        
        const responseData = res.data as PaginatedResult<T> | T[];
        if ('data' in responseData && 'meta' in responseData) {
          setData(responseData.data);
          setTotal(responseData.meta.total);
        } else if (Array.isArray(responseData)) {
          setData(responseData);
          setTotal(responseData.length);
        }
      } catch (e: unknown) { 
        if (e instanceof Error && e.name !== 'CanceledError' && e.name !== 'AbortError') {
          console.error(e); 
        }
      } finally { 
        setLoading(false); 
      }
    }, [page, deferredSearch]);

    useEffect(() => { 
      const controller = new AbortController();
      fetchData(controller.signal); 
      return () => controller.abort();
    }, [fetchData]);

    // FE-09: Resolved N+1 Request Problem using Promise.all
    useEffect(() => {
      let isMounted = true;
      const controller = new AbortController();

      const loadDynamicOptions = async () => {
        const fieldsWithApi = config.formFields.filter(f => !!f.apiOptions);
        if (fieldsWithApi.length === 0) return;

        try {
          const results = await Promise.all(
            fieldsWithApi.map(f => f.apiOptions!.apiFn({ signal: controller.signal }))
          );

          if (!isMounted) return;

          const newOptions: Record<string, SelectOption[]> = {};
          results.forEach((res, index) => {
            const field = fieldsWithApi[index];
            const items: Record<string, unknown>[] = (res.data as { data?: Record<string, unknown>[] })?.data || res.data || [];
            
            newOptions[field.key] = items.map((item) => ({
              value: String(item[field.apiOptions!.valueKey]),
              label: field.apiOptions!.labelFn 
                ? field.apiOptions!.labelFn(item) 
                : String(item[field.apiOptions!.labelKey] || ''),
            }));
          });

          setDynamicOptions(newOptions);
        } catch (e: unknown) {
          if (isMounted && e instanceof Error && e.name !== 'CanceledError' && e.name !== 'AbortError') {
            console.error('Dynamic options fetch failed:', e);
          }
        }
      };

      loadDynamicOptions();

      return () => {
        isMounted = false;
        controller.abort();
      };
    }, []);

    const handleSave = async (formData: Record<string, unknown>) => {
      try {
        if (editing) {
          await config.apiModule.update?.(editing.id, formData as Partial<T>);
          toast.success('Kayıt güncellendi');
        } else {
          await config.apiModule.create?.(formData as Partial<T>);
          toast.success('Yeni kayıt oluşturuldu');
        }
        setModalOpen(false);
        fetchData();
      } catch (e: unknown) { 
        console.error(e);
        const msg = e instanceof Error && 'response' in e ? (e as { response?: { data?: { message?: string } } }).response?.data?.message : undefined;
        toast.error(msg || 'İşlem başarısız');
      }
    };

    // FE-10: Optimized DataTable property mapping
    const mappedColumns = useMemo(() => [
      ...config.columns.map(col => ({
        header: col.label,
        accessor: col.key,
        render: col.render
      })),
      {
        header: 'İşlemler',
        className: 'w-[120px]',
        render: (r: T) => (
          <div className="flex gap-2">
            <button className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors" title="Düzenle" onClick={() => { setEditing(r); setModalOpen(true); }}><FiEdit2 size={16} /></button>
            {!config.readOnly && config.apiModule.delete && (
              <button className="p-2 hover:bg-danger/10 text-danger rounded-lg transition-colors" title="Sil" onClick={async () => {
                const confirmed = await confirmDialog('Silmek istediğinize emin misiniz?', true);
                if (confirmed) {
                  try {
                    await config.apiModule.delete!(r.id); 
                    toast.success('Kayıt silindi');
                    fetchData();
                  } catch (err: unknown) {
                    const msg = err instanceof Error && 'response' in err ? (err as { response?: { data?: { message?: string } } }).response?.data?.message : undefined;
                    toast.error(msg || 'Silme işlemi başarısız');
                  }
                }
              }}><FiTrash2 size={16} /></button>
            )}
          </div>
        ),
      },
    ], [config.columns, config.readOnly, config.apiModule]);

    return (
      <div className="page-container p-6 animate-in">
        <div className="flex justify-between items-center mb-8">
          <div>
             <h2 className="text-3xl font-black text-slate-800 tracking-tight">{config.title}</h2>
             <p className="text-slate-500 text-sm font-medium">Bu bölümdeki kayıtları yönetebilir ve güncelleyebilirsiniz.</p>
          </div>
          <div className="flex gap-3">
            <button className="w-12 h-12 flex items-center justify-center bg-white border-2 border-slate-100 rounded-2xl text-slate-400 hover:text-primary hover:border-primary/20 transition-colors shadow-sm" onClick={() => fetchData()}><FiRefreshCw /></button>
            {!config.readOnly && (
              <button className="flex items-center gap-2 bg-primary text-white h-12 px-6 rounded-2xl font-black shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-colors" onClick={() => { setEditing(null); setModalOpen(true); }}>
                <FiPlus strokeWidth={3} /> Yeni Kayıt
              </button>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-premium overflow-hidden border border-slate-100">
          <DataTable 
            columns={mappedColumns as Column<T>[]} 
            data={data} 
            total={total} 
            page={page} 
            search={search} 
            onSearchChange={setSearch} 
            onPageChange={setPage} 
            isLoading={loading} 
            getRowKey={(r: T) => (r as unknown as { id: number }).id}
          />
        </div>
        {modalOpen && (
          <CrudFormModal
            config={config}
            editing={editing}
            dynamicOptions={dynamicOptions}
            onSave={handleSave}
            onClose={() => setModalOpen(false)}
          />
        )}
      </div>
    );
  };
}