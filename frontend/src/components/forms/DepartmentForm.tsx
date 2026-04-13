import React, { useState, useEffect } from 'react';
import { departmentsAPI, accountsAPI } from '../../services/api';
import { FiX, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useQuickCreate } from '../../context/QuickCreateContext';

interface DepartmentFormProps {
  initialData?: any;
  editingId?: number | null;
  onSuccess: (data: any) => void;
  onCancel: () => void;
}

const onlyLetters = (val: string) => val.replace(/[0-9]/g, '');
const onlyAbbrLetters = (val: string) => val.replace(/[^A-ZÇĞİÖŞÜa-zçğıöşü]/g, '').toLocaleUpperCase('tr-TR');

export const DepartmentForm: React.FC<DepartmentFormProps> = ({
  initialData,
  editingId,
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState(initialData || {
    name: '',
    description: '',
    abbreviation: '',
    departmentTypeId: '',
    commercialAccountId: ''
  });

  const [accounts, setAccounts] = useState<any[]>([]);
  const [deptTypes, setDeptTypes] = useState<any[]>([]);
  const { openCreate } = useQuickCreate();

  useEffect(() => {
    async function fetchData() {
      try {
        const [accRes, typesRes] = await Promise.all([
          accountsAPI.getAll({ limit: 100 }),
          departmentsAPI.getTypes()
        ]);
        setAccounts(accRes.data.data.filter((a: any) => a.state === 1));
        setDeptTypes(typesRes.data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.abbreviation && formData.abbreviation.length > 4) {
      toast.error('Kısa kod en fazla 4 karakter olmalıdır.');
      return;
    }
    const payload = {
      ...formData,
      departmentTypeId: formData.departmentTypeId ? Number(formData.departmentTypeId) : undefined,
      commercialAccountId: formData.commercialAccountId ? Number(formData.commercialAccountId) : undefined
    };

    try {
      if (editingId) {
        const res = await departmentsAPI.update(editingId, payload);
        onSuccess(res.data);
      } else {
        const res = await departmentsAPI.create(payload);
        onSuccess(res.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddAccount = () => {
    openCreate('account', {
      onSuccess: (newAcc: any) => {
        setFormData((prev: any) => ({ ...prev, commercialAccountId: newAcc.id }));
        // Refresh accounts list
        accountsAPI.getAll({ limit: 100 }).then((res: any) => setAccounts(res.data.data.filter((a: any) => a.state === 1)));
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px' }}>
        <div className="form-group">
          <label>Departman Adı (Zorunlu)</label>
          <input required className="uppercase-input" value={formData.name} onChange={e => setFormData({ ...formData, name: onlyLetters(e.target.value).toLocaleUpperCase('tr-TR') })} placeholder="ÖR: MERKEZ DEPO" />
        </div>
        <div className="form-group">
          <label>Kısa Kod (3-4 harf)</label>
          <input
            maxLength={4}
            className="uppercase-input"
            style={{ fontWeight: 800, letterSpacing: '3px', textAlign: 'center' }}
            value={formData.abbreviation}
            onChange={e => setFormData({ ...formData, abbreviation: onlyAbbrLetters(e.target.value).slice(0, 4) })}
            placeholder="MKZ"
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        <div className="form-group">
          <label>Departman Tipi</label>
          <select className="uppercase-input" style={{ appearance: 'none' }} value={formData.departmentTypeId} onChange={e => setFormData({ ...formData, departmentTypeId: e.target.value })}>
            <option value="">Lütfen Seçiniz</option>
            {deptTypes.map((dt: any) => <option key={dt.id} value={dt.id}>{dt.name} ({dt.abbreviation})</option>)}
          </select>
        </div>
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label>Bağlı Finans/Kasa Hesabı</label>
            <button
              type="button"
              className="btn-link"
              style={{ fontSize: '11px', fontWeight: 600, color: 'var(--primary)', marginBottom: '5px' }}
              onClick={handleAddAccount}
            >
              + YENİ HESAP EKLE
            </button>
          </div>
          <select className="uppercase-input" style={{ appearance: 'none' }} value={formData.commercialAccountId} onChange={e => setFormData({ ...formData, commercialAccountId: e.target.value })}>
            <option value="">Lütfen Seçiniz</option>
            {accounts.map((acc: any) => (
              <option key={acc.id} value={acc.id}>{acc.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label>Departman Açıklaması</label>
        <input className="uppercase-input" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value.toLocaleUpperCase('tr-TR') })} placeholder="..." />
      </div>

      <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
        <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '50px' }}>
          <FiCheck /> {editingId ? 'GÜNCELLE' : 'DEPARTMANI KAYDET'}
        </button>
        <button type="button" className="btn" style={{ flex: 0.5, background: '#e2e8f0', height: '50px' }} onClick={onCancel}>İPTAL</button>
      </div>
    </form>
  );
};
