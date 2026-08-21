import React, { useState, useCallback, useMemo, memo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesAPI } from '../../services/api';
import { 
  FiEdit2, FiShield, FiPlus, FiCheckCircle, FiLock, 
  FiActivity, FiGrid, FiX, FiFilter, FiArchive, FiInfo
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { confirmDialog } from '../../utils/confirmDialog';
import { DataTable, Column } from '../../components/common/DataTable';
import { Role, Permission } from '../../types';
import { useSort } from '../../hooks/useSort';
import { useDeferredValue } from 'react';
import { queryKeys } from '../../services/queryKeys';
import { useAuth } from '../../hooks/useAuth';

const MODULE_TRANSLATIONS: Record<string, string> = {
  'inventory': 'Stok ve Envanter',
  'users': 'Kullanıcılar',
  'roles': 'Roller ve Yetkiler',
  'departments': 'Departmanlar',
  'parties': 'Cariler (Müşteri/Tedarikçi)',
  'sales': 'Satış Yönetimi',
  'finance': 'Finansal Hareketler',
  'production': 'Üretim Planlama',
  'system': 'Sistem Konfigürasyonu'
};

const PermissionItem = memo(({ 
  perm, 
  isSelected, 
  onToggle 
}: { 
  perm: Permission; 
  isSelected: boolean; 
  onToggle: (id: string) => void;
}) => {
  return (
    <div className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all duration-150 hover:bg-slate-50 group ${
      isSelected ? 'bg-primary/[0.03] ring-1 ring-primary/10' : ''
    }`}>
      <label className="flex items-center gap-3 flex-1 cursor-pointer select-none">
        <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-150 shrink-0 ${
          isSelected ? 'bg-primary border-primary text-white scale-105 shadow-sm' : 'border-slate-200 bg-white group-hover:border-primary/50'
        }`}>
          <input 
            type="checkbox" 
            className="hidden"
            checked={isSelected} 
            onChange={() => onToggle(perm.id)} 
          />
          {isSelected && <FiCheckCircle size={12} className="stroke-[2.5]" />}
        </div>
        
        <span className={`text-[13px] font-bold transition-colors ${
          isSelected ? 'text-slate-900 font-extrabold' : 'text-slate-500'
        }`}>
          {perm.name}
        </span>
        
        {perm.description && (
          <div className="relative group/tooltip flex items-center shrink-0">
            <FiInfo 
              className="text-slate-400 hover:text-primary transition-colors cursor-pointer ml-1.5 shrink-0" 
              size={14} 
            />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-950 text-white text-[11px] font-medium leading-relaxed p-3 rounded-xl shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-[100] pointer-events-none text-left normal-case tracking-normal">
              {perm.description}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-950"></div>
            </div>
          </div>
        )}
      </label>
      
      {perm.action && (
        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest shrink-0 ml-2 select-none ${
          perm.action === 'manage' ? 'bg-purple-100 text-purple-700' :
          perm.action === 'delete' ? 'bg-rose-100 text-rose-700' :
          perm.action === 'update' ? 'bg-indigo-100 text-indigo-700' :
          perm.action === 'create' ? 'bg-emerald-100 text-emerald-700' :
          'bg-slate-100 text-slate-600'
        }`}>
          {perm.action}
        </span>
      )}
    </div>
  );
});

const ModuleSection = memo(({ 
  moduleName, 
  permissions, 
  selectedIds, 
  onToggle,
  onToggleModule
}: { 
  moduleName: string; 
  permissions: Permission[]; 
  selectedIds: string[];
  onToggle: (id: string) => void;
  onToggleModule: (moduleName: string, checked: boolean) => void;
}) => {
  const allChecked = permissions.every(p => selectedIds.includes(p.id));
  
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3">
      <div className="flex justify-between items-center pb-2.5 border-b border-slate-50">
        <div className="text-[10px] font-black text-primary uppercase tracking-widest">
          {moduleName}
        </div>
        <label className="flex items-center gap-1.5 cursor-pointer group">
          <input 
            type="checkbox" 
            className="hidden"
            checked={allChecked}
            onChange={(e) => onToggleModule(moduleName, e.target.checked)}
          />
          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
            allChecked ? 'bg-primary border-primary text-white' : 'border-slate-200 bg-white group-hover:border-primary/50'
          }`}>
            {allChecked && <FiCheckCircle size={10} />}
          </div>
          <span className="text-[9px] font-bold text-slate-400 uppercase select-none">Tümü</span>
        </label>
      </div>
      <div className="flex flex-col gap-1.5">
        {permissions.map((perm) => (
          <PermissionItem 
            key={perm.id} 
            perm={perm} 
            isSelected={selectedIds.includes(perm.id)} 
            onToggle={onToggle} 
          />
        ))}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  if (prevProps.moduleName !== nextProps.moduleName) return false;
  if (prevProps.permissions !== nextProps.permissions) return false;
  if (prevProps.onToggle !== nextProps.onToggle) return false;
  if (prevProps.onToggleModule !== nextProps.onToggleModule) return false;

  // Optimize membership checks with simple comparison of relevant permissions
  for (const perm of prevProps.permissions) {
    const wasSelected = prevProps.selectedIds.includes(perm.id);
    const isSelected = nextProps.selectedIds.includes(perm.id);
    if (wasSelected !== isSelected) return false;
  }
  return true;
});

export function RolesPage() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('ROLES_CREATE');
  const canEdit = hasPermission('ROLES_EDIT');
  const canDelete = hasPermission('ROLES_DELETE');

  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get('page')) || 1;
  const searchTerm = searchParams.get('q') || '';
  const filterTab = (searchParams.get('tab') as 'active' | 'passive' | 'all') || 'all';
  const limit = Number(searchParams.get('limit')) || 100;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const deferredSearch = useDeferredValue(searchTerm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', permissionIds: [] as string[] });

  const updateParams = useCallback((newParams: Record<string, string | number | undefined>) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      Object.entries(newParams).forEach(([key, value]) => {
        if (value === undefined || value === '' || (key === 'page' && value === 1)) {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      });
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const setPage = (p: number) => updateParams({ page: p });
  const setFilterTab = (tab: string) => updateParams({ tab, page: 1 });
  
  const sort = useMemo(() => ({
    key: searchParams.get('sortBy') || 'name',
    order: (searchParams.get('sortOrder') as 'ASC' | 'DESC') || 'ASC'
  }), [searchParams]);

  const { data: rolesData, isLoading: loading } = useQuery({
    queryKey: queryKeys.roles.all({ search: deferredSearch, filterTab, page, limit, sort }),
    queryFn: async ({ signal }) => {
      const state = filterTab === 'active' ? 1 : filterTab === 'passive' ? 0 : undefined;
      const res = await rolesAPI.getAll({ 
        limit, page, search: deferredSearch, state,
        sortBy: sort.key, sortOrder: sort.order
      }, { signal });
      return res.data;
    }
  });

  const roles = rolesData?.data || [];
  const paginationMeta = rolesData?.meta || { total: 0, page: 1, limit: 100, totalPages: 0 };
  
  const handleSortChange = useCallback((configs: { key: string; direction: 'asc' | 'desc' }[]) => {
    if (configs.length > 0) {
      updateParams({ 
        sortBy: configs[0].key, 
        sortOrder: configs[0].direction.toUpperCase(),
        page: 1 
      });
    }
  }, [updateParams]);

  const { sortedData, sortConfigs, toggleSort } = useSort<Role>(
    roles, 
    [{ key: sort.key, direction: sort.order.toLowerCase() as 'asc' | 'desc' }],
    handleSortChange
  );

  const { data: allPermissions = [] } = useQuery({
    queryKey: ['permissions'],
    queryFn: async ({ signal }) => {
      const res = await rolesAPI.getPermissions({ limit: 500 }, { signal });
      return res.data.data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const groupedPermissions = useMemo(() => {
    return allPermissions.reduce((acc: Record<string, Permission[]>, perm: Permission) => {
      let rawMod = (perm.module || 'Genel').toLowerCase();
      if (rawMod === 'satış' || rawMod === 'satiş' || rawMod === 'satış yönetimi') {
        rawMod = 'sales';
      }
      const mod = MODULE_TRANSLATIONS[rawMod] || perm.module || 'Genel';
      if (!acc[mod]) acc[mod] = [];
      acc[mod].push(perm);
      return acc;
    }, {});
  }, [allPermissions]);

  const mutation = useMutation({
    mutationFn: async ({ id, data }: { id: string | null; data: { name: string; permissionIds: string[] } }) => {
      const payload = { ...data };
      if (id) return rolesAPI.update(id, payload);
      return rolesAPI.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.all({}) });
      setIsModalOpen(false);
      toast.success("Rol başarıyla kaydedildi.");
    },
    onError: () => toast.error("Hata oluştu")
  });

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ id: editingId, data: formData });
  }, [editingId, formData, mutation]);

  const handleEdit = useCallback((role: Role) => {
    setEditingId(role.id);
    setFormData({
      name: role.name || '',
      permissionIds: role.permissions?.map((p: Permission) => p.id) ||[]
    });
    setIsModalOpen(true);
  }, []);

  const toggleMutation = useMutation({
    mutationFn: ({ id, state }: { id: string | number; state: number }) => rolesAPI.toggleState(id, state),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.all({}) });
      toast.success("Durum güncellendi.");
    },
    onError: () => toast.error("Hata oluştu")
  });

  const toggleState = useCallback(async (id: string | number, currentState: number) => {
    const confirmed = await confirmDialog(
      currentState === 1 ? 'Rolü pasife almak istediğinize emin misiniz?' : 'Rol tekrar aktif edilecektir.',
      currentState === 1
    );
    if (confirmed) {
      toggleMutation.mutate({ id, state: currentState });
    }
  }, [toggleMutation]);

  const togglePermission = useCallback((permId: string) => {
    setFormData(prev => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(permId)
        ? prev.permissionIds.filter(id => id !== permId)
        : [...prev.permissionIds, permId]
    }));
  }, []);

  const toggleModule = useCallback((moduleName: string, checked: boolean) => {
    const modulePermIds = groupedPermissions[moduleName].map((p: Permission) => p.id);
    setFormData(prev => {
      if (checked) {
        return { ...prev, permissionIds: Array.from(new Set([...prev.permissionIds, ...modulePermIds])) };
      } else {
        return { ...prev, permissionIds: prev.permissionIds.filter(id => !modulePermIds.includes(id)) };
      }
    });
  }, [groupedPermissions]);

  const applyFastRole = useCallback((type: string) => {
    let ids: string[] = [];
    switch (type) {
      case 'admin':
        ids = allPermissions.map((p: Permission) => p.id);
        break;
      case 'sales':
        ids = allPermissions
          .filter((p: Permission) => ['sales', 'parties', 'dashboard'].includes(p.module?.toLowerCase()) && p.key !== 'SALES_MASTER_APPROVE')
          .map((p: Permission) => p.id);
        break;
      case 'warehouse':
        ids = allPermissions
          .filter((p: Permission) => ['inventory', 'stocks', 'production'].includes(p.module?.toLowerCase()))
          .map((p: Permission) => p.id);
        break;
      case 'accounting':
        ids = allPermissions
          .filter((p: Permission) => ['finance', 'accounts', 'parties'].includes(p.module?.toLowerCase()))
          .map((p: Permission) => p.id);
        break;
      case 'special':
        ids = allPermissions
          .filter((p: Permission) => p.action === 'read' || p.action === 'view')
          .map((p: Permission) => p.id);
        break;
      case 'clear':
        ids = [];
        break;
    }
    setFormData(prev => ({ ...prev, permissionIds: ids }));
  }, [allPermissions]);

  const columns: Column<Role>[] = useMemo(() => [
    { 
      header: 'YETKİ PROFİLİ', 
      accessor: (r) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-lg font-black uppercase">
            <FiShield />
          </div>
          <div>
            <div className="font-black text-on-surface text-sm tracking-tighter uppercase">{r.name}</div>
            <div className="text-[10px] text-slate-400 font-bold tracking-widest flex items-center gap-2">
              İD: #{r.id} {r.state === 0 && <span className="text-danger font-black uppercase tracking-widest text-[8px] bg-danger/5 px-1.5 py-0.5 rounded-md">• PASİF</span>}
            </div>
          </div>
        </div>
      ),
      sortKey: 'name'
    },
    { 
      header: 'İZİN MATRİSİ', 
      accessor: (r) => (
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-lg bg-surface-container text-secondary text-[11px] font-black uppercase shadow-sm border border-slate-100 italic tabular-nums">
            {r.permissions?.length || 0}
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AKTİF YETKİ</span>
        </div>
      )
    },
    { 
      header: 'ERİŞİM DURUMU', 
      accessor: (r) => (
        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
          r.state === 1 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
        }`}>
          {r.state === 1 ? 'AKTİF' : 'PASİF'}
        </span>
      ),
      sortKey: 'state'
    }
  ], []);

  return (
    <div className="animate-in flex flex-col gap-8">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-danger/10 text-danger px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
            <FiLock /> GÜVENLİK VE ERİŞİM
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-on-surface">
            Kullanıcı <span className="text-primary">Rol & Yetkileri</span>
          </h1>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex bg-surface-container-low p-1 rounded-2xl border border-surface-container">
            {[
              { id: 'all', label: 'Tümü', icon: <FiFilter /> },
              { id: 'active', label: 'Aktif', icon: <FiActivity /> },
              { id: 'passive', label: 'Pasif', icon: <FiArchive /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id)}
                className={`h-9 px-4 rounded-xl text-xs font-black flex items-center gap-2 transition-colors ${
                  filterTab === tab.id ? 'bg-white text-primary shadow-premium' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab.icon} {tab.label.toUpperCase()}
              </button>
            ))}
          </div>
          {canCreate && (
            <button className="h-12 px-6 bg-primary text-white rounded-2xl font-black text-sm shadow-premium flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-colors" onClick={() => {
              setEditingId(null); setFormData({ name: '', permissionIds:[] }); setIsModalOpen(true);
            }}>
              <FiPlus size={20} /> Yeni Rol Tanımla
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <DataTable<Role>
          data={sortedData}
          columns={columns}
          isLoading={loading}
          sortConfigs={sortConfigs}
          onSort={toggleSort}
          getRowKey={(r) => r.id}
          hasState={(r) => r.state === 1}
          onEdit={canEdit ? handleEdit : undefined}
          onArchive={canDelete ? (r) => toggleState(r.id, 1) : undefined}
          onRestore={canDelete ? (r) => toggleState(r.id, 0) : undefined}
          getRowOpacity={(r) => r.state === 0 ? 0.5 : 1}
          total={paginationMeta.total}
          page={page}
          limit={limit}
          onPageChange={setPage}
          placeholder="Rol adı ile ara..."
        />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white max-w-[1100px] w-full p-6 rounded-3xl shadow-premium-lg border border-slate-100 flex flex-col gap-5 animate-in zoom-in-95 duration-300 relative max-h-[85vh] overflow-hidden">
            <div className="flex justify-between items-center shrink-0">
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2 uppercase">
                <FiShield className="text-primary" /> {editingId ? 'Rol Revizyonu' : 'Yeni Güvenlik Profili'}
              </h2>
              <button 
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-red-500 transition-colors" 
                onClick={() => setIsModalOpen(false)}
              >
                <FiX size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 gap-5 overflow-hidden">
              <div className="flex flex-col gap-1.5 shrink-0">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">ROL İSMİ (GÖREV TANIMI)</label>
                <input 
                  autoFocus
                  required 
                  className="h-12 px-4 rounded-xl border border-slate-100 bg-slate-50 font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-colors uppercase text-sm" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value.toLocaleUpperCase('tr-TR')})} 
                  placeholder="ÖR: MUHASEBE VE FİNANS MÜDÜRÜ" 
                />
              </div>

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-1 shrink-0">
                <label className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-1.5">
                  <FiGrid /> YETKİ MATRİSİ (CAPABILITY MATRIX)
                </label>
                
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { id: 'admin', label: 'Admin', color: 'bg-red-50 text-red-600 border-red-200' },
                    { id: 'sales', label: 'Satış', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
                    { id: 'warehouse', label: 'Depo', color: 'bg-blue-50 text-blue-600 border-blue-200' },
                    { id: 'accounting', label: 'Muhasebe', color: 'bg-amber-50 text-amber-600 border-amber-200' },
                    { id: 'special', label: 'Özel (Yetkili)', color: 'bg-purple-50 text-purple-600 border-purple-200' },
                  ].map(role => (
                    <label key={role.id} className="cursor-pointer group">
                      <input 
                        type="radio" 
                        name="baseRole" 
                        className="hidden" 
                        onChange={() => applyFastRole(role.id)}
                      />
                      <div className={`px-3 py-1.5 rounded-lg border-2 text-[9px] font-black uppercase tracking-widest transition-all group-hover:scale-105 active:scale-95 ${role.color}`}>
                        {role.label}
                      </div>
                    </label>
                  ))}
                  <button 
                    type="button" 
                    onClick={() => applyFastRole('clear')} 
                    className="h-8 px-3 bg-slate-100 text-slate-500 font-black text-[9px] uppercase tracking-widest rounded-lg hover:bg-slate-200 hover:text-danger transition-all ml-auto"
                  >
                    TEMİZLE
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 modern-scrollbar bg-slate-50 rounded-2xl border border-slate-100 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {Object.keys(groupedPermissions).map(moduleName => (
                    <ModuleSection 
                      key={moduleName} 
                      moduleName={moduleName} 
                      permissions={groupedPermissions[moduleName]} 
                      selectedIds={formData.permissionIds}
                      onToggle={togglePermission}
                      onToggleModule={toggleModule}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 shrink-0 pt-3 border-t border-slate-100 mt-auto bg-white">
                <button type="submit" className="flex-1 h-12 rounded-xl bg-primary text-white font-black text-sm shadow-md shadow-primary/10 hover:bg-primary/90 active:scale-[0.98] transition-all">
                  YARATILAN PROFİLİ KAYDET
                </button>
                <button type="button" className="flex-[0.25] h-12 rounded-xl bg-slate-50 text-slate-500 font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 transition-colors" onClick={() => setIsModalOpen(false)}>
                  VAZGEÇ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}