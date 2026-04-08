import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { accountsAPI, currenciesAPI } from '../../services/api';
import { FiEdit2, FiArchive, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { usePersistentForm } from '../../hooks/usePersistentForm';
import { navHub } from '../../utils/navHub';
import { confirmDialog } from '../../utils/confirmDialog';

export default function AccountsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Arama ve Sekme
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<'active' | 'passive' | 'all'>('active');

  const [formData, setFormData, clearFormData] = usePersistentForm('form_account_new', {
    name: '',
    bankName: '',
    iban: '',
    ibanName: '',
    currencyId: '',
    criticalLimit: 0,
    description: ''
  });

  const fetchData = async () => {
    try {
      const [accRes, curRes] = await Promise.all([
        accountsAPI.getAll({ search: searchTerm, limit: 100 }),
        currenciesAPI.getAll()
      ]);
      setAccounts(accRes.data.data);
      const curList = curRes.data;
      setCurrencies(curList);
      
      // Default currency sets only if not already set
      if (!formData.currencyId && curList.length > 0) {
        const defaultCur = curList.find((c: any) => c.isDefault === 1);
        if (defaultCur) setFormData(prev => ({ ...prev, currencyId: defaultCur.id }));
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchTerm]);

  // Handle URL actions (e.g., ?action=new)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'new') {
      setEditingId(null);
      setIsModalOpen(true);
      // Clean URL to prevent re-opening on refresh
      window.history.replaceState({}, '', location.pathname);
    }
  }, [location]);

  const filteredAccounts = accounts.filter(acc => {
    if (filterTab === 'active') return acc.state === 1;
    if (filterTab === 'passive') return acc.state === 0;
    return true;
  });

  const formatIban = (val: string) => {
    // Sadece harf ve rakamları al, büyük harf yap
    let raw = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    
    // TR yoksa ekle, gerisini sadece rakam yap
    if (!raw.startsWith('TR')) raw = 'TR' + raw.replace(/[^0-9]/g, '');
    else raw = 'TR' + raw.substring(2).replace(/[^0-9]/g, '');

    // 4'erli bloklara böl (Örn: TR00 0000 0000 0000...)
    let res = '';
    for(let i = 0; i < raw.length; i++){
      if (i > 0 && i % 4 === 0) res += ' ';
      res += raw[i];
    }
    return res.substring(0, 32); // Max limit
  };

  const removeNumbers = (val: string) => val.replace(/[0-9]/g, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validasyonlar: IBAN length kontrolü
    const rawIban = formData.iban.replace(/\s/g, '');
    if (rawIban.length > 0 && rawIban.length !== 26) {
      toast.error("IBAN eksik veya fazla girilmiş. TR + 24 rakam olmalıdır.");
      return;
    }

    try {
      if (editingId) await accountsAPI.update(editingId, formData);
      else await accountsAPI.create(formData);
      setIsModalOpen(false);
      setEditingId(null);
      clearFormData();
      fetchData(); 

      // -- AUTO-RETURN LOGIC --
      const returnPath = navHub.getReturnPath();
      if (returnPath) {
        navigate(returnPath);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (acc: any) => {
    setEditingId(acc.id);
    setFormData({
      name: acc.name || '',
      bankName: acc.bankName || '',
      iban: acc.iban || '',
      ibanName: acc.ibanName || '',
      currencyId: acc.currencyId || '',
      criticalLimit: Number(acc.criticalLimit) || 0,
      description: acc.description || ''
    });
    setIsModalOpen(true);
  };

  const toggleState = async (id: number, currentState: number) => {
    const confirmed = await confirmDialog(currentState === 1 ? 'Hesap pasife alınacak (arşivlenecek). Emin misiniz?' : 'Hesap tekrar aktifleştirilecek. Emin misiniz?', currentState === 1);
    if (confirmed) {
      await accountsAPI.toggleState(id, currentState);
      fetchData();
    }
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ color: 'var(--primary)', marginBottom: '10px' }}>Ticari Hesaplar (Kasa/Banka)</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className={`btn ${filterTab === 'active' ? 'btn-primary' : ''}`} onClick={() => setFilterTab('active')}>Aktifler</button>
            <button className={`btn ${filterTab === 'passive' ? 'btn-primary' : ''}`} onClick={() => setFilterTab('passive')}>Arşiv</button>
            <button className={`btn ${filterTab === 'all' ? 'btn-primary' : ''}`} onClick={() => setFilterTab('all')}>Tümü</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <input 
            type="text" 
            placeholder="Kasa veya Banka Ara..." 
            className="search-bar" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="btn btn-primary" onClick={() => {
            setEditingId(null);
            setIsModalOpen(true);
          }}>+ YENİ HESAP</button>
        </div>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>HESAP ADI</th>
              <th>BANKA BİLGİSİ</th>
              <th>IBAN</th>
              <th>KRİTİK LİMİT</th>
              <th>AÇIKLAMA</th>
              <th>İŞLEMLER</th>
            </tr>
          </thead>
          <tbody>
            {filteredAccounts.map((acc) => (
              <tr key={acc.id} style={{ opacity: acc.state === 0 ? 0.6 : 1 }}>
                <td><strong>{acc.name}</strong> {acc.state === 0 && <span className="badge" style={{ background: '#e2e8f0' }}>PASİF</span>}</td>
                <td>{acc.bankName}</td>
                <td className="tabular-nums">{acc.iban || '-'}</td>
                <td className="tabular-nums" style={{ color: acc.criticalLimit < 0 ? 'red' : 'inherit' }}>
                  {Number(acc.criticalLimit).toLocaleString('tr-TR')} {acc.currency?.symbol || '₺'}
                </td>
                <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{acc.description}</td>
                <td style={{ display: 'flex', gap: '5px' }}>
                  <button className="btn-icon" title="Düzenle" onClick={() => handleEdit(acc)}>
                    <FiEdit2 size={16} />
                  </button>
                  <button className="btn-icon" title={acc.state === 1 ? 'Arşivle' : 'Aktif Et'} style={{ color: acc.state === 1 ? 'var(--error)' : 'var(--success)' }} onClick={() => toggleState(acc.id, acc.state)}>
                    {acc.state === 1 ? <FiArchive size={16} /> : <FiRefreshCw size={16} />}
                  </button>
                </td>
              </tr>
            ))}
            {filteredAccounts.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center' }}>Kayıt bulunamadı.</td></tr>}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="loader-overlay" style={{ alignItems: 'flex-start', paddingTop: '5%' }}>
          <div className="login-box" style={{ maxWidth: '600px', width: '100%' }}>
            <h3 style={{ marginBottom: '20px', color: 'var(--primary)' }}>{editingId ? 'Hesap Güncelle' : 'Yeni Hesap Ekle'}</h3>
            <form onSubmit={handleSubmit} className="login-form">
              
              <div className="form-group">
                <label>Hesap Adı (Zorunlu)</label>
                <input required className="uppercase-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.replace(/[0-9]/g, '').toLocaleUpperCase('tr-TR')})} placeholder="ÖR: MERKEZ NAKİT KASA" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Banka Adı</label>
                  <input className="uppercase-input" value={formData.bankName} onChange={e => setFormData({...formData, bankName: e.target.value.replace(/[0-9]/g, '').toLocaleUpperCase('tr-TR')})} placeholder="ÖR: ZİRAAT BANKASI" />
                </div>
                <div className="form-group">
                  <label>Para Birimi</label>
                  <select required className="uppercase-input" value={formData.currencyId} onChange={e => setFormData({...formData, currencyId: e.target.value})}>
                    {currencies.map(c => <option key={c.id} value={c.id}>{c.code} ({c.symbol})</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>IBAN Bilgisi</label>
                <input className="uppercase-input" value={formData.iban} onChange={e => setFormData({...formData, iban: formatIban(e.target.value)})} placeholder="TR00 0000 0000 0000 0000 0000 00" />
              </div>

              <div className="form-group">
                <label>IBAN Sahibi Ad-Soyad</label>
                <input className="uppercase-input" value={formData.ibanName} onChange={e => setFormData({...formData, ibanName: e.target.value.replace(/[0-9]/g, '').toLocaleUpperCase('tr-TR')})} placeholder="AD SOYAD" />
              </div>

              <div className="form-group">
                <label>Kritik Bakiye / Eksi Limit Tutarı</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button type="button" className="btn" style={{ background: '#f1f5f9' }} onClick={() => setFormData(p => ({...p, criticalLimit: p.criticalLimit - 10000}))}>-10K</button>
                  <button type="button" className="btn" style={{ background: '#f1f5f9' }} onClick={() => setFormData(p => ({...p, criticalLimit: p.criticalLimit - 1000}))}>-1K</button>
                  
                  <div style={{ flex: 1, textAlign: 'center', fontWeight: '800', fontSize: '18px', padding: '10px', border: '2px dashed var(--border)', borderRadius: '12px' }}>
                     {formData.criticalLimit.toLocaleString('tr-TR')} TL
                  </div>

                  <button type="button" className="btn" style={{ background: '#f1f5f9' }} onClick={() => setFormData(p => ({...p, criticalLimit: p.criticalLimit + 1000}))}>+1K</button>
                  <button type="button" className="btn" style={{ background: '#f1f5f9' }} onClick={() => setFormData(p => ({...p, criticalLimit: p.criticalLimit + 10000}))}>+10K</button>
                </div>
              </div>

              <div className="form-group">
                <label>Kısa Açıklama</label>
                <input className="uppercase-input" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value.toLocaleUpperCase('tr-TR')})} placeholder="..." />
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingId ? 'GÜNCELLE' : 'KAYDET'}</button>
                <button type="button" className="btn" style={{ flex: 1, background: '#e2e8f0' }} onClick={() => {
                  setIsModalOpen(false);
                  const returnPath = navHub.getReturnPath();
                  if (returnPath) {
                    navigate(returnPath);
                  }
                }}>İPTAL</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}