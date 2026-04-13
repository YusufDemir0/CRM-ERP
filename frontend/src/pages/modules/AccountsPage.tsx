import React, { useState, useEffect } from 'react';
import { accountsAPI } from '../../services/api';
import { FiEdit2, FiArchive, FiRefreshCw } from 'react-icons/fi';
import { confirmDialog } from '../../utils/confirmDialog';
import { useQuickCreate } from '../../context/QuickCreateContext';
import toast from 'react-hot-toast';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<'active' | 'passive' | 'all'>('active');
  const { openCreate } = useQuickCreate();

  const fetchData = async () => {
    try {
      const accRes = await accountsAPI.getAll({ search: searchTerm, limit: 100 });
      setAccounts(accRes.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchTerm]);

  const filteredAccounts = accounts.filter(acc => {
    const s = searchTerm.toLowerCase();
    const tabMatch = filterTab === 'all' || (filterTab === 'active' ? acc.state === 1 : acc.state === 0);
    const textMatch = 
      acc.name?.toLowerCase().includes(s) || 
      acc.bankName?.toLowerCase().includes(s) || 
      acc.iban?.toLowerCase().includes(s) ||
      acc.currency?.name?.toLowerCase().includes(s);

    return tabMatch && textMatch;
  });

  const handleFormSuccess = () => {
    fetchData();
    toast.success("Hesap bilgileri kaydedildi.");
  };

  const handleEdit = (acc: any) => {
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
      await accountsAPI.toggleState(id, currentState);
      fetchData();
    }
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ color: 'var(--primary)', marginBottom: '10px' }}>Ticari Hesaplar (Kasa/Banka)</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className={`btn ${filterTab === 'active' ? 'btn-primary' : ''}`} onClick={() => setFilterTab('active')}>Aktifler</button>
            <button className={`btn ${filterTab === 'passive' ? 'btn-primary' : ''}`} onClick={() => setFilterTab('passive')}>Arşiv</button>
            <button className={`btn ${filterTab === 'all' ? 'btn-primary' : ''}`} onClick={() => setFilterTab('all')}>Tümü</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <input 
            type="text" 
            placeholder="Kasa veya Banka Ara..." 
            className="search-bar" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '400px' }}
          />
          <button className="btn btn-primary" onClick={() => {
            openCreate('account', {
              onSuccess: handleFormSuccess
            });
          }}>+ YENİ HESAP</button>
        </div>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>HESAP ADI</th>
              <th>BANKA BİLGİSİ</th>
              <th>IBAN</th>
              <th>KRİTİK LİMİT</th>
              <th>AÇIKLAMA</th>
              <th>İŞLEMLER</th>
            </tr>
          </thead>
          <tbody>
            {filteredAccounts.map((acc) => (
              <tr key={acc.id} style={{ opacity: acc.state === 0 ? 0.6 : 1, background: acc.state === 0 ? 'var(--surface-container-low)' : 'inherit' }}>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <strong>{acc.name}</strong>
                    {acc.state === 0 && <span className="badge" style={{ background: '#94a3b8', color: 'white', alignSelf: 'flex-start', marginTop: '4px' }}>PASİF</span>}
                  </div>
                </td>
                <td>{acc.bankName || '-'}</td>
                <td className="tabular-nums" style={{ fontSize: '12px' }}>{acc.iban || '-'}</td>
                <td className="tabular-nums" style={{ color: acc.criticalLimit < 0 ? 'var(--error)' : 'inherit', fontWeight: 700 }}>
                  {Number(acc.criticalLimit).toLocaleString('tr-TR')} {acc.currency?.symbol || '₺'}
                </td>
                <td style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{acc.description}</td>
                <td style={{ display: 'flex', gap: '5px' }}>
                  <button className="btn-icon" title="Düzenle" onClick={() => handleEdit(acc)}>
                    <FiEdit2 size={16} />
                  </button>
                  <button className="btn-icon" title={acc.state === 1 ? 'Arşivle' : 'Aktif Et'} style={{ color: acc.state === 1 ? 'var(--error)' : 'var(--success)' }} onClick={() => toggleState(acc.id, acc.state)}>
                    {acc.state === 1 ? <FiArchive size={16} /> : <FiRefreshCw size={16} />}
                  </button>
                </td>
              </tr>
            ))}
            {filteredAccounts.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'gray' }}>Kayıt bulunamadı.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}