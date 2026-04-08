import React, { useState, useEffect } from 'react';
import { rolesAPI } from '../../services/api';
import { FiEdit2, FiToggleLeft, FiToggleRight } from 'react-icons/fi';

export function RolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [allPermissions, setAllPermissions] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({ name: '', permissionIds: [] as number[] });

  const fetchData = async () => {
    try {
      const [rRes, pRes] = await Promise.all([
        rolesAPI.getAll({ limit: 100 }),
        rolesAPI.getPermissions({ limit: 500 })
      ]);
      setRoles(rRes.data.data);
      setAllPermissions(pRes.data.data);
    } catch (error) { console.error(error); }
  };

  useEffect(() => { fetchData(); },[]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        permissionIds: formData.permissionIds.map(Number)
      };
      if (editingId) await rolesAPI.update(editingId, payload);
      else await rolesAPI.create(payload);
      setIsModalOpen(false);
      fetchData();
    } catch (error) { console.error(error); }
  };

  const handleEdit = (role: any) => {
    setEditingId(role.id);
    setFormData({
      name: role.name || '',
      permissionIds: role.permissions?.map((p: any) => p.id) ||[]
    });
    setIsModalOpen(true);
  };

  const toggleState = async (id: number, currentState: number) => {
    await rolesAPI.toggleState(id, currentState);
    fetchData();
  };

  const togglePermission = (permId: number) => {
    setFormData(prev => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(permId)
        ? prev.permissionIds.filter(id => id !== permId)
        : [...prev.permissionIds, permId]
    }));
  };

  // Yetkileri modüle göre gruplama
  const moduleTranslations: Record<string, string> = {
    'inventory': 'Stok ve Envanter',
    'users': 'Kullanıcılar',
    'roles': 'Roller ve Yetkiler',
    'departments': 'Departmanlar',
    'parties': 'Cariler (Müşteri/Tedarikçi)',
    'sales': 'Satışlar',
    'finance': 'Finans',
    'production': 'Üretim',
    'system': 'Sistem Ayarları',
    'satışlar': 'Satışlar',
    'satislar': 'Satışlar'
  };

  const groupedPermissions = allPermissions.reduce((acc: any, perm: any) => {
    const rawMod = (perm.module || 'Genel').toLowerCase();
    const mod = moduleTranslations[rawMod] || perm.module || 'Genel';
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(perm);
    return acc;
  }, {});

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: 'var(--primary)' }}>Erişim & Rol Yönetimi</h2>
        <button className="btn btn-primary" onClick={() => {
          setEditingId(null); setFormData({ name: '', permissionIds:[] }); setIsModalOpen(true);
        }}>+ YENİ ROL OLUŞTUR</button>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>ROL ADI</th>
              <th>YETKİ SAYISI</th>
              <th>DURUM</th>
              <th>İŞLEMLER</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r.id}>
                <td><strong>{r.name}</strong></td>
                <td><span className="badge badge-accent">{r.permissions?.length || 0} Aktif Yetki</span></td>
                <td><span className={`badge ${r.state === 1 ? 'badge-success' : 'badge-danger'}`}>{r.state === 1 ? 'Aktif' : 'Pasif'}</span></td>
                <td style={{ display: 'flex', gap: '5px' }}>
                  <button className="btn-icon" title="Düzenle" onClick={() => handleEdit(r)}>
                    <FiEdit2 size={16} />
                  </button>
                  <button className="btn-icon" title={r.state === 1 ? 'Pasif Yap' : 'Aktif Et'} style={{ color: r.state === 1 ? 'var(--error)' : 'var(--success)' }} onClick={() => toggleState(r.id, r.state)}>
                    {r.state === 1 ? <FiToggleRight size={16} /> : <FiToggleLeft size={16} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="loader-overlay" style={{ alignItems: 'flex-start', paddingTop: '3%', overflowY: 'auto' }}>
          <div className="login-box" style={{ maxWidth: '800px', width: '100%', marginBottom: '5%' }}>
            <h3 style={{ marginBottom: '20px', color: 'var(--primary)' }}>{editingId ? 'Rolü Düzenle' : 'Yeni Rol'}</h3>
            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label>Rol Adı</label>
                <input required className="uppercase-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toLocaleUpperCase('tr-TR')})} placeholder="ÖR: MUHASEBE UZMANI" />
              </div>

              <div className="form-group" style={{ marginTop: '20px' }}>
                <label style={{ marginBottom: '10px', display: 'block', color: 'var(--primary)', fontSize: '1rem' }}>Yetki Matrisi (Capability Matrix)</label>
                <div style={{ background: 'var(--surface-container-low)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border)', maxHeight: '400px', overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  {Object.keys(groupedPermissions).map(moduleName => (
                    <div key={moduleName} style={{ background: 'white', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '5px', marginBottom: '10px', textTransform: 'uppercase' }}>{moduleName}</h4>
                      {groupedPermissions[moduleName].map((perm: any) => (
                        <label key={perm.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginBottom: '8px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={formData.permissionIds.includes(perm.id)} onChange={() => togglePermission(perm.id)} style={{ transform: 'scale(1.2)', accentColor: 'var(--primary)' }} />
                          {perm.name}
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '50px' }}>KAYDET</button>
                <button type="button" className="btn" style={{ flex: 0.5, background: '#e2e8f0', height: '50px' }} onClick={() => setIsModalOpen(false)}>İPTAL</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}