
import { FiSave } from 'react-icons/fi';

interface GeneralSettingsProps {
  settings: Record<string, string>;
  setSettings: (settings: Record<string, string>) => void;
  onSave: () => void;
}

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({ settings, setSettings, onSave }) => {
  return (
    <div className="animate-in fade-in duration-500">
      <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-10 flex items-center gap-3">
        <span className="w-1.5 h-6 bg-primary rounded-full" />
        Genel Şirket Bilgileri
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">RESMİ ŞİRKET ADI</label>
          <input 
            className="h-14 px-5 rounded-2xl border border-slate-100 bg-slate-50 font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-colors uppercase" 
            value={settings.company_name || ''} 
            onChange={e => setSettings({...settings, company_name: e.target.value.toLocaleUpperCase('tr-TR')})} 
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">VERGİ KİMLİK NUMARASI</label>
          <input 
            className="h-14 px-5 rounded-2xl border border-slate-100 bg-slate-50 font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-colors" 
            value={settings.tax_number || ''} 
            onChange={e => setSettings({...settings, tax_number: e.target.value.replace(/\D/g, '')})} 
          />
        </div>
      </div>
      <div className="flex flex-col gap-2 mt-6">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">FATURA VE TEBLİGAT ADRESİ</label>
        <textarea 
          className="h-32 p-5 rounded-3xl border border-slate-100 bg-slate-50 font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-colors uppercase resize-none" 
          value={settings.company_address || ''} 
          onChange={e => setSettings({...settings, company_address: e.target.value.toLocaleUpperCase('tr-TR')})} 
        />
      </div>
      <button 
        className="h-14 px-8 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-colors shadow-lg shadow-primary/25 mt-10 flex items-center gap-3" 
        onClick={onSave}
      >
        <FiSave size={18} /> AYARLARI GÜNCELLE
      </button>
    </div>
  );
};
