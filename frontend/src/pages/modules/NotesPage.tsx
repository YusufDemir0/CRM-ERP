import { useState } from 'react';
import { notesAPI } from '../../services/api';
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

import { CreateNoteDto, UpdateNoteDto } from '../../types';

interface Note {
  id: number;
  title: string;
  content: string;
  color: string;
  isPinned: boolean;
  createdAt: string;
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
  const [editingNote, setEditingNote] = useState<Partial<Note> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: notesRaw = [], isLoading: loading } = useQuery<Note[]>({
    queryKey: queryKeys.notes.all({}),
    queryFn: async ({ signal }) => {
      const res = await notesAPI.getAll({ signal });
      return res.data;
    }
  });

  const { sortedData } = useSort(notesRaw as Note[], [
    { key: 'isPinned', direction: 'desc' },
    { key: 'createdAt', direction: 'desc' }
  ]);

  const notes = (sortedData as Note[]).filter((n: Note) => 
    n.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    n.content?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    if (!editingNote?.content) return toast.error('Not içeriği boş olamaz!');
    saveMutation.mutate(editingNote);
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirmDialog('Bu notu silmek istediğinize emin misiniz?', true);
    if (confirmed) deleteMutation.mutate(id);
  };

  const togglePin = (note: Note) => {
    pinMutation.mutate(note);
  };

  const openNewModal = () => {
    setEditingNote({ title: '', content: '', color: '#fef3c7', isPinned: false });
    setIsModalOpen(true);
  };

  if (loading) return <div className="page-container flex items-center justify-center"><div className="spinner" /></div>;

  return (
    <div className="animate-in flex flex-col gap-8">
      
      {/* 🔴 HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
            <FiClipboard /> AJANDA VE HATIRLATICI
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-on-surface">
            Kişisel <span className="text-primary">Notlarım</span>
          </h1>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="bg-white px-4 rounded-2xl border border-slate-100 shadow-premium flex items-center gap-3 w-full sm:w-[300px]">
            <FiSearch className="text-slate-400 shrink-0" />
            <input 
              type="text" 
              placeholder="Notlarda ara..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-none bg-transparent h-12 w-full text-sm font-bold text-slate-600 focus:ring-0 placeholder:text-slate-300"
            />
          </div>
          <button className="h-12 px-6 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-colors shadow-lg shadow-primary/25 flex items-center justify-center gap-3 shrink-0" onClick={openNewModal}>
            <FiPlus size={18} /> Yeni Not
          </button>
        </div>
      </div>

      {/* 🟡 NOTES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {notes.length === 0 && (
          <div className="col-span-full text-center py-24 px-10 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-slate-400">
            <FiEdit2 size={48} className="mx-auto opacity-20 mb-4" />
            <h4 className="text-lg font-black mb-2">Görünüşe göre burası boş...</h4>
            <p className="text-sm font-bold">Hızlı bir not alarak hafızanı taze tutabilirsin.</p>
          </div>
        )}
        
        {notes.map(note => (
          <div 
            key={note.id} 
            className={`animate-in group relative min-h-[260px] p-7 rounded-[2rem] flex flex-col transition-colors duration-300 hover:shadow-premium hover:-translate-y-1 ${
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
                  onClick={() => { setEditingNote(note); setIsModalOpen(true); }}
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
          </div>
        ))}
      </div>

      {/* 🟢 MODAL SECTION */}
      {isModalOpen && editingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white max-w-[550px] w-full p-10 rounded-[3rem] shadow-premium-lg border border-slate-100 flex flex-col gap-8 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {editingNote.id ? 'Notu Güncelle' : 'Hızlı Bir Not Al'}
              </h2>
              <button className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:text-red-500 transition-colors" onClick={() => setIsModalOpen(false)}><FiX size={20} /></button>
            </div>
            
            <form onSubmit={handleSave} className="flex flex-col gap-6">
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
