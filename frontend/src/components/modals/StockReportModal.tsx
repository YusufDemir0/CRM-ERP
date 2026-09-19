import React, { useState } from 'react';
import { FiX, FiPrinter, FiBox, FiLayers } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import { stocksAPI, departmentsAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { printStockReport } from '../../utils/reportPrintUtils';
import toast from 'react-hot-toast';

interface StockReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StockReportModal: React.FC<StockReportModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'inStock' | 'critical' | 'outOfStock'>('all');
  const [loading, setLoading] = useState(false);

  const isAdmin = user?.roles?.some(r => ['ADMIN', 'SYSTEM_ADMIN', 'SUPER_ADMIN'].includes(r.toUpperCase())) || false;
  const canViewAll = 
    isAdmin || 
    user?.permissions?.includes('INVENTORY_VIEW_ALL') ||
    user?.permissions?.includes('inventory_view_all');

  const { data: departments = [] } = useQuery({
    queryKey: ['departments', 'lookup'],
    queryFn: async () => {
      const res = await departmentsAPI.getAll();
      return Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
    },
    enabled: isOpen && canViewAll,
  });

  if (!isOpen) return null;

  const handleGeneratePdf = async () => {
    try {
      setLoading(true);
      const params: { departmentId?: string } = {};

      if (canViewAll && selectedDepartmentId) {
        params.departmentId = selectedDepartmentId;
      }

      const res = await stocksAPI.getDepartmentSummary(params);
      if (res.data) {
        printStockReport(res.data, categoryFilter);
        toast.success('Stok envanter raporu PDF çıktısı hazırlandı.');
        onClose();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Stok raporu oluşturulurken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
              <FiBox />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800 tracking-tight">STOK ENVANTER RAPORU (PDF)</h2>
              <p className="text-[11px] font-medium text-slate-400">Departman bazlı stok, kritik ve tükenen ürünler</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          
          {/* Departman Kapsamı */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Departman / Depo Kapsamı</span>
              {!canViewAll && <span className="text-[10px] text-amber-600 font-semibold">(Kendi deponuzla kısıtlı)</span>}
            </label>
            {canViewAll ? (
              <select
                value={selectedDepartmentId}
                onChange={(e) => setSelectedDepartmentId(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:border-primary transition-colors"
              >
                <option value="">Tüm Departmanlar / Depolar (Ayrı Ayrı)</option>
                {departments.map((dept: any) => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            ) : (
              <div className="h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center text-xs font-semibold text-slate-600">
                <FiLayers className="mr-2 text-slate-400" />
                Bağlı Olduğunuz Departman Deposu
              </div>
            )}
          </div>

          {/* Durum / Kategori Filtresi */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Raporlanacak Stok Durumu
            </label>
            <div className="space-y-1.5">
              {[
                { id: 'all', label: 'Tüm Kalemler (Stoğu Olan + Kritik + Olmayan)' },
                { id: 'inStock', label: 'Yalnızca Stoğu Olan Ürünler' },
                { id: 'critical', label: 'Yalnızca Kritik Eşikteki Ürünler' },
                { id: 'outOfStock', label: 'Yalnızca Stoğu Olmayan / Tükenen Ürünler' },
              ].map((item) => (
                <label 
                  key={item.id}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer text-xs font-semibold transition-all ${
                    categoryFilter === item.id
                      ? 'border-slate-800 bg-slate-50 text-slate-900 shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50/60'
                  }`}
                >
                  <input
                    type="radio"
                    name="categoryFilter"
                    value={item.id}
                    checked={categoryFilter === item.id}
                    onChange={() => setCategoryFilter(item.id as any)}
                    className="accent-slate-900"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition-colors"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={handleGeneratePdf}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            <FiPrinter size={15} />
            {loading ? 'Rapor Hazırlanıyor...' : 'PDF Raporu Al'}
          </button>
        </div>

      </div>
    </div>
  );
};
