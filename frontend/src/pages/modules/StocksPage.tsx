import React, { useState, useEffect } from 'react';
import { stocksAPI, itemsAPI, departmentsAPI } from '../../services/api';

export function StocksPage() {
  const [stocks, setStocks] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const[departments, setDepartments] = useState<any[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'critical'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    itemId: '',
    departmentId: '',
    quantity: 0,
    type: 'in',
    description: ''
  });

  const fetchData = async () => {
    try {
      const [sRes, iRes, dRes] = await Promise.all([
        stocksAPI.getAll({ limit: 500 }),
        itemsAPI.getAll({ state: 1, limit: 500 }),
        departmentsAPI.getAll({ state: 1, limit: 100 })
      ]);
      setStocks(sRes.data.data);
      setItems(iRes.data.data);
      setDepartments(dRes.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => { fetchData(); },[]);

  const filteredStocks = stocks.filter(s => {
    const term = searchTerm.toLowerCase();
    const match = s.item?.name?.toLowerCase().includes(term) || s.item?.code?.toLowerCase().includes(term);
    if (!match) return false;
    if (filterTab === 'critical') return Number(s.quantity) <= Number(s.item?.criticalLimit);
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.quantity <= 0) return alert("Miktar 0'dan büyük olmalıdır.");
    try {
      await stocksAPI.adjust({
        itemId: Number(formData.itemId),
        departmentId: Number(formData.departmentId),
        quantity: Number(formData.quantity),
        type: formData.type,
        description: formData.description
      });
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ color: 'var(--primary)', marginBottom: '10px' }}>Stok Durumu & Depo İzleme</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className={`btn ${filterTab === 'all' ? 'btn-primary' : ''}`} onClick={() => setFilterTab('all')}>Tüm Stoklar</button>
            <button className={`btn ${filterTab === 'critical' ? 'btn-primary' : ''}`} style={{ background: filterTab === 'critical' ? 'var(--danger)' : '' }} onClick={() => setFilterTab('critical')}>Kritik Stok Uyarıları</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <input type="text" placeholder="Ürün Kodu, Adı..." className="search-bar" style={{ width: '300px' }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          <button className="btn btn-primary" onClick={() => {
            setFormData({ itemId: '', departmentId: '', quantity: 0, type: 'in', description: '' });
            setIsModalOpen(true);
          }}>+ MANUEL STOK GİRİŞ/ÇIKIŞ</button>
        </div>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>ÜRÜN KODU</th>
              <th>ÜRÜN ADI</th>
              <th>DEPO / DEPARTMAN</th>
              <th>MEVCUT STOK</th>
              <th>BİRİM</th>
              <th>DURUM</th>
            </tr>
          </thead>
          <tbody>
            {filteredStocks.map((s) => {
              const isCritical = Number(s.quantity) <= Number(s.item?.criticalLimit) && Number(s.item?.criticalLimit) > 0;
              return (
                <tr key={s.id}>
                  <td><span className="badge badge-accent">{s.item?.code}</span></td>
                  <td><strong>{s.item?.name}</strong></td>
                  <td>{s.department?.name}</td>
                  <td className="tabular-nums" style={{ fontWeight: 800, fontSize: '15px', color: isCritical ? 'var(--danger)' : 'var(--text-primary)' }}>
                    {Number(s.quantity).toLocaleString('tr-TR')}
                  </td>
                  <td>{s.item?.quantityType?.abbreviation}</td>
                  <td>
                    {isCritical ? <span className="badge badge-danger">KRİTİK!</span> : <span className="badge badge-success">YETERLİ</span>}
                  </td>
                </tr>
              );
            })}
            {filteredStocks.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center' }}>Stok kaydı bulunamadı.</td></tr>}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="loader-overlay" style={{ alignItems: 'flex-start', paddingTop: '5%' }}>
          <div className="login-box" style={{ maxWidth: '600px', width: '100%' }}>
            <h3 style={{ marginBottom: '20px', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>Manuel Stok Fişi</h3>
            <form onSubmit={handleSubmit} className="login-form">
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>İşlem Yönü</label>
                  <select required className="uppercase-input" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option value="in">STOK GİRİŞİ (+)</option>
                    <option value="out">STOK ÇIKIŞI / FİRE (-)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Depo / Şube</label>
                  <select required className="uppercase-input" value={formData.departmentId} onChange={e => setFormData({...formData, departmentId: e.target.value})}>
                    <option value="">-- SEÇİNİZ --</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>İşlem Yapılacak Ürün</label>
                <select required className="uppercase-input" value={formData.itemId} onChange={e => setFormData({...formData, itemId: e.target.value})}>
                  <option value="">-- ÜRÜN SEÇİNİZ --</option>
                  {items.map(i => <option key={i.id} value={i.id}>{i.code} - {i.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>İşlem Miktarı</label>
                <input type="number" required className="uppercase-input tabular-nums" style={{ color: formData.type === 'in' ? 'green' : 'red', fontWeight: 800, fontSize: '1.2rem' }} value={formData.quantity} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} placeholder="0" />
              </div>

              <div className="form-group">
                <label>Açıklama / Sebep</label>
                <input required className="uppercase-input" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value.toUpperCase()})} placeholder="ÖR: SAYIM FAZLASI, FİRE VB." />
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '50px' }}>ONAYLA VE STOĞA İŞLE</button>
                <button type="button" className="btn" style={{ flex: 0.5, background: '#e2e8f0', height: '50px' }} onClick={() => setIsModalOpen(false)}>İPTAL</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
 
);
}