import { useState } from 'react';
import Modal from '../Modal';
import { Account, Currency } from '../../types';
import { PremiumNumberInput } from '../common/PremiumNumberInput';
import { getTodayString } from '../../utils/date.helper';
import toast from 'react-hot-toast';

interface TransferFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  currencies: Currency[];
  onSubmit: (data: {
    fromAccountId: string;
    toAccountId: string;
    amount: string;
    currencyId?: string;
    date: string;
    description?: string;
  }) => void;
  loading?: boolean;
}

export default function TransferFundsModal({
  isOpen,
  onClose,
  accounts,
  currencies,
  onSubmit,
  loading
}: TransferFundsModalProps) {
  const [formData, setFormData] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: 0,
    currencyId: '',
    date: getTodayString(),
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fromAccountId || !formData.toAccountId) {
      toast.error('Lütfen kaynak ve hedef hesapları seçiniz.');
      return;
    }

    if (formData.fromAccountId === formData.toAccountId) {
      toast.error('Kaynak ve hedef hesap aynı olamaz.');
      return;
    }

    if (formData.amount <= 0) {
      toast.error('Lütfen geçerli bir transfer tutarı giriniz.');
      return;
    }

    onSubmit({
      fromAccountId: formData.fromAccountId,
      toAccountId: formData.toAccountId,
      amount: formData.amount.toString(),
      currencyId: formData.currencyId || undefined,
      date: formData.date,
      description: formData.description
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="KASA / BANKA TRANSFERİ YAP"
      width="550px"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !formData.fromAccountId || !formData.toAccountId || formData.amount <= 0}
            className="px-4 py-2 text-xs font-bold text-white rounded-lg transition-colors shadow-sm bg-[var(--primary)] hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Aktarılıyor...' : 'Transferi Tamamla'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-slate-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-[10px] font-black text-slate-405 uppercase tracking-widest px-1">KAYNAK HESAP (ÇIKIŞ) *</label>
            <select
              required
              value={formData.fromAccountId}
              onChange={(e) => setFormData({ ...formData, fromAccountId: e.target.value })}
              className="h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs text-slate-700 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
            >
              <option value="">Seçiniz...</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} [{a.bankName || 'Kasa'}]
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-[10px] font-black text-slate-405 uppercase tracking-widest px-1">HEDEF HESAP (GİRİŞ) *</label>
            <select
              required
              value={formData.toAccountId}
              onChange={(e) => setFormData({ ...formData, toAccountId: e.target.value })}
              className="h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs text-slate-700 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
            >
              <option value="">Seçiniz...</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} [{a.bankName || 'Kasa'}]
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5 sm:col-span-2 text-left">
            <label className="text-[10px] font-black text-slate-405 uppercase tracking-widest px-1">TRANSFER TUTARI *</label>
            <PremiumNumberInput
              value={formData.amount}
              onChange={(val) => setFormData({ ...formData, amount: val })}
              className="h-12"
            />
          </div>

          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-[10px] font-black text-slate-405 uppercase tracking-widest px-1">DÖVİZ</label>
            <select
              value={formData.currencyId}
              onChange={(e) => setFormData({ ...formData, currencyId: e.target.value })}
              className="h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs text-slate-700 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
            >
              <option value="">Hesap Para Birimi</option>
              {currencies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 text-left">
          <label className="text-[10px] font-black text-slate-405 uppercase tracking-widest px-1">TRANSFER TARİHİ *</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            onKeyDown={(e) => e.preventDefault()}
            className="h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs text-slate-700 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        <div className="flex flex-col gap-1.5 text-left">
          <label className="text-[10px] font-black text-slate-405 uppercase tracking-widest px-1">TRANSFER AÇIKLAMASI</label>
          <textarea
            rows={2}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="p-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-xs text-slate-700 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all resize-none placeholder:text-slate-350"
            placeholder="İsteğe bağlı açıklama..."
          />
        </div>
      </form>
    </Modal>
  );
}
