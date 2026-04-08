import React, { useState, useEffect } from 'react';
import { bomsAPI, itemsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { confirmDialog } from '../../utils/confirmDialog';
import { FiX, FiCheck, FiEdit2, FiArchive, FiRefreshCw } from 'react-icons/fi';

export function BomsPage() {
  const [boms, setBoms] = useState<any[]>([]);
  const [itemsList, setItemsList] = useState<any[]>([]);
  const[isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<'active' | 'passive' | 'all'>('active');

  const [formData, setFormData] = useState({
    name: '', 
    targetItemId: '', // YENİ: Reçete sonucu oluşacak Mamül
    description: '', 
    items: [] as { itemId: number, quantity: number, description: string }[]
  });

  const fetchData = async () => {
    try {
      const [bRes, iRes] = await Promise.all([ 
        bomsAPI.getAll({ limit: 500 }), 
        itemsAPI.getAll({ limit: 500, state: 1 }) // Tüm ürün listesi (mamül ve hammadde karışık, ekranda filtreleyeceğiz)
      ]);
      setBoms(bRes.data.data || bRes.data);
      setItemsList(iRes.data.data);
    } catch (error) { console.error(error); }
  };

  useEffect(() => { fetchData(); },[]);

  const filteredBoms = boms.filter(b => {
    if (filterTab === 'active') return b.state === 1;
    if (filterTab === 'passive') return b.state === 0;
    return true;
  }).filter(b => b.name?.toLowerCase().includes(searchTerm.toLowerCase()));

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
    } catch (error) { console.error(error); }
  };

  const handleEdit = (b: any) => {
    setEditingId(b.id);
    setFormData({
      name: b.name || '', 
      targetItemId: b.targetItemId || '',
      description: b.description || '',
      items: b.items?.map((bi: any) => ({ itemId: bi.itemId, quantity: Number(bi.quantity), description: bi.description || '' })) ||[]
    });
    setIsModalOpen(true);
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
          <input type="text" placeholder="Reçete Adı..." className="search-bar" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          <button className="btn btn-primary" onClick={() => {
            setEditingId(null); setFormData({ name: '', targetItemId: '', description: '', items:[] }); setIsModalOpen(true);
          }}>+ YENİ REÇETE OLUŞTUR</button>
        </div>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr><th>REÇETE ADI</th><th>ÇIKACAK (HEDEF) ÜRÜN</th><th>AÇIKLAMA</th><th>BİLEŞEN (MALZEME)</th><th>İŞLEMLER</th></tr>
          </thead>
          <tbody>
            {filteredBoms.map((b) => {
               // Arka tarafta 'targetItem' ilişkilendirilmiş ise
               const targetItemName = b.targetItem ? b.targetItem.name : (itemsList.find(i=>i.id===b.targetItemId)?.name || 'Tanımlanmadı');
               return(
                 <tr key={b.id} style={{ opacity: b.state === 0 ? 0.6 : 1, background: b.state === 0 ? '#f1f5f9' : 'inherit' }}>
                   <td><strong>{b.name}</strong> {b.state === 0 && <span className="badge badge-danger">PASİF</span>}</td>
                   <td><span className="badge" style={{background: 'var(--primary-glow)', color: 'var(--primary)'}}>{targetItemName}</span></td>
                   <td>{b.description || '-'}</td>
                   <td><span className="badge badge-accent">{b.items?.length || 0} Kalem Malzeme</span></td>
                    <td style={{ display: 'flex', gap: '5px' }}>
                      <button className="btn-icon" title="Düzenle" onClick={() => handleEdit(b)}>
                        <FiEdit2 size={16} />
                      </button>
                      <button className="btn-icon" title={b.state === 1 ? 'Arşivle' : 'Aktif Et'} style={{ color: b.state === 1 ? 'var(--error)' : 'var(--success)' }} onClick={() => toggleState(b.id, b.state)}>
                        {b.state === 1 ? <FiArchive size={16} /> : <FiRefreshCw size={16} />}
                      </button>
                   </td>
                 </tr>
               )
            })}
            {filteredBoms.length === 0 && <tr><td colSpan={5} style={{textAlign:'center'}}>Reçete kaydı bulunmuyor.</td></tr>}
          </tbody>
        </table>
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
                    <label style={{ fontSize: '1rem', color: 'var(--primary)', fontWeight: 800 }}>Kullanılacak Alt Bileşenler (Sarf Edilecek Hammadde/Yarı Mamül)</label>
                    <p style={{fontSize: '11px', color: 'gray', marginTop:'5px'}}>Üretim Emri kapatıldığında bu alt kalemler otomatik olarak stoktan düşülecektir.</p>
                  </div>
                  <button type="button" className="btn btn-primary" style={{ height: '35px', padding: '0 15px' }} onClick={addBomItem}>+ Kalem Ekle</button>
                </div>

                {formData.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1.5fr auto', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                    <select required className="uppercase-input" style={{ height: '40px', appearance: 'none', background: 'white', fontSize:'12px' }} value={item.itemId} onChange={e => updateBomItem(idx, 'itemId', Number(e.target.value))}>
                      <option value="">-- SARF EDİLECEK ÜRÜN SEÇ --</option>
                      {itemsList.map(i => <option key={i.id} value={i.id}>{i.code} - {i.name} ({i.quantityType?.abbreviation})</option>)}
                    </select>
                    <input type="number" required step="0.0001" className="uppercase-input tabular-nums" style={{ height: '40px' }} value={item.quantity} onChange={e => updateBomItem(idx, 'quantity', Number(e.target.value))} placeholder="SARF MİKTARI" />
                    <input type="text" className="uppercase-input" style={{ height: '40px', fontSize:'12px' }} value={item.description} onChange={e => updateBomItem(idx, 'description', e.target.value.toLocaleUpperCase('tr-TR'))} placeholder="Açıklama/Ölçü (Opsiyonel)" />
                    <button type="button" className="btn" style={{ height: '40px', width: '40px', padding: 0, justifyContent: 'center', background: '#ffe4e6', color: 'red' }} onClick={() => removeBomItem(idx)}><FiX size={16} /></button>
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