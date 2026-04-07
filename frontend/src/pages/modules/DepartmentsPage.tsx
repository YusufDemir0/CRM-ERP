import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { departmentsAPI, accountsAPI } from '../../services/api';
import { usePersistentForm } from '../../hooks/usePersistentForm';
import { navHub } from '../../utils/navHub';

export default function DepartmentsPage() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData, clearFormData] = usePersistentForm('form_department_new', {
    name: '',
    description: '',
    abbreviation: '',
    commercialAccountId: ''
  });

  const fetchData = async () => {
    try {
      const [depRes, accRes] = await Promise.all([
        departmentsAPI.getAll({ limit: 100 }),
        accountsAPI.getAll({ limit: 100 })
      ]);
      setDepartments(depRes.data.data);
      setAccounts(accRes.data.data.filter((a:any) => a.state === 1)); 
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();

    // -- RESUME LOGIC (NAV HUB) --
    // Check if we just returned from another page via NavHub
    const savedContext = navHub.consumeContext();
    if (savedContext && savedContext.returnPath === '/departments') {
      setFormData(savedContext.formData);
      setEditingId(savedContext.editingId);
      setIsModalOpen(true);
    }
  }, []);

  const sortedAndFiltered = departments
    .filter(d => {
      const s = searchTerm.toLowerCase();
      return (d.name?.toLowerCase().includes(s) || d.description?.toLowerCase().includes(s) || d.abbreviation?.toLowerCase().includes(s));
    })
    .sort((a, b) => b.state - a.state);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) await departmentsAPI.update(editingId, formData);
      else await departmentsAPI.create(formData);
      setIsModalOpen(false);
      clearFormData(); // İşlem bittiğinde temizle
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
      commercialAccountId: dept.commercialAccountId || ''
    });
    setIsModalOpen(true);
  };

  const toggleState = async (id: number, currentState: number) => {
    if (window.confirm(currentState === 1 ? 'Departmanı arşivlemek istediğinize emin misiniz?' : 'Departman tekrar aktif edilecektir. Onaylıyor musunuz?')) {
      await departmentsAPI.toggleState(id, currentState);
      fetchData();
    }
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: 'var(--primary)' }}>Organizasyon & Departmanlar</h2>
        <div style={{ display: 'flex', gap: '15px' }}>
          <input 
            type="text" 
            placeholder="İsim, Açıklama, Kısa Kod ara..." 
            className="search-bar" 
            style={{ width: '400px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="btn btn-primary" onClick={() => {
            setEditingId(null);
            setIsModalOpen(true);
          }}>+ YENİ DEPARTMAN</button>
        </div>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>DEPARTMAN ADI</th>
              <th>KISA KOD</th>
              <th>AÇIKLAMA</th>
              <th>BAĞLI TİCARİ HESAP (KASA/BANKA)</th>
              <th>İŞLEMLER</th>
            </tr>
          </thead>
          <tbody>
            {sortedAndFiltered.map((dept) => (
              <tr key={dept.id} style={{ opacity: dept.state === 0 ? 0.5 : 1, background: dept.state === 0 ? 'var(--surface-container-low)' : 'inherit' }}>
                <td><strong>{dept.name}</strong> {dept.state === 0 && <span className="badge" style={{ background: '#94a3b8', color: 'white' }}>ARŞİVLENDİ</span>}</td>
                <td><span className="badge">{dept.abbreviation || '-'}</span></td>
                <td>{dept.description}</td>
                <td>{dept.commercialAccount?.name || <span style={{ color: 'gray' }}>Bağlı Hesap Yok</span>}</td>
                <td>
                  <button className="btn" style={{ padding: '0 10px', height: '30px', marginRight: '5px' }} onClick={() => handleEdit(dept)}>✎ Düzenle</button>
                  <button className="btn" style={{ padding: '0 10px', height: '30px', color: dept.state === 1 ? 'var(--error)' : 'var(--success)' }} onClick={() => toggleState(dept.id, dept.state)}>
                    {dept.state === 1 ? 'Arşivle' : 'Aktif Et'}
                  </button>
                </td>
              </tr>
            ))}
            {sortedAndFiltered.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center' }}>Kayıt bulunamadı.</td></tr>}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="loader-overlay" style={{ alignItems: 'flex-start', paddingTop: '5%' }}>
          <div className="login-box" style={{ maxWidth: '500px', width: '100%' }}>
            <h3 style={{ marginBottom: '20px', color: 'var(--primary)' }}>{editingId ? 'Departman Güncelle' : 'Yeni Departman Ekle'}</h3>
            <form onSubmit={handleSubmit} className="login-form">
              
              <div className="form-group">
                <label>Departman Adı (Zorunlu)</label>
                <input required className="uppercase-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} placeholder="ÖR: MERKEZ DEPO" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Kısa Kod</label>
                  <input maxLength={5} className="uppercase-input" value={formData.abbreviation} onChange={e => setFormData({...formData, abbreviation: e.target.value.toUpperCase()})} placeholder="MKZ" />
                </div>
                <div className="form-group">
                  <label>Bağlı Hesap Seçimi</label>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <select className="uppercase-input" style={{ appearance: 'none', flex: 1 }} value={formData.commercialAccountId} onChange={e => setFormData({...formData, commercialAccountId: e.target.value})}>
                      <option value="">-- KASA/BANKA SEÇİNİZ --</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name} ({acc.bankName || 'Kasa'})</option>
                      ))}
                    </select>
                    <button type="button" className="btn btn-primary" style={{ padding: '0 15px' }} title="Yeni Hesap Oluştur" onClick={() => {
                        navHub.saveContext({
                          returnPath: '/departments',
                          formData: formData,
                          editingId: editingId
                        });
                        navigate('/accounts?action=new');
                      }}>+</button>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Departman Açıklaması</label>
                <input className="uppercase-input" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value.toUpperCase()})} placeholder="..." />
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