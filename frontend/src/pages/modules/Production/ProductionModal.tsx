import React from 'react';
import { FiX } from 'react-icons/fi';
import { Bom, Department, ProductionOrderFormData } from '../../../types';

interface ProductionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  editingId: number | null;
  formData: ProductionOrderFormData;
  setFormData: (data: ProductionOrderFormData) => void;
  boms: Bom[];
  departments: Department[];
}

export const ProductionModal: React.FC<ProductionModalProps> = ({
  isOpen, onClose, onSubmit, editingId, formData, setFormData, boms, departments
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[5%] overflow-y-auto backdrop-blur-md bg-slate-900/40 px-4 pb-10">
      <div className="bg-white rounded-[32px] w-full max-w-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            {editingId ? 'İş Emri Güncelleme' : 'Yeni Üretim Emri Tanımla'}
          </h2>
          <button 
            className="p-2.5 rounded-full hover:bg-slate-100 transition-colors text-slate-400" 
            onClick={onClose}
          >
            <FiX size={24} />
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="form-group md:col-span-1.5 flex flex-col gap-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider">ÜRETİM REÇETESİ (BOM)</label>
              <select 
                required 
                value={formData.bomId} 
                onChange={e => setFormData({...formData, bomId: e.target.value})} 
                disabled={!!editingId} 
                className="h-12 w-full px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-semibold"
              >
                <option value="">-- LİSTEDEN SEÇİNİZ --</option>
                {boms.map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.targetItem?.code || '-'})</option>
                ))}
              </select>
            </div>
            <div className="form-group flex flex-col gap-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider">PLANLANAN ADET</label>
              <input 
                type="number" 
                required 
                value={formData.plannedQuantity} 
                onChange={e => setFormData({...formData, plannedQuantity: e.target.value})} 
                className="h-12 w-full px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-lg font-black text-primary" 
              />
            </div>
          </div>

          {editingId && (
            <div className={`p-6 rounded-2xl border flex flex-col gap-5 ${
              formData.status === 'completed' ? 'bg-success/5 border-success/20' : 'bg-slate-50 border-slate-200 border-dashed'
            }`}>
              <h4 className="text-[11px] font-black text-primary uppercase tracking-widest">SAHA VERİ GİRİŞİ & DURUM</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="form-group flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase">DURUM</label>
                  <select 
                    value={formData.status} 
                    onChange={e => setFormData({...formData, status: e.target.value as ProductionOrderFormData['status']})} 
                    className="h-11 w-full px-3 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                  >
                    <option value="draft">Tasarım / Taslak</option>
                    <option value="planned">Sıraya Alındı</option>
                    <option value="in_progress">Üretim Devam Ediyor</option>
                    <option value="completed">Tamamlandı (Stoğa Aktar)</option>
                    <option value="cancelled">Emri İptal Et</option>
                  </select>
                </div>
                <div className="form-group flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase">ÜRETİLEN</label>
                  <input 
                    type="number" 
                    value={formData.producedQuantity} 
                    onChange={e => setFormData({...formData, producedQuantity: e.target.value})} 
                    className="h-11 w-full px-3 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 font-black text-success" 
                  />
                </div>
                <div className="form-group flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase">FİRE</label>
                  <input 
                    type="number" 
                    value={formData.wastageQuantity} 
                    onChange={e => setFormData({...formData, wastageQuantity: e.target.value})} 
                    className="h-11 w-full px-3 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 font-black text-danger" 
                  />
                </div>
              </div>

              {formData.status === 'completed' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-5 border-t border-success/10">
                  <div className="form-group flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-danger uppercase tracking-tighter">ÇIKIŞ (SARF) DEPOSU*</label>
                    <select 
                      required 
                      value={formData.sourceDepartmentId} 
                      onChange={e => setFormData({...formData, sourceDepartmentId: e.target.value})} 
                      className="h-11 w-full px-3 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-success/20 font-semibold"
                    >
                      <option value="">-- SEÇİNİZ --</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-success uppercase tracking-tighter">GİRİŞ (MAMÜL) DEPOSU*</label>
                    <select 
                      required 
                      value={formData.targetDepartmentId} 
                      onChange={e => setFormData({...formData, targetDepartmentId: e.target.value})} 
                      className="h-11 w-full px-3 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-success/20 font-semibold"
                    >
                      <option value="">-- SEÇİNİZ --</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="form-group flex flex-col gap-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider">BAŞLANGIÇ</label>
              <input 
                type="date" 
                required 
                value={formData.startDate} 
                onChange={e => setFormData({...formData, startDate: e.target.value})} 
                className="h-12 w-full px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none" 
              />
            </div>
            <div className="form-group flex flex-col gap-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider">TERMİN (BİTİŞ)</label>
              <input 
                type="date" 
                value={formData.endDate} 
                onChange={e => setFormData({...formData, endDate: e.target.value})} 
                className="h-12 w-full px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none" 
              />
            </div>
          </div>

          <div className="form-group flex flex-col gap-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider">PLANLAMA NOTLARI</label>
            <textarea 
              rows={3} 
              value={formData.notes} 
              onChange={e => setFormData({...formData, notes: e.target.value.toLocaleUpperCase('tr-TR')})} 
              placeholder="VARDIYA, OPERATÖR VEYA PARTİ BİLGİSİ..." 
              className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none font-medium uppercase" 
            />
          </div>

          <div className="flex gap-4 mt-4">
            <button 
              type="submit" 
              className={`flex-1 h-14 rounded-2xl text-white font-black text-base shadow-lg transition-all active:scale-[0.98] ${
                formData.status === 'completed' 
                  ? 'bg-success shadow-success/20 hover:bg-success/90' 
                  : 'bg-primary shadow-primary/20 hover:bg-primary/90'
              }`}
            >
              {formData.status === 'completed' ? 'STOĞA AKTAR VE EMİR KAPAT' : (editingId ? 'GÜNCELLEMELERİ KAYDET' : 'ÜRETİM EMRİNİ ONAYLA')}
            </button>
            <button 
              type="button" 
              className="flex-[0.4] h-14 rounded-2xl bg-slate-50 text-slate-500 font-bold hover:bg-slate-100 transition-all" 
              onClick={onClose}
            >
              VAZGEÇ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
