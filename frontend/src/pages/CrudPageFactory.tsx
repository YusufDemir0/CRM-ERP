import React, { useState, useEffect, useCallback, useDeferredValue } from 'react';
import DataTable from '../components/DataTable';
import { FiPlus, FiEdit2, FiTrash2, FiRefreshCw } from 'react-icons/fi';
import type { BaseEntity, PaginationParams, PaginatedResult } from '../types';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';

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
  update?: (id: number, data: Partial<T>, config?: AxiosRequestConfig) => Promise<AxiosResponse>;
  delete?: (id: number, config?: AxiosRequestConfig) => Promise<AxiosResponse>;
}

interface CrudConfig<T extends BaseEntity> {
  title: string;
  apiModule: CrudApiModule<T>;
  columns: ColumnDef<T>[];
  formFields: FormField<T>[];
  defaultForm: Partial<T>;
  readOnly?: boolean;
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
    const [form, setForm] = useState<Record<string, unknown>>(config.defaultForm as Record<string, unknown>);
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

    useEffect(() => {
      let isMounted = true;
      const controller = new AbortController();

      config.formFields.forEach(async (field) => {
        if (field.apiOptions) {
          try {
            const res = await field.apiOptions.apiFn({ signal: controller.signal });
            if (!isMounted) return;

            const items: Record<string, unknown>[] = (res.data as { data?: Record<string, unknown>[] })?.data || res.data || [];
            const opts: SelectOption[] = items.map((item) => ({
              value: String(item[field.apiOptions!.valueKey]),
              label: field.apiOptions!.labelFn 
                ? field.apiOptions!.labelFn(item) 
                : String(item[field.apiOptions!.labelKey] || ''),
            }));
            setDynamicOptions((prev) => ({ ...prev, [field.key]: opts }));
          } catch (e: unknown) { 
            if (isMounted && e instanceof Error && e.name !== 'CanceledError' && e.name !== 'AbortError') {
              console.error(e); 
            }
          }
        }
      });

      return () => {
        isMounted = false;
        controller.abort();
      };
    }, []);

    const handleSave = async () => {
      try {
        if (editing) {
          await config.apiModule.update?.(editing.id, form as Partial<T>);
        } else {
          await config.apiModule.create?.(form as Partial<T>);
        }
        setModalOpen(false);
        fetchData();
      } catch (e) { console.error(e); }
    };

    const allColumns = [
      ...config.columns,
      {
        key: 'actions' as keyof T & string, label: 'İşlemler', sortable: false,
        render: (r: T) => (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn" style={{ padding: '5px 10px' }} onClick={() => { setEditing(r); setForm(r as unknown as Record<string, unknown>); setModalOpen(true); }}><FiEdit2 /></button>
            {!config.readOnly && config.apiModule.delete && (
              <button className="btn" style={{ color: 'var(--danger)', padding: '5px 10px' }} onClick={async () => {
                const confirmed = await import('../utils/confirmDialog').then(m => m.confirmDialog('Silmek istediğinize emin misiniz?', true));
                if (confirmed) {
                  await config.apiModule.delete!(r.id); fetchData();
                }
              }}><FiTrash2 /></button>
            )}
          </div>
        ),
      },
    ];

    return (
      <div className="page-container">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ color: 'var(--primary)' }}>{config.title}</h2>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button className="btn" onClick={() => fetchData()}><FiRefreshCw /></button>
            {!config.readOnly && (
              <button className="btn btn-primary" onClick={() => { setEditing(null); setForm(config.defaultForm as Record<string, unknown>); setModalOpen(true); }}>
                <FiPlus /> Yeni Kayıt
              </button>
            )}
          </div>
        </div>
        <div className="table-card">
          <DataTable columns={allColumns} data={data} total={total} page={page} search={search} onSearchChange={setSearch} onPageChange={setPage} loading={loading} />
        </div>
        {modalOpen && (
          <div className="loader-overlay" style={{ alignItems: 'flex-start', paddingTop: '5%' }}>
            <div className="login-box" style={{ maxWidth: '600px', width: '100%' }}>
              <h3 style={{ marginBottom: '20px', color: 'var(--primary)' }}>{editing ? 'Kayıt Düzenle' : 'Yeni Kayıt'}</h3>
              <div className="login-form">
                {config.formFields.map(f => (
                  <div key={f.key} className="form-group">
                    <label>{f.label}</label>
                    {f.type === 'textarea' ? (
                      <textarea className="uppercase-input" style={{ height: '80px' }} value={String(form[f.key] || '')} onChange={e => setForm({...form, [f.key]: e.target.value})} />
                    ) : f.options || dynamicOptions[f.key] ? (
                      <select className="uppercase-input" style={{ appearance: 'none' }} value={String(form[f.key] || '')} onChange={e => setForm({...form,[f.key]: e.target.value})}>
                        <option value="">-- SEÇİNİZ --</option>
                        {(f.options || dynamicOptions[f.key] || []).map((o: SelectOption) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    ) : (
                      <input type={f.type || 'text'} className="uppercase-input" value={String(form[f.key] || '')} onChange={e => setForm({...form, [f.key]: e.target.value})} />
                    )}
                  </div>
                ))}
                <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                  <button className="btn btn-primary" style={{ flex: 1, height: '50px' }} onClick={handleSave}>KAYDET</button>
                  <button className="btn" style={{ flex: 0.5, background: '#e2e8f0', height: '50px' }} onClick={() => setModalOpen(false)}>İPTAL</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
}