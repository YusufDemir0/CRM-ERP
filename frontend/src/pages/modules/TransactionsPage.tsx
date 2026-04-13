import React, { useState, useEffect } from 'react';
import { transactionsAPI, partiesAPI, accountsAPI, salesAPI, currenciesAPI } from '../../services/api';
import { FiX, FiRefreshCcw, FiSearch } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { confirmDialog } from '../../utils/confirmDialog';
import { PaginationControls } from '../../components/common/PaginationControls';
import { getTodayString, formatDisplayDate } from '../../utils/date.helper';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]); 
  const [currencies, setCurrencies] = useState<any[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'in' | 'out'>('all');
  
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [paginationMeta, setPaginationMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });


  const [formData, setFormData] = useState({
    type: 'in', 
    partyId: '',
    commercialAccountId: '',
    amount: 0,
    date: getTodayString(),
    description: '',
    referenceType: '',
    referenceId: '',
    currencyId: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [txRes, pRes, aRes, sRes, cRes] = await Promise.all([
        transactionsAPI.getAll({ 
          page, 
          limit, 
          search: debouncedSearch,
          type: filterType === 'all' ? undefined : filterType 
        }),
        partiesAPI.getAll({ state: 1, limit: 1000 }),
        accountsAPI.getAll({ state: 1, limit: 100 }),
        salesAPI.getAll({ status: 'approved', limit: 100 }),
        currenciesAPI.getAll()
      ]);
      setTransactions(txRes.data.data);
      setPaginationMeta(txRes.data.meta);
      setParties(pRes.data.data);
      setAccounts(aRes.data.data);
      setSales(sRes.data.data);
      setCurrencies(cRes.data);
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Veriler yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => { fetchData(); }, [page, limit, debouncedSearch, filterType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.partyId || !formData.commercialAccountId || formData.amount <= 0) {
      toast.error("Lütfen tüm zorunlu alanları doldurun.");
      return;
    }
    try {
      await transactionsAPI.create({
        ...formData,
        partyId: Number(formData.partyId),
        commercialAccountId: Number(formData.commercialAccountId),
        amount: Number(formData.amount),
        currencyId: Number(formData.currencyId),
      });
      setIsModalOpen(false);
      toast.success("İşlem başarıyla kaydedildi.");
      fetchData();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "İşlem kaydedilirken bir hata oluştu.");
    }
  };

  const handleCancelTransaction = async (id: number) => {
    const confirmed = await confirmDialog("Bu işlemi iptal etmek (ters kayıt oluşturmak) istediğinize emin misiniz?", true);
    if (!confirmed) return;

    try {
      await transactionsAPI.cancel(id);
      toast.success("İşlem iptal edildi.");
      fetchData();
    } catch (err: any) {
       console.error(err);
       toast.error(err.response?.data?.message || "İşlem iptal edilirken bir hata oluştu.");
    }
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ color: 'var(--primary)', marginBottom: '10px' }}>Kasa, Banka ve Finans Hareketleri</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className={`btn ${filterType === 'all' ? 'btn-primary' : ''}`} onClick={() => { setFilterType('all'); setPage(1); }}>Tümü</button>
            <button className={`btn ${filterType === 'in' ? 'btn-primary' : ''}`} style={{ background: filterType === 'in' ? '#10b981' : ''}} onClick={() => { setFilterType('in'); setPage(1); }}>Tahsilat</button>
            <button className={`btn ${filterType === 'out' ? 'btn-primary' : ''}`} style={{ background: filterType === 'out' ? '#f59e0b' : ''}} onClick={() => { setFilterType('out'); setPage(1); }}>Ödeme</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div className="search-box" style={{ position: 'relative' }}>
            <FiSearch style={{ position: 'absolute', left: '10px', top: '12px', color: '#94a3b8' }} />
            <input placeholder="İşlem veya cari ara..." className="search-bar" style={{ paddingLeft: '35px', width: '250px' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={() => {
            setFormData({ type: 'in', partyId: '', commercialAccountId: '', amount: 0, date: getTodayString(), description: '', referenceType: '', referenceId: '', currencyId: currencies.find(c => c.isDefault === 1)?.id || '' });
            setIsModalOpen(true);
          }}>+ YENİ İŞLEM</button>
        </div>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>İŞLEM NO</th>
              <th>TARİH</th>
              <th>YÖN</th>
              <th>CARİ</th>
              <th>HESAP</th>
              <th>TUTAR</th>
              <th>DURUM</th>
              <th>İŞLEMLER</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} style={{ opacity: tx.status === 'cancelled' ? 0.5 : 1 }}>
                <td><span className="badge">{tx.code}</span></td>
                <td>{formatDisplayDate(tx.date)}</td>
                <td>
                  <span className={`badge ${tx.type === 'in' ? 'badge-success' : 'badge-warning'}`}>
                    {tx.type === 'in' ? 'GİRİŞ' : 'ÇIKIŞ'}
                  </span>
                </td>
                <td><strong>{tx.party?.name}</strong></td>
                <td>{tx.commercialAccount?.name}</td>
                <td className="tabular-nums" style={{ color: tx.type === 'in' ? 'var(--success)' : 'var(--error)', fontWeight: 800 }}>
                  {tx.type === 'in' ? '+' : '-'}{Number(tx.amount).toLocaleString('tr-TR')} {tx.currency?.symbol || '₺'}
                </td>
                <td>
                  <span className={`badge ${tx.status === 'completed' ? 'badge-outline' : 'badge-danger'}`}>
                    {tx.status === 'completed' ? 'Tamamlandı' : 'İptal'}
                  </span>
                </td>
                <td>
                   {tx.status !== 'cancelled' && (
                     <button className="btn-icon" style={{ color: 'var(--error)' }} onClick={() => handleCancelTransaction(tx.id)} title="İptal Et">
                       <FiX size={16} />
                     </button>
                   )}
                </td>
              </tr>
            ))}
            {transactions.length === 0 && !loading && (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: 'gray' }}>Kayıt bulunamadı.</td></tr>
            )}
            {loading && (
               <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '30px' }}>
                  <div className="spinner" style={{ margin: '0 auto' }}></div>
                  <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--primary)' }}>Yükleniyor...</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <PaginationControls 
          meta={paginationMeta} 
          onPageChange={setPage} 
          onLimitChange={setLimit} 
          loading={loading}
        />
      </div>

      {isModalOpen && (
        <div className="loader-overlay" style={{ alignItems: 'flex-start', paddingTop: '5%', overflowY: 'auto' }}>
          <div className="login-box" style={{ maxWidth: '600px', width: '100%', marginBottom: '5%' }}>
            <h3 style={{ marginBottom: '20px' }}>Finansal Hareket Ekle</h3>
            <form onSubmit={handleSubmit} className="login-form">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>İşlem Tipi</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option value="in">Tahsilat (Para Girişi)</option>
                    <option value="out">Ödeme (Para Çıkışı)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Tarih</label>
                  <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
              </div>

              <div className="form-group">
                <label>Cari Hesap (Müşteri/Tedarikçi)</label>
                <select required value={formData.partyId} onChange={e => setFormData({...formData, partyId: e.target.value})}>
                  <option value="">Seçiniz...</option>
                  {parties.map(p => <option key={p.id} value={p.id}>{p.name} [{Number(p.balance).toLocaleString()} {p.currency?.symbol}]</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Kasa / Banka Hesabı</label>
                <select required value={formData.commercialAccountId} onChange={e => setFormData({...formData, commercialAccountId: e.target.value})}>
                  <option value="">Seçiniz...</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.type})</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Tutar</label>
                  <input type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label>Döviz</label>
                  <select value={formData.currencyId} onChange={e => setFormData({...formData, currencyId: e.target.value})}>
                    {currencies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Açıklama</label>
                <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>KAYDET</button>
                <button type="button" className="btn" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>İPTAL</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}