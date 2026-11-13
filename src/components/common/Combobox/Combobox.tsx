'use client';

import React, { useState, useRef, useEffect, useId, useMemo, useCallback } from 'react';
import { SearchIcon, ChevronDownIcon, CheckIcon, XIcon } from '@/components/common/Icons/Icons';
import styles from './Combobox.module.css';

export interface ComboboxOption {
  value: string | number;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
}

export interface ComboboxProps {
  label?: string;
  options: ComboboxOption[];
  value: string | number | '';
  onChange: (value: string | number) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  clearable?: boolean;
  emptyMessage?: string;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
}

export const Combobox: React.FC<ComboboxProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Selecione uma opção...',
  searchPlaceholder = 'Pesquisar...',
  error,
  required,
  disabled = false,
  clearable = false,
  emptyMessage = 'Nenhum resultado encontrado.',
  className = '',
  style,
  id,
}) => {
  const generatedId = useId();
  const comboboxId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, '-') : generatedId);
  const errorId = error ? `${comboboxId}-error` : undefined;

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedOption = useMemo(() => {
    if (value === '' || value === undefined || value === null) return null;
    return options.find((opt) => String(opt.value) === String(value)) || null;
  }, [options, value]);

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const term = searchTerm
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    return options.filter((opt) => {
      const labelNorm = opt.label
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      const sublabelNorm = opt.sublabel
        ? opt.sublabel
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
        : '';
      return labelNorm.includes(term) || sublabelNorm.includes(term);
    });
  }, [options, searchTerm]);

  // Abre e fecha combobox
  const handleToggle = () => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
  };

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSearchTerm('');
    setActiveIndex(-1);
  }, []);

  // Foco automático no input de busca ao abrir
  useEffect(() => {
    if (isOpen) {
      // Pequeno timeout para garantir renderização do popover
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);

      const idx = filteredOptions.findIndex((opt) => String(opt.value) === String(value));
      setActiveIndex(idx >= 0 ? idx : 0);

      return () => clearTimeout(timer);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fechar ao clicar fora
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, handleClose]);

  // Rolar para opção ativa se necessário
  useEffect(() => {
    if (isOpen && activeIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.children[activeIndex] as HTMLElement | undefined;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeIndex, isOpen]);

  const handleSelectOption = (optValue: string | number) => {
    onChange(optValue);
    handleClose();
    triggerRef.current?.focus();
  };

  const handleClear = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    onChange('');
    triggerRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredOptions.length > 0 && activeIndex >= 0 && activeIndex < filteredOptions.length) {
          handleSelectOption(filteredOptions[activeIndex].value);
        }
        break;
      case 'Escape':
        e.preventDefault();
        handleClose();
        triggerRef.current?.focus();
        break;
      default:
        break;
    }
  };

  return (
    <div className={`${styles.container} ${className}`} style={style} ref={containerRef}>
      {label && (
        <label htmlFor={`${comboboxId}-trigger`} className={styles.label}>
          {label}
        </label>
      )}

      <div className={styles.wrapper}>
        <button
          ref={triggerRef}
          id={`${comboboxId}-trigger`}
          type="button"
          disabled={disabled}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-describedby={errorId}
          className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ''} ${
            error ? styles.triggerError : ''
          } ${disabled ? styles.triggerDisabled : ''}`}
        >
          <div className={styles.selectedContent}>
            {selectedOption ? (
              <>
                {selectedOption.icon}
                <span className={styles.selectedLabel}>{selectedOption.label}</span>
                {selectedOption.sublabel && (
                  <span className={styles.selectedSublabel}>({selectedOption.sublabel})</span>
                )}
              </>
            ) : (
              <span className={styles.placeholder}>{placeholder}</span>
            )}
          </div>

          <div className={styles.triggerIcons}>
            {clearable && selectedOption && !disabled && (
              <span
                role="button"
                tabIndex={0}
                className={styles.clearButton}
                onClick={handleClear}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    handleClear(e);
                  }
                }}
                aria-label="Limpar seleção"
                title="Limpar seleção"
              >
                <XIcon size={14} />
              </span>
            )}
            <span className={`${styles.chevronIcon} ${isOpen ? styles.chevronOpen : ''}`}>
              <ChevronDownIcon size={16} />
            </span>
          </div>
        </button>

        {isOpen && (
          <div className={styles.dropdown} role="presentation">
            <div className={styles.searchBox}>
              <div className={styles.searchIcon}>
                <SearchIcon size={14} />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                className={styles.searchInput}
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleKeyDown}
                aria-label={searchPlaceholder}
              />
              {searchTerm && (
                <button
                  type="button"
                  className={styles.clearButton}
                  onClick={() => setSearchTerm('')}
                  aria-label="Limpar busca"
                >
                  <XIcon size={12} />
                </button>
              )}
            </div>

            <ul
              ref={listRef}
              id={`${comboboxId}-listbox`}
              role="listbox"
              className={styles.optionsList}
              aria-label={label || 'Opções'}
            >
              {filteredOptions.length === 0 ? (
                <li className={styles.emptyState}>{emptyMessage}</li>
              ) : (
                filteredOptions.map((opt, idx) => {
                  const isSelected = String(opt.value) === String(value);
                  const isFocused = idx === activeIndex;

                  return (
                    <li
                      key={opt.value}
                      role="option"
                      aria-selected={isSelected}
                      className={`${styles.optionItem} ${
                        isSelected ? styles.optionItemSelected : ''
                      } ${isFocused ? styles.optionItemFocused : ''}`}
                      onClick={() => handleSelectOption(opt.value)}
                      onMouseEnter={() => setActiveIndex(idx)}
                    >
                      <div className={styles.optionTextWrapper}>
                        <span className={styles.optionLabel}>{opt.label}</span>
                        {opt.sublabel && (
                          <span className={styles.optionSublabel}>{opt.sublabel}</span>
                        )}
                      </div>

                      {isSelected && (
                        <div className={styles.checkIconWrapper}>
                          <CheckIcon size={16} />
                        </div>
                      )}
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}
      </div>

      {error && (
        <span id={errorId} role="alert" className={styles.errorMessage}>
          {error}
        </span>
      )}
    </div>
  );
};

