import React, { useState, useEffect } from 'react';
import { itemsAPI, currenciesAPI, bomsAPI } from '../../services/api';

export default function ItemsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [itemTypes, setItemTypes] = useState<any[]>([]);
  const [quantityTypes, setQuantityTypes] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);

  const [filterTab, setFilterTab] = useState<'active' | 'passive' | 'all'>('active');
  const [searchTerm, setSearchTerm] = useState('');

  // 'select_type' = Excel vs Manuel seçim ekranı | 'form' = Ekle/Güncelle Formu | 'excel' = Excel mock ekranı
  const [modalMode, setModalMode] = useState<'none' | 'select_type' | 'form' | 'excel'>('none');
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    itemTypeId: '',
    code1: '',
    code2: '',
    criticalLimit: 0,
    purchasePrice: 0,
    salePrice: 0,
    currencyId: '',
    quantityTypeId: '',
    kdv: 20,
    description: ''
  });

  const fetchData = async () => {
    try {
      const [itRes, itTypesRes, qtyTypesRes, curRes] = await Promise.all([
        itemsAPI.getAll({ limit: 500 }), // Yüksek limit
        itemsAPI.getTypes(),
        itemsAPI.getQuantityTypes(),
        currenciesAPI.getAll()
      ]);
      setItems(itRes.data.data);
      setItemTypes(itTypesRes.data);
      setQuantityTypes(qtyTypesRes.data);
      setCurrencies(curRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtreleme: Arama (Ad, Kod1, Kod2) ve Tab(Aktif/Pasif/Tümü). Tümü'nde 1 olanlar üstte.
  const filteredItems = items
    .filter(i => {
      const s = searchTerm.toLowerCase();
      const matchSearch = i.name?.toLowerCase().includes(s) || i.code?.toLowerCase().includes(s) || i.code1?.toLowerCase().includes(s);

      if (!matchSearch) return false;
      if (filterTab === 'active') return i.state === 1;
      if (filterTab === 'passive') return i.state === 0;
      return true;
    })
    .sort((a, b) => b.state - a.state);

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData({
      name: '',
      itemTypeId: itemTypes.length > 0 ? itemTypes[0].id : '',
      code1: '',
      code2: '',
      criticalLimit: 0,
      purchasePrice: 0,
      salePrice: 0,
      currencyId: currencies.find(c => c.code === 'TRY')?.id || '',
      quantityTypeId: quantityTypes.length > 0 ? quantityTypes[0].id : '',
      kdv: 20,
      description: ''
    });
    setModalMode('select_type'); // Önce Nasıl ekleyeceğini sor
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Temiz Veri Hazırlığı (Düzenleme Hatalarını Engellemek İçin)
    const payload = {
      name: formData.name,
      itemTypeId: Number(formData.itemTypeId),
      code1: formData.code1 || undefined,
      code2: formData.code2 || undefined,
      criticalLimit: Number(formData.criticalLimit),
      purchasePrice: Number(formData.purchasePrice),
      salePrice: Number(formData.salePrice),
      currencyId: Number(formData.currencyId) || undefined,
      quantityTypeId: Number(formData.quantityTypeId),
      kdv: Number(formData.kdv),
      description: formData.description
    };

    try {
      if (editingId) {
        await itemsAPI.update(editingId, payload);
      } else {
        await itemsAPI.create(payload);
      }
      setModalMode('none');
      fetchData(); // F5 işlemi interceptor'da olacak
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({
      name: item.name || '',
      itemTypeId: item.itemTypeId || itemTypes[0]?.id || '',
      code1: item.code1 || '',
      code2: item.code2 || '',
      criticalLimit: Number(item.criticalLimit) || 0,
      purchasePrice: Number(item.purchasePrice) || 0,
      salePrice: Number(item.salePrice) || 0,
      currencyId: item.currencyId || currencies.find(c => c.code === 'TRY')?.id || '',
      quantityTypeId: item.quantityTypeId || quantityTypes[0]?.id || '',
      kdv: Number(item.kdv) || 20,
      description: item.description || ''
    });
    setModalMode('form'); // Edit işlemi direkt forma gider
  };

  // 🔥 Kritik Özellik: Ürün Reçetede Varsa Pasife Almayı Engelle
  const toggleState = async (item: any) => {
    const isDeactivating = item.state === 1;

    if (isDeactivating) {
      // Pasife alırken reçete kontrolü (BOM kontrolü)
      try {
        const bomsRes = await bomsAPI.getAll({ limit: 1000 });
        const allBoms = bomsRes.data.data || [];

        // Ürünü barındıran aktif bir reçete (BOM) bul
        const conflictBom = allBoms.find((b: any) =>
          b.state === 1 && b.items?.some((bi: any) => bi.itemId === item.id)
        );

        if (conflictBom) {
          alert(`UYARI: İşlem Durduruldu!\n\nLÜTFEN ÜRÜNE AİT REÇETE '${conflictBom.name}' DÜZENLEYİNİZ.\n\nBu ürün aktif bir üretim reçetesinde kullanıldığı için arşivlenemez.`);
          return;
        }

        if (!window.confirm(`[${item.name}] ürünü arşivlenecektir. Onaylıyor musunuz?`)) return;
      } catch (err) {
        alert("Reçete kontrolü yapılamadı, bağlantınızı kontrol edin.");
        return;
      }
    } else {
      if (!window.confirm('Ürün tekrar aktif edilecek. Onaylıyor musunuz?')) return;
    }

    await itemsAPI.toggleState(item.id, item.state);
    fetchData();
  };

  // Yeni Birim Ekleme (Modal içinde prompt kullanmak hızlı ve kesindir)
  const handleAddNewQuantityType = async () => {
    const unitName = prompt("Yeni Birim Adı (Örn: Gram, Adet, Koli vb.):");
    if (!unitName) return;
    const unitAbbrev = prompt(`'${unitName}' için Kısa Kod (Örn: g, ad, kl):`);
    if (!unitAbbrev) return;

    try {
      await itemsAPI.createQuantityType({ name: unitName, abbreviation: unitAbbrev });
      alert('Yeni birim eklendi!');
      fetchData();
    } catch (err) {
      alert("Hata oluştu.");
    }
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ color: 'var(--primary)', marginBottom: '10px' }}>Ürünler & Stok Kartları</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className={`btn ${filterTab === 'active' ? 'btn-primary' : ''}`} onClick={() => setFilterTab('active')}>Aktifler</button>
            <button className={`btn ${filterTab === 'passive' ? 'btn-primary' : ''}`} onClick={() => setFilterTab('passive')}>Arşiv / Pasif</button>
            <button className={`btn ${filterTab === 'all' ? 'btn-primary' : ''}`} onClick={() => setFilterTab('all')}>Tümü</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <input
            type="text"
            placeholder="Ürün Adı, Kodu, Özel Kod ile Ara..."
            className="search-bar"
            style={{ width: '380px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="btn btn-primary" onClick={handleOpenNew}>+ YENİ ÜRÜN OLUŞTUR</button>
        </div>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>SİSTEM KODU</th>
              <th>ÜRÜN ADI</th>
              <th>EK KODLAR (1/2)</th>
              <th>ALIŞ FİYATI</th>
              <th>SATIŞ FİYATI</th>
              <th>KRİTİK LİMİT</th>
              <th>BİRİM / TÜR</th>
              <th>İŞLEMLER</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr key={item.id} style={{ opacity: item.state === 0 ? 0.6 : 1, background: item.state === 0 ? '#f1f5f9' : 'inherit' }}>
                <td><span className="badge">{item.code || '-'}</span></td>
                <td><strong>{item.name}</strong> {item.state === 0 && <span style={{ color: 'red', fontSize: '10px', marginLeft: '5px' }}>PASİF</span>}</td>
                <td>{item.code1 || '-'} / {item.code2 || '-'}</td>
                <td className="tabular-nums">{Number(item.purchasePrice).toLocaleString('tr-TR')} {item.currency?.symbol || '₺'}</td>
                <td className="tabular-nums" style={{ color: 'var(--success)', fontWeight: 800 }}>
                  {Number(item.salePrice).toLocaleString('tr-TR')} {item.currency?.symbol || '₺'}
                </td>
                <td className="tabular-nums" style={{ color: item.criticalLimit > 0 ? 'var(--warning)' : 'inherit' }}>
                  {Number(item.criticalLimit)}
                </td>
                <td>{item.quantityType?.abbreviation || '-'} / {item.itemType?.name || '-'}</td>
                <td>
                  <button className="btn" style={{ padding: '0 10px', height: '30px', marginRight: '5px' }} onClick={() => handleEdit(item)}>✎ Düzenle</button>
                  <button className="btn" style={{ padding: '0 10px', height: '30px', color: item.state === 1 ? 'var(--error)' : 'var(--success)' }} onClick={() => toggleState(item)}>
                    {item.state === 1 ? 'Arşivle' : 'Aktif Et'}
                  </button>
                </td>
              </tr>
            ))}
            {filteredItems.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center' }}>Ürün bulunamadı.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* --- SEÇİM MODALI (EXCEL Mİ MANUEL Mİ?) --- */}
      {modalMode === 'select_type' && (
        <div className="loader-overlay">
          <div className="login-box" style={{ maxWidth: '450px' }}>
            <h3 style={{ color: 'var(--primary)', marginBottom: '15px' }}>Nasıl Ürün Eklemek İstersiniz?</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <button className="btn" style={{ height: '60px', background: 'var(--surface-container-low)', fontSize: '15px', justifyContent: 'center' }} onClick={() => setModalMode('excel')}>
                📄 Bende Excel Tablosu Var (Toplu Yükle)
              </button>
              <button className="btn btn-primary" style={{ height: '60px', fontSize: '15px', justifyContent: 'center' }} onClick={() => setModalMode('form')}>
                ✍️ Sisteme Manuel Ürün Ekle
              </button>
            </div>
            <button className="btn" style={{ marginTop: '20px', width: '100%', justifyContent: 'center', background: '#ffe4e6', color: 'red' }} onClick={() => setModalMode('none')}>İPTAL</button>
          </div>
        </div>
      )}

      {/* --- EXCEL BEKLEME / YAPIM AŞAMASI MODALI --- */}
      {modalMode === 'excel' && (
        <div className="loader-overlay">
          <div className="login-box" style={{ textAlign: 'center' }}>
            <h3 style={{ color: 'var(--primary)' }}>Excel ile Yükleme</h3>
            <p style={{ margin: '20px 0', fontSize: '14px', color: 'gray' }}>Excel içe aktarım şablonu arka plan servisine bağlanmaktadır. Yakında aktif edilecektir.</p>
            <button className="btn" style={{ width: '100%', justifyContent: 'center', background: '#e2e8f0' }} onClick={() => setModalMode('select_type')}>Geri Dön</button>
          </div>
        </div>
      )}

      {/* --- MANUEL FORM MODALI --- */}
      {modalMode === 'form' && (
        <div className="loader-overlay" style={{ alignItems: 'flex-start', paddingTop: '2%', overflowY: 'auto' }}>
          <div className="login-box" style={{ maxWidth: '700px', width: '100%', marginBottom: '5%' }}>
            <h3 style={{ marginBottom: '15px', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              {editingId ? 'Stok Kartını Düzenle' : 'Yeni Stok Kartı Oluştur'}
            </h3>
            <form onSubmit={handleSubmit} className="login-form">

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Ürün / Madde Tipi</label>
                  <select required className="uppercase-input" value={formData.itemTypeId} onChange={e => setFormData({ ...formData, itemTypeId: e.target.value })} style={{ appearance: 'none' }}>
                    <option value="">-- SEÇİNİZ --</option>
                    {itemTypes.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Ürün Adı (Zorunlu)</label>
                  <input required className="uppercase-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value.toUpperCase() })} placeholder="ÖR: TAM BUĞDAY UNU" />
                </div>
              </div>

              {/* EK KODLAR & BİRİM */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '15px', background: 'var(--surface-container-low)', padding: '15px', borderRadius: '12px' }}>
                <div className="form-group">
                  <label>Müşteri Kod-1</label>
                  <input className="uppercase-input" value={formData.code1} onChange={e => setFormData({ ...formData, code1: e.target.value.toUpperCase() })} placeholder="BARKOD VS." />
                </div>
                <div className="form-group">
                  <label>Müşteri Kod-2</label>
                  <input className="uppercase-input" value={formData.code2} onChange={e => setFormData({ ...formData, code2: e.target.value.toUpperCase() })} placeholder="RAF VS." />
                </div>
                <div className="form-group">
                  <label>Birim Tipi</label>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <select required className="uppercase-input" value={formData.quantityTypeId} onChange={e => setFormData({ ...formData, quantityTypeId: e.target.value })} style={{ appearance: 'none', flex: 1 }}>
                      <option value="">-- SEÇİNİZ --</option>
                      {quantityTypes.map(qt => <option key={qt.id} value={qt.id}>{qt.name} ({qt.abbreviation})</option>)}
                    </select>
                    <button type="button" className="btn btn-primary" style={{ padding: '0 15px' }} title="Yeni Birim (kg, metre vb.) Ekle" onClick={handleAddNewQuantityType}>+</button>
                  </div>
                </div>
              </div>

              {/* FİYATLANDIRMA MODÜLÜ */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Alış Fiyatı (KDV Hariç)</label>
                  <input type="number" step="0.01" className="uppercase-input tabular-nums" value={formData.purchasePrice} onChange={e => setFormData({ ...formData, purchasePrice: Number(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label>Satış Fiyatı (KDV Hariç)</label>
                  <input type="number" step="0.01" className="uppercase-input tabular-nums" style={{ borderColor: 'var(--success)', borderWidth: '2px' }} value={formData.salePrice} onChange={e => setFormData({ ...formData, salePrice: Number(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label>KDV Oranı (%)</label>
                  <select className="uppercase-input" value={formData.kdv} onChange={e => setFormData({ ...formData, kdv: Number(e.target.value) })} style={{ appearance: 'none' }}>
                    <option value={0}>%0</option>
                    <option value={1}>%1</option>
                    <option value={10}>%10</option>
                    <option value={20}>%20</option>
                  </select>
                </div>
              </div>

              {/* PARA BİRİMİ VE LİMİT */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Varsayılan Para Birimi</label>
                  {/* TL SİLİK VE SABİT GELMESİ İSTENDİ */}
                  <select required className="uppercase-input" value={formData.currencyId} disabled={true} style={{ appearance: 'none', opacity: 0.7 }}>
                    {currencies.map(c => <option key={c.id} value={c.id}>{c.code} ({c.symbol})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Kritik Stok Uyarısı</label>
                  <input type="number" step="1" className="uppercase-input tabular-nums" style={{ color: 'red', fontWeight: '800' }} value={formData.criticalLimit} onChange={e => setFormData({ ...formData, criticalLimit: Number(e.target.value) })} placeholder="0" />
                </div>
              </div>

              <div className="form-group">
                <label>Notlar ve Açıklamalar</label>
                <input className="uppercase-input" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value.toUpperCase() })} placeholder="..." />
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '50px' }}>{editingId ? 'DEĞİŞİKLİKLERİ KAYDET' : 'ÜRÜNÜ SİSTEME EKLE'}</button>
                <button type="button" className="btn" style={{ flex: 1, background: '#e2e8f0', height: '50px' }} onClick={() => setModalMode('none')}>İPTAL ET</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}