import React, { useState, useEffect } from 'react';
import { stocksAPI, itemsAPI, departmentsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { FiX, FiRepeat } from 'react-icons/fi';

export function StocksPage() {
  const[stocks, setStocks] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  
  const[searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'critical'>('all');
  
  // Stok Giriş Çıkış Modalı
  const[isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    itemId: '',
    departmentId: '',
    quantity: 0,
    type: 'in',
    description: ''
  });

  // Transfer Modalı (YENİ)
  const[isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferData, setTransferData] = useState({
    itemId: '',
    fromDepartmentId: '',
    toDepartmentId: '',
    quantity: 0,
    description: ''
  });

  // Stok Hareketleri İnceleme Modalı
  const[isMovementsModalOpen, setIsMovementsModalOpen] = useState(false);
  const[selectedStockForLog, setSelectedStockForLog] = useState<any>(null);
  const [movementsData, setMovementsData] = useState<any[]>([]);
  const [movementsLoading, setMovementsLoading] = useState(false);

  const fetchData = async () => {
    try {
      const[sRes, iRes, dRes] = await Promise.all([
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

  // Manuel Stok İşleme
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.quantity <= 0) {
      toast.error("Miktar 0'dan büyük olmalıdır.");
      return;
    }
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

  // Stok Transfer Gönderimi (YENİ)
  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (transferData.quantity <= 0) {
      toast.error("Miktar 0'dan büyük olmalıdır.");
      return;
    }
    if (transferData.fromDepartmentId === transferData.toDepartmentId) {
      toast.error("Çıkış yapılacak depo ile Hedef depo aynı olamaz.");
      return;
    }
    
    try {
      await stocksAPI.transfer({
        itemId: Number(transferData.itemId),
        fromDepartmentId: Number(transferData.fromDepartmentId),
        toDepartmentId: Number(transferData.toDepartmentId),
        quantity: Number(transferData.quantity),
        description: transferData.description
      });
      setIsTransferModalOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  // Geçmişi Getir
  const fetchMovements = async (stock: any) => {
    setSelectedStockForLog(stock);
    setIsMovementsModalOpen(true);
    setMovementsLoading(true);
    try {
      const res = await stocksAPI.getMovements(stock.id, { limit: 50 });
      setMovementsData(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setMovementsLoading(false);
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
          <input type="text" placeholder="Ürün Kodu, Adı..." className="search-bar" style={{ width: '250px' }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          <button className="btn" style={{ background: 'var(--warning)', color: 'white', fontWeight: 800 }} onClick={() => {
            setTransferData({ itemId: '', fromDepartmentId: '', toDepartmentId: '', quantity: 0, description: '' });
            setIsTransferModalOpen(true);
          }}>
            <FiRepeat style={{ marginRight: '5px' }}/> TRANSFER / SEVK
          </button>
          <button className="btn btn-primary" onClick={() => {
            setFormData({ itemId: '', departmentId: '', quantity: 0, type: 'in', description: '' });
            setIsModalOpen(true);
          }}>+ MANUEL FİŞ EKLE</button>
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
              <th>İŞLEMLER</th>
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
                  <td>
                     <button className="btn" style={{ background: 'var(--surface-container-highest)', color: 'var(--primary)', padding: '5px 10px', height: '30px', fontSize: '11px' }} onClick={() => fetchMovements(s)}>
                        👁 Hareketleri İzle
                     </button>
                  </td>
                </tr>
              );
            })}
            {filteredStocks.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center' }}>Stok kaydı bulunamadı.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* MANUEL STOK FİŞİ MODALI */}
      {isModalOpen && (
        <div className="loader-overlay" style={{ alignItems: 'flex-start', paddingTop: '5%' }}>
          <div className="login-box" style={{ maxWidth: '600px', width: '100%', position: 'relative' }}>
            <button className="btn-icon circle" style={{ position: 'absolute', top: '15px', right: '15px' }} onClick={() => setIsModalOpen(false)}><FiX size={20}/></button>
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
                <input type="number" step="0.0001" required className="uppercase-input tabular-nums" style={{ color: formData.type === 'in' ? 'green' : 'red', fontWeight: 800, fontSize: '1.2rem' }} value={formData.quantity} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} placeholder="0" />
              </div>
              <div className="form-group">
                <label>Açıklama / Sebep</label>
                <input required className="uppercase-input" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value.toLocaleUpperCase('tr-TR')})} placeholder="ÖR: SAYIM FAZLASI, FİRE VB." />
              </div>
              <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '50px' }}>ONAYLA VE STOĞA İŞLE</button>
                <button type="button" className="btn" style={{ flex: 0.5, background: '#e2e8f0', height: '50px' }} onClick={() => setIsModalOpen(false)}>İPTAL</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* YENİ TRANSFER / SEVK MODALI */}
      {isTransferModalOpen && (
        <div className="loader-overlay" style={{ alignItems: 'flex-start', paddingTop: '5%' }}>
          <div className="login-box" style={{ maxWidth: '650px', width: '100%', position: 'relative' }}>
            <button className="btn-icon circle" style={{ position: 'absolute', top: '15px', right: '15px' }} onClick={() => setIsTransferModalOpen(false)}><FiX size={20}/></button>
            <h3 style={{ marginBottom: '20px', color: 'var(--warning)', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}><FiRepeat style={{ marginRight: '8px' }}/>Depolar Arası Transfer</h3>
            <p style={{ fontSize: '12px', color: 'gray', marginBottom: '15px' }}>Seçili depodan ürün düşülüp (Çıkış), hedef depoya eklenecektir (Giriş).</p>
            <form onSubmit={handleTransferSubmit} className="login-form">
              <div className="form-group">
                <label>Transfer Edilecek Ürün</label>
                <select required className="uppercase-input" value={transferData.itemId} onChange={e => setTransferData({...transferData, itemId: e.target.value})}>
                  <option value="">-- ÜRÜN SEÇİNİZ --</option>
                  {items.map(i => <option key={i.id} value={i.id}>{i.code} - {i.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', background: 'var(--surface-container-highest)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div className="form-group">
                  <label style={{ color: 'var(--danger)' }}>Çıkış Deposu (Kaynak)</label>
                  <select required className="uppercase-input" value={transferData.fromDepartmentId} onChange={e => setTransferData({...transferData, fromDepartmentId: e.target.value})}>
                    <option value="">-- SEÇİNİZ --</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ color: 'var(--success)' }}>Giriş Deposu (Hedef)</label>
                  <select required className="uppercase-input" value={transferData.toDepartmentId} onChange={e => setTransferData({...transferData, toDepartmentId: e.target.value})}>
                    <option value="">-- SEÇİNİZ --</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '15px' }}>
                <label>Transfer Miktarı</label>
                <input type="number" step="0.0001" required className="uppercase-input tabular-nums" style={{ fontWeight: 800, fontSize: '1.2rem' }} value={transferData.quantity} onChange={e => setTransferData({...transferData, quantity: Number(e.target.value)})} placeholder="0" />
              </div>
              <div className="form-group">
                <label>Açıklama / Şoför - Plaka vs.</label>
                <input className="uppercase-input" value={transferData.description} onChange={e => setTransferData({...transferData, description: e.target.value.toLocaleUpperCase('tr-TR')})} placeholder="ÖR: 34 ABC 123 SEVK İRSALİYESİ" />
              </div>
              <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '50px', background: 'var(--warning)', color: 'white' }}>TRANSFERİ BAŞLAT VE ONAYLA</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stok Hareketleri İnceleme Modalı */}
      {isMovementsModalOpen && (
        <div className="loader-overlay" style={{ alignItems: 'flex-start', paddingTop: '3%' }}>
          <div className="login-box" style={{ maxWidth: '900px', width: '100%', position: 'relative' }}>
            <button className="btn-icon circle" style={{ position: 'absolute', top: '15px', right: '15px' }} onClick={() => setIsMovementsModalOpen(false)}><FiX size={20}/></button>
            <h3 style={{ color: 'var(--primary)' }}>Stok Hareket Logları</h3>
            <p style={{ fontSize: '12px', color: 'gray', marginTop: '5px', marginBottom: '15px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              <strong style={{color:'var(--on-surface)'}}>[{selectedStockForLog?.item?.code}] {selectedStockForLog?.item?.name}</strong> için ({selectedStockForLog?.department?.name}) deposundaki hareketler
            </p>

            {movementsLoading ? (
               <div style={{ padding: '30px', textAlign: 'center' }}>
                 <div className="spinner" style={{ margin: '0 auto 10px auto' }}></div>
                 Kayıtlar yükleniyor...
               </div>
            ) : (
               <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                 <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                   <thead>
                     <tr style={{ background: 'var(--surface-container-highest)', textAlign: 'left' }}>
                       <th style={{ padding: '10px', borderBottom: '1px solid var(--border)' }}>TARİH</th>
                       <th style={{ borderBottom: '1px solid var(--border)' }}>İŞLEM YÖNÜ</th>
                       <th style={{ borderBottom: '1px solid var(--border)' }}>MİKTAR</th>
                       <th style={{ borderBottom: '1px solid var(--border)' }}>ÖNCEKİ BKY.</th>
                       <th style={{ borderBottom: '1px solid var(--border)' }}>YENİ BKY.</th>
                       <th style={{ borderBottom: '1px solid var(--border)' }}>AÇIKLAMA / BAĞLANTI</th>
                     </tr>
                   </thead>
                   <tbody>
                     {movementsData.length === 0 ? (
                       <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>Geçmiş hareket kaydı bulunamadı.</td></tr>
                     ) : (
                       movementsData.map((m) => (
                         <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}>
                           <td style={{ padding: '10px' }}>{new Date(m.createdAt).toLocaleString('tr-TR')}</td>
                           <td>
                              <span style={{ fontWeight: 800, color: m.type === 'in' ? 'var(--success)' : 'var(--danger)' }}>
                                {m.type === 'in' ? '↑ GİRİŞ' : '↓ ÇIKIŞ'}
                              </span>
                           </td>
                           <td className="tabular-nums" style={{ fontWeight: 700 }}>{Number(m.quantity).toLocaleString()}</td>
                           <td className="tabular-nums" style={{ color: 'gray' }}>{Number(m.quantityBefore).toLocaleString()}</td>
                           <td className="tabular-nums" style={{ color: 'var(--primary)', fontWeight: 800 }}>{Number(m.quantityAfter).toLocaleString()}</td>
                           <td>{m.description || '-'}</td>
                         </tr>
                       ))
                     )}
                   </tbody>
                 </table>
               </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}