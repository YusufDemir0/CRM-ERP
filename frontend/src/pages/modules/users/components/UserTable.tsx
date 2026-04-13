import React from 'react';
import { FiEdit2, FiShield, FiUserCheck, FiUserX } from 'react-icons/fi';
import { User, Role } from '../../../../types';

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onToggleState: (id: number, currentState: number) => void;
  onOpenPermissions: (user: User) => void;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  onEdit,
  onToggleState,
  onOpenPermissions,
}) => {
  return (
    <div className="table-card">
      <table>
        <thead>
          <tr>
            <th>AD SOYAD / SİSTEM ADI</th>
            <th>DEPARTMAN</th>
            <th>ROLLERİ</th>
            <th>E-POSTA / TELEFON</th>
            <th>İŞLEMLER</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} style={{ opacity: u.state === 0 ? 0.6 : 1, background: u.state === 0 ? '#f1f5f9' : 'inherit' }}>
              <td>
                <strong>{u.fullName}</strong><br/>
                <span className="badge" style={{ marginTop: '5px' }}>@{u.username}</span>
              </td>
              <td>{u.department?.name || <span style={{ color: 'gray' }}>Seçilmedi</span>}</td>
              <td>
                 {(u.roles?.length ?? 0) > 0 ? u.roles?.map((r: Role) => <span key={r.id} className="badge badge-outline" style={{marginRight: '3px'}}>{r.name}</span>) : '-'}
              </td>
              <td style={{ textTransform: 'lowercase' }}>{u.email}<br/><span style={{ color: 'gray', textTransform:'none'}}>{u.phone || '-'}</span></td>
              <td style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                <button className="btn-icon" title="Özel Yetki (Override)" style={{ color: 'var(--primary)' }} onClick={() => onOpenPermissions(u)}>
                   <FiShield size={16} />
                </button>
                <button className="btn-icon" title="Düzenle" onClick={() => onEdit(u)}>
                  <FiEdit2 size={16} />
                </button>
                <button className="btn-icon" title={u.state === 1 ? 'Erişimi Kes' : 'Aktif Et'} style={{ color: u.state === 1 ? 'var(--error)' : 'var(--success)' }} onClick={() => onToggleState(u.id, u.state)}>
                  {u.state === 1 ? <FiUserX size={16} /> : <FiUserCheck size={16} />}
                </button>
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center' }}>
                Kayıt bulunamadı.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
