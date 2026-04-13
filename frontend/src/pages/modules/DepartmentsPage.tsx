import React, { useState, useEffect } from 'react';
import { departmentsAPI, accountsAPI } from '../../services/api';
import { FiEdit2, FiArchive, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { confirmDialog } from '../../utils/confirmDialog';
import { useQuickCreate } from '../../context/QuickCreateContext';

/** Sadece harf ve boşluk (Türkçe dahil) — sayı yasak */
const onlyLetters = (val: string) => val.replace(/[0-9]/g, '');
/** Kısaltma: sadece büyük harf, rakam ve boşluk yok, max 4 */
const onlyAbbrLetters = (val: string) => val.replace(/[^A-ZÇĞİÖŞÜa-zçğıöşü]/g, '').toLocaleUpperCase('tr-TR');

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<'active' | 'passive' | 'all'>('active');
  const { openCreate } = useQuickCreate();

  const fetchData = async () => {
    try {
      const depRes = await departmentsAPI.getAll({ limit: 100 });
      setDepartments(depRes.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredDepartments = departments
    .filter(d => {
      const s = searchTerm.toLowerCase();
      const tabMatch = filterTab === 'all' || (filterTab === 'active' ? d.state === 1 : d.state === 0);
      
      const textMatch = 
        d.name?.toLowerCase().includes(s) || 
        d.description?.toLowerCase().includes(s) || 
        d.abbreviation?.toLowerCase().includes(s) ||
        d.departmentType?.name?.toLowerCase().includes(s) ||
        d.commercialAccount?.name?.toLowerCase().includes(s);

      return tabMatch && textMatch;
    })
    .sort((a, b) => b.state - a.state);

  const handleFormSuccess = () => {
    fetchData();
    toast.success("Departman bilgileri kaydedildi.");
  };

  const handleEdit = (dept: any) => {
    openCreate('department', {
      editingId: dept.id,
      initialData: {
        name: dept.name || '',
        description: dept.description || '',
        abbreviation: dept.abbreviation || '',
        departmentTypeId: dept.departmentTypeId || '',
        commercialAccountId: dept.commercialAccountId || ''
      },
      onSuccess: handleFormSuccess
    });
  };

  const toggleState = async (id: number, currentState: number) => {
    const confirmed = await confirmDialog(currentState === 1 ? 'Departmanı arşivlemek istediğinize emin misiniz?' : 'Departman tekrar aktif edilecektir. Onaylıyor musunuz?', currentState === 1);
    if (confirmed) {
      await departmentsAPI.toggleState(id, currentState);
      fetchData();
    }
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
            openCreate('department', {
              onSuccess: handleFormSuccess
            });
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
                <td><span className="badge badge-outline">{dept.departmentType?.name || 'Lütfen Seçiniz'}</span></td>
                <td><span className="badge">{dept.abbreviation || '-'}</span></td>
                <td>{dept.description}</td>
                <td>{dept.commercialAccount?.name || <span style={{ color: 'gray' }}>Lütfen Seçiniz</span>}</td>
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
            {filteredDepartments.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: 'gray' }}>Kayıt bulunamadı.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}