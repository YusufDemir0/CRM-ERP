import React, { useState, useEffect } from 'react';
import { currenciesAPI } from '../../services/api';
import { FiX, FiStar, FiEdit2 } from 'react-icons/fi';

export function CurrenciesPage() {
  const[currencies, setCurrencies] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // YENİ EKLENEN: isDefault alanı eklendi
  const [formData, setFormData] = useState({ code: '', name: '', symbol: '', exchangeRate: 1, isDefault: 0 });

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
      const payload = {
        ...formData,
        exchangeRate: Number(formData.exchangeRate),
        isDefault: Number(formData.isDefault) // Checkbox değerini int (0/1) olarak aktarıyoruz
      };
      if (editingId) await currenciesAPI.update(editingId, payload);
      else await currenciesAPI.create(payload);
      setIsModalOpen(false);
      fetchData();
    } catch (error) { console.error(error); }
  };

  const handleEdit = (c: any) => {
    setEditingId(c.id);
    setFormData({ code: c.code, name: c.name, symbol: c.symbol, exchangeRate: Number(c.exchangeRate), isDefault: c.isDefault || 0 });
    setIsModalOpen(true);
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: 'var(--primary)' }}>Para Birimleri & Kurlar</h2>
        <button className="btn btn-primary" onClick={() => { setEditingId(null); setFormData({ code: '', name: '', symbol: '', exchangeRate: 1, isDefault: 0 }); setIsModalOpen(true); }}>+ YENİ BİRİM</button>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr><th>KOD</th><th>AD</th><th>SEMBOL</th><th>GÜNCEL KUR (1 Birim)</th><th>İŞLEMLER</th></tr>
          </thead>
          <tbody>
            {currencies.map((c) => (
              <tr key={c.id}>
                <td>
                  <strong>{c.code}</strong> 
                  {c.isDefault === 1 && <span className="badge badge-success" style={{marginLeft:'8px', display:'inline-flex', alignItems:'center', gap:'3px'}}><FiStar /> SİSTEM ANA BİRİMİ</span>}
                </td>
                <td>{c.name}</td>
                <td><span className="badge">{c.symbol}</span></td>
                <td className="tabular-nums" style={{ fontWeight: 800 }}>{Number(c.exchangeRate).toFixed(4)} ₺</td>
                <td>
                  <button className="btn-icon" title="Düzenle" onClick={() => handleEdit(c)}>
                    <FiEdit2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="loader-overlay" style={{ alignItems: 'flex-start', paddingTop: '5%' }}>
          <div className="login-box" style={{ maxWidth: '500px', width: '100%', position: 'relative' }}>
            <button className="btn-icon circle" style={{ position: 'absolute', top: '15px', right: '15px' }} onClick={() => setIsModalOpen(false)}><FiX size={20}/></button>
            <h3 style={{ marginBottom: '20px', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>{editingId ? 'Para Birimi Güncelle' : 'Yeni Para Birimi'}</h3>
            <form onSubmit={handleSubmit} className="login-form">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group"><label>Para Kodu (Zorunlu)</label><input required className="uppercase-input" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toLocaleUpperCase('tr-TR')})} placeholder="USD" /></div>
                <div className="form-group"><label>Sembol (Zorunlu)</label><input required className="uppercase-input" value={formData.symbol} onChange={e => setFormData({...formData, symbol: e.target.value})} placeholder="$" /></div>
              </div>
              <div className="form-group"><label>Para Birimi Adı</label><input required className="uppercase-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toLocaleUpperCase('tr-TR')})} placeholder="AMERİKAN DOLARI" /></div>
              <div className="form-group"><label>Sistem Kur Değeri (1 Birim = X TL)</label><input type="number" step="0.0001" required className="uppercase-input tabular-nums" style={{ color: 'var(--success)', fontWeight: 800, fontSize: '1.2rem' }} value={formData.exchangeRate} onChange={e => setFormData({...formData, exchangeRate: Number(e.target.value)})} disabled={formData.isDefault === 1} /></div>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer', background: 'var(--surface-container-highest)', padding: '15px', borderRadius: '12px' }}>
                 <input type="checkbox" checked={formData.isDefault === 1} onChange={e => setFormData({...formData, isDefault: e.target.checked ? 1 : 0, exchangeRate: e.target.checked ? 1 : formData.exchangeRate})} style={{ transform: 'scale(1.2)' }} />
                 <strong>Bunu Sistem Ana Para Birimi (Default) Olarak Ayarla</strong>
              </label>

              <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '50px' }}>{editingId ? 'GÜNCELLE' : 'KAYDET'}</button>
                <button type="button" className="btn" style={{ flex: 0.5, background: '#e2e8f0', height: '50px' }} onClick={() => setIsModalOpen(false)}>İPTAL</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}