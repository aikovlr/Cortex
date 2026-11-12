'use client';

import React, { useEffect, useRef } from 'react';
import { TrophyIcon, TargetIcon, SparklesIcon, ZapIcon } from '@/components/common/Icons/Icons';
import styles from './XpCelebrationModal.module.css';

export interface XpCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  metaNome: string;
  xpGanho: number;
  novoNivel?: number;
  subiuDeNivel?: boolean;
}

export const XpCelebrationModal: React.FC<XpCelebrationModalProps> = ({
  isOpen,
  onClose,
  metaNome,
  xpGanho,
  novoNivel,
  subiuDeNivel,
}) => {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const isMouseDownOnOverlayRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;

    // Foca no botão para acessibilidade
    closeButtonRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      onMouseDown={(e) => {
        isMouseDownOnOverlayRef.current = e.target === e.currentTarget && e.button === 0;
      }}
      onMouseUp={(e) => {
        if (isMouseDownOnOverlayRef.current && e.target === e.currentTarget && e.button === 0) {
          onClose();
        }
        isMouseDownOnOverlayRef.current = false;
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebration-title"
    >
      <div
        className={styles.modalContent}
      >
        <div className={styles.trophyCircle} aria-hidden="true">
          {subiuDeNivel ? (
            <TrophyIcon size={40} color="var(--cortex-purple)" />
          ) : (
            <TargetIcon size={40} color="var(--cortex-purple)" />
          )}
        </div>

        <h2 id="celebration-title" className={styles.celebrationTitle}>
          {subiuDeNivel ? 'Novo Nível Alcançado!' : 'Meta de Equipe Concluída!'}
        </h2>

        <p className={styles.celebrationSubtitle}>
          Parabéns! Você e sua equipe concluíram a meta{' '}
          <span className={styles.metaHighlight}>&quot;{metaNome}&quot;</span>.
        </p>

        {subiuDeNivel && novoNivel && (
          <div className={styles.levelUpBanner} role="status">
            <SparklesIcon size={16} color="#ffffff" />
            <span>Parabéns! Você alcançou o Nível {novoNivel}!</span>
            <SparklesIcon size={16} color="#ffffff" />
          </div>
        )}

        <div className={styles.xpBadgeContainer}>
          <ZapIcon size={18} color="var(--cortex-purple)" />
          <span>+{xpGanho} XP</span>
        </div>

        <button
          ref={closeButtonRef}
          type="button"
          className={styles.actionButton}
          onClick={onClose}
        >
          Continuar
        </button>
      </div>
    </div>
  );
};

