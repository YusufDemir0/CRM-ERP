import { lazy, Suspense, useEffect } from 'react';
import { useQuickCreateStore, QuickCreateStackItem } from '../../store/useQuickCreateStore';
import { FiX } from 'react-icons/fi';
import GlobalLoader from '../GlobalLoader';

// Lazy Loaded Forms
const DepartmentForm = lazy(() => import('../forms/DepartmentForm').then(m => ({ default: m.DepartmentForm })));
const AccountForm = lazy(() => import('../forms/AccountForm').then(m => ({ default: m.AccountForm })));
const UserForm = lazy(() => import('../forms/UserForm').then(m => ({ default: m.UserForm })));
const PartyForm = lazy(() => import('../forms/PartyForm').then(m => ({ default: m.PartyForm })));
const ItemForm = lazy(() => import('../forms/ItemForm').then(m => ({ default: m.ItemForm })));
const BomForm = lazy(() => import('../forms/BomForm').then(m => ({ default: m.BomForm })));
const StaffForm = lazy(() => import('../forms/StaffForm').then(m => ({ default: m.StaffForm })));

export const QuickCreateManager: React.FC = () => {
  const { stack, closeCurrent, clearCache } = useQuickCreateStore();

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && stack.length > 0) {
        const topItem = stack[stack.length - 1];
        clearCache(topItem.type);
        topItem.onCancel();
        closeCurrent();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [stack, closeCurrent, clearCache]);

  if (stack.length === 0) return null;

  return (
    <>
      {stack.map((item: QuickCreateStackItem, index: number) => {
        const isTop = index === stack.length - 1;
        
        return (
          <div 
            key={item.id} 
            className={`loader-overlay flex flex-col items-center justify-center p-4 transition-opacity duration-200 ${
              isTop ? 'flex opacity-100 pointer-events-auto' : 'hidden opacity-0 pointer-events-none'
            }`}
            style={{ 
              zIndex: 9000 + index, 
              background: 'rgba(15, 23, 42, 0.4)'
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                clearCache(item.type);
                item.onCancel();
                closeCurrent();
              }
            }}
          >
            <div className="bg-white max-w-3xl w-full relative rounded-2xl shadow-premium border border-slate-100 animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh] overflow-hidden">
              {/* Header: Fixed */}
              <div className="p-6 pb-2 shrink-0 relative">
                <button 
                  className="btn-icon circle absolute top-6 right-6" 
                  onClick={() => {
                    clearCache(item.type);
                    item.onCancel();
                    closeCurrent();
                  }}
                >
                  <FiX size={20} />
                </button>

                <h3 className="text-xl font-black text-primary border-b border-slate-100 pb-4 flex items-center gap-3">
                  <span className="w-2 h-8 bg-primary rounded-full hidden sm:block" />
                  {getTitle(item.type, !!item.editingId)}
                </h3>
              </div>

              {/* Body: Scrollable */}
              <div className="flex-1 overflow-y-auto p-6 pt-2 custom-scrollbar">
                <Suspense fallback={<GlobalLoader />}>
                  {renderFormInternal(item, () => closeCurrent())}
                </Suspense>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );

  function renderFormInternal(item: QuickCreateStackItem, close: () => void) {
    const props = {
      initialData: item.initialData,
      editingId: item.editingId,
      onSuccess: (data: unknown) => {
        item.onSuccess(data as { data: { id: number; name?: string; code?: string; title?: string } });
        close();
      },
      onCancel: () => {
        clearCache(item.type);
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
      case 'staff': return <StaffForm {...props} />;
      default: return <div>Henüz form hazırlanmadı: {item.type}</div>;
    }
  }
};

function getTitle(type: string, isEditing: boolean): string {
  const titles: Record<string, string> = {
    user: isEditing ? 'Kullanıcı Güncelle' : 'Hızlı Kullanıcı Ekle',
    department: isEditing ? 'Departman Güncelle' : 'Hızlı Departman Ekle',
    account: isEditing ? 'Hesap Güncelle' : 'Hızlı Finansal Hesap Ekle',
    party: isEditing ? 'Cari Güncelle' : 'Hızlı Cari Kart Ekle',
    item: isEditing ? 'Ürün Güncelle' : 'Hızlı Ürün Kaydı',
    bom: isEditing ? 'Reçete Güncelle' : 'Hızlı Reçete Tanımı',
    staff: isEditing ? 'Personel Güncelle' : 'Hızlı Personel Ekle',
  };
  return titles[type] || 'Hızlı Oluştur';
}
