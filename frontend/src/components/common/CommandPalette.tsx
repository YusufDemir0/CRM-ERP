import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import { 
  FiSearch, FiPlus, FiUsers, FiBox, 
  FiTrendingUp, FiSettings, FiLayout, FiFileText 
} from 'react-icons/fi';
import { useQuickCreateStore } from '../../store/useQuickCreateStore';

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { openCreate } = useQuickCreateStore();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setIsOpen(prev => !prev);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const runCommand = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <Command.Dialog 
      open={isOpen} 
      onOpenChange={setIsOpen} 
      label="Global Command Palette"
      className="fixed inset-0 z-[10000] flex items-start justify-center pt-[15vh] px-4"
    >
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsOpen(false)} />
      
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-4 duration-300 border border-slate-100 flex flex-col">
        <div className="flex items-center px-6 border-b border-slate-50">
          <FiSearch className="text-slate-400 mr-4" size={20} />
          <Command.Input 
            placeholder="Ne yapmak istiyorsunuz? (Örn: 'Satış', 'Cari')"
            className="flex-1 h-16 bg-transparent border-none outline-none text-lg font-medium text-slate-800 placeholder:text-slate-300"
          />
          <div className="px-2 py-1 bg-slate-100 rounded text-[10px] font-black text-slate-400">ESC</div>
        </div>

        <Command.List className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
          <Command.Empty className="py-12 text-center text-sm font-bold text-slate-400">
            Aradığınız kriterde bir komut bulunamadı.
          </Command.Empty>

          <Command.Group heading="Hızlı İşlemler" className="px-2 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <Item icon={<FiPlus />} label="Yeni Satış Faturası" onSelect={() => runCommand(() => navigate('/sales/wizard'))} />
            <Item icon={<FiUsers />} label="Yeni Cari/Müşteri Ekle" onSelect={() => runCommand(() => openCreate('party'))} />
            <Item icon={<FiBox />} label="Yeni Ürün Kaydı" onSelect={() => runCommand(() => openCreate('item'))} />
          </Command.Group>

          <Command.Separator className="h-px bg-slate-50 my-2" />

          <Command.Group heading="Navigasyon" className="px-2 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <Item icon={<FiLayout />} label="Dashboard / Özet" onSelect={() => runCommand(() => navigate('/'))} />
            <Item icon={<FiBox />} label="Stok Durumu" onSelect={() => runCommand(() => navigate('/stocks'))} />
            <Item icon={<FiTrendingUp />} label="Finansal Hareketler" onSelect={() => runCommand(() => navigate('/transactions'))} />
            <Item icon={<FiFileText />} label="Satış Listesi" onSelect={() => runCommand(() => navigate('/sales'))} />
          </Command.Group>

          <Command.Separator className="h-px bg-slate-50 my-2" />

          <Command.Group heading="Sistem" className="px-2 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <Item icon={<FiSettings />} label="Sistem Ayarları" onSelect={() => runCommand(() => navigate('/settings'))} />
            <Item icon={<FiUsers />} label="Kullanıcı Yönetimi" onSelect={() => runCommand(() => navigate('/users'))} />
          </Command.Group>
        </Command.List>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-500">↑↓ Gezin</kbd>
            <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-500">Enter Seç</kbd>
          </div>
          <kbd className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Ctrl + K</kbd>
        </div>
      </div>
    </Command.Dialog>
  );
};

const Item = ({ icon, label, onSelect }: { icon: React.ReactNode; label: string; onSelect: () => void }) => (
  <Command.Item
    onSelect={onSelect}
    className="w-full flex items-center justify-between px-4 py-4 rounded-xl cursor-pointer aria-selected:bg-slate-50 group transition-colors"
  >
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-aria-selected:bg-primary/10 group-aria-selected:text-primary transition-colors">
        {icon}
      </div>
      <span className="text-sm font-bold text-slate-700 group-aria-selected:text-slate-900">{label}</span>
    </div>
  </Command.Item>
);
