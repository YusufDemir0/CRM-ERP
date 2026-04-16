import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLoaderStore } from '../../store/useLoaderStore';
import { FiLock, FiUser, FiArrowRight, FiShield } from 'react-icons/fi';

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Eğer zaten giriş yapılmışsa doğrudan ana sayfaya yönlendir
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const loaderShow = useLoaderStore((s) => s.show);
  const loaderHide = useLoaderStore((s) => s.hide);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    loaderShow('ERP Sistemi Doğrulanıyor...');

    try {
      await login(username, password);
      loaderHide();
      navigate('/');
    } catch (err: unknown) {
      loaderHide();

      let msg: unknown = undefined;
      if (err instanceof Error && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: unknown } } };
        msg = axiosErr.response?.data?.message;
      }

      // Handle message as array/object
      if (Array.isArray(msg)) {
        msg = msg[0];
      }
      if (typeof msg === 'object' && msg !== null) {
        msg = JSON.stringify(msg);
      }

      // Safe check for string before string methods
      const safeMsg = typeof msg === 'string' ? msg : '';

      if (safeMsg === 'INVALID_USERNAME') {
        setError('Böyle bir kullanıcı tanımlı değil. Lütfen sistem yöneticiniz ile iletişime geçiniz.');
      } 
      else if (safeMsg === 'INVALID_PASSWORD') {
        setError('Parolanız hatalı. Lütfen büyük/küçük harf duyarlılığına dikkat ederek tekrar deneyiniz.');
      } 
      else if (safeMsg.toLowerCase().includes('devre dışı')) {
        setError('Hesabınız askıya alınmıştır. Detaylar için merkez ofis ile görüşün.');
      } 
      else if (safeMsg.toLowerCase().includes('kilitlenmiştir')) {
        setError('Güvenlik nedeniyle hesabınız kilitlenmiştir. 15 dakika sonra tekrar deneyebilirsiniz.');
      }
      else {
        setError('Kullanıcı kimliği veya parola doğrulanamadı.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#4d44e3_0%,#000f21_100%)] flex items-center justify-center p-6">
      
      <div className="login-box max-w-[460px] w-full p-8 sm:p-14 bg-white/95 backdrop-blur-md rounded-4xl shadow-2xl flex flex-col gap-8 animate-in">
        
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary text-white inline-flex items-center justify-center text-3xl mb-6 shadow-lg shadow-primary/30">
            <FiShield />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-on-surface mb-2">
            ERMAY <span className="text-primary">ERP</span>
          </h1>
          <p className="text-sm sm:text-base font-semibold text-slate-500 uppercase tracking-widest">
            Kurumsal Yönetim ve Takip Portalı
          </p>
        </div>

        {error && (
          <div className="bg-danger/10 text-danger p-4 rounded-2xl text-xs sm:text-sm font-extrabold text-center leading-relaxed border border-danger/20 animate-shake">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          
          <div className="flex flex-col gap-2">
            <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest pl-1">KİMLİK ADI</label>
            <div className="relative">
              <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
              <input
                type="text"
                value={username}
                autoFocus
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Örn: ahmet.yilmaz"
                className="w-full pl-12 h-14 bg-surface-low border-2 border-surface-container rounded-2xl text-on-surface font-bold placeholder:text-slate-300 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest pl-1">GÜVENLİK PAROLASI</label>
            <div className="relative">
              <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 h-14 bg-surface-low border-2 border-surface-container rounded-2xl text-on-surface font-bold placeholder:text-slate-300 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="h-16 bg-primary text-white rounded-2xl text-lg font-black shadow-lg shadow-primary/20 hover:bg-primary-dim hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-4"
          >
            Sisteme Giriş Yap <FiArrowRight className="text-xl" />
          </button>

        </form>

        <div className="text-center text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest pt-2 flex items-center justify-center gap-2">
          <span>© 2026 ERMAY METAL</span>
          <span className="opacity-30">•</span>
          <span className="text-primary/60 font-black">V2.4.0</span>
        </div>

      </div>

    </div>
  );
}