import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLoaderStore } from '../../store/useLoaderStore';
import logo from '../../assets/images/logo.png';
import { FiInfo, FiX } from 'react-icons/fi';

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [toast, setToast] = useState<{ message: string, type: 'info' | 'error' | 'success' } | null>(null);

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const loaderShow = useLoaderStore((s) => s.show);
  const loaderHide = useLoaderStore((s) => s.hide);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Lütfen tüm alanları doldurunuz.');
      return;
    }
    setError('');
    setSuccess('');
    loaderShow('Oturum açılıyor...');

    try {
      await login(username, password);
      loaderHide();
      setSuccess('Giriş başarılı! Yönlendiriliyorsunuz...');
      setTimeout(() => {
        navigate('/');
      }, 800);
    } catch (err: unknown) {
      loaderHide();
      const errorData = err as { response?: { data?: { message?: string | string[] } }, message?: string };
      const msg = errorData.response?.data?.message || errorData.message;
      const safeMsg = Array.isArray(msg) ? msg[0] : (typeof msg === 'string' ? msg : '');

      if (safeMsg === 'INVALID_USERNAME') {
        setError('Kullanıcı adı bulunamadı.');
      } else if (safeMsg === 'INVALID_PASSWORD') {
        setError('Girdiğiniz şifre yanlış.');
      } else {
        setError('Giriş başarısız. Bilgilerinizi kontrol edin.');
      }
    }
  };

  const handleForgotPassword = () => {
    setToast({
      message: 'Şifre sıfırlama işlemleri için lütfen sistem yöneticinizle iletişime geçin.',
      type: 'info'
    });
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-[var(--background)] font-sans overflow-hidden">
      
      {/* 🎈 Balloon Toast Notification */}
      {toast && (
        <div className="fixed top-8 right-8 z-[100] animate-in slide-in-from-right-8 fade-in duration-500">
          <div className="bg-white rounded-2xl shadow-premium border border-slate-100 p-4 flex items-center gap-4 max-w-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              toast.type === 'info' ? 'bg-indigo-50 text-indigo-600' : 
              toast.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
            }`}>
              <FiInfo size={20} />
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Sistem Bilgisi</p>
              <p className="text-xs font-bold text-slate-700 leading-relaxed">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className="text-slate-300 hover:text-slate-500 transition-colors">
              <FiX size={18} />
            </button>
          </div>
        </div>
      )}

      {/* 🔮 Subtle Decorative Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[var(--primary-glow)] blur-[120px] rounded-full opacity-50" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[var(--primary-glow)] blur-[120px] rounded-full opacity-30" />
        <div className="absolute inset-0 opacity-[0.03]" 
          style={{ backgroundImage: 'radial-gradient(var(--primary) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      {/* 🏷️ Top Logo Section (Minimalist) */}
      <div className="relative z-10 mb-8 animate-in">
        <div className="flex flex-col items-center gap-6">
          <div className="w-64 h-32 bg-[var(--primary)] rounded-[var(--radius-xl)] flex items-center justify-center shadow-xl shadow-[var(--primary-glow)] p-6">
            <img src={logo} alt="Ermay Logo" className="h-full w-full object-contain brightness-0 invert" />
          </div>
          <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Kurumsal Yönetim Sistemi</h2>
        </div>
      </div>

      {/* ⚪ Centered Login Card */}
      <div className="relative z-20 w-full max-w-[480px] px-6">
        <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-premium)] p-12 sm:p-14 border border-[var(--border)] flex flex-col gap-10 animate-slide-up">
          
          <div className="text-center">
            <h1 className="text-xl font-black text-slate-800 tracking-tight mb-1">Hesabınıza Giriş Yapın</h1>
            <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">KİMLİK DOĞRULAMA GEREKLİ</p>
          </div>

          {error && (
            <div className="bg-[var(--error-glow)] border border-[var(--error)]/20 p-4 rounded-[var(--radius-md)] flex items-center gap-3 animate-shake">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--error)] animate-pulse" />
              <span className="text-[10px] font-black text-[var(--error)] uppercase tracking-wider">{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-[var(--radius-md)] flex items-center gap-3 animate-in fade-in zoom-in">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">{success}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kullanıcı Adı</label>
              </div>
              <input 
                type="text"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-12 px-5 rounded-[var(--radius-md)] border border-slate-200 bg-slate-50/50 text-sm font-bold text-slate-800 focus:bg-white focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-glow)] outline-none transition-all"
                placeholder="isminiz"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Şifre</label>
                <span 
                  onClick={handleForgotPassword}
                  className="text-[9px] font-bold text-[var(--primary)] cursor-pointer hover:underline uppercase tracking-tighter"
                >
                  Şifremi Unuttum
                </span>
              </div>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 px-5 rounded-[var(--radius-md)] border border-slate-200 bg-slate-50/50 text-sm font-bold text-slate-800 focus:bg-white focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-glow)] outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit"
              disabled={!!success}
              className={`mt-4 w-full h-14 text-white rounded-[var(--radius-md)] text-xs font-black uppercase tracking-widest shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 ${
                success ? 'bg-emerald-500 shadow-emerald-200' : 'bg-[var(--primary)] shadow-[var(--primary-glow)] hover:brightness-110'
              }`}
            >
              {success ? 'Giriş Başarılı' : 'OTURUMU AÇ'}
            </button>
          </form>
        </div>
      </div>

      {/* 🏢 Footer */}
      <div className="mt-12 relative z-10 flex flex-col items-center justify-center gap-2">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">© 2026 ERMAY MOBİLYA A.Ş.</span>
        <div className="h-1 w-8 bg-slate-200 rounded-full" />
      </div>

    </div>
  );
}