import React, { useMemo } from 'react';
import { Item, Department } from '../../types';
import { PremiumNumberInput } from '../common/PremiumNumberInput';
import { SearchableSelect } from '../common/SearchableSelect';

interface StockAdjustmentFormData {
  itemId: string;
  departmentId: string;
  quantity: number;
  type: string;
  description: string;
}

interface StockAdjustmentModalProps {
  items: Item[];
  departments: Department[];
  formData: StockAdjustmentFormData;
  onFormDataChange: (data: StockAdjustmentFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  items,
  departments,
  formData,
  onFormDataChange,
  onSubmit,
  onClose,
}) => {
  const itemOptions = useMemo(() => 
    items.map(i => ({ id: i.id, label: `${i.code} - ${i.name}` })),
    [items]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white max-w-[600px] w-full p-6 rounded-2xl shadow-premium-lg border border-slate-100 flex flex-col gap-8 animate-in zoom-in-95 duration-300">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Manuel Stok Fişi</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">SAYIM VE DÜZELTME İŞLEMLERİ</p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">İŞLEM YÖNÜ</label>
              <select 
                required 
                value={formData.type} 
                onChange={e => onFormDataChange({...formData, type: e.target.value})}
                className="h-14 px-5 rounded-2xl border border-slate-100 bg-slate-50 font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-colors cursor-pointer"
              >
                <option value="in">STOK GİRİŞİ (+)</option>
                <option value="out">STOK ÇIKIŞI / FİRE (-)</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">DEPO / ŞUBE</label>
              <select 
                required 
                value={formData.departmentId} 
                onChange={e => onFormDataChange({...formData, departmentId: e.target.value})}
                className="h-14 px-5 rounded-2xl border border-slate-100 bg-slate-50 font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-colors cursor-pointer"
              >
                <option value="">LÜTFEN SEÇİNİZ...</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>

          <SearchableSelect 
            label="İŞLEM YAPILACAK ÜRÜN"
            required
            placeholder="ÜRÜN SEÇİNİZ..."
            options={itemOptions}
            value={formData.itemId}
            onChange={(opt) => onFormDataChange({...formData, itemId: opt ? String(opt.id) : ''})}
          />

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">MİKTAR</label>
            <PremiumNumberInput 
              value={formData.quantity} 
              onChange={val => onFormDataChange({...formData, quantity: val})} 
              className="h-16"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">AÇIKLAMA</label>
            <textarea 
              rows={2} 
              required 
              value={formData.description} 
              onChange={e => onFormDataChange({...formData, description: e.target.value.toLocaleUpperCase('tr-TR')})} 
              placeholder="ÖR: SAYIM FARKI, FİRE VB." 
              className="w-full p-5 rounded-3xl border border-slate-100 bg-slate-50 font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-colors resize-none uppercase"
            />
          </div>

          <div className="flex gap-4 mt-2">
            <button type="submit" className="flex-1 h-16 rounded-2xl bg-primary text-white font-black text-base shadow-xl shadow-primary/20 hover:bg-primary/90 active:scale-[0.98] transition-colors">
              İŞLEMİ ONAYLA
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
