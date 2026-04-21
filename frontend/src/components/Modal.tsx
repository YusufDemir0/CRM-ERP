import { ReactNode, useEffect } from 'react';
import { FiX } from 'react-icons/fi';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}

export default function Modal({ isOpen, onClose, title, children, footer, width }: ModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      <div 
        className="relative bg-white rounded-2xl shadow-premium overflow-hidden animate-in zoom-in duration-300 w-full" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: width || '500px' }}
      >
        <div className="modal-header border-b border-slate-50 px-6 py-4 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">{title}</h3>
          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-primary transition-colors" onClick={onClose}><FiX size={18} /></button>
        </div>
        <div className="modal-body p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {children}
        </div>
        {footer && <div className="modal-footer border-t border-slate-50 px-6 py-4 bg-slate-50/50 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}
