import React from 'react';
import { Party, User, Currency, SaleType } from '../../../types';

interface Props {
  partyId: string;
  customers: Party[];
  saleTypeId: string;
  setSaleTypeId: (id: string) => void;
  currencyId: string;
  setCurrencyId: (id: string) => void;
  deliveryDate: string;
  setDeliveryDate: (val: string) => void;
  repId: string;
  setRepId: (id: string) => void;
  invoiceType: 'billed' | 'unbilled' | null;
  setInvoiceType: (val: 'billed' | 'unbilled') => void;
  saleTypes: SaleType[];
  currencies: Currency[];
  representatives: User[];
  today: string;
  onBack: () => void;
  onNext: () => void;
}

const Step2Details: React.FC<Props> = ({
  partyId, customers, saleTypeId, setSaleTypeId, currencyId, setCurrencyId,
  deliveryDate, setDeliveryDate, repId, setRepId, invoiceType, setInvoiceType,
  saleTypes, currencies, representatives, today, onBack, onNext
}) => {
  const selectedCustomer = customers.find(c => c.id === Number(partyId));

  return (
    <div className="wizard-step animate-in flex flex-col">
      <h3 className="text-primary text-2xl font-black tracking-tight mb-4 text-center sm:text-left">2. Satış ve Fatura Detayları</h3>
      
      <div className="bg-amber-50/80 p-4 rounded-2xl text-amber-800 mb-6 text-xs font-bold flex items-center gap-3 ring-1 ring-amber-100 border border-amber-200/50 shadow-sm">
        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-lg">ℹ️</div>
        <div>
          <div className="text-[10px] text-amber-600 uppercase tracking-widest opacity-70">SEÇİLİ CARİ HESAP</div>
          <div className="text-sm font-black tracking-tight">{selectedCustomer?.name || 'BELİRTİLMEMİŞ'}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
         <div className="form-group">
           <label>Satış Türü (Şartlar)</label>
           <div className="relative">
             <select className="uppercase-input appearance-none bg-slate-50 border-slate-200 focus:bg-white transition-all shadow-sm" value={saleTypeId} onChange={(e) => setSaleTypeId(e.target.value)}>
               {saleTypes.map(t => <option key={t.id} value={t.id}>{t.name} ({t.abbreviation})</option>)}
             </select>
             <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">▼</div>
           </div>
         </div>
         <div className="form-group">
           <label>İşlem Para Birimi</label>
           <div className="relative">
             <select className="uppercase-input appearance-none bg-slate-50 border-slate-200 focus:bg-white transition-all shadow-sm" value={currencyId} onChange={(e) => setCurrencyId(e.target.value)}>
               {currencies.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
             </select>
             <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">▼</div>
           </div>
         </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
        <div className="form-group">
          <label>Teslimat Tarihi</label>
          <input type="date" className="uppercase-input bg-slate-50 border-slate-200 focus:bg-white transition-all shadow-sm" value={deliveryDate} min={today} onChange={(e) => setDeliveryDate(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Satış Temsilcisi (Sorumlu)</label>
          <div className="relative">
            <select className="uppercase-input appearance-none bg-slate-50 border-slate-200 focus:bg-white transition-all shadow-sm" value={repId} onChange={(e) => setRepId(e.target.value)}>
              <option value="">-- TEMSİLCİ SEÇİNİZ --</option>
              {representatives.map(r => <option key={r.id} value={r.id}>{r.fullName}</option>)}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">▼</div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 mb-8 transition-colors hover:border-primary/20">
        <label className="text-base text-danger font-black mb-3 flex items-center gap-2">
          Fatura Kesilecek mi? <span className="text-[10px] bg-danger/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">Zorunlu Seçim</span>
        </label>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <label className="flex-1 cursor-pointer flex items-center gap-4 bg-white p-4 rounded-2xl border-2 border-transparent hover:border-primary/30 transition-all group has-[:checked]:border-primary has-[:checked]:bg-primary/5 shadow-sm">
            <input type="radio" name="inv" checked={invoiceType === 'billed'} onChange={() => setInvoiceType('billed')} className="w-5 h-5 accent-primary cursor-pointer" /> 
            <div className="flex flex-col">
              <span className="font-black text-slate-800 text-sm group-hover:text-primary transition-colors">FATURALI İŞLEM</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">RESMİ MUHASEBE KAYDI</span>
            </div>
          </label>
          <label className="flex-1 cursor-pointer flex items-center gap-4 bg-white p-4 rounded-2xl border-2 border-transparent hover:border-primary/30 transition-all group has-[:checked]:border-primary has-[:checked]:bg-primary/5 shadow-sm">
            <input type="radio" name="inv" checked={invoiceType === 'unbilled'} onChange={() => setInvoiceType('unbilled')} className="w-5 h-5 accent-primary cursor-pointer" /> 
            <div className="flex flex-col">
              <span className="font-black text-slate-800 text-sm group-hover:text-primary transition-colors">FATURASIZ (SEVK)</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">İÇ TAKİP / SEVKİYAT</span>
            </div>
          </label>
        </div>
      </div>

      <div className="flex gap-4 mt-auto pt-6 border-top border-slate-100">
        <button className="flex-[0.3] h-14 bg-white border-2 border-slate-200 text-slate-500 font-black hover:bg-slate-50 transition-all rounded-2xl active:scale-95 transition-transform" onClick={onBack}>GERİ</button>
        <button className="flex-1 h-14 bg-primary text-white text-base font-black shadow-lg shadow-primary/25 rounded-2xl disabled:opacity-30 disabled:shadow-none transition-all active:scale-[0.98] flex items-center justify-center gap-2" disabled={!invoiceType || !repId || !saleTypeId || !currencyId} onClick={onNext}>
          İLERLE: ÜRÜN SEPETİ ➔
        </button>
      </div>
    </div>
  );
};

export default Step2Details;
