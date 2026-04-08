import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { departmentsAPI, accountsAPI } from '../../services/api';
import { FiX, FiEdit2, FiArchive, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { confirmDialog } from '../../utils/confirmDialog';
import { usePersistentForm } from '../../hooks/usePersistentForm';
import { navHub } from '../../utils/navHub';

/** Sadece harf ve boşluk (Türkçe dahil) — sayı yasak */
const onlyLetters = (val: string) => val.replace(/[0-9]/g, '');
/** Kısaltma: sadece büyük harf, rakam ve boşluk yok, max 4 */
const onlyAbbrLetters = (val: string) => val.replace(/[^A-ZÇĞİÖŞÜa-zçğıöşü]/g, '').toLocaleUpperCase('tr-TR');

export default function DepartmentsPage() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [deptTypes, setDeptTypes] = useState<any[]>([]); 
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<'active' | 'passive' | 'all'>('active');

  // usePersistentForm entegrasyonu (form_dept_new key'i ile)
  const [formData, setFormData, clearFormData] = usePersistentForm('form_dept_new', {
    name: '',
    description: '',
    abbreviation: '',
    departmentTypeId: '', 
    commercialAccountId: ''
  });

  const fetchData = async () => {
    try {
      const [depRes, accRes, typesRes] = await Promise.all([
        departmentsAPI.getAll({ limit: 100 }),
        accountsAPI.getAll({ limit: 100 }),
        departmentsAPI.getTypes()
      ]);
      setDepartments(depRes.data.data);
      setAccounts(accRes.data.data.filter((a:any) => a.state === 1)); 
      setDeptTypes(typesRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredDepartments = departments
    .filter(d => {
      // Tab filtresi
      if (filterTab === 'active' && d.state !== 1) return false;
      if (filterTab === 'passive' && d.state !== 0) return false;
      // Arama filtresi
      const s = searchTerm.toLowerCase();
      if (!s) return true;
      return (d.name?.toLowerCase().includes(s) || d.description?.toLowerCase().includes(s) || d.abbreviation?.toLowerCase().includes(s));
    })
    .sort((a, b) => b.state - a.state);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Kısaltma validasyonu
    if (formData.abbreviation && formData.abbreviation.length > 4) {
      toast.error('Kısa kod en fazla 4 karakter olmalıdır.');
      return;
    }
    const payload = {
        ...formData,
        departmentTypeId: formData.departmentTypeId ? Number(formData.departmentTypeId) : undefined,
        commercialAccountId: formData.commercialAccountId ? Number(formData.commercialAccountId) : undefined
    }
    try {
      if (editingId) await departmentsAPI.update(editingId, payload);
      else await departmentsAPI.create(payload);
      setIsModalOpen(false);
      clearFormData();
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (dept: any) => {
    setEditingId(dept.id);
    setFormData({
      name: dept.name || '',
      description: dept.description || '',
      abbreviation: dept.abbreviation || '',
      departmentTypeId: dept.departmentTypeId || '',
      commercialAccountId: dept.commercialAccountId || ''
    });
    setIsModalOpen(true);
  };

  const toggleState = async (id: number, currentState: number) => {
    const confirmed = await confirmDialog(currentState === 1 ? 'Departmanı arşivlemek istediğinize emin misiniz?' : 'Departman tekrar aktif edilecektir. Onaylıyor musunuz?', currentState === 1);
    if (confirmed) {
      await departmentsAPI.toggleState(id, currentState);
      fetchData();
    }
  };

  /* Kısaltma border rengi */
  const abbrBorderColor = (val: string) => {
    if (!val) return undefined;
    if (val.length < 3) return '#f59e0b'; // sarı — çok kısa
    if (val.length === 3) return '#f59e0b'; // sarı — önerilenden kısa
    return '#10b981'; // yeşil — ideal
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ color: 'var(--primary)', marginBottom: '10px' }}>Organizasyon & Departmanlar</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className={`btn ${filterTab === 'active' ? 'btn-primary' : ''}`} onClick={() => setFilterTab('active')}>Aktif Kayıtlar</button>
            <button className={`btn ${filterTab === 'passive' ? 'btn-primary' : ''}`} onClick={() => setFilterTab('passive')}>Arşiv / Pasif</button>
            <button className={`btn ${filterTab === 'all' ? 'btn-primary' : ''}`} onClick={() => setFilterTab('all')}>Tümü</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <input type="text" placeholder="İsim, Açıklama, Kısa Kod ara..." className="search-bar" style={{ width: '400px' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <button className="btn btn-primary" onClick={() => {
            setEditingId(null);
            clearFormData();
            setIsModalOpen(true);
          }}>+ YENİ DEPARTMAN</button>
        </div>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>DEPARTMAN ADI</th>
              <th>TÜR/KATEGORİ</th>
              <th>KISA KOD</th>
              <th>AÇIKLAMA</th>
              <th>BAĞLI HESAP (KASA/BANKA)</th>
              <th>İŞLEMLER</th>
            </tr>
          </thead>
          <tbody>
            {filteredDepartments.map((dept) => (
              <tr key={dept.id} style={{ opacity: dept.state === 0 ? 0.5 : 1, background: dept.state === 0 ? 'var(--surface-container-low)' : 'inherit' }}>
                <td><strong>{dept.name}</strong> {dept.state === 0 && <span className="badge" style={{ background: '#94a3b8', color: 'white' }}>ARŞİVLENDİ</span>}</td>
                <td><span className="badge badge-outline">{dept.departmentType?.name || 'TANIMSIZ'}</span></td>
                <td><span className="badge">{dept.abbreviation || '-'}</span></td>
                <td>{dept.description}</td>
                <td>{dept.commercialAccount?.name || <span style={{ color: 'gray' }}>Bağlı Hesap Yok</span>}</td>
                <td style={{ display: 'flex', gap: '5px' }}>
                  <button className="btn-icon" title="Düzenle" onClick={() => handleEdit(dept)}>
                    <FiEdit2 size={16} />
                  </button>
                  <button className="btn-icon" title={dept.state === 1 ? 'Arşivle' : 'Aktif Et'} style={{ color: dept.state === 1 ? 'var(--error)' : 'var(--success)' }} onClick={() => toggleState(dept.id, dept.state)}>
                    {dept.state === 1 ? <FiArchive size={16} /> : <FiRefreshCw size={16} />}
                  </button>
                </td>
              </tr>
            ))}
            {filteredDepartments.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center' }}>Kayıt bulunamadı.</td></tr>}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="loader-overlay" style={{ alignItems: 'flex-start', paddingTop: '5%' }}>
          <div className="login-box" style={{ maxWidth: '600px', width: '100%', position: 'relative' }}>
             <button className="btn-icon circle" style={{ position: 'absolute', top: '15px', right: '15px' }} onClick={() => setIsModalOpen(false)}><FiX size={20}/></button>
            <h3 style={{ marginBottom: '20px', color: 'var(--primary)' }}>{editingId ? 'Departman Güncelle' : 'Yeni Departman Ekle'}</h3>
            <form onSubmit={handleSubmit} className="login-form">
              
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Departman Adı (Zorunlu)</label>
                  <input required className="uppercase-input" value={formData.name} onChange={e => setFormData({...formData, name: onlyLetters(e.target.value).toLocaleUpperCase('tr-TR')})} placeholder="ÖR: MERKEZ DEPO" />
                </div>
                <div className="form-group">
                  <label>Kısa Kod (3-4 harf)</label>
                  <input 
                    maxLength={4} 
                    className="uppercase-input" 
                    style={{ borderColor: abbrBorderColor(formData.abbreviation), fontWeight: 800, letterSpacing: '3px', textAlign: 'center' }}
                    value={formData.abbreviation} 
                    onChange={e => setFormData({...formData, abbreviation: onlyAbbrLetters(e.target.value).slice(0, 4)})} 
                    placeholder="MKZ" 
                  />
                  {formData.abbreviation && formData.abbreviation.length < 4 && (
                    <small style={{ color: '#f59e0b', fontSize: '0.7rem', marginTop: '4px', display: 'block' }}>En az 4 karakter önerilir</small>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                 <div className="form-group">
                   <label>Departman Tipi</label>
                   <select className="uppercase-input" style={{ appearance: 'none' }} value={formData.departmentTypeId} onChange={e => setFormData({...formData, departmentTypeId: e.target.value})}>
                      <option value="">-- TANIMSIZ TİP --</option>
                      {deptTypes.map(dt => <option key={dt.id} value={dt.id}>{dt.name} ({dt.abbreviation})</option>)}
                   </select>
                 </div>
                 <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label>Bağlı Finans/Kasa Hesabı</label>
                    <button 
                      type="button" 
                      className="btn-link" 
                      style={{ fontSize: '11px', fontWeight: 600, color: 'var(--primary)', marginBottom: '5px' }}
                      onClick={() => {
                        navHub.saveContext({ returnPath: '/departments', formData, editingId });
                        navigate('/accounts?action=new');
                      }}
                    >
                      + YENİ HESAP EKLE
                    </button>
                  </div>
                  <select className="uppercase-input" style={{ appearance: 'none' }} value={formData.commercialAccountId} onChange={e => setFormData({...formData, commercialAccountId: e.target.value})}>
                    <option value="">-- KASA/BANKA SEÇİNİZ --</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Departman Açıklaması</label>
                <input className="uppercase-input" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value.toLocaleUpperCase('tr-TR')})} placeholder="..." />
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingId ? 'GÜNCELLE' : 'KAYDET'}</button>
                <button type="button" className="btn" style={{ flex: 1, background: '#e2e8f0' }} onClick={() => setIsModalOpen(false)}>İPTAL</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}