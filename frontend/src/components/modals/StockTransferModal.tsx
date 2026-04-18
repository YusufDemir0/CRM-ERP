
import { FiRepeat } from 'react-icons/fi';
import { Item, Department } from '../../types';

interface StockTransferFormData {
  itemId: string;
  fromDepartmentId: string;
  toDepartmentId: string;
  quantity: number;
  description: string;
}

interface StockTransferModalProps {
  items: Item[];
  departments: Department[];
  transferData: StockTransferFormData;
  onTransferDataChange: (data: StockTransferFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const StockTransferModal: React.FC<StockTransferModalProps> = ({
  items,
  departments,
  transferData,
  onTransferDataChange,
  onSubmit,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white max-w-[650px] w-full p-10 rounded-[2.5rem] shadow-premium-lg border border-slate-100 flex flex-col gap-8 animate-in zoom-in-95 duration-300">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <FiRepeat size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Depolar Arası Transfer</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">İÇ SEVKİYYAT VE TRANSFER</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">TRANSFER EDİLECEK ÜRÜN</label>
            <select 
              required 
              value={transferData.itemId} 
              onChange={e => onTransferDataChange({...transferData, itemId: e.target.value})}
              className="h-14 px-5 rounded-2xl border border-slate-100 bg-slate-50 font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-amber-500/20 transition-colors cursor-pointer"
            >
              <option value="">LÜTFEN SEÇİNİZ...</option>
              {items.map(i => <option key={i.id} value={i.id}>{i.code} - {i.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-3xl bg-slate-50/50 border border-slate-100 border-dashed">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-danger uppercase tracking-widest px-1 opacity-70">ÇIKIŞ DEPOSU</label>
              <select 
                required 
                value={transferData.fromDepartmentId} 
                onChange={e => onTransferDataChange({...transferData, fromDepartmentId: e.target.value})}
                className="h-12 px-4 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 focus:ring-2 focus:ring-danger/20 outline-none"
              >
                <option value="">SEÇİNİZ...</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-success uppercase tracking-widest px-1 opacity-70">GİRİŞ DEPOSU</label>
              <select 
                required 
                value={transferData.toDepartmentId} 
                onChange={e => onTransferDataChange({...transferData, toDepartmentId: e.target.value})}
                className="h-12 px-4 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 focus:ring-2 focus:ring-success/20 outline-none"
              >
                <option value="">SEÇİNİZ...</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">MİKTAR</label>
            <input 
              type="number" 
              step="0.0001" 
              required 
              className="h-16 px-6 rounded-2xl border-2 border-amber-500/20 bg-amber-500/5 font-black text-2xl text-center text-amber-600 tabular-nums transition-colors outline-none focus:border-amber-500/40" 
              value={transferData.quantity} 
              onChange={e => onTransferDataChange({...transferData, quantity: Number(e.target.value)})} 
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">SEVK / TRANSFER NOTU</label>
            <input 
              required
              className="h-14 px-5 rounded-2xl border border-slate-100 bg-slate-50 font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-amber-500/20 transition-colors uppercase" 
              value={transferData.description} 
              onChange={e => onTransferDataChange({...transferData, description: e.target.value.toLocaleUpperCase('tr-TR')})} 
              placeholder="PLAKA, ŞOFÖR VEYA SEVK BİLGİLERİ..." 
            />
          </div>

          <div className="flex gap-4 mt-2">
            <button type="submit" className="flex-1 h-16 rounded-2xl bg-amber-500 text-white font-black text-base shadow-xl shadow-amber-500/20 hover:bg-amber-600 active:scale-[0.98] transition-colors">
              TRANSFERİ BAŞLAT
            </button>
            <button type="button" className="flex-[0.4] h-16 rounded-2xl bg-slate-50 text-slate-500 font-black uppercase text-xs tracking-widest hover:bg-slate-100 transition-colors" onClick={onClose}>
              VAZGEÇ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
