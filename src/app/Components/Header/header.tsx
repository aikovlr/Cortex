'use client';

import React from 'react';
import Image from 'next/image';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import styles from './header.module.css';

export interface HeaderProps {
  titulo: string;
  subtitulo?: string;
  onToggleSidebar?: () => void;
}

export default function Header({ titulo, subtitulo = 'Workspace / Cortex', onToggleSidebar }: HeaderProps) {
  const { theme, toggleTheme } = useAccessibility();
  const isDark = theme === 'dark';

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        {onToggleSidebar && (
          <button
            type="button"
            className={styles.toggleButton}
            onClick={onToggleSidebar}
            aria-label="Alternar barra lateral"
          >
            <Image
              src="/layout-sidebar-right-expand.svg"
              alt="Menu"
              width={24}
              height={24}
            />
          </button>
        )}

        <div className={styles.titulo}>
          <span className={styles.breadcrumb}>{subtitulo}</span>
          <h1 className={styles.pageTitle}>{titulo}</h1>
        </div>
      </div>

      <div className={styles.rightSection}>
        <button
          type="button"
          className={styles.iconButton}
          onClick={toggleTheme}
          title={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
          aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
        >
          <Image
            src={isDark ? '/sun.svg' : '/moon.svg'}
            alt={isDark ? 'Ícone de sol para ativar modo claro' : 'Ícone de lua para ativar modo escuro'}
            width={20}
            height={20}
          />
        </button>

        <button
          type="button"
          className={styles.iconButton}
          title="Notificações"
          aria-label="Notificações"
        >
          <Image src="/bell.svg" alt="Notificações" width={20} height={20} />
          <span className={styles.notificationBadge} />
        </button>
      </div>
    </header>
  );
}
