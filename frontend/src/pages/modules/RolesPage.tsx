import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesAPI } from '../../services/api';
import { 
  FiEdit2, FiShield, FiPlus, FiCheckCircle, FiLock, 
  FiActivity, FiCommand, FiGrid, FiX
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { DataTable, Column } from '../../components/common/DataTable';
import { Role } from '../../types';
import { useSort } from '../../hooks/useSort';

export function RolesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', permissionIds: [] as number[] });

  // ────── QUERIES ──────

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await rolesAPI.getAll({ limit: 100 });
      return res.data.data;
    }
  });
  
  const { sortedData, sortConfigs, toggleSort } = useSort(roles);

  const { data: allPermissions = [] } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const res = await rolesAPI.getPermissions({ limit: 500 });
      return res.data.data;
    }
  });

  const mutation = useMutation({
    mutationFn: async ({ id, data }: { id: number | null; data: any }) => {
      const payload = { ...data, permissionIds: data.permissionIds.map(Number) };
      if (id) return rolesAPI.update(id, payload);
      return rolesAPI.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setIsModalOpen(false);
      toast.success("Rol başarıyla kaydedildi.");
    },
    onError: () => toast.error("Hata oluştu")
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ id: editingId, data: formData });
  };

  const handleEdit = (role: any) => {
    setEditingId(role.id);
    setFormData({
      name: role.name || '',
      permissionIds: role.permissions?.map((p: any) => p.id) ||[]
    });
    setIsModalOpen(true);
  };

  const toggleMutation = useMutation({
    mutationFn: ({ id, state }: { id: number; state: number }) => rolesAPI.toggleState(id, state),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success("Durum güncellendi.");
    },
    onError: () => toast.error("Hata oluştu")
  });

  const toggleState = (id: number, currentState: number) => {
    toggleMutation.mutate({ id, state: currentState });
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
    'sales': 'Satış Yönetimi',
    'finance': 'Finansal Hareketler',
    'production': 'Üretim Planlama',
    'system': 'Sistem Konfigürasyonu',
    'satışlar': 'Satış Yönetimi',
    'satislar': 'Satış Yönetimi'
  };

  const groupedPermissions = allPermissions.reduce((acc: any, perm: any) => {
    const rawMod = (perm.module || 'Genel').toLowerCase();
    const mod = moduleTranslations[rawMod] || perm.module || 'Genel';
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(perm);
    return acc;
  }, {});

  const columns: Column<Role>[] = [
    { 
      header: 'YETKİ PROFİLİ', 
      accessor: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '40px', height: '40px', borderRadius: '12px', 
            background: 'var(--primary-glow)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--primary)',
            fontSize: '18px'
          }}>
            <FiShield />
          </div>
          <div>
            <div style={{ fontWeight: 800, color: 'var(--on-surface)', fontSize: '14px' }}>{r.name}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', gap: '6px' }}>
              İD: #{r.id} {r.state === 0 && <span style={{ color: 'var(--error)', fontWeight: 900 }}>• PASİF</span>}
            </div>
          </div>
        </div>
      ),
      sortKey: 'name'
    },
    { 
      header: 'İZİN MATRİSİ', 
      accessor: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ 
            padding: '4px 12px', borderRadius: '8px', 
            background: 'var(--surface-container)', color: 'var(--secondary)',
            fontSize: '12px', fontWeight: 900
          }}>
            {r.permissions?.length || 0}
          </div>
          <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>AKTİF YETKİ</span>
        </div>
      ),
      sortKey: 'permissions.length'
    },
    { 
      header: 'ERİŞİM DURUMU', 
      accessor: (r) => (
        <span style={{ 
          fontSize: '10px', fontWeight: 900, 
          padding: '4px 10px', borderRadius: '8px',
          background: r.state === 1 ? 'var(--success-glow)' : 'var(--error-glow)',
          color: r.state === 1 ? 'var(--success)' : 'var(--error)',
          textTransform: 'uppercase'
        }}>
          {r.state === 1 ? 'TAM ERİŞİM' : 'KISITLI / PASİF'}
        </span>
      ),
      sortKey: 'state'
    }
  ];

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* 🔴 HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ 
            display: 'inline-flex', alignItems: 'center', gap: '8px', 
            background: 'var(--error-glow)', color: 'var(--error)', 
            padding: '6px 14px', borderRadius: '12px', fontSize: '12px', 
            fontWeight: 800, marginBottom: '16px'
          }}>
            <FiLock /> GÜVENLİK VE ERİŞİM
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--on-surface)' }}>
            Kullanıcı <span style={{ color: 'var(--primary)' }}>Rol & Yetkileri</span>
          </h1>
        </div>
        
        <button className="btn btn-primary" style={{ height: '44px', boxShadow: '0 10px 20px var(--primary-glow)' }} onClick={() => {
          setEditingId(null); setFormData({ name: '', permissionIds:[] }); setIsModalOpen(true);
        }}>
          <FiPlus size={18} /> Yeni Rol Tanımla
        </button>
      </div>

      {/* 🟡 DATA TABLE SECTION */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <DataTable<Role>
          data={sortedData}
          columns={columns}
          sortConfigs={sortConfigs}
          onSort={toggleSort}
          getRowKey={(r) => r.id}
          hasState={(r) => r.state === 1}
          onEdit={handleEdit}
          onArchive={(r) => toggleState(r.id, 0)}
          onRestore={(r) => toggleState(r.id, 1)}
          getRowOpacity={(r) => r.state === 0 ? 0.5 : 1}
        />
      </div>

      {/* 🟢 MODAL SECTION */}
      {isModalOpen && (
        <div className="loader-overlay" style={{ alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', background: 'rgba(15, 23, 42, 0.4)' }}>
          <div className="glass-panel" style={{ maxWidth: '900px', width: '95%', maxHeight: '90vh', overflowY: 'auto', padding: '40px', borderRadius: '32px', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--on-surface)' }}>
                {editingId ? 'Rol Revizyonu' : 'Yeni Güvenlik Profili'}
              </h2>
              <button className="btn-icon circle" onClick={() => setIsModalOpen(false)}><FiX size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>ROL İSMİ (GÖREV TANIMI)</label>
                <input required className="uppercase-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toLocaleUpperCase('tr-TR')})} placeholder="ÖR: MUHASEBE VE FİNANS MÜDÜRÜ" style={{ height: '52px' }} />
              </div>

              <div>
                <label style={{ fontSize: '14px', fontWeight: 900, color: 'var(--primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiGrid /> YETKİ MATRİSİ (CAPABILITY MATRIX)
                </label>
                <div style={{ 
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px',
                  background: 'var(--surface-container-low)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border)'
                }}>
                  {Object.keys(groupedPermissions).map(moduleName => (
                    <div key={moduleName} style={{ 
                      background: 'white', padding: '16px', borderRadius: '16px', 
                      boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)',
                      display: 'flex', flexDirection: 'column', gap: '12px'
                    }}>
                      <div style={{ 
                        fontSize: '11px', fontWeight: 900, color: 'var(--primary)', 
                        paddingBottom: '8px', borderBottom: '1px solid var(--surface-container)',
                        textTransform: 'uppercase', letterSpacing: '0.05em'
                      }}>
                        {moduleName}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {groupedPermissions[moduleName].map((perm: any) => (
                          <label key={perm.id} style={{ 
                            display: 'flex', alignItems: 'center', gap: '10px', 
                            fontSize: '13px', fontWeight: 700, color: 'var(--on-surface-variant)',
                            cursor: 'pointer', padding: '6px', borderRadius: '8px',
                            transition: '0.2s', background: formData.permissionIds.includes(perm.id) ? 'var(--primary-glow)' : 'transparent'
                          }}>
                            <input 
                              type="checkbox" 
                              checked={formData.permissionIds.includes(perm.id)} 
                              onChange={() => togglePermission(perm.id)} 
                              style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }} 
                            />
                            {perm.name}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '56px', fontSize: '15px' }}>
                  <FiCheckCircle size={18} style={{ marginRight: '8px' }} /> YARATILAN PROFİLİ KAYDET
                </button>
                <button type="button" className="btn btn-secondary" style={{ flex: 0.4, height: '56px', background: 'white' }} onClick={() => setIsModalOpen(false)}>PTAL ET</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}