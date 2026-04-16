import React from 'react';
import { Decimal } from 'decimal.js';
import { FiAlertCircle, FiCheckCircle, FiChevronLeft, FiDollarSign } from 'react-icons/fi';

interface Props {
  selectedCurrencySymbol: string;
  genDiscountType: 'amount' | 'percent';
  setGenDiscountType: (val: 'amount' | 'percent') => void;
  genDiscountValue: string;
  setGenDiscountValue: (val: string) => void;
  deposit: string;
  setDeposit: (val: string) => void;
  saleNotes: string;
  setSaleNotes: (val: string) => void;
  finances: {
    rawTotalAmount: Decimal;
    discountedTotalAmount: Decimal;
    totalKdv: Decimal;
    grandTotal: Decimal;
    kaporaNum: Decimal;
    netTotal: Decimal;
    gDiscountNum: Decimal;
  };
  isSubmitting: boolean;
  onBack: () => void;
  onSubmit: () => void;
}

const Step4Final: React.FC<Props> = ({
  selectedCurrencySymbol, genDiscountType, setGenDiscountType, 
  genDiscountValue, setGenDiscountValue, deposit, setDeposit, 
  saleNotes, setSaleNotes, finances, isSubmitting, onBack, onSubmit
}) => {
  
  const totalDiscount = new Decimal(finances.rawTotalAmount).sub(new Decimal(finances.discountedTotalAmount));

  return (
    <div className="wizard-step animate-in w-full flex flex-col gap-4">
      <div className="text-center mb-8">
        <h3 className="text-primary text-3xl font-black tracking-tighter mb-2">Sipariş Özeti ve Tamamlama</h3>
        <p className="text-slate-500 font-medium">Lütfen tüm detayları kontrol ederek siparişi onaylayın.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-10 items-start">
        {/* SOL TARAF: FORM GİRİŞLERİ */}
        <div className="flex flex-col gap-6">
          
          {/* GENEL İSKONTO */}
          <div className="bg-slate-50/50 p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm transition-all hover:bg-white hover:border-primary/20">
             <label className="text-[11px] font-black text-primary uppercase tracking-widest mb-4 block opacity-70">
               GENEL İSKONTO (ALT TOPLAM)
             </label>
             <div className="flex gap-4">
                <div className="relative">
                  <select 
                    className="uppercase-input w-24 h-14 appearance-none bg-white border-2 border-slate-100/50 rounded-2xl font-black cursor-pointer hover:border-primary/20 transition-all outline-none" 
                    value={genDiscountType} 
                    onChange={e => setGenDiscountType(e.target.value as 'amount'|'percent')}
                  >
                    <option value="amount">{selectedCurrencySymbol}</option>
                    <option value="percent">%</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-20 text-[10px]">▼</div>
                </div>
                <input 
                  type="text" 
                  className="uppercase-input tabular-nums flex-1 h-14 bg-white border-2 border-slate-100/50 rounded-2xl px-5 font-black text-lg outline-none focus:border-primary/30 transition-all" 
                  placeholder="0.00" 
                  value={genDiscountValue} 
                  onChange={e => setGenDiscountValue(e.target.value.replace(/[^0-9.]/g, ''))} 
                />
             </div>
          </div>

          {/* KAPORA ALANI */}
          <div className="bg-rose-50/30 p-8 rounded-[2rem] border-2 border-rose-100/50 shadow-sm flex flex-col gap-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 text-rose-100 group-hover:text-rose-200 transition-colors">
               <FiDollarSign size={48} />
            </div>
            <h4 className="text-danger text-lg font-black flex items-center gap-2 relative z-10">
               <span>💸</span> Kapora Bilgisi
            </h4>
            <p className="text-[11px] text-rose-600 font-bold uppercase tracking-tight opacity-70 relative z-10">
               Onay veriyorsanız kapora tutarını girin (Örn: Peşinat).
            </p>
            <div className="relative z-10">
              <input 
                type="text" 
                className="uppercase-input tabular-nums text-3xl h-18 w-full text-center text-danger font-black bg-white border-2 border-rose-200/50 rounded-[1.5rem] shadow-premium outline-none focus:border-danger/30 transition-all" 
                placeholder="0.00" 
                value={deposit} 
                onChange={(e) => setDeposit(e.target.value.replace(/[^0-9.]/g, ''))} 
              />
              <div className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-rose-200 text-xl">{selectedCurrencySymbol}</div>
            </div>
          </div>

          {/* SİPARİŞ NOTU */}
          <div className="form-group">
            <label className="text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] pl-1 mb-2">Sipariş / Sevkiyat Notları</label>
            <textarea 
              className="uppercase-input min-h-[120px] p-5 bg-white border-2 border-slate-100 rounded-3xl outline-none focus:border-primary/20 transition-all font-medium text-slate-700 shadow-sm" 
              value={saleNotes} 
              onChange={e => setSaleNotes(e.target.value.toUpperCase())} 
              placeholder="Teslimat detayları, özel paketleme istekleri vb..." 
            />
          </div>
        </div>

        {/* SAĞ TARAF: FİNANSAL TABLO */}
        <div className={`p-10 rounded-[3rem] bg-slate-900 text-white shadow-premium flex flex-col border border-white/10 relative transition-all duration-500 ${deposit === '' ? 'opacity-40 grayscale blur-[1px]' : 'opacity-100'}`}>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-success to-primary opacity-50" />
          
          <div className="flex items-center justify-between mb-10">
            <h4 className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">FİNANSAL ÖZET</h4>
            <span className="bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-400">Decimal.js Precision</span>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center text-slate-400">
              <span className="font-bold text-sm">Mal/Hizmet Toplamı:</span>
              <span className="tabular-nums font-black text-slate-200">{finances.rawTotalAmount.toFixed(2).replace('.', ',')} {selectedCurrencySymbol}</span>
            </div>

            {totalDiscount.gt(0) && (
              <div className="flex justify-between items-center text-rose-400 bg-rose-400/5 px-4 py-3 rounded-2xl border border-rose-400/10">
                <span className="font-bold text-sm">Genel İskonto:</span>
                <span className="tabular-nums font-black">-{totalDiscount.toFixed(2).replace('.', ',')} {selectedCurrencySymbol}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-slate-400">
              <span className="font-bold text-sm">Toplam KDV Tutarı:</span>
              <span className="tabular-nums font-black text-slate-200">+{finances.totalKdv.toFixed(2).replace('.', ',')} {selectedCurrencySymbol}</span>
            </div>
            
            <div className="h-px bg-white/5 my-2" />

            <div className="flex justify-between items-center text-white py-2">
              <span className="font-black text-lg tracking-tight uppercase">Genel Toplam:</span>
              <span className="tabular-nums font-black text-3xl tracking-tighter">{finances.grandTotal.toFixed(2).replace('.', ',')} {selectedCurrencySymbol}</span>
            </div>

            {finances.kaporaNum.gt(0) && (
              <div className="flex justify-between items-center text-amber-400 bg-amber-400/5 px-4 py-4 rounded-2xl border border-amber-400/10 border-dashed">
                <span className="font-bold text-sm flex items-center gap-2">
                   <FiAlertCircle size={14} /> Tahsil Edilecek Kapora:
                </span>
                <span className="tabular-nums font-black text-[1.1rem]">-{finances.kaporaNum.toFixed(2).replace('.', ',')} {selectedCurrencySymbol}</span>
              </div>
            )}
          </div>

          <div className="mt-10 bg-success/10 border border-success/20 p-8 rounded-[2rem] flex flex-col gap-2 shadow-inner">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-success/70">MÜŞTERİ HESABINA YANSIYACAK (NET)</span>
            <div className="flex justify-between items-end text-success">
               <span className="text-4xl font-black tabular-nums tracking-tighter">{finances.netTotal.toFixed(2).replace('.', ',')}</span>
               <span className="text-xl font-black opacity-80 pb-1.5">{selectedCurrencySymbol}</span>
            </div>
          </div>

          <button
            className="w-full h-18 bg-primary text-white rounded-[1.5rem] font-black text-lg mt-10 shadow-xl shadow-primary/30 transition-all hover:scale-[1.02] hover:shadow-primary/40 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:grayscale flex items-center justify-center gap-3"
            disabled={deposit === '' || isSubmitting}
            onClick={onSubmit}
          >
            {isSubmitting ? (
               <>
                 <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                 İŞLENİYOR...
               </>
            ) : (
               <>
                 <FiCheckCircle size={22} /> SİPARİŞİ ONAYLA
               </>
            )}
          </button>

          <button className="mt-6 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-slate-300 transition-colors py-2 flex items-center justify-center gap-2 group" onClick={onBack}>
            <FiChevronLeft className="group-hover:-translate-x-1 transition-transform" /> SEPETE DÖN VE DÜZENLE
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step4Final;
