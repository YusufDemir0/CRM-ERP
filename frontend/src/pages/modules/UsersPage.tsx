import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersAPI, departmentsAPI, rolesAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { confirmDialog } from '../../utils/confirmDialog';
import { User, Department, Role, Permission } from '../../types';
import { useQuickCreateStore } from '../../store/useQuickCreateStore';
import { PaginationControls } from '../../components/common/PaginationControls';
import { DataTable, Column } from '../../components/common/DataTable';
import { useSort } from '../../hooks/useSort';
import { FiShield, FiSearch, FiUsers, FiPlus, FiFilter, FiActivity, FiArchive, FiMail } from 'react-icons/fi';

// Sub-components
import { UserPermissionsModal } from './users/components/UserPermissionsModal';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [selectedUserForPerms, setSelectedUserForPerms] = useState<User | null>(null);
  const [userSpecificPerms, setUserSpecificPerms] = useState<Permission[]>([]);

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialFilter = queryParams.get('filter') === 'passive' ? 'passive' : 'active';

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'active' | 'passive'>(initialFilter);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sort, setSort] = useState<{ key: string; order: 'ASC' | 'DESC' }>({ key: 'fullName', order: 'ASC' });

  // ────── QUERIES ──────

  const { data: usersData, isLoading: loading } = useQuery({
    queryKey: ['users', page, limit, debouncedSearch, filterTab, sort],
    queryFn: async () => {
      const res = await usersAPI.getAll({
        page,
        limit,
        search: debouncedSearch,
        state: filterTab === 'active' ? 1 : 0,
        sortBy: sort.key,
        sortOrder: sort.order
      });
      return res.data;
    }
  });

  const { data: availablePermissions = [] } = useQuery({
    queryKey: ['permissions'],
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
        setSort({ 
          key: configs[0].key, 
          order: configs[0].direction.toUpperCase() as 'ASC' | 'DESC' 
        });
        setPage(1); // FE-01: Reset page on sort change
      }
    }
  );

  // Update filter if location changes
  useEffect(() => {
    const f = queryParams.get('filter');
    if (f === 'active' || f === 'passive') {
      setFilterTab(f);
    }
  }, [location.search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); 
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // FE-08: Empty Page Trap Fix
  useEffect(() => {
    if (!loading && users.length === 0 && paginationMeta.total > 0 && page > 1) {
      setPage(prev => Math.max(1, prev - 1));
    }
  }, [users.length, loading, page, paginationMeta.total]);

  const { openCreate } = useQuickCreateStore();

  const handleFormSubmit = () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
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
        departmentId: u.department?.id?.toString() || '',
        selectedRoles: u.roles?.map((r: Role) => r.id) || [],
      },
      onSuccess: handleFormSubmit
    });
  };

  const toggleMutation = useMutation({
    mutationFn: ({ id, state }: { id: number; state: number }) => usersAPI.toggleState(id, state),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success("Kullanıcı durumu güncellendi.");
    },
    onError: () => toast.error("İşlem başarısız")
  });

  const toggleState = async (id: number, currentState: number) => {
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

  const handleSetSpecificPermission = async (permId: number, effect: 'allow' | 'deny', scope: 'global' | 'department') => {
    if (!selectedUserForPerms) return;
    try {
      await rolesAPI.setUserPermission({
        userId: selectedUserForPerms.id,
        permissionId: permId,
        effect,
        scopeType: scope,
        scopeId: scope === 'department' ? (selectedUserForPerms.departmentId ?? null) : null,
      });
      const res = await rolesAPI.getUserPermissions(selectedUserForPerms.id);
      setUserSpecificPerms(res.data);
      toast.success("Yetki kuralı uygulandı.");
    } catch (error) {
      toast.error("Bir hata oluştu.");
    }
  };

  const columns: Column<User>[] = [
    { 
      header: 'PERSONEL BİLGİLERİ', 
      accessor: (u) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '40px', height: '40px', borderRadius: '12px', 
            background: 'var(--primary-glow)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--primary)',
            fontSize: '18px', fontWeight: 800
          }}>
            {u.fullName?.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 800, color: 'var(--on-surface)', fontSize: '14px' }}>{u.fullName}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>@{u.username}</div>
          </div>
        </div>
      ),
      sortKey: 'fullName'
    },
    { 
      header: 'DEPARTMAN', 
      accessor: (u) => <span style={{ fontWeight: 700, fontSize: '12px', color: 'var(--secondary)', background: 'var(--surface-container)', padding: '4px 10px', borderRadius: '8px' }}>{u.department?.name || 'BELİRTİLMEMİŞ'}</span>,
      sortKey: 'department.name'
    },
    { 
      header: 'YETKİ ROLLERİ', 
      accessor: (u) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {(u.roles?.length ?? 0) > 0 ? u.roles?.map((r: Role) => (
            <span key={r.id} style={{ 
              fontSize: '10px', fontWeight: 700, background: 'var(--primary-glow)', 
              color: 'var(--primary)', padding: '2px 8px', borderRadius: '6px',
              textTransform: 'uppercase'
            }}>{r.name}</span>
          )) : <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>ROLSÜZ</span>}
        </div>
      )
    },
    { 
      header: 'İLETİŞİM', 
      accessor: (u) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FiMail size={12} color="var(--primary)" />
            <span style={{ fontSize: '13px', color: 'var(--on-surface-variant)', textTransform: 'lowercase' }}>{u.email}</span>
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600 }}>{u.phone || '—'}</span>
        </div>
      ),
      sortKey: 'email'
    }
  ];

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* 🔴 HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ 
            display: 'inline-flex', alignItems: 'center', gap: '8px', 
            background: 'var(--primary-glow)', color: 'var(--primary)', 
            padding: '6px 14px', borderRadius: '12px', fontSize: '12px', 
            fontWeight: 800, marginBottom: '16px'
          }}>
            <FiShield /> SİSTEM PERSONELİ & YETKİ
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--on-surface)' }}>
            Kullanıcı <span style={{ color: 'var(--primary)' }}>Yönetimi</span>
          </h1>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ display: 'flex', background: 'var(--surface-container-low)', padding: '4px', borderRadius: '14px', border: '1px solid var(--border)' }}>
            {[
              { id: 'active', label: 'Aktif', icon: <FiActivity /> },
              { id: 'passive', label: 'Erişime Kapalı', icon: <FiArchive /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setFilterTab(tab.id as any); setPage(1); }}
                style={{
                  height: '36px', padding: '0 16px', borderRadius: '10px', fontSize: '12px', fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: '8px', border: 'none', transition: '0.2s',
                  background: filterTab === tab.id ? 'white' : 'transparent',
                  color: filterTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                  boxShadow: filterTab === tab.id ? 'var(--shadow-md)' : 'none',
                  cursor: 'pointer'
                }}
              >
                {tab.icon} {tab.label.toUpperCase()}
              </button>
            ))}
          </div>
          <button className="btn btn-primary" style={{ height: '44px', boxShadow: '0 10px 20px var(--primary-glow)' }} onClick={() => {
            openCreate('user', { onSuccess: handleFormSubmit });
          }}>
            <FiPlus size={18} /> Yeni Personel
          </button>
        </div>
      </div>

      {/* 🟠 SEARCH & FILTERS */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: '24px', display: 'flex', gap: '20px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <FiSearch style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="İsim, kullanıcı adı veya e-posta ile ara..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '48px', height: '52px', border: 'none', background: 'var(--surface-container-low)' }}
          />
        </div>
        <button className="btn btn-secondary" style={{ height: '52px', background: 'white' }}>
          <FiFilter /> Gelişmiş Filtrele
        </button>
      </div>

      {/* 🟡 DATA TABLE SECTION */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <PaginationControls 
            meta={paginationMeta} 
            onPageChange={setPage} 
            onLimitChange={setLimit} 
            loading={loading}
          />
        </div>
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