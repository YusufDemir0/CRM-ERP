import React, { useState, useEffect } from 'react';
import { usersAPI, departmentsAPI } from '../../services/api';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<'active' | 'passive'>('active');

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    password: '',
    email: '',
    phone: '',
    departmentId: ''
  });

  const fetchData = async () => {
    try {
      const [uRes, dRes] = await Promise.all([
        usersAPI.getAll({ limit: 100 }),
        departmentsAPI.getAll({ limit: 100 })
      ]);
      setUsers(uRes.data.data);
      setDepartments(dRes.data.data.filter((d: any) => d.state === 1)); // Sadece aktif departmanlar atanabilir
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredUsers = users.filter(u => {
    const s = searchTerm.toLowerCase();
    const match = u.fullName?.toLowerCase().includes(s) || u.username?.toLowerCase().includes(s);
    if (!match) return false;
    return filterTab === 'active' ? u.state === 1 : u.state === 0;
  });

  // Basit TR telefon maskesi (Sadece rakam alıp formata sokar)
  const formatPhone = (val: string) => {
    const d = val.replace(/\D/g, '');
    let res = '';
    if (d.length > 0) res += '0';
    if (d.length > 1) res += ' (' + d.substring(1, 4);
    if (d.length > 4) res += ') ' + d.substring(4, 7);
    if (d.length > 7) res += ' ' + d.substring(7, 9);
    if (d.length > 9) res += ' ' + d.substring(9, 11);
    return res;
  };

  const removeNumbers = (val: string) => val.replace(/[0-9]/g, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = { ...formData, departmentId: Number(formData.departmentId) || undefined };
      if (editingId) {
        // Şifre boşsa gönderme (backend sadece doluysa günceller kuralı genelde vardır)
        if (!payload.password) delete payload.password;
        await usersAPI.update(editingId, payload);
      } else {
        await usersAPI.create(payload);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (u: any) => {
    setEditingId(u.id);
    setFormData({
      fullName: u.fullName || '',
      username: u.username || '',
      password: '', // Şifreyi güvenlik gereği boş getiriyoruz
      email: u.email || '',
      phone: u.phone || '',
      departmentId: u.departmentId || ''
    });
    setIsModalOpen(true);
  };

  const toggleState = async (id: number, currentState: number) => {
    if (window.confirm(currentState === 1 ? 'Kullanıcının sisteme erişimini durdurmak ve arşivlemek istiyor musunuz?' : 'Kullanıcıyı tekrar aktif etmek istiyor musunuz?')) {
      await usersAPI.toggleState(id, currentState);
      fetchData();
    }
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ color: 'var(--primary)', marginBottom: '10px' }}>Personel / Kullanıcı Yönetimi</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className={`btn ${filterTab === 'active' ? 'btn-primary' : ''}`} onClick={() => setFilterTab('active')}>Aktif Personel</button>
            <button className={`btn ${filterTab === 'passive' ? 'btn-primary' : ''}`} onClick={() => setFilterTab('passive')}>Erişimi Kapatılanlar</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <input type="text" placeholder="Ad, Soyad, Kullanıcı Adı Ara..." className="search-bar" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          <button className="btn btn-primary" onClick={() => {
            setEditingId(null);
            setFormData({ fullName: '', username: '', password: '', email: '', phone: '', departmentId: '' });
            setIsModalOpen(true);
          }}>+ YENİ KULLANICI</button>
        </div>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>AD SOYAD</th>
              <th>KULLANICI ADI</th>
              <th>DEPARTMAN</th>
              <th>E-POSTA</th>
              <th>TELEFON</th>
              <th>İŞLEMLER</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id} style={{ opacity: u.state === 0 ? 0.6 : 1, background: u.state === 0 ? '#f1f5f9' : 'inherit' }}>
                <td><strong>{u.fullName}</strong></td>
                <td><span className="badge">{u.username}</span></td>
                <td>{u.department?.name || <span style={{ color: 'gray' }}>Atanmadı</span>}</td>
                <td style={{ textTransform: 'lowercase' }}>{u.email}</td>
                <td className="tabular-nums">{u.phone || '-'}</td>
                <td>
                  <button className="btn" style={{ padding: '0 10px', height: '30px', marginRight: '5px' }} onClick={() => handleEdit(u)}>✎ Düzenle</button>
                  {/* Sistem yöneticisinin kendini kapatmasını önlemek için id=1 vs check yapılabilir, varsayalım backend koruyor */}
                  <button className="btn" style={{ padding: '0 10px', height: '30px', color: u.state === 1 ? 'var(--error)' : 'var(--success)' }} onClick={() => toggleState(u.id, u.state)}>
                    {u.state === 1 ? 'Erişimi Kes' : 'Aktif Et'}
                  </button>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center' }}>Kayıt bulunamadı.</td></tr>}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="loader-overlay" style={{ alignItems: 'flex-start', paddingTop: '5%' }}>
          <div className="login-box" style={{ maxWidth: '600px', width: '100%' }}>
            <h3 style={{ marginBottom: '20px', color: 'var(--primary)' }}>{editingId ? 'Personel Güncelle' : 'Sisteme Personel Ekle'}</h3>
            <form onSubmit={handleSubmit} className="login-form">

              <div className="form-group">
                <label>Personel Ad Soyad</label>
                <input required className="uppercase-input" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: removeNumbers(e.target.value).toUpperCase() })} placeholder="ÖR: AHMET YILMAZ" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Sisteme Giriş (Kullanıcı) Adı</label>
                  {/* Kullanıcı adı büyük küçük olabilir ama büyükte standart tutalım */}
                  <input required className="uppercase-input" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value.toUpperCase() })} placeholder="AHMETY" disabled={!!editingId} />
                </div>
                <div className="form-group">
                  <label>Sistem Şifresi {editingId && <span style={{ fontSize: '10px', color: 'red' }}>(Boş bırakılırsa değişmez)</span>}</label>
                  <input type="password" required={!editingId} className="uppercase-input" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value.toUpperCase() })} placeholder="****" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Bağlı Olduğu Departman</label>
                  <select className="uppercase-input" style={{ appearance: 'none' }} value={formData.departmentId} onChange={e => setFormData({ ...formData, departmentId: e.target.value })}>
                    <option value="">-- MERKEZ / TANIMSIZ --</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Telefon Numarası</label>
                  <input className="uppercase-input tabular-nums" value={formData.phone} onChange={e => setFormData({ ...formData, phone: formatPhone(e.target.value) })} placeholder="0 (5XX) XXX XX XX" />
                </div>
              </div>

              <div className="form-group">
                <label>Kurumsal E-Posta</label>
                <input type="email" required className="uppercase-input" style={{ textTransform: 'lowercase' }} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value.toLowerCase() })} placeholder="personel@sirket.com" />
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '50px' }}>{editingId ? 'GÜNCELLE' : 'KAYDET VE YETKİ VER'}</button>
                <button type="button" className="btn" style={{ flex: 1, background: '#e2e8f0', height: '50px' }} onClick={() => setIsModalOpen(false)}>İPTAL</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}