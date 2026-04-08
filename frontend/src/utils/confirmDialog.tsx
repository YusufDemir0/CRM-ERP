import toast from 'react-hot-toast';
import React from 'react';

export const confirmDialog = (message: string, isDestructive: boolean = false): Promise<boolean> => {
  return new Promise((resolve) => {
    toast((t) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '5px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>{isDestructive ? '⚠️' : '❓'}</span>
          <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1f2937', lineHeight: '1.4' }}>{message}</span>
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
          <button 
            className="btn" 
            style={{ padding: '8px 16px', background: '#f3f4f6', color: '#374151', fontSize: '0.85rem' }} 
            onClick={() => { toast.dismiss(t.id); resolve(false); }}
          >
            Vazgeç
          </button>
          <button 
            className="btn btn-primary" 
            style={{ padding: '8px 16px', background: isDestructive ? '#ef4444' : 'var(--primary)', color: 'white', fontSize: '0.85rem' }} 
            onClick={() => { toast.dismiss(t.id); resolve(true); }}
          >
            Onayla ve Devam Et
          </button>
        </div>
      </div>
    ), { 
      duration: Infinity, 
      position: 'top-center', 
      style: { 
        minWidth: '350px', 
        maxWidth: '500px', 
        padding: '20px', 
        borderRadius: '16px', 
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)' 
      } 
    });
  });
};
