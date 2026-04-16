import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsAPI, partiesAPI, accountsAPI, currenciesAPI } from '../../services/api';
import { 
  FiX, FiArrowUpRight, FiArrowDownLeft, FiInfo, FiSlash, 
  FiDollarSign, FiPlus, FiSearch, FiFilter, FiCalendar, FiCreditCard, FiTrash2
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { confirmDialog } from '../../utils/confirmDialog';
import { getTodayString, formatDisplayDate } from '../../utils/date.helper';
import { Transaction, Party, Account, Currency } from '../../types';
import { DataTable, Column } from '../../components/common/DataTable';
import { PaginationControls } from '../../components/common/PaginationControls';
import { Decimal } from 'decimal.js';
import { useSort } from '../../hooks/useSort';

export default function TransactionsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sort, setSort] = useState<{ key: string; order: 'ASC' | 'DESC' }>({ key: 'date', order: 'DESC' });
  const [filters, setFilters] = useState<Record<string, any>>({});

  // ────── QUERIES ──────

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ['transactions', page, limit, debouncedSearch, sort, filters],
    queryFn: async () => {
      const res = await transactionsAPI.getAll({
        page,
        limit,
        search: debouncedSearch,
        sortBy: sort.key,
        sortOrder: sort.order,
        ...filters
      });
      return res.data;
    }
  });

  const { data: parties = [] } = useQuery({
    queryKey: ['parties', 'active-lookup'],
    queryFn: async () => {
      const res = await partiesAPI.getAll({ state: 1, limit: 1000 });
      return res.data.data;
    }
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts', 'active-lookup'],
    queryFn: async () => {
      const res = await accountsAPI.getAll({ state: 1, limit: 100 });
      return res.data.data;
    }
  });

  const { data: currencies = [] } = useQuery({
    queryKey: ['currencies'],
    queryFn: async () => {
      const res = await currenciesAPI.getAll();
      return res.data || [];
    }
  });

  const transactions = txData?.data || [];
  const paginationMeta = txData?.meta;
  const loading = txLoading;

  const { sortedData, sortConfigs, toggleSort } = useSort<Transaction>(
    transactions, 
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const [formData, setFormData] = useState({
    type: 'in' as 'in' | 'out', 
    partyId: '',
    commercialAccountId: '',
    amount: 0,
    date: getTodayString(),
    description: '',
    referenceType: '',
    referenceId: '',
    currencyId: '',
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => transactionsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      setIsModalOpen(false);
      toast.success("İşlem başarıyla kaydedildi.");
    },
    onError: () => toast.error("İşlem kaydedilirken bir hata oluştu.")
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => transactionsAPI.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      toast.success("İşlem iptal edildi.");
    },
    onError: () => toast.error("İşlem iptal edilirken bir hata oluştu.")
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.partyId || !formData.commercialAccountId || formData.amount <= 0) {
      toast.error("Lütfen tüm zorunlu alanları doldurun.");
      return;
    }
    
    createMutation.mutate({
      ...formData,
      partyId: Number(formData.partyId),
      commercialAccountId: Number(formData.commercialAccountId),
      amount: new Decimal(formData.amount).toNumber(),
      currencyId: Number(formData.currencyId),
      referenceId: formData.referenceId ? Number(formData.referenceId) : undefined,
    });
  };

  const handleCancelTransaction = async (id: number) => {
    const confirmed = await confirmDialog("Bu işlemi iptal etmek (ters kayıt oluşturmak) istediğinize emin misiniz?", true);
    if (confirmed) {
      cancelMutation.mutate(id);
    }
  };

  const columns: Column<Transaction>[] = [
    { 
      header: 'İŞLEM / CARİ', 
      accessor: (tx) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '40px', height: '40px', borderRadius: '12px', 
            background: tx.type === 'in' ? 'var(--success-glow)' : 'var(--error-glow)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: tx.type === 'in' ? 'var(--success)' : 'var(--error)',
            fontSize: '18px'
          }}>
            {tx.type === 'in' ? <FiArrowDownLeft /> : <FiArrowUpRight />}
          </div>
          <div>
            <div style={{ fontWeight: 800, color: 'var(--on-surface)', fontSize: '14px' }}>{tx.party?.name || 'BELİRSİZ CARİ'}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>{tx.code} • {formatDisplayDate(tx.date)}</div>
          </div>
        </div>
      ),
      sortKey: 'code'
    },
    { 
      header: 'KASA / BANKA', 
      accessor: (tx) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiCreditCard size={14} color="var(--primary)" />
          <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--on-surface-variant)' }}>{tx.commercialAccount?.name}</span>
        </div>
      ),
      sortKey: 'commercialAccount.name'
    },
    { 
      header: 'FİNANSAL TUTAR', 
      accessor: (tx) => {
        const amount = new Decimal(tx.amount || 0);
        return (
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span className="tabular-nums" style={{ 
              fontWeight: 900, 
              fontSize: '15px',
              color: tx.type === 'in' ? 'var(--success)' : 'var(--error)',
              letterSpacing: '-0.5px'
            }}>
              {tx.type === 'in' ? '+' : '-'}{amount.toNumber().toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {tx.currency?.symbol || '₺'}
            </span>
            <span style={{ fontSize: '10px', fontWeight: 800, opacity: 0.6, color: tx.type === 'in' ? 'var(--success)' : 'var(--error)' }}>
              {tx.type === 'in' ? 'TAHSİLAT' : 'ÖDEME'}
            </span>
          </div>
        );
      },
      sortKey: 'amount',
      className: 'text-right'
    },
    { 
      header: 'DURUM', 
      accessor: (tx) => (
        <span style={{ 
          fontSize: '10px', fontWeight: 800, 
          padding: '4px 10px', borderRadius: '8px',
          background: tx.status === 'completed' ? 'var(--surface-container)' : 'var(--error-glow)',
          color: tx.status === 'completed' ? 'var(--text-muted)' : 'var(--error)',
          textTransform: 'uppercase'
        }}>
          {tx.status === 'completed' ? 'TAMAMLANDI' : 'İPTAL EDİLDİ'}
        </span>
      ),
      sortKey: 'status'
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
            <FiDollarSign /> NAKİT AKIŞI & FİNANS
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--on-surface)' }}>
            Kasa & <span style={{ color: 'var(--primary)' }}>Banka Hareketleri</span>
          </h1>
        </div>
        
        <button className="btn btn-primary" style={{ height: '44px', boxShadow: '0 10px 20px var(--primary-glow)' }} onClick={() => {
          setFormData({ type: 'in', partyId: '', commercialAccountId: '', amount: 0, date: getTodayString(), description: '', referenceType: '', referenceId: '', currencyId: String(currencies.find((c: Currency) => c.isDefault === 1)?.id || '') });
          setIsModalOpen(true);
        }}>
          <FiPlus size={18} /> Yeni İşlem Ekle
        </button>
      </div>

      {/* 🟠 SEARCH & FILTERS */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: '24px', display: 'flex', gap: '20px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <FiSearch style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="İşlem no, cari adı veya açıklama ile ara..." 
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
        <DataTable<Transaction>
          data={sortedData}
          columns={columns}
          isLoading={loading}
          sortConfigs={sortConfigs}
          onSort={toggleSort}
          getRowKey={(tx) => tx.id}
          onDelete={tx => tx.status !== 'cancelled' ? handleCancelTransaction(tx.id) : undefined}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <PaginationControls 
            meta={paginationMeta || { total: 0, page: 1, limit: 20, totalPages: 0 }} 
            onPageChange={setPage} 
            onLimitChange={setLimit} 
            loading={loading}
          />
        </div>
      </div>

      {/* 🟢 TRANSACTION MODAL */}
      {isModalOpen && (
        <div className="loader-overlay" style={{ alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', background: 'rgba(15, 23, 42, 0.4)' }}>
          <div className="glass-panel" style={{ maxWidth: '600px', width: '95%', padding: '40px', borderRadius: '32px', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--on-surface)' }}>Finansal Hareket Ekle</h2>
              <button className="btn-icon circle" onClick={() => setIsModalOpen(false)}><FiX size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>İŞLEM TİPİ</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as 'in'|'out'})} style={{ height: '48px' }}>
                    <option value="in">Tahsilat (Para Girişi)</option>
                    <option value="out">Ödeme (Para Çıkışı)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>İŞLEM TARİHİ</label>
                  <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} style={{ height: '48px' }} />
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>CARİ HESAP</label>
                <select required value={formData.partyId} onChange={e => setFormData({...formData, partyId: e.target.value})} style={{ height: '48px' }}>
                  <option value="">Seçiniz...</option>
                  {parties.map((p: Party) => {
                    const balance = new Decimal(p.balance || 0);
                    return <option key={p.id} value={p.id}>{p.name} [{balance.toNumber().toLocaleString()} {p.currency?.symbol}]</option>;
                  })}
                </select>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>KASA / BANKA HESABI</label>
                <select required value={formData.commercialAccountId} onChange={e => setFormData({...formData, commercialAccountId: e.target.value})} style={{ height: '48px' }}>
                  <option value="">Seçiniz...</option>
                  {accounts.map((a: Account) => <option key={a.id} value={a.id}>{a.name} [{a.bankName || 'Kasa'}]</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>TUTAR</label>
                  <input type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} style={{ height: '48px', fontSize: '18px', fontWeight: 800 }} />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>DÖVİZ</label>
                  <select value={formData.currencyId} onChange={e => setFormData({...formData, currencyId: e.target.value})} style={{ height: '48px' }}>
                    {currencies.map((c: Currency) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>AÇIKLAMA</label>
                <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ padding: '12px' }} />
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '52px', fontSize: '15px' }}>İŞLEMİ KAYDET</button>
                <button type="button" className="btn btn-secondary" style={{ flex: 1, height: '52px', fontSize: '15px' }} onClick={() => setIsModalOpen(false)}>VAZGEÇ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}