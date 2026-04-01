import { useState, useEffect, useCallback, ReactNode } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

// ─── Types ───
interface FormField {
  key: string;
  label: string;
  type?: string;           // 'text' | 'number' | 'date' | 'textarea' | 'select'
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
      const fieldsWithApi = config.formFields.filter((f) => f.apiOptions);
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
        f[field.key] = item[field.key]?.toString() ?? '';
      }
      setForm(f);
      setModalOpen(true);
    };

    const handleSave = async () => {
      try {
        const payload: Record<string, any> = {};
        for (const field of config.formFields) {
          if (form[field.key] !== '' && form[field.key] !== undefined) {
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

      // Merge static options with dynamic API options
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
            footer={<>
              <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>İptal</button>
              <button className="btn btn-primary" onClick={handleSave}>Kaydet</button>
            </>}
          >
            {config.formFields.map((field) => (
              <div className="form-group" key={field.key}>
                <label>{field.label}{field.required && <span style={{ color: 'var(--danger)', marginLeft: 4 }}>*</span>}</label>
                {renderField(field)}
              </div>
            ))}
          </Modal>
        )}
      </div>
    );
  };
}
