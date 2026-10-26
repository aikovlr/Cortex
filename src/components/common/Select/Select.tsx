import React from 'react';
import styles from './Select.module.css';

export interface Option {
  value: string | number;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options?: Option[];
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, children, className = '', id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={styles.container}>
        {label && (
          <label htmlFor={selectId} className={styles.label}>
            {label}
          </label>
        )}
        <div className={styles.selectWrapper}>
          <select
            id={selectId}
            ref={ref}
            className={`${styles.select} ${className}`}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <span className={styles.arrowIcon}>▼</span>
        </div>
        {error && <span className={styles.errorMessage}>{error}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';
