import { useState, useEffect, useCallback, ReactNode } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

// ─── Types ───
interface FormField {
  key: string;
  label: string;
  type?: string;           // 'text' | 'number' | 'date' | 'textarea' | 'select' | 'subtable'
  subFields?: FormField[]; // used when type === 'subtable'
  options?: { value: string; label: string }[];  // Static options
  apiOptions?: {           // Dynamic options loaded from API
    apiFn: () => Promise<any>;
    valueKey: string;      // e.g. 'id'
    labelKey: string;      // e.g. 'name'
    labelFn?: (item: any) => string;  // Custom label builder
  };
  required?: boolean;
  disabled?: boolean;
  disabledOnEdit?: boolean;
  placeholder?: string;
  gridCols?: number;       // For UI styling
}

interface CrudConfig {
  title: string;
  apiModule: any;
  columns: any[];
  formFields: FormField[];
  defaultForm: Record<string, any>;
  readOnly?: boolean;      // No create/edit/delete at all
}

// ─── Factory ───
export function createCrudPage(config: CrudConfig) {
  return function CrudPage() {
    const [data, setData] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [form, setForm] = useState<Record<string, any>>(config.defaultForm);

    // Dynamic dropdown options loaded from API
    const [dynamicOptions, setDynamicOptions] = useState<Record<string, { value: string; label: string }[]>>({});

    // ─── Fetch table data ───
    const fetchData = useCallback(async () => {
      setLoading(true);
      try {
        const res = await config.apiModule.getAll({ page, search, limit: 20 });
        const responseData = res.data;
        // Handle both paginated {data: [], meta: {}} and plain array responses
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
        setData([]);
        setTotal(0);
        if (e.response?.status !== 401) {
          toast.error(e.response?.data?.message || `${config.title} yüklenemedi`);
        }
      } finally {
        setLoading(false);
      }
    }, [page, search]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // ─── Load dynamic dropdown options ───
    useEffect(() => {
      const fieldsWithApi: FormField[] = [];
      config.formFields.forEach(f => {
        if (f.apiOptions) fieldsWithApi.push(f);
        if (f.subFields) {
          f.subFields.forEach(sf => {
            if (sf.apiOptions) fieldsWithApi.push(sf);
          });
        }
      });

      if (fieldsWithApi.length === 0) return;

      fieldsWithApi.forEach(async (field) => {
        try {
          const res = await field.apiOptions!.apiFn();
          const items = res.data?.data || res.data || [];
          const opts = (Array.isArray(items) ? items : []).map((item: any) => ({
            value: String(item[field.apiOptions!.valueKey]),
            label: field.apiOptions!.labelFn
              ? field.apiOptions!.labelFn(item)
              : String(item[field.apiOptions!.labelKey] || ''),
          }));
          setDynamicOptions((prev) => ({ ...prev, [field.key]: opts }));
        } catch (e) {
          console.error(`Failed to load options for ${field.key}:`, e);
          setDynamicOptions((prev) => ({ ...prev, [field.key]: [] }));
        }
      });
    }, []);

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
          // Clone the array deeply
          f[field.key] = Array.isArray(item[field.key]) 
            ? item[field.key].map((subItem: any) => ({ ...subItem }))
            : [];
        } else {
          f[field.key] = item[field.key]?.toString() ?? '';
        }
      }
      setForm(f);
      setModalOpen(true);
    };

    const handleSave = async () => {
      try {
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
            payload[field.key] = field.type === 'number' ? Number(form[field.key]) : form[field.key];
          }
        }

        if (editing) {
          await config.apiModule.update(editing.id, payload);
          toast.success('Güncellendi');
        } else {
          await config.apiModule.create(payload);
          toast.success('Oluşturuldu');
        }
        setModalOpen(false);
        fetchData();
      } catch (e: any) {
        toast.error(e.response?.data?.message || 'İşlem başarısız');
      }
    };

    const handleDelete = async (id: number) => {
      if (!confirm('Silmek istediğinize emin misiniz?')) return;
      try {
        await config.apiModule.delete(id);
        toast.success('Silindi');
        fetchData();
      } catch (e: any) {
        toast.error(e.response?.data?.message || 'Silme başarısız');
      }
    };

    // ─── Computed flags ───
    const hasDeleteAction = !!config.apiModule.delete && !config.readOnly;
    const hasFormFields = config.formFields.length > 0 && !config.readOnly;

    const allColumns = [
      ...config.columns,
      ...(hasFormFields || hasDeleteAction ? [{
        key: 'actions', label: 'İşlem', render: (r: any) => (
          <div style={{ display: 'flex', gap: 4 }}>
            {hasFormFields && <button className="btn-icon" onClick={() => openEdit(r)} title="Düzenle"><FiEdit2 size={14} /></button>}
            {hasDeleteAction && <button className="btn-icon" onClick={() => handleDelete(r.id)} style={{ color: 'var(--danger)' }} title="Sil"><FiTrash2 size={14} /></button>}
          </div>
        ),
      }] : []),
    ];

    // ─── Render a single form field ───
    const renderField = (field: FormField) => {
      const isDisabled = field.disabled || (field.disabledOnEdit && !!editing);

      // --- SUBTABLE RENDER ---
      if (field.type === 'subtable') {
        const list = form[field.key] || [];
        return (
          <div className="subtable-container" style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '12px', marginTop: 8, background: 'var(--surface)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {field.subFields?.map(sf => (
                      <th key={sf.key} style={{ textAlign: 'left', padding: '0 8px 8px 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {sf.label} {sf.required && <span style={{ color: 'var(--danger)' }}>*</span>}
                      </th>
                    ))}
                    <th style={{ width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((rowItem: any, rowIndex: number) => (
                    <tr key={rowIndex} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      {field.subFields?.map(sf => {
                        const allOptions = sf.options || dynamicOptions[sf.key] || null;
                        return (
                          <td key={sf.key} style={{ padding: '8px 8px 8px 0' }}>
                            {allOptions || sf.apiOptions ? (
                              <select
                                className="form-input"
                                value={rowItem[sf.key] || ''}
                                onChange={(e) => {
                                  const newList = [...list];
                                  newList[rowIndex] = { ...newList[rowIndex], [sf.key]: e.target.value };
                                  setForm({ ...form, [field.key]: newList });
                                }}
                                required={sf.required}
                              >
                                <option value="">{sf.placeholder || 'Seçiniz'}</option>
                                {(allOptions || []).map((opt) => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                className="form-input"
                                type={sf.type || 'text'}
                                value={rowItem[sf.key] || ''}
                                onChange={(e) => {
                                  const newList = [...list];
                                  newList[rowIndex] = { ...newList[rowIndex], [sf.key]: e.target.value };
                                  setForm({ ...form, [field.key]: newList });
                                }}
                                required={sf.required}
                                placeholder={sf.placeholder}
                              />
                            )}
                          </td>
                        );
                      })}
                      <td style={{ textAlign: 'right', padding: '8px 0' }}>
                        <button type="button" className="btn-icon" onClick={() => {
                          const newList = list.filter((_: any, i: number) => i !== rowIndex);
                          setForm({ ...form, [field.key]: newList });
                        }}><FiTrash2 color="var(--danger)" /></button>
                      </td>
                    </tr>
                  ))}
                  {list.length === 0 && (
                    <tr>
                      <td colSpan={(field.subFields?.length || 0) + 1} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                        Kayıt Yok
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={() => {
              setForm({ ...form, [field.key]: [...list, {}] });
            }}>
              <FiPlus /> Satır Ekle
            </button>
          </div>
        );
      }

      // --- STANDARD RENDER ---
      const allOptions = field.options || dynamicOptions[field.key] || null;

      if (field.type === 'textarea') {
        return (
          <textarea
            className="form-input"
            value={form[field.key] || ''}
            onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
            required={field.required}
            disabled={isDisabled}
            placeholder={field.placeholder}
            rows={3}
          />
        );
      }

      if (allOptions || field.apiOptions) {
        const opts = allOptions || [];
        return (
          <select
            className="form-input"
            value={form[field.key] || ''}
            onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
            disabled={isDisabled}
          >
            <option value="">{field.placeholder || 'Seçiniz'}</option>
            {opts.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        );
      }

      return (
        <input
          className="form-input"
          type={field.type || 'text'}
          value={form[field.key] || ''}
          onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
          required={field.required}
          disabled={isDisabled}
          placeholder={field.placeholder}
        />
      );
    };

    return (
      <div>
        <div className="page-header"><h1>{config.title}</h1></div>
        <DataTable
          columns={allColumns} data={data} total={total} page={page}
          search={search} onSearchChange={setSearch} onPageChange={setPage}
          loading={loading}
          actions={hasFormFields ? <button className="btn btn-primary btn-sm" onClick={openCreate}><FiPlus /> Yeni Ekle</button> : undefined}
        />
        {hasFormFields && (
          <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Düzenle' : 'Yeni Kayıt'}
            // Add custom width for forms that have subtables
            width={config.formFields.some(f => f.type === 'subtable') ? '900px' : undefined}
            footer={<>
              <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>İptal</button>
              <button className="btn btn-primary" onClick={handleSave}>Kaydet</button>
            </>}
          >
            {config.formFields.map((field) => (
              <div className="form-group" key={field.key} style={{ gridColumn: field.type === 'subtable' ? '1 / -1' : undefined }}>
                <label style={{ display: field.type === 'subtable' ? 'none' : 'block' }}>
                  {field.label}{field.required && <span style={{ color: 'var(--danger)', marginLeft: 4 }}>*</span>}
                </label>
                {field.type === 'subtable' && (
                  <h3 style={{ margin: '16px 0 8px 0', fontSize: '1.1rem' }}>{field.label}</h3>
                )}
                {renderField(field)}
              </div>
            ))}
          </Modal>
        )}
      </div>
    );
  };
}
