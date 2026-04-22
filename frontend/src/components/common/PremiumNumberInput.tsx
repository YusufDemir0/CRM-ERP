
import React from 'react';
import { FiPlus, FiMinus } from 'react-icons/fi';

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
  const numValue = Number(value) || 0;

  const handleIncrement = () => {
    if (disabled) return;
    const newVal = numValue + step;
    if (max !== undefined && newVal > max) return;
    onChange(newVal);
  };

  const handleDecrement = () => {
    if (disabled) return;
    const newVal = numValue - step;
    if (min !== undefined && newVal < min) return;
    onChange(newVal);
  };

  return (
    <div className={`relative flex items-center w-full ${className}`}>
      <button
        type="button"
        tabIndex={-1}
        onClick={handleDecrement}
        disabled={disabled || (min !== undefined && numValue <= min)}
        className="absolute left-1 w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-30 disabled:hover:bg-slate-50 disabled:hover:text-slate-400 transition-all z-10"
      >
        <FiMinus size={16} />
      </button>

      <input
        type="number"
        step="any"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        placeholder={placeholder}
        disabled={disabled}
        className="input-premium w-full h-12 px-10 text-center font-black tabular-nums text-base focus:ring-2 focus:ring-primary/20"
      />

      <button
        type="button"
        tabIndex={-1}
        onClick={handleIncrement}
        disabled={disabled || (max !== undefined && numValue >= max)}
        className="absolute right-1 w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:bg-green-50 hover:text-green-600 disabled:opacity-30 disabled:hover:bg-slate-50 disabled:hover:text-slate-400 transition-all z-10"
      >
        <FiPlus size={16} />
      </button>
    </div>
  );
};
