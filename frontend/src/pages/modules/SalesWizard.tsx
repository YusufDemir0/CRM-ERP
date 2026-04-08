import React, { useState, useEffect } from 'react';
import { partiesAPI, usersAPI, stocksAPI, salesAPI, currenciesAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function SalesWizard() {
  const[step, setStep] = useState(1);
  const getLocalDateString = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };
  const today = getLocalDateString();
  // ─── VERİLER ───
  const [customers, setCustomers] = useState<any[]>([]);
  const [representatives, setRepresentatives] = useState<any[]>([]);
  const [stocks, setStocks] = useState<any[]>([]);
  const[saleTypes, setSaleTypes] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);

  // ─── FORM STATES ───
  const [partyId, setPartyId] = useState<string>('');
  const [repId, setRepId] = useState<string>('');
  const[invoiceType, setInvoiceType] = useState<'billed' | 'unbilled' | null>(null);
  const[deliveryDate, setDeliveryDate] = useState<string>(today);
  const [saleTypeId, setSaleTypeId] = useState<string>('');
  const [currencyId, setCurrencyId] = useState<string>('');

  // ─── SEPET ───
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<any[]>([]);

  // ─── ÖDEME & FİNAL ───
  const [deposit, setDeposit] = useState<string>(''); 
  const [saleNotes, setSaleNotes] = useState<string>('');
  
  // Fatura altı Genel İskonto
  const[genDiscountType, setGenDiscountType] = useState<'amount' | 'percent'>('amount');
  const[genDiscountValue, setGenDiscountValue] = useState<string>('0');

  useEffect(() => {
    const fetchWizardData = async () => {
      try {
        const[partyRes, userRes, stockRes, typeRes, curRes] = await Promise.all([
          partiesAPI.getAll({ type: 'customer', state: 1, limit: 500 }), 
          usersAPI.getAll({ state: 1, limit: 100 }), 
          stocksAPI.getAll({ limit: 500 }), 
          salesAPI.getTypes(),
          currenciesAPI.getAll()
        ]);

        setCustomers(partyRes.data.data);
        setRepresentatives(userRes.data.data);
        setStocks(stockRes.data.data);
        setSaleTypes(typeRes.data);
        setCurrencies(curRes.data);

        // Varsayılan Satış Tipi ve TL ataması
        if (typeRes.data.length > 0) setSaleTypeId(typeRes.data[0].id.toString());
        const tl = curRes.data.find((c: any) => c.code === 'TRY');
        if (tl) setCurrencyId(tl.id.toString());

      } catch (error) {
        console.error("Satış sihirbazı veri çekme hatası", error);
      }
    };
    fetchWizardData();
  },[]);

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

  const searchResults = Object.keys(groupedStocks).filter(name => name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleAddToCart = (group: any) => {
    if (cart.find(c => c.item.id === group.item.id)) return;
    setCart([...cart, { 
      item: group.item, 
      qty: 1, 
      price: Number(group.item.salePrice) || 0, 
      discountType: 'amount', 
      discountValue: 0, 
      kdvRate: Number(group.item.kdv) || 20,
      maxQtyDesc: group.details.map((d: any) => `${d.deptName}: ${d.qty}`).join(' | ') 
    }]);
  };

  const updateCartItem = (itemId: number, field: string, val: any) => {
    setCart(cart.map(c => c.item.id === itemId ? { ...c, [field]: val } : c));
  };

  const removeCartItem = (itemId: number) => {
    setCart(cart.filter(c => c.item.id !== itemId));
  };

  // Sepet Finansal Hesaplamaları
  const calculateFinances = () => {
    let rawTotalAmount = 0;
    let totalKdv = 0;

    cart.forEach(c => {
      let netP = Number(c.price) || 0;
      const dVal = Number(c.discountValue) || 0;
      
      // Satır bazlı indirim
      if (c.discountType === 'amount') netP -= dVal;
      else if (c.discountType === 'percent') netP *= (1 - dVal / 100);
      
      const subtotal = Number(c.qty) * netP;
      const kdv = subtotal * (Number(c.kdvRate) / 100);

      rawTotalAmount += subtotal;
      totalKdv += kdv;
    });

    let discountedTotalAmount = rawTotalAmount;
    const gDiscountNum = Number(genDiscountValue) || 0;

    // Fatura altı (Genel) İndirim
    if (genDiscountType === 'amount') {
      discountedTotalAmount -= gDiscountNum;
    } else {
      discountedTotalAmount -= (discountedTotalAmount * (gDiscountNum / 100));
    }

    const grandTotal = discountedTotalAmount + totalKdv;
    const kaporaNum = Number(deposit) || 0;
    const netTotal = grandTotal - kaporaNum;

    return { rawTotalAmount, discountedTotalAmount, totalKdv, grandTotal, netTotal, kaporaNum, gDiscountNum };
  };

  const finances = calculateFinances();
  const selectedCurrencySymbol = currencies.find(c => c.id === Number(currencyId))?.symbol || '₺';

  const handleSubmit = async () => {
    if (cart.length === 0) {
      toast.error("Sepette ürün yok!");
      return;
    }
    if (finances.kaporaNum > finances.grandTotal) {
      toast.error("Kapora, genel toplamdan büyük olamaz!");
      return;
    }

    const combinedNotes = `Temsilci: ${representatives.find(r => r.id === Number(repId))?.fullName || 'Bilinmiyor'}\nFatura Durumu: ${invoiceType === 'billed' ? 'FATURALI' : 'FATURASIZ'}\nEk Not: ${saleNotes}`.toUpperCase();

    const payload = {
      partyId: Number(partyId),
      saleTypeId: Number(saleTypeId),
      currencyId: Number(currencyId),
      deliveryDate: deliveryDate,
      deposit: finances.kaporaNum,
      notes: combinedNotes,
      discountAmount: genDiscountType === 'amount' ? finances.gDiscountNum : 0,
      discountPercent: genDiscountType === 'percent' ? finances.gDiscountNum : 0,
      items: cart.map(c => ({
        itemId: c.item.id,
        quantity: Number(c.qty),
        price: Number(c.price),
        kdvRate: Number(c.kdvRate),
        discountAmount: c.discountType === 'amount' ? Number(c.discountValue) : 0,
        discountPercent: c.discountType === 'percent' ? Number(c.discountValue) : 0,
      }))
    };

    try {
      await salesAPI.create(payload);
      // Optional: Add success toast or navigation
    } catch (err) {
      console.error(err);
      toast.error("Satış işlemi kaydedilirken hata oluştu.");
    }
  };

  return (
    <div className="page-container" style={{ padding: '0', height: 'calc(100vh - 64px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

      {/* ─── HEADER ─── */}
      <div style={{ background: 'var(--inverse-surface)', color: 'white', padding: '1.5rem 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ color: 'var(--outline)', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '2px', marginBottom: '5px' }}>YENİ SİPARİŞ & SATIŞ FİŞİ</p>
          <h1 style={{ fontSize: '2.5rem', color: '#ffcc00', letterSpacing: '1px', textShadow: '0 2px 10px rgba(255,204,0,0.2)' }}>SİPARİŞ NO: (OTOMATİK OLUŞTURULACAK)</h1>
        </div>

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

      <div style={{ flex: 1, background: 'var(--background)', padding: '2.5rem 3rem', overflowY: 'auto' }}>
        <div className="login-box" style={{ maxWidth: step === 4 ? '1100px' : step === 3 ? '1200px' : '700px', margin: '0 auto', width: '100%', transition: 'all 0.3s ease' }}>

          {/* ADIM 1: CARİ SEÇİMİ */}
          {step === 1 && (
            <div className="wizard-step animate-in">
              <h3 style={{ color: 'var(--primary)', marginBottom: '20px', fontSize: '1.4rem' }}>1. Müşteri (Cari) Seçimi</h3>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Sisteme Giriş Tarihi (Bugün)</label>
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
                İLERLE: TESLİMAT & İŞLEM DETAYI ➔
              </button>
            </div>
          )}

          {/* ADIM 2: TESLİMAT VE SATIŞ ŞARTLARI */}
          {step === 2 && (
            <div className="wizard-step animate-in">
              <h3 style={{ color: 'var(--primary)', marginBottom: '20px', fontSize: '1.4rem' }}>2. Satış ve Fatura Detayları</h3>
              <p style={{ background: '#fef3c7', padding: '10px', borderRadius: '8px', color: '#b45309', marginBottom: '20px', fontSize: '12px', fontWeight: 600 }}>
                Seçili Cari: {customers.find(c => c.id === Number(partyId))?.name}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '1.5rem' }}>
                 <div className="form-group">
                   <label>Satış Türü (Şartlar)</label>
                   <select className="uppercase-input" style={{ appearance: 'none' }} value={saleTypeId} onChange={(e) => setSaleTypeId(e.target.value)}>
                     {saleTypes.map(t => <option key={t.id} value={t.id}>{t.name} ({t.abbreviation})</option>)}
                   </select>
                 </div>
                 <div className="form-group">
                   <label>İşlem Para Birimi</label>
                   <select className="uppercase-input" style={{ appearance: 'none' }} value={currencyId} onChange={(e) => setCurrencyId(e.target.value)}>
                     {currencies.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                   </select>
                 </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label>Teslimat Tarihi</label>
                  <input type="date" className="uppercase-input" value={deliveryDate} min={today} onChange={(e) => setDeliveryDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Satış Temsilcisi (Sorumlu)</label>
                  <select className="uppercase-input" style={{ appearance: 'none' }} value={repId} onChange={(e) => setRepId(e.target.value)}>
                    <option value="">-- TEMSİLCİ SEÇİNİZ --</option>
                    {representatives.map(r => <option key={r.id} value={r.id}>{r.fullName}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ padding: '20px', background: 'var(--surface-container-low)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <label style={{ fontSize: '1rem', color: 'var(--error)' }}>Fatura Kesilecek mi? (Zorunlu Seçim)*</label>
                <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                  <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 700 }}>
                    <input type="radio" name="inv" checked={invoiceType === 'billed'} onChange={() => setInvoiceType('billed')} style={{ transform: 'scale(1.4)', accentColor: 'var(--primary)' }} /> FATURALI İŞLEM
                  </label>
                  <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 700 }}>
                    <input type="radio" name="inv" checked={invoiceType === 'unbilled'} onChange={() => setInvoiceType('unbilled')} style={{ transform: 'scale(1.4)', accentColor: 'var(--primary)' }} /> FATURASIZ (SEVK)
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '2rem' }}>
                <button className="btn" style={{ flex: 0.3, background: '#e2e8f0', height: '55px' }} onClick={() => setStep(1)}>GERİ DÖN</button>
                <button className="btn btn-primary" style={{ flex: 1, height: '55px', fontSize: '1rem' }} disabled={!invoiceType || !repId || !saleTypeId || !currencyId} onClick={() => setStep(3)}>
                  İLERLE: ÜRÜN SEPETİ ➔
                </button>
              </div>
            </div>
          )}

          {/* ADIM 3: STOK & ÜRÜN SEPETİ */}
          {step === 3 && (
            <div className="wizard-step animate-in" style={{ width: '100%' }}>
              <h3 style={{ color: 'var(--primary)', marginBottom: '15px', fontSize: '1.4rem' }}>3. Ürün Listesi ve Sepet</h3>

              {cart.length > 0 && (
                <div style={{ background: 'var(--surface-container)', padding: '15px', borderRadius: '12px', marginBottom: '20px', border: '1px solid var(--primary-glow)' }}>
                  <table style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', width: '100%', fontSize: '13px' }}>
                    <thead><tr><th>ÜRÜN</th><th>MİKTAR</th><th>B.FİYAT</th><th>İNDİRİM</th><th>KDV</th><th>TUTAR ({selectedCurrencySymbol})</th><th></th></tr></thead>
                    <tbody>
                      {cart.map((c, i) => {
                        let netP = Number(c.price);
                        if (c.discountType === 'amount') netP -= Number(c.discountValue) || 0;
                        else if (c.discountType === 'percent') netP *= (1 - (Number(c.discountValue) || 0) / 100);
                        const subtotal = Number(c.qty) * netP;
                        const kdv = subtotal * (Number(c.kdvRate) / 100);
                        
                        return (
                          <tr key={i}>
                            <td style={{ fontWeight: 700, padding: '10px' }}>{c.item.name} <br /><span style={{ fontSize: '10px', color: 'gray' }}>Mevcut: {c.maxQtyDesc}</span></td>
                            <td style={{ padding: '10px' }}><input type="number" value={c.qty} min={1} style={{ width: '60px', padding: '5px', borderRadius: '4px', border: '1px solid #cbd5e1' }} onChange={(e) => updateCartItem(c.item.id, 'qty', e.target.value)} /></td>
                            <td style={{ padding: '10px' }}><input type="number" step="0.01" value={c.price} style={{ width: '80px', padding: '5px', borderRadius: '4px', border: '1px solid #cbd5e1' }} onChange={(e) => updateCartItem(c.item.id, 'price', e.target.value)} /></td>
                            <td style={{ padding: '10px' }}>
                              <div style={{ display: 'flex', gap: '2px', border: '1px solid #cbd5e1', borderRadius: '4px', overflow: 'hidden', background: 'white' }}>
                                <input type="number" step="any" value={c.discountValue} onChange={e => updateCartItem(c.item.id, 'discountValue', e.target.value)} style={{ width: '50px', padding: '4px', border: 'none', outline: 'none' }} placeholder="0" />
                                <select value={c.discountType} onChange={e => updateCartItem(c.item.id, 'discountType', e.target.value)} style={{ border: 'none', borderLeft: '1px solid #cbd5e1', background: '#f8fafc', padding: '2px', outline: 'none' }}>
                                  <option value="amount">{selectedCurrencySymbol}</option>
                                  <option value="percent">%</option>
                                </select>
                              </div>
                            </td>
                            <td style={{ padding: '10px' }}>
                               <select value={c.kdvRate} onChange={e => updateCartItem(c.item.id, 'kdvRate', e.target.value)} style={{ width: '60px', padding: '5px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                                 <option value="0">%0</option><option value="1">%1</option><option value="10">%10</option><option value="20">%20</option>
                               </select>
                            </td>
                            <td className="tabular-nums" style={{ color: 'var(--success)', fontWeight: 800, padding: '10px' }}>{(subtotal + kdv).toLocaleString('tr-TR', { maximumFractionDigits: 2 })}</td>
                            <td style={{ padding: '10px' }}><button className="btn" style={{ padding: '4px 8px', color: 'var(--error)', background: '#ffe4e6' }} onClick={() => removeCartItem(c.item.id)}>X</button></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '15px' }}>
                <input type="text" className="search-bar" placeholder="🔍 Stoka Göre Ürün Ara..." style={{ width: '100%', height: '50px', fontSize: '1rem', background: 'white', border: '1px solid var(--border)' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>

              <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '12px' }}>
                {searchResults.map((itemName: any) => {
                  const group = groupedStocks[itemName];
                  return (
                    <div key={group.item.id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ fontSize: '1rem', color: 'var(--on-surface)' }}>{itemName}</strong>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '5px', fontWeight: 700 }}>{group.details.map((d: any) => `${d.deptName}: "${d.qty}"`).join(' / ')}</p>
                      </div>
                      <button className="btn btn-primary" style={{ padding: '0 15px', height: '36px' }} onClick={() => handleAddToCart(group)}>Ekle</button>
                    </div>
                  )
                })}
                {searchResults.length === 0 && <p style={{ padding: '20px', textAlign: 'center', color: 'gray' }}>Ürün bulunamadı veya stoklarda yok.</p>}
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '2rem' }}>
                <button className="btn" style={{ flex: 0.3, background: '#e2e8f0', height: '55px' }} onClick={() => setStep(2)}>GERİ DÖN</button>
                <button className="btn btn-primary" style={{ flex: 1, height: '55px', fontSize: '1rem' }} disabled={cart.length === 0} onClick={() => setStep(4)}>
                  ÖDEME & SİPARİŞ ÖZETİ ➔
                </button>
              </div>
            </div>
          )}

          {/* ADIM 4: FİNAL - KAPORA - GENEL İSKONTO */}
          {step === 4 && (
            <div className="wizard-step animate-in" style={{ width: '100%' }}>
              <h3 style={{ color: 'var(--primary)', marginBottom: '20px', fontSize: '1.8rem', textAlign: 'center' }}>Sipariş Özeti ve Tamamlama</h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '40px', marginTop: '30px' }}>
                {/* SOL TARAF: FORM GİRİŞLERİ (İSKONTO, KAPORA, NOT) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* FATURA ALTI İNDİRİM BÖLÜMÜ */}
                  <div style={{ background: 'var(--surface-container-low)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
                     <label style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary)', display: 'block', marginBottom: '10px' }}>GENEL İSKONTO (FATURA ALTI İNDİRİMİ)</label>
                     <div style={{ display: 'flex', gap: '10px' }}>
                        <select className="uppercase-input" style={{ width: '80px', appearance: 'none', background: 'white' }} value={genDiscountType} onChange={e => setGenDiscountType(e.target.value as 'amount'|'percent')}>
                           <option value="amount">{selectedCurrencySymbol}</option>
                           <option value="percent">%</option>
                        </select>
                        <input type="text" className="uppercase-input tabular-nums" placeholder="0" style={{ flex: 1 }} value={genDiscountValue} onChange={e => setGenDiscountValue(e.target.value.replace(/[^0-9.]/g, ''))} />
                     </div>
                  </div>

                  {/* KAPORA ALANI */}
                  <div style={{ background: '#fdf8f6', padding: '1.5rem', borderRadius: '16px', border: '2px solid #fee2e2' }}>
                    <h4 style={{ color: 'var(--error)', fontSize: '1.1rem', marginBottom: '10px', display: 'flex', alignItems: 'center' }}>💸 Kapora Alındı Mı?</h4>
                    <p style={{ fontSize: '12px', color: 'gray', marginBottom: '15px' }}>Satışı sonlandırmak için onay veriyorsanız, kapora bilgisini doldurun. (Tutar yoksa "0" bırakın).</p>
                    <input type="text" className="uppercase-input tabular-nums" style={{ fontSize: '1.6rem', height: '60px', textAlign: 'center', color: 'var(--error)', fontWeight: 900 }} placeholder="0.00" value={deposit} onChange={(e) => setDeposit(e.target.value.replace(/[^0-9.]/g, ''))} />
                  </div>

                  <div className="form-group">
                    <label>Sipariş Notu</label>
                    <textarea className="uppercase-input" style={{ height: '70px', padding: '10px', fontFamily: 'inherit' }} value={saleNotes} onChange={e => setSaleNotes(e.target.value.toUpperCase())} placeholder="..." />
                  </div>

                </div>

                {/* SAĞ TARAF: FİNANSAL TABLO VE KAYDET */}
                <div style={{ padding: '2rem', borderRadius: '20px', background: 'var(--inverse-surface)', color: 'white', opacity: deposit === '' ? 0.6 : 1, transition: '0.3s all', display: 'flex', flexDirection: 'column' }}>
                  <h4 style={{ color: 'var(--outline)', fontSize: '1.1rem', marginBottom: '20px' }}>Tutar Detayları</h4>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '1.1rem' }}>
                    <span style={{ color: '#cbd5e1' }}>Mal/Hizmet Toplamı:</span>
                    <span className="tabular-nums" style={{ fontWeight: 600 }}>{finances.rawTotalAmount.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} {selectedCurrencySymbol}</span>
                  </div>

                  {finances.gDiscountNum > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '1rem', color: '#fca5a5' }}>
                      <span>Genel İndirim:</span>
                      <span className="tabular-nums">-{ (finances.rawTotalAmount - finances.discountedTotalAmount).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} {selectedCurrencySymbol}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '1.1rem' }}>
                    <span style={{ color: '#cbd5e1' }}>Toplam KDV:</span>
                    <span className="tabular-nums" style={{ fontWeight: 600 }}>+{finances.totalKdv.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} {selectedCurrencySymbol}</span>
                  </div>
                  
                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.2)', margin: '15px 0' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '1.3rem', color: 'var(--outline)' }}>
                    <span style={{ fontWeight: 800 }}>GENEL TOPLAM:</span>
                    <span className="tabular-nums" style={{ fontWeight: 800 }}>{finances.grandTotal.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} {selectedCurrencySymbol}</span>
                  </div>

                  {finances.kaporaNum > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '1.1rem', color: '#fca5a5' }}>
                      <span style={{ fontWeight: 600 }}>Alınan Kapora:</span>
                      <span className="tabular-nums" style={{ fontWeight: 800 }}>-{finances.kaporaNum.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} {selectedCurrencySymbol}</span>
                    </div>
                  )}

                  <div style={{ padding: '15px', background: 'var(--success)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', marginBottom: '20px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800 }}>KALAN BAKİYE:</span>
                    <span className="tabular-nums" style={{ fontSize: '1.6rem', fontWeight: 900 }}>{finances.netTotal.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} {selectedCurrencySymbol}</span>
                  </div>

                  <button
                    className="btn"
                    style={{
                      width: '100%', height: '60px', fontSize: '1.1rem', fontWeight: 900,
                      background: deposit === '' ? 'rgba(255,255,255,0.2)' : 'white',
                      color: deposit === '' ? '#cbd5e1' : 'var(--inverse-surface)',
                    }}
                    disabled={deposit === ''}
                    onClick={handleSubmit}
                  >
                    SİPARİŞİ ONAYLA VE OLUŞTUR
                  </button>

                  <button className="btn" style={{ width: '100%', height: '40px', marginTop: '10px', background: 'transparent', color: '#cbd5e1' }} onClick={() => setStep(3)}>Geri Dön</button>
                </div>

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}