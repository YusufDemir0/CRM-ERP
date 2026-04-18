
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white max-w-[800px] w-full p-10 rounded-[2.5rem] shadow-premium-lg border border-slate-100 flex flex-col gap-8 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {editingId ? 'İş Emri Detayları' : 'Üretim Planı Oluştur'}
          </h2>
          <button 
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:text-red-500 transition-colors" 
            onClick={onClose}
          >
            <FiX size={20} />
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">ÜRETİM REÇETESİ (BOM)</label>
              <select 
                required 
                value={formData.bomId} 
                onChange={e => setFormData({...formData, bomId: e.target.value})} 
                disabled={!!editingId} 
                className="h-14 px-5 rounded-2xl border border-slate-100 bg-slate-50 font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-colors cursor-pointer disabled:opacity-50"
              >
                <option value="">LÜTFEN SEÇİNİZ...</option>
                {boms.map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.targetItem?.code || '-'})</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">PLANLANAN ADET</label>
              <input 
                type="number" 
                required 
                value={formData.plannedQuantity} 
                onChange={e => setFormData({...formData, plannedQuantity: e.target.value})} 
                className="h-14 px-5 rounded-2xl border border-slate-100 bg-slate-50 font-black text-xl text-primary focus:bg-white focus:ring-2 focus:ring-primary/20 transition-colors" 
              />
            </div>
          </div>

          {editingId && (
            <div className={`p-8 rounded-[2rem] border-2 border-dashed flex flex-col gap-6 ${
              formData.status === 'completed' ? 'bg-success/5 border-success/20' : 'bg-slate-50 border-slate-100'
            }`}>
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-black text-primary uppercase tracking-widest px-1">SAHA VERİ GİRİŞİ & DURUM TAKİBİ</h4>
                <div className="px-3 py-1 bg-white rounded-lg border border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  EMİR ID: #{editingId}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">GÜNCEL DURUM</label>
                  <select 
                    value={formData.status} 
                    onChange={e => setFormData({...formData, status: e.target.value as ProductionOrderFormData['status']})} 
                    className="h-12 px-4 rounded-xl border border-slate-100 bg-white font-bold text-slate-700 focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    <option value="draft">Taslak</option>
                    <option value="planned">Sıraya Alındı</option>
                    <option value="in_progress">Devam Ediyor</option>
                    <option value="completed">Tamamlandı</option>
                    <option value="cancelled">İptal Edildi</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ÜRETİLEN MİKTAR</label>
                  <input 
                    type="number" 
                    value={formData.producedQuantity} 
                    onChange={e => setFormData({...formData, producedQuantity: e.target.value})} 
                    className="h-12 px-4 rounded-xl border border-slate-100 bg-white font-black text-success focus:ring-2 focus:ring-success/20 outline-none" 
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">FİRE MİKTARI</label>
                  <input 
                    type="number" 
                    value={formData.wastageQuantity} 
                    onChange={e => setFormData({...formData, wastageQuantity: e.target.value})} 
                    className="h-12 px-4 rounded-xl border border-slate-100 bg-white font-black text-danger focus:ring-2 focus:ring-danger/20 outline-none" 
                  />
                </div>
              </div>

              {formData.status === 'completed' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-success/10">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-danger uppercase tracking-widest opacity-70">ÇIKIŞ (HAMMADDE) DEPOSU*</label>
                    <select 
                      required 
                      value={formData.sourceDepartmentId} 
                      onChange={e => setFormData({...formData, sourceDepartmentId: e.target.value})} 
                      className="h-12 px-4 rounded-xl border-2 border-danger/20 bg-white font-bold text-slate-700 focus:ring-2 focus:ring-danger/20 outline-none"
                    >
                      <option value="">LÜTFEN SEÇİNİZ</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-success uppercase tracking-widest opacity-70">GİRİŞ (MAMÜL) DEPOSU*</label>
                    <select 
                      required 
                      value={formData.targetDepartmentId} 
                      onChange={e => setFormData({...formData, targetDepartmentId: e.target.value})} 
                      className="h-12 px-4 rounded-xl border-2 border-success/20 bg-white font-bold text-slate-700 focus:ring-2 focus:ring-success/20 outline-none"
                    >
                      <option value="">LÜTFEN SEÇİNİZ</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">BAŞLANGIÇ TARİHİ</label>
              <input 
                type="date" 
                required 
                value={formData.startDate} 
                onChange={e => setFormData({...formData, startDate: e.target.value})} 
                className="h-14 px-5 rounded-2xl border border-slate-100 bg-slate-50 font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-colors" 
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">TERMİN (HEDEF BİTİŞ)</label>
              <input 
                type="date" 
                value={formData.endDate} 
                onChange={e => setFormData({...formData, endDate: e.target.value})} 
                className="h-14 px-5 rounded-2xl border border-slate-100 bg-slate-50 font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-colors" 
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">ÖZEL NOTLAR & TALİMATLAR</label>
            <textarea 
              rows={3} 
              value={formData.notes} 
              onChange={e => setFormData({...formData, notes: e.target.value.toLocaleUpperCase('tr-TR')})} 
              placeholder="ÜRETİM HAKKINDAKİ ÖZEL NOTLARINIZI BURAYA YAZIN..." 
              className="w-full p-5 rounded-3xl border border-slate-100 bg-slate-50 font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-colors resize-none uppercase" 
            />
          </div>

          <div className="flex gap-4 mt-4">
            <button 
              type="submit" 
              className={`flex-1 h-16 rounded-2xl text-white font-black text-base shadow-xl transition-colors active:scale-[0.98] ${
                formData.status === 'completed' 
                  ? 'bg-success shadow-success/20 hover:bg-success/90' 
                  : 'bg-primary shadow-primary/20 hover:bg-primary/90'
              }`}
            >
              {formData.status === 'completed' ? 'ÜRETİMİ TAMAMLA VE STOĞA AKTAR' : (editingId ? 'GÜNCELLEMELERİ KAYDET' : 'ÜRETİM EMRİNİ ONAYLA')}
            </button>
            <button 
              type="button" 
              className="flex-[0.4] h-16 rounded-2xl bg-slate-50 text-slate-500 font-black uppercase text-xs tracking-widest hover:bg-slate-100 transition-colors" 
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
