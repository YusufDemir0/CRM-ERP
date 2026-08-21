import { useState } from 'react';
import { notesAPI, salesAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { confirmDialog } from '../../utils/confirmDialog';
import { useSort } from '../../hooks/useSort';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../services/queryKeys';
import { formatDisplayDate } from '../../utils/date.helper';
import { 
  FiPlus, FiTrash2, FiEdit2, FiStar, FiCheck, FiSearch, 
  FiHash, FiClipboard, FiClock, FiX, FiFilter
} from 'react-icons/fi';
import { SearchableSelect } from '../../components/common/SearchableSelect';

import { CreateNoteDto, UpdateNoteDto } from '../../types';
import { useAuth } from '../../hooks/useAuth';

interface Note {
  id: number;
  title: string;
  content: string;
  color: string;
  isPinned: boolean;
  createdAt: string;
  status?: string;
}

const COLORS = [
  { name: 'Beyaz', hex: '#ffffff', glow: 'rgba(255,255,255,0.2)' },
  { name: 'Sarı', hex: '#fef3c7', glow: 'rgba(252,211,77,0.2)' },
  { name: 'Yeşil', hex: '#dcfce7', glow: 'rgba(74,222,128,0.2)' },
  { name: 'Mavi', hex: '#dbeafe', glow: 'rgba(96,165,250,0.2)' },
  { name: 'Kırmızı', hex: '#fee2e2', glow: 'rgba(248,113,113,0.2)' },
  { name: 'Mor', hex: '#f3e8ff', glow: 'rgba(192,132,252,0.2)' }
];

export default function NotesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isMasterOrAdmin =
    user?.roles?.some(r => r.toUpperCase() === 'ADMIN') ||
    user?.permissions?.includes('SALES_VIEW_ALL') ||
    user?.permissions?.includes('SALES_MASTER_VIEW');

  const [editingNote, setEditingNote] = useState<Partial<Note> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'notes' | 'pending_errors' | 'resolved_errors' | 'all'>('all');

  // Form states for sales reports
  const [selectedSaleCode, setSelectedSaleCode] = useState('');
  const [description, setDescription] = useState('');

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return notesAPI.update(id, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.all({}) });
      toast.success('Hata durumu güncellendi.');
    },
    onError: () => toast.error('Durum güncellenirken hata oluştu.')
  });

  const { data: notesRaw = [], isLoading: loading } = useQuery<Note[]>({
    queryKey: queryKeys.notes.all({}),
    queryFn: async ({ signal }) => {
      const res = await notesAPI.getAll({ signal });
      return res.data;
    }
  });

  const { data: salesData = [] } = useQuery({
    queryKey: ['sales', 'minimal-lookup'],
    queryFn: async () => {
      const res = await salesAPI.getMinimalLookup();
      return res.data || [];
    },
  });

  const parseSalesReport = (content: string, title: string) => {
    const lines = content.split('\n');
    let saleCode = '';
    let desc = '';
    
    const codeMatch = title.match(/SATIŞ HATASI BİLDİRİMİ:\s*(.+)/);
    if (codeMatch) {
      saleCode = codeMatch[1].trim();
    }
    
    const codeLine = lines.find(l => l.startsWith('Sipariş No:'));
    if (codeLine) {
      saleCode = codeLine.replace('Sipariş No:', '').trim();
    }
    
    const descIndex = lines.findIndex(l => l.startsWith('Açıklama:'));
    if (descIndex !== -1) {
      desc = lines.slice(descIndex).join('\n').replace('Açıklama:', '').trim();
    } else {
      desc = content;
    }
    
    return { saleCode, desc };
  };

  const { sortedData } = useSort(notesRaw as Note[], [
    { key: 'isPinned', direction: 'desc' },
    { key: 'createdAt', direction: 'desc' }
  ]);

  const notes = (sortedData as Note[]).filter((n: Note) => {
    const matchesSearch = n.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          n.content?.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    const isErrorReport = n.title?.startsWith('SATIŞ HATASI BİLDİRİMİ');
    if (activeTab === 'notes') {
      return !isErrorReport;
    }
    if (activeTab === 'pending_errors') {
      return isErrorReport && (!n.status || n.status === 'new');
    }
    if (activeTab === 'resolved_errors') {
      return isErrorReport && (n.status === 'resolved' || n.status === 'ignored');
    }
    return true; // 'all'
  });

  const saveMutation = useMutation({
    mutationFn: async (note: Partial<Note>) => {
      if (note.id) return notesAPI.update(note.id, note);
      return notesAPI.create(note as CreateNoteDto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.all({}) });
      setIsModalOpen(false);
      toast.success(editingNote?.id ? 'Not güncellendi' : 'Yeni not eklendi');
    },
    onError: () => toast.error('Kaydetme hatası')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => notesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.all({}) });
      toast.success('Not silindi');
    },
    onError: () => toast.error('Silme hatası')
  });

  const pinMutation = useMutation({
    mutationFn: (note: Note) => notesAPI.update(note.id, { isPinned: !note.isPinned } as UpdateNoteDto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.all({}) });
    },
    onError: () => toast.error('Pinleme hatası')
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const isReport = editingNote?.title?.startsWith('SATIŞ HATASI BİLDİRİMİ');
    let finalNote = { ...editingNote };

    if (isReport) {
      if (!selectedSaleCode) return toast.error('Lütfen bir sipariş seçiniz!');
      if (!description.trim()) return toast.error('Açıklama boş olamaz!');
      finalNote.title = `SATIŞ HATASI BİLDİRİMİ: ${selectedSaleCode}`;
      finalNote.content = `Sipariş No: ${selectedSaleCode}\nAçıklama: ${description}`;
      finalNote.color = '#fee2e2';
      finalNote.isPinned = true;
    } else {
      if (!finalNote.content?.trim()) return toast.error('Not içeriği boş olamaz!');
    }

    saveMutation.mutate(finalNote);
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirmDialog('Bu notu silmek istediğinize emin misiniz?', true);
    if (confirmed) deleteMutation.mutate(id);
  };

  const togglePin = (note: Note) => {
    pinMutation.mutate(note);
  };

  const openNewModal = () => {
    setSelectedSaleCode('');
    setDescription('');
    setEditingNote({ title: '', content: '', color: '#ffffff', isPinned: false });
    setIsModalOpen(true);
  };

  const openSalesReportModal = () => {
    setSelectedSaleCode('');
    setDescription('');
    setEditingNote({
      title: 'SATIŞ HATASI BİLDİRİMİ',
      content: '',
      color: '#fee2e2',
      isPinned: true
    });
    setIsModalOpen(true);
  };

  const handleStartEdit = (note: Note) => {
    const isReport = note.title?.startsWith('SATIŞ HATASI BİLDİRİMİ');
    if (isReport) {
      const { saleCode, desc } = parseSalesReport(note.content, note.title);
      setSelectedSaleCode(saleCode);
      setDescription(desc);
    } else {
      setSelectedSaleCode('');
      setDescription('');
    }
    setEditingNote(note);
    setIsModalOpen(true);
  };

  if (loading) return <div className="page-container flex items-center justify-center"><div className="spinner" /></div>;

  return (
    <div className="animate-in flex flex-col gap-8">
      
      {/* 🔴 HEADER SECTION */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
            <FiClipboard /> AJANDA VE HATIRLATICI
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-on-surface">
            Kişisel <span className="text-primary">Notlarım</span>
          </h1>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center w-full xl:w-auto">
          <div className="bg-white px-4 rounded-2xl border border-slate-100 shadow-premium flex items-center gap-3 w-full sm:w-[260px] h-12">
            <FiSearch className="text-slate-400 shrink-0" />
            <input 
              type="text" 
              placeholder="Notlarda ara..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-none bg-transparent h-full w-full text-sm font-bold text-slate-600 focus:ring-0 placeholder:text-slate-300"
            />
          </div>
          <button className="h-12 px-5 bg-red-50 text-red-600 border border-red-100 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-colors shadow-sm flex items-center justify-center gap-2 shrink-0" onClick={openSalesReportModal}>
            Satış Hatası Bildir
          </button>
          <button className="h-12 px-6 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-colors shadow-lg shadow-primary/25 flex items-center justify-center gap-3 shrink-0" onClick={openNewModal}>
            <FiPlus size={18} /> Yeni Not
          </button>
        </div>
      </div>

      {/* 🟢 TABS SECTION */}
      <div className="flex border-b border-slate-100 pb-2">
        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
          {(
            [
              { id: 'all', label: 'TÜMÜ' },
              { id: 'notes', label: 'NOTLAR' },
              { id: 'pending_errors', label: 'BEKLEYEN HATALAR' },
              { id: 'resolved_errors', label: 'SONUÇLANAN HATALAR' }
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`h-9 px-4 rounded-lg text-[10px] font-black tracking-widest uppercase transition-colors ${
                activeTab === tab.id 
                  ? 'bg-white text-primary shadow-sm border border-slate-200/50' 
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 🟡 NOTES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {notes.length === 0 && (
          <div className="col-span-full text-center py-24 px-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
            <FiEdit2 size={48} className="mx-auto opacity-20 mb-4" />
            <h4 className="text-lg font-black mb-2">Görünüşe göre burası boş...</h4>
            <p className="text-sm font-bold">Hızlı bir not alarak hafızanı taze tutabilirsin.</p>
          </div>
        )}
        
        {notes.map(note => (
          <div 
            key={note.id} 
            className={`animate-in group relative min-h-[260px] p-7 rounded-2xl flex flex-col transition-colors duration-300 hover:shadow-premium hover:-translate-y-1 ${
              note.isPinned ? 'ring-2 ring-primary ring-offset-2' : 'border border-slate-100 shadow-premium-sm'
            }`}
            style={{ backgroundColor: note.color || '#ffffff' }}
          >
            {/* PIN INDICATOR */}
            <button 
              onClick={() => togglePin(note)} 
              className={`absolute top-5 right-5 w-10 h-10 rounded-2xl flex items-center justify-center transition-colors duration-200 z-10 backdrop-blur-md ${
                note.isPinned ? 'bg-primary text-white shadow-lg' : 'bg-white/60 text-slate-400 opacity-0 group-hover:opacity-100 shadow-sm'
              }`}
            >
              <FiStar fill={note.isPinned ? 'white' : 'none'} size={18} />
            </button>

            <div className="flex-1">
              {note.title?.startsWith('SATIŞ HATASI BİLDİRİMİ') && (
                <div className="mb-3">
                  {(!note.status || note.status === 'new') && (
                    <span className="px-2.5 py-1 bg-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-widest rounded-lg">YENİ HATA</span>
                  )}
                  {note.status === 'ignored' && (
                    <span className="px-2.5 py-1 bg-slate-200/80 text-slate-750 text-[10px] font-black uppercase tracking-widest rounded-lg">ÖNEMSİZ / HATA DEĞİL</span>
                  )}
                  {note.status === 'resolved' && (
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-lg">DÜZELTİLDİ</span>
                  )}
                </div>
              )}
              <h3 className="pr-10 mb-4 text-base font-black text-slate-900 leading-tight tracking-tight">
                {note.title || 'Başlıksız Not'}
              </h3>
              <p className="whitespace-pre-wrap text-sm font-bold text-slate-600/90 leading-relaxed">
                {note.content}
              </p>
            </div>

            <div className="mt-8 pt-5 flex items-center justify-between border-t border-black/5">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <FiClock size={12} />
                {formatDisplayDate(note.createdAt)}
              </div>
              <div className="flex gap-2">
                <button 
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/60 text-slate-400 hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                  onClick={() => handleStartEdit(note)}
                >
                  <FiEdit2 size={14} />
                </button>
                <button 
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/60 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  onClick={() => handleDelete(note.id)}
                >
                  <FiTrash2 size={14} />
                </button>
              </div>
            </div>

            {isMasterOrAdmin && note.title?.startsWith('SATIŞ HATASI BİLDİRİMİ') && (
              <div className="flex gap-1.5 mt-4 pt-3 border-t border-black/5 w-full">
                {(!note.status || note.status === 'new') ? (
                  <>
                    <button
                      type="button"
                      onClick={() => updateStatusMutation.mutate({ id: note.id, status: 'resolved' })}
                      className="flex-1 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-600 text-[9px] font-black uppercase tracking-wider transition-all"
                    >
                      Düzeltildi
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStatusMutation.mutate({ id: note.id, status: 'ignored' })}
                      className="flex-1 h-8 rounded-lg bg-slate-100 hover:bg-slate-650 hover:text-white text-slate-650 text-[9px] font-black uppercase tracking-wider transition-all"
                    >
                      Önemsiz
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => updateStatusMutation.mutate({ id: note.id, status: 'new' })}
                    className="flex-1 h-8 rounded-lg bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 text-[9px] font-black uppercase tracking-wider transition-all"
                  >
                    Yeniden Aç
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 🟢 MODAL SECTION */}
      {isModalOpen && editingNote && (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white max-w-[550px] w-full p-6 rounded-2xl shadow-premium-lg border border-slate-100 flex flex-col gap-8 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {editingNote.title?.startsWith('SATIŞ HATASI BİLDİRİMİ') ? 'Satış Hatası Bildir' : (editingNote.id ? 'Notu Güncelle' : 'Hızlı Bir Not Al')}
              </h2>
              <button className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:text-red-500 transition-colors" onClick={() => setIsModalOpen(false)}><FiX size={20} /></button>
            </div>
            
            <form onSubmit={handleSave} className="flex flex-col gap-6">
              {editingNote.title?.startsWith('SATIŞ HATASI BİLDİRİMİ') ? (
                <>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">SİPARİŞ SEÇİMİ *</label>
                    <SearchableSelect
                      placeholder="Sipariş seçin..."
                      options={(salesData || []).map((s: any) => {
                        const phone = s.phone || s.party?.phone1 || '—';
                        return {
                          id: s.code,
                          label: `${s.code} / ${s.party?.name || 'Cari Belirtilmemiş'} / ${phone} / ( ${Number(s.grandTotal || 0).toLocaleString('tr-TR')} ₺ )`
                        };
                      })}
                      value={selectedSaleCode}
                      onChange={(opt) => setSelectedSaleCode(opt ? String(opt.id) : '')}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">AÇIKLAMA *</label>
                    <textarea 
                      required
                      rows={6}
                      value={description} 
                      onChange={e => setDescription(e.target.value)} 
                      placeholder="Satış hatası ayrıntılarını buraya yazın..."
                      className="p-5 rounded-3xl border border-slate-100 bg-slate-50 font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-colors min-h-[150px] resize-none placeholder:text-slate-300"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">BAŞLIK (OPSİYONEL)</label>
                    <input 
                      type="text" 
                      value={editingNote.title || ''} 
                      onChange={e => setEditingNote({...editingNote, title: e.target.value.toLocaleUpperCase('tr-TR')})} 
                      placeholder="Fikir veya hatıralarını isimlendir..."
                      className="h-14 px-5 rounded-2xl border border-slate-100 bg-slate-50 font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-colors uppercase placeholder:text-slate-300"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">İÇERİK</label>
                    <textarea 
                      required
                      rows={6}
                      value={editingNote.content || ''} 
                      onChange={e => setEditingNote({...editingNote, content: e.target.value})} 
                      placeholder="Aklındakileri buraya boşalt..."
                      className="p-5 rounded-3xl border border-slate-100 bg-slate-50 font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-colors min-h-[150px] resize-none placeholder:text-slate-300"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-3 block">VİRGÜL RENGİ (KATEGORİ)</label>
                    <div className="flex flex-wrap gap-3">
                      {COLORS.map(c => (
                        <button 
                          key={c.hex}
                          type="button"
                          onClick={() => setEditingNote({...editingNote, color: c.hex})}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-200 ${
                            editingNote.color === c.hex ? 'ring-4 ring-primary ring-opacity-20 scale-110' : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: c.hex, border: '1px solid rgba(0,0,0,0.05)' }}
                        >
                          {editingNote.color === c.hex && <FiCheck className="text-primary" size={18} />}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <button type="submit" className="flex-1 h-14 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-colors shadow-lg shadow-primary/25">
                  {editingNote.id ? 'GÜNCELLEMELERİ KAYDET' : 'NOTU DEFTERE EKLE'}
                </button>
                <button type="button" className="flex-[0.4] h-14 bg-slate-50 text-slate-500 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-100 transition-colors" onClick={() => setIsModalOpen(false)}>VAZGEÇ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
