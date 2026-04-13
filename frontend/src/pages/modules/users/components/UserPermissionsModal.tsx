import React from 'react';
import { FiShield, FiX } from 'react-icons/fi';
import { User, Permission } from '../../../../types';

interface UserPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  availablePermissions: Permission[];
  userSpecificPerms: any[];
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
    <div className="loader-overlay" style={{ alignItems: 'flex-start', paddingTop: '5%', paddingBottom: '5%', overflowY: 'auto' }}>
      <div className="login-box" style={{ maxWidth: '850px', width: '100%', position: 'relative' }}>
        <button className="btn-icon circle" style={{ position: 'absolute', top: '15px', right: '15px' }} onClick={onClose}>
          <FiX size={20} />
        </button>

        <div style={{ marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ color: 'var(--primary)' }}><FiShield /> İstisna / İleri Seviye Yetkilendirme</h3>
          <p style={{ fontSize: '12px', color: 'gray', marginTop: '5px' }}>
            <strong>{user.fullName}</strong> kullanıcısı için Override yetkileri belirleyin.
          </p>
        </div>

        <div style={{ maxHeight: '60vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
            <thead style={{ background: 'var(--surface-container-highest)', textAlign: 'left' }}>
              <tr>
                <th style={{ padding: '10px' }}>MODÜL VE YETKİ (KEY)</th>
                <th>BİLGİ</th>
                <th>ROL KURALLARI</th>
                <th>İSTİSNA (OVERRIDE)</th>
              </tr>
            </thead>
            <tbody>
              {availablePermissions.map((perm) => {
                const permOverride = userSpecificPerms.find((u: any) => u.permissionId === perm.id);

                return (
                  <tr key={perm.id} style={{ borderBottom: '1px solid var(--border)', background: permOverride ? (permOverride.effect === 'deny' ? '#fef2f2' : '#ecfdf5') : 'white' }}>
                    <td style={{ padding: '10px' }}>
                      <div style={{ fontWeight: 800 }}>{perm.name}</div>
                      <div style={{ fontSize: '10px', color: 'gray' }}>[{perm.module}] {perm.key}</div>
                    </td>
                    <td style={{ color: 'gray', fontStyle: 'italic', fontSize: '11px' }}>Önceliği Deny Alır.</td>
                    <td>
                      <span className="badge" style={{ background: 'var(--surface-container)' }}>ROL'E BAĞLI</span>
                    </td>
                    <td style={{ display: 'flex', gap: '5px', padding: '10px 0' }}>
                      <button
                        className="btn"
                        style={{ padding: '4px 10px', height: '24px', fontSize: '10px', background: permOverride?.effect === 'allow' && permOverride?.scopeType === 'global' ? 'var(--success)' : '#e2e8f0', color: permOverride?.effect === 'allow' && permOverride?.scopeType === 'global' ? 'white' : 'black' }}
                        onClick={() => onSetPermission(perm.id, 'allow', 'global')}
                      >
                        ✔️ İZİN VER (Global)
                      </button>

                      {user.departmentId && (
                        <button
                          className="btn"
                          style={{ padding: '4px 10px', height: '24px', fontSize: '10px', background: permOverride?.effect === 'allow' && permOverride?.scopeType === 'department' ? 'var(--primary)' : '#e2e8f0', color: permOverride?.effect === 'allow' && permOverride?.scopeType === 'department' ? 'white' : 'black' }}
                          onClick={() => onSetPermission(perm.id, 'allow', 'department')}
                        >
                          🏬 DEPARTMAN
                        </button>
                      )}

                      <button
                        className="btn"
                        style={{ padding: '4px 10px', height: '24px', fontSize: '10px', background: permOverride?.effect === 'deny' ? 'var(--danger)' : '#ffe4e6', color: permOverride?.effect === 'deny' ? 'white' : 'red' }}
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
