import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountsAPI } from '../../services/api';
import { 
  FiEdit2, FiArchive, FiRefreshCw, FiSearch, FiCreditCard, 
  FiPlus, FiFilter, FiActivity, FiBriefcase, FiHash
} from 'react-icons/fi';
import { confirmDialog } from '../../utils/confirmDialog';
import { useQuickCreateStore } from '../../store/useQuickCreateStore';
import toast from 'react-hot-toast';
import { Account } from '../../types';
import { DataTable, Column } from '../../components/common/DataTable';
import { useSort } from '../../hooks/useSort';
import { Decimal } from 'decimal.js';
import { PaginationControls } from '../../components/common/PaginationControls';

export default function AccountsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<'active' | 'passive' | 'all'>('active');
  const { openCreate } = useQuickCreateStore();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sort, setSort] = useState<{ key: string; order: 'ASC' | 'DESC' }>({ key: 'name', order: 'ASC' });
  const [filters, setFilters] = useState<Record<string, any>>({});

  const { data: accountsData, isLoading: loading } = useQuery({
    queryKey: ['accounts', page, limit, searchTerm, filterTab, sort, filters],
    queryFn: async () => {
      const res = await accountsAPI.getAll({
        search: searchTerm,
        page,
        limit,
        state: filterTab === 'all' ? undefined : (filterTab === 'active' ? 1 : 0),
        sortBy: sort.key,
        sortOrder: sort.order,
        ...filters
      });
      return res.data;
    }
  });

  const accounts = accountsData?.data || [];
  const paginationMeta = accountsData?.meta || { total: 0, page: 1, limit: 20, totalPages: 0 };

  const { sortedData, sortConfigs, toggleSort } = useSort<Account>(
    accounts, 
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

  const toggleMutation = useMutation({
    mutationFn: ({ id, state }: { id: number; state: number }) => accountsAPI.toggleState(id, state),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success("Durum güncellendi");
    },
    onError: () => toast.error("İşlem başarısız oldu.")
  });

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
    toast.success("Hesap bilgileri kaydedildi.");
  };

  const handleEdit = (acc: Account) => {
    openCreate('account', {
      editingId: acc.id,
      initialData: {
        name: acc.name || '',
        bankName: acc.bankName || '',
        iban: acc.iban || '',
        ibanName: acc.ibanName || '',
        currencyId: acc.currencyId || '',
        criticalLimit: Number(acc.criticalLimit) || 0,
        description: acc.description || ''
      },
      onSuccess: handleFormSuccess
    });
  };

  const toggleState = async (id: number, currentState: number) => {
    const confirmed = await confirmDialog(currentState === 1 ? 'Hesap pasife alınacak (arşivlenecek). Emin misiniz?' : 'Hesap tekrar aktifleştirilecek. Emin misiniz?', currentState === 1);
    if (confirmed) {
      toggleMutation.mutate({ id, state: currentState });
    }
  };

  const columns: Column<Account>[] = [
    { 
      header: 'HESAP BİLGİSİ', 
      accessor: (acc) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '40px', height: '40px', borderRadius: '12px', 
            background: 'var(--primary-glow)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--primary)',
            fontSize: '18px'
          }}>
            <FiCreditCard />
          </div>
          <div>
            <div style={{ fontWeight: 800, color: 'var(--on-surface)', fontSize: '14px' }}>{acc.name}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>{acc.bankName || 'NAKİT KASA'}</div>
          </div>
        </div>
      ),
      sortKey: 'name'
    },
    { 
      header: 'BANKA / ŞUBE', 
      accessor: (acc) => <span style={{ fontWeight: 700, fontSize: '12px', color: 'var(--secondary)', background: 'var(--surface-container)', padding: '4px 10px', borderRadius: '8px' }}>{acc.bankName || 'NAKİT KASA'}</span>,
      sortKey: 'bankName'
    },
    { 
      header: 'IBAN DETAYI', 
      accessor: (acc) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FiHash size={12} color="var(--text-muted)" />
          <span className="tabular-nums" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--on-surface-variant)' }}>{acc.iban || 'BELİRTİLMEMİŞ'}</span>
        </div>
      ),
      sortKey: 'iban'
    },
    { 
      header: 'KRİTİK LİMİT', 
      accessor: (acc) => {
        const limit = new Decimal(acc.criticalLimit || 0);
        return (
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span className="tabular-nums" style={{ 
              fontWeight: 900, 
              fontSize: '15px',
              color: limit.lt(0) ? 'var(--error)' : 'var(--on-surface)',
              letterSpacing: '-0.5px'
            }}>
              {limit.toNumber().toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {acc.currency?.symbol || '₺'}
            </span>
          </div>
        );
      },
      sortKey: 'criticalLimit',
      className: 'text-right'
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
            <FiBriefcase /> FİNANSAL VARLIK YÖNETİMİ
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--on-surface)' }}>
            Kasa & <span style={{ color: 'var(--primary)' }}>Banka Hesapları</span>
          </h1>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ display: 'flex', background: 'var(--surface-container-low)', padding: '4px', borderRadius: '14px', border: '1px solid var(--border)' }}>
            {[
              { id: 'active', label: 'Aktif', icon: <FiActivity /> },
              { id: 'passive', label: 'Arşiv', icon: <FiArchive /> },
              { id: 'all', label: 'Tümü', icon: <FiFilter /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setFilterTab(tab.id as any); setPage(1); }}
                style={{
                  height: '36px', padding: '0 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: '8px', border: 'none', transition: '0.2s',
                  background: filterTab === tab.id ? 'white' : 'transparent',
                  color: filterTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                  boxShadow: filterTab === tab.id ? 'var(--shadow-md)' : 'none',
                  cursor: 'pointer'
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
          <button className="btn btn-primary" style={{ height: '44px', boxShadow: '0 10px 20px var(--primary-glow)' }} onClick={() => {
            openCreate('account', { onSuccess: handleFormSuccess });
          }}>
            <FiPlus size={18} /> Yeni Hesap
          </button>
        </div>
      </div>

      {/* 🟠 SEARCH & FILTERS */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: '24px', display: 'flex', gap: '20px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <FiSearch style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Hesap adı, banka veya IBAN ile hızlı ara..." 
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
        <DataTable<Account>
          data={sortedData}
          columns={columns}
          isLoading={loading}
          sortConfigs={sortConfigs}
          onSort={toggleSort}
          getRowKey={(acc) => acc.id}
          hasState={(acc) => acc.state === 1}
          onEdit={handleEdit}
          onArchive={(acc) => toggleState(acc.id, 1)}
          onRestore={(acc) => toggleState(acc.id, 0)}
          getRowOpacity={(acc) => acc.state === 0 ? 0.5 : 1}
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
    </div>
  );
}