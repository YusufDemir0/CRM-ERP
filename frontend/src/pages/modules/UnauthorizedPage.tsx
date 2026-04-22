
import { Link } from 'react-router-dom';
import { FiShield, FiArrowLeft } from 'react-icons/fi';

const UnauthorizedPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white text-center p-6">
      <div className="animate-in flex flex-col items-center gap-8 max-w-[500px]">
        <div className="w-[120px] h-[120px] rounded-[40px] bg-red-500/10 text-red-500 flex items-center justify-center text-6xl shadow-[0_20px_40px_rgba(0,0,0,0.3)]">
          <FiShield />
        </div>
        
        <div className="flex flex-col gap-4">
          <h1 className="text-[3rem] font-black tracking-tighter m-0 leading-tight">
            Erişim <span className="text-red-500">Engellendi!</span>
          </h1>
          <p className="text-white/70 text-[1.2rem] font-semibold leading-relaxed tracking-tight">
            Bu protokolü veya departmanı görüntülemek için gerekli yetki seviyesine sahip değilsiniz.
          </p>
        </div>

        <div className="bg-white/5 p-6 rounded-[24px] border border-white/10 text-sm font-bold text-white/50">
          Lütfen sistem yöneticinizden yetkilerinizin (Capability Matrix) revize edilmesini talep edin.
        </div>

        <Link 
          to="/" 
          className="mt-4 flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-2xl no-underline font-extrabold text-[15px] shadow-[0_10px_30px_var(--primary-glow)] transition-all duration-200 hover:scale-105"
        >
          <FiArrowLeft /> Dashboard'a Güvenli Dönüş Yap
        </Link>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
