'use client';

import React, { useEffect, useCallback, useRef, useId } from 'react';
import { XIcon } from '@/components/common/Icons/Icons';
import styles from './Modal.module.css';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const mouseDownOnOverlayRef = useRef(false);
  const titleId = useId();

  // Mantém a referência de onClose atualizada sem invalidar callbacks ou effects
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const handleOverlayMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Registra se o início do clique foi diretamente no backdrop externo com o botão esquerdo (0)
    mouseDownOnOverlayRef.current = e.target === e.currentTarget && e.button === 0;
  };

  const handleOverlayMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    // Só fecha se TANTO o mousedown QUANTO o mouseup ocorreram diretamente no backdrop com botão esquerdo
    // Impede fechamento acidental quando o usuário seleciona texto ou arrasta o mouse de dentro para fora
    if (mouseDownOnOverlayRef.current && e.target === e.currentTarget && e.button === 0) {
      onClose();
    }
    mouseDownOnOverlayRef.current = false;
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCloseRef.current();
      return;
    }

    // Prende o foco dentro do modal ao navegar com Tab (WCAG 2.1.2)
    if (e.key === 'Tab' && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement || document.activeElement === modalRef.current) {
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
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Salva o elemento que detinha o foco antes de abrir o modal
      previouslyFocusedElementRef.current = document.activeElement as HTMLElement | null;
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);

      // Desloca o foco para o primeiro campo interativo no corpo do modal (evitando focar no botão Fechar)
      const timer = setTimeout(() => {
        if (!modalRef.current) return;

        // Procura primeiro por input com autofocus ou primeiro campo editável no corpo do modal
        const bodyElement = modalRef.current.querySelector(`.${styles.body}`);
        const firstBodyInput = bodyElement?.querySelector<HTMLElement>(
          '[autofocus], input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [href]'
        );

        if (firstBodyInput) {
          firstBodyInput.focus();
        } else {
          // Fallback caso o modal não tenha elementos interativos no corpo
          const firstFocusable = modalRef.current.querySelector<HTMLElement>(
            'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href]'
          );
          if (firstFocusable) {
            firstFocusable.focus();
          } else {
            modalRef.current.focus();
          }
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
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      onMouseDown={handleOverlayMouseDown}
      onMouseUp={handleOverlayMouseUp}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={styles.modal}
        style={maxWidth ? { maxWidth } : undefined}
      >
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Fechar"
          >
            <XIcon size={18} />
          </button>
        </div>

        <div className={styles.body}>{children}</div>

        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  );
};
