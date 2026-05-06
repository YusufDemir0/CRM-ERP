
import { Stock, StockMovement } from '../../types';
import { FiX } from 'react-icons/fi';

interface StockMovementsModalProps {
  stock: Stock;
  loading: boolean;
  movements: StockMovement[];
  onClose: () => void;
}

export const StockMovementsModal: React.FC<StockMovementsModalProps> = ({
  stock,
  loading,
  movements,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white max-w-[900px] w-full p-6 rounded-2xl shadow-premium-lg border border-slate-100 flex flex-col gap-8 animate-in zoom-in-95 duration-300 relative">
        <button 
          className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:text-red-500 transition-colors absolute top-8 right-8" 
          onClick={onClose}
        >
          <FiX size={20} />
        </button>

        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Stok Hareket Özeti</h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md uppercase tracking-widest leading-none">
              {stock?.item?.code}
            </span>
            <span className="text-sm font-bold text-slate-500 italic">
              {stock?.item?.name} — {stock?.department?.name}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin"></div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Veriler alınıyor...</p>
          </div>
        ) : (
          <div className="overflow-x-auto modern-scrollbar max-h-[60vh]">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-6 py-4 rounded-l-2xl">TARİH</th>
                  <th className="px-4 py-4">YÖN</th>
                  <th className="px-4 py-4 text-right">MİKTAR</th>
                  <th className="px-4 py-4 text-right">ÖNCEKİ</th>
                  <th className="px-4 py-4 text-right">SONRAKİ</th>
                  <th className="px-6 py-4 rounded-r-2xl">AÇIKLAMA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Hareket kaydı bulunamadı.
                    </td>
                  </tr>
                ) : (
                  movements.map((m: StockMovement) => (
                    <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-[11px] font-bold text-slate-500">
                        {new Date(m.createdAt).toLocaleString('tr-TR')}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${
                          m.type === 'in' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                        }`}>
                          {m.type === 'in' ? '↑ GİRİŞ' : '↓ ÇIKIŞ'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right tabular-nums font-black text-slate-700">
                        {Number(m.quantity).toLocaleString('tr-TR')}
                      </td>
                      <td className="px-4 py-4 text-right tabular-nums font-bold text-slate-400 text-sm">
                        {Number(m.quantityBefore).toLocaleString('tr-TR')}
                      </td>
                      <td className="px-4 py-4 text-right tabular-nums font-black text-primary text-base">
                        {Number(m.quantityAfter).toLocaleString('tr-TR')}
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-tight">
                        {m.description || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
