'use client';

import React, { useState, useEffect, useCallback, useRef, useId } from 'react';
import {
  AlertTriangleIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  ShieldIcon,
  XIcon,
} from '@/components/common/Icons/Icons';
import { Button } from '@/components/common/Button/Button';
import styles from './CriticalActionDialog.module.css';

export type CriticalActionVariant = 'danger' | 'warning' | 'info' | 'success';

export interface CriticalActionDialogProps {
  /** Se o diálogo está visível */
  isOpen: boolean;
  /** Callback para fechar ou cancelar o diálogo */
  onClose: () => void;
  /** Ação de confirmação crítica. Pode retornar uma Promise para gerenciar loading automático */
  onConfirm: () => void | Promise<void>;
  /** Nível de severidade/natureza da ação (determina cores e ícones padrão) */
  variant?: CriticalActionVariant;
  /** Título principal do diálogo */
  title: string;
  /** Descrição explicativa do impacto da ação */
  description: React.ReactNode;
  /** Rótulo do botão de confirmação (ex: "Excluir permanentemente", "Resolver ticket") */
  confirmLabel?: string;
  /** Rótulo do botão de cancelamento (padrão: "Cancelar") */
  cancelLabel?: string;
  /** Conteúdo visual ou bloco detalhado com informações do item afetado */
  details?: React.ReactNode;
  /** Ícone customizado para o cabeçalho (substitui o ícone padrão da variante) */
  icon?: React.ReactNode;
  /** Texto que o usuário é obrigado a digitar para liberar a confirmação (ex: "EXCLUIR" ou o nome do recurso) */
  confirmTextMatch?: string;
  /** Placeholder do campo de texto de confirmação */
  confirmTextPlaceholder?: string;
  /** Instrução personalizada acima do campo de digitação */
  confirmTextLabel?: string;
  /** Estado de carregamento explícito (se não passado, infere automaticamente da Promise de onConfirm) */
  loading?: boolean;
  /** Desabilita o botão de confirmação */
  disabled?: boolean;
  /** Permite fechar clicando no backdrop escuro (padrão: false para segurança contra cliques acidentais) */
  closeOnOverlayClick?: boolean;
  /** Largura máxima customizada (padrão: 520px) */
  maxWidth?: string;
}

