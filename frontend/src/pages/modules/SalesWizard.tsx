import React, { useState, useEffect } from 'react';
import { partiesAPI, usersAPI, stocksAPI, salesAPI, currenciesAPI } from '../../services/api';

export default function SalesWizard() {
  const [step, setStep] = useState(1);
  const today = new Date().toISOString().split('T')[0];

  // ─── VERİLER ───
  const [customers, setCustomers] = useState<any[]>([]);
  const [representatives, setRepresentatives] = useState<any[]>([]);
  const [stocks, setStocks] = useState<any[]>([]);
  const [saleTypes, setSaleTypes] = useState<any[]>([]);
  const [currencyTLId, setCurrencyTLId] = useState<number>(1);

  // ─── FORM STATES ───
  const [partyId, setPartyId] = useState<string>('');
  const [repId, setRepId] = useState<string>('');
  const [invoiceType, setInvoiceType] = useState<'billed' | 'unbilled' | null>(null);
  const [deliveryDate, setDeliveryDate] = useState<string>(today);

  // ─── SEPET ───
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<any[]>([]);

  // ─── ÖDEME & FİNAL ───
  const [deposit, setDeposit] = useState<string>(''); // Kapora String (validation için)
  const [saleNotes, setSaleNotes] = useState<string>('');

  useEffect(() => {
    // Sayfa yüklenince tüm gerekli verileri arka planda topla
    const fetchWizardData = async () => {
      try {
        const [partyRes, userRes, stockRes, typeRes, curRes] = await Promise.all([
          partiesAPI.getAll({ type: 'customer', state: 1, limit: 100 }), // Sadece aktif müşteriler
          usersAPI.getAll({ state: 1, limit: 100 }), // Sadece aktif kullanıcılar (temsilciler)
          stocksAPI.getAll({ limit: 500 }), // Depo stokları
          salesAPI.getTypes(),
          currenciesAPI.getAll()
        ]);

        setCustomers(partyRes.data.data);
        setRepresentatives(userRes.data.data);
        setStocks(stockRes.data.data);
        setSaleTypes(typeRes.data);

        const tl = curRes.data.find((c: any) => c.code === 'TRY');
        if (tl) setCurrencyTLId(tl.id);

      } catch (error) {
        console.error("Satış sihirbazı veri çekme hatası", error);
      }
    };
    fetchWizardData();
  }, []);

  // Stok listesini itemId'ye göre grupla ki ekranda "Depo1: 5 adet, Merkez: 2 Adet" yazabilelim
  const groupedStocks = stocks.reduce((acc: any, stock: any) => {
    const itemName = stock.item?.name;
    if (!itemName) return acc;
    if (!acc[itemName]) {
      acc[itemName] = { item: stock.item, details: [] };
    }
    acc[itemName].details.push({
      deptName: stock.department?.name || 'Bilinmeyen Depo',
      qty: Number(stock.quantity)
    });
    return acc;
  }, {});

  // Ürün arama fonksiyonu
  const searchResults = Object.keys(groupedStocks).filter(name => name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleAddToCart = (group: any) => {
    // Zaten ekliyse uyarı
    if (cart.find(c => c.item.id === group.item.id)) return;
    setCart([...cart, { item: group.item, qty: 1, price: group.item.salePrice || 0, maxQtyDesc: group.details.map((d: any) => `${d.deptName}: ${d.qty}`).join(' | ') }]);
  };

  const updateCartItem = (itemId: number, field: string, val: number) => {
    setCart(cart.map(c => c.item.id === itemId ? { ...c, [field]: val } : c));
  };

  const removeCartItem = (itemId: number) => {
    setCart(cart.filter(c => c.item.id !== itemId));
  };

  const calculateTotal = () => {
    let rawTotal = 0;
    cart.forEach(c => { rawTotal += (c.qty * c.price); });
    return rawTotal;
  };

  const rawGrandTotal = calculateTotal();
  const kaporaNum = Number(deposit) || 0;
  const netTotal = rawGrandTotal - kaporaNum;

  const handleSubmit = async () => {
    if (cart.length === 0) return alert("Sepette ürün yok!");
    if (kaporaNum > rawGrandTotal) return alert("Kapora, toplam tutardan büyük olamaz!");

    // Backend Not alanına Fatura tipi ve temsilci datasını gizle (Sales tablomuza bu şekilde destek)
    const combinedNotes = `Temsilci: ${representatives.find(r => r.id === Number(repId))?.fullName || 'Bilinmiyor'}\nFatura Durumu: ${invoiceType === 'billed' ? 'FATURALI' : 'FATURASIZ'}\nEk Not: ${saleNotes}`.toUpperCase();

    const payload = {
      partyId: Number(partyId),
      saleTypeId: saleTypes.length > 0 ? saleTypes[0].id : 1, // Sistemde ilk type
      currencyId: currencyTLId,
      deliveryDate: deliveryDate,
      deposit: kaporaNum,
      notes: combinedNotes,
      items: cart.map(c => ({
        itemId: c.item.id,
        quantity: c.qty,
        price: c.price,
        kdvRate: c.item.kdv || 20 // Default KDV
      }))
    };

    try {
      await salesAPI.create(payload);
      // Başarı sonrası f5 interceptorda, ama biz wizardı resetleyelim
    } catch (err) {
      console.error(err);
      alert("Satış işlemi kaydedilirken hata oluştu.");
    }
  };

  return (
    <div className="page-container" style={{ padding: '0', height: 'calc(100vh - 64px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

      {/* ─── ÜST HEADER (Numara ve Breadcrumb) ─── */}
      <div style={{ background: 'var(--inverse-surface)', color: 'white', padding: '1.5rem 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ color: 'var(--outline)', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '2px', marginBottom: '5px' }}>YENİ SİPARİŞ & SATIŞ FİŞİ</p>
          {/* KURALLARDAN: DİKKAT ÇEKİCİ SİPARİŞ NUMARASI */}
          <h1 style={{ fontSize: '2.5rem', color: '#ffcc00', letterSpacing: '1px', textShadow: '0 2px 10px rgba(255,204,0,0.2)' }}>SİPARİŞ NO: (OTOMATİK OLUŞTURULACAK)</h1>
        </div>

        {/* Wizard İlerleme Çubuğu */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          {[1, 2, 3, 4].map((num) => (
            <div key={num} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800',
                background: step >= num ? 'var(--primary)' : 'rgba(255,255,255,0.1)', color: 'white'
              }}>{num}</div>
              {num < 4 && <div style={{ height: '2px', width: '30px', background: step > num ? 'var(--primary)' : 'rgba(255,255,255,0.1)' }} />}
            </div>
          ))}
        </div>
      </div>

      {/* ─── DİNAMİK WIZARD ALANI ─── */}
      <div style={{ flex: 1, background: 'var(--background)', padding: '2.5rem 3rem', overflowY: 'auto' }}>
        <div className="login-box" style={{ maxWidth: step === 4 ? '1100px' : '700px', margin: '0 auto', width: '100%' }}>

          {/* ADIM 1: CARİ SEÇİMİ */}
          {step === 1 && (
            <div className="wizard-step">
              <h3 style={{ color: 'var(--primary)', marginBottom: '20px', fontSize: '1.4rem' }}>1. Müşteri (Cari) Seçimi</h3>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Satışın Yapılacağı Tarih</label>
                {/* BUGÜNÜ ÇEKECEK VE DEĞİŞMEYECEK */}
                <input type="text" className="uppercase-input" value={new Date().toLocaleDateString('tr-TR')} disabled style={{ opacity: 0.7 }} />
              </div>

              <div className="form-group">
                <label>Cari Hesap (Müşteri) Seçiniz</label>
                <select className="uppercase-input" value={partyId} onChange={(e) => setPartyId(e.target.value)}>
                  <option value="">-- LÜTFEN BİR MÜŞTERİ SEÇİNİZ --</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <button className="btn btn-primary" style={{ width: '100%', height: '55px', marginTop: '2rem', fontSize: '1rem' }} disabled={!partyId} onClick={() => setStep(2)}>
                İLERLE: TESLİMAT BİLGİLERİ ➔
              </button>
            </div>
          )}

          {/* ADIM 2: TESLİMAT VE DETAYLAR */}
          {step === 2 && (
            <div className="wizard-step">
              <h3 style={{ color: 'var(--primary)', marginBottom: '20px', fontSize: '1.4rem' }}>2. Satış ve Fatura Detayları</h3>
              <p style={{ background: '#fef3c7', padding: '10px', borderRadius: '8px', color: '#b45309', marginBottom: '20px', fontSize: '12px', fontWeight: 600 }}>
                Seçili Cari: {customers.find(c => c.id === Number(partyId))?.name} (Değiştirilemez)
              </p>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Teslimat Tarihi</label>
                {/* GEÇMİŞ TARİH SEÇİLEMEYECEK (min={today}) */}
                <input type="date" className="uppercase-input" value={deliveryDate} min={today} onChange={(e) => setDeliveryDate(e.target.value)} />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Satış Temsilcisi (Prim Ataması İçin)</label>
                <select className="uppercase-input" value={repId} onChange={(e) => setRepId(e.target.value)}>
                  <option value="">-- TEMSİLCİ SEÇİNİZ --</option>
                  {representatives.map(r => <option key={r.id} value={r.id}>{r.fullName}</option>)}
                </select>
              </div>

              {/* RADYO BUTONLAR ZORUNLU OLACAK */}
              <div className="form-group" style={{ padding: '20px', background: 'var(--surface-container-low)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <label style={{ fontSize: '1rem', color: 'var(--error)' }}>Fatura Kesilecek mi? (Zorunlu Seçim)*</label>
                <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                  <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 700 }}>
                    <input type="radio" name="inv" checked={invoiceType === 'billed'} onChange={() => setInvoiceType('billed')} style={{ transform: 'scale(1.5)' }} /> FATURALI İŞLEM
                  </label>
                  <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 700 }}>
                    <input type="radio" name="inv" checked={invoiceType === 'unbilled'} onChange={() => setInvoiceType('unbilled')} style={{ transform: 'scale(1.5)' }} /> FATURASIZ İŞLEM
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '2rem' }}>
                <button className="btn" style={{ flex: 0.3, background: '#e2e8f0', height: '55px' }} onClick={() => setStep(1)}>GERİ DÖN</button>
                {/* invoiceType Seçilmeden Alta geçilmeyecek (disabled = !invoiceType || !repId) */}
                <button className="btn btn-primary" style={{ flex: 1, height: '55px', fontSize: '1rem' }} disabled={!invoiceType || !repId} onClick={() => setStep(3)}>
                  İLERLE: ÜRÜN SEÇİMİ ➔
                </button>
              </div>
            </div>
          )}

          {/* ADIM 3: STOK & ÜRÜN SEPETİ */}
          {step === 3 && (
            <div className="wizard-step" style={{ width: '100%' }}>
              <h3 style={{ color: 'var(--primary)', marginBottom: '10px', fontSize: '1.4rem' }}>3. Ürün Listesi ve Sepet</h3>

              {/* Sepete Eklenmiş Ürünler */}
              {cart.length > 0 && (
                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', marginBottom: '20px', border: '2px dashed var(--primary)' }}>
                  <h4 style={{ marginBottom: '10px', fontSize: '0.9rem', color: 'var(--primary)' }}>SEPETİNİZDEKİ ÜRÜNLER</h4>
                  <table style={{ background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
                    <thead><tr><th>ÜRÜN ADI</th><th>MİKTAR</th><th>BİRİM FİYAT</th><th>TUTAR</th><th>İŞLEM</th></tr></thead>
                    <tbody>
                      {cart.map((c, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 800 }}>{c.item.name} <br /><span style={{ fontSize: '10px', color: 'gray' }}>Mevcut: {c.maxQtyDesc}</span></td>
                          <td><input type="number" value={c.qty} min={1} style={{ width: '60px', padding: '5px' }} onChange={(e) => updateCartItem(c.item.id, 'qty', Number(e.target.value))} /></td>
                          <td><input type="number" step="0.01" value={c.price} style={{ width: '90px', padding: '5px' }} onChange={(e) => updateCartItem(c.item.id, 'price', Number(e.target.value))} /> ₺</td>
                          <td className="tabular-nums" style={{ color: 'var(--success)', fontWeight: 800 }}>{(c.qty * c.price).toLocaleString('tr-TR')} ₺</td>
                          <td><button className="btn" style={{ padding: '5px 10px', color: 'red' }} onClick={() => removeCartItem(c.item.id)}>Çıkar</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '15px' }}>
                <input type="text" className="search-bar" placeholder="🔍 Ürün Ara (Adına Göre)..." style={{ width: '100%', height: '50px', fontSize: '1rem' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>

              {/* Aranan Stoklar (Depolara Göre Bölünmüş) */}
              <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '12px' }}>
                {searchResults.map((itemName: any) => {
                  const group = groupedStocks[itemName];
                  return (
                    <div key={group.item.id} style={{ padding: '15px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ fontSize: '1rem', color: 'var(--on-surface)' }}>{itemName}</strong>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '5px', fontWeight: 700, letterSpacing: '0.5px' }}>
                          {group.details.map((d: any) => `${d.deptName}: "${d.qty} Adet"`).join(' --- ')}
                        </p>
                      </div>
                      <button className="btn btn-primary" style={{ padding: '0 20px', height: '40px' }} onClick={() => handleAddToCart(group)}>Sepete Ekle</button>
                    </div>
                  )
                })}
                {searchResults.length === 0 && <p style={{ padding: '20px', textAlign: 'center', color: 'gray' }}>Ürün aranıyor veya bulunamadı.</p>}
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '2rem' }}>
                <button className="btn" style={{ flex: 0.3, background: '#e2e8f0', height: '55px' }} onClick={() => setStep(2)}>GERİ DÖN</button>
                <button className="btn btn-primary" style={{ flex: 1, height: '55px', fontSize: '1rem' }} disabled={cart.length === 0} onClick={() => setStep(4)}>
                  SİPARİŞİ TAMAMLA VE ÖDEME AL ➔
                </button>
              </div>
            </div>
          )}

          {/* ADIM 4: FİNAL - KAPORA - İSKONTO - BÜYÜK SATIŞ BUTONU */}
          {step === 4 && (
            <div className="wizard-step" style={{ width: '100%' }}>
              <h3 style={{ color: 'var(--primary)', marginBottom: '20px', fontSize: '1.8rem', textAlign: 'center' }}>Sipariş Özeti ve Tamamlama</h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '30px' }}>

                {/* SOL TARAF: KAPORA ALANI */}
                <div style={{ background: '#fdf8f6', padding: '2rem', borderRadius: '20px', border: '2px solid #fee2e2' }}>
                  <h4 style={{ color: 'var(--error)', fontSize: '1.2rem', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    💸 Kapora Tutarı Belirle
                  </h4>
                  <p style={{ fontSize: '13px', color: 'gray', marginBottom: '20px' }}>Lütfen müşteriden alınan kapora miktarını giriniz (Harf Girilemez). Tutar yoksa "0" yazınız.</p>

                  <div className="form-group">
                    <input
                      type="text" // Type text ama regex ile engelli
                      className="uppercase-input tabular-nums"
                      style={{ fontSize: '2rem', height: '80px', textAlign: 'center', color: 'var(--error)', fontWeight: 900 }}
                      placeholder="0.00"
                      value={deposit}
                      onChange={(e) => setDeposit(e.target.value.replace(/[^0-9.]/g, ''))}
                    />
                  </div>
                  <p style={{ marginTop: '10px', textAlign: 'center', fontWeight: 800, color: deposit === '' ? 'red' : 'green' }}>
                    {deposit === '' ? "Satışı tamamlamak için alanı doldurun!" : "Onaylandı, satış detayı yanda açıldı ➔"}
                  </p>

                  <div className="form-group" style={{ marginTop: '20px' }}>
                    <label>Sipariş Notu</label>
                    <textarea className="uppercase-input" style={{ height: '80px', padding: '10px', fontFamily: 'inherit' }} value={saleNotes} onChange={e => setSaleNotes(e.target.value.toUpperCase())} placeholder="..." />
                  </div>
                </div>

                {/* SAĞ TARAF: FİYAT VE SATIŞ ONAY (Kapora girilmeden şeffaf duracak) */}
                <div style={{ padding: '2rem', borderRadius: '20px', background: 'var(--surface-container-low)', opacity: deposit === '' ? 0.3 : 1, transition: '0.3s all', pointerEvents: deposit === '' ? 'none' : 'auto' }}>
                  <h4 style={{ color: 'var(--primary)', fontSize: '1.2rem', marginBottom: '15px' }}>Satış Tutarı Detayları</h4>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '1.1rem' }}>
                    <span style={{ color: 'gray', fontWeight: 600 }}>Ara Toplam:</span>
                    <span className="tabular-nums" style={{ fontWeight: 800 }}>{rawGrandTotal.toLocaleString('tr-TR')} ₺</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '1.1rem', color: 'var(--error)' }}>
                    <span style={{ fontWeight: 600 }}>Alınan Kapora:</span>
                    <span className="tabular-nums" style={{ fontWeight: 800 }}>- {kaporaNum.toLocaleString('tr-TR')} ₺</span>
                  </div>

                  <div style={{ height: '2px', background: 'var(--border)', margin: '20px 0' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', fontSize: '1.4rem', color: 'var(--success)' }}>
                    <span style={{ fontWeight: 800 }}>KALAN (NET TUTAR):</span>
                    <span className="tabular-nums" style={{ fontWeight: 900 }}>{netTotal.toLocaleString('tr-TR')} ₺</span>
                  </div>

                  {/* KAPORA BOŞSA BUTON PASİF GRİ, DOLUYSA YEŞİL VE AKTİF */}
                  <button
                    className="btn"
                    style={{
                      width: '100%',
                      height: '70px',
                      fontSize: '1.2rem',
                      fontWeight: 900,
                      background: deposit === '' ? '#e2e8f0' : '#10b981',
                      color: deposit === '' ? 'gray' : 'white',
                      boxShadow: deposit === '' ? 'none' : '0 10px 25px rgba(16, 185, 129, 0.4)'
                    }}
                    disabled={deposit === ''}
                    onClick={handleSubmit}
                  >
                    ✓ SATIŞI ONAYLA VE KAYDET
                  </button>

                  <button className="btn" style={{ width: '100%', height: '40px', marginTop: '15px', background: 'transparent', color: 'gray' }} onClick={() => setStep(3)}>Geri Dön</button>
                </div>

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}