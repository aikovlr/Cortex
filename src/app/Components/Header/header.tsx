'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { useNotifications, NotificacaoItem } from '@/contexts/NotificationContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useAuth } from '@/contexts/AuthContext';
import { AccountLevelWidget } from '@/components/gamification/AccountLevelWidget/AccountLevelWidget';
import {
  FileTextIcon,
  AlertTriangleIcon,
  AlertCircleIcon,
  CheckIcon,
  CheckCircleIcon,
  LightbulbIcon,
  TrashIcon,
  UsersIcon,
  TargetIcon,
  ClipboardTextIcon,
  ClipboardDataIcon,
  ChevronDownIcon,
} from '@/components/common/Icons/Icons';
import styles from './header.module.css';

export interface BreadcrumbOption {
  label: string;
  href: string;
  icon?: string;
  descricao?: string;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  options?: BreadcrumbOption[];
}

export interface HeaderProps {
  titulo: string;
  subtitulo?: string;
  breadcrumbs?: BreadcrumbItem[];
  onToggleSidebar?: () => void;
}

const WORKSPACE_MODULES: BreadcrumbOption[] = [
  {
    label: 'Minhas tarefas',
    href: '/minhas-tarefas',
    icon: '/clipboard-text.svg',
    descricao: 'Painel de tarefas pessoais e fluxo de trabalho',
  },
  {
    label: 'Tarefas atribuídas',
    href: '/tarefas-atribuidas',
    icon: '/clipboard-data.svg',
    descricao: 'Tarefas delegadas e acompanhamento',
  },
  {
    label: 'Equipes',
    href: '/equipes',
    icon: '/users.svg',
    descricao: 'Gestão de membros, grupos e tickets',
  },
  {
    label: 'Metas',
    href: '/metas',
    icon: '/target.svg',
    descricao: 'Objetivos estratégicos e progresso',
  },
  {
    label: 'Relatórios',
    href: '/relatorios',
    icon: '/chart-bar.svg',
    descricao: 'Métricas, desempenho e exportação',
  },
  {
    label: 'Configurações',
    href: '/configuracoes',
    icon: '/adjustments-horizontal.svg',
    descricao: 'Preferências do sistema, tema e perfil',
  },
];

