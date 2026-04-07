import React, { useState, useEffect } from 'react';
import { currenciesAPI } from '../../services/api';

export function CurrenciesPage() {
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ code: '', name: '', symbol: '', exchangeRate: 1 });

  const fetchData = async () => {
    try {
      const res = await currenciesAPI.getAll();
      setCurrencies(res.data);
    } catch (error) { console.error(error); }
  };

  useEffect(() => { fetchData(); },[]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) await currenciesAPI.update(editingId, { ...formData, exchangeRate: Number(formData.exchangeRate) });
      else await currenciesAPI.create({ ...formData, exchangeRate: Number(formData.exchangeRate) });
      setIsModalOpen(false);
      fetchData();
    } catch (error) { console.error(error); }
  };

  const handleEdit = (c: any) => {
    setEditingId(c.id);
    setFormData({ code: c.code, name: c.name, symbol: c.symbol, exchangeRate: Number(c.exchangeRate) });
    setIsModalOpen(true);
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: 'var(--primary)' }}>Para Birimleri & Kurlar</h2>
        <button className="btn btn-primary" onClick={() => { setEditingId(null); setFormData({ code: '', name: '', symbol: '', exchangeRate: 1 }); setIsModalOpen(true); }}>+ YENİ BİRİM</button>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr><th>KOD</th><th>AD</th><th>SEMBOL</th><th>GÜNCEL KUR</th><th>İŞLEMLER</th></tr>
          </thead>
          <tbody>
            {currencies.map((c) => (
              <tr key={c.id}>
                <td><strong>{c.code}</strong> {c.isDefault === 1 && <span className="badge badge-success" style={{marginLeft:'5px'}}>SİSTEM BİRİMİ</span>}</td>
                <td>{c.name}</td>
                <td><span className="badge">{c.symbol}</span></td>
                <td className="tabular-nums" style={{ fontWeight: 800 }}>{Number(c.exchangeRate).toFixed(4)}</td>
                <td>
                  <button className="btn" style={{ padding: '0 10px', height: '30px' }} onClick={() => handleEdit(c)}>✎ Düzenle</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="loader-overlay" style={{ alignItems: 'flex-start', paddingTop: '5%' }}>
          <div className="login-box" style={{ maxWidth: '500px', width: '100%' }}>
            <h3 style={{ marginBottom: '20px', color: 'var(--primary)' }}>{editingId ? 'Para Birimi Güncelle' : 'Yeni Para Birimi'}</h3>
            <form onSubmit={handleSubmit} className="login-form">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group"><label>Para Kodu</label><input required className="uppercase-input" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} placeholder="USD" /></div>
                <div className="form-group"><label>Sembol</label><input required className="uppercase-input" value={formData.symbol} onChange={e => setFormData({...formData, symbol: e.target.value})} placeholder="$" /></div>
              </div>
              <div className="form-group"><label>Para Birimi Adı</label><input required className="uppercase-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} placeholder="AMERİKAN DOLARI" /></div>
              <div className="form-group"><label>Sistem Kur Değeri (1 Birim = X TL)</label><input type="number" step="0.0001" required className="uppercase-input tabular-nums" style={{ color: 'var(--success)', fontWeight: 800 }} value={formData.exchangeRate} onChange={e => setFormData({...formData, exchangeRate: Number(e.target.value)})} /></div>

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