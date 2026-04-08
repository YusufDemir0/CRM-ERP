import React, { useState, useEffect } from 'react';
import { FiRefreshCw, FiInfo, FiAlertTriangle, FiXCircle, FiCheckCircle } from 'react-icons/fi';
import { logsAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface SystemLog {
  id: number;
  userId: number;
  username: string;
  fullName: string;
  action: string;
  module: string;
  tag: string;
  details: string;
  ipAddress: string;
  createdAt: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterModule, setFilterModule] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await logsAPI.getAll({ limit: 200 }); // fetch last 200 logs
      setLogs(res.data);
    } catch (err: any) {
      toast.error('Loglar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getTagIcon = (tag: string) => {
    switch(tag) {
      case 'WARNING': return <FiAlertTriangle color="#f59e0b" />;
      case 'ERROR':   return <FiXCircle color="#ef4444" />;
      case 'CRITICAL':return <FiXCircle color="#b91c1c" />;
      case 'SUCCESS': return <FiCheckCircle color="#10b981" />;
      default:        return <FiInfo color="#3b82f6" />;
    }
  };

  const getTagStyle = (tag: string) => {
    switch(tag) {
      case 'WARNING': return { background: '#fef3c7', color: '#d97706' };
      case 'ERROR':   return { background: '#fee2e2', color: '#b91c1c' };
      case 'CRITICAL':return { background: '#7f1d1d', color: '#fca5a5' };
      case 'SUCCESS': return { background: '#d1fae5', color: '#047857' };
      default:        return { background: '#dbeafe', color: '#1d4ed8' };
    }
  };

  const filteredLogs = logs.filter(l => !filterModule || l.module === filterModule);
  // Get unique modules for filter
  const modules = Array.from(new Set(logs.map(l => l.module).filter(Boolean)));

  if (loading) return <div className="p-4">Yükleniyor...</div>;

  return (
    <div className="module-page">
      <div className="module-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>Sistem Logları (Audit)</h1>
          <button className="btn-icon" onClick={fetchLogs} title="Yenile">
            <FiRefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className="data-table-container">
        <div className="table-controls" style={{ marginBottom: '15px' }}>
          <select 
            className="uppercase-input" 
            style={{ width: '250px', appearance: 'none' }}
            value={filterModule}
            onChange={e => setFilterModule(e.target.value)}
          >
            <option value="">TÜM MODÜLLER DÖKÜMÜ</option>
            {modules.map(m => (
              <option key={m} value={m}>{m.toUpperCase()}</option>
            ))}
          </select>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '150px' }}>TARİH</th>
              <th style={{ width: '100px' }}>TÜR</th>
              <th style={{ width: '150px' }}>KULLANICI</th>
              <th style={{ width: '120px' }}>MODÜL</th>
              <th style={{ width: '150px' }}>İŞLEM</th>
              <th>DETAY / IP</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  Kayıt bulunamadı.
                </td>
              </tr>
            )}
            {filteredLogs.map(log => (
              <tr key={log.id}>
                <td>{new Date(log.createdAt).toLocaleString('tr-TR')}</td>
                <td>
                  <span className="status-badge" style={{ ...getTagStyle(log.tag), display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    {getTagIcon(log.tag)} {log.tag}
                  </span>
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{log.fullName || log.username || 'SİSTEM'}</div>
                </td>
                <td>
                  <span style={{ fontSize: '12px', background: '#e5e7eb', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                    {log.module?.toUpperCase() || '-'}
                  </span>
                </td>
                <td style={{ fontWeight: 500 }}>{log.action}</td>
                <td style={{ fontSize: '13px' }}>
                  <div style={{ color: '#4b5563' }}>{log.details || '-'}</div>
                  {log.ipAddress && <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>IP: {log.ipAddress}</div>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
