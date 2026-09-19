import React, { useState } from 'react';
import { FiX, FiPrinter, FiCalendar, FiLayers } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import { salesAPI, departmentsAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { printSalesReport } from '../../utils/reportPrintUtils';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

interface SalesReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MONTHS = [
  { value: 1, label: 'Ocak' },
  { value: 2, label: 'Şubat' },
  { value: 3, label: 'Mart' },
  { value: 4, label: 'Nisan' },
  { value: 5, label: 'Mayıs' },
  { value: 6, label: 'Haziran' },
  { value: 7, label: 'Temmuz' },
  { value: 8, label: 'Ağustos' },
  { value: 9, label: 'Eylül' },
  { value: 10, label: 'Ekim' },
  { value: 11, label: 'Kasım' },
  { value: 12, label: 'Aralık' },
];

export const SalesReportModal: React.FC<SalesReportModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const currentYear = dayjs().year();
  const currentMonth = dayjs().month() + 1;

  const [reportType, setReportType] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const isAdmin = user?.roles?.some(r => ['ADMIN', 'SYSTEM_ADMIN', 'SUPER_ADMIN'].includes(r.toUpperCase())) || false;
  const canViewAll = 
    isAdmin || 
    user?.permissions?.includes('SALES_VIEW_ALL') ||
    user?.permissions?.includes('sales_view_all') ||
    user?.permissions?.includes('SALES_MASTER_VIEW') ||
    user?.permissions?.includes('sales_master_view');

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
      const params: { year: number; month?: number; departmentId?: string } = {
        year: selectedYear,
      };

      if (reportType === 'monthly') {
        params.month = selectedMonth;
      }

      if (canViewAll && selectedDepartmentId) {
        params.departmentId = selectedDepartmentId;
      }

      const res = await salesAPI.getPeriodSummary(params);
      if (res.data) {
        printSalesReport(res.data);
        toast.success('Satış raporu PDF çıktısı hazırlandı.');
        onClose();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Rapor oluşturulurken bir hata oluştu.');
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
              <FiCalendar />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800 tracking-tight">SATIŞ RAPORU (PDF)</h2>
              <p className="text-[11px] font-medium text-slate-400">Aylık veya yıllık satış performans özeti</p>
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
          
          {/* Rapor Türü Seçimi */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Rapor Periyodu
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setReportType('monthly')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  reportType === 'monthly'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Aylık Rapor (Takvim Ayı)
              </button>
              <button
                type="button"
                onClick={() => setReportType('yearly')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  reportType === 'yearly'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Yıllık Rapor
              </button>
            </div>
          </div>

          {/* Yıl Seçimi */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Yıl
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full h-11 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:border-primary transition-colors"
            >
              {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Ay Seçimi (Aylık ise) */}
          {reportType === 'monthly' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Ay
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:border-primary transition-colors"
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Departman Kapsamı */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Departman Kapsamı</span>
              {!canViewAll && <span className="text-[10px] text-amber-600 font-semibold">(Yetkiniz gereği kısıtlıdır)</span>}
            </label>
            {canViewAll ? (
              <select
                value={selectedDepartmentId}
                onChange={(e) => setSelectedDepartmentId(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:border-primary transition-colors"
              >
                <option value="">Tüm Şirket / Tüm Departmanlar</option>
                {departments.map((dept: any) => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            ) : (
              <div className="h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center text-xs font-semibold text-slate-600">
                <FiLayers className="mr-2 text-slate-400" />
                Kendi Departmanınız
              </div>
            )}
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
