import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { FiLock, FiAlertCircle, FiArrowRight } from 'react-icons/fi';

export const ReAuthModal: React.FC = () => {
  const { isReAuthModalOpen, login, user, logout } = useAuthStore();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isReAuthModalOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Lütfen şifrenizi giriniz.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(user.username, password);
      setPassword('');
    } catch (err: any) {
      setError('Hatalı şifre. Lütfen tekrar deneyiniz.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Heavy Backdrop */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />
      
      <div className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="p-8 sm:p-10">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mb-6 animate-bounce">
              <FiLock size={32} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Oturum Süreniz Doldu</h2>
            <p className="text-sm font-medium text-slate-500 leading-relaxed">
              Veri kaybını önlemek için oturumunuzu dondurduk. <br />
              Devam etmek için <strong>{user.username}</strong> parolasını girin.
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 animate-shake">
              <FiAlertCircle className="text-red-500" />
              <span className="text-[11px] font-black text-red-600 uppercase tracking-wider">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">GİZLİ PAROLA</label>
              <input
                type="password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-14 px-5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-800 font-bold placeholder:text-slate-300 focus:bg-white focus:border-primary transition-all outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-16 w-full bg-primary text-white rounded-2xl text-sm font-black tracking-widest uppercase shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? 'DOĞRULANIYOR...' : (
                <>DEVAM ET <FiArrowRight /></>
              )}
            </button>

            <button
              type="button"
              onClick={() => logout()}
              className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors"
            >
              FARKLI BİR HESAPLA GİRİŞ YAP
            </button>
          </form>
        </div>

        <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 flex justify-center">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">KORUMALI OTURUM YÖNETİMİ</span>
        </div>
      </div>
    </div>
  );
};
