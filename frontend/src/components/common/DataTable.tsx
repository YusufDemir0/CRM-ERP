import { useMemo, useRef, useEffect, memo, ReactNode, ReactElement } from 'react';
import { useVirtualizer, VirtualItem } from '@tanstack/react-virtual';
import { SortableHeader } from './SortableHeader';
import { FiEdit2, FiTrash2, FiArchive, FiRefreshCw, FiStar, FiCopy, FiInfo, FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => ReactNode);
  sortKey?: string;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  sortConfigs?: { key: string; direction: 'asc' | 'desc' }[];
  onSort?: (key: string, multi: boolean) => void;
  className?: string;
  
  // Pagination
  total?: number;
  page?: number;
  limit?: number;
  onPageChange?: (page: number) => void;
  
  // Search
  search?: string;
  onSearchChange?: (val: string) => void;
  placeholder?: string;

  // Actions
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onArchive?: (item: T) => void;
  onRestore?: (item: T) => void;
  onClone?: (item: T) => void;
  onTogglePin?: (item: T) => void;
  renderExtraActions?: (item: T) => ReactNode;
  
  // Row metadata
  getRowKey: (item: T) => string | number;
  getRowOpacity?: (item: T) => number;
  isPinned?: (item: T) => boolean;
  hasState?: (item: T) => boolean; // true if active, false if passive
  customIcons?: {
    edit?: (item: T) => ReactNode;
    delete?: (item: T) => ReactNode;
    archive?: (item: T) => ReactNode;
    restore?: (item: T) => ReactNode;
    clone?: (item: T) => ReactNode;
  };
  // Virtualization
  virtualized?: boolean;
  rowHeight?: number;
  containerHeight?: number;
}

