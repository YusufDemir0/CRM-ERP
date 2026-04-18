
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
      className={`sortable-header cursor-pointer select-none ${className || ''}`}
      style={style}
    >
      <div className="flex items-center gap-1.5">
        {label}
        <span className={`inline-flex items-center ${config ? 'opacity-100' : 'opacity-30'}`}>
          {config?.direction === 'asc' ? <FiChevronUp /> : config?.direction === 'desc' ? <FiChevronDown /> : <FiMinus size={12} />}
          {sortConfigs.length > 1 && index !== -1 && (
            <span className="text-[10px] ml-0.5 font-extrabold">{index + 1}</span>
          )}
        </span>
      </div>
    </th>
  );
};
