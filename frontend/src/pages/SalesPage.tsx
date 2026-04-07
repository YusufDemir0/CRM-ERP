import React, { useState, useEffect } from 'react';
import { salesAPI, departmentsAPI } from '../services/api';
import SalesWizard from './modules/SalesWizard';

export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const[departments, setDepartments] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<'draft' | 'approved' | 'cancelled' | 'all'>('draft');
  const [searchTerm, setSearchTerm] = useState('');

  // Modallar
  const [approveSaleId, setApproveSaleId] = useState<number | null>(null);
  const[selectedDeptId, setSelectedDeptId] = useState('');
  const [showWizard, setShowWizard] = useState(false);

  const fetchData = async () => {
    try {
      const [sRes, dRes] = await Promise.all([
        salesAPI.getAll({ limit: 100 }), 
        departmentsAPI.getAll({ limit: 50 })
      ]);
      setSales(sRes.data.data);
      setDepartments(dRes.data.data.filter((d:any) => d.state === 1));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  },[]);

  const filteredSales = sales.filter(s => {
    if (filterStatus !== 'all' && s.status !== filterStatus) return false;
    const term = searchTerm.toLowerCase();
    return s.code?.toLowerCase().includes(term) || s.party?.name?.toLowerCase().includes(term);
  });

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeptId) return alert("Lütfen stokların düşüleceği depoyu seçin.");
    try {
      await salesAPI.approve(approveSaleId!, { departmentId: Number(selectedDeptId) });
      setApproveSaleId(null);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleCancel = async (id: number) => {
    if (window.confirm('Bu siparişi iptal etmek istediğinize emin misiniz?')) {
      try {
        await salesAPI.cancel(id);
        fetchData();
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <div className="page-container">
      {showWizard && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, background: 'var(--background)' }}>
          <button className="btn btn-primary" style={{ position: 'absolute', top: '15px', right: '3rem', zIndex: 10000, background: 'var(--danger)' }} onClick={() => setShowWizard(false)}>SİHİRBAZI KAPAT (X)</button>
          <SalesWizard />
        </div>
      )}

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ color: 'var(--primary)', marginBottom: '10px' }}>Satış ve Sipariş Yönetimi</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className={`btn ${filterStatus === 'draft' ? 'btn-primary' : ''}`} onClick={() => setFilterStatus('draft')}>Bekleyenler (Taslak)</button>
            <button className={`btn ${filterStatus === 'approved' ? 'btn-primary' : ''}`} onClick={() => setFilterStatus('approved')}>Onaylı Siparişler</button>
            <button className={`btn ${filterStatus === 'cancelled' ? 'btn-primary' : ''}`} onClick={() => setFilterStatus('cancelled')}>İptal Edilenler</button>
            <button className={`btn ${filterStatus === 'all' ? 'btn-primary' : ''}`} onClick={() => setFilterStatus('all')}>Tümü</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <input type="text" placeholder="Sipariş No, Müşteri Ara..." className="search-bar" style={{ width: '300px' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <button className="btn btn-primary" onClick={() => setShowWizard(true)}>+ YENİ SİPARİŞ OLUŞTUR</button>
        </div>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>SİPARİŞ NO</th>
              <th>TARİH</th>
              <th>MÜŞTERİ (CARİ)</th>
              <th>TUTAR (KDV DAHİL)</th>
              <th>DURUM</th>
              <th>İŞLEMLER</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.map((s) => (
              <tr key={s.id} style={{ opacity: s.status === 'cancelled' ? 0.6 : 1 }}>
                <td><span className="badge badge-accent">{s.code}</span></td>
                <td>{new Date(s.createdAt).toLocaleDateString('tr-TR')}</td>
                <td><strong>{s.party?.name}</strong></td>
                <td className="tabular-nums" style={{ fontWeight: 800 }}>{Number(s.grandTotal).toLocaleString('tr-TR')} ₺</td>
                <td>
                  <span className={`badge ${s.status === 'approved' ? 'badge-success' : s.status === 'cancelled' ? 'badge-danger' : 'badge-warning'}`}>
                    {s.status === 'approved' ? 'ONAYLI' : s.status === 'cancelled' ? 'İPTAL' : 'TASLAK'}
                  </span>
                </td>
                <td>
                  {s.status === 'draft' && (
                    <button className="btn btn-primary" style={{ padding: '0 10px', height: '30px', marginRight: '5px', fontSize: '11px' }} onClick={() => setApproveSaleId(s.id)}>✓ Onayla</button>
                  )}
                  {s.status !== 'cancelled' && (
                    <button className="btn" style={{ padding: '0 10px', height: '30px', color: 'var(--danger)', fontSize: '11px' }} onClick={() => handleCancel(s.id)}>✕ İptal</button>
                  )}
                </td>
              </tr>
            ))}
            {filteredSales.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center' }}>Kayıt bulunamadı.</td></tr>}
          </tbody>
        </table>
      </div>

      {approveSaleId && (
        <div className="loader-overlay" style={{ alignItems: 'flex-start', paddingTop: '10%' }}>
          <div className="login-box" style={{ maxWidth: '500px', width: '100%' }}>
            <h3 style={{ marginBottom: '20px', color: 'var(--success)', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>Satışı Onayla ve Stok Düş</h3>
            <p style={{ fontSize: '13px', color: 'gray', marginBottom: '20px' }}>
              Bu siparişi onayladığınızda, siparişteki kalemlerin stokları belirteceğiniz depodan otomatik düşülecektir.
            </p>
            <form onSubmit={handleApprove} className="login-form">
              <div className="form-group">
                <label>Stokların Düşüleceği Depo</label>
                <select required className="uppercase-input" style={{ appearance: 'none' }} value={selectedDeptId} onChange={e => setSelectedDeptId(e.target.value)}>
                  <option value="">-- DEPO SEÇİNİZ --</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                <button type="submit" className="btn" style={{ flex: 1, background: 'var(--success)', color: 'white', height: '50px' }}>ONAYLA VE STOK DÜŞ</button>
                <button type="button" className="btn" style={{ flex: 1, background: '#e2e8f0', height: '50px' }} onClick={() => setApproveSaleId(null)}>İPTAL</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}