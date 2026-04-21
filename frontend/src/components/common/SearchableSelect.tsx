import React, { useState, useRef, useEffect } from 'react';
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
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Seçiniz...',
  label,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.id === value);

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

  return (
    <div className={`form-group ${className}`} ref={containerRef}>
      {label && <label>{label}</label>}
      <div className="relative">
        <div
          className="flex items-center justify-between p-2 rounded-lg border border-[var(--border)] bg-white cursor-pointer hover:border-[var(--primary)] transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className={selectedOption ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <div className="flex items-center gap-1">
            {selectedOption && (
              <FiX
                className="text-[var(--text-muted)] hover:text-[var(--error)]"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(null);
                }}
              />
            )}
            <FiChevronDown className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[var(--border)] rounded-lg shadow-xl z-[100] overflow-hidden">
            <div className="p-2 border-b border-[var(--border)] flex items-center gap-2 bg-slate-50">
              <FiSearch className="text-[var(--text-muted)]" />
              <input
                autoFocus
                type="text"
                className="w-full bg-transparent border-none outline-none text-sm p-1"
                placeholder="Ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="max-h-60 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <div
                    key={option.id}
                    className={`p-2 text-sm cursor-pointer hover:bg-[var(--primary-glow)] hover:text-[var(--primary)] transition-colors ${
                      option.id === value ? 'bg-[var(--primary-glow)] text-[var(--primary)] font-bold' : ''
                    }`}
                    onClick={() => {
                      onChange(option);
                      setIsOpen(false);
                      setSearch('');
                    }}
                  >
                    {option.label}
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-[var(--text-muted)] text-sm">Sonuç bulunamadı</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
