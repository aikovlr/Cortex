'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { useNotifications, NotificacaoItem } from '@/contexts/NotificationContext';
import {
  FileTextIcon,
  AlertTriangleIcon,
  AlertCircleIcon,
  CheckIcon,
  LightbulbIcon,
  TrashIcon,
} from '@/components/common/Icons/Icons';
import styles from './header.module.css';

export interface HeaderProps {
  titulo: string;
  subtitulo?: string;
  onToggleSidebar?: () => void;
}

export default function Header({
  titulo,
  subtitulo = 'Workspace / Cortex',
  onToggleSidebar,
}: HeaderProps) {
  const { theme, toggleTheme } = useAccessibility();
  const {
    notificacoes,
    naoLidasCount,
    marcarComoLida,
    marcarTodasComoLidas,
    limparNotificacoes,
    removerNotificacao,
  } = useNotifications();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const isDark = theme === 'dark';

  // Fecha o dropdown de notificações ao clicar fora ou apertar Esc
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleNotificationClick = (item: NotificacaoItem) => {
    marcarComoLida(item.id);
    setIsOpen(false);
    if (item.link) {
      router.push(item.link);
    }
  };

  const formatRelativeTime = (isoDate: string) => {
    try {
      const now = new Date();
      const past = new Date(isoDate);
      const diffMs = now.getTime() - past.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMinutes < 1) return 'Agora mesmo';
      if (diffMinutes < 60) return `Há ${diffMinutes} min`;
      if (diffHours < 24) return `Há ${diffHours}h`;
      if (diffDays === 1) return 'Ontem';
      return past.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } catch {
      return '';
    }
  };

  const renderIcon = (tipo: NotificacaoItem['tipo']) => {
    switch (tipo) {
      case 'tarefa_vencida':
        return (
          <div className={`${styles.notificationIcon} ${styles.iconDestaque}`} title="Tarefa Vencida">
            <AlertCircleIcon size={18} />
          </div>
        );
      case 'ticket_criador':
        return (
          <div className={`${styles.notificationIcon} ${styles.iconDestaque}`} title="Ticket de Reporte">
            <AlertTriangleIcon size={18} />
          </div>
        );
      case 'tarefa_urgente':
      case 'tarefa':
        return (
          <div
            className={`${styles.notificationIcon} ${styles.iconTarefa}`}
            title={tipo === 'tarefa_urgente' ? 'Tarefa Urgente' : 'Tarefa'}
          >
            <FileTextIcon size={18} />
          </div>
        );
      case 'resposta_ticket':
        return (
          <div className={`${styles.notificationIcon} ${styles.iconTicket}`} title="Ticket">
            <AlertTriangleIcon size={18} />
          </div>
        );
      case 'sugestao':
        return (
          <div className={`${styles.notificationIcon} ${styles.iconSugestao}`} title="Sugestão">
            <LightbulbIcon size={18} />
          </div>
        );
      default:
        return (
          <div className={`${styles.notificationIcon} ${styles.iconTarefa}`}>
            <FileTextIcon size={18} />
          </div>
        );
    }
  };

  const renderTag = (tipo: NotificacaoItem['tipo']) => {
    switch (tipo) {
      case 'tarefa_vencida':
        return <span className={`${styles.notificationTag} ${styles.tagDestaque}`}>Vencida</span>;
      case 'ticket_criador':
        return <span className={`${styles.notificationTag} ${styles.tagDestaque}`}>Reporte Urgente</span>;
      case 'tarefa_urgente':
        return <span className={`${styles.notificationTag} ${styles.tagTarefa}`}>Urgente</span>;
      case 'tarefa':
        return <span className={`${styles.notificationTag} ${styles.tagTarefa}`}>Tarefa</span>;
      case 'resposta_ticket':
        return <span className={`${styles.notificationTag} ${styles.tagTicket}`}>Ticket</span>;
      case 'sugestao':
        return <span className={`${styles.notificationTag} ${styles.tagSugestao}`}>Sugestão</span>;
      default:
        return null;
    }
  };

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
        {/* Botão de Tema Claro / Escuro */}
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

        {/* Botão e Painel Flutuante de Notificações */}
        <div className={styles.notificationWrapper} ref={dropdownRef}>
          <button
            type="button"
            className={`${styles.iconButton} ${isOpen ? styles.iconButtonActive : ''}`}
            title="Notificações"
            aria-label={`Notificações${naoLidasCount > 0 ? ` (${naoLidasCount} não lidas)` : ''}`}
            aria-expanded={isOpen}
            onClick={() => setIsOpen((prev) => !prev)}
          >
            <Image src="/bell.svg" alt="Notificações" width={20} height={20} />
            {naoLidasCount > 0 && (
              <span className={styles.notificationBadge}>
                {naoLidasCount > 9 ? '9+' : naoLidasCount}
              </span>
            )}
          </button>

          {/* Container Flutuante */}
          {isOpen && (
            <div
              className={styles.notificationsDropdown}
              role="dialog"
              aria-label="Painel de Notificações"
            >
              <div className={styles.dropdownHeader}>
                <div className={styles.dropdownTitleRow}>
                  <h3 className={styles.dropdownTitle}>Notificações</h3>
                  {naoLidasCount > 0 && (
                    <span className={styles.dropdownCountBadge}>
                      {naoLidasCount} {naoLidasCount === 1 ? 'nova' : 'novas'}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  className={styles.markAllReadBtn}
                  onClick={marcarTodasComoLidas}
                  disabled={naoLidasCount === 0}
                  title={naoLidasCount === 0 ? 'Todas as notificações já estão lidas' : 'Marcar todas como lidas'}
                >
                  <CheckIcon size={14} />
                  Marcar todas como lidas
                </button>
              </div>

              {notificacoes.length === 0 ? (
                <div className={styles.emptyDropdown}>
                  <span className={styles.emptyDropdownIcon}>🔔</span>
                  <p className={styles.emptyDropdownTitle}>Nenhuma notificação por aqui</p>
                  <p className={styles.emptyDropdownSubtitle}>
                    Você receberá alertas quando tarefas, respostas de tickets ou sugestões forem atualizadas.
                  </p>
                </div>
              ) : (
                <div className={styles.notificationsList}>
                  {notificacoes.map((item) => {
                    const isVencidaOuReporte =
                      item.tipo === 'tarefa_vencida' || item.tipo === 'ticket_criador';
                    const isUrgente = item.tipo === 'tarefa_urgente';

                    return (
                      <div
                        key={item.id}
                        role="button"
                        tabIndex={0}
                        className={`${styles.notificationItem} ${
                          !item.lida ? styles.notificationItemUnread : ''
                        } ${isVencidaOuReporte ? styles.notificationItemDestaque : ''} ${
                          isUrgente ? styles.notificationItemUrgente : ''
                        }`}
                        onClick={() => handleNotificationClick(item)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleNotificationClick(item);
                          }
                        }}
                      >
                        {renderIcon(item.tipo)}

                        <div className={styles.notificationBody}>
                          <div className={styles.notificationMeta}>
                            {renderTag(item.tipo)}
                            <span className={styles.notificationTime}>
                              {formatRelativeTime(item.dataCriacao)}
                            </span>
                          </div>
                          <h4
                            className={`${styles.notificationTitle} ${
                              isVencidaOuReporte
                                ? styles.titleDestaque
                                : isUrgente
                                ? styles.titleUrgente
                                : ''
                            }`}
                          >
                            {item.titulo}
                          </h4>
                          <p className={styles.notificationMessage}>{item.mensagem}</p>
                        </div>

                        {!item.lida && (
                          <span
                            className={`${styles.unreadDot} ${
                              isVencidaOuReporte
                                ? styles.unreadDotDestaque
                                : isUrgente
                                ? styles.unreadDotUrgente
                                : ''
                            }`}
                            title="Não lida"
                          />
                        )}

                        <button
                          type="button"
                          className={styles.deleteNotificationBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            removerNotificacao(item.id);
                          }}
                          title="Remover notificação"
                          aria-label="Remover notificação"
                        >
                          <TrashIcon size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {notificacoes.length > 0 && (
                <div className={styles.dropdownFooter}>
                  <button
                    type="button"
                    className={styles.clearAllBtn}
                    onClick={limparNotificacoes}
                    title="Limpar todas as notificações"
                  >
                    <TrashIcon size={14} />
                    Limpar notificações
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
