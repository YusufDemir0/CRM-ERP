import React, { useState, useRef, useEffect } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import { COUNTRY_CODES, CountryCode } from '../../constants/countryCodes';

interface PhoneInputProps {
  label?: string;
  value: string;
  onChange: (fullValue: string) => void;
  placeholder?: string;
  className?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  label,
  value,
  onChange,
  placeholder = '5XX XXX XX XX',
  className = '',
}) => {
  // Extract country code and local number from value (format: +90 5XX XXX XX XX)
  const parts = value.split(' ');
  const currentCountryCode = parts[0] || '+90';
  const localNumber = parts.slice(1).join('').replace(/\D/g, '');

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCountryChange = (code: string) => {
    onChange(`${code} ${formatLocalNumber(localNumber)}`);
    setIsOpen(false);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').substring(0, 10);
    onChange(`${currentCountryCode} ${formatLocalNumber(raw)}`);
  };

  const formatLocalNumber = (raw: string) => {
    if (!raw) return '';
    const parts = [];
    if (raw.length > 0) parts.push(raw.substring(0, 3));
    if (raw.length > 3) parts.push(raw.substring(3, 6));
    if (raw.length > 6) parts.push(raw.substring(6, 8));
    if (raw.length > 8) parts.push(raw.substring(8, 10));
    return parts.join(' ');
  };

  const currentCountry = COUNTRY_CODES.find(c => c.code === currentCountryCode) || COUNTRY_CODES[0];

  return (
    <div className={`form-group ${className}`} ref={containerRef}>
      {label && <label>{label}</label>}
      <div className="flex gap-2">
        <div className="relative shrink-0">
          <div 
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 h-12 px-3 bg-white border border-[var(--border)] rounded-xl cursor-pointer hover:border-[var(--primary)] transition-all font-bold text-sm"
          >
            <span>{currentCountry.flag}</span>
            <span>{currentCountry.code}</span>
            <FiChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>

          {isOpen && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-[var(--border)] rounded-xl shadow-xl z-[150] max-h-60 overflow-y-auto">
              {COUNTRY_CODES.map((c) => (
                <div 
                  key={c.code}
                  onClick={() => handleCountryChange(c.code)}
                  className={`flex items-center justify-between p-3 hover:bg-[var(--primary-glow)] cursor-pointer transition-colors ${c.code === currentCountryCode ? 'bg-[var(--primary-glow)]' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <span>{c.flag}</span>
                    <span className="text-xs font-medium">{c.name}</span>
                  </div>
                  <span className="text-xs font-bold text-[var(--primary)]">{c.code}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <input 
          type="tel"
          className="flex-1"
          placeholder={placeholder}
          value={formatLocalNumber(localNumber)}
          onChange={handleNumberChange}
        />
      </div>
    </div>
  );
};
