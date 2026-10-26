'use client';

import React from 'react';
import { SearchIcon, XIcon } from '@/components/common/Icons/Icons';
import styles from './SearchBar.module.css';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxWidth?: string | number;
  className?: string;
  onClear?: () => void;
  autoFocus?: boolean;
  ariaLabel?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Pesquisar...',
  maxWidth,
  className,
  onClear,
  autoFocus,
  ariaLabel = 'Pesquisar',
}: SearchBarProps) {
  const handleClear = () => {
    onChange('');
    if (onClear) onClear();
  };

  return (
    <div
      className={`${styles.wrapper} ${className || ''}`}
      style={maxWidth ? { maxWidth } : undefined}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={styles.input}
        autoFocus={autoFocus}
        aria-label={ariaLabel}
      />
      <div className={styles.searchIcon}>
        <SearchIcon size={18} />
      </div>
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className={styles.clearButton}
          aria-label="Limpar pesquisa"
          title="Limpar pesquisa"
        >
          <XIcon size={14} />
        </button>
      )}
    </div>
  );
}
