'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import styles from './header.module.css';

export interface HeaderProps {
  titulo: string;
  subtitulo?: string;
  onToggleSidebar?: () => void;
}

export default function Header({ titulo, subtitulo = 'Workspace / Cortex', onToggleSidebar }: HeaderProps) {
  const [isDarkTheme, setIsDarkTheme] = useState(false);

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
          onClick={() => setIsDarkTheme(!isDarkTheme)}
          title={isDarkTheme ? 'Tema claro' : 'Tema escuro'}
          aria-label="Alternar tema"
        >
          <Image
            src={isDarkTheme ? '/sun.svg' : '/moon.svg'}
            alt="Tema"
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