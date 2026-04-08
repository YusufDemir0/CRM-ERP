import React, { useState, useEffect } from 'react';
import { transactionsAPI, partiesAPI, accountsAPI, salesAPI, currenciesAPI } from '../../services/api';
import { FiX, FiRefreshCcw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { confirmDialog } from '../../utils/confirmDialog';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const[accounts, setAccounts] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]); // Ödeme bağlanacak satışlar
  const [currencies, setCurrencies] = useState<any[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const[filterType, setFilterType] = useState<'all' | 'in' | 'out'>('all');

  const getLocalDateString = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };
  const[formData, setFormData] = useState({
    type: 'in', // in = Tahsilat, out = Tediye
    partyId: '',
    commercialAccountId: '',
    amount: 0,
    currencyId: '',
    date: getLocalDateString(),
    referenceType: '',
    referenceId: '',
    description: ''
  });

  const fetchData = async () => {
    try {
      const [txRes, pRes, aRes, sRes, cRes] = await Promise.all([
        transactionsAPI.getAll({ limit: 100 }),
        partiesAPI.getAll({ state: 1, limit: 200 }),
        accountsAPI.getAll({ state: 1, limit: 100 }),
        salesAPI.getAll({ status: 'approved', limit: 100 }), // Referans edilebilecek onaylı satışlar
        currenciesAPI.getAll()
      ]);
      setTransactions(txRes.data.data);
      setParties(pRes.data.data);
      setAccounts(aRes.data.data);
      setSales(sRes.data.data);
      setCurrencies(cRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => { fetchData(); },[]);

  const filteredTx = transactions.filter(t => filterType === 'all' ? true : t.type === filterType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(formData.amount <= 0) {
      toast.error("İşlem tutarı 0'dan büyük olmalıdır.");
      return;
    }
    try {
      await transactionsAPI.create({
        ...formData,
        partyId: Number(formData.partyId),
        commercialAccountId: Number(formData.commercialAccountId),
        amount: Number(formData.amount),
        currencyId: formData.currencyId ? Number(formData.currencyId) : undefined,
        referenceType: formData.referenceType || undefined,
        referenceId: formData.referenceId ? Number(formData.referenceId) : undefined
      });
      setIsModalOpen(false);
      toast.success("İşlem başarıyla kaydedildi.");
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("İşlem kaydedilirken bir hata oluştu.");
    }
  };

  // Ters Kayıt / İşlem İptali Simülasyonu
  const handleReverseTransaction = async (tx: any) => {
    if(tx.status === 'cancelled') {
      toast.error("Bu işlem zaten iptal/iade edilmiş!");
      return;
    }
    const confirmed = await confirmDialog(`DİKKAT: Hatalı işlemi düzeltmek için cari hesabın ve kasanın bakiyesini etkileyecek '${tx.type === 'in' ? 'İADE (Ters) ÇIKIŞ' : 'GERİ (Ters) GİRİŞ'}' makbuzu kesilecektir. İşleme devam edilsin mi?`, true);
    if(!confirmed) return;

    try {
      // İşlemi terse döndüren makbuz
      await transactionsAPI.create({
        type: tx.type === 'in' ? 'out' : 'in',
        partyId: tx.partyId,
        commercialAccountId: tx.commercialAccountId,
        amount: tx.amount,
        currencyId: tx.currencyId || undefined,
        referenceType: 'manual_adjustment',
        referenceId: tx.id,
        date: getLocalDateString(),
        description: `Ters Kayıt (İptal/İade): ${tx.code} numaralı işlemin nötrlenmesi.`
      });

      // API servisine manuel status güncelleme uyarısı / Backendte cancel api endpoint yok ise böyle atlıyoruz
      // Ancak görsel olarak iptal yazması için backendin eklenmesi gerekir. Burada bakiye düzenlendi bilgisini veriyoruz.
      toast.success("İşlem iptali bakiye düzenlemesi yapılarak ters makbuz olarak işlendi!");
      fetchData();
    } catch (err) {
       console.error(err);
       toast.error("İşlem iptal edilirken bir hata oluştu.");
    }
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ color: 'var(--primary)', marginBottom: '10px' }}>Kasa, Banka ve Finans Hareketleri</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className={`btn ${filterType === 'all' ? 'btn-primary' : ''}`} onClick={() => setFilterType('all')}>Tüm İşlemler</button>
            <button className={`btn ${filterType === 'in' ? 'btn-primary' : ''}`} style={{ background: filterType === 'in' ? '#10b981' : ''}} onClick={() => setFilterType('in')}>Tahsilatlar (Giriş)</button>
            <button className={`btn ${filterType === 'out' ? 'btn-primary' : ''}`} style={{ background: filterType === 'out' ? '#f59e0b' : ''}} onClick={() => setFilterType('out')}>Ödemeler (Çıkış)</button>
          </div>
        </div>
        <div>
          <button className="btn btn-primary" style={{ height: '50px' }} onClick={() => {
            setFormData({ type: 'in', partyId: '', commercialAccountId: '', amount: 0, date: getLocalDateString(), description: '', referenceType: '', referenceId: '', currencyId: currencies.find(c => c.isDefault === 1)?.id || '' });
            setIsModalOpen(true);
          }}>+ FİNANSAL İŞLEM EKLE</button>
        </div>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>İŞLEM (EVRAK) NO</th>
              <th>TARİH</th>
              <th>İŞLEM YÖNÜ</th>
              <th>CARİ / MÜŞTERİ</th>
              <th>HESAP / KASA</th>
              <th>REFERANS BELGE</th>
              <th>İŞLEM TUTARI</th>
              <th>AÇIKLAMA / NOT</th>
              <th>DÜZELTME</th>
            </tr>
          </thead>
          <tbody>
            {filteredTx.map((tx) => (
              <tr key={tx.id}>
                <td><span className="badge">{tx.code}</span></td>
                <td>{new Date(tx.date).toLocaleDateString('tr-TR')}</td>
                <td>
                  <span className="badge" style={{ background: tx.type === 'in' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: tx.type === 'in' ? '#10b981' : '#f59e0b' }}>
                    {tx.type === 'in' ? '↓ TAHSİLAT' : '↑ TEDİYE'}
                  </span>
                </td>
                <td><strong>{tx.party?.name}</strong></td>
                <td>{tx.commercialAccount?.name}</td>
                <td>{tx.referenceType === 'sale' ? `Satış: ${sales.find(s=>s.id === Number(tx.referenceId))?.code || 'Bilinmiyor'}` : tx.referenceType === 'manual_adjustment' ? `İade/Ters` : '-'}</td>
                <td className="tabular-nums" style={{ color: tx.type === 'in' ? 'var(--success)' : 'var(--error)', fontWeight: 800, fontSize: '15px' }}>
                  {tx.type === 'in' ? '+' : '-'}{Number(tx.amount).toLocaleString('tr-TR')} {tx.currency?.symbol || '₺'}
                </td>
                <td style={{ fontSize: '11px', color: 'gray' }}>{tx.description || '-'}</td>
                <td>
                   {/*TERS İŞLEM - İPTAL BUTONU */}
                   <button className="btn" style={{ padding: '5px 10px', height: '28px', color: 'var(--danger)', background: '#ffe4e6', fontSize: '10px' }} onClick={() => handleReverseTransaction(tx)}>
                     <FiRefreshCcw style={{marginRight: '5px'}}/> Ters Kayıt/İptal
                   </button>
                </td>
              </tr>
            ))}
            {filteredTx.length === 0 && <tr><td colSpan={9} style={{ textAlign: 'center' }}>İşlem kaydı bulunamadı.</td></tr>}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="loader-overlay" style={{ alignItems: 'flex-start', paddingTop: '3%', overflowY: 'auto' }}>
          <div className="login-box" style={{ maxWidth: '800px', width: '100%', marginBottom: '5%', position: 'relative' }}>
            <button className="btn-icon circle" style={{ position: 'absolute', top: '15px', right: '15px' }} onClick={() => setIsModalOpen(false)}><FiX size={20}/></button>
            <h3 style={{ marginBottom: '20px', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>Yeni Finans İşlemi</h3>
            <form onSubmit={handleSubmit} className="login-form">
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group" style={{ background: formData.type === 'in' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', padding: '15px', borderRadius: '12px' }}>
                  <label>İşlem Türü</label>
                  <select className="uppercase-input" style={{ appearance: 'none', background: 'white' }} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as 'in'|'out'})}>
                    <option value="in">MÜŞTERİDEN TAHSİLAT GİRİŞİ (+)</option>
                    <option value="out">TEDARİKÇİYE ÖDEME / GİDER (-)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>İşlem Tarihi</label>
                  <input type="date" required className="uppercase-input" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr', gap: '15px' }}>
                <div className="form-group">
                  <label>İlgili Cari / Müşteri</label>
                  <select required className="uppercase-input" style={{ appearance: 'none' }} value={formData.partyId} onChange={e => setFormData({...formData, partyId: e.target.value})}>
                    <option value="">-- MÜŞTERİ VEYA FİRMA SEÇİNİZ --</option>
                    {parties.map(p => <option key={p.id} value={p.id}>{p.name} (Bakiye: {Number(p.balance).toLocaleString()} ₺)</option>)}
                  </select>
                </div>
                
                <div className="form-group">
                   <label>Referans Belge (Bağlantı)</label>
                   <div style={{ display: 'flex', gap: '5px' }}>
                     <select className="uppercase-input" style={{ flex: 1, appearance: 'none' }} value={formData.referenceType} onChange={e => setFormData({...formData, referenceType: e.target.value, referenceId: ''})}>
                        <option value="">-- BÖZ/SERBEST İŞLEM --</option>
                        <option value="sale">SATIŞ FATURASI/SİPARİŞİ</option>
                        <option value="purchase">ALIŞ FATURASI/FİŞİ</option>
                     </select>
                     {formData.referenceType === 'sale' && (
                       <select className="uppercase-input" style={{ flex: 2, appearance: 'none' }} value={formData.referenceId} onChange={e => setFormData({...formData, referenceId: e.target.value})}>
                         <option value="">-- SATIŞ NO SEÇİN --</option>
                         {/* Eğer parti seçilmişse sadece onun siparişlerini filtreleyelim */}
                         {sales.filter(s => formData.partyId ? s.partyId === Number(formData.partyId) : true).map(s => (
                           <option key={s.id} value={s.id}>{s.code} ({Number(s.grandTotal).toLocaleString()} ₺)</option>
                         ))}
                       </select>
                     )}
                   </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>İşlemin Yapıldığı Kasa / Hesap</label>
                  <select required className="uppercase-input" style={{ appearance: 'none' }} value={formData.commercialAccountId} onChange={e => setFormData({...formData, commercialAccountId: e.target.value})}>
                    <option value="">-- HESAP SEÇİNİZ --</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                   <label>Döviz Cinsi</label>
                   <select required className="uppercase-input" style={{ appearance: 'none' }} value={formData.currencyId} onChange={e => setFormData({...formData, currencyId: e.target.value})}>
                      {currencies.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
                   </select>
                </div>
                <div className="form-group">
                  <label>İşlem Tutarı</label>
                  <input type="number" step="0.01" required className="uppercase-input tabular-nums" style={{ color: formData.type === 'in' ? 'green' : 'red', fontWeight: 900, fontSize: '1.2rem' }} value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} placeholder="0.00" />
                </div>
              </div>

              <div className="form-group">
                <label>Açıklama / Makbuz Notu</label>
                <input required className="uppercase-input" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value.toLocaleUpperCase('tr-TR')})} placeholder="ÖR: 102 Nolu Sipariş Peşinatı" />
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '55px', fontSize:'1rem' }}>ONAYLA VE BAKİYEYE İŞLE</button>
                <button type="button" className="btn" style={{ flex: 0.5, background: '#e2e8f0', height: '55px' }} onClick={() => setIsModalOpen(false)}>İPTAL</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}