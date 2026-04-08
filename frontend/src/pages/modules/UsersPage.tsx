import React, { useState, useEffect } from 'react';
import { usersAPI, departmentsAPI, rolesAPI } from '../../services/api';
import { FiX, FiShield, FiEdit2, FiArchive, FiRefreshCw, FiUserX, FiUserCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { confirmDialog } from '../../utils/confirmDialog';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  
  // YENİ ALAN: ROLLERİ YÖNETMEK İÇİN (Role Assignment)
  const[availableRoles, setAvailableRoles] = useState<any[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<any[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // YENİ ALAN: KİŞİYE ÖZEL YETKİLER (Override) İÇİN
  const[isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const[selectedUserForPerms, setSelectedUserForPerms] = useState<any | null>(null);
  const [userSpecificPerms, setUserSpecificPerms] = useState<any[]>([]); // Veritabanındaki mevcut geçersiz kılmalar

  const [searchTerm, setSearchTerm] = useState('');
  const[filterTab, setFilterTab] = useState<'active' | 'passive'>('active');

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    password: '',
    email: '',
    phone: '',
    departmentId: '',
    selectedRoles: [] as number[] // Yeni eklendi: Rol ID array'i
  });

  const fetchData = async () => {
    try {
      const[uRes, dRes, rRes, pRes] = await Promise.all([
        usersAPI.getAll({ limit: 500 }),
        departmentsAPI.getAll({ limit: 100 }),
        rolesAPI.getAll({ limit: 100, state: 1 }), // Aktif rolleri çek
        rolesAPI.getPermissions({ limit: 500 }) // Tüm modül yetkilerini çek (Özel Override için)
      ]);
      setUsers(uRes.data.data);
      setDepartments(dRes.data.data.filter((d: any) => d.state === 1)); 
      setAvailableRoles(rRes.data.data);
      setAvailablePermissions(pRes.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  },[]);

  const filteredUsers = users.filter(u => {
    const s = searchTerm.toLowerCase();
    const match = u.fullName?.toLowerCase().includes(s) || u.username?.toLowerCase().includes(s);
    if (!match) return false;
    return filterTab === 'active' ? u.state === 1 : u.state === 0;
  });

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
      delete payload.selectedRoles;
      let newUserId: number | null = null;

      if (editingId) {
        if (!payload.password) delete payload.password;
        await usersAPI.update(editingId, payload);
        newUserId = editingId;
      } else {
        const res = await usersAPI.create(payload);
        newUserId = res.data.id;
      }

      // === Rol Eşleştirmelerini Güncelle (Eğer Seçildiyse) ===
      if (newUserId) {
         // Mevcut Rolleri Kontrol Et, fazlayı sil, azı ekle mantığını backend'in assign endpointleri ile yönetebiliriz.
         // Not: Gerçek senaryoda backend de updateUserRole gibi bir API kullanılır. Biz teker teker asiggn / remove call yapabiliriz.
         const currentUserRoles = editingId 
           ? users.find(u => u.id === editingId)?.roles?.map((r:any) => r.id) || []
           :[];
         
         const rolesToAdd = formData.selectedRoles.map(Number).filter(rId => !currentUserRoles.includes(rId));
         const rolesToRemove = currentUserRoles.filter((rId: number) => !formData.selectedRoles.map(Number).includes(rId));

         for (const rId of rolesToAdd) {
            await rolesAPI.assignRole({ userId: newUserId, roleId: rId }).catch(()=>{});
         }
         for (const rId of rolesToRemove) {
            await rolesAPI.removeRole({ userId: newUserId, roleId: rId }).catch(()=>{});
         }
      }

      setIsModalOpen(false);
      fetchData();
      toast.success("Kullanıcı bilgileri kaydedildi.");
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (u: any) => {
    setEditingId(u.id);
    setFormData({
      fullName: u.fullName || '',
      username: u.username || '',
      password: '',
      email: u.email || '',
      phone: u.phone || '',
      departmentId: u.departmentId || '',
      selectedRoles: u.roles?.map((r:any) => r.id) ||[]
    });
    setIsModalOpen(true);
  };

  const toggleState = async (id: number, currentState: number) => {
    const confirmed = await confirmDialog(currentState === 1 ? 'Kullanıcının sisteme erişimini durdurmak ve arşivlemek istiyor musunuz?' : 'Kullanıcıyı tekrar aktif etmek istiyor musunuz?', currentState === 1);
    if (confirmed) {
      await usersAPI.toggleState(id, currentState);
      fetchData();
    }
  };

  // Rol checkobx state yönetimi
  const handleRoleToggle = (roleId: number) => {
    setFormData(prev => ({
      ...prev,
      selectedRoles: prev.selectedRoles.includes(roleId)
        ? prev.selectedRoles.filter(id => id !== roleId)
        : [...prev.selectedRoles, roleId]
    }));
  };

  // === KİŞİYE ÖZEL YETKİ AÇILIŞ (OVERRIDE MODAL) ===
  const openPermissionsModal = async (u: any) => {
     setSelectedUserForPerms(u);
     try {
       // Bu kişi için veritabanında daha önceden basılmış 'allow' / 'deny' kuralı var mı alıyoruz.
       const res = await rolesAPI.getUserPermissions(u.id);
       setUserSpecificPerms(res.data);
       setIsPermissionsModalOpen(true);
     } catch (err) {
       console.error("Yetkiler çekilemedi");
     }
  };

  const handleSetSpecificPermission = async (permissionId: number, effect: 'allow' | 'deny', scopeType: 'global' | 'department') => {
    try {
      await rolesAPI.setUserPermission({
        userId: selectedUserForPerms.id,
        permissionId: permissionId,
        effect: effect,
        scopeType: scopeType,
        scopeId: scopeType === 'department' ? selectedUserForPerms.departmentId : null // Departmansa kişiye departman sınırıyla allow edilebilir
      });
      // Veriyi anında ekranda güncelle (optomistic)
      const res = await rolesAPI.getUserPermissions(selectedUserForPerms.id);
      setUserSpecificPerms(res.data);
      toast.success("Yetki kuralı uygulandı.");
    } catch (error) {
       toast.error("Bir hata oluştu.");
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
          <input type="text" placeholder="Ad, Soyad, Kullanıcı Adı Ara..." className="search-bar" style={{ width: '350px' }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          <button className="btn btn-primary" onClick={() => {
            setEditingId(null);
            setFormData({ fullName: '', username: '', password: '', email: '', phone: '', departmentId: '', selectedRoles:[] });
            setIsModalOpen(true);
          }}>+ YENİ KULLANICI</button>
        </div>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>AD SOYAD / SİSTEM ADI</th>
              <th>DEPARTMAN</th>
              <th>ROLLERİ</th>
              <th>E-POSTA / TELEFON</th>
              <th>İŞLEMLER</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id} style={{ opacity: u.state === 0 ? 0.6 : 1, background: u.state === 0 ? '#f1f5f9' : 'inherit' }}>
                <td>
                  <strong>{u.fullName}</strong><br/>
                  <span className="badge" style={{ marginTop: '5px' }}>@{u.username}</span>
                </td>
                <td>{u.department?.name || <span style={{ color: 'gray' }}>Atanmadı</span>}</td>
                <td>
                   {u.roles?.length > 0 ? u.roles.map((r:any) => <span key={r.id} className="badge badge-outline" style={{marginRight: '3px'}}>{r.name}</span>) : '-'}
                </td>
                <td style={{ textTransform: 'lowercase' }}>{u.email}<br/><span style={{ color: 'gray', textTransform:'none'}}>{u.phone || '-'}</span></td>
                <td style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                  {/* ÖZEL YETKİ BUTONU */}
                  <button className="btn-icon" title="Özel Yetki (Override)" style={{ color: 'var(--primary)' }} onClick={() => openPermissionsModal(u)}>
                     <FiShield size={16} />
                  </button>

                  <button className="btn-icon" title="Düzenle" onClick={() => handleEdit(u)}>
                    <FiEdit2 size={16} />
                  </button>
                  <button className="btn-icon" title={u.state === 1 ? 'Erişimi Kes' : 'Aktif Et'} style={{ color: u.state === 1 ? 'var(--error)' : 'var(--success)' }} onClick={() => toggleState(u.id, u.state)}>
                    {u.state === 1 ? <FiUserX size={16} /> : <FiUserCheck size={16} />}
                  </button>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center' }}>Kayıt bulunamadı.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* YENİ KULLANICI / DÜZENLE MODALI */}
      {isModalOpen && (
        <div className="loader-overlay" style={{ alignItems: 'flex-start', paddingTop: '3%', overflowY: 'auto' }}>
          <div className="login-box" style={{ maxWidth: '800px', width: '100%', marginBottom: '5%' }}>
            <h3 style={{ marginBottom: '20px', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>{editingId ? 'Personel Güncelle' : 'Sisteme Personel Ekle'}</h3>
            <form onSubmit={handleSubmit} className="login-form">

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
                 {/* SOL TARAF: KİŞİ BİLGİLERİ */}
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div className="form-group">
                      <label>Personel Ad Soyad</label>
                      <input required className="uppercase-input" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value.replace(/[0-9]/g, '').toLocaleUpperCase('tr-TR') })} placeholder="ÖR: AHMET YILMAZ" />
                    </div>
                    <div style={{ display: 'flex', gap: '15px' }}>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label>Sistem Kullanıcı Adı</label>
                        <input required className="uppercase-input" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\\s/g,'') })} placeholder="ahmety" disabled={!!editingId} style={{ textTransform: 'lowercase' }} />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label>Sistem Şifresi {editingId && <span style={{ fontSize: '9px', color: 'red' }}>(Boş=Aynı)</span>}</label>
                        <input type="password" required={!editingId} className="uppercase-input" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="****" style={{ textTransform: 'none' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '15px' }}>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label>Departman</label>
                        <select className="uppercase-input" style={{ appearance: 'none' }} value={formData.departmentId} onChange={e => setFormData({ ...formData, departmentId: e.target.value })}>
                          <option value="">-- MERKEZ / TANIMSIZ --</option>
                          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label>Telefon</label>
                        <input className="uppercase-input tabular-nums" value={formData.phone} onChange={e => setFormData({ ...formData, phone: formatPhone(e.target.value) })} placeholder="0 (5XX) XXX XX XX" />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Kurumsal E-Posta</label>
                      <input type="email" list="email-domains" required className="uppercase-input" style={{ textTransform: 'lowercase' }} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value.toLowerCase() })} placeholder="personel@sirket.com" />
                      <datalist id="email-domains">
                        {formData.email.includes('@') && ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com', 'icloud.com'].map(domain => (
                          <option key={domain} value={`${formData.email.split('@')[0]}@${domain}`} />
                        ))}
                      </datalist>
                    </div>
                 </div>

                 {/* SAĞ TARAF: ROL ATAMA MANTIK (YENİ EKLENDİ) */}
                 <div style={{ background: 'var(--surface-container-low)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                   <label style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 800, marginBottom: '10px', display: 'block' }}>Rolsüz Kullanıcı Eklenemez.</label>
                   <p style={{ fontSize: '11px', color: 'gray', marginBottom: '15px' }}>Hangi kullanıcı yetki şablonları atanacak?</p>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto' }}>
                     {availableRoles.map(r => (
                       <label key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer', background: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                         <input type="checkbox" checked={formData.selectedRoles.includes(r.id)} onChange={() => handleRoleToggle(r.id)} style={{ transform: 'scale(1.2)' }} />
                         <strong>{r.name}</strong>
                       </label>
                     ))}
                     {availableRoles.length === 0 && <span style={{fontSize:'12px', color:'red'}}>Lütfen sistem ayarlarından aktif bir rol oluşturun.</span>}
                   </div>
                 </div>
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
                <button type="submit" className="btn btn-primary" disabled={formData.selectedRoles.length === 0} style={{ flex: 1, height: '50px' }}>{editingId ? 'BİLGİLERİ GÜNCELLE' : 'KULLANICI OLUŞTUR VE YETKİLERİ ATA'}</button>
                <button type="button" className="btn" style={{ flex: 0.5, background: '#e2e8f0', height: '50px' }} onClick={() => setIsModalOpen(false)}>İPTAL</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* YENİ EKLENEN MODAL: KİŞİYE ÖZEL YETKİLERİ EZ (OVERRIDE) */}
      {isPermissionsModalOpen && selectedUserForPerms && (
         <div className="loader-overlay" style={{ alignItems: 'flex-start', paddingTop: '5%', paddingBottom: '5%', overflowY: 'auto' }}>
          <div className="login-box" style={{ maxWidth: '850px', width: '100%', position: 'relative' }}>
             <button className="btn-icon circle" style={{ position: 'absolute', top: '15px', right: '15px' }} onClick={() => setIsPermissionsModalOpen(false)}><FiX size={20}/></button>
             
             <div style={{ marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
               <h3 style={{ color: 'var(--primary)' }}><FiShield /> İstisna / İleri Seviye Yetkilendirme</h3>
               <p style={{ fontSize: '12px', color: 'gray', marginTop: '5px' }}>
                  <strong>{selectedUserForPerms.fullName}</strong> kullanıcısı atanmış rollerindeki kuralların haricinde; bir işlem için istisnai izin veya bloklanmaya ihtiyaç duyuyorsa aşağıdan Override edebilirsiniz.
               </p>
             </div>

             <div style={{ maxHeight: '60vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                  <thead style={{ background: 'var(--surface-container-highest)', textAlign: 'left' }}>
                    <tr>
                      <th style={{ padding: '10px' }}>MODÜL VE YETKİ (KEY)</th>
                      <th>BİLGİ</th>
                      <th>ROL KURALLARI</th>
                      <th>İSTİSNA (OVERRIDE)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availablePermissions.map(perm => {
                       // Kullanıcının "sahip olduğu rollerden dolayı" bu yetkisi var mı bulalım
                       const userHasRoleForPerm = false; // Basitleştirdik - Bunu bulmak isterseniz DB üzerinden gelir
                       const permOverride = userSpecificPerms.find((u:any) => u.permissionId === perm.id);

                       return (
                         <tr key={perm.id} style={{ borderBottom: '1px solid var(--border)', background: permOverride ? (permOverride.effect === 'deny' ? '#fef2f2' : '#ecfdf5') : 'white' }}>
                           <td style={{ padding: '10px' }}>
                             <div style={{ fontWeight: 800 }}>{perm.name}</div>
                             <div style={{ fontSize: '10px', color: 'gray' }}>[{perm.module}] {perm.key}</div>
                           </td>
                           <td style={{ color: 'gray', fontStyle: 'italic', fontSize:'11px' }}>Önceliği Deny Alır.</td>
                           <td>
                             <span className="badge" style={{ background: 'var(--surface-container)'}}>ROL'E BAĞLI</span>
                           </td>
                           <td style={{ display: 'flex', gap: '5px', padding: '10px 0' }}>
                             {/* Allow (Yeşil) */}
                             <button 
                               className="btn" 
                               style={{ padding: '4px 10px', height: '24px', fontSize: '10px', background: permOverride?.effect === 'allow' && permOverride?.scopeType === 'global' ? 'var(--success)' : '#e2e8f0', color: permOverride?.effect === 'allow' && permOverride?.scopeType === 'global' ? 'white' : 'black' }}
                               onClick={() => handleSetSpecificPermission(perm.id, 'allow', 'global')}
                             >
                               ✔️ İZİN VER (Global)
                             </button>

                             {/* Allow Department */}
                             {selectedUserForPerms.departmentId && (
                               <button 
                                 className="btn" 
                                 style={{ padding: '4px 10px', height: '24px', fontSize: '10px', background: permOverride?.effect === 'allow' && permOverride?.scopeType === 'department' ? 'var(--primary)' : '#e2e8f0', color: permOverride?.effect === 'allow' && permOverride?.scopeType === 'department' ? 'white' : 'black' }}
                                 onClick={() => handleSetSpecificPermission(perm.id, 'allow', 'department')}
                               >
                                 🏬 DEPARTMAN (Sınırla)
                               </button>
                             )}

                             {/* Deny (Kırmızı Blokaj) */}
                             <button 
                               className="btn" 
                               style={{ padding: '4px 10px', height: '24px', fontSize: '10px', background: permOverride?.effect === 'deny' ? 'var(--danger)' : '#ffe4e6', color: permOverride?.effect === 'deny' ? 'white' : 'red' }}
                               onClick={() => handleSetSpecificPermission(perm.id, 'deny', 'global')}
                             >
                               🚫 ENGELLİ KIL
                             </button>
                           </td>
                         </tr>
                       );
                    })}
                  </tbody>
                </table>
             </div>
          </div>
         </div>
      )}
    </div>
  );
}