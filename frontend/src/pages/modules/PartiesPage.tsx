import React, { useState, useEffect } from 'react';
import { partiesAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { PaginationControls } from '../../components/common/PaginationControls';
import { FiEdit2, FiArchive, FiRefreshCw, FiSearch, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { confirmDialog } from '../../utils/confirmDialog';
import { Party } from '../../types';
import { useQuickCreate } from '../../context/QuickCreateContext';

export default function PartiesPage() {
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<'active' | 'passive' | 'all'>('active');
  
  // Pagination & Sort State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [paginationMeta, setPaginationMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { openCreate } = useQuickCreate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const pRes = await partiesAPI.getAll({ 
        page, 
        limit, 
        search: debouncedSearch,
        sortBy: sortConfig?.key,
        sortOrder: sortConfig?.direction.toUpperCase() as any,
        state: filterTab === 'active' ? 1 : (filterTab === 'passive' ? 0 : undefined)
      });
      setParties(pRes.data.data);
      setPaginationMeta(pRes.data.meta);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Cari veriler yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  // Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); 
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => { 
    fetchData(); 
  }, [page, limit, debouncedSearch, sortConfig, filterTab]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleFormSuccess = () => {
    fetchData();
    toast.success("Cari kart kaydedildi.");
  };

  const handleEdit = (p: Party) => {
    openCreate('party', {
      editingId: p.id,
      initialData: {
        name: p.name || '',
        type: p.type || 'customer',
        taxOffice: p.taxOffice || '',
        taxNumber: p.taxNumber || '',
        phone: p.phone1 || '',
        email: p.email || '',
        address: p.address || '',
        commercialCreditLimit: Number(p.creditLimitPlus) || 0,
        riskLimit: Number(p.balance) || 0, // Mapping risk limit as balance for now or adjust based on entity
        description: p.notes || ''
      },
      onSuccess: handleFormSuccess
    });
  };

  const toggleState = async (p: Party) => {
    const currentState = p.state;
    if (currentState === 1 && Number(p.balance) !== 0) {
      toast.error("Bakiye 0 olmadığı için bu cari pasife alınamaz.");
      return;
    }
    const confirmed = await confirmDialog(currentState === 1 ? 'Firmayı/Müşteriyi arşivlemek istediğinize emin misiniz?' : 'Hesap tekrar aktif edilecektir. Onaylıyor musunuz?', currentState === 1);
    if (confirmed) {
      try {
        await partiesAPI.toggleState(p.id, currentState);
        fetchData();
        toast.success("Durum güncellendi");
      } catch (error: any) {
        toast.error(error.response?.data?.message || "İşlem başarısız");
      }
    }
  };

  const sortIcon = (key: string) => {
    if (sortConfig?.key !== key) return <FiChevronDown style={{ opacity: 0.3 }} />;
    return sortConfig.direction === 'asc' ? <FiChevronUp /> : <FiChevronDown />;
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ color: 'var(--primary)', marginBottom: '10px' }}>Cari Yönetimi (Müşteri & Tedarikçi)</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className={`btn ${filterTab === 'active' ? 'btn-primary' : ''}`} onClick={() => { setFilterTab('active'); setPage(1); }}>Aktif Kayıtlar</button>
            <button className={`btn ${filterTab === 'passive' ? 'btn-primary' : ''}`} onClick={() => { setFilterTab('passive'); setPage(1); }}>Arşiv</button>
            <button className={`btn ${filterTab === 'all' ? 'btn-primary' : ''}`} onClick={() => { setFilterTab('all'); setPage(1); }}>Tümü</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <div className="search-container" style={{ position: 'relative' }}>
            <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input type="text" placeholder="Ad, Telefon veya E-Posta Ara..." className="search-bar" style={{ width: '300px', paddingLeft: '40px' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={() => {
            openCreate('party', {
              onSuccess: handleFormSuccess
            });
          }}>+ YENİ CARİ</button>
        </div>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th onClick={() => requestSort('name')} style={{ cursor: 'pointer' }}>Cari Adı {sortIcon('name')}</th>
              <th>Vergi No</th>
              <th>İletişim</th>
              <th onClick={() => requestSort('balance')} style={{ cursor: 'pointer' }}>Bakiye {sortIcon('balance')}</th>
              <th>Limit / Risk</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {parties.map((p) => (
              <tr key={p.id} style={{ opacity: p.state === 0 ? 0.6 : 1, background: p.state === 0 ? 'var(--surface-container-low)' : 'inherit' }}>
                <td>
                  <div style={{ fontWeight: 800 }}>{p.name}</div>
                  <div style={{ fontSize: '10px', color: 'gray' }}>{p.type === 'customer' ? 'Müşteri' : (p.type === 'provider' ? 'Tedarikçi' : 'Her İkisi')}</div>
                </td>
                <td><span className="badge badge-outline">{p.taxNumber || '—'}</span></td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', fontSize: '12px' }}>
                    <strong>{p.phone1}</strong>
                    <span style={{ color: 'gray', textTransform: 'lowercase' }}>{p.email}</span>
                  </div>
                </td>
                <td className="tabular-nums" style={{ fontWeight: 700, color: Number(p.balance) > 0 ? 'var(--error)' : 'var(--success)' }}>
                  {Number(p.balance).toLocaleString('tr-TR')} {p.currency?.symbol || '₺'}
                </td>
                <td>
                   <div style={{ fontSize: '11px', fontWeight: 600 }}>{Number(p.creditLimitPlus).toLocaleString('tr-TR')} {p.currency?.symbol || '₺'}</div>
                   <div className="limit-progress" style={{ width: '100px', height: '4px', background: '#e2e8f0', borderRadius: '2px', marginTop: '4px', overflow: 'hidden' }}>
                      <div style={{ 
                        width: `${Math.min(100, Math.abs(Number(p.balance) / (Number(p.creditLimitPlus) || 1)) * 100)}%`, 
                        height:'100%', 
                        background: Math.abs(Number(p.balance)) > (Number(p.creditLimitPlus) || 0) * 0.9 ? 'var(--error)' : 'var(--primary)' 
                      }} />
                   </div>
                </td>
                <td style={{ display: 'flex', gap: '5px' }}>
                  <button className="btn-icon" onClick={() => handleEdit(p)} title="Düzenle"><FiEdit2 size={16} /></button>
                  <button className="btn-icon" onClick={() => toggleState(p)} title={p.state === 1 ? 'Arşivle' : 'Aktif Et'} style={{ color: p.state === 1 ? 'var(--error)' : 'var(--success)' }}>
                    {p.state === 1 ? <FiArchive size={16} /> : <FiRefreshCw size={16} />}
                  </button>
                </td>
              </tr>
            ))}
            {parties.length === 0 && !loading && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'gray' }}>Kayıt bulunamadı.</td>
              </tr>
            )}
            {loading && (
               <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '30px' }}>
                  <div className="spinner" style={{ margin: '0 auto' }}></div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <PaginationControls 
          meta={paginationMeta} 
          onPageChange={setPage} 
          onLimitChange={setLimit} 
          loading={loading}
        />
      </div>
    </div>
  );
}