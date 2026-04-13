import React from 'react';
import { useQuickCreate } from '../../context/QuickCreateContext';
import { DepartmentForm } from '../forms/DepartmentForm';
import { AccountForm } from '../forms/AccountForm';
import { UserForm } from '../forms/UserForm';
import { PartyForm } from '../forms/PartyForm';
import { ItemForm } from '../forms/ItemForm';
import { BomForm } from '../forms/BomForm';
import { FiX } from 'react-icons/fi';

export const QuickCreateManager: React.FC = () => {
  const { stack, closeCurrent } = useQuickCreate();

  if (stack.length === 0) return null;

  return (
    <>
      {stack.map((item: any, index: number) => {
        const isTop = index === stack.length - 1;
        
        return (
          <div 
            key={item.id} 
            className="loader-overlay" 
            style={{ 
              alignItems: 'flex-start', 
              paddingTop: `${5 + index * 2}%`, 
              zIndex: 1000 + index, 
              display: isTop ? 'flex' : 'none',
              overflowY: 'auto'
            }}
          >
            <div className="login-box" style={{ maxWidth: '800px', width: '100%', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
              <button 
                className="btn-icon circle" 
                style={{ position: 'absolute', top: '15px', right: '15px' }} 
                onClick={() => {
                  item.onCancel();
                  closeCurrent();
                }}
              >
                <FiX size={20} />
              </button>

              <h3 style={{ marginBottom: '20px', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                {getTitle(item.type, !!item.editingId)}
              </h3>

              {renderForm(item, () => closeCurrent())}
            </div>
          </div>
        );
      })}
    </>
  );
};

function getTitle(type: string, isEditing: boolean) {
  const titles: any = {
    user: isEditing ? 'Kullanıcı Güncelle' : 'Hızlı Kullanıcı Ekle',
    department: isEditing ? 'Departman Güncelle' : 'Hızlı Departman Ekle',
    account: isEditing ? 'Hesap Güncelle' : 'Hızlı Finansal Hesap Ekle',
    party: isEditing ? 'Cari Güncelle' : 'Hızlı Cari Kart Ekle',
    item: isEditing ? 'Ürün Güncelle' : 'Hızlı Ürün Kaydı',
  };
  return titles[type] || 'Hızlı Oluştur';
}

function renderForm(item: any, close: () => void) {
  const props = {
    initialData: item.initialData,
    editingId: item.editingId,
    onSuccess: (data: any) => {
      item.onSuccess(data);
      close();
    },
    onCancel: () => {
      item.onCancel();
      close();
    }
  };

  switch (item.type) {
    case 'user': return <UserForm {...props} />;
    case 'department': return <DepartmentForm {...props} />;
    case 'account': return <AccountForm {...props} />;
    case 'party': return <PartyForm {...props} />;
    case 'item': return <ItemForm {...props} />;
    case 'bom': return <BomForm {...props} />;
    // Add other forms as they are created
    default: return <div>Henüz form hazırlanmadı: {item.type}</div>;
  }
}
