import { useMemo, useRef, memo, ReactNode, ReactElement } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { 
  useReactTable, 
  getCoreRowModel, 
  flexRender, 
  ColumnDef,
  SortingState,
  PaginationState,
} from '@tanstack/react-table';
import { 
  FiEdit2, FiTrash2, FiArchive, FiRefreshCw, FiStar, FiCopy, 
  FiInfo, FiSearch, FiChevronLeft, FiChevronRight, FiArrowUp, FiArrowDown 
} from 'react-icons/fi';
export interface ActionButtonProps {
  icon: ReactNode;
  onClick: () => void;
  tooltip?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

export const ActionButton = ({ 
  icon, 
  onClick, 
  tooltip, 
  variant = 'secondary',
  disabled = false
}: ActionButtonProps) => {
  const variants = {
    primary: 'hover:bg-primary/10 text-slate-400 hover:text-primary',
    secondary: 'hover:bg-slate-100 text-slate-400 hover:text-slate-600',
    danger: 'hover:bg-red-50 text-slate-400 hover:text-red-500'
  };

  return (
    <button 
      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-200 ${variants[variant]} disabled:opacity-30`}
      onClick={(e) => { e.stopPropagation(); onClick(); }} 
      title={tooltip}
      disabled={disabled}
    >
      {icon}
    </button>
  );
};

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
  hasState?: (item: T) => boolean;
  isArchivable?: (item: T) => boolean;
  isRestorable?: (item: T) => boolean;
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

const DataTableInner = <T,>({
  data,
  columns,
  isLoading,
  sortConfigs,
  onSort,
  total,
  page = 1,
  limit = 20,
  onPageChange,
  search,
  onSearchChange,
  placeholder = "Hızlı arama yapın...",
  virtualized,
  rowHeight = 60,
  containerHeight = 600,
  getRowKey,
  ...rowProps
}: DataTableProps<T>) => {

  // Build a lookup map from sortConfigs for quick access
  const sortMap = useMemo(() => {
    const map: Record<string, 'asc' | 'desc'> = {};
    sortConfigs?.forEach(s => { map[s.key] = s.direction; });
    return map;
  }, [sortConfigs]);

  const sorting: SortingState = useMemo(() => 
    sortConfigs?.map(s => ({ id: s.key, desc: s.direction === 'desc' })) || [],
    [sortConfigs]
  );

  const pagination: PaginationState = {
    pageIndex: page - 1,
    pageSize: limit,
  };

  const tableColumns = useMemo<ColumnDef<T>[]>(() => {
    const cols: ColumnDef<T>[] = columns.map((col, idx) => ({
      id: col.sortKey || `col_${idx}`,
      header: col.header,
      cell: (info) => {
        const item = info.row.original;
        return typeof col.accessor === 'function' 
          ? col.accessor(item) 
          : String(item[col.accessor as keyof T] || '—');
      },
      enableSorting: !!col.sortKey,
      meta: { className: col.className, sortKey: col.sortKey },
    }));

    // Action Column
    const hasActions = !!(rowProps.onEdit || rowProps.onDelete || rowProps.onArchive || rowProps.onRestore || rowProps.onTogglePin || rowProps.onClone || rowProps.renderExtraActions);
    if (hasActions) {
      cols.push({
        id: 'actions',
        header: 'İŞLEMLER',
        cell: (info) => {
          const item = info.row.original;
          const isActive = rowProps.hasState ? rowProps.hasState(item) : true;
          const pinned = rowProps.isPinned?.(item);

          return (
            <div className="flex gap-1.5 justify-end scale-90 origin-right transition-transform group-hover:scale-100">
              {rowProps.renderExtraActions && rowProps.renderExtraActions(item)}
              
              {rowProps.onTogglePin && (
                <button 
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${pinned ? 'bg-amber-50 text-amber-500' : 'hover:bg-slate-100 text-slate-300 hover:text-slate-500'}`}
                  onClick={() => rowProps.onTogglePin!(item)}
                >
                  <FiStar fill={pinned ? 'currentColor' : 'none'} size={14} />
                </button>
              )}

              {rowProps.onEdit && (
                <button 
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-slate-100 text-slate-400 hover:text-primary"
                  onClick={() => rowProps.onEdit!(item)} 
                  title="Düzenle"
                >
                  {rowProps.customIcons?.edit ? rowProps.customIcons.edit(item) : <FiEdit2 size={14} />}
                </button>
              )}

              {rowProps.onRestore && (!rowProps.hasState || !isActive) && (!rowProps.isRestorable || rowProps.isRestorable(item)) && (
                <button 
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-green-50 text-slate-400 hover:text-green-500"
                  onClick={() => rowProps.onRestore!(item)} 
                  title="Geri Yükle"
                >
                  {rowProps.customIcons?.restore ? rowProps.customIcons.restore(item) : <FiRefreshCw size={14} />}
                </button>
              )}

              {rowProps.onArchive && (rowProps.hasState ? isActive : true) && (!rowProps.isArchivable || rowProps.isArchivable(item)) && (
                <button 
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-red-50 text-slate-400 hover:text-red-500"
                  onClick={() => rowProps.onArchive!(item)} 
                  title="Arşivle"
                >
                  {rowProps.customIcons?.archive ? rowProps.customIcons.archive(item) : <FiArchive size={14} />}
                </button>
              )}

              {rowProps.onDelete && (
                <button 
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-red-50 text-slate-400 hover:text-red-500"
                  onClick={() => rowProps.onDelete!(item)} 
                  title="Sil"
                >
                  {rowProps.customIcons?.delete ? rowProps.customIcons.delete(item) : <FiTrash2 size={14} />}
                </button>
              )}
            </div>
          );
        },
        enableSorting: false,
        meta: { className: 'text-right px-10' },
      });
    }

    return cols;
  }, [columns, rowProps]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: () => {}, // We handle sorting ourselves via direct onClick
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
    getRowId: (originalRow) => String(getRowKey(originalRow)),
  });

  const { rows } = table.getRowModel();
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 5,
  });

  const totalPages = total ? Math.ceil(total / limit) : 1;

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
              className="w-full h-12 pl-12 pr-4 bg-slate-50 border-2 border-transparent focus:border-primary/10 focus:bg-white rounded-2xl text-sm font-bold text-slate-700 transition-[border-color,background-color] duration-200 outline-none"
            />
          </div>
        </div>
      )}

      <div 
        ref={parentRef}
        className="overflow-auto custom-scrollbar"
        style={{ height: virtualized ? `${containerHeight}px` : 'auto', minHeight: '400px' }}
      >
        <table className="w-full border-separate border-spacing-0">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="bg-slate-50/50">
                {headerGroup.headers.map(header => {
                  const meta = header.column.columnDef.meta as { className?: string; sortKey?: string } | undefined;
                  const sortKey = meta?.sortKey;
                  const currentDir = sortKey ? sortMap[sortKey] : undefined;
                  const isSortable = !!sortKey && !!onSort;
                  return (
                    <th 
                      key={header.id} 
                      className={`${meta?.className || ''} py-5 px-6 first:pl-10 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 ${isSortable ? 'cursor-pointer select-none hover:text-primary' : ''} transition-colors duration-200`}
                      onClick={isSortable ? () => onSort!(sortKey!, false) : undefined}
                    >
                      <div className="flex items-center gap-2">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {currentDir === 'asc' && <FiArrowUp className="text-primary" />}
                        {currentDir === 'desc' && <FiArrowDown className="text-primary" />}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          
          <tbody className="divide-y divide-slate-50 relative">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {columns.map((_, idx) => (
                    <td key={idx} className="py-4 px-6 first:pl-10">
                      <div className="h-4 bg-slate-100 rounded-md w-24" />
                    </td>
                  ))}
                  <td className="py-4 px-10"><div className="h-4 bg-slate-100 rounded-md w-12 ml-auto" /></td>
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={table.getAllColumns().length} className="py-32 text-center">
                  <div className="flex flex-col items-center gap-4 opacity-30">
                    <FiInfo size={32} />
                    <span className="text-xs font-black uppercase tracking-widest">Henüz bir kayıt bulunamadı.</span>
                  </div>
                </td>
              </tr>
            ) : virtualized ? (
              <>
                <tr style={{ height: `${virtualizer.getVirtualItems()[0]?.start ?? 0}px` }} />
                {virtualizer.getVirtualItems().map(virtualRow => {
                  const row = rows[virtualRow.index];
                  return (
                    <tr
                      key={row.id}
                      className="group hover:bg-white hover:shadow-lg hover:shadow-slate-100 hover:-translate-y-[1px] transition-[background-color,box-shadow,transform] duration-200"
                      style={{ height: `${virtualRow.size}px` }}
                    >
                      {row.getVisibleCells().map(cell => {
                        const meta = cell.column.columnDef.meta as { className?: string } | undefined;
                        return (
                          <td key={cell.id} className={`${meta?.className || ''} py-4 px-6 first:pl-10 text-sm font-medium text-slate-600`}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
                <tr style={{ height: `${virtualizer.getTotalSize() - (virtualizer.getVirtualItems()[virtualizer.getVirtualItems().length - 1]?.end ?? 0)}px` }} />
              </>
            ) : (
              rows.map(row => (
                <tr key={row.id} className="group hover:bg-white hover:shadow-lg hover:shadow-slate-100 hover:-translate-y-[1px] transition-[background-color,box-shadow,transform] duration-200">
                  {row.getVisibleCells().map(cell => {
                    const meta = cell.column.columnDef.meta as { className?: string } | undefined;
                    return (
                      <td key={cell.id} className={`${meta?.className || ''} py-4 px-6 first:pl-10 text-sm font-medium text-slate-600`}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {total && onPageChange && total > limit && (
        <div className="p-6 bg-slate-50/50 border-t border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Toplam <span className="text-slate-800">{total}</span> kayıttan <span className="text-slate-800">{(page - 1) * limit + 1}–{Math.min(page * limit, total)}</span> gösteriliyor
          </div>
          <div className="flex items-center gap-2">
            <button 
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary disabled:opacity-30 transition-colors"
            >
              <FiChevronLeft />
            </button>
            <div className="h-10 px-4 flex items-center rounded-xl bg-white border border-slate-100 text-xs font-black text-slate-800">
              {page} / {totalPages}
            </div>
            <button 
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary disabled:opacity-30 transition-colors"
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
