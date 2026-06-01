import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FiX, FiShoppingCart, FiDollarSign, FiCheck, FiTrendingUp } from 'react-icons/fi';
import { Party, Sale } from '../../types';
import { salesAPI } from '../../services/api';
import Decimal from 'decimal.js';

interface ViewPartySalesModalProps {
  party: Party;
  onClose: () => void;
}

export const ViewPartySalesModal: React.FC<ViewPartySalesModalProps> = ({
  party,
  onClose,
}) => {
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: salesData, isLoading } = useQuery({
    queryKey: ['sales', 'by-party', party.id, page],
    queryFn: async () => {
      const res = await salesAPI.getAll({
        partyId: String(party.id),
        page,
        limit,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      });
      return res.data;
    },
  });

  const sales = salesData?.data || [];
  const meta = salesData?.meta || { total: 0, totalPages: 1 };

  const { totalSales, totalPaid, totalRemaining } = useMemo(() => {
    let salesSum = new Decimal(0);
    let paidSum = new Decimal(0);
    
    sales.filter(s => s.status !== 'cancelled').forEach(s => {
      salesSum = salesSum.add(new Decimal(s.grandTotal || 0));
      paidSum = paidSum.add(new Decimal(s.paidAmount || 0));
    });
    
    return {
      totalSales: salesSum,
      totalPaid: paidSum,
      totalRemaining: Decimal.max(0, salesSum.minus(paidSum))
    };
  }, [sales]);

  const formatAmount = (val: any) => {
    const num = typeof val === 'number' ? val : Number(val || 0);
    return num.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string; dotClass: string }> = {
      draft: { label: 'TASLAK', className: 'bg-slate-100 text-slate-600 border border-slate-200', dotClass: 'bg-slate-400' },
      approved: { label: 'ONAYLANDI', className: 'bg-blue-50 text-blue-600 border border-blue-100', dotClass: 'bg-blue-500 animate-pulse' },
      shipped: { label: 'SEVK EDİLDİ', className: 'bg-amber-50 text-amber-600 border border-amber-100', dotClass: 'bg-amber-500' },
      invoiced: { label: 'FATURALANDI', className: 'bg-emerald-50 text-emerald-600 border border-emerald-100', dotClass: 'bg-emerald-500' },
      cancelled: { label: 'İPTAL', className: 'bg-rose-50 text-rose-600 border border-rose-100', dotClass: 'bg-rose-500' },
    };
    const current = statusMap[status] || { label: status.toUpperCase(), className: 'bg-slate-50 text-slate-400 border border-slate-200', dotClass: 'bg-slate-400' };
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${current.className}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${current.dotClass}`} />
        {current.label}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white max-w-[950px] w-full rounded-3xl shadow-2xl border border-slate-100 flex flex-col animate-in zoom-in-95 duration-300 relative overflow-hidden" style={{ maxHeight: '90vh' }}>
        
        {/* HEADER */}
        <div className="p-6 pb-4 flex-shrink-0 border-b border-slate-50">
          <button 
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:text-red-500 transition-colors absolute top-6 right-6 z-10" 
            onClick={onClose}
          >
            <FiX size={20} />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-primary flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <FiShoppingCart size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">{party.name}</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Müşteri Satış Geçmişi</p>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col min-h-0">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4 my-auto">
              <div className="w-12 h-12 border-4 border-slate-100 border-t-primary rounded-full animate-spin"></div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Geçmiş Satışlar Yükleniyor...</p>
            </div>
          ) : sales.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-300 my-auto">
              <FiShoppingCart size={40} className="stroke-[1.5]" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Bu müşteriye ait satış kaydı bulunamadı.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* TOP STATS CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Toplam Satış */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group shadow-sm transition-all hover:shadow-md">
                  <div className="absolute -right-2 -top-2 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-all group-hover:scale-110 text-slate-900">
                    <FiTrendingUp size={45} />
                  </div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">TOPLAM SATIŞ</span>
                  <div className="text-xl font-black text-slate-800 text-right mt-2 tabular-nums tracking-tighter">
                    {formatAmount(totalSales)} <span className="text-xs font-bold text-slate-400 ml-0.5">{party.currency?.symbol || '₺'}</span>
                  </div>
                </div>

                {/* Toplam Tahsilat */}
                <div className="bg-emerald-50/50 border border-emerald-100/50 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group shadow-sm transition-all hover:shadow-md">
                  <div className="absolute -right-2 -top-2 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-all group-hover:scale-110 text-emerald-600">
                    <FiCheck size={45} />
                  </div>
                  <span className="text-[9px] font-black text-emerald-600/70 uppercase tracking-widest">TOPLAM TAHSİLAT</span>
                  <div className="text-xl font-black text-emerald-600 text-right mt-2 tabular-nums tracking-tighter">
                    {formatAmount(totalPaid)} <span className="text-xs font-bold text-emerald-600/70 ml-0.5">{party.currency?.symbol || '₺'}</span>
                  </div>
                </div>

                {/* Kalan Borç */}
                <div className="bg-rose-50/50 border border-rose-100/50 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group shadow-sm transition-all hover:shadow-md">
                  <div className="absolute -right-2 -top-2 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-all group-hover:scale-110 text-rose-600">
                    <FiDollarSign size={45} />
                  </div>
                  <span className="text-[9px] font-black text-rose-600/70 uppercase tracking-widest">KALAN BORÇ</span>
                  <div className="text-xl font-black text-rose-600 text-right mt-2 tabular-nums tracking-tighter">
                    {formatAmount(totalRemaining)} <span className="text-xs font-bold text-rose-600/70 ml-0.5">{party.currency?.symbol || '₺'}</span>
                  </div>
                </div>
              </div>

              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-4 py-3 rounded-l-xl">Sipariş No</th>
                    <th className="px-4 py-3">Tarih</th>
                    <th className="px-4 py-3">Ödeme Şekli</th>
                    <th className="px-4 py-3 text-right">Tutar</th>
                    <th className="px-4 py-3 text-right">Ödenen (Kapora/Tahsilat)</th>
                    <th className="px-4 py-3 text-right">Kalan Borç</th>
                    <th className="px-4 py-3 text-center rounded-r-xl">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {sales.map((sale: Sale) => {
                    const gTotal = new Decimal(sale.grandTotal || 0);
                    const pAmount = new Decimal(sale.paidAmount || 0);
                    const remaining = Decimal.max(0, gTotal.minus(pAmount));
                    
                    return (
                      <tr key={sale.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-4 py-3.5">
                          <span className="text-[10px] font-black text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg tracking-wider">
                            {sale.code}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs font-bold text-slate-500">
                          {new Date(sale.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3.5 text-xs font-black text-slate-600 uppercase tracking-tight">
                          {sale.paymentType || 'VADELİ'}
                        </td>
                        <td className="px-4 py-3.5 text-right font-black text-sm text-slate-800 tabular-nums">
                          {formatAmount(sale.grandTotal)} <span className="text-[10px] font-bold text-slate-400 ml-0.5">{sale.currency?.symbol || '₺'}</span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-black text-sm text-success tabular-nums">
                          {formatAmount(pAmount)} <span className="text-[10px] font-bold text-slate-400 ml-0.5">{sale.currency?.symbol || '₺'}</span>
                        </td>
                        <td className={`px-4 py-3.5 text-right font-black text-sm tabular-nums ${remaining.gt(0) ? 'text-danger' : 'text-slate-400'}`}>
                          {formatAmount(remaining)} <span className="text-[10px] font-bold text-slate-400 ml-0.5">{sale.currency?.symbol || '₺'}</span>
                        </td>
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          {getStatusBadge(sale.status)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* PAGINATION */}
              {meta.totalPages > 1 && (
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Toplam {meta.total} kayıttan {((page - 1) * limit) + 1} - {Math.min(page * limit, meta.total)} arası gösteriliyor
                  </span>
                  <div className="flex gap-1">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 text-slate-600 disabled:hover:bg-slate-50 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                    >
                      Önceki
                    </button>
                    {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-7 h-7 flex items-center justify-center rounded-xl text-[10px] font-black transition-all ${
                          page === p ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      disabled={page === meta.totalPages}
                      onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                      className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 text-slate-600 disabled:hover:bg-slate-50 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                    >
                      Sonraki
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
