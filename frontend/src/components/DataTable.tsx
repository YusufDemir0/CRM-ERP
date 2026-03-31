import { ReactNode } from 'react';
import { FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
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
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="table-container">
      <div className="table-toolbar">
        {onSearchChange ? (
          <div className="table-search">
            <FiSearch />
            <input
              type="text"
              placeholder="Ara..."
              value={search || ''}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        ) : <div />}
        {actions && <div className="page-header-actions">{actions}</div>}
      </div>

      {loading ? (
        <div className="page-loading"><div className="spinner" /></div>
      ) : data.length === 0 ? (
        <div className="empty-state">
          <p>{emptyMessage || 'Kayıt bulunamadı'}</p>
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr key={item.id || idx}>
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(item) : item[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {total > limit && (
        <div className="table-pagination">
          <span>{total} kayıttan {(page - 1) * limit + 1}–{Math.min(page * limit, total)} arası</span>
          <div className="table-pagination-btns">
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
