import React, { useState, useEffect, useCallback, ReactNode, useDeferredValue } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { FiPlus, FiEdit2, FiTrash2, FiRefreshCw, FiPower } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface FormField {
  key: string; label: string; type?: string;
  options?: { value: string; label: string }[];
  apiOptions?: { apiFn: (params?: any) => Promise<any>; valueKey: string; labelKey: string; labelFn?: (item: any) => string; };
  required?: boolean; placeholder?: string; gridCols?: number;
}

interface CrudConfig {
  title: string; apiModule: any; columns: any[]; formFields: FormField[]; defaultForm: Record<string, any>;
  readOnly?: boolean;
}

export function createCrudPage(config: CrudConfig) {
  return function CrudPage() {
    const [data, setData] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const deferredSearch = useDeferredValue(search);
    
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [form, setForm] = useState<Record<string, any>>(config.defaultForm);
    const [dynamicOptions, setDynamicOptions] = useState<Record<string, any[]>>({});

    const fetchData = useCallback(async () => {
      setLoading(true);
      try {
        const res = await config.apiModule.getAll({ page, search: deferredSearch, limit: 20 });
        setData(res.data?.data || res.data ||[]);
        setTotal(res.data?.meta?.total || res.data?.data?.length || 0);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    }, [page, deferredSearch]);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
      config.formFields.forEach(async (field) => {
        if (field.apiOptions) {
          try {
            const res = await field.apiOptions.apiFn();
            const items = res.data?.data || res.data || [];
            const opts = items.map((item: any) => ({
              value: String(item[field.apiOptions!.valueKey]),
              label: field.apiOptions!.labelFn ? field.apiOptions!.labelFn(item) : String(item[field.apiOptions!.labelKey] || ''),
            }));
            setDynamicOptions((prev) => ({ ...prev, [field.key]: opts }));
          } catch (e) { console.error(e); }
        }
      });
    },[]);

    const handleSave = async () => {
      try {
        if (editing) await config.apiModule.update(editing.id, form);
        else await config.apiModule.create(form);
        setModalOpen(false);
        fetchData();
      } catch (e) { console.error(e); }
    };

    const allColumns =[
      ...config.columns,
      {
        key: 'actions', label: 'İşlemler', sortable: false,
        render: (r: any) => (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn" style={{ padding: '5px 10px' }} onClick={() => { setEditing(r); setForm(r); setModalOpen(true); }}><FiEdit2 /></button>
            {!config.readOnly && config.apiModule.delete && (
              <button className="btn" style={{ color: 'var(--danger)', padding: '5px 10px' }} onClick={async () => {
                if (window.confirm('Silmek istediğinize emin misiniz?')) {
                  await config.apiModule.delete(r.id); fetchData();
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
              <button className="btn btn-primary" onClick={() => { setEditing(null); setForm(config.defaultForm); setModalOpen(true); }}>
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
                      <textarea className="uppercase-input" style={{ height: '80px' }} value={form[f.key] || ''} onChange={e => setForm({...form, [f.key]: e.target.value})} />
                    ) : f.options || dynamicOptions[f.key] ? (
                      <select className="uppercase-input" style={{ appearance: 'none' }} value={form[f.key] || ''} onChange={e => setForm({...form,[f.key]: e.target.value})}>
                        <option value="">-- SEÇİNİZ --</option>
                        {(f.options || dynamicOptions[f.key] ||[]).map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    ) : (
                      <input type={f.type || 'text'} className="uppercase-input" value={form[f.key] || ''} onChange={e => setForm({...form, [f.key]: e.target.value})} />
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