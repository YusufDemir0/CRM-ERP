import React from 'react';
import { SortableHeader } from './SortableHeader';
import { FiEdit2, FiTrash2, FiArchive, FiRefreshCw, FiStar, FiCopy, FiInfo, FiChevronRight } from 'react-icons/fi';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  sortKey?: string;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  sortConfigs: any[];
  onSort: (key: string, multi: boolean) => void;
  className?: string;
  // Actions
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onArchive?: (item: T) => void;
  onRestore?: (item: T) => void;
  onClone?: (item: T) => void;
  onTogglePin?: (item: T) => void;
  renderExtraActions?: (item: T) => React.ReactNode;
  // Row metadata
  getRowKey: (item: T) => string | number;
  getRowOpacity?: (item: T) => number;
  isPinned?: (item: T) => boolean;
  hasState?: (item: T) => boolean; // true if active, false if passive
  customIcons?: {
    edit?: (item: T) => React.ReactNode;
    delete?: (item: T) => React.ReactNode;
    archive?: (item: T) => React.ReactNode;
    restore?: (item: T) => React.ReactNode;
    clone?: (item: T) => React.ReactNode;
  };
}

export function DataTable<T>({
  data,
  columns,
  isLoading,
  sortConfigs,
  onSort,
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
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-premium rounded-[2rem] overflow-hidden">
        <div className="py-24 flex flex-col items-center justify-center gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-4 border-primary/10"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
          <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase animate-pulse">
            Veriler Hazırlanıyor...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-premium rounded-[2.5rem] overflow-hidden animate-in">
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr className="bg-slate-50/50">
              {columns.map((col, idx) => (
                col.sortKey ? (
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
              {(onEdit || onDelete || onArchive || onRestore || onTogglePin || onClone || renderExtraActions) && (
                <th className="py-5 px-10 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  İŞLEMLER
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="py-32 px-10 text-center">
                  <div className="flex flex-col items-center gap-4 opacity-30 grayscale scale-90 transition-all hover:grayscale-0 hover:scale-100">
                    <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-400">
                      <FiInfo size={32} />
                    </div>
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Henüz bir kayıt bulunamadı.</span>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item) => {
                const isActive = hasState ? hasState(item) : true;
                const opacity = getRowOpacity ? getRowOpacity(item) : (isActive ? 1 : 0.6);
                
                return (
                  <tr 
                    key={getRowKey(item)} 
                    style={{ opacity }}
                    className="group hover:bg-white transition-all duration-300"
                  >
                    {columns.map((col, idx) => (
                      <td key={idx} className={`${col.className || ''} py-4 px-6 first:pl-10 text-sm`}>
                        <div className="flex items-center group-hover:translate-x-1 transition-transform duration-300">
                          {typeof col.accessor === 'function' 
                            ? col.accessor(item) 
                            : String(item[col.accessor] || '—')}
                        </div>
                      </td>
                    ))}
                    
                    {(onEdit || onDelete || onArchive || onRestore || onTogglePin || onClone || renderExtraActions) && (
                      <td className="py-4 px-10 text-right">
                        <div className="flex gap-1.5 justify-end scale-90 origin-right transition-transform group-hover:scale-100">
                          {renderExtraActions && renderExtraActions(item)}
                          
                          {onTogglePin && (
                            <button 
                              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isPinned?.(item) ? 'bg-amber-50 text-amber-500' : 'hover:bg-slate-100 text-slate-300 hover:text-slate-500'}`}
                              onClick={() => onTogglePin(item)}
                            >
                              <FiStar fill={isPinned?.(item) ? 'currentColor' : 'none'} size={14} />
                            </button>
                          )}

                          {onEdit && (
                            <button 
                              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-slate-100 text-slate-400 hover:text-primary"
                              onClick={() => onEdit(item)} 
                              title="Düzenle"
                            >
                              {customIcons?.edit ? customIcons.edit(item) : <FiEdit2 size={14} />}
                            </button>
                          )}

                          {onClone && (
                            <button 
                              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-slate-100 text-slate-400 hover:text-indigo-500"
                              onClick={() => onClone(item)} 
                              title="Kopyala"
                            >
                              {customIcons?.clone ? customIcons.clone(item) : <FiCopy size={14} />}
                            </button>
                          )}

                          {onRestore && (!hasState || !isActive) && (
                            <button 
                              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-green-50 text-slate-400 hover:text-green-500"
                              onClick={() => onRestore(item)} 
                              title="Geri Yükle"
                            >
                              {customIcons?.restore ? customIcons.restore(item) : <FiRefreshCw size={14} />}
                            </button>
                          )}

                          {onArchive && (hasState ? isActive : true) && (
                            <button 
                              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-red-50 text-slate-400 hover:text-red-500"
                              onClick={() => onArchive(item)} 
                              title="İşlemi Sonlandır"
                            >
                              {customIcons?.archive ? customIcons.archive(item) : <FiArchive size={14} />}
                            </button>
                          )}

                          {onDelete && (
                            <button 
                              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-red-50 text-slate-400 hover:text-red-500"
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
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
