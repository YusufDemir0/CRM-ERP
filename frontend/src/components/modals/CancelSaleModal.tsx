import { useState } from 'react';
import Modal from '../Modal';

interface CancelSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  loading?: boolean;
}

export default function CancelSaleModal({ isOpen, onClose, onSubmit, loading }: CancelSaleModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Lütfen iptal/silme nedenini giriniz.');
      return;
    }
    setError('');
    onSubmit(reason.trim());
  };

  const handleCancel = () => {
    setReason('');
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="SATIŞ İPTAL ET / SİL"
      width="450px"
      footer={
        <>
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !reason.trim()}
            className="px-4 py-2 text-xs font-bold text-white rounded-lg transition-colors shadow-sm bg-[var(--error)] hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'İşleniyor...' : 'Satışı İptal Et'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-red-100 text-[var(--error)]">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-700 leading-snug">Bu satışı iptal etmek istediğinize emin misiniz?</h4>
            <p className="text-xs text-slate-450 mt-1">İptal işlemi geri alınamaz ve ilgili stoklar ilgili depolara iade edilir.</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="cancel-reason" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
            İptal / Silme Nedeni *
          </label>
          <textarea
            id="cancel-reason"
            rows={3}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (e.target.value.trim()) setError('');
            }}
            placeholder="Lütfen iptal veya silme nedenini buraya detaylıca yazınız..."
            className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-red-100 transition-all resize-none ${
              error ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-red-400'
            }`}
          />
          {error && <span className="text-[10px] font-bold text-red-500 block">{error}</span>}
        </div>
      </form>
    </Modal>
  );
}
