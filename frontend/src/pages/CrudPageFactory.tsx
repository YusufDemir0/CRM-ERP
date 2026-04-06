import { useState, useEffect, useCallback, ReactNode, useDeferredValue } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';

// ─── Types ───
interface FormField {
  key: string;
  label: string;
  type?: string;           // 'text' | 'number' | 'date' | 'textarea' | 'select' | 'subtable' | 'iban' | 'checkbox-group'
  multiSelect?: boolean;   // used when type === 'checkbox-group' or 'select'
  subFields?: FormField[]; // used when type === 'subtable'
  options?: { value: string; label: string }[];
  apiOptions?: {
    apiFn: (params?: any) => Promise<any>;
    valueKey: string;
    labelKey: string;
    labelFn?: (item: any) => string;
  };
  required?: boolean;
  disabled?: boolean;
  disabledOnEdit?: boolean;
  placeholder?: string;
  gridCols?: number;
  createLink?: { to: string; label: string };
}

interface CrudConfig {
  title: string;
  apiModule: any;
  columns: any[];
  formFields: FormField[];
  defaultForm: Record<string, any>;
  readOnly?: boolean;
}

const extractErrorMessage = (e: any, defaultMsg: string) => {
  let msg = e?.response?.data?.message || e?.response?.data?.error || e?.message || defaultMsg;
  if (Array.isArray(msg)) return msg.join(', ');
  if (typeof msg === 'object') return JSON.stringify(msg);
  return String(msg);
};

