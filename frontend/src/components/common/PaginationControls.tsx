import React from 'react';
import { FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from 'react-icons/fi';

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface PaginationControlsProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  loading?: boolean;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  meta,
  onPageChange,
  onLimitChange,
  loading = false,
}) => {
  const { total, page, limit, totalPages } = meta;

  const startIdx = total === 0 ? 0 : (page - 1) * limit + 1;
  const endIdx = Math.min(page * limit, total);

  if (totalPages <= 1 && total < limit) {
     return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', color: 'gray', fontSize: '13px' }}>
          <span>Toplam {total} kayıt listelendi.</span>
        </div>
     );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', borderTop: '1px solid var(--border)', background: 'var(--surface-container-lowest)', borderRadius: '0 0 16px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <div style={{ fontSize: '13px', color: 'var(--on-surface-variant)' }}>
          <strong>{startIdx}-{endIdx}</strong> / {total} kayıt
        </div>
        <select 
          value={limit} 
          onChange={(e) => onLimitChange(Number(e.target.value))}
          style={{ padding: '4px 8px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '12px' }}
        >
          <option value={10}>10 satır</option>
          <option value={20}>20 satır</option>
          <option value={50}>50 satır</option>
          <option value={100}>100 satır</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: '5px' }}>
        <button 
          className="btn-icon circle" 
          disabled={page <= 1 || loading} 
          onClick={() => onPageChange(1)}
          title="İlk Sayfa"
        >
          <FiChevronsLeft size={18} />
        </button>
        <button 
          className="btn-icon circle" 
          disabled={page <= 1 || loading} 
          onClick={() => onPageChange(page - 1)}
          title="Önceki"
        >
          <FiChevronLeft size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', padding: '0 15px', fontSize: '13px', fontWeight: 600 }}>
          Sayfa {page} / {totalPages}
        </div>

        <button 
          className="btn-icon circle" 
          disabled={page >= totalPages || loading} 
          onClick={() => onPageChange(page + 1)}
          title="Sonraki"
        >
          <FiChevronRight size={18} />
        </button>
        <button 
          className="btn-icon circle" 
          disabled={page >= totalPages || loading} 
          onClick={() => onPageChange(totalPages)}
          title="Son Sayfa"
        >
          <FiChevronsRight size={18} />
        </button>
      </div>
    </div>
  );
};
