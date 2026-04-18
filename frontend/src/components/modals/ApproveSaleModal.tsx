
import { Department } from '../../types';

interface ApproveSaleModalProps {
  departments: Department[];
  selectedDeptId: string;
  onSelectedDeptIdChange: (id: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const ApproveSaleModal: React.FC<ApproveSaleModalProps> = ({
  departments,
  selectedDeptId,
  onSelectedDeptIdChange,
  onSubmit,
  onClose,
}) => {
  return (
    <div className="loader-overlay items-start pt-[10%]">
      <div className="login-box max-w-[500px] w-full">
        <h3 className="mb-5 text-[var(--success)] border-b border-[var(--border)] pb-2.5">Satışı Onayla ve Stok Düş</h3>
        <p className="text-[13px] text-gray-500 mb-5">
          Bu siparişi onayladığınızda, siparişteki kalemlerin stokları belirteceğiniz depodan otomatik düşülecektir. İşlem geri alınamaz.
        </p>
        <form onSubmit={onSubmit} className="login-form">
          <div className="form-group">
            <label>Stokların Düşüleceği Depo</label>
            <select required className="uppercase-input appearance-none" value={selectedDeptId} onChange={e => onSelectedDeptIdChange(e.target.value)}>
              <option value="">-- DEPO SEÇİNİZ --</option>
              {departments.filter(d => d.state === 1).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="flex gap-4 mt-2.5">
            <button type="submit" className="btn flex-1 bg-[var(--success)] text-white h-[50px]">ONAYLA VE STOK DÜŞ</button>
            <button type="button" className="btn flex-1 bg-slate-200 h-[50px]" onClick={onClose}>İPTAL</button>
          </div>
        </form>
      </div>
    </div>
  );
};
