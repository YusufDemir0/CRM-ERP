import { memo } from 'react';
import { Party } from '../../../types';

interface Props {
  partyId: string;
  setPartyId: (id: string) => void;
  customerSearch: string;
  setCustomerSearch: (val: string) => void;
  isCustomerDropdownOpen: boolean;
  setIsCustomerDropdownOpen: (val: boolean) => void;
  filteredCustomers: Party[];
  selectedCustomer?: Party;
  onNext: () => void;
}

const Step1Customer: React.FC<Props> = memo(({
  partyId, setPartyId, customerSearch, setCustomerSearch, 
  isCustomerDropdownOpen, setIsCustomerDropdownOpen, 
  filteredCustomers, selectedCustomer, onNext
}) => {
  return (
    <div className="wizard-step animate-in flex flex-col gap-6">
      <div>
        <h3 className="text-primary text-2xl font-black tracking-tight mb-2">1. Müşteri (Cari) Seçimi</h3>
        <p className="text-slate-500 text-sm font-medium">Satışın yapılacağı firmayı veya kişiyi belirleyin.</p>
      </div>

      <div className="form-group">
        <label>Sisteme Giriş Tarihi (Bugün)</label>
        <input 
          type="text" 
          className="uppercase-input bg-slate-50 border-slate-200 text-slate-400 font-bold" 
          value={new Date().toLocaleDateString('tr-TR')} 
          disabled 
        />
      </div>

      <div className="form-group relative">
        <label>Müşteri (Cari) Arayın veya Seçin*</label>
        <div className="relative group">
          <input 
            type="text" 
            className="uppercase-input pl-10 h-13 bg-white border-2 border-slate-100 group-focus-within:border-primary/30 transition-colors rounded-2xl" 
            placeholder="🔍 İSİM VEYA VERGİ NO İLE ARA..." 
            value={partyId ? selectedCustomer?.name : customerSearch}
            onChange={(e) => {
              setCustomerSearch(e.target.value);
              setIsCustomerDropdownOpen(true);
              if (partyId) setPartyId('');
            }}
            onFocus={() => setIsCustomerDropdownOpen(true)}
          />
          {partyId && (
            <button 
              onClick={() => {setPartyId(''); setCustomerSearch('');}}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-danger/10 hover:text-danger transition-colors cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {isCustomerDropdownOpen && !partyId && (
          <div className="absolute top-full left-0 right-0 bg-white z-[100] border border-slate-200 rounded-2xl shadow-2xl shadow-slate-200/50 max-h-[300px] overflow-y-auto mt-2 p-1.5 animate-in slide-in-from-top-2 duration-200">
            {filteredCustomers.map(c => (
              <div 
                key={c.id} 
                className="p-4 cursor-pointer hover:bg-slate-50 rounded-xl transition-colors border-b border-slate-50 last:border-0"
                onClick={() => {
                  setPartyId(c.id.toString());
                  setIsCustomerDropdownOpen(false);
                }}
              >
                <div className="font-black text-slate-800 text-sm mb-0.5">{c.name}</div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded">VKN: {c.taxNumber || '—'}</span>
                  <span className={`${Number(c.balance) > 0 ? 'text-danger' : 'text-success'}`}>
                    Bakiye: {Number(c.balance).toLocaleString('tr-TR')} ₺
                  </span>
                </div>
              </div>
            ))}
            {filteredCustomers.length === 0 && (
              <div className="p-8 text-center text-slate-400 font-bold text-sm">
                🔍 Eşleşen bir cari kayıt bulunamadı.
              </div>
            )}
          </div>
        )}
      </div>

      <button 
        className="btn btn-primary w-full h-15 rounded-2xl shadow-lg shadow-primary/25 text-base font-black mt-4 disabled:opacity-50 disabled:shadow-none transition-colors active:scale-[0.98]" 
        disabled={!partyId} 
        onClick={onNext}
      >
         DEVAM ET: SATIŞ DETAYLARI ➔
      </button>
    </div>
  );
});

Step1Customer.displayName = 'Step1Customer';

export default Step1Customer;
