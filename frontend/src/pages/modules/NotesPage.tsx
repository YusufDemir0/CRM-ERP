import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiEdit2, FiStar, FiCheck } from 'react-icons/fi';
import { notesAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { confirmDialog } from '../../utils/confirmDialog';

interface Note {
  id: number;
  title: string;
  content: string;
  color: string;
  isPinned: boolean;
  createdAt: string;
}

const COLORS = ['#ffffff', '#fef08a', '#bbf7d0', '#bfdbfe', '#fecaca', '#e9d5ff'];

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNote, setEditingNote] = useState<Partial<Note> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchNotes = async () => {
    try {
      const res = await notesAPI.getAll();
      setNotes(res.data);
    } catch (err: any) {
      toast.error('Notlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNote?.content) return toast.error('Not içeriği boş olamaz!');

    try {
      if (editingNote.id) {
        await notesAPI.update(editingNote.id, editingNote);
        toast.success('Not güncellendi');
      } else {
        await notesAPI.create(editingNote);
        toast.success('Yeni not eklendi');
      }
      setIsModalOpen(false);
      fetchNotes();
    } catch (err: any) {
      const msg = err.response?.data?.message;
      toast.error(typeof msg === 'string' ? msg : 'Kaydetme hatası');
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirmDialog('Bu notu silmek istediğinize emin misiniz?', true);
    if (!confirmed) return;
    try {
      await notesAPI.delete(id);
      toast.success('Not silindi');
      fetchNotes();
    } catch (err: any) {
      toast.error('Silme hatası');
    }
  };

  const togglePin = async (note: Note) => {
    try {
      await notesAPI.update(note.id, { isPinned: !note.isPinned });
      fetchNotes();
    } catch (err: any) {
      toast.error('Pinleme hatası');
    }
  };

  const openNewModal = () => {
    setEditingNote({ title: '', content: '', color: '#fef08a', isPinned: false });
    setIsModalOpen(true);
  };

  if (loading) return <div className="p-4">Yükleniyor...</div>;

  return (
    <div className="module-page" style={{ padding: '20px' }}>
      <div className="module-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Kişisel Notlarım</h1>
        <button className="btn btn-primary" onClick={openNewModal} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiPlus /> YENİ NOT EKLE
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
        {notes.length === 0 && <div style={{ color: 'var(--text-secondary)' }}>Henüz hiç not eklemediniz.</div>}
        {notes.map(note => (
          <div 
            key={note.id} 
            style={{ 
              background: note.color, 
              padding: '15px', 
              borderRadius: '12px', 
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              minHeight: '150px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#1f2937' }}>{note.title}</h3>
              <button 
                onClick={() => togglePin(note)} 
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: note.isPinned ? '#eab308' : '#9ca3af' }}
              >
                <FiStar fill={note.isPinned ? '#eab308' : 'none'} size={20} />
              </button>
            </div>
            
            <p style={{ flex: 1, whiteSpace: 'pre-wrap', fontSize: '14px', color: '#374151', margin: 0 }}>
              {note.content}
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '10px' }}>
              <span style={{ fontSize: '11px', color: '#6b7280' }}>
                {new Date(note.createdAt).toLocaleDateString('tr-TR')}
              </span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn-icon" onClick={() => { setEditingNote(note); setIsModalOpen(true); }}><FiEdit2 size={14} color="#4b5563" /></button>
                <button className="btn-icon" onClick={() => handleDelete(note.id)}><FiTrash2 size={14} color="#ef4444" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && editingNote && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
          <div className="modal-content" style={{ background: '#fff', padding: '25px', borderRadius: '16px', width: '400px', maxWidth: '90%' }}>
            <h2 style={{ marginTop: 0 }}>{editingNote.id ? 'Notu Düzenle' : 'Yeni Not'}</h2>
            
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div className="form-group">
                <label>Başlık (Opsiyonel)</label>
                <input 
                  type="text" 
                  value={editingNote.title || ''} 
                  onChange={e => setEditingNote({...editingNote, title: e.target.value.toLocaleUpperCase('tr-TR')})} 
                  placeholder="Başlık girin..."
                />
              </div>

              <div className="form-group">
                <label>Not İçeriği</label>
                <textarea 
                  required
                  rows={5}
                  value={editingNote.content || ''} 
                  onChange={e => setEditingNote({...editingNote, content: e.target.value})} 
                  placeholder="Notunuzu yazın..."
                  style={{ padding: '10px', resize: 'vertical' }}
                />
              </div>

              <div className="form-group">
                <label>Renk</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {COLORS.map(c => (
                    <div 
                      key={c}
                      onClick={() => setEditingNote({...editingNote, color: c})}
                      style={{
                        width: '30px', height: '30px', borderRadius: '50%', background: c, cursor: 'pointer',
                        border: editingNote.color === c ? '2px solid #2563eb' : '1px solid #d1d5db',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      {editingNote.color === c && <FiCheck color="#2563eb" size={16} />}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn" onClick={() => setIsModalOpen(false)} style={{ flex: 1, background: '#e5e7eb' }}>İptal</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
