import React, { useState, useEffect } from 'react';
import { salesAPI, departmentsAPI } from '../services/api';
import { FiEye, FiCheck, FiX, FiXCircle, FiArrowLeft, FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { confirmDialog } from '../utils/confirmDialog';

// SalesWizard yorum satırına alındı — yerine innerView sistemi kullanılıyor
// import SalesWizard from './modules/SalesWizard';

export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<'draft' | 'approved' | 'cancelled' | 'all'>('draft');
  const [searchTerm, setSearchTerm] = useState('');

  // Modallar
  const [approveSaleId, setApproveSaleId] = useState<number | null>(null);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  // Inner page view: 'list' = ana tablo, 'new' = yeni sipariş iç sayfası, 'edit' = düzenleme
  const[innerView, setInnerView] = useState<'list' | 'new' | 'edit'>('list');
  
  // View (İnceleme) Modal State
  const [viewSaleData, setViewSaleData] = useState<any | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

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
    if (!selectedDeptId) {
      toast.error("Lütfen stokların düşüleceği depoyu seçin.");
      return;
    }
    try {
      await salesAPI.approve(approveSaleId!, { departmentId: Number(selectedDeptId) });
      setApproveSaleId(null);
      fetchData();
      toast.success("Sipariş başarıyla onaylandı.");
    } catch (error) {
      console.error(error);
      toast.error("Onaylama işlemi başarısız oldu.");
    }
  };

  const handleCancelSale = async (id: number) => {
    const confirmed = await confirmDialog('Bu siparişi iptal etmek istediğinize emin misiniz? (Taslak Sipariş iptal edilecektir)', true);
    if (confirmed) {
      try {
        await salesAPI.cancel(id);
        fetchData();
        toast.success("Sipariş iptal edildi.");
      } catch (error) {
        console.error(error);
        toast.error("İptal işlemi başarısız oldu.");
      }
    }
  };

  const openViewModal = async (id: number) => {
    try {
      const res = await salesAPI.getOne(id);
      setViewSaleData(res.data);
      setIsViewModalOpen(true);
    } catch (error) {
      console.error(error);
      toast.error("Satış detayı getirilemedi.");
    }
  };

  return (
    <div className="page-container">
      {/* ────── İNNER PAGE: YENİ SİPARİŞ ────── */}
      {innerView === 'new' && (
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '2px solid var(--border)', paddingBottom: '15px' }}>
            <button className="btn" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => { setInnerView('list'); fetchData(); }}>
              <FiArrowLeft size={18} /> Sipariş Listesine Dön
            </button>
            <h2 style={{ color: 'var(--primary)' }}>Yeni Sipariş Oluştur</h2>
          </div>
          <div style={{ 
            background: 'var(--surface-container-low)', 
            border: '2px dashed var(--border)', 
            borderRadius: '16px', 
            padding: '60px', 
            textAlign: 'center',
            color: 'var(--text-muted)'
          }}>
            <FiPlus size={48} style={{ marginBottom: '15px', opacity: 0.3 }} />
            <h3 style={{ marginBottom: '10px', fontWeight: 600 }}>Yeni sipariş oluşturma alanı burada olacak</h3>
            <p style={{ fontSize: '0.85rem' }}>Müşteri seçimi, ürün sepeti, indirim ve KDV hesaplamaları bu iç sayfada gerçekleştirilecek.</p>
          </div>
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
          <button className="btn btn-primary" onClick={() => setInnerView('new')}>+ YENİ SİPARİŞ OLUŞTUR</button>
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
                <td className="tabular-nums" style={{ fontWeight: 800 }}>{Number(s.grandTotal).toLocaleString('tr-TR')} {s.currency?.symbol || '₺'}</td>
                <td>
                  <span className={`badge ${s.status === 'approved' ? 'badge-success' : s.status === 'cancelled' ? 'badge-danger' : 'badge-warning'}`}>
                    {s.status === 'approved' ? 'ONAYLI' : s.status === 'cancelled' ? 'İPTAL' : 'TASLAK'}
                  </span>
                </td>
                <td style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                  <button className="btn-icon" title="İncele" style={{ color: 'var(--primary)' }} onClick={() => openViewModal(s.id)}>
                    <FiEye size={16} />
                  </button>
                  
                  {s.status === 'draft' && (
                    <button className="btn-icon" title="Onayla" style={{ color: 'var(--success)' }} onClick={() => setApproveSaleId(s.id)}>
                      <FiCheck size={16} />
                    </button>
                  )}
                  {s.status !== 'cancelled' && s.status === 'draft' && (
                    <button onClick={() => handleCancelSale(s.id)} className="btn" style={{ background: '#fef2f2', color: '#ef4444', padding: '6px 12px', borderColor: '#fee2e2' }}>
                      İptal Et
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filteredSales.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center' }}>Kayıt bulunamadı.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* SATIŞI ONAYLAMA (STOK DÜŞÜŞ) MODALI */}
      {approveSaleId && (
        <div className="loader-overlay" style={{ alignItems: 'flex-start', paddingTop: '10%' }}>
          <div className="login-box" style={{ maxWidth: '500px', width: '100%' }}>
            <h3 style={{ marginBottom: '20px', color: 'var(--success)', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>Satışı Onayla ve Stok Düş</h3>
            <p style={{ fontSize: '13px', color: 'gray', marginBottom: '20px' }}>
              Bu siparişi onayladığınızda, siparişteki kalemlerin stokları belirteceğiniz depodan otomatik düşülecektir. İşlem geri alınamaz.
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

      {/* YENİ EKLENEN: VIEW SALE (SATIŞ DETAY) MODAL */}
      {isViewModalOpen && viewSaleData && (
        <div className="loader-overlay" style={{ alignItems: 'flex-start', paddingTop: '5%', paddingBottom: '5%', overflowY: 'auto' }}>
          <div className="login-box" style={{ maxWidth: '900px', width: '100%', position: 'relative' }}>
            <button className="btn-icon circle" style={{ position: 'absolute', top: '15px', right: '15px' }} onClick={() => setIsViewModalOpen(false)}>
              <FiX size={20}/>
            </button>
            <h3 style={{ color: 'var(--primary)', marginBottom: '5px' }}>Sipariş İnceleme: {viewSaleData.code}</h3>
            <p style={{ fontSize: '12px', color: 'gray', marginBottom: '20px' }}>
              Tarih: {new Date(viewSaleData.createdAt).toLocaleString('tr-TR')} | 
              Durum: <strong style={{ color: viewSaleData.status==='approved'?'var(--success)':viewSaleData.status==='cancelled'?'var(--danger)':'var(--warning)' }}>{viewSaleData.status.toUpperCase()}</strong>
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div style={{ background: 'var(--surface-container-low)', padding: '15px', borderRadius: '12px' }}>
                  <h4 style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>MÜŞTERİ (CARİ) BİLGİSİ</h4>
                  <div style={{ fontWeight: 800, fontSize: '14px' }}>{viewSaleData.party?.name}</div>
                  {viewSaleData.party?.taxNumber && <div style={{ fontSize: '12px', marginTop: '5px' }}>VKN/TC: {viewSaleData.party?.taxNumber}</div>}
                  <div style={{ fontSize: '12px', marginTop: '5px' }}>Tel: {viewSaleData.party?.phone1 || '-'}</div>
                </div>
                <div style={{ background: 'var(--surface-container-low)', padding: '15px', borderRadius: '12px' }}>
                  <h4 style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>SİPARİŞ ÖZETİ</h4>
                  <div style={{ fontSize: '12px', marginBottom: '5px' }}><strong>Teslimat:</strong> {viewSaleData.deliveryDate ? new Date(viewSaleData.deliveryDate).toLocaleDateString('tr-TR') : 'Belirtilmedi'}</div>
                  <div style={{ fontSize: '12px', marginBottom: '5px' }}><strong>Satış Tipi:</strong> {viewSaleData.saleType?.name || '-'}</div>
                  <div style={{ fontSize: '12px', marginBottom: '5px' }}><strong>Para Birimi:</strong> {viewSaleData.currency?.name || 'TRY'} ({viewSaleData.currency?.symbol || '₺'})</div>
                </div>
            </div>

            {/* SEPET LİSTESİ */}
            <div style={{ overflowX: 'auto', marginBottom: '20px', border: '1px solid var(--border)', borderRadius: '12px' }}>
              <table style={{ width: '100%', fontSize: '12px', textAlign: 'left' }}>
                <thead style={{ background: 'var(--surface-container-highest)' }}>
                  <tr>
                    <th style={{ padding: '10px' }}>Ürün Adı</th>
                    <th>Birim Fiyat</th>
                    <th>Miktar</th>
                    <th>İndirim</th>
                    <th>Net Fiyat</th>
                    <th>KDV</th>
                    <th>Toplam Tutar</th>
                  </tr>
                </thead>
                <tbody>
                  {viewSaleData.items?.map((item: any) => (
                    <tr key={item.itemId} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px', fontWeight: 600 }}>{item.item?.name} <br/><span style={{fontSize: '10px', color: 'gray', fontWeight: 'normal'}}>{item.item?.code}</span></td>
                      <td className="tabular-nums">{Number(item.price).toLocaleString('tr-TR')} {viewSaleData.currency?.symbol || '₺'}</td>
                      <td className="tabular-nums"><strong>{item.quantity}</strong></td>
                      <td className="tabular-nums" style={{ color: 'var(--error)' }}>
                        {Number(item.discountAmount) > 0 ? `-${Number(item.discountAmount)} ₺` : Number(item.discountPercent) > 0 ? `-${Number(item.discountPercent)}%` : '-'}
                      </td>
                      <td className="tabular-nums">{Number(item.netPrice).toLocaleString('tr-TR')} {viewSaleData.currency?.symbol || '₺'}</td>
                      <td className="tabular-nums">%{item.kdvRate} ({Number(item.kdvAmount).toLocaleString('tr-TR')} {viewSaleData.currency?.symbol || '₺'})</td>
                      <td className="tabular-nums" style={{ fontWeight: 800 }}>{Number(item.lineTotal).toLocaleString('tr-TR')} {viewSaleData.currency?.symbol || '₺'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* NOTLAR VE TOPLAM ÖZETİ */}
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, background: '#fdf8f6', padding: '15px', borderRadius: '12px', border: '1px dashed #fee2e2' }}>
                  <h4 style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>NOTLAR / SÖZLEŞME METNİ</h4>
                  <p style={{ fontSize: '12px', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{viewSaleData.notes || 'Not bulunmuyor.'}</p>
                </div>
                <div style={{ flex: 1, background: 'var(--surface-container)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
                    <span>Ara Toplam (Mal/Hizmet):</span>
                    <span className="tabular-nums">{Number(viewSaleData.totalAmount).toLocaleString('tr-TR')} {viewSaleData.currency?.symbol || '₺'}</span>
                  </div>
                  {Number(viewSaleData.discountAmount) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px', color: 'var(--error)' }}>
                      <span>Alt İndirim (Fatura Altı):</span>
                      <span className="tabular-nums">-{Number(viewSaleData.discountAmount).toLocaleString('tr-TR')} {viewSaleData.currency?.symbol || '₺'}</span>
                    </div>
                  )}
                  {Number(viewSaleData.discountPercent) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px', color: 'var(--error)' }}>
                      <span>Alt İndirim (Yüzde):</span>
                      <span className="tabular-nums">-%{Number(viewSaleData.discountPercent)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
                    <span>Toplam KDV:</span>
                    <span className="tabular-nums">+{Number(viewSaleData.kdv).toLocaleString('tr-TR')} {viewSaleData.currency?.symbol || '₺'}</span>
                  </div>
                  {Number(viewSaleData.deposit) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px', color: 'var(--error)' }}>
                      <span>Kapora / Ön Ödeme:</span>
                      <span className="tabular-nums">-{Number(viewSaleData.deposit).toLocaleString('tr-TR')} {viewSaleData.currency?.symbol || '₺'}</span>
                    </div>
                  )}
                  <div style={{ height: '1px', background: 'var(--border)', margin: '10px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 900, color: 'var(--primary)' }}>
                    <span>ÖDENECEK NET TUTAR:</span>
                    <span className="tabular-nums">{(Number(viewSaleData.grandTotal) - Number(viewSaleData.deposit)).toLocaleString('tr-TR')} {viewSaleData.currency?.symbol || '₺'}</span>
                  </div>
                </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}