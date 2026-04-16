import React from 'react';
import { FiChevronUp, FiChevronDown, FiMinus } from 'react-icons/fi';
import { SortConfig } from '../../hooks/useSort';

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  sortConfigs: SortConfig[];
  onSort: (key: string, multi: boolean) => void;
  style?: React.CSSProperties;
  className?: string;
}

export const SortableHeader: React.FC<SortableHeaderProps> = ({
  label,
  sortKey,
  sortConfigs,
  onSort,
  style,
  className,
}) => {
  const config = sortConfigs.find(s => s.key === sortKey);
  const index = sortConfigs.findIndex(s => s.key === sortKey);

  return (
    <th 
      onClick={(e) => onSort(sortKey, e.shiftKey)}
      style={{ cursor: 'pointer', userSelect: 'none', ...style }}
      className={`sortable-header ${className || ''}`}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        {label}
        <span style={{ display: 'inline-flex', alignItems: 'center', opacity: config ? 1 : 0.3 }}>
          {config?.direction === 'asc' ? <FiChevronUp /> : config?.direction === 'desc' ? <FiChevronDown /> : <FiMinus size={12} />}
          {sortConfigs.length > 1 && index !== -1 && (
            <span style={{ fontSize: '10px', marginLeft: '2px', fontWeight: 800 }}>{index + 1}</span>
          )}
        </span>
      </div>
    </th>
  );
};
