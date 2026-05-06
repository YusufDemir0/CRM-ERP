import { useConfirmStore } from '../../store/useConfirmStore';
import Modal from '../Modal';

export default function GlobalConfirmModal() {
  const { isOpen, message, isDestructive, handleConfirm, handleCancel } = useConfirmStore();

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Onay Gerekiyor"
      width="400px"
      footer={
        <>
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Vazgeç
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 text-xs font-bold text-white rounded-lg transition-colors shadow-sm ${
              isDestructive
                ? 'bg-[var(--error)] hover:bg-red-600 shadow-red-500/20'
                : 'bg-[var(--primary)] hover:bg-indigo-600 shadow-indigo-500/20'
            }`}
          >
            {isDestructive ? 'Evet, Sil' : 'Onayla'}
          </button>
        </>
      }
    >
      <div className="flex items-center gap-4">
        <div
          className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full ${
            isDestructive ? 'bg-red-100 text-[var(--error)]' : 'bg-indigo-100 text-[var(--primary)]'
          }`}
        >
          {isDestructive ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        <p className="text-sm font-semibold text-slate-700 leading-snug">{message}</p>
      </div>
    </Modal>
  );
}
