import { ReactNode, useState } from 'react';
import { FiSearch, FiChevronLeft, FiChevronRight, FiFilter } from 'react-icons/fi';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T, index: number) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  total?: number;
  page?: number;
  limit?: number;
  search?: string;
  onSearchChange?: (val: string) => void;
  onPageChange?: (page: number) => void;
  actions?: ReactNode;
  loading?: boolean;
  emptyMessage?: string;
}

export default function DataTable<T extends Record<string, any>>({
  columns, data, total = 0, page = 1, limit = 20,
  search, onSearchChange, onPageChange, actions, loading, emptyMessage,
}: DataTableProps<T>) {
  const [showFilters, setShowFilters] = useState(false);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

  const totalPages = Math.ceil(total / limit);

  // Local filtering for all-column search and explicit column filters
  let filteredData = data;
  if (search) {
    const s = search.toLowerCase();
    filteredData = filteredData.filter(item => 
      columns.some(col => String(item[col.key] || '').toLowerCase().includes(s))
    );
  }
  Object.entries(columnFilters).forEach(([key, val]) => {
    if (val) {
      filteredData = filteredData.filter(item => String(item[key] || '').toLowerCase().includes(val.toLowerCase()));
    }
  });

  return (
    <div className="table-container" style={{ background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)' }}>
      <div className="table-toolbar" style={{ display: 'flex', justifyContent: 'space-between', padding: 16, borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: 12 }}>
          {onSearchChange ? (
            <div className="table-search" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <FiSearch style={{ position: 'absolute', left: 12, color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder="Ara..."
                style={{ padding: '8px 12px 8px 36px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)' }}
                value={search || ''}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          ) : <div />}
          <button className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '8px 12px' }} onClick={() => setShowFilters(!showFilters)}>
            <FiFilter /> Filtrele
          </button>
        </div>
        {actions && <div className="page-header-actions">{actions}</div>}
      </div>

      {loading ? (
        <div className="page-loading" style={{ padding: 48, textAlign: 'center' }}><div className="spinner" /></div>
      ) : filteredData.length === 0 ? (
        <div className="empty-state" style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
          <p>{emptyMessage || 'Kayıt bulunamadı'}</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--background)' }}>
                {columns.map((col) => (
                  <th key={col.key} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {col.label}
                  </th>
                ))}
              </tr>
              {showFilters && (
                <tr style={{ background: 'var(--background)' }}>
                  {columns.map((col) => (
                    <th key={col.key} style={{ padding: '0 16px 12px', borderBottom: '1px solid var(--border)' }}>
                      {col.key !== 'actions' && col.key !== '_seq' ? (
                        <input 
                          type="text" 
                          placeholder="Filtre..." 
                          style={{ width: '100%', padding: '4px 8px', fontSize: 12, borderRadius: 4, border: '1px solid var(--border)' }}
                          value={columnFilters[col.key] || ''}
                          onChange={(e) => setColumnFilters({...columnFilters, [col.key]: e.target.value})}
                        />
                      ) : null}
                    </th>
                  ))}
                </tr>
              )}
            </thead>
            <tbody>
              {filteredData.map((item, idx) => (
                <tr key={item.id || idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  {columns.map((col) => (
                    <td key={col.key} style={{ padding: '12px 16px', fontSize: 14 }}>
                      {col.render ? col.render(item, idx) : item[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > limit && (
        <div className="table-pagination" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderTop: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 13 }}>
          <span>{total} kayıttan {(page - 1) * limit + 1}–{Math.min(page * limit, total)} arası</span>
          <div className="table-pagination-btns" style={{ display: 'flex', gap: 4 }}>
            <button
              className="btn-icon"
              disabled={page <= 1}
              onClick={() => onPageChange?.(page - 1)}
            >
              <FiChevronLeft />
            </button>
            <button
              className="btn-icon"
              disabled={page >= totalPages}
              onClick={() => onPageChange?.(page + 1)}
            >
              <FiChevronRight />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
