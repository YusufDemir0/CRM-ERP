import React, { useState, useEffect } from 'react';
import { notesAPI } from '../../services/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FiX, FiAlertOctagon } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { Sale } from '../../types';

interface ReportErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
}

export const ReportErrorModal: React.FC<ReportErrorModalProps> = ({ isOpen, onClose, sale }) => {
  const [description, setDescription] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isOpen) {
      setDescription('');
    }
  }, [isOpen]);

  const reportMutation = useMutation({
    mutationFn: async (data: { saleCode: string; desc: string }) => {
      return notesAPI.create({
        title: `SATIŞ HATASI BİLDİRİMİ: ${data.saleCode}`,
        content: `Sipariş No: ${data.saleCode}\nAçıklama: ${data.desc}`,
        color: '#fee2e2',
        isPinned: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast.success("Satış hatası başarıyla bildirildi.");
      onClose();
    },
    onError: () => {
      toast.error("Hata bildirilirken bir sorun oluştu.");
    }
  });

  if (!isOpen || !sale) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error("Lütfen hata açıklamasını giriniz.");
      return;
    }
    reportMutation.mutate({
      saleCode: sale.code,
      desc: description.trim()
    });
  };

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white max-w-[550px] w-full rounded-3xl shadow-2xl border border-slate-100 flex flex-col animate-in zoom-in-95 duration-300 relative overflow-hidden">
        
        {/* HEADER */}
        <div className="p-6 pb-4 flex-shrink-0 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
              <FiAlertOctagon size={24} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">SATIŞ HATASI BİLDİR</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                Sipariş: {sale.code} — {sale.party?.name || 'Müşteri Belirtilmemiş'}
              </p>
            </div>
          </div>
          <button 
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:text-red-500 transition-colors" 
            onClick={onClose}
          >
            <FiX size={20} />
          </button>
        </div>

        {/* CONTENT */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Hata Açıklaması *</label>
            <textarea 
              required
              rows={6}
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="Satış hatası ayrıntılarını ve nedenini buraya yazın..."
              className="p-5 rounded-3xl border border-slate-100 bg-slate-50 font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-colors min-h-[150px] resize-none placeholder:text-slate-350"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <button 
              type="submit" 
              disabled={reportMutation.isPending}
              className="flex-1 h-14 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-red-600/20 disabled:opacity-50 disabled:pointer-events-none"
            >
              {reportMutation.isPending ? 'BİLDİRİLİYOR...' : 'HATAYI BİLDİR'}
            </button>
            <button 
              type="button" 
              className="flex-[0.4] h-14 bg-slate-50 text-slate-500 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-100 transition-colors" 
              onClick={onClose}
            >
              VAZGEÇ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
