import React, { useState, useEffect, useMemo } from 'react';
import { itemsAPI, currenciesAPI, bomsAPI, partiesAPI } from '../../services/api';
import { usePersistentForm } from '../../hooks/usePersistentForm';
import { navHub } from '../../utils/navHub';
import { useNavigate } from 'react-router-dom';
import { FiEdit2, FiArchive, FiRefreshCw, FiAlertTriangle, FiSearch, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { confirmDialog } from '../../utils/confirmDialog';

export default function ItemsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [itemTypes, setItemTypes] = useState<any[]>([]);
  const [itemCodeGroups, setItemCodeGroups] = useState<any[]>([]);
  const [quantityTypes, setQuantityTypes] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);

  const [filterTab, setFilterTab] = useState<'active' | 'passive' | 'all'>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [modalMode, setModalMode] = useState<'none' | 'select_type' | 'form' | 'excel'>('none');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [warningMessage, setWarningMessage] = useState<{ text: string, linkText?: string, linkUrl?: string } | null>(null);
  const [customKdv, setCustomKdv] = useState<number | null>(null);
  
  // Sıralama State
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });

  const [formData, setFormData, clearFormData] = usePersistentForm('form_item_new', {
    name: '',
    itemTypeId: '',
    itemCodeGroupId: '',
    criticalLimit: 0,
    purchasePrice: 0,
    salePrice: 0,
    currencyId: '',
    quantityTypeId: '',
    providerId: '', 
    kdv: 20 as number | string,
    image: '', 
    description: '',
    notes: '' 
  });

  const fetchData = async () => {
    try {
      const [itRes, itTypesRes, codeGroupsRes, qtyTypesRes, curRes, provRes] = await Promise.all([
        itemsAPI.getAll({ limit: 1000 }),
        itemsAPI.getTypes(),
        itemsAPI.getCodeGroups(),
        itemsAPI.getQuantityTypes(),
        currenciesAPI.getAll(),
        partiesAPI.getAll({ limit: 1000, state: 1 })
      ]);
      
      setItems(itRes.data.data);
      setItemTypes(itTypesRes.data);
      setItemCodeGroups(codeGroupsRes.data);
      setQuantityTypes(qtyTypesRes.data);
      setCurrencies(curRes.data);
      setProviders(provRes.data.data.filter((p: any) => p.type !== 'customer'));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Gelişmiş Arama ve Filtreleme
  const searchingItems = useMemo(() => {
    return items.filter(i => {
      const s = searchTerm.toLowerCase();
      const matchSearch = i.name?.toLowerCase().includes(s) || i.code?.toLowerCase().includes(s);
      const tabMatch = filterTab === 'all' || (filterTab === 'active' ? i.state === 1 : i.state === 0);
      return matchSearch && tabMatch;
    });
  }, [items, searchTerm, filterTab]);

  // Sıralama Mantığı
  const sortedItems = useMemo(() => {
    if (!sortConfig) return searchingItems;
    return [...searchingItems].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      
      if (['purchasePrice', 'salePrice', 'criticalLimit'].includes(sortConfig.key)) {
        aValue = Number(aValue);
        bValue = Number(bValue);
      } else {
        aValue = String(aValue || '').toLocaleLowerCase('tr-TR');
        bValue = String(bValue || '').toLocaleLowerCase('tr-TR');
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [searchingItems, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      itemTypeId: Number(formData.itemTypeId),
      itemCodeGroupId: Number(formData.itemCodeGroupId),
      kdv: customKdv !== null ? customKdv : Number(formData.kdv),
      providerId: formData.providerId ? Number(formData.providerId) : null,
      currencyId: Number(formData.currencyId),
      quantityTypeId: Number(formData.quantityTypeId)
    };

    try {
      if (editingId) await itemsAPI.update(editingId, payload);
      else await itemsAPI.create(payload);
      setModalMode('none');
      clearFormData();
      setCustomKdv(null);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({
      name: item.name || '',
      itemTypeId: item.itemTypeId || '',
      itemCodeGroupId: item.itemCodeGroupId || '',
      criticalLimit: Number(item.criticalLimit) || 0,
      purchasePrice: Number(item.purchasePrice) || 0,
      salePrice: Number(item.salePrice) || 0,
      currencyId: item.currencyId || '',
      quantityTypeId: item.quantityTypeId || '',
      providerId: item.providerId || '',
      kdv: [0, 1, 10, 20].includes(Number(item.kdv)) ? Number(item.kdv) : 'custom' as string,
      image: item.image || '',
      description: item.description || '',
      notes: item.notes || ''
    });
    if (![0, 1, 10, 20].includes(Number(item.kdv))) {
      setCustomKdv(Number(item.kdv));
    }
    setModalMode('form');
  };

  const toggleState = async (item: any) => {
    const isDeactivating = item.state === 1;
    if (isDeactivating) {
       const bomsRes = await bomsAPI.getAll({ limit: 1000 });
       const conflict = bomsRes.data.data?.find((b: any) => b.state === 1 && b.items?.some((bi: any) => bi.itemId === item.id));
       if (conflict) {
         setWarningMessage({ text: `Bu ürün aktif bir reçetede kullanılıyor: ${conflict.name}`, linkUrl: '/boms' });
         return;
       }
    }
    const confirmed = await confirmDialog(item.state === 1 ? 'Arşivlemek istediğinize emin misiniz?' : 'Aktif edilsin mi?', item.state === 1);
    if (confirmed) {
      await itemsAPI.toggleState(item.id, item.state);
      fetchData();
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
          <h2 style={{ color: 'var(--primary)', marginBottom: '10px' }}>Ürünler & Stok</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className={`btn ${filterTab === 'active' ? 'btn-primary' : ''}`} onClick={() => setFilterTab('active')}>Aktifler</button>
            <button className={`btn ${filterTab === 'passive' ? 'btn-primary' : ''}`} onClick={() => setFilterTab('passive')}>Arşiv</button>
            <button className={`btn ${filterTab === 'all' ? 'btn-primary' : ''}`} onClick={() => setFilterTab('all')}>Tümü</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <div className="search-container" style={{ position: 'relative' }}>
             <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
             <input type="text" placeholder="Ürün Ara..." className="search-bar" style={{ width: '300px', paddingLeft: '40px' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={() => {
            setEditingId(null);
            clearFormData();
            setFormData(prev => ({
              ...prev,
              currencyId: currencies.find(c => c.isDefault === 1)?.id || '',
              kdv: 20
            }));
            setModalMode('form');
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
            {sortedItems.map((item) => (
              <tr key={item.id} style={{ opacity: item.state === 0 ? 0.6 : 1 }}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {item.image ? <img src={item.image} style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }} /> : <div style={{ width: '32px', height: '32px', background: '#e2e8f0', borderRadius:'4px' }} />}
                    <div>
                      <strong>{item.name}</strong>
                      <div style={{ fontSize: '10px', color: 'gray' }}>{item.itemType?.name} / {item.quantityType?.abbreviation}</div>
                    </div>
                  </div>
                </td>
                <td><span className="badge">{item.code}</span></td>
                <td className="tabular-nums">{Number(item.purchasePrice).toLocaleString('tr-TR')} {item.currency?.symbol}</td>
                <td className="tabular-nums" style={{ color: 'var(--success)', fontWeight: 700 }}>{Number(item.salePrice).toLocaleString('tr-TR')} {item.currency?.symbol}</td>
                <td className="tabular-nums" style={{ color: item.criticalLimit > 0 ? 'var(--error)' : 'inherit' }}>{item.criticalLimit}</td>
                <td style={{ display: 'flex', gap: '5px' }}>
                  <button className="btn-icon" onClick={() => handleEdit(item)}><FiEdit2 size={16} /></button>
                  <button className="btn-icon" style={{ color: item.state === 1 ? 'var(--error)' : 'var(--success)' }} onClick={() => toggleState(item)}>
                    {item.state === 1 ? <FiArchive size={16} /> : <FiRefreshCw size={16} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalMode === 'form' && (
        <div className="loader-overlay" style={{ alignItems: 'flex-start', paddingTop: '2%', overflowY: 'auto' }}>
          <div className="login-box" style={{ maxWidth: '900px', width: '100%', marginBottom: '5%' }}>
            <h3 style={{ marginBottom: '15px' }}>{editingId ? 'Ürün Güncelle' : 'Yeni Ürün Kaydı'}</h3>
            <form onSubmit={handleSubmit} className="login-form">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Ürün Türü</label>
                  <select required value={formData.itemTypeId} onChange={e => setFormData({...formData, itemTypeId: e.target.value})}>
                    <option value="">Seçiniz</option>
                    {itemTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Ürün Adı</label>
                  <input required className="uppercase-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toLocaleUpperCase('tr-TR').replace(/[0-9]/g, '')})} />
                </div>
                <div className="form-group">
                  <label>Kod Grubu (Prefix)</label>
                  <select required value={formData.itemCodeGroupId} onChange={e => setFormData({...formData, itemCodeGroupId: e.target.value})}>
                    <option value="">Seçiniz</option>
                    {itemCodeGroups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.prefix})</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Alış Fiyatı</label>
                  <input type="number" step="0.01" value={formData.purchasePrice} onChange={e => setFormData({...formData, purchasePrice: Number(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label>Satış Fiyatı</label>
                  <input type="number" step="0.01" value={formData.salePrice} onChange={e => setFormData({...formData, salePrice: Number(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label>Döviz</label>
                  <select required value={formData.currencyId} onChange={e => setFormData({...formData, currencyId: e.target.value})}>
                    <option value="">Seçiniz</option>
                    {currencies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Birim</label>
                  <select required value={formData.quantityTypeId} onChange={e => setFormData({...formData, quantityTypeId: e.target.value})}>
                    <option value="">Seçiniz</option>
                    {quantityTypes.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>KDV (%)</label>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <select style={{ flex: 1 }} value={formData.kdv} onChange={e => {
                      const val = e.target.value;
                      setFormData({...formData, kdv: val as string});
                      if (val !== 'custom') setCustomKdv(null);
                    }}>
                      <option value={0}>%0</option><option value={1}>%1</option><option value={10}>%10</option><option value={20}>%20</option>
                      <option value="custom">Özel...</option>
                    </select>
                    {formData.kdv === 'custom' && (
                      <input type="number" style={{ width: '70px' }} value={customKdv || ''} onChange={e => setCustomKdv(Number(e.target.value))} placeholder="%" />
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label>Kritik Limit</label>
                  <input type="number" value={formData.criticalLimit} onChange={e => setFormData({...formData, criticalLimit: Number(e.target.value)})} />
                </div>
              </div>

              <div className="form-group">
                <label>Görsel URL</label>
                <input type="url" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} />
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>KAYDET</button>
                <button type="button" className="btn" style={{ flex: 1 }} onClick={() => setModalMode('none')}>İPTAL</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}