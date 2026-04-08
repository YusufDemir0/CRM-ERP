import React, { useState, useEffect } from 'react';
import { productionOrdersAPI, bomsAPI, departmentsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { FiX, FiTool } from 'react-icons/fi';

export function ProductionPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const[boms, setBoms] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const[editingId, setEditingId] = useState<number | null>(null);

  const getLocalDateString = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    bomId: '', 
    plannedQuantity: 0, 
    startDate: getLocalDateString(), 
    endDate: '', 
    notes: '', 
    status: 'draft', 
    producedQuantity: 0, 
    wastageQuantity: 0,
    sourceDepartmentId: '', // Hammaddenin Düşüleceği Yer (Out)
    targetDepartmentId: ''  // Ürünün Gireceği Yer (In)
  });

  const fetchData = async () => {
    try {
      const[oRes, bRes, dRes] = await Promise.all([
        productionOrdersAPI.getAll({ limit: 200 }),
        bomsAPI.getAll({ limit: 100, state: 1 }), // Sadece aktif Reçeteler üzerinden sipariş açılabilir
        departmentsAPI.getAll({ limit: 100, state: 1 })
      ]);
      setOrders(oRes.data.data || oRes.data);
      setBoms(bRes.data.data || bRes.data);
      setDepartments(dRes.data.data || dRes.data);
    } catch (error) { console.error(error); }
  };

  useEffect(() => { fetchData(); },[]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Eğen üretime Onay/Tamamlandı (Completed) basıyorsan Depolar girilmeli
    const currentOrder = orders.find(o => o.id === editingId);
    if ((!currentOrder || currentOrder.status !== 'completed') && formData.status === 'completed') {
       if(!formData.sourceDepartmentId || !formData.targetDepartmentId) {
         toast.error("Üretimi TAMAMLA işlemini bitirmek için Stok Düşüşü (Kaynak) ve Hedef Giriş depolarını seçmelisiniz.", { duration: 5000 });
         return;
       }
       if (formData.producedQuantity <= 0) {
         toast.error("Üretilen Miktar sıfır (0) olarak Üretim Emri tamamlanamaz!", { duration: 4000 });
         return;
       }
    }

    try {
      const payload = {
        ...formData,
        bomId: Number(formData.bomId),
        plannedQuantity: Number(formData.plannedQuantity),
        producedQuantity: Number(formData.producedQuantity),
        wastageQuantity: Number(formData.wastageQuantity),
        // EĞER SİSTEM BU İKİSİNİ ALIP TRANSACTION YAPMAYA HAZIR İSE FRONTEND GÖNDERİR:
        sourceDepartmentId: formData.sourceDepartmentId ? Number(formData.sourceDepartmentId) : undefined,
        targetDepartmentId: formData.targetDepartmentId ? Number(formData.targetDepartmentId) : undefined
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
      bomId: o.bomId || '', 
      plannedQuantity: o.plannedQuantity || 0,
      startDate: o.startDate || getLocalDateString(), 
      endDate: o.endDate || '', 
      notes: o.notes || '',
      status: o.status || 'draft', 
      producedQuantity: o.producedQuantity || 0, 
      wastageQuantity: o.wastageQuantity || 0,
      sourceDepartmentId: '',
      targetDepartmentId: ''
    });
    setIsModalOpen(true);
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
           <h2 style={{ color: 'var(--primary)' }}>Üretim Emirleri & Planlama</h2>
           <p style={{color: 'gray', fontSize: '13px', marginTop:'5px'}}>Sistemdeki iş emirlerini yönetir ve Depolardaki girdi/çıktıları yönlendirir.</p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          setEditingId(null); 
          setFormData({ bomId: '', plannedQuantity: 0, startDate: getLocalDateString(), endDate: '', notes: '', status: 'draft', producedQuantity: 0, wastageQuantity: 0, sourceDepartmentId:'', targetDepartmentId:'' }); 
          setIsModalOpen(true);
        }}>+ YENİ İŞ (ÜRETİM) EMRİ OLUŞTUR</button>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>İŞ EMRİ KODU</th>
              <th>ŞABLON (BOM) / ÜRETİLECEK ÜRÜN</th>
              <th>TARİH / VADE</th>
              <th>PLANLANAN</th>
              <th>ÜRETİLEN (GERÇEK)</th>
              <th>EMİR DURUMU</th>
              <th>DÜZENLE & KAPAT</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} style={{opacity: o.status === 'cancelled' ? 0.6 : 1}}>
                <td><span className="badge">{o.code}</span></td>
                <td>
                   <strong>{o.bom?.name}</strong>
                   <div style={{fontSize:'10px', color:'gray'}}>Reçete ID: {o.bomId}</div>
                </td>
                <td className="tabular-nums" style={{fontSize:'11px'}}>Başlangıç: {o.startDate ? new Date(o.startDate).toLocaleDateString('tr') : '-'}<br/>Hedef Bitiş: {o.endDate ? new Date(o.endDate).toLocaleDateString('tr') : '-'}</td>
                <td className="tabular-nums"><strong>{o.plannedQuantity}</strong> Adet</td>
                <td className="tabular-nums" style={{ color: o.producedQuantity > 0 ? 'var(--success)' : 'inherit', fontWeight: 800 }}>{o.producedQuantity} Adet</td>
                <td>
                   <span className={`badge ${o.status === 'completed' ? 'badge-success' : o.status === 'in_progress' ? 'badge-accent' : o.status === 'cancelled' ? 'badge-danger' : 'badge-outline'}`}>
                      {o.status.toUpperCase()}
                   </span>
                </td>
                <td>
                  {o.status !== 'completed' && o.status !== 'cancelled' ? (
                     <button className="btn" style={{ padding: '0 10px', height: '30px' }} onClick={() => handleEdit(o)}><FiTool style={{marginRight:'5px'}}/> İlerlet / Tamamla</button>
                  ) : (
                     <button className="btn" style={{ padding: '0 10px', height: '30px', color: 'gray' }} disabled>Kilitli / Kapalı</button>
                  )}
                </td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan={7} style={{textAlign:'center'}}>Üretim Emri bulunmuyor.</td></tr>}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="loader-overlay" style={{ alignItems: 'flex-start', paddingTop: '3%', overflowY:'auto' }}>
          <div className="login-box" style={{ maxWidth: '800px', width: '100%', marginBottom: '5%', position: 'relative' }}>
             <button className="btn-icon circle" style={{ position: 'absolute', top: '15px', right: '15px' }} onClick={() => setIsModalOpen(false)}><FiX size={20}/></button>
             <h3 style={{ marginBottom: '20px', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                {editingId ? `İş Emrini Düzenle & İlerlet` : 'Yeni Üretim Emri Aç'}
             </h3>

            <form onSubmit={handleSubmit} className="login-form">
              
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Uygulanacak Üretim Reçetesi (BOM)</label>
                  <select required className="uppercase-input" style={{ appearance: 'none', background:'white' }} value={formData.bomId} onChange={e => setFormData({...formData, bomId: e.target.value})} disabled={!!editingId}>
                    <option value="">-- LİSTEDEN SEÇİNİZ --</option>
                    {boms.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Hedeflenen / İstenen Üretim</label>
                  <input type="number" required className="uppercase-input tabular-nums" style={{fontSize: '18px', fontWeight: 800, color: 'var(--primary)'}} value={formData.plannedQuantity} onChange={e => setFormData({...formData, plannedQuantity: Number(e.target.value)})} />
                </div>
              </div>

              {editingId && (
                <div style={{ display: 'flex', flexDirection:'column', gap: '15px', background: formData.status === 'completed' ? '#ecfdf5' : '#fdf8f6', padding: '20px', borderRadius: '12px', border: formData.status === 'completed' ? '1px solid #10b981' : '1px dashed #f59e0b', marginTop:'15px' }}>
                  <h4 style={{fontSize:'12px', color: formData.status==='completed'?'var(--success)':'var(--warning)'}}>ÜRETİM SAHASI BİLGİ GİRİŞİ (GERÇEKLEŞENLER)</h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '15px' }}>
                    <div className="form-group">
                      <label>Emir Durumu Güncelle</label>
                      <select className="uppercase-input" style={{ appearance: 'none', background: 'white' }} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                        <option value="draft">Tasarım / Taslak</option><option value="planned">Sıraya Alındı (Planlandı)</option><option value="in_progress">Üretime Başlandı (Aktif)</option><option value="completed">Üretim Tamamlandı & Kapat</option><option value="cancelled">Emri İptal Et</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Toplam Çıkan Ürün</label>
                      <input type="number" className="uppercase-input tabular-nums" style={{ color: 'var(--success)', fontWeight: 900 }} value={formData.producedQuantity} onChange={e => setFormData({...formData, producedQuantity: Number(e.target.value)})} />
                    </div>
                    <div className="form-group">
                      <label>Oluşan Fire / Çöp</label>
                      <input type="number" className="uppercase-input tabular-nums" style={{ color: 'red', fontWeight: 900 }} value={formData.wastageQuantity} onChange={e => setFormData({...formData, wastageQuantity: Number(e.target.value)})} />
                    </div>
                  </div>

                  {formData.status === 'completed' && (
                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop:'10px', paddingTop: '15px', borderTop:'1px solid #d1fae5' }}>
                       <div className="form-group">
                          <label style={{color:'red'}}>Hammadde Düşüş (Sarf) Deposu*</label>
                          <select required className="uppercase-input" style={{ appearance: 'none' }} value={formData.sourceDepartmentId} onChange={e => setFormData({...formData, sourceDepartmentId: e.target.value})}>
                             <option value="">-- ÇIKIŞ DEPOSU SEÇİNİZ --</option>
                             {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                          </select>
                       </div>
                       <div className="form-group">
                          <label style={{color:'green'}}>Çıkan Mamül Eklenecek (Hedef) Depo*</label>
                          <select required className="uppercase-input" style={{ appearance: 'none' }} value={formData.targetDepartmentId} onChange={e => setFormData({...formData, targetDepartmentId: e.target.value})}>
                             <option value="">-- GİRİŞ DEPOSU SEÇİNİZ --</option>
                             {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                          </select>
                       </div>
                     </div>
                  )}

                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                <div className="form-group"><label>Üretim Emri Başlangıç</label><input type="date" required className="uppercase-input" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} /></div>
                <div className="form-group"><label>Hedeflenen Bitiş Vadesi</label><input type="date" className="uppercase-input" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} /></div>
              </div>
              <div className="form-group" style={{marginTop:'15px'}}><label>Üretim Hakkında Ekstra Not (İsteğe Bağlı)</label><input className="uppercase-input" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value.toLocaleUpperCase('tr-TR')})} placeholder="ÖRNEĞİN; USTA DEĞİŞİMİ OLDU VEYA PARTİ NO: 323" /></div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '55px', background: formData.status==='completed' ? 'var(--success)' : '' }}>
                   {formData.status === 'completed' ? 'İLERİ: STOĞA AKTAR VE BİTİR' : (editingId ? 'DEĞİŞİKLİKLERİ UYGULA' : 'YENİ İŞ EMRİNİ ONAYLA')}
                </button>
                <button type="button" className="btn" style={{ flex: 0.3, background: '#e2e8f0', height: '55px' }} onClick={() => setIsModalOpen(false)}>İPTAL</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}