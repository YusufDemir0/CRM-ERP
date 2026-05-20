import React, { useMemo, memo, useCallback } from 'react';
import { FiShield, FiX, FiCheckCircle, FiGrid, FiActivity } from 'react-icons/fi';
import { User, Permission } from '../../../../types';

interface UserPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  availablePermissions: Permission[];
  rolePermissionIds: (string | number)[];
  userSpecificPerms: { permissionId: number; effect: 'allow' | 'deny'; scopeType: 'global' | 'department' }[];
  onSetPermission: (permissionId: string | number, effect: 'allow' | 'deny' | null, scopeType: 'global' | 'department') => void;
}

const MODULE_TRANSLATIONS: Record<string, string> = {
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

const PermissionItem = memo(({ 
  perm, 
  override, 
  fromRole, 
  onToggle 
}: { 
  perm: Permission; 
  override: { effect: 'allow' | 'deny' } | undefined; 
  fromRole: boolean;
  onToggle: (perm: Permission) => void;
}) => {
  const checked = override?.effect === 'allow' || (fromRole && override?.effect !== 'deny');

  let checkboxClass = 'border-slate-200 bg-white group-hover:border-primary/50';
  let labelClass = 'text-slate-500';
  let badgeEl: React.ReactNode = null;

  if (override?.effect === 'allow') {
    checkboxClass = 'bg-amber-400 border-amber-400 text-white scale-110';
    labelClass = 'text-slate-900';
    badgeEl = <span className="px-1.5 py-0.5 rounded text-[7px] font-black uppercase bg-amber-100 text-amber-600 border border-amber-200">OVERRIDE</span>;
  } else if (override?.effect === 'deny') {
    checkboxClass = 'bg-red-400 border-red-400 text-white scale-110';
    labelClass = 'text-red-400 line-through';
    badgeEl = <span className="px-1.5 py-0.5 rounded text-[7px] font-black uppercase bg-red-100 text-red-500 border border-red-200">ENGELLENDİ</span>;
  } else if (fromRole) {
    checkboxClass = 'bg-emerald-500 border-emerald-500 text-white scale-110';
    labelClass = 'text-slate-900';
  }

  return (
    <label className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors hover:bg-slate-50 group ${
      override?.effect === 'deny' ? 'bg-red-50/50 ring-1 ring-red-100' :
      override?.effect === 'allow' ? 'bg-amber-50/50 ring-1 ring-amber-100' :
      fromRole ? 'bg-emerald-50/30 ring-1 ring-emerald-100' : ''
    }`}>
      <div className="flex items-center gap-3">
        <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-colors ${checkboxClass}`}>
          <input 
            type="checkbox" 
            className="hidden"
            checked={checked} 
            onChange={() => onToggle(perm)} 
          />
          {override?.effect === 'deny' ? (
            <FiX size={12} />
          ) : checked ? (
            <FiCheckCircle size={12} />
          ) : null}
        </div>
        <span className={`text-[13px] font-bold select-none ${labelClass}`}>
          {perm.name}
        </span>
        {badgeEl}
      </div>
      
      {perm.action && (
        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${
          perm.action === 'manage' ? 'bg-purple-100 text-purple-700' :
          perm.action === 'delete' ? 'bg-red-100 text-red-700' :
          perm.action === 'update' ? 'bg-blue-100 text-blue-700' :
          perm.action === 'create' ? 'bg-green-100 text-green-700' :
          'bg-slate-100 text-slate-700'
        }`}>
          {perm.action}
        </span>
      )}
    </label>
  );
});

const ModuleSection = memo(({ 
  moduleName, 
  permissions, 
  rolePermIdSet, 
  userSpecificPerms, 
  onToggle,
  onToggleModule 
}: { 
  moduleName: string; 
  permissions: Permission[]; 
  rolePermIdSet: Set<string>;
  userSpecificPerms: any[];
  onToggle: (perm: Permission) => void;
  onToggleModule: (perms: Permission[]) => void;
}) => {
  const isEffectivelyChecked = (perm: Permission): boolean => {
    const override = userSpecificPerms.find(u => String(u.permissionId) === String(perm.id));
    if (override?.effect === 'allow') return true;
    if (override?.effect === 'deny') return false;
    return rolePermIdSet.has(String(perm.id));
  };

  const allChecked = permissions.every(p => isEffectivelyChecked(p));

  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-4">
      <div className="flex justify-between items-center pb-3 border-b border-slate-50">
        <div className="text-[10px] font-black text-primary uppercase tracking-widest">
          {moduleName}
        </div>
        <label className="flex items-center gap-1.5 cursor-pointer group">
          <input 
            type="checkbox" 
            className="hidden"
            checked={allChecked}
            onChange={() => onToggleModule(permissions)}
          />
          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
            allChecked ? 'bg-primary border-primary text-white' : 'border-slate-200 bg-white group-hover:border-primary/50'
          }`}>
            {allChecked && <FiCheckCircle size={10} />}
          </div>
          <span className="text-[9px] font-bold text-slate-400 uppercase select-none">Tümü</span>
        </label>
      </div>

      <div className="flex flex-col gap-2">
        {permissions.map((perm: Permission) => (
          <PermissionItem 
            key={perm.id} 
            perm={perm} 
            override={userSpecificPerms.find(u => String(u.permissionId) === String(perm.id))}
            fromRole={rolePermIdSet.has(String(perm.id))}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
});

export const UserPermissionsModal: React.FC<UserPermissionsModalProps> = ({
  isOpen,
  onClose,
  user,
  availablePermissions,
  rolePermissionIds,
  userSpecificPerms,
  onSetPermission,
}) => {
  if (!isOpen || !user) return null;

  const rolePermIdSet = useMemo(() => new Set(rolePermissionIds.map(id => String(id))), [rolePermissionIds]);

  const groupedPermissions = useMemo(() => {
    return availablePermissions.reduce((acc: Record<string, Permission[]>, perm: Permission) => {
      const rawMod = (perm.module || 'Genel').toLowerCase();
      const mod = MODULE_TRANSLATIONS[rawMod] || perm.module || 'Genel';
      if (!acc[mod]) acc[mod] = [];
      acc[mod].push(perm);
      return acc;
    }, {});
  }, [availablePermissions]);

  const handleToggle = useCallback((perm: Permission) => {
    const override = userSpecificPerms.find(u => String(u.permissionId) === String(perm.id));
    const fromRole = rolePermIdSet.has(String(perm.id));
    const checked = override?.effect === 'allow' || (fromRole && override?.effect !== 'deny');

    if (checked) {
      if (override?.effect === 'allow') onSetPermission(perm.id, null, 'global');
      else if (fromRole) onSetPermission(perm.id, 'deny', 'global');
    } else {
      if (override?.effect === 'deny') onSetPermission(perm.id, null, 'global');
      else onSetPermission(perm.id, 'allow', 'global');
    }
  }, [userSpecificPerms, rolePermIdSet, onSetPermission]);

  const handleModuleSelectAll = useCallback((modulePerms: Permission[]) => {
    const isEffectivelyChecked = (perm: Permission): boolean => {
      const override = userSpecificPerms.find(u => String(u.permissionId) === String(perm.id));
      if (override?.effect === 'allow') return true;
      if (override?.effect === 'deny') return false;
      return rolePermIdSet.has(String(perm.id));
    };

    const allChecked = modulePerms.every(p => isEffectivelyChecked(p));
    
    modulePerms.forEach(p => {
      const checked = isEffectivelyChecked(p);
      if (allChecked) {
        if (checked) {
          const override = userSpecificPerms.find(u => String(u.permissionId) === String(p.id));
          if (override?.effect === 'allow') onSetPermission(p.id, null, 'global');
          else if (rolePermIdSet.has(String(p.id))) onSetPermission(p.id, 'deny', 'global');
        }
      } else {
        if (!checked) {
          const override = userSpecificPerms.find(u => String(u.permissionId) === String(p.id));
          if (override?.effect === 'deny') onSetPermission(p.id, null, 'global');
          else onSetPermission(p.id, 'allow', 'global');
        }
      }
    });
  }, [userSpecificPerms, rolePermIdSet, onSetPermission]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white max-w-[1000px] w-full p-6 rounded-2xl shadow-premium-lg border border-slate-100 flex flex-col gap-8 animate-in zoom-in-95 duration-300 relative max-h-[90vh] overflow-hidden">
        
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Yetki Matrisi (Override)
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
                {user.fullName?.toUpperCase()} — {user.roles?.map(r => r.name).join(', ') || 'ROL YOK'}
              </span>
            </div>
          </div>
          <button 
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:text-red-500 transition-colors" 
            onClick={onClose}
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-5 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 text-[9px] font-black uppercase tracking-widest">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded border-2 bg-emerald-100 border-emerald-400 flex items-center justify-center"><FiCheckCircle size={8} className="text-emerald-600" /></div>
            <span className="text-emerald-600">ROL'DEN GELEN</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded border-2 bg-amber-100 border-amber-400 flex items-center justify-center"><FiCheckCircle size={8} className="text-amber-600" /></div>
            <span className="text-amber-600">OVERRIDE (+)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded border-2 bg-red-100 border-red-400 flex items-center justify-center"><FiX size={8} className="text-red-600" /></div>
            <span className="text-red-500">ENGELLENDİ (−)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded border-2 border-slate-200 bg-white" />
            <span className="text-slate-400">İZİN YOK</span>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <FiActivity className="text-primary" size={12} />
            <span className="text-primary">{userSpecificPerms.length} OVERRIDE</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-4 modern-scrollbar">
          <div className="flex flex-col gap-4">
            <label className="text-sm font-black text-primary uppercase tracking-widest flex items-center gap-2 px-1">
              <FiGrid /> YETKİ MATRİSİ (CAPABILITY MATRIX)
            </label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 rounded-2xl bg-slate-50 border border-slate-100">
              {Object.keys(groupedPermissions).map(moduleName => (
                <ModuleSection 
                  key={moduleName} 
                  moduleName={moduleName} 
                  permissions={groupedPermissions[moduleName]} 
                  rolePermIdSet={rolePermIdSet}
                  userSpecificPerms={userSpecificPerms}
                  onToggle={handleToggle}
                  onToggleModule={handleModuleSelectAll}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-4 sticky bottom-0 bg-white pt-4 pb-2 mt-auto">
          <button 
            className="flex-1 h-16 rounded-2xl bg-primary text-white font-black text-base shadow-xl shadow-primary/20 hover:bg-primary/90 active:scale-[0.98] transition-colors"
            onClick={onClose}
          >
            KAYDET VE KAPAT
          </button>
          <button 
            className="flex-[0.3] h-16 rounded-2xl bg-slate-50 text-slate-500 font-black uppercase text-xs tracking-widest hover:bg-slate-100 transition-colors" 
            onClick={onClose}
          >
            VAZGEÇ
          </button>
        </div>
      </div>
    </div>
  );
};
