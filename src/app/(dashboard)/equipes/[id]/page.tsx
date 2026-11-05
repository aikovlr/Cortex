'use client';

import React, { useState, useEffect, useCallback, use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/Components/Header/header';
import { Badge } from '@/components/common/Badge/Badge';
import { AddMemberModal } from '@/components/teams/AddMemberModal/AddMemberModal';
import { AssignTeamGoalModal } from '@/components/teams/AssignTeamGoalModal/AssignTeamGoalModal';
import {
  TrashIcon,
  UserIcon,
  AlertTriangleIcon,
  CheckIcon,
  PlusIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowUpDownIcon,
  TargetIcon,
  CalendarIcon,
  UsersIcon,
} from '@/components/common/Icons/Icons';
import {
  ConsultaEquipeDTO,
  ConsultaMembroEquipeDTO,
  ConsultaTicketReporteDTO,
  ConsultaMetaDTO,
  CargoEquipe,
} from '@/types/api';
import { equipeService } from '@/services/equipeService';
import { ticketService } from '@/services/ticketService';
import { metaService } from '@/services/metaService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import styles from './page.module.css';

type CampoOrdenacaoMembro = 'integrante' | 'desde' | 'cargo';
type DirecaoOrdenacao = 'asc' | 'desc';

const PESO_CARGO: Record<CargoEquipe, number> = {
  Dono: 3,
  Admin: 2,
  Membro: 1,
};

export default function EquipeDetalhesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const equipeId = Number(resolvedParams.id);

  const router = useRouter();
  const { usuario } = useAuth();
  const { showToast } = useToast();

  const [equipe, setEquipe] = useState<ConsultaEquipeDTO | null>(null);
  const [membros, setMembros] = useState<ConsultaMembroEquipeDTO[]>([]);
  const [tickets, setTickets] = useState<ConsultaTicketReporteDTO[]>([]);
  const [metas, setMetas] = useState<ConsultaMetaDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMetas, setLoadingMetas] = useState(true);

  // Modais
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isAssignGoalOpen, setIsAssignGoalOpen] = useState(false);
  const [deletingTeam, setDeletingTeam] = useState(false);
  const [expandedMemberIds, setExpandedMemberIds] = useState<number[]>([]);

  const toggleMemberExpand = (membroId: number) => {
    setExpandedMemberIds((prev) =>
      prev.includes(membroId) ? prev.filter((id) => id !== membroId) : [...prev, membroId]
    );
  };

  // Permissões do usuário atual nesta equipe
  const meuMembro = membros.find((m) => m.usuarioId === usuario?.id);
  const isOwner = meuMembro?.cargo === 'Dono';
  const isAdminOrOwner = isOwner || meuMembro?.cargo === 'Admin';

  // Ordenação de Membros (Dono > Admin > Membro)
  const [campoOrdenacao, setCampoOrdenacao] = useState<CampoOrdenacaoMembro | null>('cargo');
  const [direcaoOrdenacao, setDirecaoOrdenacao] = useState<DirecaoOrdenacao>('asc');

  const alternarOrdenacao = (campo: CampoOrdenacaoMembro) => {
    if (campoOrdenacao === campo) {
      setDirecaoOrdenacao((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setCampoOrdenacao(campo);
      setDirecaoOrdenacao('asc');
    }
  };

  const renderIconeOrdenacao = (campo: CampoOrdenacaoMembro) => {
    if (campoOrdenacao !== campo) {
      return <ArrowUpDownIcon size={14} className={styles.sortIconInactive} aria-hidden="true" />;
    }
    return direcaoOrdenacao === 'asc' ? (
      <ChevronUpIcon size={14} className={styles.sortIconActive} aria-hidden="true" />
    ) : (
      <ChevronDownIcon size={14} className={styles.sortIconActive} aria-hidden="true" />
    );
  };

  const membrosOrdenados = useMemo(() => {
    if (!campoOrdenacao) return membros;

    return [...membros].sort((a, b) => {
      let diff = 0;
      if (campoOrdenacao === 'cargo') {
        const pesoA = PESO_CARGO[a.cargo] ?? 0;
        const pesoB = PESO_CARGO[b.cargo] ?? 0;
        // Na hierarquia Dono > Admin > Membro, asc lista os cargos mais altos primeiro
        diff = direcaoOrdenacao === 'asc' ? pesoB - pesoA : pesoA - pesoB;
      } else if (campoOrdenacao === 'integrante') {
        const nomeA = a.usuario?.nome || '';
        const nomeB = b.usuario?.nome || '';
        diff = direcaoOrdenacao === 'asc'
          ? nomeA.localeCompare(nomeB, 'pt-BR')
          : nomeB.localeCompare(nomeA, 'pt-BR');
      } else if (campoOrdenacao === 'desde') {
        const timeA = new Date(a.dataEntrada).getTime() || 0;
        const timeB = new Date(b.dataEntrada).getTime() || 0;
        diff = direcaoOrdenacao === 'asc' ? timeA - timeB : timeB - timeA;
      }

      if (diff !== 0) return diff;
      return a.id - b.id;
    });
  }, [membros, campoOrdenacao, direcaoOrdenacao]);

  const recarregar = useCallback(() => {
    if (!equipeId) return;

    setLoading(true);
    setLoadingMetas(true);
    Promise.all([
      equipeService.obterPorId(equipeId),
      equipeService.listarMembros(equipeId),
      ticketService.listarTicketsPorEquipe(equipeId).catch(() => []),
      metaService.listarPorEquipe(equipeId).catch(() => []),
    ])
      .then(([eq, mem, tick, mets]) => {
        setEquipe(eq);
        setMembros(mem);
        setTickets(tick);
        setMetas(mets);
      })
      .catch((err) => {
        showToast(err.message || 'Erro ao carregar equipe', 'error');
      })
      .finally(() => {
        setLoading(false);
        setLoadingMetas(false);
      });
  }, [equipeId, showToast]);

  useEffect(() => {
    let isMounted = true;
    if (!equipeId || isNaN(equipeId)) {
      setLoading(false);
      setLoadingMetas(false);
      return;
    }

    Promise.all([
      equipeService.obterPorId(equipeId),
      equipeService.listarMembros(equipeId),
      ticketService.listarTicketsPorEquipe(equipeId).catch(() => []),
      metaService.listarPorEquipe(equipeId).catch(() => []),
    ])
      .then(([eq, mem, tick, mets]) => {
        if (isMounted) {
          setEquipe(eq);
          setMembros(mem);
          setTickets(tick);
          setMetas(mets);
          setLoading(false);
          setLoadingMetas(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          showToast(err.message || 'Erro ao carregar equipe', 'error');
          setLoading(false);
          setLoadingMetas(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [equipeId, showToast]);

  const handleRemoverMembro = async (membroId: number, nome: string) => {
    if (!window.confirm(`Deseja remover ${nome} da equipe?`)) return;

    try {
      await equipeService.removerMembro(equipeId, membroId);
      showToast('Membro removido com sucesso.', 'success');
      recarregar();
    } catch (err: unknown) {
      if (err instanceof Error) showToast(err.message, 'error');
    }
  };

  const handleAlterarCargo = async (membroId: number, novoCargo: CargoEquipe) => {
    try {
      await equipeService.alterarCargo(equipeId, membroId, novoCargo);
      showToast(`Cargo alterado para ${novoCargo}!`, 'success');
      recarregar();
    } catch (err: unknown) {
      if (err instanceof Error) showToast(err.message, 'error');
    }
  };

  const handleExcluirEquipe = async () => {
    if (!equipe) return;
    const confirmacao = window.confirm(
      `Tem certeza de que deseja excluir a equipe "${equipe.nome}"? Esta ação é irreversível e removerá todos os membros e vínculos associados.`
    );
    if (!confirmacao) return;

    try {
      setDeletingTeam(true);
      await equipeService.excluirEquipe(equipeId);
      showToast('Equipe excluída com sucesso!', 'success');
      router.push('/equipes');
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message, 'error');
      } else {
        showToast('Falha ao excluir equipe.', 'error');
      }
      setDeletingTeam(false);
    }
  };

  const handleFecharTicket = async (ticketId: number) => {
    try {
      await ticketService.fecharTicket(ticketId);
      showToast('Ticket resolvido e fechado com sucesso!', 'success');
      setTickets((prev) => prev.filter((t) => t.id !== ticketId));
    } catch (err: unknown) {
      if (err instanceof Error) showToast(err.message, 'error');
    }
  };

  const getAvatarUrl = (url?: string | null) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return url.startsWith('/') ? url : `/${url}`;
  };

  const formatarData = (isoDate: string) => {
    const data = new Date(isoDate);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <>
      <Header titulo={equipe?.nome || 'Equipe'} />

      <main className={styles.container}>
        <div className={styles.topBar}>
          <div className={styles.teamHeading}>
            <button
              type="button"
              className={styles.backBtn}
              onClick={() => router.push('/equipes')}
            >
              ← Voltar para todas as equipes
            </button>
            <h2 className={styles.teamName}>{equipe?.nome || 'Detalhes da Equipe'}</h2>
            <span className={styles.teamSubtitle} suppressHydrationWarning>
              {membros.length} integrante(s) • Criada em{' '}
              {equipe ? formatarData(equipe.dataCriacao) : ''}
            </span>
          </div>

          <div className={styles.actionsWrapper}>
            {isOwner && (
              <button
                type="button"
                className={styles.deleteTeamBtn}
                onClick={handleExcluirEquipe}
                disabled={deletingTeam}
                title="Excluir equipe permanentemente (Apenas Dono)"
              >
                {deletingTeam ? (
                  'Excluindo...'
                ) : (
                  <>
                    <TrashIcon size={16} /> Excluir equipe
                  </>
                )}
              </button>
            )}

            {isAdminOrOwner && (
              <>
                <button
                  type="button"
                  className={styles.assignGoalBtn}
                  onClick={() => setIsAssignGoalOpen(true)}
                >
                  <PlusIcon size={16} /> Atribuir meta
                </button>
                <button
                  type="button"
                  className={styles.addMemberBtn}
                  onClick={() => setIsAddMemberOpen(true)}
                >
                  <PlusIcon size={16} /> Adicionar membro
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabela de Membros (Charter 6.3.2) */}
        <div className={styles.card}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--cortex-gray-text)' }}>
              Carregando integrantes da equipe...
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th
                    className={`${styles.th} ${styles.thSortable}`}
                    onClick={() => alternarOrdenacao('integrante')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        alternarOrdenacao('integrante');
                      }
                    }}
                    tabIndex={0}
                    role="columnheader"
                    aria-sort={
                      campoOrdenacao === 'integrante'
                        ? direcaoOrdenacao === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    <div className={styles.thContent}>
                      <span>Integrante</span>
                      <span className={styles.sortIconContainer}>
                        {renderIconeOrdenacao('integrante')}
                      </span>
                    </div>
                  </th>

                  <th
                    className={`${styles.th} ${styles.thSortable}`}
                    onClick={() => alternarOrdenacao('desde')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        alternarOrdenacao('desde');
                      }
                    }}
                    tabIndex={0}
                    role="columnheader"
                    aria-sort={
                      campoOrdenacao === 'desde'
                        ? direcaoOrdenacao === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    <div className={styles.thContent}>
                      <span>Desde</span>
                      <span className={styles.sortIconContainer}>
                        {renderIconeOrdenacao('desde')}
                      </span>
                    </div>
                  </th>

                  <th
                    className={`${styles.th} ${styles.thSortable}`}
                    onClick={() => alternarOrdenacao('cargo')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        alternarOrdenacao('cargo');
                      }
                    }}
                    tabIndex={0}
                    role="columnheader"
                    aria-sort={
                      campoOrdenacao === 'cargo'
                        ? direcaoOrdenacao === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    <div className={styles.thContent}>
                      <span>Cargo</span>
                      <span className={styles.sortIconContainer}>
                        {renderIconeOrdenacao('cargo')}
                      </span>
                    </div>
                  </th>

                  {isAdminOrOwner && (
                    <th className={styles.th} style={{ textAlign: 'right' }}>
                      Ações
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {membrosOrdenados.map((membro) => {
                  const nome = membro.usuario?.nome || 'Colaborador';
                  const email = membro.usuario?.email || '';
                  const telefone = membro.usuario?.telefone || '';
                  const isExpanded = expandedMemberIds.includes(membro.id);

                  return (
                    <React.Fragment key={membro.id}>
                      <tr
                        className={`${styles.tr} ${styles.trClickable} ${isExpanded ? styles.trExpanded : ''}`}
                        onClick={() => toggleMemberExpand(membro.id)}
                        role="button"
                        tabIndex={0}
                        aria-expanded={isExpanded}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            const tagName = (e.target as HTMLElement).tagName;
                            if (tagName === 'SELECT' || tagName === 'BUTTON' || tagName === 'OPTION') return;
                            e.preventDefault();
                            toggleMemberExpand(membro.id);
                          }
                        }}
                      >
                        <td className={styles.td}>
                          <div className={styles.memberCellWrapper}>
                            <button
                              type="button"
                              className={styles.memberExpandBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleMemberExpand(membro.id);
                              }}
                              title={isExpanded ? 'Recolher detalhes' : 'Ver mais informações do integrante'}
                              aria-expanded={isExpanded}
                              aria-label={`${isExpanded ? 'Recolher' : 'Expandir'} informações de ${nome}`}
                            >
                              <ChevronDownIcon
                                size={16}
                                className={`${styles.memberExpandIcon} ${isExpanded ? styles.memberExpandIconRotated : ''}`}
                              />
                            </button>

                            <div className={styles.memberInfo}>
                              {membro.usuario?.fotoPerfil?.urlCaminho ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={getAvatarUrl(membro.usuario.fotoPerfil.urlCaminho)}
                                  alt={nome}
                                  className={styles.avatar}
                                />
                              ) : (
                                <div className={styles.avatar} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cortex-purple)' }}>
                                  <UserIcon size={16} />
                                </div>
                              )}
                              <div className={styles.memberText}>
                                <span className={styles.memberName}>{nome}</span>
                                <span className={styles.memberEmail}>{email}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className={styles.td} suppressHydrationWarning>
                          {formatarData(membro.dataEntrada)}
                        </td>

                        <td className={styles.td}>
                          {isOwner && membro.cargo !== 'Dono' ? (
                            <select
                              value={membro.cargo}
                              className={styles.roleSelect}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                handleAlterarCargo(membro.id, e.target.value as CargoEquipe)
                              }
                            >
                              <option value="Admin">Admin</option>
                              <option value="Membro">Membro</option>
                            </select>
                          ) : (
                            <Badge type="cargo" value={membro.cargo} />
                          )}
                        </td>

                        {isAdminOrOwner && (
                          <td className={styles.td} style={{ textAlign: 'right' }}>
                            {(isOwner ? membro.cargo !== 'Dono' : membro.cargo === 'Membro') && (
                              <button
                                type="button"
                                className={`${styles.actionBtn} ${styles.removeBtn}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoverMembro(membro.id, nome);
                                }}
                                title="Remover da equipe"
                              >
                                Remover
                              </button>
                            )}
                          </td>
                        )}
                      </tr>

                      {isExpanded && (
                        <tr className={styles.memberDetailsRow}>
                          <td colSpan={isAdminOrOwner ? 4 : 3} className={styles.memberDetailsTd}>
                            <div className={styles.memberDetailsCard}>
                              <div className={styles.memberDetailsGrid}>
                                <div className={styles.detailItem}>
                                  <span className={styles.detailLabel}>Nome Completo</span>
                                  <span className={styles.detailValue}>{nome}</span>
                                </div>

                                <div className={styles.detailItem}>
                                  <span className={styles.detailLabel}>E-mail</span>
                                  <span className={styles.detailValue}>
                                    {email ? (
                                      <a href={`mailto:${email}`} className={styles.detailLink}>
                                        {email}
                                      </a>
                                    ) : (
                                      <span className={styles.detailEmpty}>Não informado</span>
                                    )}
                                  </span>
                                </div>

                                <div className={styles.detailItem}>
                                  <span className={styles.detailLabel}>Telefone / Contato</span>
                                  <span className={styles.detailValue}>
                                    {telefone ? (
                                      <a href={`tel:${telefone}`} className={styles.detailLink}>
                                        {telefone}
                                      </a>
                                    ) : (
                                      <span className={styles.detailEmpty}>Não cadastrado</span>
                                    )}
                                  </span>
                                </div>

                                <div className={styles.detailItem}>
                                  <span className={styles.detailLabel}>Cargo na Equipe</span>
                                  <span className={styles.detailValue}>
                                    <Badge type="cargo" value={membro.cargo} />
                                  </span>
                                </div>

                                <div className={styles.detailItem}>
                                  <span className={styles.detailLabel}>Integrante Desde</span>
                                  <span className={styles.detailValue} suppressHydrationWarning>
                                    {formatarData(membro.dataEntrada)}
                                  </span>
                                </div>

                                <div className={styles.detailItem}>
                                  <span className={styles.detailLabel}>ID do Usuário</span>
                                  <span className={styles.detailValue}>#{membro.usuarioId}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Seção de Metas da Equipe */}
        <section className={styles.goalsSection}>
          <div className={styles.sectionHeadingRow}>
            <div>
              <h3 className={styles.sectionBlockTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TargetIcon size={20} color="var(--cortex-purple)" />
                Metas da Equipe ({metas.length})
              </h3>
              <p className={styles.sectionBlockDesc}>
                Metas atribuídas a esta equipe e seus integrantes para acompanhamento do progresso.
              </p>
            </div>
            {isAdminOrOwner && metas.length > 0 && (
              <button
                type="button"
                className={styles.assignGoalBtnSecondary}
                onClick={() => setIsAssignGoalOpen(true)}
              >
                <PlusIcon size={14} /> Atribuir nova meta
              </button>
            )}
          </div>

          {loadingMetas ? (
            <div className={styles.loadingBox}>Carregando metas da equipe...</div>
          ) : metas.length === 0 ? (
            <div className={styles.emptyGoalsCard}>
              <TargetIcon size={32} color="var(--cortex-gray-text)" />
              <p className={styles.emptyGoalsTitle}>Nenhuma meta atribuída à equipe ainda</p>
              <p className={styles.emptyGoalsText}>
                {isAdminOrOwner
                  ? 'Como gestor da equipe, você pode criar uma nova meta ou vincular uma meta existente para que todos os membros acompanhem o progresso.'
                  : 'Nenhuma meta foi designada para esta equipe até o momento.'}
              </p>
              {isAdminOrOwner && (
                <button
                  type="button"
                  className={styles.assignGoalBtn}
                  onClick={() => setIsAssignGoalOpen(true)}
                  style={{ marginTop: '8px' }}
                >
                  <PlusIcon size={16} /> Atribuir meta à equipe
                </button>
              )}
            </div>
          ) : (
            <div className={styles.goalsGrid}>
              {metas.map((meta) => {
                const totalTarefas =
                  meta.tarefas && meta.tarefas.length > 0
                    ? meta.tarefas.length
                    : meta.tarefa
                    ? 1
                    : 0;
                const tarefasConcluidas =
                  meta.tarefas && meta.tarefas.length > 0
                    ? meta.tarefas.filter((t) => t.status === 'Concluida').length
                    : meta.tarefa?.status === 'Concluida'
                    ? 1
                    : 0;
                const progresso = meta.concluida
                  ? 100
                  : totalTarefas > 0
                  ? Math.round((tarefasConcluidas / totalTarefas) * 100)
                  : 0;

                return (
                  <div key={meta.id} className={styles.goalCard}>
                    <div className={styles.goalCardHeader}>
                      <div className={styles.goalTitleGroup}>
                        <h4
                          className={`${styles.goalName} ${
                            meta.concluida ? styles.goalNameCompleted : ''
                          }`}
                        >
                          {meta.nome}
                        </h4>
                        <Badge
                          type="status"
                          value={meta.concluida ? 'Concluida' : 'EmProgresso'}
                        />
                      </div>
                      {meta.dataFechamento && (
                        <span className={styles.goalDeadline} suppressHydrationWarning>
                          <CalendarIcon size={13} />
                          Prazo: {formatarData(meta.dataFechamento)}
                        </span>
                      )}
                    </div>

                    <div className={styles.goalProgressSection}>
                      <div className={styles.progressRow}>
                        <span className={styles.progressLabel}>
                          Progresso ({tarefasConcluidas}/{totalTarefas} tarefas)
                        </span>
                        <span className={styles.progressValue}>{progresso}%</span>
                      </div>
                      <div className={styles.progressTrack}>
                        <div
                          className={styles.progressFill}
                          style={{ width: `${progresso}%` }}
                        />
                      </div>
                    </div>

                    <div className={styles.goalFooter}>
                      <span className={styles.assignedToInfo}>
                        {meta.usuarioId &&
                        meta.usuarioId !== membros.find((m) => m.cargo === 'Dono')?.usuarioId &&
                        meta.usuario?.nome ? (
                          <>
                            <UserIcon size={14} />
                            Responsável: {meta.usuario.nome}
                          </>
                        ) : (
                          <>
                            <UsersIcon size={14} />
                            Atribuída a toda a equipe
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Seção de Tickets de Reporte da Equipe (RF008) */}
        {isAdminOrOwner && tickets.length > 0 && (
          <section className={styles.ticketSection}>
            <h3 className={styles.ticketTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangleIcon size={18} color="var(--cortex-red-danger)" />
              Tickets de Problemas Reportados na Equipe ({tickets.length})
            </h3>
            <div className={styles.ticketGrid}>
              {tickets.map((ticket) => (
                <div key={ticket.id} className={styles.ticketCard}>
                  <div className={styles.ticketHeader}>
                    <span className={styles.ticketAuthor} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <UserIcon size={14} /> {ticket.usuario?.nome || 'Membro'}
                    </span>
                    <Badge type="prioridade" value="Urgente" />
                  </div>
                  <p className={styles.ticketDesc}>{ticket.descricao}</p>
                  <button
                    type="button"
                    className={styles.resolveTicketBtn}
                    onClick={() => handleFecharTicket(ticket.id)}
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <CheckIcon size={16} /> Marcar como resolvido
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Modal Adicionar Membro (Charter 6.3.3) */}
      <AddMemberModal
        equipeId={equipeId}
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        onSuccess={recarregar}
      />

      {/* Modal Atribuir Meta da Equipe */}
      <AssignTeamGoalModal
        equipeId={equipeId}
        equipeNome={equipe?.nome || 'Equipe'}
        membros={membros}
        isOpen={isAssignGoalOpen}
        onClose={() => setIsAssignGoalOpen(false)}
        onSuccess={recarregar}
      />
    </>
  );
}
