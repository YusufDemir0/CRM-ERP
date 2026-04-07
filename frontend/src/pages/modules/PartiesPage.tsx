import React, { useState, useEffect } from 'react';
import { partiesAPI } from '../../services/api';

export default function PartiesPage() {
  const [parties, setParties] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const[editingId, setEditingId] = useState<number | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<'active' | 'passive' | 'all'>('active');

  const [phoneMode, setPhoneMode] = useState<'tr' | 'foreign'>('tr');

  const [formData, setFormData] = useState({
    type: 'customer',
    name: '',
    phone1: '',
    phone2: '',
    address: '',
    email: '',
    taxNumber: '',
    creditLimitPlus: 0
  });

  const fetchData = async () => {
    try {
      const res = await partiesAPI.getAll({ search: searchTerm, limit: 100 });
      setParties(res.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchTerm]);

  const filteredParties = parties.filter(p => {
    if (filterTab === 'active') return p.state === 1;
    if (filterTab === 'passive') return p.state === 0;
    return true;
  });

  // Telefon Maskeleme: TR "0 (5xx) xxx xx xx" formülü
  const formatPhone = (val: string, isTR: boolean) => {
    if (!isTR) return val.replace(/[^0-9+]/g, ''); // Sadece rakam ve + serbest
    const digits = val.replace(/\D/g, '');
    let res = '';
    if (digits.length > 0) res += '0';
    if (digits.length > 1) res += ' (' + digits.substring(1, 4);
    if (digits.length > 4) res += ') ' + digits.substring(4, 7);
    if (digits.length > 7) res += ' ' + digits.substring(7, 9);
    if (digits.length > 9) res += ' ' + digits.substring(9, 11);
    return res;
  };

  // Harf engelleyici
  const removeNumbers = (val: string) => val.replace(/[0-9]/g, '');
  const onlyNumbers = (val: string) => val.replace(/[^0-9]/g, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // TC / Vergi Boyut Kontrolü (10 veya 11 olmak zorundadır)
    if (formData.taxNumber && (formData.taxNumber.length < 10 || formData.taxNumber.length > 11)) {
       alert("TC veya Vergi Numarası 10 ya da 11 haneli rakamlardan oluşmalıdır.");
       return;
    }

    try {
      if (editingId) await partiesAPI.update(editingId, formData);
      else await partiesAPI.create(formData);
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (p: any) => {
    setEditingId(p.id);
    setPhoneMode(p.phone1?.startsWith('+') ? 'foreign' : 'tr');
    setFormData({
      type: p.type || 'customer',
      name: p.name || '',
      phone1: p.phone1 || '',
      phone2: p.phone2 || '',
      address: p.address || '',
      email: p.email || '',
      taxNumber: p.taxNumber || '',
      creditLimitPlus: Number(p.creditLimitPlus) || 0
    });
    setIsModalOpen(true);
  };

  const toggleState = async (id: number, currentState: number) => {
    if (window.confirm(currentState === 1 ? 'Firmayı/Müşteriyi arşivlemek istediğinize emin misiniz?' : 'Hesap tekrar aktif edilecektir. Onaylıyor musunuz?')) {
      await partiesAPI.toggleState(id, currentState);
      fetchData();
    }
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ color: 'var(--primary)', marginBottom: '10px' }}>Cari Yönetimi (Müşteriler & Tedarikçiler)</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className={`btn ${filterTab === 'active' ? 'btn-primary' : ''}`} onClick={() => setFilterTab('active')}>Aktif Kayıtlar</button>
            <button className={`btn ${filterTab === 'passive' ? 'btn-primary' : ''}`} onClick={() => setFilterTab('passive')}>Arşiv / Pasif</button>
            <button className={`btn ${filterTab === 'all' ? 'btn-primary' : ''}`} onClick={() => setFilterTab('all')}>Tümü</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <input 
            type="text" 
            placeholder="Ünvan, Telefon, Vergi No..." 
            className="search-bar" 
            style={{ width: '350px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="btn btn-primary" onClick={() => {
            setEditingId(null);
            setFormData({ type: 'customer', name: '', phone1: '', phone2: '', address: '', email: '', taxNumber: '', creditLimitPlus: 0 });
            setPhoneMode('tr');
            setIsModalOpen(true);
          }}>+ YENİ CARİ OLUŞTUR</button>
        </div>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Cari Tipi</th>
              <th>Ünvan / Ad-Soyad</th>
              <th>Telefon Bilgisi</th>
              <th>Güncel Bakiye</th>
              <th>Kredi (Alacak) Limiti</th>
              <th>Vergi / TCKN</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {filteredParties.map((p) => (
              <tr key={p.id} style={{ opacity: p.state === 0 ? 0.6 : 1, background: p.state === 0 ? '#f1f5f9' : 'inherit' }}>
                <td>
                  <span className="badge" style={{ background: p.type === 'customer' ? 'var(--primary-glow)' : 'var(--accent-amber-glow)', color: p.type === 'customer' ? 'var(--primary)' : 'var(--accent-amber)' }}>
                    {p.type === 'customer' ? 'MÜŞTERİ' : p.type === 'provider' ? 'TEDARİKÇİ' : 'HER İKİSİ'}
                  </span>
                </td>
                <td><strong>{p.name}</strong> {p.state === 0 && <span style={{ color: 'red', fontSize: '10px', marginLeft: '5px' }}>PASİF</span>}</td>
                <td className="tabular-nums">{p.phone1 || '-'}</td>
                <td className="tabular-nums"><strong>{Number(p.balance).toLocaleString('tr-TR')} ₺</strong></td>
                <td className="tabular-nums">{Number(p.creditLimitPlus).toLocaleString('tr-TR')} ₺</td>
                <td className="tabular-nums">{p.taxNumber || '-'}</td>
                <td>
                  <button className="btn" style={{ padding: '0 10px', height: '30px', marginRight: '5px' }} onClick={() => handleEdit(p)}>✎ Düzenle</button>
                  <button className="btn" style={{ padding: '0 10px', height: '30px', color: p.state === 1 ? 'var(--error)' : 'var(--success)' }} onClick={() => toggleState(p.id, p.state)}>
                    {p.state === 1 ? 'Arşivle' : 'Aktif Et'}
                  </button>
                </td>
              </tr>
            ))}
            {filteredParties.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center' }}>Kayıt bulunamadı.</td></tr>}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="loader-overlay" style={{ alignItems: 'flex-start', paddingTop: '3%', overflowY: 'auto' }}>
          <div className="login-box" style={{ maxWidth: '650px', width: '100%', marginBottom: '5%' }}>
            <h3 style={{ marginBottom: '20px', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              {editingId ? 'Cari Kart Güncelle' : 'Yeni Cari Hesap Kartı'}
            </h3>
            <form onSubmit={handleSubmit} className="login-form">
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Hesap Tipi (Zorunlu)</label>
                  <select required className="uppercase-input" style={{ appearance: 'none' }} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option value="customer">MÜŞTERİ</option>
                    <option value="provider">TEDARİKÇİ</option>
                    <option value="both">HER İKİSİ</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Ünvan / Ad-Soyad (Zorunlu)</label>
                  <input required className="uppercase-input" value={formData.name} onChange={e => setFormData({...formData, name: removeNumbers(e.target.value).toUpperCase()})} placeholder="RAKAM KULLANILAMAZ" />
                </div>
              </div>

              {/* Telefon Yönetimi Bölümü */}
              <div style={{ background: 'var(--surface-container-low)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: '20px', marginBottom: '15px', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 800 }}>Numara Tipi: </label>
                  <label><input type="radio" name="phoneType" checked={phoneMode === 'tr'} onChange={() => setPhoneMode('tr')} /> TR (+90)</label>
                  <label><input type="radio" name="phoneType" checked={phoneMode === 'foreign'} onChange={() => setPhoneMode('foreign')} /> Yabancı (+..)</label>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label>Telefon 1 (Zorunlu)</label>
                    <input required className="uppercase-input" value={formData.phone1} onChange={e => setFormData({...formData, phone1: formatPhone(e.target.value, phoneMode === 'tr')})} placeholder={phoneMode === 'tr' ? "0 (5XX) XXX XX XX" : "+1 555..."} />
                  </div>
                  <div className="form-group">
                    <label>Telefon 2 (İsteğe Bağlı)</label>
                    <input className="uppercase-input" value={formData.phone2} onChange={e => setFormData({...formData, phone2: formatPhone(e.target.value, phoneMode === 'tr')})} placeholder="DİĞER HAT" />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Tam Adres (Zorunlu)</label>
                <textarea required className="uppercase-input" style={{ height: '80px', padding: '10px', fontFamily: 'inherit' }} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value.toUpperCase()})} placeholder="FATURA VE TESLİMAT ADRESİ" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>E-Posta (İsteğe Bağlı)</label>
                  <input type="email" className="uppercase-input" style={{ textTransform: 'lowercase' }} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value.toLowerCase()})} placeholder="mail@ornek.com" />
                </div>
                <div className="form-group">
                  <label>TCKN / Vergi No (İsteğe Bağlı)</label>
                  <input maxLength={11} className="uppercase-input tabular-nums" value={formData.taxNumber} onChange={e => setFormData({...formData, taxNumber: onlyNumbers(e.target.value)})} placeholder="10 YA DA 11 HANE (SADECE RAKAM)" />
                </div>
              </div>

              {/* Özel Butonlu Limit Modülü */}
              <div className="form-group" style={{ background: '#fdf8f6', padding: '15px', borderRadius: '12px', border: '1px solid #fee2e2' }}>
                <label style={{ color: 'var(--error)' }}>Kredi (Alacak) Limiti</label>
                <p style={{ fontSize: '11px', color: 'gray', marginBottom: '10px' }}>Manuel giriş kapalıdır. Lütfen butonları kullanarak belirleyiniz.</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button type="button" className="btn" style={{ background: '#ffe4e6', color: 'red' }} onClick={() => setFormData(p => ({...p, creditLimitPlus: Math.max(0, p.creditLimitPlus - 10000)}))}>-10K</button>
                  <button type="button" className="btn" style={{ background: '#ffe4e6', color: 'red' }} onClick={() => setFormData(p => ({...p, creditLimitPlus: Math.max(0, p.creditLimitPlus - 1000)}))}>-1K</button>
                  
                  <div style={{ flex: 1, textAlign: 'center', fontWeight: '800', fontSize: '20px', color: 'var(--error)' }}>
                     {formData.creditLimitPlus.toLocaleString('tr-TR')} ₺
                  </div>

                  <button type="button" className="btn" style={{ background: '#d1fae5', color: 'green' }} onClick={() => setFormData(p => ({...p, creditLimitPlus: p.creditLimitPlus + 1000}))}>+1K</button>
                  <button type="button" className="btn" style={{ background: '#d1fae5', color: 'green' }} onClick={() => setFormData(p => ({...p, creditLimitPlus: p.creditLimitPlus + 10000}))}>+10K</button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '50px' }}>{editingId ? 'BİLGİLERİ GÜNCELLE' : 'CARİYİ KAYDET'}</button>
                <button type="button" className="btn" style={{ flex: 1, background: '#e2e8f0', height: '50px' }} onClick={() => setIsModalOpen(false)}>Vazgeç / İptal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}