'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/Components/Header/header';
import { Badge } from '@/components/common/Badge/Badge';
import { SearchBar } from '@/components/common/SearchBar/SearchBar';
import { EmptyState } from '@/components/common/EmptyState/EmptyState';
import {
  PlusIcon,
  ClipboardIcon,
  SpinnerIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowUpDownIcon,
  CalendarIcon,
} from '@/components/common/Icons/Icons';
import { TaskCreateModal } from '@/components/tasks/TaskCreateModal/TaskCreateModal';
import { ConsultaTarefaDTO, Prioridade } from '@/types/api';
import { tarefaService } from '@/services/tarefaService';
import { useAuth } from '@/contexts/AuthContext';
import styles from './page.module.css';

type CampoOrdenacao = 'titulo' | 'vencimento' | 'status' | 'prioridade';
type DirecaoOrdenacao = 'asc' | 'desc';

const PESO_PRIORIDADE: Record<string, number> = {
  Baixa: 1,
  Media: 2,
  Alta: 3,
  Urgente: 4,
};

const PESO_STATUS: Record<string, number> = {
  Atrasada: 1,
  Pendente: 2,
  Concluida: 3,
};

export default function MinhasTarefasPage() {
  const router = useRouter();
  const { usuario } = useAuth();

  const [tarefas, setTarefas] = useState<ConsultaTarefaDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState<'pendentes' | 'concluidas'>('pendentes');
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>('todas');

  // Ordenação por coluna
  const [campoOrdenacao, setCampoOrdenacao] = useState<CampoOrdenacao | null>(null);
  const [direcaoOrdenacao, setDirecaoOrdenacao] = useState<DirecaoOrdenacao>('asc');

  // Redimensionamento de colunas em porcentagem (a soma é estritamente 100%, nunca ultrapassa a width)
  const tableRef = useRef<HTMLTableElement | null>(null);
  const [columnPercentages, setColumnPercentages] = useState<Record<string, number>>({
    titulo: 44,
    vencimento: 20,
    status: 18,
    prioridade: 18,
  });
  const [resizingCol, setResizingCol] = useState<string | null>(null);
  const isResizingRef = useRef(false);
  const justResizedRef = useRef(false);

  // Modais
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Carrega porcentagens salvas pelo usuário se existirem
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cortex_minhas_tarefas_col_pcts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed &&
          typeof parsed === 'object' &&
          parsed.titulo &&
          parsed.vencimento &&
          parsed.status &&
          parsed.prioridade
        ) {
          const total = parsed.titulo + parsed.vencimento + parsed.status + parsed.prioridade;
          if (Math.abs(total - 100) < 1.5) {
            setColumnPercentages(parsed);
          }
        }
      }
    } catch {
      // Ignora erro de parsing
    }
  }, []);

  // Ajusta cursor global durante o arraste
  useEffect(() => {
    if (resizingCol) {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [resizingCol]);

  // Redimensiona duas colunas adjacentes para manter a largura total sempre em 100%
  const handleResizeStart = (
    colA: string,
    colB: string,
    e: React.MouseEvent | React.TouchEvent
  ) => {
    e.stopPropagation();
    e.preventDefault();
    if (!tableRef.current) return;

    isResizingRef.current = true;
    justResizedRef.current = true;
    setResizingCol(colA);

    const tableWidth = tableRef.current.clientWidth || 800;
    const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const startPctA = columnPercentages[colA];
    const startPctB = columnPercentages[colB];
    const combinedPct = startPctA + startPctB;

    const minPctA = colA === 'titulo' ? 18 : 12;
    const minPctB = 12;

    let latestPcts = { ...columnPercentages };

    const onMove = (moveEvent: MouseEvent | TouchEvent) => {
      if (!isResizingRef.current) return;
      const currentX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const deltaPx = currentX - startX;
      const deltaPct = (deltaPx / tableWidth) * 100;

      let newPctA = startPctA + deltaPct;
      newPctA = Math.max(minPctA, Math.min(combinedPct - minPctB, newPctA));
      const newPctB = combinedPct - newPctA;

      latestPcts = {
        ...latestPcts,
        [colA]: Math.round(newPctA * 10) / 10,
        [colB]: Math.round(newPctB * 10) / 10,
      };

      setColumnPercentages((prev) => ({
        ...prev,
        [colA]: latestPcts[colA],
        [colB]: latestPcts[colB],
      }));
    };

    const onEnd = () => {
      isResizingRef.current = false;
      setResizingCol(null);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);

      try {
        localStorage.setItem('cortex_minhas_tarefas_col_pcts', JSON.stringify(latestPcts));
      } catch {
        // Ignora erro ao salvar
      }

      setTimeout(() => {
        justResizedRef.current = false;
      }, 150);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onEnd);
  };

  const alternarOrdenacao = (campo: CampoOrdenacao) => {
    // Evita acionar ordenação logo após redimensionar a coluna
    if (justResizedRef.current) return;

    if (campoOrdenacao === campo) {
      setDirecaoOrdenacao((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setCampoOrdenacao(campo);
      setDirecaoOrdenacao('asc');
    }
  };

  const renderIconeOrdenacao = (campo: CampoOrdenacao) => {
    if (campoOrdenacao !== campo) {
      return <ArrowUpDownIcon size={14} className={styles.sortIconInactive} aria-hidden="true" />;
    }
    return direcaoOrdenacao === 'asc' ? (
      <ChevronUpIcon size={14} className={styles.sortIconActive} aria-hidden="true" />
    ) : (
      <ChevronDownIcon size={14} className={styles.sortIconActive} aria-hidden="true" />
    );
  };

  const recarregar = useCallback(() => {
    if (!usuario) return;
    setLoading(true);
    tarefaService
      .listarTarefas({
        responsavelId: usuario.id,
        termoBusca: termoBusca.trim() || undefined,
        prioridade: filtroPrioridade !== 'todas' ? (filtroPrioridade as Prioridade) : undefined,
      })
      .then((dados) => {
        setTarefas(dados);
      })
      .catch(() => {
        setTarefas([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [usuario, termoBusca, filtroPrioridade]);

  useEffect(() => {
    let isMounted = true;
    if (!usuario) return;

    tarefaService
      .listarTarefas({
        responsavelId: usuario.id,
        termoBusca: termoBusca.trim() || undefined,
        prioridade: filtroPrioridade !== 'todas' ? (filtroPrioridade as Prioridade) : undefined,
      })
      .then((dados) => {
        if (isMounted) {
          setTarefas(dados);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setTarefas([]);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [usuario, termoBusca, filtroPrioridade]);

  const formatarData = (isoDate: string) => {
    const data = new Date(isoDate);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Remove menções textuais de sugestão aprovada/aceita da listagem (o push já notifica o responsável)
  const obterDescricaoLimpa = (descricao?: string | null) => {
    if (!descricao) return '';
    return descricao
      .replace(/(?:^|\r?\n)*\[Sugest[aã]o\s*#?\d*\s*(?:Aprovada|Aceita)[^\]]*\]:?[\s\S]*/gi, '')
      .trim();
  };

  const isVencida = (isoDate: string, status: string) => {
    if (status === 'Concluida') return false;
    return new Date(isoDate) < new Date();
  };

  const obterStatusReal = (tarefa: ConsultaTarefaDTO) => {
    if (tarefa.status === 'Concluida') return 'Concluida';
    if (isVencida(tarefa.dataVencimento, tarefa.status)) return 'Atrasada';
    return tarefa.status;
  };

  // Filtragem pelas duas abas
  const totalPendentesEAtrasadas = tarefas.filter((t) => t.status !== 'Concluida').length;
  const totalConcluidas = tarefas.filter((t) => t.status === 'Concluida').length;

  const tarefasPendentes = useMemo(() => {
    return tarefas.filter((t) => {
      if (t.status === 'Concluida') return false;
      const vencida = isVencida(t.dataVencimento, t.status);
      const statusReal = vencida ? 'Atrasada' : t.status;
      if (filtroStatus === 'Pendente') return statusReal === 'Pendente';
      if (filtroStatus === 'Atrasada') return statusReal === 'Atrasada';
      return true;
    });
  }, [tarefas, filtroStatus]);

  const tarefasConcluidas = useMemo(() => {
    return tarefas.filter((t) => t.status === 'Concluida');
  }, [tarefas]);

  const tarefasFiltradas = abaAtiva === 'pendentes' ? tarefasPendentes : tarefasConcluidas;

  const tarefasExibidas = useMemo(() => {
    if (!campoOrdenacao) return tarefasFiltradas;

    return [...tarefasFiltradas].sort((a, b) => {
      let diff = 0;

      if (campoOrdenacao === 'vencimento') {
        const timeA = new Date(a.dataVencimento).getTime() || 0;
        const timeB = new Date(b.dataVencimento).getTime() || 0;
        diff = timeA - timeB;
      } else if (campoOrdenacao === 'status') {
        const statusA = obterStatusReal(a);
        const statusB = obterStatusReal(b);
        diff = (PESO_STATUS[statusA] ?? 99) - (PESO_STATUS[statusB] ?? 99);
      } else if (campoOrdenacao === 'prioridade') {
        diff = (PESO_PRIORIDADE[a.prioridade] ?? 0) - (PESO_PRIORIDADE[b.prioridade] ?? 0);
      } else if (campoOrdenacao === 'titulo') {
        diff = a.titulo.localeCompare(b.titulo, 'pt-BR');
      }

      if (diff !== 0) {
        return direcaoOrdenacao === 'asc' ? diff : -diff;
      }

      return a.id - b.id;
    });
  }, [tarefasFiltradas, campoOrdenacao, direcaoOrdenacao]);

  return (
    <>
      <Header titulo="Minhas tarefas" />

      <main className={styles.container}>
        {/* Abas Padronizadas no estilo de Configurações */}
        <div className={styles.tabsHeader}>
          <button
            type="button"
            onClick={() => setAbaAtiva('pendentes')}
            className={`${styles.tabBtn} ${abaAtiva === 'pendentes' ? styles.tabBtnActive : ''}`}
          >
            Tarefas Pendentes e Atrasadas ({totalPendentesEAtrasadas})
          </button>
          <button
            type="button"
            onClick={() => setAbaAtiva('concluidas')}
            className={`${styles.tabBtn} ${abaAtiva === 'concluidas' ? styles.tabBtnActive : ''}`}
          >
            Tarefas Concluídas ({totalConcluidas})
          </button>
        </div>

        {/* Barra de Ferramentas: Busca + Filtros + Botão Adicionar */}
        <div className={styles.toolbar}>
          <div className={styles.searchFilters}>
            <div className={styles.searchRow}>
              <SearchBar
                value={termoBusca}
                onChange={setTermoBusca}
                placeholder="Pesquisar tarefa..."
                maxWidth={360}
                className={styles.searchBarFlex}
              />

              <button
                type="button"
                className={`${styles.addButton} ${styles.addButtonMobile}`}
                onClick={() => setIsCreateOpen(true)}
                title="Criar nova tarefa"
                aria-label="Criar nova tarefa"
              >
                <PlusIcon size={20} color="#ffffff" />
              </button>
            </div>

            <div className={styles.filtersRow}>
              {abaAtiva === 'pendentes' && (
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="todos">Todos os status</option>
                  <option value="Pendente">Apenas Pendente</option>
                  <option value="Atrasada">Apenas Atrasada</option>
                </select>
              )}

              <select
                value={filtroPrioridade}
                onChange={(e) => setFiltroPrioridade(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="todas">Todas as prioridades</option>
                <option value="Baixa">Baixa</option>
                <option value="Media">Média</option>
                <option value="Alta">Alta</option>
                <option value="Urgente">Urgente</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            className={`${styles.addButton} ${styles.addButtonDesktop}`}
            onClick={() => setIsCreateOpen(true)}
            title="Criar nova tarefa"
            aria-label="Criar nova tarefa"
          >
            <PlusIcon size={20} color="#ffffff" />
          </button>
        </div>

        {/* Tabela de Tarefas */}
        <div className={styles.tableCard}>
          {loading ? (
            <EmptyState
              icon={<SpinnerIcon size={32} color="var(--cortex-purple)" />}
              title="Carregando tarefas..."
              description="Aguarde um momento enquanto buscamos suas tarefas no servidor."
            />
          ) : tarefasExibidas.length === 0 ? (
            <EmptyState
              icon={<ClipboardIcon size={32} color="var(--cortex-purple)" />}
              title={
                abaAtiva === 'pendentes'
                  ? 'Nenhuma tarefa pendente ou atrasada'
                  : 'Nenhuma tarefa concluída'
              }
              description={
                abaAtiva === 'pendentes'
                  ? 'Você não possui tarefas pendentes no momento ou nenhuma corresponde aos filtros aplicados.'
                  : 'Você ainda não concluiu nenhuma tarefa ou nenhuma corresponde aos filtros aplicados.'
              }
              action={
                abaAtiva === 'pendentes' ? (
                  <button
                    type="button"
                    className={styles.createFirstBtn}
                    onClick={() => setIsCreateOpen(true)}
                  >
                    <PlusIcon size={16} /> Criar primeira tarefa
                  </button>
                ) : undefined
              }
            />
          ) : (
            <>
              <div className={styles.tableResponsive}>
              <table ref={tableRef} className={styles.table}>
                <colgroup>
                  <col style={{ width: `${columnPercentages.titulo}%` }} />
                  <col style={{ width: `${columnPercentages.vencimento}%` }} />
                  <col style={{ width: `${columnPercentages.status}%` }} />
                  <col style={{ width: `${columnPercentages.prioridade}%` }} />
                </colgroup>
                <thead>
                  <tr>
                    <th
                      className={`${styles.th} ${styles.thSortable}`}
                      style={{ width: `${columnPercentages.titulo}%` }}
                      onClick={() => alternarOrdenacao('titulo')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          alternarOrdenacao('titulo');
                        }
                      }}
                      role="columnheader"
                      tabIndex={0}
                      aria-sort={
                        campoOrdenacao === 'titulo'
                          ? direcaoOrdenacao === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                      title="Clique para alternar a ordem por Tarefa (crescente/decrescente)"
                    >
                      <div className={styles.thContent}>
                        <span>Tarefa</span>
                        <span className={styles.sortIconContainer}>
                          {renderIconeOrdenacao('titulo')}
                        </span>
                      </div>
                      <div
                        className={`${styles.resizer} ${
                          resizingCol === 'titulo' ? styles.resizerActive : ''
                        }`}
                        onMouseDown={(e) => handleResizeStart('titulo', 'vencimento', e)}
                        onTouchStart={(e) => handleResizeStart('titulo', 'vencimento', e)}
                        onClick={(e) => e.stopPropagation()}
                        title="Clique e arraste para ajustar a largura entre Tarefa e Vencimento"
                        aria-label="Redimensionar coluna Tarefa"
                        role="separator"
                      />
                    </th>

                    <th
                      className={`${styles.th} ${styles.thSortable}`}
                      style={{ width: `${columnPercentages.vencimento}%` }}
                      onClick={() => alternarOrdenacao('vencimento')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          alternarOrdenacao('vencimento');
                        }
                      }}
                      role="columnheader"
                      tabIndex={0}
                      aria-sort={
                        campoOrdenacao === 'vencimento'
                          ? direcaoOrdenacao === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                      title="Clique para alternar a ordem por Data de Vencimento (crescente/decrescente)"
                    >
                      <div className={styles.thContent}>
                        <span>Vencimento</span>
                        <span className={styles.sortIconContainer}>
                          {renderIconeOrdenacao('vencimento')}
                        </span>
                      </div>
                      <div
                        className={`${styles.resizer} ${
                          resizingCol === 'vencimento' ? styles.resizerActive : ''
                        }`}
                        onMouseDown={(e) => handleResizeStart('vencimento', 'status', e)}
                        onTouchStart={(e) => handleResizeStart('vencimento', 'status', e)}
                        onClick={(e) => e.stopPropagation()}
                        title="Clique e arraste para ajustar a largura entre Vencimento e Status"
                        aria-label="Redimensionar coluna Vencimento"
                        role="separator"
                      />
                    </th>

                    <th
                      className={`${styles.th} ${styles.thSortable}`}
                      style={{ width: `${columnPercentages.status}%` }}
                      onClick={() => alternarOrdenacao('status')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          alternarOrdenacao('status');
                        }
                      }}
                      role="columnheader"
                      tabIndex={0}
                      aria-sort={
                        campoOrdenacao === 'status'
                          ? direcaoOrdenacao === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                      title="Clique para alternar a ordem por Status (crescente/decrescente)"
                    >
                      <div className={styles.thContent}>
                        <span>Status</span>
                        <span className={styles.sortIconContainer}>
                          {renderIconeOrdenacao('status')}
                        </span>
                      </div>
                      <div
                        className={`${styles.resizer} ${
                          resizingCol === 'status' ? styles.resizerActive : ''
                        }`}
                        onMouseDown={(e) => handleResizeStart('status', 'prioridade', e)}
                        onTouchStart={(e) => handleResizeStart('status', 'prioridade', e)}
                        onClick={(e) => e.stopPropagation()}
                        title="Clique e arraste para ajustar a largura entre Status e Prioridade"
                        aria-label="Redimensionar coluna Status"
                        role="separator"
                      />
                    </th>

                    <th
                      className={`${styles.th} ${styles.thSortable}`}
                      style={{ width: `${columnPercentages.prioridade}%` }}
                      onClick={() => alternarOrdenacao('prioridade')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          alternarOrdenacao('prioridade');
                        }
                      }}
                      role="columnheader"
                      tabIndex={0}
                      aria-sort={
                        campoOrdenacao === 'prioridade'
                          ? direcaoOrdenacao === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                      title="Clique para alternar a ordem por Prioridade (crescente/decrescente)"
                    >
                      <div className={styles.thContent}>
                        <span>Prioridade</span>
                        <span className={styles.sortIconContainer}>
                          {renderIconeOrdenacao('prioridade')}
                        </span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tarefasExibidas.map((tarefa) => {
                    const vencida = isVencida(tarefa.dataVencimento, tarefa.status);

                    return (
                      <tr
                        key={tarefa.id}
                        className={styles.tr}
                        onClick={() => router.push(`/minhas-tarefas/${tarefa.id}`)}
                      >
                        <td className={styles.td}>
                          <div className={styles.taskTitleCol}>
                            <span className={styles.taskTitle}>{tarefa.titulo}</span>
                            {obterDescricaoLimpa(tarefa.descricao) && (
                              <span className={styles.taskDesc}>{obterDescricaoLimpa(tarefa.descricao)}</span>
                            )}
                          </div>
                        </td>

                        <td className={styles.td}>
                          <span
                            className={`${styles.dueDateCol} ${vencida ? styles.dueDateOverdue : ''
                              }`}
                            suppressHydrationWarning
                          >
                            {formatarData(tarefa.dataVencimento)}
                          </span>
                        </td>

                        <td className={styles.td}>
                          <Badge
                            type="status"
                            value={vencida && tarefa.status !== 'Concluida' ? 'Atrasada' : tarefa.status}
                          />
                        </td>

                        <td className={styles.td}>
                          <Badge type="prioridade" value={tarefa.prioridade} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className={styles.mobileCardsList}>
              {tarefasExibidas.map((tarefa) => {
                const vencida = isVencida(tarefa.dataVencimento, tarefa.status);
                const statusReal = vencida && tarefa.status !== 'Concluida' ? 'Atrasada' : tarefa.status;
                const desc = obterDescricaoLimpa(tarefa.descricao);

                return (
                  <div
                    key={tarefa.id}
                    className={styles.mobileCard}
                    onClick={() => router.push(`/minhas-tarefas/${tarefa.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        router.push(`/minhas-tarefas/${tarefa.id}`);
                      }
                    }}
                  >
                    <div className={styles.mobileCardHeader}>
                      <span className={styles.mobileCardTitle}>{tarefa.titulo}</span>
                    </div>

                    {desc && <p className={styles.mobileCardDesc}>{desc}</p>}

                    <div className={styles.mobileCardFooter}>
                      <div className={styles.mobileCardBadges}>
                        <Badge type="status" value={statusReal} />
                        <Badge type="prioridade" value={tarefa.prioridade} />
                      </div>
                      <span
                        className={`${styles.mobileDueDate} ${vencida ? styles.dueDateOverdue : ''}`}
                        suppressHydrationWarning
                      >
                        <CalendarIcon size={13} />
                        {formatarData(tarefa.dataVencimento)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            </>
          )}
        </div>
      </main>

      {/* Modal Criar Tarefa (Charter 6.1.2) */}
      <TaskCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={recarregar}
      />
    </>
  );
}
