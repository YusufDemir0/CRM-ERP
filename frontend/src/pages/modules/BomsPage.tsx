import React, { useState, useEffect } from 'react';
import { bomsAPI, itemsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { confirmDialog } from '../../utils/confirmDialog';
import { FiX, FiCheck, FiEdit2, FiArchive, FiRefreshCw, FiCopy, FiSearch } from 'react-icons/fi';
import { Bom, Item, PaginatedResult, BomItem } from '../../types';
import { PaginationControls } from '../../components/common/PaginationControls';

export function BomsPage() {
  const [boms, setBoms] = useState<Bom[]>([]);
  const [itemsList, setItemsList] = useState<Item[]>([]);
  const[isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'active' | 'passive' | 'all'>('active');
  const [loading, setLoading] = useState(false);

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [paginationMeta, setPaginationMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });

  const [formData, setFormData] = useState({
    name: '', 
    targetItemId: '', 
    description: '', 
    items: [] as { itemId: number, quantity: number, description: string }[]
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bRes, iRes] = await Promise.all([ 
        bomsAPI.getAll({ 
          page, 
          limit, 
          search: debouncedSearch,
          state: filterTab === 'all' ? undefined : (filterTab === 'active' ? 1 : 0)
        }), 
        itemsAPI.getAll({ limit: 1000, state: 1 })
      ]);
      setBoms(bRes.data.data);
      setPaginationMeta(bRes.data.meta);
      setItemsList(iRes.data.data);
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


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      toast.error("Reçeteye en az 1 hammadde / bileşen eklemelisiniz.");
      return;
    }
    // NOT: backend'e targetItemId verisi de gönderiliyor, arka planda karşılığı olmalı (opsiyonel).
    try {
      const payload = {
        ...formData,
        targetItemId: formData.targetItemId ? Number(formData.targetItemId) : undefined
      }
      if (editingId) await bomsAPI.update(editingId, payload);
      else await bomsAPI.create(payload);
      setIsModalOpen(false);
      fetchData();
      toast.success(editingId ? "Reçete güncellendi" : "Yeni reçete kaydedildi");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "İşlem başarısız");
    }
  };

  const handleEdit = (b: Bom) => {
    setEditingId(b.id);
    setFormData({
      name: b.name || '', 
      targetItemId: String(b.targetItemId || ''),
      description: b.description || '',
      items: b.items?.map((bi: BomItem) => ({ itemId: bi.itemId, quantity: Number(bi.quantity), description: bi.description || '' })) || []
    });
    setIsModalOpen(true);
  };

  const handleClone = (b: Bom) => {
    setEditingId(null); // Clear editing ID so it creates a NEW record
    setFormData({
      name: `${b.name} (KOPYA)`, 
      targetItemId: String(b.targetItemId || ''),
      description: b.description || '',
      items: b.items?.map((bi: BomItem) => ({ itemId: bi.itemId, quantity: Number(bi.quantity), description: bi.description || '' })) || []
    });
    setIsModalOpen(true);
    toast.success("Reçete kopyalandı. Yeni versiyon olarak kaydedebilirsiniz.");
  };

  // Reçeteyi arşivleme işlemi (toggleState)
  const toggleState = async (id: number, currentState: number) => {
    const confirmed = await confirmDialog(currentState === 1 ? 'Reçeteyi pasife alıp arşivlemek istiyor musunuz?' : 'Reçeteyi yeniden aktif ediyorsunuz. Emin misiniz?', currentState === 1);
    if (confirmed) {
      // Satış/Item state toggle endpoint yapısına uygun generic boms toggle yazılırsa;
      await bomsAPI.update(id, { state: currentState === 1 ? 0 : 1 });
      fetchData();
    }
  };

  const addBomItem = () => {
    setFormData(prev => ({ ...prev, items:[...prev.items, { itemId: itemsList[0]?.id || 0, quantity: 1, description: '' }] }));
  };

  const removeBomItem = (index: number) => {
    setFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const updateBomItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  // Neyi ürettiğini seçerken sadece Mamül/Yarı-mamül göstersin (Type filtresi eklenebilir)
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
          <div className="search-box" style={{ position: 'relative' }}>
            <FiSearch style={{ position: 'absolute', left: '10px', top: '12px', color: '#94a3b8' }} />
            <input placeholder="Reçete ara..." style={{ paddingLeft: '35px' }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={() => {
            setEditingId(null); setFormData({ name: '', targetItemId: '', description: '', items: [] }); setIsModalOpen(true);
          }}>+ YENİ REÇETE</button>
        </div>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr><th>REÇETE ADI</th><th>ÇIKACAK (HEDEF) ÜRÜN</th><th>AÇIKLAMA</th><th>BİLEŞEN (MALZEME)</th><th>İŞLEMLER</th></tr>
          </thead>
          <tbody>
            {boms.map((b) => {
               const targetItemName = b.targetItem ? b.targetItem.name : (itemsList.find(i=>i.id===b.targetItemId)?.name || 'Lütfen Seçiniz');
               return(
                 <tr key={b.id} style={{ opacity: b.isActive === false ? 0.6 : 1, background: b.isActive === false ? '#f8fafc' : 'inherit' }}>
                   <td>
                     <div style={{ display: 'flex', flexDirection: 'column' }}>
                       <strong>{b.name}</strong>
                       <div style={{ display: 'flex', gap: '5px', marginTop: '4px' }}>
                         <span className="badge" style={{ fontSize: '10px' }}>v{b.version}</span>
                         {b.isActive ? 
                           <span className="badge badge-success" style={{ fontSize: '10px' }}>AKTİF</span> : 
                           <span className="badge badge-secondary" style={{ fontSize: '10px' }}>ESKİ</span>
                         }
                         {b.state === 0 && <span className="badge badge-danger" style={{ fontSize: '10px' }}>ARŞİV</span>}
                       </div>
                     </div>
                   </td>
                   <td><span className="badge" style={{background: 'var(--primary-glow)', color: 'var(--primary)'}}>{targetItemName}</span></td>
                   <td>{b.description || '-'}</td>
                   <td>{b.items?.length || 0} Kalem</td>
                    <td style={{ display: 'flex', gap: '5px' }}>
                      <button className="btn-icon" title="Düzenle (Sadece Başlık)" onClick={() => handleEdit(b)}>
                        <FiEdit2 size={16} />
                      </button>
                      <button className="btn-icon" title="Klonla / Yeni Versiyon" style={{ color: 'var(--primary)' }} onClick={() => handleClone(b)}>
                        <FiCopy size={16} />
                      </button>
                      <button className="btn-icon" title={b.state === 1 ? 'Arşivle' : 'Aktif Et'} style={{ color: b.state === 1 ? 'var(--error)' : 'var(--success)' }} onClick={() => toggleState(b.id, b.state)}>
                        {b.state === 1 ? <FiArchive size={16} /> : <FiRefreshCw size={16} />}
                      </button>
                   </td>
                 </tr>
               )
            })}
            {boms.length === 0 && !loading && <tr><td colSpan={5} style={{textAlign:'center', padding: '30px'}}>Reçete kaydı bulunmuyor.</td></tr>}
            {loading && <tr><td colSpan={5} style={{textAlign:'center', padding: '30px'}}><div className="spinner" style={{margin:'0 auto'}}></div></td></tr>}
          </tbody>
        </table>
        <PaginationControls 
          meta={paginationMeta} 
          onPageChange={setPage} 
          onLimitChange={setLimit} 
          loading={loading}
        />
      </div>

      {isModalOpen && (
        <div className="loader-overlay" style={{ alignItems: 'flex-start', paddingTop: '3%', overflowY: 'auto' }}>
          <div className="login-box" style={{ maxWidth: '850px', width: '100%', marginBottom: '5%', position: 'relative' }}>
            <button className="btn-icon circle" style={{ position: 'absolute', top: '15px', right: '15px' }} onClick={() => setIsModalOpen(false)}><FiX size={20}/></button>
            <h3 style={{ marginBottom: '20px', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              {editingId ? 'Reçeteyi Güncelle' : 'Yeni Reçete (BOM) Şablonu'}
            </h3>
            
            <form onSubmit={handleSubmit} className="login-form">
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr', gap: '15px' }}>
                 <div className="form-group">
                   <label>Reçete / Üretim Şablonu Adı (Zorunlu)</label>
                   <input required className="uppercase-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toLocaleUpperCase('tr-TR').replace(/[0-9]/g, '')})} placeholder="ÖR: TAM BUĞDAY ÜRETİMİ" />
                 </div>
                 
                 <div className="form-group" style={{ background: '#f8fafc', padding: '10px 15px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <label style={{color: 'var(--primary)'}}>Hedef Ürün (Üretilecek Nihai Çıktı - Opsiyonel)</label>
                    <select className="uppercase-input" style={{ appearance: 'none', background: 'white' }} value={formData.targetItemId} onChange={e => setFormData({...formData, targetItemId: e.target.value})}>
                       <option value="">-- ÇIKACAK (HEDEF) ÜRÜNÜ SEÇ (YOKSA BOŞ BIRAKIN) --</option>
                       {itemsList.map(i => <option key={i.id} value={i.id}>{i.code} - {i.name}</option>)}
                    </select>
                  </div>
              </div>

              <div className="form-group">
                <label>Genel Açıklama (Opsiyonel)</label>
                <input className="uppercase-input" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value.toLocaleUpperCase('tr-TR')})} placeholder="ÜRETİM METODU VEYA SÜRECİ HAKKINDA BİLGİ" />
              </div>

              <div style={{ marginTop: '20px', padding: '20px', background: 'var(--surface-container-low)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <div>
                    <label style={{ fontSize: '1rem', color: 'var(--primary)', fontWeight: 800 }}>Kullanılacak Alt Bileşenler</label>
                    <p style={{fontSize: '11px', color: 'gray', marginTop:'5px'}}>
                      {editingId ? 'NOT: Mevcut reçetenin malzemelerini değiştiremezsiniz. Lütfen yeni versiyon klonlayın.' : 'Üretim Emri kapatıldığında bu alt kalemler otomatik olarak stoktan düşülecektir.'}
                    </p>
                  </div>
                  {!editingId && <button type="button" className="btn btn-primary" style={{ height: '35px', padding: '0 15px' }} onClick={addBomItem}>+ Kalem Ekle</button>}
                </div>

                {formData.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: editingId ? '2.5fr 1fr 1.5fr' : '2.5fr 1fr 1.5fr auto', gap: '10px', marginBottom: '10px', alignItems: 'center', opacity: editingId ? 0.7 : 1 }}>
                    <select required disabled={!!editingId} className="uppercase-input" style={{ height: '40px', appearance: 'none', background: editingId ? 'transparent' : 'white', fontSize:'12px' }} value={item.itemId} onChange={e => updateBomItem(idx, 'itemId', Number(e.target.value))}>
                      <option value="">-- ÜRÜN SEÇ --</option>
                      {itemsList
                        .filter(i => i.id === item.itemId || !formData.items.some(fi => fi.itemId === i.id))
                        .map(i => <option key={i.id} value={i.id}>{i.code} - {i.name} ({i.quantityType?.abbreviation})</option>)}
                    </select>
                    <input type="number" required disabled={!!editingId} step="0.0001" className="uppercase-input tabular-nums" style={{ height: '40px', background: editingId ? 'transparent' : 'white' }} value={item.quantity} onChange={e => updateBomItem(idx, 'quantity', Number(e.target.value))} placeholder="MİKTAR" />
                    <input type="text" disabled={!!editingId} className="uppercase-input" style={{ height: '40px', fontSize:'12px', background: editingId ? 'transparent' : 'white' }} value={item.description} onChange={e => updateBomItem(idx, 'description', e.target.value.toLocaleUpperCase('tr-TR'))} placeholder="Açıklama (Opsiyonel)" />
                    {!editingId && <button type="button" className="btn" style={{ height: '40px', width: '40px', padding: 0, justifyContent: 'center', background: '#ffe4e6', color: 'red' }} onClick={() => removeBomItem(idx)}><FiX size={16} /></button>}
                  </div>
                ))}
                {formData.items.length === 0 && <div style={{ textAlign: 'center', color: 'var(--error)', padding: '20px', fontWeight: 800 }}>⚠️ En az bir tüketim/sarf malzemesi eklemeniz zorunludur!</div>}
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '55px' }}>{editingId ? 'DEĞİŞİKLİKLERİ KAYDET' : 'YENİ REÇETEYİ ONAYLA VE KAYDET'}</button>
                <button type="button" className="btn" style={{ flex: 0.3, background: '#e2e8f0', height: '55px' }} onClick={() => setIsModalOpen(false)}>İPTAL</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}