export default function Header({
  titulo,
  subtitulo,
  breadcrumbs,
  onToggleSidebar,
}: HeaderProps) {
  const { theme, toggleTheme } = useAccessibility();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const handleToggleSidebar = onToggleSidebar || toggleSidebar;
  const { usuario } = useAuth();
  const {
    notificacoes,
    naoLidasCount,
    marcarComoLida,
    marcarTodasComoLidas,
    limparNotificacoes,
    removerNotificacao,
    buscarNovasNotificacoes,
  } = useNotifications();
  const router = useRouter();
  const pathname = usePathname();

  const breadcrumbItems: BreadcrumbItem[] = useMemo(() => {
    if (breadcrumbs && breadcrumbs.length > 0) {
      return breadcrumbs;
    }

    // 1. Workspace: texto plano, sem link e sem dropdown
    // 2. Cortex: link para a página inicial (/), único com a seta para baixo e menu de navegação
    const items: BreadcrumbItem[] = [
      {
        label: 'Workspace',
      },
      {
        label: 'Cortex',
        href: '/',
        options: WORKSPACE_MODULES,
      },
    ];

    if (pathname) {
      if (pathname.startsWith('/equipes/') && pathname !== '/equipes') {
        items.push({
          label: 'Equipes',
          href: '/equipes',
        });
      } else if (pathname.startsWith('/minhas-tarefas/') && pathname !== '/minhas-tarefas') {
        items.push({
          label: 'Minhas tarefas',
          href: '/minhas-tarefas',
        });
      } else if (pathname.startsWith('/tarefas-atribuidas/') && pathname !== '/tarefas-atribuidas') {
        items.push({
          label: 'Tarefas atribuídas',
          href: '/tarefas-atribuidas',
        });
      }
    }

    if (
      subtitulo &&
      subtitulo !== 'Workspace / Cortex' &&
      subtitulo !== 'Workspace / Cortex / Equipes'
    ) {
      const parts = subtitulo
        .split('/')
        .map((p) => p.trim())
        .filter(
          (p) =>
            p.length > 0 &&
            p.toLowerCase() !== 'workspace' &&
            p.toLowerCase() !== 'cortex'
        );

      parts.forEach((part) => {
        if (!items.some((it) => it.label.toLowerCase() === part.toLowerCase())) {
          items.push({ label: part });
        }
      });
    }

    if (!items.some((it) => it.label.toLowerCase() === titulo.toLowerCase())) {
      items.push({
        label: titulo,
        href: pathname || undefined,
      });
    }

    return items;
  }, [breadcrumbs, pathname, subtitulo, titulo]);

  const [openBreadcrumbIndex, setOpenBreadcrumbIndex] = useState<number | null>(null);
  const breadcrumbNavRef = useRef<HTMLElement | null>(null);

  // Fecha dropdown do breadcrumb ao trocar de rota
  useEffect(() => {
    setOpenBreadcrumbIndex(null);
  }, [pathname]);

  // Fecha dropdown de breadcrumb ao clicar fora ou apertar Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        breadcrumbNavRef.current &&
        !breadcrumbNavRef.current.contains(event.target as Node)
      ) {
        setOpenBreadcrumbIndex(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpenBreadcrumbIndex(null);
      }
    }

    if (openBreadcrumbIndex !== null) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openBreadcrumbIndex]);

  const [isOpen, setIsOpen] = useState(false);
  const [filtro, setFiltro] = useState<'naoLidas' | 'todas'>('naoLidas');
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
      let finalLink = item.link;

      // Se for notificação de meta, adiciona parâmetros de metaNome/metaId/tab e highlight
      if (item.tipo === 'meta' || (item.tipo as string) === 'meta_expirada' || item.link?.includes('/metas') || item.titulo?.toLowerCase().includes('meta')) {
        if (!finalLink.includes('metaId=') && !finalLink.includes('metaNome=')) {
          const match =
            item.mensagem.match(/["'“]([^"'”]+)["'”]/) ||
            item.titulo.match(/["'“]([^"'”]+)["'”]/);
          if (match && match[1]) {
            const sep = finalLink.includes('?') ? '&' : '?';
            finalLink = `${finalLink}${sep}metaNome=${encodeURIComponent(match[1])}`;
          }
        }
        if (
          !finalLink.includes('tab=') &&
          (item.titulo.toLowerCase().includes('equipe') ||
            item.mensagem.toLowerCase().includes('equipe'))
        ) {
          const sep = finalLink.includes('?') ? '&' : '?';
          finalLink = `${finalLink}${sep}tab=equipes`;
        }
        if (!finalLink.includes('highlight=')) {
          const sep = finalLink.includes('?') ? '&' : '?';
          finalLink = `${finalLink}${sep}highlight=true`;
        }
      } else if (item.tarefaId && !finalLink.includes('highlight=')) {
        const sep = finalLink.includes('?') ? '&' : '?';
        finalLink = `${finalLink}${sep}highlight=true`;
      }

      router.push(finalLink);
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

  const isTicketReporteItem = (item: NotificacaoItem) => {
    return (
      item.tipo === 'ticket_criador' ||
      (item.tipo === 'ticket' &&
        (Boolean(item.destaque) ||
          item.titulo?.toLowerCase().includes('reporte') ||
          item.titulo?.toLowerCase().includes('aberto'))) ||
      Boolean(item.titulo?.toLowerCase().includes('ticket de reporte'))
    );
  };

  const isPenalidadeXpMetaItem = (item: NotificacaoItem) => {
    return (
      item.tipo === 'meta_expirada' ||
      Boolean(item.titulo?.toLowerCase().includes('penalidade')) ||
      Boolean(item.titulo?.toLowerCase().includes('meta expirada')) ||
      Boolean(item.mensagem?.toLowerCase().includes('deduzidos')) ||
      Boolean(item.mensagem?.toLowerCase().includes('penalidade'))
    );
  };

  const isMetaNotificationItem = (item: NotificacaoItem) => {
    return (
      isPenalidadeXpMetaItem(item) ||
      item.tipo === 'meta' ||
      (item.tipo as string) === 'meta_expirada' ||
      Boolean(item.titulo?.toLowerCase().includes('meta')) ||
      Boolean(item.link?.includes('/metas'))
    );
  };

  const renderIcon = (item: NotificacaoItem) => {
    if (isPenalidadeXpMetaItem(item)) {
      return (
        <div className={`${styles.notificationIcon} ${styles.iconMetaPenalidade}`} title="Meta">
          <TargetIcon size={18} />
        </div>
      );
    }

    if (isMetaNotificationItem(item)) {
      return (
        <div className={`${styles.notificationIcon} ${styles.iconMeta}`} title="Meta">
          <TargetIcon size={18} />
        </div>
      );
    }

    if (isTicketReporteItem(item)) {
      return (
        <div className={`${styles.notificationIcon} ${styles.iconDestaque}`} title="Ticket de Reporte">
          <AlertTriangleIcon size={18} />
        </div>
      );
    }

    switch (item.tipo) {
      case 'tarefa_vencida':
        return (
          <div className={`${styles.notificationIcon} ${styles.iconDestaque}`} title="Tarefa Vencida">
            <ClipboardTextIcon size={18} />
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
            title={item.tipo === 'tarefa_urgente' ? 'Tarefa Urgente' : 'Tarefa'}
          >
            {item.link?.includes('tarefas-atribuidas') ? (
              <ClipboardDataIcon size={18} />
            ) : (
              <ClipboardTextIcon size={18} />
            )}
          </div>
        );
      case 'resposta_ticket':
      case 'ticket':
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
      case 'equipe':
        return (
          <div className={`${styles.notificationIcon} ${styles.iconEquipe}`} title="Equipe">
            <UsersIcon size={18} />
          </div>
        );
      case 'meta':
        return (
          <div className={`${styles.notificationIcon} ${styles.iconMeta}`} title="Meta">
            <TargetIcon size={18} />
          </div>
        );
      default:
        return (
          <div className={`${styles.notificationIcon} ${styles.iconTarefa}`}>
            <ClipboardTextIcon size={18} />
          </div>
        );
    }
  };

  const renderTag = (item: NotificacaoItem) => {
    if (isPenalidadeXpMetaItem(item)) {
      return <span className={`${styles.notificationTag} ${styles.tagMetaPenalidade}`}>Meta</span>;
    }

    if (isMetaNotificationItem(item)) {
      return <span className={`${styles.notificationTag} ${styles.tagMeta}`}>Meta</span>;
    }

    if (isTicketReporteItem(item)) {
      return <span className={`${styles.notificationTag} ${styles.tagDestaque}`}>Reporte Urgente</span>;
    }

    switch (item.tipo) {
      case 'tarefa_vencida':
        return <span className={`${styles.notificationTag} ${styles.tagDestaque}`}>Vencida</span>;
      case 'ticket_criador':
        return <span className={`${styles.notificationTag} ${styles.tagDestaque}`}>Reporte Urgente</span>;
      case 'tarefa_urgente':
        return <span className={`${styles.notificationTag} ${styles.tagTarefa}`}>Urgente</span>;
      case 'tarefa':
        return <span className={`${styles.notificationTag} ${styles.tagTarefa}`}>Tarefa</span>;
      case 'resposta_ticket':
      case 'ticket':
        return <span className={`${styles.notificationTag} ${styles.tagTicket}`}>Ticket</span>;
      case 'sugestao':
        return <span className={`${styles.notificationTag} ${styles.tagSugestao}`}>Sugestão</span>;
      case 'equipe':
        return <span className={`${styles.notificationTag} ${styles.tagEquipe}`}>Equipe</span>;
      case 'meta':
        return <span className={`${styles.notificationTag} ${styles.tagMeta}`}>Meta</span>;
      default:
        return null;
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <button
          type="button"
          className={styles.toggleButton}
          onClick={handleToggleSidebar}
          title={isCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
          aria-label={isCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
        >
          <Image
            src={isCollapsed ? '/layout-sidebar-right-expand.svg' : '/layout-sidebar-right-collapse.svg'}
            alt=""
            width={24}
            height={24}
          />
        </button>

        <div className={styles.titulo}>
          <nav
            ref={breadcrumbNavRef}
            aria-label="Trilha de navegação estrutural estilo explorador de arquivos"
            className={styles.breadcrumbNav}
          >
            <ol className={styles.breadcrumb}>
              {breadcrumbItems.map((item, index) => {
                const isLast = index === breadcrumbItems.length - 1;
                const isDropdownOpen = openBreadcrumbIndex === index;
                const hasOptions = !!item.options && item.options.length > 0;
                const isWorkspace = item.label.toLowerCase() === 'workspace';
                const isClickable = !isWorkspace && !isLast && !!item.href;

                // Em telas móveis, exibe no máximo 2 caminhos (o penúltimo e o último) para evitar overflow
                const isHiddenMobile = breadcrumbItems.length > 2 && index < breadcrumbItems.length - 2;
                const isFirstVisibleMobile =
                  breadcrumbItems.length > 2
                    ? index === breadcrumbItems.length - 2
                    : index === 0 || (index === 1 && breadcrumbItems[0]?.label.toLowerCase() === 'workspace');

                return (
                  <li
                    key={`${item.label}-${index}`}
                    className={`${styles.breadcrumbItem} ${isWorkspace ? styles.breadcrumbWorkspace : ''} ${
                      isHiddenMobile ? styles.breadcrumbItemHiddenMobile : ''
                    } ${breadcrumbItems.length > 2 ? styles.breadcrumbItemTwoItems : styles.breadcrumbItemSingle}`}
                  >
                    {index > 0 && (
                      <span
                        className={`${styles.breadcrumbSeparator} ${
                          index === 1 && breadcrumbItems[0]?.label.toLowerCase() === 'workspace'
                            ? styles.separatorAfterWorkspace
                            : ''
                        } ${
                          isFirstVisibleMobile ? styles.separatorFirstMobile : ''
                        }`}
                        aria-hidden="true"
                      >
                        /
                      </span>
                    )}
                    <div className={styles.breadcrumbSegment}>
                      {isClickable ? (
                        <Link
                          href={item.href!}
                          className={styles.breadcrumbLink}
                          {...(isLast ? { 'aria-current': 'page' as const } : {})}
                          onClick={() => setOpenBreadcrumbIndex(null)}
                          title={item.label}
                        >
                          {item.label}
                        </Link>
                      ) : (
                        <span
                          className={isLast ? styles.breadcrumbCurrentText : styles.breadcrumbStaticText}
                          {...(isLast ? { 'aria-current': 'page' as const } : {})}
                          title={item.label}
                        >
                          {item.label}
                        </span>
                      )}

                      {hasOptions && (
                        <button
                          type="button"
                          className={`${styles.breadcrumbChevronBtn} ${
                            isDropdownOpen ? styles.breadcrumbChevronOpen : ''
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenBreadcrumbIndex((prev) => (prev === index ? null : index));
                          }}
                          aria-expanded={isDropdownOpen}
                          aria-haspopup="menu"
                          aria-label={`Listar subpastas e páginas de ${item.label}`}
                          title={`Listar opções de ${item.label}`}
                        >
                          <ChevronDownIcon size={12} strokeWidth={2.5} />
                        </button>
                      )}
                    </div>

                    {/* Menu Dropdown Suspenso no estilo Windows Explorer / VS Code */}
                    {hasOptions && isDropdownOpen && (
                      <>
                        <div
                          className={styles.breadcrumbBackdropMobile}
                          onClick={() => setOpenBreadcrumbIndex(null)}
                          aria-hidden="true"
                        />
                        <div
                          className={styles.breadcrumbDropdown}
                          role="menu"
                          aria-label={`Menu de navegação para ${item.label}`}
                        >
                          <div className={styles.dropdownHeaderMini}>
                            <span>{item.label}</span>
                          </div>
                          <div
                            className={`${styles.dropdownList} ${
                              (item.options?.length ?? 0) > 6
                                ? styles.dropdownListScrollable
                                : ''
                            }`}
                          >
                            {item.options?.map((opt) => {
                              const isCurrent =
                                pathname === opt.href ||
                                (opt.href !== '/minhas-tarefas' &&
                                  pathname?.startsWith(opt.href));

                              return (
                                <Link
                                  key={opt.href}
                                  href={opt.href}
                                  className={`${styles.dropdownItem} ${
                                    isCurrent ? styles.dropdownItemActive : ''
                                  }`}
                                  role="menuitem"
                                  onClick={() => setOpenBreadcrumbIndex(null)}
                                >
                                  {opt.icon && (
                                    <div className={styles.dropdownItemIcon}>
                                      <Image src={opt.icon} alt="" width={16} height={16} />
                                    </div>
                                  )}
                                  <div className={styles.dropdownItemContent}>
                                    <span className={styles.dropdownItemLabel}>
                                      {opt.label}
                                    </span>
                                    {opt.descricao && (
                                      <span className={styles.dropdownItemDesc}>
                                        {opt.descricao}
                                      </span>
                                    )}
                                  </div>
                                  {isCurrent && (
                                    <span className={styles.dropdownItemBadge}>
                                      Atual
                                    </span>
                                  )}
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
          <h1 className={styles.pageTitle}>{titulo}</h1>
        </div>
      </div>

      <div className={styles.rightSection}>
        {usuario && (
          <AccountLevelWidget
            nivel={usuario.nivel}
            experiencia={usuario.experiencia}
            variant="compact"
          />
        )}

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
            title="Central de Notificações"
            aria-label={`Central de Notificações${naoLidasCount > 0 ? ` (${naoLidasCount} não lidas)` : ''}`}
            aria-expanded={isOpen}
            onClick={() => {
              setIsOpen((prev) => {
                const next = !prev;
                if (next) {
                  buscarNovasNotificacoes();
                  setFiltro('naoLidas');
                }
                return next;
              });
            }}
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
              aria-label="Central de Notificações"
            >
              <div className={styles.dropdownHeader}>
                <div className={styles.dropdownTitleRow}>
                  <h3 className={styles.dropdownTitle}>Notificações</h3>
                  {naoLidasCount > 0 && (
                    <span className={styles.dropdownCountBadge}>
                      {naoLidasCount} {naoLidasCount === 1 ? 'não lida' : 'não lidas'}
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

              {/* Abas: Não Lidas vs Todas */}
              <div className={styles.dropdownTabs}>
                <button
                  type="button"
                  className={`${styles.dropdownTabBtn} ${filtro === 'naoLidas' ? styles.dropdownTabBtnActive : ''}`}
                  onClick={() => setFiltro('naoLidas')}
                  title="Ver apenas notificações não lidas"
                >
                  Não Lidas
                  {naoLidasCount > 0 && <span className={styles.tabBadge}>{naoLidasCount}</span>}
                </button>
                <button
                  type="button"
                  className={`${styles.dropdownTabBtn} ${filtro === 'todas' ? styles.dropdownTabBtnActive : ''}`}
                  onClick={() => setFiltro('todas')}
                  title="Ver todas as notificações"
                >
                  Todas
                </button>
              </div>

              {notificacoes.length === 0 ? (
                <div className={styles.emptyDropdown}>
                  <div className={styles.emptyDropdownIcon}>
                    <Image src="/bell.svg" alt="" width={32} height={32} />
                  </div>
                  <p className={styles.emptyDropdownTitle}>Nenhuma notificação por aqui</p>
                  <p className={styles.emptyDropdownSubtitle}>
                    Seu histórico está vazio. Você receberá alertas quando tarefas, respostas de tickets ou sugestões forem atualizadas.
                  </p>
                </div>
              ) : filtro === 'naoLidas' && notificacoes.filter((n) => !n.lida).length === 0 ? (
                <div className={styles.emptyDropdown}>
                  <div className={styles.emptyDropdownIconCheck}>
                    <CheckIcon size={28} />
                  </div>
                  <p className={styles.emptyDropdownTitle}>Tudo em dia!</p>
                  <p className={styles.emptyDropdownSubtitle}>
                    Você não possui notificações não lidas. Acesse a aba <strong>Todas</strong> para consultar notificações anteriores.
                  </p>
                </div>
              ) : (
                <div className={styles.notificationsList}>
                  {(filtro === 'naoLidas' ? notificacoes.filter((n) => !n.lida) : notificacoes).map((item) => {
                    const isPenalidade = isPenalidadeXpMetaItem(item);
                    const isVencidaOuReporte =
                      !isPenalidade &&
                      (item.tipo === 'tarefa_vencida' ||
                        isTicketReporteItem(item) ||
                        Boolean(item.destaque));
                    const isUrgente = item.tipo === 'tarefa_urgente';
                    const stackMatch = item.titulo.match(/\((\d+)\)$/);
                    const stackCount = stackMatch ? stackMatch[1] : null;
                    const tituloFormatado = stackMatch ? item.titulo.replace(/\s*\(\d+\)$/, '') : item.titulo;

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
                        {renderIcon(item)}

                        <div className={styles.notificationBody}>
                          <div className={styles.notificationMeta}>
                            {renderTag(item)}
                            <span className={styles.notificationTime}>
                              {formatRelativeTime(item.dataCriacao)}
                            </span>
                          </div>
                          <div className={styles.notificationTitleRow}>
                            <h4
                              className={`${styles.notificationTitle} ${
                                isVencidaOuReporte
                                  ? styles.titleDestaque
                                  : isUrgente
                                  ? styles.titleUrgente
                                  : ''
                              }`}
                            >
                              {tituloFormatado}
                            </h4>
                            {stackCount && (
                              <span
                                className={styles.stackCountBadge}
                                title={`${stackCount} conclusões registradas`}
                              >
                                {stackCount}x
                              </span>
                            )}
                          </div>
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
                    title="Limpar histórico de notificações"
                  >
                    <TrashIcon size={14} />
                    Limpar histórico
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
