import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { FiSearch, FiChevronDown, FiX } from 'react-icons/fi';

interface Option {
  id: number | string;
  label: string;
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
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Seçiniz...',
  label,
  className = '',
  required,
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

  const filteredOptions = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  const virtualizer = useVirtualizer({
    count: filteredOptions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 5,
  });

  return (
    <div className={`form-group ${className}`} ref={containerRef}>
      {label && (
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">
          {label} {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        <div
          className="flex items-center justify-between h-12 px-4 rounded-xl border-2 border-slate-100 bg-white cursor-pointer hover:border-primary/20 transition-all shadow-sm"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className={`text-sm font-bold ${selectedOption ? 'text-slate-800' : 'text-slate-300'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <div className="flex items-center gap-1.5">
            {selectedOption && (
              <button
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
                    return (
                      <div
                        key={virtualRow.key}
                        className={`absolute top-0 left-0 w-full px-4 flex items-center cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary/5 text-primary font-black' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                        style={{
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                        onClick={() => {
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
