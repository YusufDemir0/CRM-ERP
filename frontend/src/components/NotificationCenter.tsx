import React, { useState, useEffect, useRef, memo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiBell, FiCheck, FiInfo, FiTrash2, FiClock } from 'react-icons/fi';
import { logsAPI } from '../services/api';
import { formatDisplayDate } from '../utils/date.helper';
import { translateLog } from '../utils/logTranslator';
import toast from 'react-hot-toast';

import { Log } from '../types';

export const NotificationCenter = memo(() => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await logsAPI.getNotifications();
      return res.data;
    },
    enabled: !!localStorage.getItem('token'), // Only fetch if token exists
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string | number) => logsAPI.markAsRead(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => logsAPI.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Tüm bildirimler okundu olarak işaretlendi');
    },
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.length;

  return (
    <div className="relative" ref={containerRef}>
      <button 
        className={`nav-action-btn relative bg-[var(--surface)] border-[1.5px] ${unreadCount > 0 ? 'border-primary' : 'border-[var(--border)]'} text-[var(--text-primary)] p-2.5 rounded-[14px] cursor-pointer transition-all hover:scale-105`} 
        onClick={() => setIsOpen(!isOpen)}
        title="Bildirimler"
      >
        <FiBell size={20} className={unreadCount > 0 ? 'text-primary animate-pulse' : ''} />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-primary text-white text-[10px] font-black rounded-full border-2 border-white flex items-center justify-center px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 z-[2000] overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-black text-slate-800 tracking-tight">BİLDİRİMLER</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{unreadCount} YENİ HAREKET</p>
            </div>
            {unreadCount > 0 && (
              <button 
                onClick={() => markAllReadMutation.mutate()}
                className="text-[10px] font-black text-primary hover:underline uppercase tracking-tighter"
              >
                TÜMÜNÜ OKUNDU YAP
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="spinner mx-auto w-6 h-6 border-2 border-primary border-t-transparent animate-spin rounded-full"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiBell size={24} className="text-slate-200" />
                </div>
                <p className="text-sm font-bold text-slate-400 italic">Henüz yeni bir bildirim yok.</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.map((log: Log) => {
                  const translated = translateLog(log);
                  return (
                    <div 
                      key={log.id} 
                      className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors group relative"
                    >
                      <div className="flex gap-3">
                        <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${
                          log.tag === 'ERROR' ? 'bg-rose-50 text-rose-500' : 
                          log.tag === 'WARNING' ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-500'
                        }`}>
                          {log.tag === 'ERROR' ? <FiTrash2 size={18} /> : <FiInfo size={18} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-slate-800 leading-tight mb-1 uppercase tracking-tight">{translated.title}</p>
                          <p className="text-[11px] text-slate-500 line-clamp-2 mb-2">{translated.message}</p>
                          <div className="flex items-center gap-3 text-[9px] font-bold text-slate-400 uppercase">
                            <span className="flex items-center gap-1"><FiClock size={10} /> {formatDisplayDate(log.createdAt)}</span>
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[8px]">{log.module}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => markReadMutation.mutate(log.id)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-primary transition-all"
                          title="Okundu"
                        >
                          <FiCheck size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
             <button className="text-[10px] font-black text-slate-400 hover:text-primary transition-colors uppercase tracking-widest">Tüm Aktivite Kayıtlarını Gör</button>
          </div>
        </div>
      )}
    </div>
  );
});
