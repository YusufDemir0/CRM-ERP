import React, { useState, useEffect } from 'react';
import { FiPlus, FiMinus } from 'react-icons/fi';
import { Decimal } from 'decimal.js';

interface PremiumNumberInputProps {
  value: number | string;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const PremiumNumberInput: React.FC<PremiumNumberInputProps> = ({
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  placeholder = '0',
  className = '',
  disabled = false,
}) => {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    if (value === null || value === undefined || value === '') {
      setDisplayValue('');
      return;
    }
    const num = Number(value);
    if (!isNaN(num)) {
      setDisplayValue(new Intl.NumberFormat('tr-TR').format(num));
    }
  }, [value]);

  const numValue = new Decimal(value || 0);

  const handleIncrement = () => {
    if (disabled) return;
    const newVal = numValue.plus(step);
    if (max !== undefined && newVal.gt(max)) return;
    onChange(newVal.toNumber());
  };

  const handleDecrement = () => {
    if (disabled) return;
    const newVal = numValue.minus(step);
    if (min !== undefined && newVal.lt(min)) return;
    onChange(newVal.toNumber());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    
    if (val === '-') {
      setDisplayValue('-');
      return;
    }
    
    // Remove all non-digit and non-comma/dot chars
    let cleanVal = val.replace(/[^\d.,-]/g, '');
    
    // Convert thousands separator (dot in TR) to empty, and decimal (comma) to dot
    // If user types 100.000, we want to parse it as 100000
    // But what if they type a decimal like 10,5?
    
    // Better logic: remove all dots, replace comma with dot
    cleanVal = cleanVal.replace(/\./g, '');
    cleanVal = cleanVal.replace(/,/g, '.');

    if (cleanVal === '' || cleanVal === '-') {
      onChange(0);
      setDisplayValue(cleanVal);
      return;
    }

    const num = Number(cleanVal);
    if (!isNaN(num)) {
      onChange(num);
      // Format the display value right away to enforce 100.000 format
      setDisplayValue(new Intl.NumberFormat('tr-TR').format(num));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent 'e', 'E', '+', and other non-numeric math keys that cause issues
    if (['e', 'E', '+', ' ', 'a', 'A'].includes(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <div className={`relative flex items-center w-full ${className}`}>
      <button
        type="button"
        tabIndex={-1}
        onClick={handleDecrement}
        disabled={disabled || (min !== undefined && numValue.lte(min))}
        className="absolute left-1 w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-30 disabled:hover:bg-slate-50 disabled:hover:text-slate-400 transition-all z-10"
      >
        <FiMinus size={16} />
      </button>

      <input
        type="text"
        value={displayValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="input-premium w-full h-12 px-10 text-center font-black tabular-nums text-base focus:ring-2 focus:ring-primary/20"
      />

      <button
        type="button"
        tabIndex={-1}
        onClick={handleIncrement}
        disabled={disabled || (max !== undefined && numValue.gte(max))}
        className="absolute right-1 w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:bg-green-50 hover:text-green-600 disabled:opacity-30 disabled:hover:bg-slate-50 disabled:hover:text-slate-400 transition-all z-10"
      >
        <FiPlus size={16} />
      </button>
    </div>
  );
};
