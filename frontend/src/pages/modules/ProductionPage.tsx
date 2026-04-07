import React, { useState, useEffect } from 'react';
import { productionOrdersAPI, bomsAPI } from '../../services/api';

export function ProductionPage() {
  const[orders, setOrders] = useState<any[]>([]);
  const [boms, setBoms] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const[editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    bomId: '', plannedQuantity: 0, startDate: '', endDate: '', notes: '', status: 'draft', producedQuantity: 0, wastageQuantity: 0
  });

  const fetchData = async () => {
    try {
      const[oRes, bRes] = await Promise.all([
        productionOrdersAPI.getAll({ limit: 100 }),
        bomsAPI.getAll({ limit: 100 })
      ]);
      setOrders(oRes.data.data);
      setBoms(bRes.data.data);
    } catch (error) { console.error(error); }
  };

  useEffect(() => { fetchData(); },[]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        bomId: Number(formData.bomId),
        plannedQuantity: Number(formData.plannedQuantity),
        producedQuantity: Number(formData.producedQuantity),
        wastageQuantity: Number(formData.wastageQuantity)
      };
      if (editingId) await productionOrdersAPI.update(editingId, payload);
      else await productionOrdersAPI.create(payload);
      setIsModalOpen(false);
      fetchData();
    } catch (error) { console.error(error); }
  };

  const handleEdit = (o: any) => {
    setEditingId(o.id);
    setFormData({
      bomId: o.bomId || '', plannedQuantity: o.plannedQuantity || 0,
      startDate: o.startDate || '', endDate: o.endDate || '', notes: o.notes || '',
      status: o.status || 'draft', producedQuantity: o.producedQuantity || 0, wastageQuantity: o.wastageQuantity || 0
    });
    setIsModalOpen(true);
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: 'var(--primary)' }}>Üretim Emirleri</h2>
        <button className="btn btn-primary" onClick={() => {
          setEditingId(null); setFormData({ bomId: '', plannedQuantity: 0, startDate: '', endDate: '', notes: '', status: 'draft', producedQuantity: 0, wastageQuantity: 0 }); setIsModalOpen(true);
        }}>+ YENİ ÜRETİM EMRİ</button>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>EMİR NO</th>
              <th>ŞABLON (BOM)</th>
              <th>PLANLANAN</th>
              <th>ÜRETİLEN</th>
              <th>DURUM</th>
              <th>İŞLEMLER</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td><span className="badge badge-accent">{o.code}</span></td>
                <td><strong>{o.bom?.name}</strong></td>
                <td className="tabular-nums">{o.plannedQuantity}</td>
                <td className="tabular-nums" style={{ color: 'var(--success)', fontWeight: 800 }}>{o.producedQuantity}</td>
                <td><span className="badge badge-outline">{o.status.toUpperCase()}</span></td>
                <td><button className="btn" style={{ padding: '0 10px', height: '30px' }} onClick={() => handleEdit(o)}>✎ Düzenle</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="loader-overlay" style={{ alignItems: 'flex-start', paddingTop: '5%' }}>
          <div className="login-box" style={{ maxWidth: '700px', width: '100%' }}>
            <h3 style={{ marginBottom: '20px', color: 'var(--primary)' }}>{editingId ? 'Üretim Emrini Güncelle' : 'Yeni Üretim Emri'}</h3>
            <form onSubmit={handleSubmit} className="login-form">
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Üretim Reçetesi (BOM)</label>
                  <select required className="uppercase-input" style={{ appearance: 'none' }} value={formData.bomId} onChange={e => setFormData({...formData, bomId: e.target.value})} disabled={!!editingId}>
                    <option value="">-- SEÇİNİZ --</option>
                    {boms.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Planlanan Üretim Miktarı</label>
                  <input type="number" required className="uppercase-input tabular-nums" value={formData.plannedQuantity} onChange={e => setFormData({...formData, plannedQuantity: Number(e.target.value)})} />
                </div>
              </div>

              {editingId && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', background: '#fdf8f6', padding: '15px', borderRadius: '12px', border: '1px solid #fee2e2' }}>
                  <div className="form-group">
                    <label>Durum</label>
                    <select className="uppercase-input" style={{ appearance: 'none' }} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                      <option value="draft">TASLAK</option><option value="planned">PLANLANDI</option><option value="in_progress">ÜRETİMDE</option><option value="completed">TAMAMLANDI</option><option value="cancelled">İPTAL</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Gerçekleşen Üretim</label>
                    <input type="number" className="uppercase-input tabular-nums" style={{ color: 'green', fontWeight: 800 }} value={formData.producedQuantity} onChange={e => setFormData({...formData, producedQuantity: Number(e.target.value)})} />
                  </div>
                  <div className="form-group">
                    <label>Fire Miktarı</label>
                    <input type="number" className="uppercase-input tabular-nums" style={{ color: 'red' }} value={formData.wastageQuantity} onChange={e => setFormData({...formData, wastageQuantity: Number(e.target.value)})} />
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group"><label>Başlangıç Tarihi</label><input type="date" className="uppercase-input" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} /></div>
                <div className="form-group"><label>Bitiş Tarihi</label><input type="date" className="uppercase-input" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} /></div>
              </div>
              <div className="form-group"><label>Notlar</label><input className="uppercase-input" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value.toUpperCase()})} /></div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
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