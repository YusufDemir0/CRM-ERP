import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsAPI, currenciesAPI, itemsAPI, departmentsAPI } from '../../services/api';
import { 
  FiSave, FiSettings, FiDollarSign, FiHome, FiHash, FiStar, FiPlus, 
  FiTrash2, FiArchive, FiRefreshCw, FiAlertTriangle, FiLock, FiCheck,
  FiZap, FiMap, FiLayers, FiActivity, FiBriefcase, FiCheckCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { confirmDialog } from '../../utils/confirmDialog';
import { DataTable, Column } from '../../components/common/DataTable';
import { useSort } from '../../hooks/useSort';

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
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await settingsAPI.getAll();
      setLocalSettings(res.data);
      return res.data;
    }
  });

  const { data: currencies = [], isLoading: currenciesLoading } = useQuery({
    queryKey: ['currencies'],
    queryFn: async () => {
      const res = await currenciesAPI.getAll();
      return res.data || [];
    }
  });

  const { data: codeGroups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ['codeGroups'],
    queryFn: async () => {
      const res = await itemsAPI.getCodeGroups();
      return res.data || [];
    }
  });

  const { data: quantityTypes = [], isLoading: qtyLoading } = useQuery({
    queryKey: ['quantityTypes'],
    queryFn: async () => {
      const res = await itemsAPI.getQuantityTypes();
      return Array.from(new Map((res.data || []).map((q: any) => [q.name.toLowerCase().trim(), q])).values());
    }
  });

  const { data: itemTypes = [], isLoading: itemTypesLoading } = useQuery({
    queryKey: ['itemTypes'],
    queryFn: async () => {
      const res = await itemsAPI.getTypes();
      return Array.from(new Map((res.data || []).map((i: any) => [`${i.name.toLowerCase().trim()}-${i.abbreviation.toLowerCase().trim()}`, i])).values());
    }
  });

  const { data: deptTypes = [], isLoading: deptTypesLoading } = useQuery({
    queryKey: ['deptTypes'],
    queryFn: async () => {
      const res = await departmentsAPI.getTypes();
      return Array.from(new Map((res.data || []).map((t: any) => [`${t.name.toLowerCase().trim()}-${t.abbreviation.toLowerCase().trim()}`, t])).values());
    }
  });

  const isLoading = settingsLoading || currenciesLoading || groupsLoading || qtyLoading || itemTypesLoading || deptTypesLoading;

  // Sorting
  const { sortedData: sortedCurrencies, sortConfigs: currSort, toggleSort: toggleCurrSort } = useSort(currencies, [{ key: 'code', direction: 'asc' }]);
  const { sortedData: sortedGroups, sortConfigs: groupSort, toggleSort: toggleGroupSort } = useSort(codeGroups, [{ key: 'name', direction: 'asc' }]);
  const { sortedData: sortedQty, sortConfigs: qtySort, toggleSort: toggleQtySort } = useSort(quantityTypes, [{ key: 'name', direction: 'asc' }]);
  const { sortedData: sortedItemTypes, sortConfigs: itSort, toggleSort: toggleItSort } = useSort(itemTypes, [{ key: 'name', direction: 'asc' }]);
  const { sortedData: sortedDeptTypes, sortConfigs: dtSort, toggleSort: toggleDtSort } = useSort(deptTypes, [{ key: 'name', direction: 'asc' }]);

  // Mutations
  const settingsMutation = useMutation({
    mutationFn: (items: any[]) => settingsAPI.bulkUpdate(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Ayarlar kaydedildi');
    },
    onError: () => toast.error('Kayıt hatası')
  });

  const currencyAddMutation = useMutation({
    mutationFn: (curr: any) => currenciesAPI.create(curr),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      setNewCurrency({ code: '', symbol: '', name: '' });
      toast.success('Eklendi');
    }
  });

  const currencyDefaultMutation = useMutation({
    mutationFn: (id: number) => currenciesAPI.setDefault(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      toast.success('Varsayılan güncellendi');
    }
  });

  const currencyDeleteMutation = useMutation({
    mutationFn: (id: number) => currenciesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      toast.success('Silindi');
    }
  });

  const groupAddMutation = useMutation({
    mutationFn: (group: any) => itemsAPI.createCodeGroup(group),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['codeGroups'] });
      setNewGroup({ name: '', prefix: '' });
      toast.success('Grup eklendi');
    }
  });

  const groupUpdateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => itemsAPI.updateCodeGroup(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['codeGroups'] });
      toast.success('Durum güncellendi');
    }
  });

  const qtyAddMutation = useMutation({
    mutationFn: (qty: any) => itemsAPI.createQuantityType(qty),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quantityTypes'] });
      setNewQtyType({ name: '', abbreviation: '' });
      toast.success('Birim eklendi');
    },
    onError: () => toast.error('Grup eklenirken hata oluştu')
  });

  const qtyUpdateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => itemsAPI.updateQuantityType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quantityTypes'] });
      toast.success('Durum güncellendi');
    },
    onError: () => toast.error('Durum güncellenemedi')
  });

  const qtyDeleteMutation = useMutation({
    mutationFn: (id: number) => itemsAPI.deleteQuantityType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quantityTypes'] });
      toast.success('Birim silindi');
    },
    onError: () => toast.error('Birim silinemedi')
  });

  const itemTypeAddMutation = useMutation({
    mutationFn: (it: any) => itemsAPI.createItemType(it),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itemTypes'] });
      setNewItemType({ name: '', abbreviation: '' });
      toast.success('Ürün türü eklendi');
    },
    onError: () => toast.error('Ürün türü eklenirken hata oluştu')
  });

  const itemTypeUpdateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => itemsAPI.updateItemType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itemTypes'] });
      toast.success('Durum güncellendi');
    },
    onError: () => toast.error('Durum güncellenemedi')
  });

  const itemTypeDeleteMutation = useMutation({
    mutationFn: (id: number) => itemsAPI.deleteItemType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itemTypes'] });
      toast.success('Tür silindi');
    },
    onError: () => toast.error('Tür silinemedi')
  });

  const deptTypeAddMutation = useMutation({
    mutationFn: (dt: any) => departmentsAPI.createType(dt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deptTypes'] });
      setNewDeptType({ name: '', abbreviation: '' });
      toast.success('Departman türü eklendi');
    },
    onError: () => toast.error('Departman türü eklenirken hata oluştu')
  });

  const deptTypeUpdateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => departmentsAPI.updateType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deptTypes'] });
      toast.success('Durum güncellendi');
    },
    onError: () => toast.error('Durum güncellenemedi')
  });

  const deptTypeDeleteMutation = useMutation({
    mutationFn: (id: number) => departmentsAPI.deleteType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deptTypes'] });
      toast.success('Tür silindi');
    },
    onError: () => toast.error('Tür silinemedi')
  });

  // Handlers
  const handleSaveSettings = () => {
    const items = Object.entries(localSettings).map(([settingKey, settingValue]) => ({
      settingKey,
      settingValue: String(settingValue || '')
    }));
    settingsMutation.mutate(items);
  };

  const handleAddCurrency = () => {
    if (!newCurrency.code || !newCurrency.symbol) return toast.error('Eksik bilgi');
    currencyAddMutation.mutate(newCurrency);
  };

  const handleSetDefaultCurrency = (id: number) => {
    currencyDefaultMutation.mutate(id);
  };

  const handleAddGroup = () => {
      if (!newGroup.name || !newGroup.prefix) return toast.error('Eksik bilgi');
      groupAddMutation.mutate(newGroup);
  };

  const toggleGroupState = (id: number, state: number) => {
      groupUpdateMutation.mutate({ id, data: { state: state === 1 ? 0 : 1 } });
  };

  const handleAddQtyType = () => {
    if (!newQtyType.name || !newQtyType.abbreviation) return toast.error('Eksik bilgi');
    qtyAddMutation.mutate(newQtyType);
  };

  const toggleQtyTypeState = (id: number, state: number) => {
    qtyUpdateMutation.mutate({ id, data: { state: state === 1 ? 0 : 1 } });
  };

  const handleDeleteQtyType = async (id: number) => {
    if (await confirmDialog('Bu birimi silmek istediğinize emin misiniz?', true)) {
      qtyDeleteMutation.mutate(id);
    }
  };

  const handleAddItemType = () => {
    if (!newItemType.name || !newItemType.abbreviation) return toast.error('Eksik bilgi');
    itemTypeAddMutation.mutate(newItemType);
  };

  const toggleItemTypeState = (id: number, state: number) => {
    itemTypeUpdateMutation.mutate({ id, data: { state: state === 1 ? 0 : 1 } });
  };

  const handleDeleteItemType = async (id: number) => {
    if (await confirmDialog('Bu türü silmek istediğinize emin misiniz?', true)) {
      itemTypeDeleteMutation.mutate(id);
    }
  };

  const handleAddDeptType = () => {
    if (!newDeptType.name || !newDeptType.abbreviation) return toast.error('Eksik bilgi');
    deptTypeAddMutation.mutate(newDeptType);
  };

  const toggleDeptTypeState = (id: number, state: number) => {
    deptTypeUpdateMutation.mutate({ id, data: { state: state === 1 ? 0 : 1 } });
  };

  const handleDeleteDeptType = async (id: number) => {
    if (await confirmDialog('Bu türü silmek istediğinize emin misiniz?', true)) {
      deptTypeDeleteMutation.mutate(id);
    }
  };

  if (isLoading) return <div className="page-container"><div className="spinner" /></div>;

  const tabs = [
    { id: 'general', icon: <FiHome />, label: 'Şirket Profili' },
    { id: 'currencies', icon: <FiDollarSign />, label: 'Para Birimleri' },
    { id: 'item-groups', icon: <FiLayers />, label: 'Kod Grupları' },
    { id: 'item-types', icon: <FiZap />, label: 'Ürün Türleri' },
    { id: 'quantity-types', icon: <FiActivity />, label: 'Birimler' },
    { id: 'dept-types', icon: <FiBriefcase />, label: 'Departmanlar' },
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
            <FiSettings /> SİSTEM MİMARİSİ
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--on-surface)' }}>
            Ermay <span style={{ color: 'var(--primary)' }}>Konfigürasyonları</span>
          </h1>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '40px', alignItems: 'start' }}>
        
        {/* 🟠 SIDEBAR NAVIGATION */}
        <div className="glass-panel" style={{ padding: '12px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {tabs.map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              style={{
                width: '100%', justifyContent: 'flex-start', padding: '16px 20px', borderRadius: '16px',
                border: 'none', background: activeTab === tab.id ? 'var(--primary-glow)' : 'transparent',
                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: activeTab === tab.id ? 800 : 700,
                display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', transition: '0.2s',
                fontSize: '14px'
              }}
            >
              <span style={{ fontSize: '20px' }}>{tab.icon}</span>
              {tab.label}
              {activeTab === tab.id && <div style={{ marginLeft: 'auto', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }} />}
            </button>
          ))}
        </div>

        {/* 🟡 CONTENT AREA */}
        <div className="glass-panel" style={{ padding: '48px', borderRadius: '32px', background: 'white' }}>
          
          {activeTab === 'general' && (
            <div className="animate-in">
              <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '32px', color: 'var(--on-surface)' }}>Genel Şirket Bilgileri</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>RESMİ ŞİRKET ADI</label>
                  <input className="uppercase-input" style={{ height: '52px' }} value={localSettings.company_name || ''} onChange={e => setLocalSettings({...localSettings, company_name: e.target.value.toLocaleUpperCase('tr-TR')})} />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>VERGİ KİMLİK NUMARASI</label>
                  <input style={{ height: '52px' }} value={localSettings.tax_number || ''} onChange={e => setLocalSettings({...localSettings, tax_number: e.target.value.replace(/\D/g, '')})} />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '24px' }}>
                <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>FATURA VE TEBLİGAT ADRESİ</label>
                <textarea style={{ height: '120px', padding: '16px' }} value={localSettings.company_address || ''} onChange={e => setLocalSettings({...localSettings, company_address: e.target.value.toLocaleUpperCase('tr-TR')})} />
              </div>
              <button className="btn btn-primary" style={{ marginTop: '32px', height: '52px', padding: '0 32px' }} onClick={handleSaveSettings}>
                <FiSave style={{ marginRight: '10px' }} /> AYARLARI GÜNCELLE
              </button>
            </div>
          )}

          {activeTab === 'currencies' && (
            <div className="animate-in">
              <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '32px', color: 'var(--on-surface)' }}>Para Birimi Yönetimi</h3>
              <DataTable<any>
                data={sortedCurrencies}
                sortConfigs={currSort}
                onSort={toggleCurrSort}
                columns={[
                  { 
                    header: 'Kod', 
                    accessor: (c) => <div style={{ fontWeight: 900, color: 'var(--primary)', letterSpacing: '1px' }}>{c.code}</div>, 
                    sortKey: 'code' 
                  },
                  { header: 'Sembol', accessor: (c) => <span style={{ fontWeight: 800, padding: '4px 10px', background: 'var(--surface-container)', borderRadius: '8px' }}>{c.symbol}</span> },
                  { header: 'Birim Adı', accessor: (c) => <div style={{ fontWeight: 700 }}>{c.name}</div>, sortKey: 'name' },
                  { 
                    header: 'Durum', 
                    accessor: (c) => c.isDefault ? (
                      <span style={{ fontSize: '10px', fontWeight: 900, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FiCheckCircle /> VARSAYILAN
                      </span>
                    ) : (
                      <button className="btn btn-secondary circle small" onClick={() => handleSetDefaultCurrency(c.id)} title="Varsayılan Yap">
                        <FiStar />
                      </button>
                    )
                  }
                ]}
                getRowKey={(c) => c.id}
                onDelete={(c) => !c.isDefault ? currencyDeleteMutation.mutate(c.id) : null}
              />

              <div style={{ 
                marginTop: '32px', display: 'grid', gridTemplateColumns: '120px 100px 1fr auto', gap: '16px', 
                background: 'var(--surface-container-low)', padding: '20px', borderRadius: '20px', border: '1px dashed var(--border)'
              }}>
                <input placeholder="USD" className="search-bar" value={newCurrency.code} onChange={e => setNewCurrency({...newCurrency, code: e.target.value.toUpperCase()})} />
                <input placeholder="$" className="search-bar" value={newCurrency.symbol} onChange={e => setNewCurrency({...newCurrency, symbol: e.target.value})} />
                <input placeholder="DOLAR" className="search-bar" value={newCurrency.name} onChange={e => setNewCurrency({...newCurrency, name: e.target.value.toLocaleUpperCase('tr-TR')})} />
                <button className="btn btn-primary circle" onClick={handleAddCurrency}><FiPlus size={20} /></button>
              </div>
            </div>
          )}

          {activeTab === 'item-groups' && (
            <div className="animate-in">
              <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '32px', color: 'var(--on-surface)' }}>Ürün Kod Grupları</h3>
              <DataTable<any>
                data={sortedGroups}
                sortConfigs={groupSort}
                onSort={toggleGroupSort}
                columns={[
                  { header: 'Grup Adı', accessor: (g) => <div style={{ fontWeight: 800 }}>{g.name}</div>, sortKey: 'name' },
                  { header: 'Ön Ek', accessor: (g) => <span style={{ fontWeight: 900, color: 'var(--primary)' }}>{g.prefix}</span>, sortKey: 'prefix' },
                  { 
                    header: 'Durum', 
                    accessor: (g) => (
                      <span style={{ 
                        fontSize: '10px', fontWeight: 900, 
                        color: g.state === 1 ? 'var(--success)' : 'var(--text-muted)',
                        background: g.state === 1 ? 'var(--success-glow)' : 'var(--surface-container)',
                        padding: '4px 8px', borderRadius: '6px'
                      }}>
                        {g.state === 1 ? 'AKTİF' : 'PASİF'}
                      </span>
                    ) 
                  }
                ]}
                getRowKey={(g) => g.id}
                onArchive={(g) => g.state === 1 ? toggleGroupState(g.id, g.state) : null}
                onRestore={(g) => g.state === 0 ? toggleGroupState(g.id, g.state) : null}
              />
              <div style={{ 
                marginTop: '32px', display: 'grid', gridTemplateColumns: '1fr 150px auto', gap: '16px', 
                background: 'var(--surface-container-low)', padding: '20px', borderRadius: '20px', border: '1px dashed var(--border)'
              }}>
                <input placeholder="Grup İsmi (Örn: MOBİLYA)" className="search-bar" value={newGroup.name} onChange={e => setNewGroup({...newGroup, name: e.target.value.toLocaleUpperCase('tr-TR')})} />
                <input placeholder="KOD (Örn: MOB)" className="search-bar" value={newGroup.prefix} onChange={e => setNewGroup({...newGroup, prefix: e.target.value.toUpperCase()})} />
                <button className="btn btn-primary circle" onClick={handleAddGroup}><FiPlus size={20} /></button>
              </div>
            </div>
          )}

          {['item-types', 'quantity-types', 'dept-types'].map(tabId => tabId === activeTab && (
            <div key={tabId} className="animate-in">
              <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '32px', color: 'var(--on-surface)' }}>
                {tabId === 'item-types' ? 'Ürün Türleri' : tabId === 'quantity-types' ? 'Ölçü Birimleri' : 'Departman Türleri'}
              </h3>
              <DataTable<any>
                data={tabId === 'item-types' ? sortedItemTypes : tabId === 'quantity-types' ? sortedQty : sortedDeptTypes}
                sortConfigs={tabId === 'item-types' ? itSort : tabId === 'quantity-types' ? qtySort : dtSort}
                onSort={tabId === 'item-types' ? toggleItSort : tabId === 'quantity-types' ? toggleQtySort : toggleDtSort}
                columns={[
                  { 
                    header: 'İsim / Tanım', 
                    accessor: (t) => (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800 }}>
                        {t.name}
                        {tabId === 'quantity-types' && ['ADET', 'KG', 'METRE', 'LİTRE'].includes(t.abbreviation?.toUpperCase()) && <FiLock size={12} color="var(--text-muted)" />}
                      </div>
                    ), 
                    sortKey: 'name' 
                  },
                  { header: 'Kısaltma', accessor: (t) => <span style={{ fontWeight: 900, color: 'var(--primary)' }}>{t.abbreviation}</span>, sortKey: 'abbreviation' }
                ]}
                getRowKey={(t) => t.id}
                onArchive={(t) => {
                  if (tabId === 'item-types') toggleItemTypeState(t.id, t.state);
                  else if (tabId === 'quantity-types') toggleQtyTypeState(t.id, t.state);
                  else toggleDeptTypeState(t.id, t.state);
                }}
                onDelete={(t) => {
                  if (tabId === 'item-types') handleDeleteItemType(t.id);
                  else if (tabId === 'quantity-types') {
                    if (!['ADET', 'KG', 'METRE', 'LİTRE'].includes(t.abbreviation?.toUpperCase())) handleDeleteQtyType(t.id);
                  } else handleDeleteDeptType(t.id);
                }}
              />
              <div style={{ 
                marginTop: '32px', display: 'grid', gridTemplateColumns: '1fr 120px auto', gap: '16px', 
                background: 'var(--surface-container-low)', padding: '20px', borderRadius: '20px', border: '1px dashed var(--border)'
              }}>
                <input 
                  placeholder="İsim" className="search-bar" 
                  value={tabId === 'item-types' ? newItemType.name : tabId === 'quantity-types' ? newQtyType.name : newDeptType.name} 
                  onChange={e => {
                    const val = e.target.value.toLocaleUpperCase('tr-TR');
                    if (tabId === 'item-types') setNewItemType({...newItemType, name: val});
                    else if (tabId === 'quantity-types') setNewQtyType({...newQtyType, name: val});
                    else setNewDeptType({...newDeptType, name: val});
                  }} 
                />
                <input 
                  placeholder="Kıs" className="search-bar" 
                  value={tabId === 'item-types' ? newItemType.abbreviation : tabId === 'quantity-types' ? newQtyType.abbreviation : newDeptType.abbreviation} 
                  onChange={e => {
                    const val = e.target.value.toUpperCase();
                    if (tabId === 'item-types') setNewItemType({...newItemType, abbreviation: val});
                    else if (tabId === 'quantity-types') setNewQtyType({...newQtyType, abbreviation: val});
                    else setNewDeptType({...newDeptType, abbreviation: val});
                  }} 
                />
                <button className="btn btn-primary circle" onClick={() => {
                  if (tabId === 'item-types') handleAddItemType();
                  else if (tabId === 'quantity-types') handleAddQtyType();
                  else handleAddDeptType();
                }}><FiPlus size={20} /></button>
              </div>
            </div>
          ))}

        </div>
      </div>
    </div>
  );
}