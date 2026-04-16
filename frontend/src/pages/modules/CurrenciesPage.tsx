import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { currenciesAPI } from '../../services/api';
import { 
  FiX, FiStar, FiEdit2, FiPlus, FiFilter, 
  FiDollarSign, FiGlobe, FiTrendingUp, FiCheckCircle
} from 'react-icons/fi';
import { Currency } from '../../types';
import toast from 'react-hot-toast';
import { Decimal } from 'decimal.js';
import { DataTable, Column } from '../../components/common/DataTable';
import { useSort } from '../../hooks/useSort';

export function CurrenciesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ code: '', name: '', symbol: '', exchangeRate: 1, isDefault: 0 });

  const { data: currenciesData, isLoading: loading } = useQuery({
    queryKey: ['currencies'],
    queryFn: async () => {
      const res = await currenciesAPI.getAll();
      return res.data || [];
    }
  });

  const currencies = currenciesData || [];
  
  const { sortedData, sortConfigs, toggleSort } = useSort(currencies);

  const mutation = useMutation({
    mutationFn: async ({ id, data }: { id: number | null; data: any }) => {
      if (id) return currenciesAPI.update(id, data);
      return currenciesAPI.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      setIsModalOpen(false);
      toast.success(editingId ? "Güncellendi" : "Kaydedildi");
    },
    onError: () => toast.error("Hata oluştu")
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      exchangeRate: new Decimal(formData.exchangeRate).toString(),
      isDefault: Number(formData.isDefault)
    };
    mutation.mutate({ id: editingId, data: payload });
  };

  const handleEdit = (c: Currency) => {
    setEditingId(c.id);
    setFormData({ code: c.code, name: c.name, symbol: c.symbol, exchangeRate: Number(c.exchangeRate), isDefault: c.isDefault || 0 });
    setIsModalOpen(true);
  };

  const columns: Column<Currency>[] = [
    { 
      header: 'PARA BİRİMİ', 
      accessor: (c) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '40px', height: '40px', borderRadius: '12px', 
            background: 'var(--primary-glow)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--primary)',
            fontSize: '18px'
          }}>
            <FiDollarSign />
          </div>
          <div>
            <div style={{ fontWeight: 800, color: 'var(--on-surface)', fontSize: '14px' }}>{c.name}</div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-muted)' }}>{c.code}</span>
              {c.isDefault === 1 && (
                <span style={{ 
                  fontSize: '9px', fontWeight: 900, color: 'var(--success)', 
                  display: 'inline-flex', alignItems: 'center', gap: '2px' 
                }}>
                  • <FiStar size={8} /> ANA BİRİM
                </span>
              )}
            </div>
          </div>
        </div>
      ),
      sortKey: 'code'
    },
    { 
      header: 'SEMBOL', 
      accessor: (c) => (
        <div style={{ 
          padding: '4px 12px', borderRadius: '8px', 
          background: 'var(--surface-container)', color: 'var(--on-surface)',
          fontSize: '13px', fontWeight: 900
        }}>
          {c.symbol}
        </div>
      ),
      sortKey: 'symbol'
    },
    { 
      header: 'GÜNCEL KUR (1 Birim)', 
      className: 'text-right',
      accessor: (c) => (
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span className="tabular-nums" style={{ 
            fontWeight: 900, 
            fontSize: '15px',
            color: 'var(--primary)',
            letterSpacing: '-0.5px'
          }}>
            {new Decimal(c.exchangeRate || 0).toNumber().toLocaleString('tr-TR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} ₺
          </span>
          <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            MB KUR KARŞILIĞI
          </span>
        </div>
      ),
      sortKey: 'exchangeRate'
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
            <FiTrendingUp /> EKONOMİK TANIMLAMALAR
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--on-surface)' }}>
            Para Birimleri <span style={{ color: 'var(--primary)' }}>& Kurlar</span>
          </h1>
        </div>
        
        <button className="btn btn-primary" style={{ height: '44px', boxShadow: '0 10px 20px var(--primary-glow)' }} onClick={() => {
          setEditingId(null); 
          setFormData({ code: '', name: '', symbol: '', exchangeRate: 1, isDefault: 0 }); 
          setIsModalOpen(true);
        }}>
          <FiPlus size={18} /> Yeni Birim Tanımla
        </button>
      </div>

      {/* 🟡 DATA TABLE SECTION */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <DataTable<Currency>
          data={sortedData}
          columns={columns}
          isLoading={loading}
          sortConfigs={sortConfigs}
          onSort={toggleSort}
          getRowKey={(c) => c.id}
          onEdit={handleEdit}
        />
      </div>

      {/* 🟢 MODAL SECTION */}
      {isModalOpen && (
        <div className="loader-overlay" style={{ alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', background: 'rgba(15, 23, 42, 0.4)' }}>
          <div className="glass-panel" style={{ maxWidth: '500px', width: '95%', padding: '40px', borderRadius: '32px', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--on-surface)' }}>
                {editingId ? 'Birim Güncelle' : 'Yeni Para Birimi'}
              </h2>
              <button className="btn-icon circle" onClick={() => setIsModalOpen(false)}><FiX size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>DÖVİZ KODU</label>
                  <input required className="uppercase-input" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toLocaleUpperCase('tr-TR')})} placeholder="USD" style={{ height: '48px' }} />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>SEMBOL</label>
                  <input required className="uppercase-input" value={formData.symbol} onChange={e => setFormData({...formData, symbol: e.target.value})} placeholder="$" style={{ height: '48px' }} />
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>BİRİM ADI</label>
                <input required className="uppercase-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toLocaleUpperCase('tr-TR')})} placeholder="AMERİKAN DOLARI" style={{ height: '48px' }} />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>KUR DEĞERİ (1 Birim = X TL)</label>
                <input type="number" step="0.0001" required value={formData.exchangeRate} onChange={e => setFormData({...formData, exchangeRate: Number(e.target.value)})} disabled={formData.isDefault === 1} style={{ height: '56px', fontSize: '20px', fontWeight: 900, color: 'var(--primary)' }} />
              </div>
              
              <div style={{ 
                background: 'var(--surface-container-low)', padding: '16px', borderRadius: '16px',
                display: 'flex', alignItems: 'center', gap: '12px', border: '1px dashed var(--border)' 
              }}>
                <input 
                  type="checkbox" 
                  id="isDefault"
                  checked={formData.isDefault === 1} 
                  onChange={e => setFormData({...formData, isDefault: e.target.checked ? 1 : 0, exchangeRate: e.target.checked ? 1 : formData.exchangeRate})} 
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <label htmlFor="isDefault" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--on-surface-variant)', cursor: 'pointer' }}>
                  Sistem Ana Para Birimi Olarak Ayarla
                </label>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '52px', fontSize: '15px' }}>
                  {editingId ? 'GÜNCELLEMELERİ KAYDET' : 'PARA BİRİMİNİ EKLE'}
                </button>
                <button type="button" className="btn btn-secondary" style={{ flex: 0.6, height: '52px', background: 'white' }} onClick={() => setIsModalOpen(false)}>VAZGEÇ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}