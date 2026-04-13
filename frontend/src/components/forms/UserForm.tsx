import React, { useState, useEffect } from 'react';
import { Department, Role } from '../../types';
import { departmentsAPI, rolesAPI, usersAPI } from '../../services/api';
import { FiCheck, FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useQuickCreate } from '../../context/QuickCreateContext';

interface UserFormProps {
  initialData?: any;
  editingId?: number | null;
  onSuccess: (data: any) => void;
  onCancel: () => void;
}

export const UserForm: React.FC<UserFormProps> = ({
  initialData,
  editingId,
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState(initialData || {
    fullName: '',
    username: '',
    password: '',
    email: '',
    phone: '',
    departmentId: '',
    selectedRoles: [] as number[],
  });
  const [countryCode, setCountryCode] = useState('+90');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const { openCreate } = useQuickCreate();

  useEffect(() => {
    async function fetchData() {
      try {
        const [dRes, rRes] = await Promise.all([
          departmentsAPI.getAll({ limit: 100 }),
          rolesAPI.getAll({ limit: 100, state: 1 }),
        ]);
        setDepartments(dRes.data.data.filter((d: Department) => d.state === 1));
        setAvailableRoles(rRes.data.data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (initialData?.phone?.startsWith('+90 ')) {
      setCountryCode('+90');
      setFormData((prev: any) => ({ ...prev, phone: initialData.phone.substring(4) }));
    }
  }, [initialData]);

  const formatPhone = (val: string) => {
    let d = val.replace(/\D/g, '');
    if (d.startsWith('0')) d = d.substring(1);
    d = d.substring(0, 10);
    let res = '';
    if (d.length > 0) res += d.substring(0, 3);
    if (d.length > 3) res += ' ' + d.substring(3, 6);
    if (d.length > 6) res += ' ' + d.substring(6, 8);
    if (d.length > 8) res += ' ' + d.substring(8, 10);
    return res;
  };

  const handleRoleToggle = (roleId: number) => {
    setFormData((prev: any) => ({
      ...prev,
      selectedRoles: prev.selectedRoles.includes(roleId)
        ? prev.selectedRoles.filter((id: number) => id !== roleId)
        : [...prev.selectedRoles, roleId],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSuccess({
      ...formData,
      fullPhone: `${countryCode} ${formData.phone}`,
    });
  };

  const handleAddDepartment = () => {
    openCreate('department', {
      onSuccess: (newDept: any) => {
        setFormData((prev: any) => ({ ...prev, departmentId: newDept.id }));
        // Refresh departments
        departmentsAPI.getAll({ limit: 100 }).then((res: any) => setDepartments(res.data.data.filter((d: any) => d.state === 1)));
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div className="form-group">
            <label>Personel Ad Soyad</label>
            <input
              required
              className="uppercase-input"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value.replace(/[0-9]/g, '').toLocaleUpperCase('tr-TR') })}
              placeholder="ÖR: AHMET YILMAZ"
            />
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Kullanıcı Adı</label>
              <input
                required
                className="uppercase-input"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                placeholder="ahmety"
                disabled={!!editingId}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Şifre {editingId && <span style={{ fontSize: '9px', color: 'red' }}>(Boş=Aynı)</span>}</label>
              <input
                type="password"
                required={!editingId}
                className="uppercase-input"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="****"
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>Departman *</label>
                <button
                  type="button"
                  className="btn-link"
                  style={{ fontSize: '11px', fontWeight: 600, color: 'var(--primary)', marginBottom: '5px' }}
                  onClick={handleAddDepartment}
                >
                  <FiPlus size={12} /> YENİ
                </button>
              </div>
              <select
                required
                className="uppercase-input"
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
              >
                <option value="">Lütfen Seçiniz</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Telefon *</label>
              <div style={{ display: 'flex', gap: '5px' }}>
                <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} style={{ width: '80px' }}>
                  <option value="+90">+90</option><option value="+1">+1</option>
                </select>
                <input required style={{ flex: 1 }} className="uppercase-input tabular-nums" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })} placeholder="5XX XXX XX XX" />
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--surface-container-low)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <label style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 800, marginBottom: '10px', display: 'block' }}>Rolsüz Kullanıcı Eklenemez.</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto' }}>
            {availableRoles.map((r) => (
              <label key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer', background: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <input type="checkbox" checked={formData.selectedRoles.includes(r.id)} onChange={() => handleRoleToggle(r.id)} />
                <strong>{r.name}</strong>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
        <button type="submit" className="btn btn-primary" disabled={formData.selectedRoles.length === 0} style={{ flex: 1, height: '50px' }}>
          <FiCheck /> {editingId ? 'GÜNCELLE' : 'PERSONELİ KAYDET'}
        </button>
        <button type="button" className="btn" style={{ flex: 0.5, background: '#e2e8f0', height: '50px' }} onClick={onCancel}>İPTAL</button>
      </div>
    </form>
  );
};
