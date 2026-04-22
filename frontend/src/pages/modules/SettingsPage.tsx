import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsAPI, currenciesAPI, itemsAPI, departmentsAPI } from '../../services/api';
import { 
  FiSettings, FiDollarSign, FiHome, FiStar, 
  FiZap, FiMap, FiLayers, FiActivity, FiBriefcase
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { confirmDialog } from '../../utils/confirmDialog';
import { queryKeys } from '../../services/queryKeys';

// Sub-components
import { GeneralSettings } from './Settings/GeneralSettings';
import { CurrencySettings } from './Settings/CurrencySettings';
import { CodeGroupSettings } from './Settings/CodeGroupSettings';
import { EnumSettings, EnumItem } from './Settings/EnumSettings';

type TabType = 'general' | 'currencies' | 'item-groups' | 'item-types' | 'quantity-types' | 'dept-types';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [localSettings, setLocalSettings] = useState<Record<string, string>>({});

  // Form states
  const [newCurrency, setNewCurrency] = useState({ code: '', symbol: '', name: '' });
  const [newGroup, setNewGroup] = useState({ name: '', prefix: '' });
  const [newQtyType, setNewQtyType] = useState({ name: '', abbreviation: '' });
  const [newItemType, setNewItemType] = useState({ name: '', abbreviation: '' });
  const [newDeptType, setNewDeptType] = useState({ name: '', abbreviation: '' });

  // Queries
  const { data: settings = {}, isLoading: settingsLoading } = useQuery({
    queryKey: queryKeys.settings.base,
    queryFn: async ({ signal }) => {
      const res = await settingsAPI.getAll({ signal });
      setLocalSettings(res.data);
      return res.data;
    }
  });

  const { data: currencies = [], isLoading: currenciesLoading } = useQuery({
    queryKey: queryKeys.currencies.all,
    queryFn: async ({ signal }) => {
      const res = await currenciesAPI.getAll({ limit: 500 }, { signal });
      return res.data.data || [];
    }
  });

  const { data: codeGroups = [], isLoading: groupsLoading } = useQuery({
    queryKey: queryKeys.settings.codeGroups,
    queryFn: async ({ signal }) => {
      const res = await itemsAPI.getCodeGroups({ signal });
      return res.data || [];
    }
  });

  const { data: quantityTypes = [], isLoading: qtyLoading } = useQuery({
    queryKey: queryKeys.settings.quantityTypes,
    queryFn: async ({ signal }) => {
      const res = await itemsAPI.getQuantityTypes({ signal });
      return Array.from(new Map((res.data || []).map((q: { id: number; name: string; abbreviation: string; state: number }) => [q.name.toLowerCase().trim(), q])).values());
    }
  });

  const { data: itemTypes = [], isLoading: itemTypesLoading } = useQuery({
    queryKey: queryKeys.settings.itemTypes,
    queryFn: async ({ signal }) => {
      const res = await itemsAPI.getTypes({ signal });
      return Array.from(new Map((res.data || []).map((i: { id: number; name: string; abbreviation: string; state: number }) => [`${i.name.toLowerCase().trim()}-${i.abbreviation.toLowerCase().trim()}`, i])).values());
    }
  });

  const { data: deptTypes = [], isLoading: deptTypesLoading } = useQuery({
    queryKey: queryKeys.settings.deptTypes,
    queryFn: async ({ signal }) => {
      const res = await departmentsAPI.getTypes({ signal });
      return Array.from(new Map((res.data || []).map((t: { id: number; name: string; abbreviation: string; state: number }) => [`${t.name.toLowerCase().trim()}-${t.abbreviation.toLowerCase().trim()}`, t])).values());
    }
  });

  const isLoading = settingsLoading || currenciesLoading || groupsLoading || qtyLoading || itemTypesLoading || deptTypesLoading;

  // Mutations
  const settingsMutation = useMutation({
    mutationFn: (items: { settingKey: string; settingValue: string }[]) => settingsAPI.bulkUpdate(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.base });
      toast.success('Ayarlar kaydedildi');
    },
    onError: () => toast.error('Kayıt hatası')
  });

  const currencyAddMutation = useMutation({
    mutationFn: (curr: { code: string; symbol: string; name: string }) => currenciesAPI.create(curr),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.currencies.all });
      setNewCurrency({ code: '', symbol: '', name: '' });
      toast.success('Eklendi');
    }
  });

  const currencyDefaultMutation = useMutation({
    mutationFn: (id: number) => currenciesAPI.setDefault(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.currencies.all });
      toast.success('Varsayılan güncellendi');
    }
  });

  const currencyDeleteMutation = useMutation({
    mutationFn: (id: number) => currenciesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.currencies.all });
      toast.success('Silindi');
    }
  });

  const groupAddMutation = useMutation({
    mutationFn: (group: { name: string; prefix: string }) => itemsAPI.createCodeGroup(group),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.codeGroups });
      setNewGroup({ name: '', prefix: '' });
      toast.success('Grup eklendi');
    }
  });

  const groupUpdateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<{ name: string; prefix: string; state: number }> }) => itemsAPI.updateCodeGroup(id, data as { name: string; prefix: string }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.codeGroups });
      toast.success('Durum güncellendi');
    }
  });

  // Generic Enum Mutations
  type EnumTabType = 'quantity-types' | 'item-types' | 'dept-types';
  type EnumData = { name: string; abbreviation: string };
  type EnumUpdateData = Record<string, string | number | boolean>;

  const enumApiMap = {
    add: {
      'quantity-types': itemsAPI.createQuantityType,
      'item-types': itemsAPI.createItemType,
      'dept-types': departmentsAPI.createType
    } as Record<EnumTabType, (data: EnumData) => Promise<unknown>>,
    update: {
      'quantity-types': itemsAPI.updateQuantityType,
      'item-types': itemsAPI.updateItemType,
      'dept-types': departmentsAPI.updateType
    } as Record<EnumTabType, (id: number, data: EnumUpdateData) => Promise<unknown>>,
    delete: {
      'quantity-types': itemsAPI.deleteQuantityType,
      'item-types': itemsAPI.deleteItemType,
      'dept-types': departmentsAPI.deleteType
    } as Record<EnumTabType, (id: number) => Promise<unknown>>
  };

  const enumKeyMap: Record<EnumTabType, readonly string[]> = {
    'quantity-types': queryKeys.settings.quantityTypes,
    'item-types': queryKeys.settings.itemTypes,
    'dept-types': queryKeys.settings.deptTypes
  };


  const addEnumMut = useMutation({ 
    mutationFn: ({ type, data }: { type: EnumTabType; data: EnumData }) => enumApiMap.add[type](data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: enumKeyMap[variables.type] });
      if (variables.type === 'quantity-types') setNewQtyType({ name: '', abbreviation: '' });
      if (variables.type === 'item-types') setNewItemType({ name: '', abbreviation: '' });
      if (variables.type === 'dept-types') setNewDeptType({ name: '', abbreviation: '' });
      toast.success('İşlem başarılı');
    }
  });

  const updateEnumMut = useMutation({
    mutationFn: ({ type, id, data }: { type: EnumTabType; id: number; data: EnumUpdateData }) => enumApiMap.update[type](id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: enumKeyMap[variables.type] });
      toast.success('Güncellendi');
    }
  });

  const deleteEnumMut = useMutation({
    mutationFn: ({ type, id }: { type: EnumTabType; id: number }) => enumApiMap.delete[type](id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: enumKeyMap[variables.type] });
      toast.success('Silindi');
    }
  });

  // Handlers
  const handleSaveSettings = () => {
    const items = Object.entries(localSettings).map(([settingKey, settingValue]) => ({
      settingKey,
      settingValue: String(settingValue || '')
    }));
    settingsMutation.mutate(items);
  };

  if (isLoading) return <div className="p-20 flex justify-center"><div className="relative w-12 h-12"><div className="absolute inset-0 rounded-full border-4 border-primary/10"></div><div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div></div></div>;

  const tabs = [
    { id: 'general', icon: <FiHome />, label: 'Şirket Profili' },
    { id: 'currencies', icon: <FiDollarSign />, label: 'Para Birimleri' },
    { id: 'item-groups', icon: <FiLayers />, label: 'Kod Grupları' },
    { id: 'item-types', icon: <FiZap />, label: 'Ürün Türleri' },
    { id: 'quantity-types', icon: <FiActivity />, label: 'Birimler' },
    { id: 'dept-types', icon: <FiBriefcase />, label: 'Departmanlar' },
  ];

  return (
    <div className="animate-in flex flex-col gap-8">
      
      {/* 🔴 HEADER SECTION */}
      <div className="flex justify-between items-end">
        <div>
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
            <FiSettings /> SİSTEM MİMARİSİ
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-on-surface">
            Ermay <span className="text-primary">Konfigürasyonları</span>
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">
        
        {/* 🟠 SIDEBAR NAVIGATION */}
        <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-premium flex flex-col gap-1.5">
          {tabs.map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`w-full flex items-center gap-3.5 px-5 py-4 rounded-2xl transition-colors duration-200 group ${
                activeTab === tab.id ? 'bg-primary/5 text-primary' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className={`text-xl transition-transform group-hover:scale-110 ${activeTab === tab.id ? 'scale-110' : ''}`}>{tab.icon}</span>
              <span className={`text-sm tracking-tight ${activeTab === tab.id ? 'font-black' : 'font-bold'}`}>{tab.label}</span>
              {activeTab === tab.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-sm" />}
            </button>
          ))}
        </div>

        {/* 🟡 CONTENT AREA */}
        <div className="bg-white p-8 sm:p-8 rounded-2xl border border-slate-100 shadow-premium min-h-[600px]">
          
          {activeTab === 'general' && (
            <GeneralSettings 
              settings={localSettings} 
              setSettings={setLocalSettings} 
              onSave={handleSaveSettings} 
            />
          )}

          {activeTab === 'currencies' && (
            <CurrencySettings 
              currencies={currencies}
              newCurrency={newCurrency}
              setNewCurrency={setNewCurrency}
              onAdd={() => {
                if (!newCurrency.code || !newCurrency.symbol) return toast.error('Eksik bilgi');
                currencyAddMutation.mutate(newCurrency);
              }}
              onSetDefault={(id) => currencyDefaultMutation.mutate(id)}
              onDelete={(id) => currencyDeleteMutation.mutate(id)}
            />
          )}

          {activeTab === 'item-groups' && (
            <CodeGroupSettings 
              groups={codeGroups}
              newGroup={newGroup}
              setNewGroup={setNewGroup}
              onAdd={() => {
                if (!newGroup.name || !newGroup.prefix) return toast.error('Eksik bilgi');
                groupAddMutation.mutate(newGroup);
              }}
              onToggle={(id, state) => groupUpdateMutation.mutate({ id, data: { state: state === 1 ? 0 : 1 } })}
            />
          )}

          {activeTab === 'item-types' && (
            <EnumSettings 
              title="Ürün Türleri"
              data={itemTypes as EnumItem[]}
              newItem={newItemType}
              setNewItem={setNewItemType}
              showStar
              onStarToggle={(id, current) => updateEnumMut.mutate({ type: 'item-types', id, data: { isExcludedFromBom: !current } })}
              onAdd={() => addEnumMut.mutate({ type: 'item-types', data: newItemType })}
              onToggle={(id, state) => updateEnumMut.mutate({ type: 'item-types', id, data: { state: state === 1 ? 0 : 1 } })}
              onDelete={(id) => confirmDialog('Bu türü silmek istediğinize emin misiniz?', true).then(ok => ok && deleteEnumMut.mutate({ type: 'item-types', id }))}
            />
          )}

          {activeTab === 'quantity-types' && (
            <EnumSettings 
              title="Ölçü Birimleri"
              data={quantityTypes as EnumItem[]}
              newItem={newQtyType}
              setNewItem={setNewQtyType}
              onAdd={() => addEnumMut.mutate({ type: 'quantity-types', data: newQtyType })}
              onToggle={(id, state) => updateEnumMut.mutate({ type: 'quantity-types', id, data: { state: state === 1 ? 0 : 1 } })}
              onDelete={(id) => confirmDialog('Bu birimi silmek istediğinize emin misiniz?', true).then(ok => ok && deleteEnumMut.mutate({ type: 'quantity-types', id }))}
              lockedAbbreviations={['ADET', 'KG', 'METRE', 'LİTRE']}
            />
          )}

          {activeTab === 'dept-types' && (
            <EnumSettings 
              title="Departman Türleri"
              data={deptTypes as EnumItem[]}
              newItem={newDeptType}
              setNewItem={setNewDeptType}
              onAdd={() => addEnumMut.mutate({ type: 'dept-types', data: newDeptType })}
              onToggle={(id, state) => updateEnumMut.mutate({ type: 'dept-types', id, data: { state: state === 1 ? 0 : 1 } })}
              onDelete={(id) => confirmDialog('Bu türü silmek istediğinize emin misiniz?', true).then(ok => ok && deleteEnumMut.mutate({ type: 'dept-types', id }))}
            />
          )}

        </div>
      </div>
    </div>
  );
}