export const CriticalActionDialog: React.FC<CriticalActionDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  variant = 'danger',
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancelar',
  details,
  icon,
  confirmTextMatch,
  confirmTextPlaceholder,
  confirmTextLabel,
  loading: externalLoading,
  disabled = false,
  closeOnOverlayClick = false,
  maxWidth,
}) => {
  const [typedConfirmation, setTypedConfirmation] = useState('');
  const [internalLoading, setInternalLoading] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const mouseDownOnOverlayRef = useRef(false);

  const titleId = useId();
  const descId = useId();

  const isLoading = externalLoading !== undefined ? externalLoading : internalLoading;

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Reseta o texto digitado ao abrir ou fechar
  useEffect(() => {
    if (!isOpen) {
      setTypedConfirmation('');
      setInternalLoading(false);
    }
  }, [isOpen]);

  // Validação do texto de confirmação caso exigido
  const isMatchValid = !confirmTextMatch || typedConfirmation.trim() === confirmTextMatch.trim();
  const isConfirmDisabled = disabled || isLoading || !isMatchValid;

  const handleConfirm = async () => {
    if (isConfirmDisabled) return;

    try {
      const result = onConfirm();
      if (result instanceof Promise) {
        setInternalLoading(true);
        await result;
      }
    } finally {
      setInternalLoading(false);
    }
  };

  const handleOverlayMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!closeOnOverlayClick || isLoading) return;
    mouseDownOnOverlayRef.current = e.target === e.currentTarget && e.button === 0;
  };

  const handleOverlayMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!closeOnOverlayClick || isLoading) return;
    if (mouseDownOnOverlayRef.current && e.target === e.currentTarget && e.button === 0) {
      onClose();
    }
    mouseDownOnOverlayRef.current = false;
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!isLoading) {
          onCloseRef.current();
        }
        return;
      }

      // Atalho Enter para submissão direta se não houver campo de texto ou se o texto for válido
      if (e.key === 'Enter' && !isLoading && !isConfirmDisabled) {
        const isFocusedInTextarea = document.activeElement?.tagName === 'TEXTAREA';
        if (!isFocusedInTextarea) {
          e.preventDefault();
          handleConfirm();
          return;
        }
      }

      // Focus trap
      if (e.key === 'Tab' && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement || document.activeElement === dialogRef.current) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isLoading, isConfirmDisabled]
  );

  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElementRef.current = document.activeElement as HTMLElement | null;
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);

      // Gerencia o foco inicial com segurança para ações perigosas
      const timer = setTimeout(() => {
        if (confirmTextMatch && inputRef.current) {
          inputRef.current.focus();
        } else if (variant === 'danger' && cancelButtonRef.current) {
          // Segurança WAI-ARIA: foca no Cancelar para evitar execução de exclusão por reflexo
          cancelButtonRef.current.focus();
        } else if (dialogRef.current) {
          const firstFocusable = dialogRef.current.querySelector<HTMLElement>(
            'button:not([disabled]), input:not([disabled])'
          );
          firstFocusable?.focus();
        }
      }, 50);

      return () => {
        clearTimeout(timer);
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleKeyDown);
        if (previouslyFocusedElementRef.current && typeof previouslyFocusedElementRef.current.focus === 'function') {
          previouslyFocusedElementRef.current.focus();
        }
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen, handleKeyDown, confirmTextMatch, variant]);

  if (!isOpen) return null;

  // Ícone padrão por variante
  const defaultIcon = () => {
    switch (variant) {
      case 'danger':
        return <AlertTriangleIcon size={24} strokeWidth={2.2} />;
      case 'warning':
        return <AlertCircleIcon size={24} strokeWidth={2.2} />;
      case 'info':
        return <ShieldIcon size={24} strokeWidth={2} />;
      case 'success':
        return <CheckCircleIcon size={24} strokeWidth={2.2} />;
    }
  };

  // Rótulo padrão de confirmação por variante
  const resolvedConfirmLabel =
    confirmLabel ||
    (variant === 'danger'
      ? 'Confirmar e excluir'
      : variant === 'warning'
      ? 'Rejeitar'
      : variant === 'success'
      ? 'Marcar como resolvido'
      : 'Salvar alterações');

  // Render do botão de confirmação conforme variante
  const renderConfirmButton = () => {
    if (variant === 'danger') {
      return (
        <Button
          variant="danger"
          onClick={handleConfirm}
          loading={isLoading}
          disabled={isConfirmDisabled}
        >
          {resolvedConfirmLabel}
        </Button>
      );
    }

    if (variant === 'success') {
      return (
        <Button
          variant="primary"
          className={styles.successButton}
          onClick={handleConfirm}
          loading={isLoading}
          disabled={isConfirmDisabled}
        >
          {resolvedConfirmLabel}
        </Button>
      );
    }

    if (variant === 'warning') {
      return (
        <Button
          variant="danger"
          className={styles.warningButton}
          onClick={handleConfirm}
          loading={isLoading}
          disabled={isConfirmDisabled}
        >
          {resolvedConfirmLabel}
        </Button>
      );
    }

    return (
      <Button
        variant="primary"
        onClick={handleConfirm}
        loading={isLoading}
        disabled={isConfirmDisabled}
      >
        {resolvedConfirmLabel}
      </Button>
    );
  };

  return (
    <div
      className={styles.overlay}
      onMouseDown={handleOverlayMouseDown}
      onMouseUp={handleOverlayMouseUp}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        className={styles.dialog}
        style={maxWidth ? { maxWidth } : undefined}
      >
        <div className={styles.header}>
          <div className={`${styles.iconWrapper} ${styles[variant]}`} aria-hidden="true">
            {icon || defaultIcon()}
          </div>

          <div className={styles.headerText}>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            <div id={descId} className={styles.description}>
              {description}
            </div>
          </div>

          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            disabled={isLoading}
            aria-label="Fechar diálogo"
          >
            <XIcon size={16} />
          </button>
        </div>

        <div className={styles.body}>
          {details && (
            <div className={`${styles.detailsCard} ${styles[variant]}`}>
              {details}
            </div>
          )}

          {confirmTextMatch && (
            <div className={styles.confirmInputSection}>
              <label htmlFor="critical-confirm-input" className={styles.confirmInputLabel}>
                {confirmTextLabel || (
                  <>
                    Para confirmar, digite <span className={styles.codeMatch}>{confirmTextMatch}</span> abaixo:
                  </>
                )}
              </label>
              <input
                id="critical-confirm-input"
                ref={inputRef}
                type="text"
                autoComplete="off"
                spellCheck="false"
                placeholder={confirmTextPlaceholder || confirmTextMatch}
                value={typedConfirmation}
                onChange={(e) => setTypedConfirmation(e.target.value)}
                disabled={isLoading}
                className={`${styles.confirmInput} ${
                  typedConfirmation.trim() === confirmTextMatch.trim() ? styles.confirmInputMatched : ''
                }`}
              />
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <Button
            ref={cancelButtonRef}
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          {renderConfirmButton()}
        </div>
      </div>
    </div>
  );
};

