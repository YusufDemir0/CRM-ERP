import { FiShield, FiX, FiCheckCircle, FiSlash, FiMinus, FiGrid, FiActivity, FiZap } from 'react-icons/fi';
import { User, Permission } from '../../../../types';

interface UserPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  availablePermissions: Permission[];
  userSpecificPerms: { permissionId: number; effect: 'allow' | 'deny'; scopeType: 'global' | 'department' }[];
  onSetPermission: (permissionId: number, effect: 'allow' | 'deny' | null, scopeType: 'global' | 'department') => void;
}

export const UserPermissionsModal: React.FC<UserPermissionsModalProps> = ({
  isOpen,
  onClose,
  user,
  availablePermissions,
  userSpecificPerms,
  onSetPermission,
}) => {
  if (!isOpen || !user) return null;

  const moduleTranslations: Record<string, string> = {
    'inventory': 'Stok ve Envanter',
    'users': 'Kullanıcılar',
    'roles': 'Roller ve Yetkiler',
    'departments': 'Departmanlar',
    'parties': 'Cariler (Müşteri/Tedarikçi)',
    'sales': 'Satış Yönetimi',
    'finance': 'Finansal Hareketler',
    'production': 'Üretim Planlama',
    'system': 'Sistem Konfigürasyonu',
    'dashboard': 'Dashboard'
  };

  const groupedPermissions = availablePermissions.reduce((acc: Record<string, Permission[]>, perm: Permission) => {
    const rawMod = (perm.module || 'Genel').toLowerCase();
    const mod = moduleTranslations[rawMod] || perm.module || 'Genel';
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(perm);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#f8fafc] max-w-[1200px] w-full p-6 rounded-[2.5rem] shadow-premium-lg border border-slate-200/60 flex flex-col gap-6 animate-in zoom-in-95 duration-300 relative max-h-[95vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-6 border-b border-slate-200/50 px-2">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-primary shadow-lg shadow-primary/20 flex items-center justify-center text-white text-2xl">
              <FiShield />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-1.5">
                Kullanıcı Yetki Matrisi (Override)
              </h2>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em]">
                  <span className="text-slate-900">{user.fullName}</span> İÇİN ÖZEL KURALLAR
                </p>
              </div>
            </div>
          </div>
          <button 
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm border border-slate-100" 
            onClick={onClose}
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Info Legend */}
        <div className="flex flex-wrap gap-6 px-6 py-4 bg-white rounded-3xl border border-slate-200/50 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400"><FiMinus size={12} /></div>
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">ROLÜNDEN GELSİN (DEFAULT)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-lg bg-emerald-500 shadow-md shadow-emerald-100 flex items-center justify-center text-white"><FiCheckCircle size={12} /></div>
            <span className="text-[11px] font-black text-emerald-600 uppercase tracking-widest">KESİN İZİN VER (FORCE ALLOW)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-lg bg-red-500 shadow-md shadow-red-100 flex items-center justify-center text-white"><FiSlash size={12} /></div>
            <span className="text-[11px] font-black text-red-600 uppercase tracking-widest">KESİN ENGELLE (FORCE DENY)</span>
          </div>
        </div>

        {/* Body - Grid Layout matching Roles Matrix */}
        <div className="flex-1 overflow-y-auto pr-2 modern-scrollbar flex flex-col gap-8 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.keys(groupedPermissions).map(moduleName => (
              <div key={moduleName} className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm flex flex-col gap-5 hover:shadow-md transition-shadow group/card">
                <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary/5 text-primary flex items-center justify-center">
                      <FiZap size={16} />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">{moduleName}</h3>
                  </div>
                </div>
                
                <div className="flex flex-col gap-3">
                  {groupedPermissions[moduleName].map((perm: Permission) => {
                    const permOverride = userSpecificPerms.find((u) => u.permissionId === perm.id);
                    const effect = permOverride?.effect || null;

                    return (
                      <div key={perm.id} className={`flex flex-col gap-2.5 p-3.5 rounded-2xl border transition-all duration-300 ${
                        effect === 'allow' ? 'bg-emerald-50/20 border-emerald-100 ring-1 ring-emerald-50' :
                        effect === 'deny' ? 'bg-red-50/20 border-red-100 ring-1 ring-red-50' :
                        'bg-slate-50/50 border-transparent hover:bg-slate-50'
                      }`}>
                        <div className="flex justify-between items-start px-0.5">
                          <div>
                            <div className={`text-[12px] font-black uppercase tracking-tight transition-colors ${effect === 'allow' ? 'text-emerald-700' : effect === 'deny' ? 'text-red-700' : 'text-slate-700'}`}>{perm.name}</div>
                            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest opacity-60 mt-0.5">{perm.key}</div>
                          </div>
                        </div>

                        <div className="flex items-center bg-white p-1 rounded-xl gap-1 border border-slate-100 shadow-inner">
                          {[
                            { id: null, label: 'VARSAYILAN', icon: <FiMinus />, color: 'peer-checked:bg-slate-100 peer-checked:text-slate-600' },
                            { id: 'allow', label: 'İZİN VER', icon: <FiCheckCircle />, color: 'peer-checked:bg-emerald-500 peer-checked:text-white peer-checked:shadow-lg peer-checked:shadow-emerald-200' },
                            { id: 'deny', label: 'ENGELLE', icon: <FiSlash />, color: 'peer-checked:bg-red-500 peer-checked:text-white peer-checked:shadow-lg peer-checked:shadow-red-200' },
                          ].map((opt) => (
                            <label key={opt.label} className="flex-1 cursor-pointer">
                              <input 
                                type="radio" 
                                className="peer hidden" 
                                name={`perm-${perm.id}`}
                                checked={effect === opt.id}
                                onChange={() => onSetPermission(perm.id, opt.id as any, 'global')}
                              />
                              <div className={`h-8 flex items-center justify-center rounded-lg text-[9px] font-black transition-all hover:bg-slate-50 active:scale-95 ${opt.color}`}>
                                <span className="flex items-center gap-1.5 uppercase tracking-tighter">
                                  {opt.icon} {opt.label}
                                </span>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-center pt-6 border-t border-slate-200/50">
          <button 
            className="h-16 px-14 bg-slate-900 text-white rounded-[1.25rem] font-black text-sm shadow-xl shadow-slate-200 hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest"
            onClick={onClose}
          >
            Değişiklikleri Tamamla
          </button>
        </div>
      </div>
    </div>
  );
};
