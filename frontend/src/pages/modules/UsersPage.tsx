import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersAPI, departmentsAPI, rolesAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { confirmDialog } from '../../utils/confirmDialog';
import { User, Department, Role, Permission } from '../../types';
import { useQuickCreateStore } from '../../store/useQuickCreateStore';
import { DataTable, Column } from '../../components/common/DataTable';
import { useSort } from '../../hooks/useSort';
import { useDeferredValue } from 'react';
import { FiShield, FiSearch, FiUsers, FiPlus, FiFilter, FiActivity, FiArchive, FiMail } from 'react-icons/fi';
import { queryKeys } from '../../services/queryKeys';

// Sub-components
import { UserPermissionsModal } from './users/components/UserPermissionsModal';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const page = Number(searchParams.get('page')) || 1;
  const searchTerm = searchParams.get('q') || '';
  const filterTab = (searchParams.get('tab') as 'active' | 'passive' | 'all') || 'active';
  const limit = Number(searchParams.get('limit')) || 20;

  const deferredSearch = useDeferredValue(searchTerm);
  const { openCreate } = useQuickCreateStore();

  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [selectedUserForPerms, setSelectedUserForPerms] = useState<User | null>(null);
  const [userSpecificPerms, setUserSpecificPerms] = useState<{ permissionId: number; effect: 'allow' | 'deny'; scopeType: 'global' | 'department' }[]>([]);

  const sort = {
    key: searchParams.get('sortBy') || 'fullName',
    order: (searchParams.get('sortOrder') as 'ASC' | 'DESC') || 'ASC'
  };

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
  const setSearchTerm = (q: string) => updateParams({ q, page: 1 });
  const setSort = (key: string, order: 'ASC' | 'DESC') => updateParams({ sortBy: key, sortOrder: order, page: 1 });

  // ────── QUERIES ──────

  const { data: usersData, isLoading: loading } = useQuery({
    queryKey: queryKeys.users.all({
      page,
      limit,
      deferredSearch,
      filterTab,
      sort
    }),
    queryFn: async ({ signal }) => {
      const res = await usersAPI.getAll({
        page,
        limit,
        search: deferredSearch,
        state: filterTab === 'all' ? undefined : (filterTab === 'active' ? 1 : 0),
        sortBy: sort.key,
        sortOrder: sort.order
      }, { signal });
      return res.data;
    }
  });

  const { data: availablePermissions = [] } = useQuery({
    queryKey: queryKeys.permissions.all,
    queryFn: async () => {
      const res = await rolesAPI.getPermissions({ limit: 500 });
      return res.data.data;
    }
  });

  const users = usersData?.data || [];
  const paginationMeta = usersData?.meta || { total: 0, page: 1, limit: 20, totalPages: 0 };

  const { sortedData, sortConfigs, toggleSort } = useSort<User>(
    users, 
    [{ key: sort.key, direction: sort.order.toLowerCase() as 'asc' | 'desc' }],
    (configs) => {
      if (configs.length > 0) {
        setSort(
          configs[0].key, 
          configs[0].direction.toUpperCase() as 'ASC' | 'DESC' 
        );
      }
    }
  );

  useEffect(() => {
    if (!loading && users.length === 0 && paginationMeta.total > 0 && page > 1) {
      setPage(Math.max(1, page - 1));
    }
  }, [users.length, loading, page, paginationMeta.total]);

  const handleFormSubmit = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.users.all({}) });
    toast.success("İşlem başarılı.");
  };

  const handleEdit = (u: User) => {
    openCreate('user', {
      editingId: u.id,
      initialData: {
        fullName: u.fullName || '',
        username: u.username || '',
        password: '',
        email: u.email || '',
        phone: u.phone || '',
        departmentId: u.departmentId?.toString() || u.department?.id?.toString() || '',
        selectedRoles: u.roles?.map((r: Role) => r.id) || [],
      },
      onSuccess: handleFormSubmit
    });
  };

  const toggleMutation = useMutation({
    mutationFn: ({ id, state }: { id: string | number; state: number }) => usersAPI.toggleState(id, state),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all({}) });
      toast.success("Kullanıcı durumu güncellendi.");
    },
    onError: () => toast.error("İşlem başarısız")
  });

  const toggleState = async (id: string | number, currentState: number) => {
    const question = currentState === 1
      ? 'Kullanıcının sisteme erişimini durdurmak ve arşivlemek istiyor musunuz?'
      : 'Kullanıcıyı tekrar aktif etmek istiyor musunuz?';
    
    if (await confirmDialog(question, currentState === 1)) {
      toggleMutation.mutate({ id, state: currentState });
    }
  };

  const openPermissionsModal = async (u: User) => {
    setSelectedUserForPerms(u);
    try {
      const res = await rolesAPI.getUserPermissions(u.id);
      setUserSpecificPerms(res.data);
      setIsPermissionsModalOpen(true);
    } catch (err) {
      toast.error("Yetkiler çekilemedi");
    }
  };

  const handleSetSpecificPermission = async (permId: string | number, effect: 'allow' | 'deny' | null, scope: 'global' | 'department') => {
    if (!selectedUserForPerms) return;
    try {
      if (effect === null) {
        await rolesAPI.removeUserPermission({ userId: selectedUserForPerms.id, permissionId: permId });
      } else {
        await rolesAPI.setUserPermission({
          userId: selectedUserForPerms.id,
          permissionId: permId,
          effect,
          scopeType: scope,
          scopeId: scope === 'department' ? (selectedUserForPerms.departmentId ?? null) : null,
        });
      }
      const res = await rolesAPI.getUserPermissions(selectedUserForPerms.id);
      setUserSpecificPerms(res.data);
      toast.success("Yetki kuralı güncellendi.");
    } catch (error) {
      toast.error("Bir hata oluştu.");
    }
  };

  const columns: Column<User>[] = [
    { 
      header: 'PERSONEL BİLGİLERİ', 
      accessor: (u) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-lg font-black uppercase">
            {u.fullName?.charAt(0)}
          </div>
          <div>
            <div className="font-black text-on-surface text-sm tracking-tighter uppercase">{u.fullName}</div>
            <div className="text-[11px] text-slate-400 font-bold tracking-widest lowercase">@{u.username}</div>
          </div>
        </div>
      ),
      sortKey: 'fullName'
    },
    { 
      header: 'DEPARTMAN', 
      accessor: (u) => <span className="font-bold text-xs text-secondary bg-surface-container px-2.5 py-1 rounded-lg uppercase tracking-wider">{u.department?.name || 'BELİRTİLMEMİŞ'}</span>,
      sortKey: 'department.name'
    },
    { 
      header: 'YETKİ ROLLERİ', 
      accessor: (u) => (
        <div className="flex flex-wrap gap-1">
          {(u.roles?.length ?? 0) > 0 ? u.roles?.map((r: Role) => (
            <span key={r.id} className="text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-md uppercase tracking-widest">{r.name}</span>
          )) : <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">ROLSÜZ</span>}
        </div>
      ),
      sortKey: 'roles.name'
    },
    { 
      header: 'İLETİŞİM', 
      accessor: (u) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1">
            <FiMail className="text-primary text-sm" />
            <span className="text-xs text-on-surface-variant font-medium lowercase tracking-tight">{u.email}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-bold tracking-widest">{u.phone || '—'}</span>
        </div>
      ),
      sortKey: 'email'
    },
    {
      header: 'TARİHÇE',
      accessor: (u) => (
        <div className="flex flex-col gap-1">
          {u.entryDate && (
            <div className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">
              <span className="text-emerald-500 mr-1">GİRİŞ:</span> {new Date(u.entryDate).toLocaleDateString('tr-TR')}
            </div>
          )}
          {u.state === 0 && u.lastDeactivationDate && (
            <div className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">
              <span className="text-rose-500 mr-1">ÇIKIŞ:</span> {new Date(u.lastDeactivationDate).toLocaleDateString('tr-TR')}
            </div>
          )}
          {!u.entryDate && !u.lastDeactivationDate && (
            <span className="text-[10px] text-slate-400 font-bold tracking-widest">BİLGİ YOK</span>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="animate-in flex flex-col gap-8">
      
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
            <FiShield /> SİSTEM PERSONELİ & YETKİ
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-on-surface">
            Kullanıcı <span className="text-primary">Yönetimi</span>
          </h1>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex bg-surface-container-low p-1 rounded-2xl border border-surface-container">
            {[
              { id: 'active', label: 'Aktif', icon: <FiActivity /> },
              { id: 'passive', label: 'Erişime Kapalı', icon: <FiArchive /> },
              { id: 'all', label: 'Tümü', icon: <FiFilter /> }
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
          <button className="h-12 px-6 bg-primary text-white rounded-2xl font-black text-sm shadow-premium flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-colors" onClick={() => {
            openCreate('user', { onSuccess: handleFormSubmit });
          }}>
            <FiPlus size={20} /> Yeni Personel
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <DataTable<User>
          data={sortedData}
          columns={columns}
          isLoading={loading}
          sortConfigs={sortConfigs}
          onSort={toggleSort}
          getRowKey={(u) => u.id}
          hasState={(u) => u.state === 1}
          onEdit={handleEdit}
          onArchive={(u) => toggleState(u.id, 1)}
          onRestore={(u) => toggleState(u.id, 0)}
          getRowOpacity={(u) => u.state === 0 ? 0.5 : 1}
          renderExtraActions={(u) => (
            <button className="btn-icon circle" title="Özel Yetki Yönetimi" onClick={() => openPermissionsModal(u)}>
              <FiShield size={16} />
            </button>
          )}
          
          search={searchTerm}
          onSearchChange={(val) => setSearchTerm(val)}
          total={paginationMeta.total}
          page={page}
          limit={limit}
          onPageChange={setPage}
          placeholder="İsim, kullanıcı adı veya e-posta ile ara..."
        />
      </div>

      <UserPermissionsModal
        isOpen={isPermissionsModalOpen}
        onClose={() => setIsPermissionsModalOpen(false)}
        user={selectedUserForPerms}
        availablePermissions={availablePermissions}
        userSpecificPerms={userSpecificPerms}
        onSetPermission={handleSetSpecificPermission}
      />
    </div>
  );
}