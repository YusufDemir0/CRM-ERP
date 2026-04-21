import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiArrowRight, FiPlus, FiUsers, FiBox, FiTrendingUp, FiSettings } from 'react-icons/fi';
import { useQuickCreateStore } from '../../store/useQuickCreateStore';

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { openCreate } = useQuickCreateStore();

  const commands = [
    { id: 'new-sale', label: 'Yeni Satış Faturası', icon: <FiPlus />, action: () => navigate('/sales/wizard') },
    { id: 'new-party', label: 'Yeni Cari/Müşteri Ekle', icon: <FiUsers />, action: () => openCreate('party') },
    { id: 'go-stocks', label: 'Stok Durumunu Görüntüle', icon: <FiBox />, action: () => navigate('/stocks') },
    { id: 'go-finance', label: 'Finansal Raporlar', icon: <FiTrendingUp />, action: () => navigate('/transactions') },
    { id: 'go-settings', label: 'Sistem Ayarları', icon: <FiSettings />, action: () => navigate('/settings') },
  ];

  const filteredCommands = commands.filter(cmd => 
    cmd.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setIsOpen(prev => !prev);
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-start justify-center pt-[15vh] px-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsOpen(false)} />
      
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-4 duration-300 border border-slate-100">
        <div className="flex items-center px-6 py-5 border-b border-slate-50">
          <FiSearch className="text-slate-400 mr-4" size={20} />
          <input 
            autoFocus
            type="text" 
            placeholder="Ne yapmak istiyorsunuz? (Örn: 'Satış', 'Cari')"
            className="flex-1 bg-transparent border-none outline-none text-lg font-medium text-slate-800 placeholder:text-slate-300"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="px-2 py-1 bg-slate-100 rounded text-[10px] font-black text-slate-400">ESC</div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredCommands.length > 0 ? (
            <div className="flex flex-col">
              <div className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Önerilen Komutlar</div>
              {filteredCommands.map((cmd) => (
                <button
                  key={cmd.id}
                  onClick={() => { cmd.action(); setIsOpen(false); }}
                  className="w-full flex items-center justify-between px-4 py-4 rounded-xl hover:bg-slate-50 group transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      {cmd.icon}
                    </div>
                    <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900">{cmd.label}</span>
                  </div>
                  <FiArrowRight className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                </button>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm font-bold text-slate-400">Aradığınız kriterde bir komut bulunamadı.</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-500">↑↓</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Gezin</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-500">Enter</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Seç</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Hızlı Erişim</span>
            <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-500">Ctrl + K</span>
          </div>
        </div>
      </div>
    </div>
  );
};
