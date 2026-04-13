import React, { useState, useEffect } from 'react';
import { itemsAPI, bomsAPI } from '../../services/api';
import { FiEdit2, FiArchive, FiRefreshCw, FiSearch, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { PaginationControls } from '../../components/common/PaginationControls';
import { confirmDialog } from '../../utils/confirmDialog';
import { Item } from '../../types';
import { useQuickCreate } from '../../context/QuickCreateContext';

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [filterTab, setFilterTab] = useState<'active' | 'passive' | 'all'>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [warningMessage, setWarningMessage] = useState<{ text: string, linkUrl?: string } | null>(null);

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
      const itRes = await itemsAPI.getAll({ 
        page, 
        limit, 
        search: debouncedSearch,
        sortBy: sortConfig?.key,
        sortOrder: sortConfig?.direction.toUpperCase() as any,
        state: filterTab === 'active' ? 1 : (filterTab === 'passive' ? 0 : undefined)
      });
      setItems(itRes.data.data);
      setPaginationMeta(itRes.data.meta);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Ürün verileri yüklenemedi");
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
    toast.success("Ürün kartı güncellendi.");
  };

  const handleEdit = (item: Item) => {
    openCreate('item', {
      editingId: item.id,
      initialData: {
        name: item.name || '',
        itemTypeId: String(item.itemTypeId || ''),
        itemCodeGroupId: String(item.itemCodeGroupId || ''),
        criticalLimit: Number(item.criticalLimit) || 0,
        purchasePrice: Number(item.purchasePrice) || 0,
        salePrice: Number(item.salePrice) || 0,
        currencyId: String(item.currencyId || ''),
        quantityTypeId: String(item.quantityTypeId || ''),
        kdv: [0, 1, 10, 20].includes(Number(item.kdv)) ? Number(item.kdv) : 'custom',
        image: item.image || '',
        description: item.description || '',
        notes: item.notes || ''
      },
      onSuccess: handleFormSuccess
    });
  };

  const toggleState = async (item: Item) => {
    const isDeactivating = item.state === 1;
    if (isDeactivating) {
       const bomsRes = await bomsAPI.getAll({ limit: 1000 });
       const conflict = bomsRes.data.data?.find((b: any) => b.state === 1 && b.items?.some((bi: any) => bi.itemId === item.id));
       if (conflict) {
         toast.error(`Bu ürün aktif bir reçetede kullanılıyor: ${conflict.name}`);
         return;
       }
    }
    const confirmed = await confirmDialog(item.state === 1 ? 'Arşivlemek istediğinize emin misiniz?' : 'Aktif edilsin mi?', item.state === 1);
    if (confirmed) {
      try {
        await itemsAPI.toggleState(item.id, item.state);
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
          <h2 style={{ color: 'var(--primary)', marginBottom: '10px' }}>Ürünler & Stok Yönetimi</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className={`btn ${filterTab === 'active' ? 'btn-primary' : ''}`} onClick={() => { setFilterTab('active'); setPage(1); }}>Aktifler</button>
            <button className={`btn ${filterTab === 'passive' ? 'btn-primary' : ''}`} onClick={() => { setFilterTab('passive'); setPage(1); }}>Arşiv</button>
            <button className={`btn ${filterTab === 'all' ? 'btn-primary' : ''}`} onClick={() => { setFilterTab('all'); setPage(1); }}>Tümü</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <div className="search-container" style={{ position: 'relative' }}>
             <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
             <input type="text" placeholder="Ürün Adı veya Kod Ara..." className="search-bar" style={{ width: '300px', paddingLeft: '40px' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={() => {
            openCreate('item', {
              onSuccess: handleFormSuccess
            });
          }}>+ YENİ ÜRÜN</button>
        </div>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th onClick={() => requestSort('name')} style={{ cursor: 'pointer' }}>Ürün Adı {sortIcon('name')}</th>
              <th onClick={() => requestSort('code')} style={{ cursor: 'pointer' }}>Kodu {sortIcon('code')}</th>
              <th onClick={() => requestSort('purchasePrice')} style={{ cursor: 'pointer' }}>Alış {sortIcon('purchasePrice')}</th>
              <th onClick={() => requestSort('salePrice')} style={{ cursor: 'pointer' }}>Satış {sortIcon('salePrice')}</th>
              <th onClick={() => requestSort('criticalLimit')} style={{ cursor: 'pointer' }}>Kritik Limit {sortIcon('criticalLimit')}</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} style={{ opacity: item.state === 0 ? 0.6 : 1, background: item.state === 0 ? 'var(--surface-container-low)' : 'inherit' }}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {item.image ? (
                      <img src={item.image} alt={item.name} style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border)' }} />
                    ) : (
                      <div style={{ width: '36px', height: '36px', background: 'var(--surface-container-high)', borderRadius:'8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)' }}>FOTO</span>
                      </div>
                    )}
                    <div>
                      <strong style={{ fontSize: '14px' }}>{item.name}</strong>
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{item.itemType?.name} / {item.quantityType?.abbreviation}</div>
                    </div>
                  </div>
                </td>
                <td><span className="badge badge-outline" style={{ fontWeight: 700 }}>{item.code}</span></td>
                <td className="tabular-nums">{Number(item.purchasePrice).toLocaleString('tr-TR')} {item.currency?.symbol}</td>
                <td className="tabular-nums" style={{ color: 'var(--success)', fontWeight: 800 }}>{Number(item.salePrice).toLocaleString('tr-TR')} {item.currency?.symbol}</td>
                <td className="tabular-nums">
                   <span style={{ 
                     color: item.criticalLimit > 0 ? 'var(--error)' : 'var(--text-secondary)',
                     fontWeight: item.criticalLimit > 0 ? 800 : 400
                   }}>
                     {item.criticalLimit}
                   </span>
                </td>
                <td style={{ display: 'flex', gap: '5px' }}>
                  <button className="btn-icon" title="Düzenle" onClick={() => handleEdit(item)}><FiEdit2 size={16} /></button>
                  <button className="btn-icon" title={item.state === 1 ? 'Arşivle' : 'Aktif Et'} style={{ color: item.state === 1 ? 'var(--error)' : 'var(--success)' }} onClick={() => toggleState(item)}>
                    {item.state === 1 ? <FiArchive size={16} /> : <FiRefreshCw size={16} />}
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && !loading && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'gray' }}>Kayıt bulunamadı.</td>
              </tr>
            )}
            {loading && (
               <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
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