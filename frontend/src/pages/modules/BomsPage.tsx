import React, { useState, useEffect } from 'react';
import { bomsAPI, itemsAPI } from '../../services/api';

export function BomsPage() {
  const[boms, setBoms] = useState<any[]>([]);
  const [itemsList, setItemsList] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: '', description: '', items: [] as { itemId: number, quantity: number, description: string }[]
  });

  const fetchData = async () => {
    try {
      const [bRes, iRes] = await Promise.all([ bomsAPI.getAll({ limit: 100 }), itemsAPI.getAll({ limit: 500, state: 1 }) ]);
      setBoms(bRes.data.data);
      setItemsList(iRes.data.data);
    } catch (error) { console.error(error); }
  };

  useEffect(() => { fetchData(); },[]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.items.length === 0) return alert("Reçeteye en az 1 ürün (hammadde) eklemelisiniz.");
    try {
      if (editingId) await bomsAPI.update(editingId, formData);
      else await bomsAPI.create(formData);
      setIsModalOpen(false);
      fetchData();
    } catch (error) { console.error(error); }
  };

  const handleEdit = (b: any) => {
    setEditingId(b.id);
    setFormData({
      name: b.name || '', description: b.description || '',
      items: b.items?.map((bi: any) => ({ itemId: bi.itemId, quantity: Number(bi.quantity), description: bi.description || '' })) ||[]
    });
    setIsModalOpen(true);
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

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: 'var(--primary)' }}>Üretim Reçeteleri (BOM)</h2>
        <button className="btn btn-primary" onClick={() => {
          setEditingId(null); setFormData({ name: '', description: '', items:[] }); setIsModalOpen(true);
        }}>+ YENİ REÇETE OLUŞTUR</button>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr><th>REÇETE ADI</th><th>AÇIKLAMA</th><th>BİLEŞEN SAYISI</th><th>İŞLEMLER</th></tr>
          </thead>
          <tbody>
            {boms.map((b) => (
              <tr key={b.id}>
                <td><strong>{b.name}</strong></td>
                <td>{b.description || '-'}</td>
                <td><span className="badge badge-accent">{b.items?.length || 0} Kalem Madde</span></td>
                <td>
                  <button className="btn" style={{ padding: '0 10px', height: '30px' }} onClick={() => handleEdit(b)}>✎ Düzenle</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="loader-overlay" style={{ alignItems: 'flex-start', paddingTop: '3%', overflowY: 'auto' }}>
          <div className="login-box" style={{ maxWidth: '800px', width: '100%', marginBottom: '5%' }}>
            <h3 style={{ marginBottom: '20px', color: 'var(--primary)' }}>{editingId ? 'Reçeteyi Güncelle' : 'Yeni Reçete (BOM) Şablonu'}</h3>
            <form onSubmit={handleSubmit} className="login-form">
              
              <div className="form-group"><label>Reçete / Şablon Adı</label><input required className="uppercase-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} placeholder="ÖR: X ÜRÜNÜ ÜRETİM ŞABLONU" /></div>
              <div className="form-group"><label>Genel Açıklama</label><input className="uppercase-input" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value.toUpperCase()})} /></div>

              <div style={{ marginTop: '20px', padding: '15px', background: 'var(--surface-container-low)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <label style={{ fontSize: '1rem', color: 'var(--primary)', fontWeight: 800 }}>Kullanılacak Hammadde / Ürünler</label>
                  <button type="button" className="btn btn-primary" style={{ height: '30px', padding: '0 15px' }} onClick={addBomItem}>+ Kalem Ekle</button>
                </div>

                {formData.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr auto', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                    <select required className="uppercase-input" style={{ height: '40px', appearance: 'none', background: 'white' }} value={item.itemId} onChange={e => updateBomItem(idx, 'itemId', Number(e.target.value))}>
                      <option value="">-- SEÇİN --</option>
                      {itemsList.map(i => <option key={i.id} value={i.id}>{i.code} - {i.name}</option>)}
                    </select>
                    <input type="number" required step="0.0001" className="uppercase-input tabular-nums" style={{ height: '40px' }} value={item.quantity} onChange={e => updateBomItem(idx, 'quantity', Number(e.target.value))} placeholder="Miktar" />
                    <input type="text" className="uppercase-input" style={{ height: '40px' }} value={item.description} onChange={e => updateBomItem(idx, 'description', e.target.value.toUpperCase())} placeholder="Not (Opsiyonel)" />
                    <button type="button" className="btn" style={{ height: '40px', width: '40px', padding: 0, justifyContent: 'center', background: '#ffe4e6', color: 'red' }} onClick={() => removeBomItem(idx)}>X</button>
                  </div>
                ))}
                {formData.items.length === 0 && <p style={{ textAlign: 'center', color: 'gray', padding: '10px' }}>Reçeteye henüz ürün eklenmedi.</p>}
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '50px' }}>KAYDET</button>
                <button type="button" className="btn" style={{ flex: 0.5, background: '#e2e8f0', height: '50px' }} onClick={() => setIsModalOpen(false)}>İPTAL</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}