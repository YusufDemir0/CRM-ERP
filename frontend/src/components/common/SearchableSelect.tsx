import React, { useState, useRef, useMemo, useEffect, useDeferredValue } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { FiSearch, FiChevronDown, FiX, FiPlus } from 'react-icons/fi';

interface Option {
  id: number | string;
  label: string;
  isGreen?: boolean;
  disabled?: boolean;
  [key: string]: unknown;
}

interface SearchableSelectProps {
  options: Option[];
  value: number | string | null;
  onChange: (option: Option | null) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  required?: boolean;
  onQuickAdd?: () => void;
  disabled?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Seçiniz...',
  label,
  className = '',
  required,
  onQuickAdd,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(() => 
    options.find((o) => String(o.id) === String(value)),
    [options, value]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const deferredSearch = useDeferredValue(search);

  const turkishNormalize = (str: string): string => {
    return str
      .replace(/İ/g, 'i')
      .replace(/I/g, 'ı')
      .toLowerCase()
      .replace(/ı/g, 'i')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c');
  };

  const filteredOptions = useMemo(() => {
    if (!deferredSearch) return options;
    const normalizedSearch = turkishNormalize(deferredSearch);
    return options.filter((o) => turkishNormalize(o.label).includes(normalizedSearch));
  }, [options, deferredSearch]);

  const virtualizer = useVirtualizer({
    count: isOpen ? filteredOptions.length : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 5,
  });

  return (
    <div className={`form-group ${className}`} ref={containerRef}>
      {label && (
        <div className="flex items-center justify-between mb-1.5 ml-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
            {label} {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          {onQuickAdd && !disabled && (
            <button 
              type="button" 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuickAdd(); }}
              className="text-emerald-500 hover:text-emerald-600 flex items-center justify-center p-1 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors shadow-sm"
              title="Hızlı Ekle"
            >
              <FiPlus size={14} className="stroke-[3px]" />
            </button>
          )}
        </div>
      )}
      <div className="relative">
        <div
          tabIndex={disabled ? -1 : 0}
          className={`flex items-center justify-between h-12 px-4 rounded-xl border-2 border-slate-100 bg-white transition-all shadow-sm focus:border-primary focus:outline-none ${
            disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed opacity-75' : 'cursor-pointer hover:border-primary/20'
          }`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={(e) => {
            if (disabled) return;
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsOpen(!isOpen);
            }
          }}
        >
          <span className={`text-sm font-bold ${selectedOption ? 'text-slate-800' : 'text-slate-300'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <div className="flex items-center gap-1.5">
            {selectedOption && !disabled && (
              <button
                tabIndex={-1}
                className="w-6 h-6 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 flex items-center justify-center transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(null);
                }}
              >
                <FiX size={14} />
              </button>
            )}
            <FiChevronDown className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
          </div>
        </div>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-premium z-[100] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-3 border-b border-slate-50 flex items-center gap-3 bg-slate-50/50">
              <FiSearch className="text-slate-400" />
              <input
                autoFocus
                type="text"
                className="w-full bg-transparent border-none outline-none text-sm font-bold text-slate-700 placeholder:text-slate-300"
                placeholder="Hızlıca arama yapın..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div 
              ref={parentRef}
              className="max-h-72 overflow-y-auto"
            >
              <div
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {virtualizer.getVirtualItems().length > 0 ? (
                  virtualizer.getVirtualItems().map((virtualRow) => {
                    const option = filteredOptions[virtualRow.index];
                    const isSelected = String(option.id) === String(value);
                    const isGreen = !!option.isGreen;
                    const isDisabled = !!option.disabled;
                    let rowClass = 'text-slate-600 hover:bg-slate-50';
                    if (isDisabled) {
                      rowClass = 'text-slate-350 bg-slate-50/50 cursor-not-allowed opacity-60';
                    } else if (isSelected) {
                      rowClass = 'bg-primary/5 text-primary font-black';
                    } else if (isGreen) {
                      rowClass = 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-bold';
                    }

                    return (
                      <div
                        key={virtualRow.key}
                        className={`absolute top-0 left-0 w-full px-4 flex items-center cursor-pointer transition-colors ${rowClass}`}
                        style={{
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                        onClick={() => {
                          if (isDisabled) return;
                          onChange(option);
                          setIsOpen(false);
                          setSearch('');
                        }}
                      >
                        <span className="text-sm truncate">{option.label}</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">Sonuç bulunamadı</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
