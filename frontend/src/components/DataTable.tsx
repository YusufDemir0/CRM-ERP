import { ReactNode, useState } from 'react';
import { FiSearch, FiChevronLeft, FiChevronRight, FiFilter, FiX, FiArrowUp, FiArrowDown } from 'react-icons/fi';

interface Column<T> {
  key: (keyof T & string) | string; // Supports nested keys like 'party.name'
  label: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  render?: (item: T, index: number) => ReactNode;
}

interface SortConfig {
  key: string;
  order: 'ASC' | 'DESC';
}

interface FilterOption {
  label: string;
  value: string | number;
}

interface FilterConfig {
  key: string;
  label: string;
  type: 'text' | 'select' | 'checkbox' | 'date' | 'range';
  options?: FilterOption[];
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  total?: number;
  page?: number;
  limit?: number;
  search?: string;
  sort?: SortConfig;
  filterConfig?: FilterConfig[];
  onSearchChange?: (val: string) => void;
  onPageChange?: (page: number) => void;
  onSort?: (config: SortConfig) => void;
  onFilterChange?: (filters: Record<string, string | number | (string | number)[]>) => void;
  actions?: ReactNode;
  loading?: boolean;
  emptyMessage?: string;
  hideToolbar?: boolean;
}

export default function DataTable<T extends { id: string | number }>({
  columns, data, total = 0, page = 1, limit = 20,
  search, sort, filterConfig, onSearchChange, onPageChange, onSort, onFilterChange,
  actions, loading, emptyMessage, hideToolbar,
}: DataTableProps<T>) {
  const [showFilters, setShowFilters] = useState(false);
  const [columnFilters, setColumnFilters] = useState<Record<string, string | number | (string | number)[]>>({});

  // Typed accessor supporting nested keys like 'party.name'
  const getNestedValue = (obj: T, key: string): unknown => {
    return key.split('.').reduce<unknown>((acc, part) => {
      if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[part];
      return undefined;
    }, obj);
  };

  const visibleColumns = columns.filter(c => c.key !== 'id');
  const totalPages = Math.ceil(total / limit);

  const handleSort = (key: string) => {
    if (!onSort) return;
    const order = sort?.key === key && sort?.order === 'ASC' ? 'DESC' : 'ASC';
    onSort({ key, order });
  };

  const handleColumnFilterChange = (key: string, value: string | number | (string | number)[]) => {
    const newFilters = { ...columnFilters, [key]: value };
    if (value === '' || value === null || (Array.isArray(value) && value.length === 0)) {
      delete newFilters[key];
    }
    setColumnFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const toggleCheckboxFilter = (key: string, value: string | number) => {
    const current = (columnFilters[key] || []) as (string | number)[];
    const next = current.includes(value) 
      ? current.filter((v) => v !== value)
      : [...current, value];
    handleColumnFilterChange(key, next);
  };

  const clearAllFilters = () => {
    setColumnFilters({});
    onFilterChange?.({});
  };

  const activeFilters = Object.entries(columnFilters).filter(([_, val]) => {
    if (Array.isArray(val)) return val.length > 0;
    return val !== '' && val !== null;
  });

  
  return (
    <div className="table-container animate-in">
      {!hideToolbar && (
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <div className="table-search-box">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Örn: Müşteri adı, tutar, tarih..."
                value={search || ''}
                onChange={(e) => onSearchChange?.(e.target.value)}
              />
            </div>
            <button 
              className={`filter-toggle-btn ${showFilters || activeFilters.length > 0 ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <FiFilter size={14} /> 
              <span>Filtreler</span>
              {activeFilters.length > 0 && <span className="filter-count">{activeFilters.length}</span>}
            </button>
          </div>
          {actions && <div className="table-actions-wrapper">{actions}</div>}
        </div>
      )}

      {/* Sidebar Filter Drawer */}
      {showFilters && (
        <div className="filter-sidebar-overlay" onClick={() => setShowFilters(false)}>
          <div className="filter-sidebar" onClick={e => e.stopPropagation()}>
            <div className="filter-sidebar-header">
              <div className="header-title-group">
                <FiFilter className="accent-color" size={20} />
                <div>
                   <h3>Filtreleme</h3>
                   <span className="subtitle">Detaylı arama yapın</span>
                </div>
              </div>
              <button className="btn-icon circle" onClick={() => setShowFilters(false)}><FiX /></button>
            </div>
            <div className="filter-sidebar-content">
              {filterConfig?.map((f) => (
                <div key={f.key} className="filter-section">
                  <label className="section-label">{f.label}</label>
                  {f.type === 'checkbox' && f.options ? (
                    <div className="checkbox-list">
                      {f.options.map(opt => (
                        <label key={String(opt.value)} className="checkbox-item">
                          <input 
                            type="checkbox" 
                            checked={Array.isArray(columnFilters[f.key]) && (columnFilters[f.key] as (string | number)[]).includes(opt.value)}
                            onChange={() => toggleCheckboxFilter(f.key, opt.value)}
                          />
                          <span>{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  ) : f.type === 'select' && f.options ? (
                    <select 
                      className="form-input"
                      value={String(columnFilters[f.key] ?? '')}
                      onChange={(e) => handleColumnFilterChange(f.key, e.target.value)}
                    >
                      <option value="">Tümü</option>
                      {f.options.map(opt => (
                        <option key={String(opt.value)} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input 
                      type={f.type === 'date' ? 'date' : 'text'}
                      className="form-input"
                      placeholder={`${f.label} ara...`}
                      value={String(columnFilters[f.key] ?? '')}
                      onChange={(e) => handleColumnFilterChange(f.key, e.target.value)}
                    />
                  )}
                </div>
              ))}

              {!filterConfig && visibleColumns.map((col: Column<T>) => (
                col.key !== 'actions' && col.key !== 'id' ? (
                  <div key={String(col.key)} className="filter-section">
                    <label className="section-label">{col.label}</label>
                    <input 
                      type="text" 
                      placeholder={`${col.label} ara...`} 
                      className="form-input"
                      value={String(columnFilters[String(col.key)] ?? '')}
                      onChange={(e) => handleColumnFilterChange(String(col.key), e.target.value)}
                    />
                  </div>
                ) : null
              ))}
            </div>
            <div className="filter-sidebar-footer">
              <button className="btn btn-secondary" onClick={clearAllFilters} style={{ flex: 1 }}>Sıfırla</button>
              <button className="btn btn-primary" onClick={() => setShowFilters(false)} style={{ flex: 1 }}>Sonuçları Gör</button>
            </div>
          </div>
        </div>
      )}

      {/* Active Filter Summary */}
      {activeFilters.length > 0 && (
        <div className="filter-summary-bar">
          <div className="active-chips">
            {activeFilters.map(([key, val]) => {
              const col = visibleColumns.find(c => c.key === key) || filterConfig?.find(f => f.key === key);
              const displayVal = Array.isArray(val) ? `${val.length} seçili` : val;
              return (
                <div key={key} className="filter-status-chip">
                  <span className="chip-key">{col?.label}:</span>
                  <span className="chip-val">{displayVal}</span>
                  <button className="chip-close" onClick={() => handleColumnFilterChange(key, '')}><FiX size={10} /></button>
                </div>
              );
            })}
          </div>
          <button className="btn-clear-all" onClick={clearAllFilters}>Filtreleri Temizle</button>
        </div>
      )}

      {loading ? (
        <div className="table-loading">
           <div className="spinner"></div>
           <p>Veriler senkronize ediliyor...</p>
        </div>
      ) : data.length === 0 ? (
        <div className="empty-state">
          <FiFilter size={48} />
          <p>{emptyMessage || 'Filtrelere uygun kayıt bulunamadı'}</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {visibleColumns.map((col: Column<T>) => (
                  <th 
                    key={String(col.key)} 
                    onClick={() => col.sortable !== false && handleSort(String(col.key))}
                    className={col.sortable !== false ? 'sortable' : ''}
                    style={{ textAlign: col.align || 'left' }}
                  >
                    <div className="th-content" style={{ justifyContent: col.align === 'center' ? 'center' : col.align === 'right' ? 'flex-end' : 'flex-start' }}>
                      {col.label}
                      {col.sortable !== false && (
                        <span className={`sort-icon ${sort?.key === col.key ? 'active' : ''}`}>
                          {sort?.key === col.key && sort?.order === 'DESC' ? <FiArrowDown /> : <FiArrowUp />}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) => (
                <tr key={item.id || idx}>
                  {visibleColumns.map((col: Column<T>) => (
                    <td key={String(col.key)} style={{ textAlign: col.align || 'left' }}>
                      {col.render ? (
                        col.render(item, idx)
                      ) : (col.key as string) === 'state' ? (
                        <span className={`badge ${getNestedValue(item, String(col.key)) === 1 ? 'badge-success' : 'badge-danger'}`}>
                          {getNestedValue(item, String(col.key)) === 1 ? 'AKTİF' : 'PASİF'}
                        </span>
                      ) : (
                        <span className={col.key === 'name' || col.key === 'title' ? 'text-bold' : ''}>
                          {String(getNestedValue(item, String(col.key)) ?? '') || '—'}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > limit && (
        <div className="table-footer">
          <div className="pagination-info">
            Toplam <b>{total}</b> kayıttan <b>{(page - 1) * limit + 1}–{Math.min(page * limit, total)}</b> arası
          </div>
          <div className="pagination-controls">
            <button className="btn btn-icon" disabled={page <= 1} onClick={() => onPageChange?.(page - 1)}>
              <FiChevronLeft />
            </button>
            <div className="page-indicator">{page} / {totalPages}</div>
            <button className="btn btn-icon" disabled={page >= totalPages} onClick={() => onPageChange?.(page + 1)}>
              <FiChevronRight />
            </button>
          </div>
        </div>
      )}


      <style>{`
        .table-container { background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border); overflow: hidden; display: flex; flex-direction: column; position: relative; }
        
        .table-toolbar { padding: 0.75rem 1.25rem; display: flex; justify-content: space-between; align-items: center; gap: 1rem; border-bottom: 1px solid var(--border); background: rgba(255,255,255,0.02); }
        .table-toolbar-left { display: flex; align-items: center; gap: 0.75rem; flex: 1; }
        
        .table-search-box { position: relative; flex: 1; max-width: 360px; }
        .table-search-box input { width: 100%; height: 36px; background: var(--bg-app); border: 1px solid var(--border); border-radius: 6px; padding: 0 1rem 0 2.25rem; font-size: 0.8125rem; color: var(--text-primary); transition: var(--transition); }
        .table-search-box input:focus { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-glow); outline: none; }
        .search-icon { position: absolute; left: 0.875rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none; font-size: 0.875rem; }
        
        .filter-toggle-btn { display: flex; align-items: center; gap: 0.5rem; height: 36px; padding: 0 1rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: 6px; color: var(--text-secondary); font-size: 0.8125rem; font-weight: 600; cursor: pointer; transition: var(--transition); }
        .filter-toggle-btn:hover { background: rgba(255,255,255,0.05); }
        .filter-toggle-btn.active { border-color: var(--accent); color: var(--accent); background: var(--accent-glow); }
        .filter-count { background: var(--accent); color: white; min-width: 16px; height: 16px; border-radius: 4px; display: flex; align-items: center; justifyContent: center; font-size: 0.625rem; font-weight: 800; }
        
        .table-actions-wrapper { display: flex; align-items: center; gap: 0.5rem; }

        .filter-summary-bar { padding: 0.625rem 1.25rem; display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.1); border-bottom: 1px solid var(--border); min-height: 48px; }
        .active-chips { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .filter-status-chip { display: flex; align-items: center; gap: 0.5rem; padding: 0.25rem 0.625rem; background: var(--bg-app); border: 1px solid var(--border); border-radius: 4px; font-size: 0.75rem; }
        .chip-key { color: var(--text-muted); }
        .chip-val { color: var(--accent-light); font-weight: 700; }
        .chip-close { background: none; border: none; color: var(--text-muted); cursor: pointer; display: flex; padding: 0; }
        .chip-close:hover { color: var(--danger); }
        .btn-clear-all { background: none; border: none; color: var(--danger); font-size: 0.75rem; font-weight: 700; cursor: pointer; padding: 0; opacity: 0.8; }
        .btn-clear-all:hover { opacity: 1; text-decoration: underline; }

        .table-wrapper { width: 100%; overflow-x: auto; flex: 1; }
        table { width: 100%; border-collapse: collapse; text-align: left; }
        th { padding: 0.75rem 1.25rem; font-size: 0.75rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border); background: rgba(255,255,255,0.01); }
        td { padding: 0.625rem 1.25rem; font-size: 0.8125rem; color: var(--text-primary); border-bottom: 1px solid var(--border); }
        tr:last-child td { border-bottom: none; }
        tr:hover td { background: rgba(255,255,255,0.015); }
        
        .th-content { display: flex; align-items: center; gap: 0.5rem; }
        .sortable { cursor: pointer; }
        .sortable:hover { color: var(--text-primary); }
        .sort-icon { display: flex; opacity: 0.1; }
        .sort-icon.active { opacity: 1; color: var(--accent); }
        .text-bold { font-weight: 700; color: var(--text-primary); }
        
        /* SIDEBAR FILTER */
        .filter-sidebar-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 1000; animation: fade-in 0.2s ease; }
        .filter-sidebar { position: absolute; right: 0; top: 0; width: 320px; height: 100%; background: var(--bg-sidebar); box-shadow: -10px 0 40px rgba(0,0,0,0.4); display: flex; flex-direction: column; animation: slide-left 0.3s ease; border-left: 1px solid var(--border); }
        @keyframes slide-left { from { transform: translateX(100%); } to { transform: translateX(0); } }
        
        .filter-sidebar-header { padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.01); }
        .header-title-group { display: flex; align-items: center; gap: 0.875rem; }
        .header-title-group h3 { font-size: 1rem; font-weight: 800; color: var(--text-primary); line-height: 1.2; }
        .header-title-group .subtitle { font-size: 0.75rem; color: var(--text-muted); }
        .btn-icon.circle { width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; background: var(--bg-card); cursor: pointer; color: var(--text-muted); transition: var(--transition); }
        .btn-icon.circle:hover { color: var(--text-primary); border-color: var(--text-muted); }

        .filter-sidebar-content { flex: 1; overflow-y: auto; padding: 1.5rem; display: flex; flex-direction: column; gap: 1.75rem; }
        .filter-section { display: flex; flex-direction: column; gap: 0.75rem; }
        .section-label { font-size: 0.6875rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; }
        
        .checkbox-list { display: flex; flex-direction: column; gap: 0.5rem; }
        .checkbox-item { display: flex; align-items: center; gap: 0.75rem; cursor: pointer; padding: 0.25rem 0; }
        .checkbox-item input { width: 14px; height: 14px; cursor: pointer; accent-color: var(--accent); }
        .checkbox-item span { font-size: 0.8125rem; color: var(--text-secondary); transition: var(--transition); }
        .checkbox-item:hover span { color: var(--text-primary); }

        .filter-sidebar-footer { padding: 1.25rem 1.5rem; border-top: 1px solid var(--border); display: flex; gap: 1rem; background: rgba(0,0,0,0.1); }
        .filter-sidebar-footer .btn { height: 40px; font-size: 0.875rem; font-weight: 700; }

        .table-footer { padding: 1rem 1.25rem; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); background: var(--bg-card); }
        .pagination-info { font-size: 0.75rem; color: var(--text-secondary); }
        .pagination-controls { display: flex; align-items: center; gap: 0.5rem; }
        .page-indicator { height: 32px; padding: 0 1rem; background: var(--bg-app); border: 1px solid var(--border); border-radius: 6px; font-size: 0.75rem; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; }

        .table-loading, .empty-state { padding: 4rem 2rem; text-align: center; color: var(--text-muted); font-size: 0.875rem; }
        .spinner { width: 24px; height: 24px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 1rem; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
