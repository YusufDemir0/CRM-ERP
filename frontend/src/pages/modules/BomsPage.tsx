import React, { useState, useEffect } from 'react';
import { bomsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { confirmDialog } from '../../utils/confirmDialog';
import { FiEdit2, FiArchive, FiRefreshCw, FiCopy, FiSearch } from 'react-icons/fi';
import { Bom, BomItem } from '../../types';
import { PaginationControls } from '../../components/common/PaginationControls';
import { useQuickCreate } from '../../context/QuickCreateContext';

export function BomsPage() {
  const [boms, setBoms] = useState<Bom[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'active' | 'passive' | 'all'>('active');
  const [loading, setLoading] = useState(false);

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [paginationMeta, setPaginationMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });

  const { openCreate } = useQuickCreate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const bRes = await bomsAPI.getAll({ 
        page, 
        limit, 
        search: debouncedSearch,
        state: filterTab === 'all' ? undefined : (filterTab === 'active' ? 1 : 0)
      });
      setBoms(bRes.data.data);
      setPaginationMeta(bRes.data.meta);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Reçete verileri yüklenemedi");
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

  useEffect(() => { fetchData(); }, [page, limit, debouncedSearch, filterTab]);

  const handleFormSuccess = () => {
    fetchData();
    toast.success("Reçete başarıyla kaydedildi.");
  };

  const handleEdit = (b: Bom) => {
    openCreate('bom', {
      editingId: b.id,
      initialData: {
        name: b.name || '', 
        targetItemId: String(b.targetItemId || ''),
        description: b.description || '',
        items: b.items?.map((bi: BomItem) => ({ itemId: bi.itemId, quantity: Number(bi.quantity), description: bi.description || '' })) || []
      },
      onSuccess: handleFormSuccess
    });
  };

  const handleClone = (b: Bom) => {
    openCreate('bom', {
      initialData: {
        name: `${b.name} (KOPYA)`, 
        targetItemId: String(b.targetItemId || ''),
        description: b.description || '',
        items: b.items?.map((bi: BomItem) => ({ itemId: bi.itemId, quantity: Number(bi.quantity), description: bi.description || '' })) || []
      },
      onSuccess: handleFormSuccess
    });
    toast("Reçete kopyalandı. Değişiklik yapıp yeni olarak kaydedebilirsiniz.", { icon: 'ℹ️' });
  };

  const toggleState = async (id: number, currentState: number) => {
    const confirmed = await confirmDialog(currentState === 1 ? 'Reçeteyi pasife alıp arşivlemek istiyor musunuz?' : 'Reçeteyi yeniden aktif ediyorsunuz. Emin misiniz?', currentState === 1);
    if (confirmed) {
      try {
        await bomsAPI.update(id, { state: currentState === 1 ? 0 : 1 });
        fetchData();
        toast.success("Durum güncellendi");
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Hata oluştu");
      }
    }
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ color: 'var(--primary)', marginBottom: '10px' }}>Üretim Reçeteleri (BOM)</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className={`btn ${filterTab === 'active' ? 'btn-primary' : ''}`} onClick={() => setFilterTab('active')}>Aktif Reçeteler</button>
            <button className={`btn ${filterTab === 'passive' ? 'btn-primary' : ''}`} onClick={() => setFilterTab('passive')}>Arşiv</button>
            <button className={`btn ${filterTab === 'all' ? 'btn-primary' : ''}`} onClick={() => setFilterTab('all')}>Tümü</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <div className="search-container" style={{ position: 'relative' }}>
             <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
             <input type="text" placeholder="Reçete Ara..." className="search-bar" style={{ width: '300px', paddingLeft: '40px' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={() => {
            openCreate('bom', {
              onSuccess: handleFormSuccess
            });
          }}>+ YENİ REÇETE</button>
        </div>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr><th>REÇETE ADI</th><th>HEDEF ÜRÜN</th><th>AÇIKLAMA</th><th>MALZEMELER</th><th>İŞLEMLER</th></tr>
          </thead>
          <tbody>
            {boms.map((b) => (
              <tr key={b.id} style={{ opacity: b.isActive === false ? 0.6 : 1, background: b.isActive === false ? 'var(--surface-container-low)' : 'inherit' }}>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <strong>{b.name}</strong>
                    <div style={{ display: 'flex', gap: '5px', marginTop: '4px' }}>
                      <span className="badge" style={{ fontSize: '10px' }}>v{b.version}</span>
                      {b.isActive ? 
                        <span className="badge badge-success" style={{ fontSize: '10px' }}>VARSAYILAN</span> : 
                        <span className="badge badge-secondary" style={{ fontSize: '10px' }}>ESKİ</span>
                      }
                    </div>
                  </div>
                </td>
                <td><span className="badge badge-outline">{b.targetItem?.name || '-'}</span></td>
                <td style={{ fontSize: '12px' }}>{b.description || '-'}</td>
                <td><span className="badge">{b.items?.length || 0} Kalem</span></td>
                <td style={{ display: 'flex', gap: '5px' }}>
                  <button className="btn-icon" title="Düzenle" onClick={() => handleEdit(b)}>
                    <FiEdit2 size={16} />
                  </button>
                  <button className="btn-icon" title="Klonla (Yeni Versiyon)" style={{ color: 'var(--primary)' }} onClick={() => handleClone(b)}>
                    <FiCopy size={16} />
                  </button>
                  <button className="btn-icon" title={b.state === 1 ? 'Arşivle' : 'Aktif Et'} style={{ color: b.state === 1 ? 'var(--error)' : 'var(--success)' }} onClick={() => toggleState(b.id, b.state)}>
                    {b.state === 1 ? <FiArchive size={16} /> : <FiRefreshCw size={16} />}
                  </button>
                </td>
              </tr>
            ))}
            {boms.length === 0 && !loading && (
              <tr><td colSpan={5} style={{textAlign:'center', padding: '40px', color: 'gray'}}>Reçete kaydı bulunmuyor.</td></tr>
            )}
            {loading && (
               <tr><td colSpan={5} style={{textAlign:'center', padding: '40px'}}><div className="spinner" style={{margin:'0 auto'}}></div></td></tr>
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