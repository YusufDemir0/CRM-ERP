import React, { useState, useEffect } from 'react';
import { settingsAPI, currenciesAPI, itemsAPI, departmentsAPI } from '../../services/api';
import { FiSave, FiSettings, FiDollarSign, FiHome, FiHash, FiPlus, FiTrash2, FiStar, FiRefreshCw, FiAlertTriangle, FiCheck, FiArchive } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { confirmDialog } from '../../utils/confirmDialog';

type TabType = 'general' | 'currencies' | 'item-groups' | 'quantity-types' | 'dept-types';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [codeGroups, setCodeGroups] = useState<any[]>([]);
  const [quantityTypes, setQuantityTypes] = useState<any[]>([]);
  const [deptTypes, setDeptTypes] = useState<any[]>([]);

  // Form states
  const [newCurrency, setNewCurrency] = useState({ code: '', symbol: '', name: '' });
  const [newGroup, setNewGroup] = useState({ name: '', prefix: '' });
  const [newQtyType, setNewQtyType] = useState({ name: '', abbreviation: '' });
  const [newDeptType, setNewDeptType] = useState({ name: '', abbreviation: '' });

  const fetchData = async () => {
    try {
      const [sets, currs, groups, qTypes, dTypes] = await Promise.all([
        settingsAPI.getAll(),
        currenciesAPI.getAll(),
        itemsAPI.getCodeGroups(),
        itemsAPI.getQuantityTypes(),
        departmentsAPI.getTypes()
      ]);
      setSettings(sets.data);
      setCurrencies(currs.data || []);
      setCodeGroups(groups.data || []);
      setQuantityTypes(Array.from(new Map((qTypes.data || []).map((q: any) => [q.name.toLowerCase().trim(), q])).values()));
      setDeptTypes(Array.from(new Map((dTypes.data || []).map((t: any) => [`${t.name.toLowerCase().trim()}-${t.abbreviation.toLowerCase().trim()}`, t])).values()));
    } catch (error) {
      console.error(error);
      toast.error('Veriler yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSaveSettings = async () => {
    try {
      const items = Object.entries(settings).map(([settingKey, settingValue]) => ({
        settingKey,
        settingValue: String(settingValue || '')
      }));
      await settingsAPI.bulkUpdate(items);
      toast.success('Ayarlar kaydedildi');
    } catch (error) {
      toast.error('Kayıt hatası');
    }
  };

  const handleAddCurrency = async () => {
    if (!newCurrency.code || !newCurrency.symbol) return toast.error('Eksik bilgi');
    try {
      await currenciesAPI.create(newCurrency);
      setNewCurrency({ code: '', symbol: '', name: '' });
      fetchData();
      toast.success('Eklendi');
    } catch (err) { /* handled by api.ts */ }
  };

  const handleSetDefaultCurrency = async (id: number) => {
    try {
      await currenciesAPI.setDefault(id);
      fetchData();
      toast.success('Varsayılan güncellendi');
    } catch (err) { /* handled by api.ts */ }
  };

  const handleAddGroup = async () => {
      if (!newGroup.name || !newGroup.prefix) return toast.error('Eksik bilgi');
      try {
          await itemsAPI.createCodeGroup(newGroup);
          setNewGroup({ name: '', prefix: '' });
          fetchData();
          toast.success('Grup eklendi');
      } catch (err) { /* handled by api.ts */ }
  };

  const toggleGroupState = async (id: number, state: number) => {
      try {
          await itemsAPI.updateCodeGroup(id, { state: state === 1 ? 0 : 1 });
          fetchData();
          toast.success('Durum güncellendi');
    } catch (err: any) {
      // Global api.ts handles the toast notification safely
    }
  };

  const handleAddQtyType = async () => {
    if (!newQtyType.name || !newQtyType.abbreviation) return toast.error('Eksik bilgi');
    try {
      await itemsAPI.createQuantityType(newQtyType);
      setNewQtyType({ name: '', abbreviation: '' });
      fetchData();
      toast.success('Birim eklendi');
    } catch (err: any) { /* handled by api.ts */ }
  };

  const toggleQtyTypeState = async (id: number, state: number) => {
    try {
      await itemsAPI.updateQuantityType(id, { state: state === 1 ? 0 : 1 });
      fetchData();
      toast.success('Durum güncellendi');
    } catch (err: any) {
      // Global api.ts handles the toast notification safely
    }
  };

  const handleDeleteQtyType = async (id: number) => {
    if (await confirmDialog('Bu birimi silmek istediğinize emin misiniz?', true)) {
      try {
        await itemsAPI.deleteQuantityType(id);
        fetchData();
        toast.success('Birim silindi');
      } catch (err: any) {
        // Global api.ts handles the toast notification safely
      }
    }
  };

  const handleAddDeptType = async () => {
    if (!newDeptType.name || !newDeptType.abbreviation) return toast.error('Eksik bilgi');
    try {
      await departmentsAPI.createType(newDeptType);
      setNewDeptType({ name: '', abbreviation: '' });
      fetchData();
      toast.success('Departman türü eklendi');
    } catch (err: any) { /* handled by api.ts */ }
  };

  const toggleDeptTypeState = async (id: number, state: number) => {
    try {
      await departmentsAPI.updateType(id, { state: state === 1 ? 0 : 1 });
      fetchData();
      toast.success('Durum güncellendi');
    } catch (err: any) { /* handled by api.ts */ }
  };

  const handleDeleteDeptType = async (id: number) => {
    if (await confirmDialog('Bu türü silmek istediğinize emin misiniz?', true)) {
      try {
        await departmentsAPI.deleteType(id);
        fetchData();
        toast.success('Tür silindi');
      } catch (err: any) { /* handled by api.ts */ }
    }
  };

  if (isLoading) return <div className="page-container"><div className="spinner" /></div>;

  return (
    <div className="page-container" style={{ maxWidth: '1200px' }}>
      <div className="page-header" style={{ marginBottom: '30px' }}>
        <h2 style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FiSettings /> Sistem Ayarları
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '30px' }}>
        {/* Sidebar Tabs */}
        <div className="login-box" style={{ width: '100%', padding: '10px' }}>
          <button className={`btn ${activeTab === 'general' ? 'btn-primary' : ''}`} style={{ width: '100%', justifyContent: 'flex-start', marginBottom: '5px' }} onClick={() => setActiveTab('general')}>
            <FiHome style={{ marginRight: '10px' }} /> Genel Ayarlar
          </button>
          <button className={`btn ${activeTab === 'currencies' ? 'btn-primary' : ''}`} style={{ width: '100%', justifyContent: 'flex-start', marginBottom: '5px' }} onClick={() => setActiveTab('currencies')}>
            <FiDollarSign style={{ marginRight: '10px' }} /> Para Birimleri
          </button>
          <button className={`btn ${activeTab === 'item-groups' ? 'btn-primary' : ''}`} style={{ width: '100%', justifyContent: 'flex-start', marginBottom: '5px' }} onClick={() => setActiveTab('item-groups')}>
            <FiHash style={{ marginRight: '10px' }} /> Ürün Kod Grupları
          </button>
          <button className={`btn ${activeTab === 'quantity-types' ? 'btn-primary' : ''}`} style={{ width: '100%', justifyContent: 'flex-start', marginBottom: '5px' }} onClick={() => setActiveTab('quantity-types')}>
            <FiSettings style={{ marginRight: '10px' }} /> Ürün Birimleri
          </button>
          <button className={`btn ${activeTab === 'dept-types' ? 'btn-primary' : ''}`} style={{ width: '100%', justifyContent: 'flex-start' }} onClick={() => setActiveTab('dept-types')}>
            <FiStar style={{ marginRight: '10px' }} /> Departman Türleri
          </button>
        </div>

        {/* Content Area */}
        <div className="login-box" style={{ width: '100%', maxWidth: '100%' }}>
          {activeTab === 'general' && (
            <div className="login-form">
              <h4 style={{ marginBottom: '20px', color: 'var(--primary)' }}>Şirket Bilgileri</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Şirket Adı</label>
                  <input className="uppercase-input" value={settings.company_name || ''} onChange={e => setSettings({...settings, company_name: e.target.value.toLocaleUpperCase('tr-TR')})} />
                </div>
                <div className="form-group">
                  <label>Vergi No</label>
                  <input value={settings.tax_number || ''} onChange={e => setSettings({...settings, tax_number: e.target.value.replace(/\D/g, '')})} />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '15px' }}>
                <label>Fatura Adresi</label>
                <textarea style={{ height: '80px' }} value={settings.company_address || ''} onChange={e => setSettings({...settings, company_address: e.target.value.toLocaleUpperCase('tr-TR')})} />
              </div>
              <button className="btn btn-primary" style={{ marginTop: '20px', width: '100%' }} onClick={handleSaveSettings}>DEĞİŞİKLİKLERİ KAYDET</button>
            </div>
          )}

          {activeTab === 'currencies' && (
            <div>
              <h4 style={{ marginBottom: '20px', color: 'var(--primary)' }}>Para Birimi Yönetimi</h4>
              <div className="table-card" style={{ marginBottom: '20px' }}>
                <table>
                  <thead>
                    <tr><th>Kod</th><th>Sembol</th><th>Ad</th><th>Varsayılan</th><th>İşlem</th></tr>
                  </thead>
                  <tbody>
                    {currencies.map(c => (
                      <tr key={c.id}>
                        <td><strong>{c.code}</strong></td>
                        <td>{c.symbol}</td>
                        <td>{c.name}</td>
                        <td style={{ textAlign: 'center' }}>
                          {c.isDefault ? <FiCheck color="var(--success)" size={20} /> : <button className="btn-icon" onClick={() => handleSetDefaultCurrency(c.id)}><FiStar /></button>}
                        </td>
                        <td>
                          {!c.isDefault && <button className="btn-icon" style={{ color: 'var(--error)' }} onClick={async () => {
                            if (await confirmDialog('Silmek istiyor musunuz?', true)) {
                              await currenciesAPI.delete(c.id);
                              fetchData();
                            }
                          }}><FiTrash2 /></button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr auto', gap: '10px', background: '#f8fafc', padding: '15px', borderRadius: '12px' }}>
                <input placeholder="Kod (USD)" value={newCurrency.code} onChange={e => setNewCurrency({...newCurrency, code: e.target.value.toUpperCase()})} />
                <input placeholder="Sembol ($)" value={newCurrency.symbol} onChange={e => setNewCurrency({...newCurrency, symbol: e.target.value})} />
                <input placeholder="İsim (DOLAR)" value={newCurrency.name} onChange={e => setNewCurrency({...newCurrency, name: e.target.value.toLocaleUpperCase('tr-TR')})} />
                <button className="btn btn-primary" onClick={handleAddCurrency}><FiPlus /></button>
              </div>
            </div>
          )}

          {activeTab === 'item-groups' && (
            <div>
              <h4 style={{ marginBottom: '20px', color: 'var(--primary)' }}>Ürün Kod Grupları (SKU)</h4>
              <div className="table-card" style={{ marginBottom: '20px' }}>
                <table>
                  <thead>
                    <tr><th>Grup Adı</th><th>Ön Ek (Prefix)</th><th>Durum</th><th>İşlem</th></tr>
                  </thead>
                  <tbody>
                    {codeGroups.map(g => (
                      <tr key={g.id} style={{ opacity: g.state === 0 ? 0.6 : 1 }}>
                        <td><strong>{g.name}</strong></td>
                        <td><span className="badge">{g.prefix}</span></td>
                        <td>{g.state === 1 ? 'Aktif' : 'Pasif'}</td>
                        <td>
                          <button className="btn-icon" style={{ color: g.state === 1 ? 'var(--error)' : 'var(--success)' }} onClick={() => toggleGroupState(g.id, g.state)}>
                            {g.state === 1 ? <FiArchive /> : <FiRefreshCw />}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '10px', background: '#f8fafc', padding: '15px', borderRadius: '12px' }}>
                <input placeholder="Grup Adı (Örn: MOBİLYA)" value={newGroup.name} onChange={e => setNewGroup({...newGroup, name: e.target.value.toLocaleUpperCase('tr-TR')})} />
                <input placeholder="Ön Ek (Örn: MOB)" value={newGroup.prefix} onChange={e => setNewGroup({...newGroup, prefix: e.target.value.toUpperCase()})} />
                <button className="btn btn-primary" onClick={handleAddGroup}><FiPlus /></button>
              </div>
              <div style={{ marginTop: '15px', color: 'var(--text-muted)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                 <FiAlertTriangle /> Pasife alabilmek için bu grupta aktif ürünler olmamalıdır.
              </div>
            </div>
          )}

          {activeTab === 'quantity-types' && (
            <div>
              <h4 style={{ marginBottom: '20px', color: 'var(--primary)' }}>Ürün Birimleri (Kg, Adet vb.)</h4>
              <div className="table-card" style={{ marginBottom: '20px' }}>
                <table>
                  <thead>
                    <tr><th>Birim Adı</th><th>Kısaltma</th><th>Durum</th><th>İşlemler</th></tr>
                  </thead>
                  <tbody>
                    {quantityTypes.map(q => (
                      <tr key={q.id} style={{ opacity: q.state === 0 ? 0.6 : 1 }}>
                        <td><strong>{q.name}</strong></td>
                        <td><span className="badge">{q.abbreviation}</span></td>
                        <td>{q.state === 1 ? 'Aktif' : 'Arşivlenmiş'}</td>
                        <td style={{ display: 'flex', gap: '5px' }}>
                          <button className="btn-icon" style={{ color: q.state === 1 ? 'var(--error)' : 'var(--success)' }} onClick={() => toggleQtyTypeState(q.id, q.state)} title={q.state === 1 ? 'Arşivle (Ürünlerde görünmez)' : 'Aktifleştir'}>
                            {q.state === 1 ? <FiArchive /> : <FiRefreshCw />}
                          </button>
                          <button className="btn-icon" style={{ color: 'var(--error)' }} onClick={() => handleDeleteQtyType(q.id)} title="Tamamen Sil">
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', background: '#f8fafc', padding: '15px', borderRadius: '12px' }}>
                <input placeholder="Birim Adı (Örn: Kilogram)" value={newQtyType.name} onChange={e => setNewQtyType({...newQtyType, name: e.target.value.toLocaleUpperCase('tr-TR')})} />
                <input placeholder="Kısaltma (Örn: Kg)" value={newQtyType.abbreviation} onChange={e => setNewQtyType({...newQtyType, abbreviation: e.target.value})} />
                <button className="btn btn-primary" onClick={handleAddQtyType}><FiPlus /></button>
              </div>
              <div style={{ marginTop: '15px', color: 'var(--text-muted)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                 <FiAlertTriangle /> Pasife alma veya silme işlemi için bu birimi kullanan aktif ürün olmamalıdır.
              </div>
            </div>
          )}

          {activeTab === 'dept-types' && (
            <div>
              <h4 style={{ marginBottom: '20px', color: 'var(--primary)' }}>Departman Türleri (Üretim, Depo vb.)</h4>
              <div className="table-card" style={{ marginBottom: '20px' }}>
                <table>
                  <thead>
                    <tr><th>Tür Adı</th><th>Kısaltma</th><th>Durum</th><th>İşlemler</th></tr>
                  </thead>
                  <tbody>
                    {deptTypes.map(t => (
                      <tr key={t.id} style={{ opacity: t.state === 0 ? 0.6 : 1 }}>
                        <td><strong>{t.name}</strong></td>
                        <td><span className="badge">{t.abbreviation}</span></td>
                        <td>{t.state === 1 ? 'Aktif' : 'Arşivlenmiş'}</td>
                        <td style={{ display: 'flex', gap: '5px' }}>
                          <button className="btn-icon" style={{ color: t.state === 1 ? 'var(--error)' : 'var(--success)' }} onClick={() => toggleDeptTypeState(t.id, t.state)} title="Durumu Değiştir">
                            {t.state === 1 ? <FiArchive /> : <FiRefreshCw />}
                          </button>
                          <button className="btn-icon" style={{ color: 'var(--error)' }} onClick={() => handleDeleteDeptType(t.id)} title="Sil">
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', background: '#f8fafc', padding: '15px', borderRadius: '12px' }}>
                <input placeholder="Tür Adı (Örn: ÜRETİM)" value={newDeptType.name} onChange={e => setNewDeptType({...newDeptType, name: e.target.value.toLocaleUpperCase('tr-TR')})} />
                <input placeholder="Kısaltma (Örn: URT)" value={newDeptType.abbreviation} onChange={e => setNewDeptType({...newDeptType, abbreviation: e.target.value.toUpperCase()})} />
                <button className="btn btn-primary" onClick={handleAddDeptType}><FiPlus /></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}