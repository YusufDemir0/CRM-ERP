import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FiX, FiArrowDownCircle, FiArrowUpCircle, FiCreditCard, FiTrendingUp, FiTrendingDown, FiActivity } from 'react-icons/fi';
import { Account, Transaction } from '../../types';
import { transactionsAPI } from '../../services/api';
import { Decimal } from 'decimal.js';

interface ViewAccountTransactionsModalProps {
  account: Account;
  onClose: () => void;
}

export const ViewAccountTransactionsModal: React.FC<ViewAccountTransactionsModalProps> = ({
  account,
  onClose,
}) => {
  const [typeFilter, setTypeFilter] = useState<'all' | 'in' | 'out'>('all');

  const { data: txData, isLoading } = useQuery({
    queryKey: ['transactions', 'by-account', account.id],
    queryFn: async () => {
      const res = await transactionsAPI.getAll({
        commercialAccountId: account.id,
        limit: 50,
        sortBy: 'date',
        sortOrder: 'DESC',
      });
      return res.data?.data || [];
    },
  });

  const transactions = txData || [];

  const filtered = useMemo(() => {
    if (typeFilter === 'all') return transactions;
    return transactions.filter((t: Transaction) => t.type === typeFilter);
  }, [transactions, typeFilter]);

  const summary = useMemo(() => {
    let totalIn = new Decimal(0);
    let totalOut = new Decimal(0);
    transactions.forEach((t: Transaction) => {
      if (t.status === 'cancelled') return;
      const amount = new Decimal(t.amount || 0).mul(new Decimal(t.exchangeRate || 1));
      if (t.type === 'in') totalIn = totalIn.plus(amount);
      else totalOut = totalOut.plus(amount);
    });
    return {
      totalIn: totalIn.toNumber(),
      totalOut: totalOut.toNumber(),
      net: totalIn.minus(totalOut).toNumber(),
    };
  }, [transactions]);

  const formatAmount = (val: number) =>
    val.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white max-w-[1100px] w-full rounded-3xl shadow-2xl border border-slate-100 flex flex-col animate-in zoom-in-95 duration-300 relative overflow-hidden" style={{ maxHeight: '90vh' }}>
        
        {/* HEADER */}
        <div className="p-6 pb-0 flex-shrink-0">
          <button 
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:text-red-500 transition-colors absolute top-6 right-6 z-10" 
            onClick={onClose}
          >
            <FiX size={20} />
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <FiCreditCard size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{account.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-lg uppercase tracking-widest">
                  {account.bankName || 'NAKİT KASA'}
                </span>
                {account.iban && (
                  <span className="text-[10px] font-bold text-slate-400 tracking-tight">
                    {account.iban}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* SUMMARY CARDS */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <FiTrendingUp className="text-emerald-500" size={16} />
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">GİRİŞ TOPLAMI</span>
              </div>
              <div className="text-xl font-black text-emerald-700 tabular-nums tracking-tight">
                +{formatAmount(summary.totalIn)} {account.currency?.symbol || '₺'}
              </div>
            </div>
            <div className="bg-gradient-to-br from-rose-50 to-red-50 border border-rose-100 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <FiTrendingDown className="text-rose-500" size={16} />
                <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">ÇIKIŞ TOPLAMI</span>
              </div>
              <div className="text-xl font-black text-rose-700 tabular-nums tracking-tight">
                -{formatAmount(summary.totalOut)} {account.currency?.symbol || '₺'}
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <FiActivity className="text-blue-500" size={16} />
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">NET BAKİYE</span>
              </div>
              <div className={`text-xl font-black tabular-nums tracking-tight ${summary.net >= 0 ? 'text-blue-700' : 'text-rose-700'}`}>
                {summary.net >= 0 ? '+' : ''}{formatAmount(summary.net)} {account.currency?.symbol || '₺'}
              </div>
            </div>
          </div>

          {/* FILTER TABS */}
          <div className="flex items-center gap-2 mb-4">
            {([
              { id: 'all' as const, label: 'TÜMÜ', count: transactions.length },
              { id: 'in' as const, label: 'GİRİŞLER', count: transactions.filter((t: Transaction) => t.type === 'in').length },
              { id: 'out' as const, label: 'ÇIKIŞLAR', count: transactions.filter((t: Transaction) => t.type === 'out').length },
            ]).map(tab => (
              <button
                key={tab.id}
                onClick={() => setTypeFilter(tab.id)}
                className={`h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
                  typeFilter === tab.id 
                    ? 'bg-slate-800 text-white shadow-lg' 
                    : 'bg-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
                <span className={`text-[9px] px-1.5 py-0.5 rounded-md ${
                  typeFilter === tab.id ? 'bg-white/20' : 'bg-slate-200'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* TABLE */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">İşlemler yükleniyor...</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-4 py-3.5 rounded-l-xl">TARİH</th>
                  <th className="px-4 py-3.5">FİŞ KODU</th>
                  <th className="px-4 py-3.5">CARİ</th>
                  <th className="px-4 py-3.5">YÖN</th>
                  <th className="px-4 py-3.5 text-right">TUTAR</th>
                  <th className="px-4 py-3.5">DURUM</th>
                  <th className="px-4 py-3.5 rounded-r-xl">AÇIKLAMA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3 opacity-30">
                        <FiCreditCard size={28} />
                        <span className="text-xs font-black uppercase tracking-widest">Bu hesapta henüz işlem bulunamadı.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((tx: Transaction) => {
                    const isCancelled = tx.status === 'cancelled';
                    return (
                      <tr key={tx.id} className={`hover:bg-slate-50/50 transition-colors ${isCancelled ? 'opacity-40' : ''}`}>
                        <td className="px-4 py-3.5 text-[11px] font-bold text-slate-500 whitespace-nowrap">
                          {new Date(tx.date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-[10px] font-black text-slate-600 bg-slate-100 px-2 py-1 rounded-lg tracking-wide">
                            {tx.code}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs font-bold text-slate-600">
                          {tx.party?.name || '-'}
                        </td>
                        <td className="px-4 py-3.5">
                          {tx.type === 'in' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg uppercase tracking-widest">
                              <FiArrowDownCircle size={12} /> GİRİŞ
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg uppercase tracking-widest">
                              <FiArrowUpCircle size={12} /> ÇIKIŞ
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span className={`tabular-nums font-black text-sm tracking-tight ${
                            tx.type === 'in' ? 'text-emerald-700' : 'text-rose-700'
                          }`}>
                            {tx.type === 'in' ? '+' : '-'}
                            {Number(tx.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 ml-1">
                            {tx.currency?.symbol || '₺'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${
                            isCancelled 
                              ? 'bg-red-50 text-red-500 border border-red-100' 
                              : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          }`}>
                            {isCancelled ? 'İPTAL' : 'TAMAMLANDI'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-[11px] font-bold text-slate-500 max-w-[200px] truncate" title={tx.description}>
                          {tx.description || '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
