import React, { useState } from 'react';
import { notesAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { confirmDialog } from '../../utils/confirmDialog';
import { useSort } from '../../hooks/useSort';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FiPlus, FiTrash2, FiEdit2, FiStar, FiCheck, FiSearch, 
  FiHash, FiClipboard, FiClock, FiX, FiFilter
} from 'react-icons/fi';

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
    queryKey: ['notes'],
    queryFn: async () => {
      const res = await notesAPI.getAll();
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
      return notesAPI.create(note as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setIsModalOpen(false);
      toast.success(editingNote?.id ? 'Not güncellendi' : 'Yeni not eklendi');
    },
    onError: () => toast.error('Kaydetme hatası')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => notesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast.success('Not silindi');
    },
    onError: () => toast.error('Silme hatası')
  });

  const pinMutation = useMutation({
    mutationFn: (note: Note) => notesAPI.update(note.id, { isPinned: !note.isPinned } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
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

  if (loading) return <div className="spinner" />;

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* 🔴 HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ 
            display: 'inline-flex', alignItems: 'center', gap: '8px', 
            background: 'var(--primary-glow)', color: 'var(--primary)', 
            padding: '6px 14px', borderRadius: '12px', fontSize: '12px', 
            fontWeight: 800, marginBottom: '16px'
          }}>
            <FiClipboard /> AJANDA VE HATIRLATICI
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--on-surface)' }}>
            Kişisel <span style={{ color: 'var(--primary)' }}>Notlarım</span>
          </h1>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="glass-panel" style={{ padding: '0 16px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '8px', background: 'white', width: '300px' }}>
            <FiSearch color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Notlarda ara..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', background: 'transparent', height: '44px', width: '100%', fontSize: '14px', fontWeight: 600 }}
            />
          </div>
          <button className="btn btn-primary" style={{ height: '44px', boxShadow: '0 10px 20px var(--primary-glow)' }} onClick={openNewModal}>
            <FiPlus size={18} /> Yeni Not
          </button>
        </div>
      </div>

      {/* 🟡 NOTES GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
        {notes.length === 0 && (
          <div style={{ 
            gridColumn: '1 / -1', textAlign: 'center', padding: '100px 40px',
            background: 'var(--surface-container-low)', borderRadius: '32px',
            border: '2px dashed var(--border)', color: 'var(--text-muted)'
          }}>
            <FiEdit2 size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
            <h4 style={{ fontWeight: 800, marginBottom: '8px' }}>Görünüşe göre burası boş...</h4>
            <p style={{ fontSize: '14px', fontWeight: 600 }}>Hızlı bir not alarak hafızanı taze tutabilirsin.</p>
          </div>
        )}
        
        {notes.map(note => (
          <div 
            key={note.id} 
            className="glass-panel animate-in"
            style={{ 
              background: note.color || '#ffffff', 
              padding: '24px', 
              borderRadius: '24px', 
              display: 'flex',
              flexDirection: 'column',
              minHeight: '260px',
              border: note.isPinned ? '2px solid var(--primary)' : '1px solid rgba(0,0,0,0.05)',
              transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* PIN INDICATOR */}
            <button 
              onClick={() => togglePin(note)} 
              style={{ 
                position: 'absolute', top: '20px', right: '20px',
                width: '36px', height: '36px', borderRadius: '12px',
                background: note.isPinned ? 'var(--primary)' : 'rgba(255,255,255,0.6)',
                color: note.isPinned ? 'white' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: 'none', cursor: 'pointer', zIndex: 2, transition: '0.2s',
                backdropFilter: 'blur(4px)', boxShadow: 'var(--shadow-sm)'
              }}
            >
              <FiStar fill={note.isPinned ? 'white' : 'none'} size={18} />
            </button>

            <div style={{ flex: 1 }}>
              <h3 style={{ 
                margin: '0 40px 16px 0', fontSize: '1.1rem', fontWeight: 900, 
                color: 'rgba(15, 23, 42, 0.9)', letterSpacing: '-0.02em',
                lineHeight: '1.3'
              }}>
                {note.title || 'Başlıksız Not'}
              </h3>
              <p style={{ 
                whiteSpace: 'pre-wrap', fontSize: '15px', fontWeight: 500,
                color: 'rgba(71, 85, 105, 0.9)', margin: 0, lineHeight: '1.6' 
              }}>
                {note.content}
              </p>
            </div>

            <div style={{ 
              marginTop: '24px', display: 'flex', justifyContent: 'space-between', 
              alignItems: 'center', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '16px' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(0,0,0,0.4)', fontSize: '11px', fontWeight: 800 }}>
                <FiClock size={12} />
                {new Date(note.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="btn-icon circle" 
                  style={{ background: 'rgba(255,255,255,0.6)', width: '36px', height: '36px' }}
                  onClick={() => { setEditingNote(note); setIsModalOpen(true); }}
                >
                  <FiEdit2 size={14} />
                </button>
                <button 
                  className="btn-icon circle" 
                  style={{ background: 'rgba(255,255,255,0.6)', width: '36px', height: '36px' }}
                  onClick={() => handleDelete(note.id)}
                >
                  <FiTrash2 size={14} color="var(--error)" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 🟢 MODAL SECTION */}
      {isModalOpen && editingNote && (
        <div className="loader-overlay" style={{ alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', background: 'rgba(15, 23, 42, 0.4)' }}>
          <div className="glass-panel" style={{ maxWidth: '500px', width: '95%', padding: '40px', borderRadius: '32px', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--on-surface)' }}>
                {editingNote.id ? 'Notu Güncelle' : 'Hızlı Bir Not Al'}
              </h2>
              <button className="btn-icon circle" onClick={() => setIsModalOpen(false)}><FiX size={20} /></button>
            </div>
            
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>BAŞLIK (OPSİYONEL)</label>
                <input 
                  type="text" 
                  value={editingNote.title || ''} 
                  onChange={e => setEditingNote({...editingNote, title: e.target.value.toLocaleUpperCase('tr-TR')})} 
                  placeholder="Fikir veya hatıralarını isimlendir..."
                  style={{ height: '52px' }}
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>İÇERİK</label>
                <textarea 
                  required
                  rows={6}
                  value={editingNote.content || ''} 
                  onChange={e => setEditingNote({...editingNote, content: e.target.value})} 
                  placeholder="Aklındakileri buraya boşalt..."
                  style={{ padding: '16px', resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '12px', display: 'block' }}>VİRGÜL RENGİ (KATEGORİ)</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {COLORS.map(c => (
                    <div 
                      key={c.hex}
                      onClick={() => setEditingNote({...editingNote, color: c.hex})}
                      style={{
                        width: '36px', height: '36px', borderRadius: '12px', background: c.hex, cursor: 'pointer',
                        border: editingNote.color === c.hex ? '3px solid var(--primary)' : '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: '0.2s', boxShadow: editingNote.color === c.hex ? '0 4px 12px '+c.glow : 'none'
                      }}
                    >
                      {editingNote.color === c.hex && <FiCheck color="var(--primary)" size={18} />}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '56px', fontSize: '15px' }}>
                  {editingNote.id ? 'GÜNCELLEMELERİ KAYDET' : 'NOTU DEFTERE EKLE'}
                </button>
                <button type="button" className="btn btn-secondary" style={{ flex: 0.4, height: '56px', background: 'white' }} onClick={() => setIsModalOpen(false)}>VAZGEÇ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
