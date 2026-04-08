import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { partiesAPI, currenciesAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { FiX, FiEdit2, FiArchive, FiRefreshCw, FiSearch, FiPlus, FiMinus, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { useTurkiyeCities, useTurkiyeDistricts } from '../../hooks/useTurkiyeApi';
import { usePersistentForm } from '../../hooks/usePersistentForm';
import { confirmDialog } from '../../utils/confirmDialog';

export default function PartiesPage() {
  const [parties, setParties] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<'active' | 'passive' | 'all'>('active');
  const [phonePrefix, setPhonePrefix] = useState('+90');
  
  // Sıralama State
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });

  const [formData, setFormData, clearFormData] = usePersistentForm('form_party_new', {
    type: 'customer',
    name: '',
    phone1: '',
    phone2: '',
    cityId: 0,
    districtName: '',
    addressDetail: '',
    email: '',
    taxNumber: '',
    creditLimit: 0,
    paymentTerms: '',
    notes: '',
    currencyId: ''
  });

  const { cities } = useTurkiyeCities();
  const { districts } = useTurkiyeDistricts(formData.cityId);

  const location = useLocation();

  const fetchData = async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        partiesAPI.getAll({ limit: 1000 }),
        currenciesAPI.getAll()
      ]);
      setParties(pRes.data.data);
      setCurrencies(cRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => { 
    fetchData(); 
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'new') {
      setIsModalOpen(true);
      setEditingId(null);
      clearFormData();
      setFormData(prev => ({
        ...prev,
        currencyId: currencies.find(c => c.isDefault === 1)?.id || ''
      }));
    }
  }, [location.search]);

  // Gelişmiş Arama Filtresi (Ad, Telefon, Tip)
  const searchingParties = useMemo(() => {
    return parties.filter(p => {
      const searchLower = searchTerm.toLowerCase();
      const matchName = p.name?.toLowerCase().includes(searchLower);
      const matchPhone = p.phone1?.toLowerCase().includes(searchLower) || p.phone2?.toLowerCase().includes(searchLower);
      const typeStr = p.type === 'customer' ? 'müşteri' : p.type === 'provider' ? 'tedarikçi' : 'her ikisi';
      const matchType = typeStr.includes(searchLower);
      
      const tabMatch = filterTab === 'all' || (filterTab === 'active' ? p.state === 1 : p.state === 0);
      
      return tabMatch && (matchName || matchPhone || matchType);
    });
  }, [parties, searchTerm, filterTab]);

  // Sıralama Mantığı
  const sortedParties = useMemo(() => {
    if (!sortConfig) return searchingParties;
    return [...searchingParties].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      
      if (sortConfig.key === 'balance') {
        aValue = Number(aValue);
        bValue = Number(bValue);
      } else {
        aValue = String(aValue || '').toLocaleLowerCase('tr-TR');
        bValue = String(bValue || '').toLocaleLowerCase('tr-TR');
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [searchingParties, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const formatPhone = (val: string) => {
    // Sadece rakamları al
    let digits = val.replace(/\D/g, '');
    if (digits.length > 10) digits = digits.substring(0, 10);
    
    let res = '';
    if (digits.length > 0) res += '(' + digits.substring(0, Math.min(3, digits.length));
    if (digits.length >= 3) res += ')';
    if (digits.length > 3) res += ' ' + digits.substring(3, Math.min(6, digits.length));
    if (digits.length > 6) res += ' ' + digits.substring(6, Math.min(8, digits.length));
    if (digits.length > 8) res += ' ' + digits.substring(8, Math.min(10, digits.length));
    return res;
  };

  const removeNumbers = (val: string) => val.replace(/[0-9]/g, '');
  const onlyNumbers = (val: string) => val.replace(/[^0-9]/g, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.taxNumber && (formData.taxNumber.length < 10 || formData.taxNumber.length > 11)) {
       toast.error("TC veya Vergi Numarası 10 ya da 11 haneli olmalıdır.");
       return;
    }
    
    const cityObj = cities.find(c => c.id === formData.cityId);
    const fullAddress = (cityObj && formData.districtName) 
        ? `${cityObj.name} / ${formData.districtName}\n${formData.addressDetail}`
        : formData.addressDetail;

    const payload = {
       ...formData, 
       phone1: formData.phone1 ? `${phonePrefix} ${formData.phone1}` : '',
       phone2: formData.phone2 ? `${phonePrefix} ${formData.phone2}` : '',
       address: fullAddress,
       currencyId: formData.currencyId ? Number(formData.currencyId) : undefined,
       creditLimitPlus: Number(formData.creditLimit),
       creditLimitMinus: Number(formData.creditLimit) // Unified limit logic
    };

    try {
      if (editingId) await partiesAPI.update(editingId, payload);
      else await partiesAPI.create(payload);
      setIsModalOpen(false);
      clearFormData();
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (p: any) => {
    setEditingId(p.id);
    
    // Telefon parçalama
    let p1 = p.phone1 || '';
    if (p1.startsWith('+')) {
      const parts = p1.split(' ');
      setPhonePrefix(parts[0]);
      p1 = parts.slice(1).join(' ');
    }

    let cId = 0;
    let dName = '';
    let aDet = p.address || '';
    if (aDet.includes(' / ') && aDet.includes('\n')) {
      const firstLine = aDet.split('\n')[0];
      const parts = firstLine.split(' / ');
      const cName = parts[0];
      dName = parts[1];
      const foundCity = cities.find(c => c.name === cName);
      if (foundCity) cId = foundCity.id;
      aDet = aDet.substring(aDet.indexOf('\n') + 1);
    }

    setFormData({
      type: p.type || 'customer',
      name: p.name || '',
      phone1: p1,
      phone2: p.phone2 || '',
      cityId: cId,
      districtName: dName,
      addressDetail: aDet,
      email: p.email || '',
      taxNumber: p.taxNumber || '',
      creditLimit: Number(p.creditLimitPlus) || 0,
      paymentTerms: p.paymentTerms || '',
      notes: p.notes || '',
      currencyId: p.currencyId || currencies.find(c => c.isDefault === 1)?.id || ''
    });
    setIsModalOpen(true);
  };

  const toggleState = async (id: number, currentState: number) => {
    const party = parties.find(p => p.id === id);
    if (currentState === 1 && party) {
      const bal = Number(party.balance);
      if (bal !== 0) {
        toast.error("Bakiye 0 olmadığı için bu cari pasife alınamaz (arşivlenemez).", { duration: 5000 });
        return;
      }
    }
    const confirmed = await confirmDialog(currentState === 1 ? 'Firmayı/Müşteriyi arşivlemek istediğinize emin misiniz?' : 'Hesap tekrar aktif edilecektir. Onaylıyor musunuz?', currentState === 1);
    if (confirmed) {
      await partiesAPI.toggleState(id, currentState);
      fetchData();
    }
  };

  const sortIcon = (key: string) => {
    if (sortConfig?.key !== key) return <FiChevronDown style={{ opacity: 0.3 }} />;
    return sortConfig.direction === 'asc' ? <FiChevronUp /> : <FiChevronDown />;
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ color: 'var(--primary)', marginBottom: '10px' }}>Cari Yönetimi</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className={`btn ${filterTab === 'active' ? 'btn-primary' : ''}`} onClick={() => setFilterTab('active')}>Aktif Kayıtlar</button>
            <button className={`btn ${filterTab === 'passive' ? 'btn-primary' : ''}`} onClick={() => setFilterTab('passive')}>Arşiv</button>
            <button className={`btn ${filterTab === 'all' ? 'btn-primary' : ''}`} onClick={() => setFilterTab('all')}>Tümü</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <div className="search-container" style={{ position: 'relative' }}>
            <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input type="text" placeholder="Ad, Telefon veya Tip Ara..." className="search-bar" style={{ width: '300px', paddingLeft: '40px' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={() => {
            setEditingId(null);
            const defaultCurr = currencies.find(c => c.isDefault === 1);
            setFormData({
              type: 'customer',
              name: '',
              phone1: '',
              phone2: '',
              cityId: 0,
              districtName: '',
              addressDetail: '',
              email: '',
              taxNumber: '',
              creditLimit: 0,
              paymentTerms: '',
              notes: '',
              currencyId: defaultCurr?.id || ''
            });
            setPhonePrefix('+90');
            setIsModalOpen(true);
          }}>+ YENİ CARİ</button>
        </div>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th onClick={() => requestSort('name')} style={{ cursor: 'pointer' }}>Cari Adı {sortIcon('name')}</th>
              <th>Telefon 1</th>
              <th>Telefon 2</th>
              <th onClick={() => requestSort('balance')} style={{ cursor: 'pointer' }}>Bakiye {sortIcon('balance')}</th>
              <th onClick={() => requestSort('type')} style={{ cursor: 'pointer' }}>Cari Tipi {sortIcon('type')}</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {sortedParties.map((p) => (
              <tr key={p.id} style={{ opacity: p.state === 0 ? 0.6 : 1 }}>
                <td><strong>{p.name}</strong></td>
                <td className="tabular-nums">{p.phone1 || '-'}</td>
                <td className="tabular-nums">{p.phone2 || '-'}</td>
                <td className="tabular-nums" style={{ color: p.balance < 0 ? 'var(--error)' : 'var(--success)' }}>
                  <strong>{Number(p.balance).toLocaleString('tr-TR')} {p.currency?.symbol || '₺'}</strong>
                </td>
                <td>
                  <span className="badge" style={{ background: p.type === 'customer' ? 'var(--primary-glow)' : 'var(--accent-amber-glow)', color: p.type === 'customer' ? 'var(--primary)' : 'var(--accent-amber)' }}>
                    {p.type === 'customer' ? 'MÜŞTERİ' : p.type === 'provider' ? 'TEDARİKÇİ' : 'HEM MÜŞTERİ HEM TEDARİKÇİ'}
                  </span>
                </td>
                <td style={{ display: 'flex', gap: '5px' }}>
                  <button className="btn-icon" onClick={() => handleEdit(p)}><FiEdit2 size={16} /></button>
                  <button className="btn-icon" style={{ color: p.state === 1 ? 'var(--error)' : 'var(--success)' }} onClick={() => toggleState(p.id, p.state)}>
                    {p.state === 1 ? <FiArchive size={16} /> : <FiRefreshCw size={16} />}
                  </button>
                </td>
              </tr>
            ))}
            {sortedParties.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center' }}>Kayıt bulunamadı.</td></tr>}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="loader-overlay" style={{ alignItems: 'flex-start', paddingTop: '3%', overflowY: 'auto' }}>
          <div className="login-box" style={{ maxWidth: '800px', width: '100%', marginBottom: '5%' }}>
            <h3 style={{ marginBottom: '20px', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              {editingId ? 'Cari Kart Güncelle' : 'Yeni Cari Kaydı'}
            </h3>
            
            <form onSubmit={handleSubmit} className="login-form">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Hesap Tipi</label>
                  <select required className="uppercase-input" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option value="customer">MÜŞTERİ</option><option value="provider">TEDARİKÇİ</option><option value="both">HER İKİSİ</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Ünvan / Ad-Soyad</label>
                  <input required className="uppercase-input" value={formData.name} onChange={e => setFormData({...formData, name: removeNumbers(e.target.value).toLocaleUpperCase('tr-TR')})} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Telefon 1 (Zorunlu)</label>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <select style={{ width: '85px' }} value={phonePrefix} onChange={e => setPhonePrefix(e.target.value)}>
                      <option value="+90">+90</option><option value="+1">+1</option><option value="+44">+44</option><option value="+49">+49</option>
                    </select>
                    <input required className="uppercase-input tabular-nums" style={{ flex: 1 }} value={formData.phone1} onChange={e => setFormData({...formData, phone1: formatPhone(e.target.value)})} placeholder="(5XX) XXX XX XX" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Telefon 2</label>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <select style={{ width: '85px' }} value={phonePrefix} onChange={e => setPhonePrefix(e.target.value)}>
                      <option value="+90">+90</option><option value="+1">+1</option>
                    </select>
                    <input className="uppercase-input tabular-nums" style={{ flex: 1 }} value={formData.phone2} onChange={e => setFormData({...formData, phone2: formatPhone(e.target.value)})} placeholder="(5XX) XXX XX XX" />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>İl</label>
                  <select className="uppercase-input" value={formData.cityId} onChange={e => setFormData({...formData, cityId: Number(e.target.value), districtName: ''})}>
                    <option value={0}>Seçiniz</option>
                    {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>İlçe</label>
                  <select className="uppercase-input" value={formData.districtName} onChange={e => setFormData({...formData, districtName: e.target.value})} disabled={!formData.cityId}>
                    <option value="">Seçiniz</option>
                    {districts.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Açık Adres</label>
                <textarea required className="uppercase-input" style={{ height: '60px' }} value={formData.addressDetail} onChange={e => setFormData({...formData, addressDetail: e.target.value.toLocaleUpperCase('tr-TR')})} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>TCKN / Vergi No</label>
                  <input maxLength={11} className="uppercase-input tabular-nums" value={formData.taxNumber} onChange={e => setFormData({...formData, taxNumber: onlyNumbers(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label>Para Birimi</label>
                  <select required value={formData.currencyId} onChange={e => setFormData({...formData, currencyId: e.target.value})}>
                    {currencies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Risk Limiti (Opsiyonel)</label>
                  <input type="number" className="uppercase-input tabular-nums" value={formData.creditLimit} onChange={e => setFormData({...formData, creditLimit: Number(e.target.value)})} />
                  <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                    <button type="button" className="btn btn-icon" style={{ fontSize: '10px', height: '24px' }} onClick={() => setFormData(p => ({...p, creditLimit: Number(p.creditLimit) + 1000}))}>+1K</button>
                    <button type="button" className="btn btn-icon" style={{ fontSize: '10px', height: '24px' }} onClick={() => setFormData(p => ({...p, creditLimit: Number(p.creditLimit) + 10000}))}>+10K</button>
                    <button type="button" className="btn btn-icon" style={{ fontSize: '10px', height: '24px', color: 'red' }} onClick={() => setFormData(p => ({...p, creditLimit: Math.max(0, Number(p.creditLimit) - 1000)}))}>-1K</button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>{editingId ? 'GÜNCELLE' : 'CARİYİ KAYDET'}</button>
                <button type="button" className="btn" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>İPTAL</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}