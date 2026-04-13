import React, { useState, useEffect } from 'react';
import { usersAPI, departmentsAPI, rolesAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { confirmDialog } from '../../utils/confirmDialog';
import { User, Department, Role, Permission } from '../../types';

// Sub-components
import { UserTable } from './users/components/UserTable';
import { UserFormModal } from './users/components/UserFormModal';
import { UserPermissionsModal } from './users/components/UserPermissionsModal';

const INITIAL_FORM_DATA = {
  fullName: '',
  username: '',
  password: '',
  email: '',
  phone: '',
  departmentId: '',
  selectedRoles: [] as number[],
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [selectedUserForPerms, setSelectedUserForPerms] = useState<User | null>(null);
  const [userSpecificPerms, setUserSpecificPerms] = useState<any[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<'active' | 'passive'>('active');

  const fetchData = async () => {
    try {
      const [uRes, dRes, rRes, pRes] = await Promise.all([
        usersAPI.getAll({ limit: 500 }),
        departmentsAPI.getAll({ limit: 100 }),
        rolesAPI.getAll({ limit: 100, state: 1 }),
        rolesAPI.getPermissions({ limit: 500 }),
      ]);
      setUsers(uRes.data.data);
      setDepartments(dRes.data.data.filter((d: Department) => d.state === 1));
      setAvailableRoles(rRes.data.data);
      setAvailablePermissions(pRes.data.data);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Veriler çekilemedi";
      toast.error(msg);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredUsers = users.filter((u) => {
    const s = searchTerm.toLowerCase();
    const match =
      u.fullName?.toLowerCase().includes(s) ||
      u.username?.toLowerCase().includes(s) ||
      u.email?.toLowerCase().includes(s) ||
      u.phone?.toLowerCase().includes(s) ||
      u.department?.name?.toLowerCase().includes(s) ||
      u.roles?.some((r: any) => r.name?.toLowerCase().includes(s));

    if (!match) return false;
    return filterTab === 'active' ? u.state === 1 : u.state === 0;
  });

  const handleFormSubmit = async (data: any) => {
    try {
      const { fullPhone, ...rest } = data;
      const payload: any = {
        ...rest,
        departmentId: Number(rest.departmentId) || undefined,
        phone: fullPhone,
      };

      const roleIdsToKeep = [...rest.selectedRoles];
      delete payload.selectedRoles;

      let userId: number | null = null;

      if (editingId) {
        if (!payload.password) delete payload.password;
        await usersAPI.update(editingId, payload);
        userId = editingId;
      } else {
        const res = await usersAPI.create(payload);
        userId = res.data.id;
      }

      if (userId) {
        const currentUserRoles = editingId
          ? users.find((u) => u.id === editingId)?.roles?.map((r: Role) => r.id) || []
          : [];

        const rolesToAdd = roleIdsToKeep.map(Number).filter((rId) => !currentUserRoles.includes(rId));
        const rolesToRemove = currentUserRoles.filter((rId: number) => !roleIdsToKeep.map(Number).includes(rId));

        for (const rId of rolesToAdd) {
          await rolesAPI.assignRole({ userId: userId, roleId: rId }).catch(() => {});
        }
        for (const rId of rolesToRemove) {
          await rolesAPI.removeRole({ userId: userId, roleId: rId }).catch(() => {});
        }
      }

      setIsModalOpen(false);
      fetchData();
      toast.success("Kullanıcı bilgileri kaydedildi.");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Kayıt işlemi başarısız");
    }
  };

  const handleEdit = (u: User) => {
    setEditingId(u.id);
    setFormData({
      fullName: u.fullName || '',
      username: u.username || '',
      password: '',
      email: u.email || '',
      phone: u.phone || '',
      departmentId: u.department?.id?.toString() || '',
      selectedRoles: u.roles?.map((r: Role) => r.id) || [],
    });
    setIsModalOpen(true);
  };

  const toggleState = async (id: number, currentState: number) => {
    const question = currentState === 1
      ? 'Kullanıcının sisteme erişimini durdurmak ve arşivlemek istiyor musunuz?'
      : 'Kullanıcıyı tekrar aktif etmek istiyor musunuz?';
    
    if (await confirmDialog(question, currentState === 1)) {
      try {
        await usersAPI.toggleState(id, currentState);
        fetchData();
        toast.success("Kullanıcı durumu güncellendi.");
      } catch (error: any) {
        toast.error(error.response?.data?.message || "İşlem başarısız");
      }
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

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ color: 'var(--primary)', marginBottom: '10px' }}>Personel / Kullanıcı Yönetimi</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className={`btn ${filterTab === 'active' ? 'btn-primary' : ''}`} onClick={() => setFilterTab('active')}>Aktif Personel</button>
            <button className={`btn ${filterTab === 'passive' ? 'btn-primary' : ''}`} onClick={() => setFilterTab('passive')}>Erişimi Kapatılanlar</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <input
            type="text"
            placeholder="Ara..."
            className="search-bar"
            style={{ width: '350px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingId(null);
              setFormData(INITIAL_FORM_DATA);
              setIsModalOpen(true);
            }}
          >
            + YENİ KULLANICI
          </button>
        </div>
      </div>

      <UserTable
        users={filteredUsers}
        onEdit={handleEdit}
        onToggleState={toggleState}
        onOpenPermissions={openPermissionsModal}
      />

      <UserFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        editingId={editingId}
        initialData={formData}
        departments={departments}
        availableRoles={availableRoles}
      />

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