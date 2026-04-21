import React from 'react';

interface FormFieldProps {
  label?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  helperText?: string;
  id?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  required,
  children,
  className = '',
  helperText,
  id,
}) => {
  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={id} className="flex items-center gap-1">
          {label}
          {required && <span className="text-[var(--error)] ml-0.5">*</span>}
        </label>
      )}
      
      <div className="relative">
        {children}
        
        {error && (
          <span className="text-[10px] font-bold text-[var(--error)] mt-1 animate-in">
            {error}
          </span>
        )}
        
        {!error && helperText && (
          <span className="text-[10px] font-medium text-[var(--text-muted)] mt-1">
            {helperText}
          </span>
        )}
      </div>
    </div>
  );
};