// FE-08: Extracted Memoized Row for Performance
const DataTableRow = memo(<T,>({
  item,
  columns,
  onEdit,
  onDelete,
  onArchive,
  onRestore,
  onClone,
  onTogglePin,
  renderExtraActions,
  getRowKey,
  getRowOpacity,
  isPinned,
  hasState,
  customIcons,
}: Omit<DataTableProps<T>, 'data' | 'isLoading' | 'sortConfigs' | 'onSort' | 'total' | 'page' | 'limit' | 'onPageChange' | 'search' | 'onSearchChange'> & { item: T }) => {
  const isActive = hasState ? hasState(item) : true;
  const opacity = getRowOpacity ? getRowOpacity(item) : (isActive ? 1 : 0.6);
  const pinned = isPinned?.(item);

  return (
    <tr 
      style={{ opacity }}
      className="group hover:bg-white transition-colors duration-150 border-b border-slate-50 last:border-0"
    >
      {columns.map((col, idx) => (
        <td key={idx} className={`${col.className || ''} py-4 px-6 first:pl-10 text-sm font-medium text-slate-600`}>
          <div className="flex items-center">
            {typeof col.accessor === 'function' 
              ? col.accessor(item) 
              : String(item[col.accessor as keyof T] || '—')}
          </div>
        </td>
      ))}
      
      {(onEdit || onDelete || onArchive || onRestore || onTogglePin || onClone || renderExtraActions) && (
        <td className="py-4 px-10 text-right">
          <div className="flex gap-1.5 justify-end scale-90 origin-right transition-transform group-hover:scale-100">
            {renderExtraActions && renderExtraActions(item)}
            
            {onTogglePin && (
              <button 
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${pinned ? 'bg-amber-50 text-amber-500' : 'hover:bg-slate-100 text-slate-300 hover:text-slate-500'}`}
                onClick={() => onTogglePin(item)}
              >
                <FiStar fill={pinned ? 'currentColor' : 'none'} size={14} />
              </button>
            )}

            {onEdit && (
              <button 
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-slate-100 text-slate-400 hover:text-primary"
                onClick={() => onEdit(item)} 
                title="Düzenle"
              >
                {customIcons?.edit ? customIcons.edit(item) : <FiEdit2 size={14} />}
              </button>
            )}

            {onClone && (
              <button 
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-slate-100 text-slate-400 hover:text-indigo-500"
                onClick={() => onClone(item)} 
                title="Kopyala"
              >
                {customIcons?.clone ? customIcons.clone(item) : <FiCopy size={14} />}
              </button>
            )}

            {onRestore && (!hasState || !isActive) && (
              <button 
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-green-50 text-slate-400 hover:text-green-500"
                onClick={() => onRestore(item)} 
                title="Geri Yükle"
              >
                {customIcons?.restore ? customIcons.restore(item) : <FiRefreshCw size={14} />}
              </button>
            )}

            {onArchive && (hasState ? isActive : true) && (
              <button 
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-red-50 text-slate-400 hover:text-red-500"
                onClick={() => onArchive(item)} 
                title="İşlemi Sonlandır"
              >
                {customIcons?.archive ? customIcons.archive(item) : <FiArchive size={14} />}
              </button>
            )}

            {onDelete && (
              <button 
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-red-50 text-slate-400 hover:text-red-500"
                onClick={() => onDelete(item)} 
                title="Sil"
              >
                {customIcons?.delete ? customIcons.delete(item) : <FiTrash2 size={14} />}
              </button>
            )}
          </div>
        </td>
      )}
    </tr>
  );
}) as <T,>(props: Omit<DataTableProps<T>, 'data' | 'isLoading' | 'sortConfigs' | 'onSort' | 'total' | 'page' | 'limit' | 'onPageChange' | 'search' | 'onSearchChange'> & { item: T }) => ReactElement;

const DataTableInner = <T,>({
  data,
  columns,
  isLoading,
  sortConfigs,
  onSort,
  total,
  page,
  limit = 20,
  onPageChange,
  search,
  onSearchChange,
  placeholder = "Hızlı arama yapın...",
  virtualized,
  rowHeight: propRowHeight,
  containerHeight: propContainerHeight,
  ...rowProps
}: DataTableProps<T>) => {
  // FE-08: Memoize header to avoid unnecessary calculations
  const hasActions = !!(rowProps.onEdit || rowProps.onDelete || rowProps.onArchive || rowProps.onRestore || rowProps.onTogglePin || rowProps.onClone || rowProps.renderExtraActions);

  const tableHeader = useMemo(() => (
    <thead>
      <tr className="bg-slate-50/50">
        {columns.map((col, idx) => (
          col.sortKey && onSort && sortConfigs ? (
            <SortableHeader
              key={idx}
              label={col.header}
              sortKey={col.sortKey}
              sortConfigs={sortConfigs}
              onSort={onSort}
              className={`${col.className || ''} py-5 px-6 first:pl-10`}
            />
          ) : (
            <th 
              key={idx} 
              className={`${col.className || ''} py-5 px-6 first:pl-10 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100`}
            >
              {col.header}
            </th>
          )
        ))}
        {hasActions && (
          <th className="py-5 px-10 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
            İŞLEMLER
          </th>
        )}
      </tr>
    </thead>
  ), [columns, sortConfigs, onSort, hasActions]);

  const totalPages = total ? Math.ceil(total / limit) : 1;

  const containerRef = useRef<HTMLDivElement>(null);
  const containerHeight = propContainerHeight || 600;

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => propRowHeight || 60,
    overscan: 5,
  });

  return (
    <div className="bg-white border border-slate-100 shadow-premium rounded-2xl overflow-hidden animate-in">
      {onSearchChange !== undefined && (
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:max-w-md group">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder={placeholder}
              value={search || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-slate-50 border-2 border-transparent focus:border-primary/10 focus:bg-white rounded-2xl text-sm font-bold text-slate-700 transition-colors outline-none"
            />
          </div>
        </div>
      )}

      <div 
        ref={containerRef}
        className="overflow-auto"
        style={{ maxHeight: virtualized ? `${containerHeight}px` : 'none', minHeight: '400px' }}
      >
        {isLoading ? (
          <table className="w-full border-separate border-spacing-0">
            {tableHeader}
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse border-b border-slate-50 last:border-0">
                  {columns.map((_, idx) => (
                    <td key={idx} className="py-4 px-6 first:pl-10">
                      <div className="h-4 bg-slate-100 rounded-md skeleton w-full max-w-[120px]" />
                    </td>
                  ))}
                  {hasActions && (
                    <td className="py-4 px-10 text-right">
                      <div className="flex gap-2 justify-end">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg skeleton" />
                        <div className="w-8 h-8 bg-slate-100 rounded-lg skeleton" />
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full border-separate border-spacing-0">
            {tableHeader}
            <tbody className="divide-y divide-slate-50">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="py-32 px-10 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-30 grayscale scale-90 transition-colors hover:grayscale-0 hover:scale-100">
                      <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-400">
                        <FiInfo size={32} />
                      </div>
                      <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Henüz bir kayıt bulunamadı.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                virtualized && data.length >= 30 ? (
                  <>
                    {rowVirtualizer.getVirtualItems().length > 0 && rowVirtualizer.getVirtualItems()[0].start > 0 && (
                      <tr><td colSpan={columns.length + 1} style={{ height: `${rowVirtualizer.getVirtualItems()[0].start}px` }} /></tr>
                    )}
                    {rowVirtualizer.getVirtualItems().map((virtualRow: VirtualItem) => {
                      const item = data[virtualRow.index];
                      return (
                        <DataTableRow
                          key={rowProps.getRowKey(item)}
                          item={item}
                          columns={columns}
                          {...rowProps}
                        />
                      );
                    })}
                    {rowVirtualizer.getVirtualItems().length > 0 && rowVirtualizer.getTotalSize() - rowVirtualizer.getVirtualItems()[rowVirtualizer.getVirtualItems().length - 1].end > 0 && (
                      <tr><td colSpan={columns.length + 1} style={{ height: `${rowVirtualizer.getTotalSize() - rowVirtualizer.getVirtualItems()[rowVirtualizer.getVirtualItems().length - 1].end}px` }} /></tr>
                    )}
                  </>
                ) : (
                  data.map((item) => (
                    <DataTableRow
                      key={rowProps.getRowKey(item)}
                      item={item}
                      columns={columns}
                      {...rowProps}
                    />
                  ))
                )
              )}
            </tbody>
          </table>
        )}
      </div>

      {total && onPageChange && page && total > limit && (
        <div className="p-6 bg-slate-50/50 border-t border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
            Toplam <span className="text-slate-800">{total}</span> kayıttan <span className="text-slate-800">{(page - 1) * limit + 1}–{Math.min(page * limit, total)}</span> gösteriliyor
          </div>
          <div className="flex items-center gap-2">
            <button 
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary/20 disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:border-slate-100 transition-colors"
            >
              <FiChevronLeft />
            </button>
            <div className="h-10 px-4 flex items-center rounded-xl bg-white border border-slate-100 text-xs font-black text-slate-800">
              {page} / {totalPages}
            </div>
            <button 
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary/20 disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:border-slate-100 transition-colors"
            >
              <FiChevronRight />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const DataTable = memo(DataTableInner) as <T,>(props: DataTableProps<T>) => ReactElement;
