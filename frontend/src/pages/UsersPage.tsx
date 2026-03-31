import { useState, useEffect, useCallback } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { usersAPI, departmentsAPI, rolesAPI } from '../services/api';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);

  const [form, setForm] = useState({ username: '', password: '', fullName: '', email: '', phone: '', departmentId: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await usersAPI.getAll({ page, search, limit: 20 });
      const responseData = res.data;
      setData(responseData?.data || []);
      setTotal(responseData?.meta?.total || 0);
    } catch (e: any) {
      console.error('Users fetch error:', e);
      // Don't crash on error — just show empty state
      setData([]);
      setTotal(0);
      if (e.response?.status !== 401) {
        toast.error(e.response?.data?.message || 'Kullanıcılar yüklenemedi');
      }
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    departmentsAPI.getAll({ limit: 100 })
      .then(r => setDepartments(r.data?.data || r.data || []))
      .catch(() => setDepartments([]));
  }, []);

  const openCreate = () => {
    setEditingUser(null);
    setForm({ username: '', password: '', fullName: '', email: '', phone: '', departmentId: '' });
    setModalOpen(true);
  };

  const openEdit = (user: any) => {
    setEditingUser(user);
    setForm({
      username: user.username || '',
      password: '',
      fullName: user.fullName || '',
      email: user.email || '',
      phone: user.phone || '',
      departmentId: user.departmentId?.toString() || '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingUser) {
        await usersAPI.update(editingUser.id, {
          fullName: form.fullName,
          email: form.email,
          phone: form.phone || undefined,
          departmentId: form.departmentId ? Number(form.departmentId) : undefined,
        });
        toast.success('Kullanıcı güncellendi');
      } else {
        if (!form.username || !form.password) {
          toast.error('Kullanıcı adı ve şifre zorunludur');
          return;
        }
        await usersAPI.create({
          username: form.username,
          password: form.password,
          fullName: form.fullName,
          email: form.email,
          phone: form.phone || undefined,
          departmentId: form.departmentId ? Number(form.departmentId) : undefined,
        });
        toast.success('Kullanıcı oluşturuldu');
      }
      setModalOpen(false);
      fetchData();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'İşlem başarısız');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;
    try {
      await usersAPI.delete(id);
      toast.success('Kullanıcı silindi');
      fetchData();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Silme başarısız');
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'username', label: 'Kullanıcı Adı', render: (r: any) => <strong style={{ color: 'var(--text-primary)' }}>{r.username}</strong> },
    { key: 'fullName', label: 'Ad Soyad' },
    { key: 'email', label: 'E-posta' },
    { key: 'department', label: 'Departman', render: (r: any) => r.department?.name || '—' },
    { key: 'state', label: 'Durum', render: (r: any) => (
      <span className={`badge ${r.state === 1 ? 'badge-success' : 'badge-danger'}`}>
        {r.state === 1 ? 'Aktif' : 'Pasif'}
      </span>
    )},
    { key: 'actions', label: 'İşlem', render: (r: any) => (
      <div style={{ display: 'flex', gap: 4 }}>
        <button className="btn-icon" onClick={() => openEdit(r)} title="Düzenle"><FiEdit2 size={14} /></button>
        <button className="btn-icon" onClick={() => handleDelete(r.id)} title="Sil" style={{ color: 'var(--danger)' }}><FiTrash2 size={14} /></button>
      </div>
    )},
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Kullanıcılar</h1>
      </div>

      <DataTable
        columns={columns}
        data={data}
        total={total}
        page={page}
        search={search}
        onSearchChange={setSearch}
        onPageChange={setPage}
        loading={loading}
        actions={
          <button className="btn btn-primary btn-sm" onClick={openCreate}>
            <FiPlus /> Yeni Kullanıcı
          </button>
        }
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>İptal</button>
            <button className="btn btn-primary" onClick={handleSave}>Kaydet</button>
          </>
        }
      >
        <div className="form-group">
          <label>Kullanıcı Adı</label>
          <input className="form-input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} disabled={!!editingUser} placeholder="admin" />
        </div>
        {!editingUser && (
          <div className="form-group">
            <label>Şifre</label>
            <input className="form-input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
          </div>
        )}
        <div className="form-group">
          <label>Ad Soyad</label>
          <input className="form-input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Ad Soyad" />
        </div>
        <div className="form-group">
          <label>E-posta</label>
          <input className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@firma.com" />
        </div>
        <div className="form-group">
          <label>Telefon</label>
          <input className="form-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="05XX XXX XXXX" />
        </div>
        <div className="form-group">
          <label>Departman</label>
          <select className="form-input" value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
            <option value="">Seçiniz</option>
            {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      </Modal>
    </div>
  );
}
