import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLoaderStore } from '../../store/useLoaderStore';
import { FiLock, FiUser, FiArrowRight, FiShield, FiEye, FiEyeOff } from 'react-icons/fi';

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const loaderShow = useLoaderStore((s) => s.show);
  const loaderHide = useLoaderStore((s) => s.hide);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Lütfen tüm alanları doldurunuz.');
      return;
    }
    setError('');

    loaderShow('Güvenli Oturum Başlatılıyor...');

    try {
      await login(username, password);
      loaderHide();
      navigate('/');
    } catch (err: unknown) {
      loaderHide();
      const error = err as { response?: { data?: { message?: string | string[] } }, message?: string };
      const msg = error.response?.data?.message || error.message;
      const safeMsg = Array.isArray(msg) ? msg[0] : (typeof msg === 'string' ? msg : '');

      if (safeMsg === 'INVALID_USERNAME') {
        setError('Kullanıcı adı sistemde bulunamadı.');
      } else if (safeMsg === 'INVALID_PASSWORD') {
        setError('Hatalı parola. Lütfen tekrar deneyiniz.');
      } else {
        setError('Kimlik doğrulama başarısız oldu.');
      }
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden bg-slate-950 font-sans">

      {/* 🔮 Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-10"
          style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="relative z-10 w-full max-w-[1100px] grid grid-cols-1 lg:grid-cols-2 bg-white/5 backdrop-blur-2xl rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in duration-700">

        {/* 🌠 Information Side (Visible on desktop) */}
        <div className="hidden lg:flex flex-col justify-between p-16 bg-gradient-to-br from-primary/20 to-transparent border-r border-white/5">
          <div>
            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/30 mb-8">
              <FiShield size={28} />
            </div>
            <h2 className="text-5xl font-black text-white leading-tight tracking-tighter mb-6">
              Geleceğin <span className="text-primary italic">ERP</span> Deneyimi.
            </h2>
            <p className="text-lg text-slate-400 font-medium leading-relaxed max-w-sm">
              Ermay Metal için özel olarak tasarlanmış, yapay zeka destekli kurumsal kaynak planlama portalı.
            </p>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4 group cursor-default">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:border-primary/30 transition-colors">
                <FiLock className="text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-wider">Uçtan Uca Güvenlik</h4>
                <p className="text-xs text-slate-500 font-bold">256-bit SSL ve Çoklu Doğrulama</p>
              </div>
            </div>
            <div className="flex items-center gap-4 group cursor-default">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:border-primary/30 transition-colors">
                <FiArrowRight className="text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-wider">Hızlı Erişim</h4>
                <p className="text-xs text-slate-500 font-bold">Optimize edilmiş düşük gecikmeli altyapı</p>
              </div>
            </div>
          </div>
        </div>

        {/* 🔑 Login Side */}
        <div className="p-8 sm:p-16 flex flex-col justify-center gap-10">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl font-black text-white tracking-tighter mb-2">Hoş Geldiniz</h1>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">SİSTEME ERİŞİM İÇİN KİMLİĞİNİZİ DOĞRULAYIN</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 animate-shake">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[11px] font-black text-red-400 uppercase tracking-wider">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">KULLANICI ADI</label>
              <div className="relative group">
                <FiUser className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Kullanıcı adınızı girin"
                  className="w-full h-14 pl-14 pr-5 bg-white/5 border border-white/10 rounded-2xl text-white font-bold placeholder:text-slate-600 focus:bg-white/10 focus:border-primary transition-colors outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">GİZLİ PAROLA</label>
              <div className="relative group">
                <FiLock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-14 pl-14 pr-14 bg-white/5 border border-white/10 rounded-2xl text-white font-bold placeholder:text-slate-600 focus:bg-white/10 focus:border-primary transition-colors outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="group relative h-16 w-full bg-primary text-white rounded-2xl text-lg font-black tracking-wider uppercase overflow-hidden shadow-2xl shadow-primary/30 hover:-translate-y-1 active:scale-95 transition-colors"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative z-10 flex items-center justify-center gap-3">
                OTURUMU BAŞLAT <FiArrowRight className="group-hover:translate-x-1.5 transition-transform" />
              </span>
            </button>
          </form>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-10 border-t border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 font-black text-[10px] text-primary">V3</div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">PRO-GOLD EDITION</span>
            </div>
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">© 2026 ERMAY METAL A.Ş.</span>
          </div>
        </div>

      </div>
    </div>
  );
}