import React, { useState, useEffect } from 'react';
import { transactionsAPI, partiesAPI, accountsAPI } from '../../services/api';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const[parties, setParties] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const[filterType, setFilterType] = useState<'all' | 'in' | 'out'>('all');

  const[formData, setFormData] = useState({
    type: 'in', // in = Tahsilat, out = Tediye
    partyId: '',
    commercialAccountId: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const fetchData = async () => {
    try {
      const [txRes, pRes, aRes] = await Promise.all([
        transactionsAPI.getAll({ limit: 100 }),
        partiesAPI.getAll({ state: 1, limit: 100 }), // Sadece aktifler
        accountsAPI.getAll({ limit: 100 })
      ]);
      setTransactions(txRes.data.data);
      setParties(pRes.data.data);
      setAccounts(aRes.data.data.filter((a:any) => a.state === 1)); // Aktif kasalar
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  },[]);

  const filteredTx = transactions.filter(t => filterType === 'all' ? true : t.type === filterType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(formData.amount <= 0) return alert("İşlem tutarı 0'dan büyük olmalıdır.");
    try {
      await transactionsAPI.create({
        ...formData,
        partyId: Number(formData.partyId),
        commercialAccountId: Number(formData.commercialAccountId),
        amount: Number(formData.amount)
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
          <h2 style={{ color: 'var(--primary)', marginBottom: '10px' }}>Kasa, Banka ve Finans Hareketleri</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className={`btn ${filterType === 'all' ? 'btn-primary' : ''}`} onClick={() => setFilterType('all')}>Tüm İşlemler</button>
            <button className={`btn ${filterType === 'in' ? 'btn-primary' : ''}`} style={{ background: filterType === 'in' ? '#10b981' : ''}} onClick={() => setFilterType('in')}>Tahsilatlar (Giriş)</button>
            <button className={`btn ${filterType === 'out' ? 'btn-primary' : ''}`} style={{ background: filterType === 'out' ? '#f59e0b' : ''}} onClick={() => setFilterType('out')}>Ödemeler (Çıkış)</button>
          </div>
        </div>
        <div>
          <button className="btn btn-primary" style={{ height: '50px' }} onClick={() => {
            setFormData({ type: 'in', partyId: '', commercialAccountId: '', amount: 0, date: new Date().toISOString().split('T')[0], description: '' });
            setIsModalOpen(true);
          }}>+ FİNANSAL İŞLEM (TAHSİLAT/ÖDEME) EKLE</button>
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
              <th>İŞLEM TUTARI</th>
              <th>AÇIKLAMA / NOT</th>
            </tr>
          </thead>
          <tbody>
            {filteredTx.map((tx) => (
              <tr key={tx.id}>
                <td><span className="badge">{tx.code}</span></td>
                <td>{new Date(tx.date).toLocaleDateString('tr-TR')}</td>
                <td>
                  <span className="badge" style={{ background: tx.type === 'in' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: tx.type === 'in' ? '#10b981' : '#f59e0b' }}>
                    {tx.type === 'in' ? '↓ TAHSİLAT (KASAYA GİREN)' : '↑ TEDİYE (KASADAN ÇIKAN)'}
                  </span>
                </td>
                <td><strong>{tx.party?.name}</strong></td>
                <td>{tx.commercialAccount?.name}</td>
                <td className="tabular-nums" style={{ color: tx.type === 'in' ? 'var(--success)' : 'var(--error)', fontWeight: 800, fontSize: '15px' }}>
                  {tx.type === 'in' ? '+' : '-'}{Number(tx.amount).toLocaleString('tr-TR')} ₺
                </td>
                <td style={{ fontSize: '11px', color: 'gray' }}>{tx.description || '-'}</td>
              </tr>
            ))}
            {filteredTx.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center' }}>İşlem kaydı bulunamadı.</td></tr>}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="loader-overlay" style={{ alignItems: 'flex-start', paddingTop: '5%' }}>
          <div className="login-box" style={{ maxWidth: '650px', width: '100%' }}>
            <h3 style={{ marginBottom: '20px', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>Yeni Tahsilat / Tediye İşlemi</h3>
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

              <div className="form-group">
                <label>İlgili Cari / Müşteri</label>
                <select required className="uppercase-input" style={{ appearance: 'none' }} value={formData.partyId} onChange={e => setFormData({...formData, partyId: e.target.value})}>
                  <option value="">-- MÜŞTERİ VEYA FİRMA SEÇİNİZ --</option>
                  {parties.map(p => <option key={p.id} value={p.id}>{p.name} (Bakiye: {Number(p.balance).toLocaleString()} ₺)</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Paranın Gireceği/Çıkacağı Kasa</label>
                  <select required className="uppercase-input" style={{ appearance: 'none' }} value={formData.commercialAccountId} onChange={e => setFormData({...formData, commercialAccountId: e.target.value})}>
                    <option value="">-- HESAP SEÇİNİZ --</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>İşlem Tutarı (TL)</label>
                  <input type="number" step="0.01" required className="uppercase-input tabular-nums" style={{ color: formData.type === 'in' ? 'green' : 'red', fontWeight: 800, fontSize: '1.2rem' }} value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} placeholder="0.00" />
                </div>
              </div>

              <div className="form-group">
                <label>Açıklama / Makbuz Notu</label>
                <input required className="uppercase-input" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value.toUpperCase()})} placeholder="ÖR: KASIM AYI TAKSİDİ" />
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '55px', fontSize:'1rem' }}>ONAYLA VE CARİ BAKİYEYE İŞLE</button>
                <button type="button" className="btn" style={{ flex: 0.5, background: '#e2e8f0', height: '55px' }} onClick={() => setIsModalOpen(false)}>İPTAL</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}