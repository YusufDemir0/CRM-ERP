
import { FiShield, FiX } from 'react-icons/fi';
import { User, Permission } from '../../../../types';

interface UserPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  availablePermissions: Permission[];
  userSpecificPerms: { permissionId: number; effect: 'allow' | 'deny'; scopeType: 'global' | 'department' }[];
  onSetPermission: (permissionId: number, effect: 'allow' | 'deny', scopeType: 'global' | 'department') => void;
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

  return (
    <div className="loader-overlay items-start pt-[5%] pb-[5%] overflow-y-auto">
      <div className="login-box max-w-[850px] w-full relative">
        <button className="btn-icon circle absolute top-4 right-4" onClick={onClose}>
          <FiX size={20} />
        </button>

        <div className="mb-5 pb-2.5 border-b border-slate-200">
          <h3 className="text-primary flex items-center gap-2"><FiShield /> İstisna / İleri Seviye Yetkilendirme</h3>
          <p className="text-xs text-slate-500 mt-1">
            <strong className="text-slate-700">{user.fullName}</strong> kullanıcısı için Override yetkileri belirleyin.
          </p>
        </div>

        <div className="max-h-[60vh] overflow-y-auto flex flex-col gap-2.5">
          <table className="w-full text-xs border-collapse">
            <thead className="bg-slate-100 text-left text-slate-600">
              <tr>
                <th className="p-3 font-bold">MODÜL VE YETKİ (KEY)</th>
                <th className="p-3 font-bold">BİLGİ</th>
                <th className="p-3 font-bold">ROL KURALLARI</th>
                <th className="p-3 font-bold">İSTİSNA (OVERRIDE)</th>
              </tr>
            </thead>
            <tbody>
              {availablePermissions.map((perm) => {
                const permOverride = userSpecificPerms.find((u) => u.permissionId === perm.id);

                return (
                  <tr
                    key={perm.id}
                    className={`border-b border-slate-100 ${permOverride ? (permOverride.effect === 'deny' ? 'bg-red-50' : 'bg-emerald-50') : 'bg-white'
                      }`}
                  >
                    <td className="p-3">
                      <div className="font-extrabold text-slate-800">{perm.name}</div>
                      <div className="text-[10px] text-slate-500 font-medium">[{perm.module}] {perm.key}</div>
                    </td>
                    <td className="p-3 text-slate-500 italic text-[11px]">Önceliği Deny Alır.</td>
                    <td className="p-3">
                      <span className="badge bg-slate-100 text-slate-600">ROL'E BAĞLI</span>
                    </td>
                    <td className="flex gap-1.5 py-2.5 px-3">
                      <button
                        className={`btn px-2.5 py-1 h-6 text-[10px] font-bold ${permOverride?.effect === 'allow' && permOverride?.scopeType === 'global'
                            ? 'bg-emerald-500 text-white border-emerald-600'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                        onClick={() => onSetPermission(perm.id, 'allow', 'global')}
                      >
                        ✔️ İZİN VER (Global)
                      </button>

                      {user.departmentId && (
                        <button
                          className={`btn px-2.5 py-1 h-6 text-[10px] font-bold ${permOverride?.effect === 'allow' && permOverride?.scopeType === 'department'
                              ? 'bg-primary text-white border-primary'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            }`}
                          onClick={() => onSetPermission(perm.id, 'allow', 'department')}
                        >
                          🏬 DEPARTMAN
                        </button>
                      )}

                      <button
                        className={`btn px-2.5 py-1 h-6 text-[10px] font-bold ${permOverride?.effect === 'deny'
                            ? 'bg-red-500 text-white border-red-600'
                            : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'
                          }`}
                        onClick={() => onSetPermission(perm.id, 'deny', 'global')}
                      >
                        🚫 ENGELLİ
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
