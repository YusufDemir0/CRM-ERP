import React, { useState, useEffect, useMemo } from 'react';
import { FiCheck, FiPlus, FiTrash2, FiSearch, FiInfo } from 'react-icons/fi';
import { useSalesWizardStore } from '../../../store/useSalesWizardStore';
import { useSalesWizard } from '../../../hooks/useSalesWizard';
import { SearchableSelect } from '../../../components/common/SearchableSelect';
import { ProductPhase } from './components/ProductPhase';
import { WizardSummary } from './components/WizardSummary';
import { PhoneInput } from '../../../components/common/PhoneInput';
import { FormField } from '../../../components/common/FormField';
import { useTurkiyeCities, useTurkiyeDistricts } from '../../../hooks/useTurkiyeApi';
import { useQuickCreateStore } from '../../../store/useQuickCreateStore';
import { Party } from '../../../types';

export const SaleWizard: React.FC<{ onCompleted: () => void }> = ({ onCompleted }) => {
  const store = useSalesWizardStore();
  const { openCreate } = useQuickCreateStore();
  const { customers, accounts, staff, items, handleSubmit, refreshLookups, department } = useSalesWizard(onCompleted);
  const [emailFocus, setEmailFocus] = useState(false);
  
  const { cities } = useTurkiyeCities();
  const { districts } = useTurkiyeDistricts(store.cityId || null);

  const customerOptions = useMemo(() => {
    const base = (customers || []).map(c => ({ id: c.id, label: c.name }));
    if (store.customer && !base.find(o => String(o.id) === String(store.customer?.id))) {
      base.unshift({ id: store.customer.id, label: store.customer.name });
    }
    return base;
  }, [customers, store.customer]);

  // Email domain extensions
  const domainExtensions = ['@gmail.com', '@hotmail.com', '@outlook.com'];

  // Adaptive Tax Label
  const getTaxLabel = () => {
    const len = store.taxId?.length || 0;
    if (len === 10) return 'VKN';
    if (len === 11) return 'TCKN';
    return 'VERGİ NO / T.C NO';
  };

  // Check if mandatory fields are completed
  const isMandatoryFilled = !!(
    store.customer && 
    store.staffId && 
    store.paymentAccount && 
    store.phone && 
    store.cityId && 
    store.district?.trim()
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 rounded-2xl border border-slate-200 shadow-premium overflow-hidden animate-in">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-100 shrink-0">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <span className="p-1.5 bg-[var(--primary-glow)] text-[var(--primary)] rounded-xl">
              <FiPlus size={20} />
            </span>
            SATIŞ SİHİRBAZI
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end mr-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SATIŞ NUMARASI</span>
            <span className="text-sm font-bold text-[var(--primary)] tracking-wider">
              S-{(department?.abbreviation || 'GEN').toUpperCase()}-2024-XXX
            </span>
          </div>
          <button 
            className="btn bg-slate-100 text-slate-500 font-bold h-10 px-6 rounded-xl hover:bg-slate-200 transition-all"
            onClick={() => { store.reset(); onCompleted(); }}
          >
            İPTAL
          </button>
          <button 
            className={`btn btn-primary px-8 h-10 font-black rounded-xl shadow-lg transition-all ${!isMandatoryFilled || store.selectedItems.length === 0 ? 'opacity-30 grayscale cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
            onClick={handleSubmit}
            disabled={!isMandatoryFilled || store.selectedItems.length === 0 || store.loading}
          >
            {store.loading ? 'İŞLENİYOR...' : 'SATIŞI TAMAMLA'}
          </button>
        </div>
      </div>

      {/* Main Content: 50/50 Split */}
      <div className="flex flex-1 overflow-hidden p-3 gap-3">
        
        {/* Left Side: Customer & Sale Details (50%) */}
        <div className="w-1/2 flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
          
          {/* Section 1: Customer Selection */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">MÜŞTERİ SEÇİMİ</h3>
               <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-100">
                  <button 
                    onClick={() => store.setIsNewInfo(false)}
                    className={`px-3 py-1 text-[10px] font-black rounded-md transition-all ${!store.isNewInfo ? 'bg-white shadow-sm text-[var(--primary)]' : 'text-slate-400'}`}
                  >
                    MEVCUT BİLGİLER
                  </button>
                  <button 
                    onClick={() => store.setIsNewInfo(true)}
                    className={`px-3 py-1 text-[10px] font-black rounded-md transition-all ${store.isNewInfo ? 'bg-white shadow-sm text-[var(--primary)]' : 'text-slate-400'}`}
                  >
                    YENİ BİLGİLER
                  </button>
               </div>
            </div>

            <div className="relative">
              <SearchableSelect
                placeholder="Müşteri ara veya seç..."
                options={customerOptions}
                value={store.customer?.id || null}
                onChange={(opt) => {
                  const c = (customers || []).find(x => x.id === opt?.id) || (store.customer?.id === opt?.id ? store.customer : null);
                  store.setCustomer(c || null);
                }}
              />
              <button 
                onClick={() => openCreate('party', { 
                  onSuccess: (res: unknown) => {
                    refreshLookups();
                    // 🛡️ API result could be { data: Party } or just Party depending on axios interceptor
                    const response = res as { data?: Party } & Party;
                    const newParty = response?.data ? response.data : response;
                    if (newParty && typeof newParty === 'object' && 'id' in newParty) {
                      store.setCustomer(newParty as Party);
                    }
                  }
                })}
                className="absolute right-0 -top-8 p-1.5 bg-[var(--success-glow)] text-[var(--success)] rounded-lg hover:bg-[var(--success)] hover:text-white transition-all z-10"
                title="Yeni Müşteri Ekle"
              >
                <FiPlus size={14} />
              </button>
            </div>

            {/* Customer Details Form */}
            <div className="grid grid-cols-2 gap-3">
               <FormField label="TEL 1">
                  <PhoneInput 
                    value={store.phone}
                    onChange={(val) => store.setPhone(val)}
                  />
               </FormField>
              <FormField label="E-POSTA" className="relative">
                <input 
                  type="email"
                  className="input-premium h-9 text-sm font-bold"
                  placeholder="ornek@mail.com"
                  value={store.email}
                  onChange={(e) => store.setEmail(e.target.value.toLowerCase())}
                  onFocus={() => setEmailFocus(true)}
                  onBlur={() => setTimeout(() => setEmailFocus(false), 200)}
                />
                {emailFocus && store.email && !store.email.includes('@') && (
                  <div className="absolute left-0 right-0 bg-white border border-slate-200 rounded-xl z-[110] shadow-2xl mt-1 overflow-hidden">
                    {domainExtensions.map(ext => (
                      <div 
                        key={ext} 
                        className="p-2 cursor-pointer hover:bg-slate-50 text-xs font-bold"
                        onClick={() => store.setEmail(store.email + ext)}
                      >
                        {store.email}<span className="text-[var(--primary)]">{ext}</span>
                      </div>
                    ))}
                  </div>
                )}
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="TEL 2">
                <PhoneInput 
                  value={store.phone2}
                  onChange={(val) => store.setPhone2(val)}
                />
              </FormField>
              <FormField label={getTaxLabel()}>
                <input 
                  className="input-premium h-9 text-sm font-bold tabular-nums"
                  placeholder="TCKN / VKN"
                  value={store.taxId}
                  onChange={(e) => store.setTaxId(e.target.value.replace(/\D/g, '').substring(0, 11))}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
               <FormField label="ŞEHİR / İL">
                  <select 
                    className="input-premium h-9 text-sm font-black"
                    value={store.cityId || 0}
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      const city = cities?.find(c => c.id === id);
                      store.setCityId(id);
                      store.setCity(city?.name.toUpperCase() || '');
                      store.setDistrict('');
                    }}
                  >
                    <option value={0}>SEÇİNİZ...</option>
                    {(cities || []).map(c => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
                  </select>
               </FormField>
               <FormField label="İLÇE / BÖLGE">
                  <select 
                    className="input-premium h-9 text-sm font-black"
                    disabled={!store.cityId}
                    value={store.district}
                    onChange={(e) => store.setDistrict(e.target.value.toUpperCase())}
                  >
                    <option value="">SEÇİNİZ...</option>
                    {(districts || []).map(d => <option key={d.id} value={d.name.toUpperCase()}>{d.name.toUpperCase()}</option>)}
                  </select>
               </FormField>
            </div>

            <FormField label="ADRES DETAYI">
              <textarea 
                className="input-premium w-full p-3 rounded-xl min-h-[60px] text-sm font-bold"
                value={store.address}
                onChange={(e) => store.setAddress(e.target.value.toLocaleUpperCase('tr-TR'))}
                placeholder="Mahalle, cadde, no..."
              />
            </FormField>
          </div>

          {/* Section 2: Sale Logistics */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
             <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">SATIŞ VE TESLİMAT</h3>
             
             <div className="grid grid-cols-2 gap-3">
                <FormField label="SATIŞ TARİHİ">
                  <input 
                    type="date"
                    className="input-premium h-9 text-sm font-bold"
                    value={store.date}
                    onChange={(e) => store.setDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </FormField>
                <FormField label="TESLİMAT TARİHİ">
                  <input 
                    type="date"
                    className="input-premium h-9 text-sm font-bold"
                    value={store.deliveryDate}
                    onChange={(e) => store.setDeliveryDate(e.target.value)}
                    min={store.date || new Date().toISOString().split('T')[0]}
                  />
                </FormField>
             </div>

             <div className="grid grid-cols-2 gap-3">
                <FormField label="ALINAN KAPORA (TL)">
                  <input 
                    type="number"
                    className="input-premium h-10 text-lg font-black text-[var(--success)] tabular-nums"
                    placeholder="0.00"
                    value={store.deposit}
                    onChange={(e) => store.setDeposit(Number(e.target.value))}
                  />
                </FormField>
                <div className="relative">
                  <SearchableSelect
                    label="SATIŞ TEMSİLCİSİ"
                    placeholder="Temsilci seç"
                    options={(staff || []).map(s => ({ id: String(s.id), label: `${s.firstName} ${s.lastName}` }))}
                    value={store.staffId ? String(store.staffId) : null}
                    onChange={(opt) => store.setStaffId(opt ? Number(opt.id) : null)}
                  />
                </div>
             </div>

             <div className="relative">
                <SearchableSelect
                  label="ÖDEME HESABI / KASA"
                  placeholder="Kasa seçin"
                  options={(accounts || []).map(a => ({ id: String(a.id), label: a.name }))}
                  value={store.paymentAccount?.id ? String(store.paymentAccount.id) : null}
                  onChange={(opt) => {
                    const a = accounts.find(x => String(x.id) === opt?.id);
                    store.setPaymentAccount(a || null);
                  }}
                />
             </div>

             <div className="grid grid-cols-2 gap-3">
                <FormField label="NEREDEN DUYDU?">
                  <select 
                    className="input-premium h-9 text-sm font-black"
                    value={store.source}
                    onChange={(e) => store.setSource(e.target.value)}
                  >
                    <option value="">SEÇİNİZ...</option>
                    <option value="INSTAGRAM">INSTAGRAM</option>
                    <option value="SAHIBINDEN">SAHİBİNDEN</option>
                    <option value="TAVSIYE">TAVSİYE</option>
                  </select>
                </FormField>
                <div className="flex bg-slate-50 p-1 mt-6 rounded-lg border border-slate-100 h-10">
                  <button 
                    onClick={() => store.setIsTaxed(true)}
                    className={`flex-1 py-1 rounded-md font-black text-[10px] transition-all ${store.isTaxed ? 'bg-white shadow-sm text-[var(--primary)]' : 'text-slate-400'}`}
                  >
                    FATURALI
                  </button>
                  <button 
                    onClick={() => store.setIsTaxed(false)}
                    className={`flex-1 py-1 rounded-md font-black text-[10px] transition-all ${!store.isTaxed ? 'bg-white shadow-sm text-[var(--primary)]' : 'text-slate-400'}`}
                  >
                    FATURASIZ
                  </button>
                </div>
             </div>

             <FormField label="SATIŞ NOTLARI">
                <textarea 
                  className="input-premium w-full p-3 rounded-xl min-h-[60px] text-sm font-bold"
                  placeholder="Notlarınızı buraya yazın..."
                  value={store.description}
                  onChange={(e) => store.setDescription(e.target.value)}
                />
              </FormField>
          </div>
        </div>

        {/* Right Side: Products & Summary (50%) */}
        <div className="w-1/2 flex flex-col gap-3 overflow-hidden">
          <div className={`flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden relative transition-opacity ${!isMandatoryFilled ? 'opacity-50 pointer-events-none' : ''}`}>
            {!isMandatoryFilled && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
                <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200 text-center max-w-xs">
                  <FiInfo className="text-3xl text-[var(--primary)] mx-auto mb-2" />
                  <p className="font-bold text-slate-700 text-sm">Ürün eklemek için önce müşteri ve temsilci bilgilerini doldurmalısınız.</p>
                </div>
              </div>
            )}
            <ProductPhase items={items} />
          </div>

          <div className={`shrink-0 transition-opacity ${!isMandatoryFilled ? 'opacity-50 pointer-events-none' : ''}`}>
            <WizardSummary />
          </div>
        </div>

      </div>
    </div>
  );
};
