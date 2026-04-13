import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { partiesAPI, currenciesAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { PaginationControls } from '../../components/common/PaginationControls';
import { FiX, FiEdit2, FiArchive, FiRefreshCw, FiSearch, FiPlus, FiMinus, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { useTurkiyeCities, useTurkiyeDistricts } from '../../hooks/useTurkiyeApi';
import { usePersistentForm } from '../../hooks/usePersistentForm';
import { confirmDialog } from '../../utils/confirmDialog';
import { Party, Currency } from '../../types';

export default function PartiesPage() {
  const [parties, setParties] = useState<Party[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<'active' | 'passive' | 'all'>('active');
  const [phonePrefix, setPhonePrefix] = useState('+90');
  
  // Pagination & Sort State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [paginationMeta, setPaginationMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });
  const [debouncedSearch, setDebouncedSearch] = useState('');

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
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        partiesAPI.getAll({ 
          page, 
          limit, 
          search: debouncedSearch,
          sortBy: sortConfig?.key,
          sortOrder: sortConfig?.direction.toUpperCase() as any,
          type: filterTab === 'all' ? undefined : filterTab
        }),
        currenciesAPI.getAll()
      ]);
      setParties(pRes.data.data);
      setPaginationMeta(pRes.data.meta);
      setCurrencies(cRes.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Cari veriler yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  // Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => { 
    fetchData(); 
  }, [page, limit, debouncedSearch, sortConfig, filterTab]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'new') {
      setIsModalOpen(true);
      setEditingId(null);
      clearFormData();
      setFormData(prev => ({
        ...prev,
        currencyId: String(currencies.find(c => c.isDefault === 1)?.id || '')
      }));
    }
  }, [location.search]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const formatPhone = (val: string) => {
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
    if (formData.taxNumber) {
      const len = formData.taxNumber.length;
      if (len !== 10 && len !== 11) {
        toast.error("HATA: Vergi No (VKN) 10 hane, TCKN ise 11 hane olmak zorundadır!");
        return;
      }
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
       creditLimitMinus: Number(formData.creditLimit)
    };

    try {
      if (editingId) await partiesAPI.update(editingId, payload);
      else await partiesAPI.create(payload);
      setIsModalOpen(false);
      clearFormData();
      fetchData();
      toast.success(editingId ? "Cari güncellendi" : "Yeni cari oluşturuldu");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "İşlem başarısız");
    }
  };

  const handleEdit = (p: Party) => {
    setEditingId(p.id);
    
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
      currencyId: String(p.currencyId || currencies.find(c => c.isDefault === 1)?.id || '')
    });
    setIsModalOpen(true);
  };

  const toggleState = async (p: Party) => {
    const currentState = p.state;
    if (currentState === 1 && Number(p.balance) !== 0) {
      toast.error("Bakiye 0 olmadığı için bu cari pasife alınamaz.", { duration: 5000 });
      return;
    }
    const confirmed = await confirmDialog(currentState === 1 ? 'Firmayı/Müşteriyi arşivlemek istediğinize emin misiniz?' : 'Hesap tekrar aktif edilecektir. Onaylıyor musunuz?', currentState === 1);
    if (confirmed) {
      try {
        await partiesAPI.toggleState(p.id, currentState);
        fetchData();
        toast.success("Durum güncellendi");
      } catch (error: any) {
        toast.error(error.response?.data?.message || "İşlem başarısız");
      }
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
            <button className={`btn ${filterTab === 'active' ? 'btn-primary' : ''}`} onClick={() => { setFilterTab('active'); setPage(1); }}>Aktif Kayıtlar</button>
            <button className={`btn ${filterTab === 'passive' ? 'btn-primary' : ''}`} onClick={() => { setFilterTab('passive'); setPage(1); }}>Arşiv</button>
            <button className={`btn ${filterTab === 'all' ? 'btn-primary' : ''}`} onClick={() => { setFilterTab('all'); setPage(1); }}>Tümü</button>
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
              currencyId: String(defaultCurr?.id || '')
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
              <th>Vergi No</th>
              <th>İletişim</th>
              <th onClick={() => requestSort('balance')} style={{ cursor: 'pointer' }}>Bakiye {sortIcon('balance')}</th>
              <th>Limit Durumu</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {parties.map((p) => (
              <tr key={p.id} style={{ opacity: p.state === 0 ? 0.6 : 1 }}>
                <td>
                  <div style={{ fontWeight: 800 }}>{p.name}</div>
                  <div style={{ fontSize: '10px', color: 'gray' }}>{p.type === 'customer' ? 'Müşteri' : (p.type === 'provider' ? 'Tedarikçi' : 'Her İkisi')}</div>
                </td>
                <td><span className="badge badge-outline">{p.taxNumber || '—'}</span></td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', fontSize: '12px' }}>
                    <span>{p.phone1}</span>
                    <span style={{ color: 'gray', textTransform: 'lowercase' }}>{p.email}</span>
                  </div>
                </td>
                <td className={`tabular-nums ${Number(p.balance) > 0 ? 'text-danger' : 'text-success'}`} style={{ fontWeight: 700 }}>
                  {Number(p.balance).toLocaleString('tr-TR')} {p.currency?.symbol || '₺'}
                </td>
                <td>
                   <div className="limit-progress" style={{ width: '100px', height: '6px', background: '#e2e8f0', borderRadius: '3px', position:'relative', overflow:'hidden' }}>
                      <div style={{ 
                        width: `${Math.min(100, (Number(p.balance) / (Number(p.creditLimitPlus) || 1)) * 100)}%`, 
                        height:'100%', 
                        background: Number(p.balance) > (Number(p.creditLimitPlus) || 0) * 0.9 ? 'var(--error)' : 'var(--primary)' 
                      }} />
                   </div>
                   <div style={{ fontSize: '9px', marginTop: '4px', color: 'gray' }}>{Number(p.creditLimitPlus).toLocaleString('tr-TR')} {p.currency?.symbol || '₺'} limit</div>
                </td>
                <td style={{ display: 'flex', gap: '5px' }}>
                  <button className="btn-icon" onClick={() => handleEdit(p)} title="Düzenle"><FiEdit2 size={16} /></button>
                  <button className="btn-icon" onClick={() => toggleState(p)} title={p.state === 1 ? 'Arşivle' : 'Aktif Et'} style={{ color: p.state === 1 ? 'var(--error)' : 'var(--success)' }}>
                    {p.state === 1 ? <FiArchive size={16} /> : <FiRefreshCw size={16} />}
                  </button>
                </td>
              </tr>
            ))}
            {parties.length === 0 && !loading && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'gray' }}>Kayıt bulunamadı.</td>
              </tr>
            )}
            {loading && (
               <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '30px' }}>
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
                    <option value={0}>Lütfen Seçiniz</option>
                    {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>İlçe</label>
                  <select className="uppercase-input" value={formData.districtName} onChange={e => setFormData({...formData, districtName: e.target.value})} disabled={!formData.cityId}>
                    <option value="">Lütfen Seçiniz</option>
                    {districts.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Açık Adres</label>
                <textarea required className="uppercase-input" style={{ height: '60px' }} value={formData.addressDetail} onChange={e => setFormData({...formData, addressDetail: e.target.value.toLocaleUpperCase('tr-TR')})} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.8fr', gap: '15px' }}>
                <div className="form-group">
                  <label>
                    Vergi (VKN) / TCKN 
                    {formData.taxNumber.length === 10 ? ' (VKN)' : formData.taxNumber.length === 11 ? ' (TCKN)' : ''}
                  </label>
                  <input maxLength={11} className="uppercase-input tabular-nums" value={formData.taxNumber} onChange={e => setFormData({...formData, taxNumber: onlyNumbers(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label>Para Birimi</label>
                  <select required value={formData.currencyId} onChange={e => setFormData({...formData, currencyId: e.target.value})}>
                    {currencies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Kritik Limit</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface-container-low)', padding: '4px', borderRadius: '14px', border: '1px solid var(--border)' }}>
                    <button type="button" className="btn btn-icon" onClick={() => setFormData(p => ({...p, creditLimit: Math.max(0, Number(p.creditLimit) - 10000)}))}>-10K</button>
                    <button type="button" className="btn btn-icon" onClick={() => setFormData(p => ({...p, creditLimit: Math.max(0, Number(p.creditLimit) - 1000)}))}>-1K</button>
                    <input type="number" className="uppercase-input tabular-nums" style={{ flex: 1, textAlign: 'center', margin: 0, border: 'none', background: 'transparent', fontWeight: 800, fontSize: '1.1rem' }} value={formData.creditLimit} onChange={e => setFormData({...formData, creditLimit: Number(e.target.value)})} />
                    <button type="button" className="btn btn-icon" onClick={() => setFormData(p => ({...p, creditLimit: Number(p.creditLimit) + 1000}))}>+1K</button>
                    <button type="button" className="btn btn-icon" onClick={() => setFormData(p => ({...p, creditLimit: Number(p.creditLimit) + 10000}))}>+10K</button>
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