// ─── Factory ───
export function createCrudPage(config: CrudConfig) {
  return function CrudPage() {
    const location = useLocation();
    const navigate = useNavigate();

    const [data, setData] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const deferredSearch = useDeferredValue(search);
    const [activeOnly, setActiveOnly] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [form, setForm] = useState<Record<string, any>>(config.defaultForm);
    const [dynamicOptions, setDynamicOptions] = useState<Record<string, { value: string; label: string }[]>>({});

    // ─── Sequence logic ───
    useEffect(() => {
      if (location.state?.startCreateSequence && !location.state?.consumed) {
        setForm(config.defaultForm);
        setModalOpen(true);
        navigate(location.pathname, { replace: true, state: { ...location.state, consumed: true } });
      } else if (location.state?.resumeCreateSequence && !location.state?.consumed) {
        setForm(location.state.returnData || config.defaultForm);
        setModalOpen(true);
        navigate(location.pathname, { replace: true, state: { ...location.state, consumed: true } });
      }
    }, [location, navigate]);

    const handleCloseModal = () => {
      setModalOpen(false);
      if (location.state?.returnTo) {
        navigate(location.state.returnTo, { state: { resumeCreateSequence: true, returnData: location.state.returnData } });
      }
    };

    // ─── Fetch table data ───
    const fetchData = useCallback(async () => {
      setLoading(true);
      try {
        const params: any = { page, search: deferredSearch, limit: 20 };
        if (activeOnly) params.state = 1;
        const res = await config.apiModule.getAll(params);
        const responseData = res.data;
        if (responseData?.data && Array.isArray(responseData.data)) {
          setData(responseData.data);
          setTotal(responseData.meta?.total || responseData.data.length);
        } else if (Array.isArray(responseData)) {
          setData(responseData);
          setTotal(responseData.length);
        } else {
          setData([]);
          setTotal(0);
        }
      } catch (e: any) {
        console.error(`${config.title} fetch error:`, e);
        if (e.response?.status !== 401) {
          toast.error(extractErrorMessage(e, 'Veri yüklenemedi'));
        }
      } finally {
        setLoading(false);
      }
    }, [page, deferredSearch, activeOnly]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const loadDynamicOptions = useCallback(() => {
      const fieldsWithApi: FormField[] = [];
      config.formFields.forEach(f => {
        if (f.apiOptions) fieldsWithApi.push(f);
        if (f.subFields) {
          f.subFields.forEach(sf => { if (sf.apiOptions) fieldsWithApi.push(sf); });
        }
      });
      fieldsWithApi.forEach(async (field) => {
        try {
          // Send no filter to api options unless we know the endpoint handles it well
          const res = await field.apiOptions!.apiFn();
          const items = res.data?.data || res.data || [];
          const opts = (Array.isArray(items) ? items : []).map((item: any) => ({
            value: String(item[field.apiOptions!.valueKey]),
            label: field.apiOptions!.labelFn ? field.apiOptions!.labelFn(item) : String(item[field.apiOptions!.labelKey] || ''),
          }));
          setDynamicOptions((prev) => ({ ...prev, [field.key]: opts }));
        } catch (e) {
          console.error(`Dynamic Option fetch failed for ${field.key}`, e);
        }
      });
    }, []);

    useEffect(() => { loadDynamicOptions(); }, [loadDynamicOptions]);

    // ─── Modal handlers ───
    const openCreate = () => {
      setEditing(null);
      setForm({ ...config.defaultForm });
      setModalOpen(true);
    };

    const openEdit = (item: any) => {
      setEditing(item);
      const f: Record<string, any> = {};
      for (const field of config.formFields) {
        if (field.type === 'subtable') {
          f[field.key] = Array.isArray(item[field.key]) ? item[field.key].map((subItem: any) => ({ ...subItem })) : [];
        } else {
          f[field.key] = item[field.key]?.toString() ?? '';
        }
      }
      setForm(f);
      setModalOpen(true);
    };

    const [confirmAction, setConfirmAction] = useState<{ id: number, type: 'delete' } | null>(null);

    const handleSave = async () => {
      try {
        setSaving(true);
        const minWait = new Promise(r => setTimeout(r, 5000));

        const payload: Record<string, any> = {};
        for (const field of config.formFields) {
          if (field.type === 'subtable') {
            const list = form[field.key] || [];
            payload[field.key] = list.map((item: any) => {
              const row: any = {};
              field.subFields?.forEach(sf => {
                if (item[sf.key] !== '' && item[sf.key] !== undefined) {
                  row[sf.key] = sf.type === 'number' ? Number(item[sf.key]) : item[sf.key];
                }
              });
              return row;
            });
          } else if (form[field.key] !== '' && form[field.key] !== undefined) {
            if (field.type === 'iban') {
               payload[field.key] = form[field.key].replace(/\s/g, ''); // strip spaces for API
            } else {
               payload[field.key] = field.type === 'number' ? Number(form[field.key]) : form[field.key];
            }
          }
        }

        const apiCall = editing ? config.apiModule.update(editing.id, payload) : config.apiModule.create(payload);
        
        await Promise.all([apiCall, minWait]);

        toast.success(editing ? 'Güncellendi' : 'Oluşturuldu');
        
        if (location.state?.returnTo && !editing) {
          navigate(location.state.returnTo, { state: { resumeCreateSequence: true, returnData: location.state.returnData } });
        } else {
          setModalOpen(false);
          fetchData();
          loadDynamicOptions();
        }
      } catch (e: any) {
        toast.error(extractErrorMessage(e, 'İşlem başarısız'));
      } finally {
        setSaving(false);
      }
    };

    // ─── Computed flags ───
    const hasDeleteAction = !!config.apiModule.delete && !config.readOnly;
    const hasFormFields = config.formFields.length > 0 && !config.readOnly;

    const allColumns = [
      { key: '_seq', label: 'Sıra', render: (_: any, idx: number) => (page - 1) * 20 + idx + 1 },
      ...config.columns,
      ...(hasFormFields || hasDeleteAction ? [{
        key: 'actions', label: 'İşlem', render: (r: any) => (
          <div style={{ display: 'flex', gap: 4 }}>
            {hasFormFields && <button className="btn-icon" onClick={() => openEdit(r)} title="Düzenle"><FiEdit2 size={14} /></button>}
            {hasDeleteAction && <button className="btn-icon" onClick={() => setConfirmAction({ id: r.id, type: 'delete' })} style={{ color: 'var(--danger)' }} title="Sil"><FiTrash2 size={14} /></button>}
          </div>
        ),
      }] : []),
    ];

    // ─── Render Form Field ───
    const renderField = (field: FormField) => {
      const isDisabled = field.disabled || (field.disabledOnEdit && !!editing);
      const allOptions = field.options || dynamicOptions[field.key] || null;

      if (field.type === 'subtable') {
        const list = form[field.key] || [];
        return (
          <div className="subtable-container" style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '12px', marginTop: 8, background: 'var(--surface)' }}>
            <div style={{ overflowX: 'auto' }}>
              {/* ... (subtable implementation kept omitted for brevity, keeping simple table) ... */}
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                 <thead><tr>{field.subFields?.map(sf => <th key={sf.key} style={{ textAlign: 'left', padding: '0 8px 8px 0', fontSize: '0.85rem' }}>{sf.label}</th>)}<th></th></tr></thead>
                 <tbody>
                    {list.map((rowItem: any, rowIndex: number) => (
                      <tr key={rowIndex}>
                        {field.subFields?.map(sf => (
                           <td key={sf.key} style={{ padding: '8px 8px 8px 0' }}>
                              {sf.options || dynamicOptions[sf.key] ? (
                                <select className="form-input" value={rowItem[sf.key] || ''} onChange={(e) => {
                                  const newList = [...list]; newList[rowIndex] = { ...newList[rowIndex], [sf.key]: e.target.value }; setForm({ ...form, [field.key]: newList });
                                }} required={sf.required}>
                                  <option value="">Seçiniz</option>
                                  {(sf.options || dynamicOptions[sf.key] || []).map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                              ) : (
                                <input className="form-input" type={sf.type || 'text'} value={rowItem[sf.key] || ''} onChange={(e) => {
                                  const newList = [...list]; newList[rowIndex] = { ...newList[rowIndex], [sf.key]: e.target.value }; setForm({ ...form, [field.key]: newList });
                                }} required={sf.required} placeholder={sf.placeholder} />
                              )}
                           </td>
                        ))}
                        <td style={{ textAlign: 'right' }}><button type="button" className="btn-icon" onClick={() => setForm({ ...form, [field.key]: list.filter((_: any, i: number) => i !== rowIndex) })}><FiTrash2 color="var(--danger)" /></button></td>
                      </tr>
                    ))}
                 </tbody>
              </table>
            </div>
            <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={() => setForm({ ...form, [field.key]: [...list, {}] })}><FiPlus /> Satır Ekle</button>
          </div>
        );
      }

      if (field.type === 'textarea') {
        return <textarea className="form-input" value={form[field.key] || ''} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} required={field.required} disabled={isDisabled} placeholder={field.placeholder} rows={3} />;
      }

      if (allOptions || field.apiOptions) {
        return (
          <div style={{ display: 'flex', gap: '8px' }}>
            <select className="form-input" style={{ flex: 1 }} value={form[field.key] || ''} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} disabled={isDisabled} required={field.required}>
              <option value="">{field.placeholder || 'Seçiniz'}</option>
              {(allOptions || []).map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            {field.createLink && (
              <button type="button" className="btn btn-secondary" onClick={() => {
                navigate(field.createLink!.to, { state: { startCreateSequence: true, returnTo: location.pathname, returnData: form } });
              }} style={{ whiteSpace: 'nowrap' }}>
                <FiPlus /> {field.createLink.label}
              </button>
            )}
          </div>
        );
      }

      if (field.type === 'iban') {
        return (
          <input className="form-input" type="text"
            value={form[field.key] || ''}
            onChange={(e) => {
               // Mask IBAN: Keep alphanumeric, uppercase, add spaces every 4 chars
               let val = e.target.value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
               if (!val.startsWith('TR') && val.length > 0) { val = 'TR' + val.replace(/^TR/, ''); }
               val = val.replace(/(.{4})/g, '$1 ').trim();
               setForm({ ...form, [field.key]: val });
            }}
            required={field.required} disabled={isDisabled} placeholder={field.placeholder}
          />
        );
      }

      if (field.type === 'checkbox-group' || (field.type === 'select' && field.multiSelect)) {
        const selectedValues = Array.isArray(form[field.key]) ? form[field.key] : [];
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, maxHeight: 300, overflowY: 'auto' }}>
            {((allOptions as any[]) || []).map((opt: any) => (
              <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={selectedValues.includes(opt.value)} onChange={(e) => {
                  const newValues = e.target.checked ? [...selectedValues, opt.value] : selectedValues.filter((v: any) => v !== opt.value);
                  setForm({ ...form, [field.key]: newValues });
                }} style={{ width: 16, height: 16 }} />
                {opt.label}
              </label>
            ))}
          </div>
        );
      }

      return <input className="form-input" type={field.type || 'text'} value={form[field.key] || ''} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} required={field.required} disabled={isDisabled} placeholder={field.placeholder} />;
    };

    return (
      <div>
        <div className="page-header" style={{ marginBottom: 16 }}>
          <h1>{config.title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Toggle switch for Active/Passive */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
              <input type="checkbox" checked={activeOnly} onChange={e => setActiveOnly(e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
              Sadece Aktif Kayıtlar
            </label>
          </div>
        </div>
        <DataTable
          columns={allColumns} data={data} total={total} page={page}
          search={search} onSearchChange={setSearch} onPageChange={setPage} loading={loading}
          actions={hasFormFields ? <button className="btn btn-primary btn-sm" onClick={openCreate}><FiPlus /> Yeni Ekle</button> : undefined}
        />

        {hasFormFields && (
          <Modal isOpen={modalOpen} onClose={handleCloseModal} title={editing ? 'Düzenle' : 'Yeni Kayıt'} width={config.formFields.some(f => f.type === 'subtable') ? '900px' : undefined}
            footer={<>
              <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>İptal</button>
              <button type="submit" form="crud-form" className="btn btn-primary">Kaydet</button>
            </>}
          >
            <form id="crud-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }} style={{ display: 'grid', gap: '16px' }}>
              {config.formFields.map((field) => (
                <div className="form-group" key={field.key} style={{ gridColumn: field.type === 'subtable' ? '1 / -1' : undefined }}>
                  <label style={{ display: field.type === 'subtable' ? 'none' : 'block' }}>
                    {field.label}{field.required && <span style={{ color: 'var(--danger)', marginLeft: 4 }}>*</span>}
                  </label>
                  {field.type === 'subtable' && <h3 style={{ margin: '16px 0 8px 0', fontSize: '1.1rem' }}>{field.label}</h3>}
                  {renderField(field)}
                </div>
              ))}
            </form>
          </Modal>
        )}

        <Modal isOpen={!!confirmAction} onClose={() => setConfirmAction(null)} title="Emin misiniz?"
          footer={<>
            <button className="btn btn-secondary" onClick={() => setConfirmAction(null)}>İptal</button>
            <button className="btn btn-primary" style={{ backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={async () => {
              if (confirmAction) {
                try { await config.apiModule.delete(confirmAction.id); toast.success('Silindi'); fetchData(); } catch(e) {}
                setConfirmAction(null);
              }
            }}>Evet, Sil</button>
          </>}
        >
          <p>Bu kaydı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.</p>
        </Modal>

        {/* Global Loading Overlay */}
        {saving && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <div className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white', width: 48, height: 48, marginBottom: 16 }}></div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>İşlem Başlatıldı...</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: 8 }}>Lütfen bekleyiniz, bu işlem biraz sürebilir.</p>
          </div>
        )}
      </div>
    );
  };
}
