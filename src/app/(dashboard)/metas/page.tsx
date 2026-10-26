'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { metaService } from '@/services/metaService';
import { ConsultaMetaDTO } from '@/types/api';
import { Badge } from '@/components/common/Badge/Badge';
import { GoalCreateModal } from '@/components/goals/GoalCreateModal/GoalCreateModal';
import { useToast } from '@/contexts/ToastContext';
import styles from './page.module.css';

interface TaskGroup {
  tarefaId: number;
  tarefaNome: string;
  tarefaStatus?: string;
  metas: ConsultaMetaDTO[];
  percentual: number;
}

export default function MetasPage() {
  const { showToast } = useToast();

  const [metas, setMetas] = useState<ConsultaMetaDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const carregarMetas = useCallback(async () => {
    try {
      setLoading(true);
      const data = await metaService.listar();
      setMetas(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message, 'error');
      } else {
        showToast('Falha ao carregar metas.', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    let isMounted = true;

    async function inicializar() {
      try {
        setLoading(true);
        const data = await metaService.listar();
        if (isMounted) {
          setMetas(data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          if (err instanceof Error) {
            showToast(err.message, 'error');
          } else {
            showToast('Falha ao carregar metas.', 'error');
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    inicializar();

    return () => {
      isMounted = false;
    };
  }, [showToast]);

  // Alterna o status de conclusão da meta (RN08)
  const handleToggleConcluida = async (meta: ConsultaMetaDTO) => {
    const novoStatus = !meta.concluida;

    // Atualização otimista na interface
    setMetas((prev) =>
      prev.map((m) => (m.id === meta.id ? { ...m, concluida: novoStatus } : m))
    );

    try {
      await metaService.atualizar(meta.id, {
        concluida: novoStatus,
      });
      showToast(
        novoStatus ? 'Meta marcada como concluída!' : 'Meta reaberta!',
        'success'
      );
    } catch (err: unknown) {
      // Reverte em caso de erro
      setMetas((prev) =>
        prev.map((m) => (m.id === meta.id ? { ...m, concluida: meta.concluida } : m))
      );
      if (err instanceof Error) {
        showToast(err.message, 'error');
      } else {
        showToast('Falha ao atualizar status da meta.', 'error');
      }
    }
  };

  // Exclusão de meta
  const handleDeleteMeta = async (id: number) => {
    if (!confirm('Deseja realmente excluir esta meta?')) return;

    try {
      await metaService.deletar(id);
      showToast('Meta removida com sucesso.', 'success');
      setMetas((prev) => prev.filter((m) => m.id !== id));
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message, 'error');
      } else {
        showToast('Falha ao excluir meta.', 'error');
      }
    }
  };

  // Filtragem e agrupamento de metas por Tarefa vinculada (Charter 6.5)
  const taskGroups = useMemo<TaskGroup[]>(() => {
    const filtradas = metas.filter((m) => {
      const matchMeta = m.nome.toLowerCase().includes(searchTerm.toLowerCase());
      const matchTarefa = m.tarefa?.titulo?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchMeta || matchTarefa;
    });

    const groupsMap = new Map<number, TaskGroup>();

    filtradas.forEach((meta) => {
      const tId = meta.tarefaId;
      const tNome = meta.tarefa?.titulo || `Tarefa #${tId}`;
      const tStatus = meta.tarefa?.status || 'Pendente';

      if (!groupsMap.has(tId)) {
        groupsMap.set(tId, {
          tarefaId: tId,
          tarefaNome: tNome,
          tarefaStatus: tStatus,
          metas: [],
          percentual: 0,
        });
      }

      groupsMap.get(tId)!.metas.push(meta);
    });

    // Calcula o percentual de conclusão por tarefa
    const result = Array.from(groupsMap.values());
    result.forEach((group) => {
      const total = group.metas.length;
      const concluidas = group.metas.filter((m) => m.concluida).length;
      group.percentual = total > 0 ? Math.round((concluidas / total) * 100) : 0;
    });

    return result;
  }, [metas, searchTerm]);

  // Métricas gerais de gamificação
  const totalMetas = metas.length;
  const metasConcluidas = metas.filter((m) => m.concluida).length;
  const metasPendentes = totalMetas - metasConcluidas;
  const percentualGeral = totalMetas > 0 ? Math.round((metasConcluidas / totalMetas) * 100) : 0;

  return (
    <div className={styles.container}>
      {/* Barra de Ações Superior */}
      <div className={styles.topBar}>
        <div className={styles.searchWrapper}>
          <svg
            className={styles.searchIcon}
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por meta ou tarefa vinculada..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className={styles.createBtn}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Criar Meta
        </button>
      </div>

      {/* Painel de Gamificação / KPIs */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricIcon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className={styles.metricInfo}>
            <span className={styles.metricValue}>{totalMetas}</span>
            <span className={styles.metricLabel}>Total de Metas</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className={styles.metricInfo}>
            <span className={styles.metricValue}>{metasConcluidas}</span>
            <span className={styles.metricLabel}>Metas Concluídas</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className={styles.metricInfo}>
            <span className={styles.metricValue}>{metasPendentes}</span>
            <span className={styles.metricLabel}>Metas em Andamento</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ background: 'rgba(123, 79, 201, 0.12)', color: 'var(--cortex-purple)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <div className={styles.metricInfo}>
            <span className={styles.metricValue}>{percentualGeral}%</span>
            <span className={styles.metricLabel}>Taxa de Conclusão</span>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal: Grupos por Tarefa */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--cortex-gray-text)' }}>
          Carregando metas e progresso...
        </div>
      ) : taskGroups.length === 0 ? (
        <div className={styles.emptyState}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--cortex-gray-text)" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="m9 12 2 2 4-4" />
          </svg>
          <h3 className={styles.emptyTitle}>Nenhuma meta encontrada</h3>
          <p className={styles.emptyText}>
            Vincule metas às suas tarefas para acompanhar seu progresso e atingir objetivos estratégicos.
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className={styles.createBtn}
            style={{ marginTop: '12px' }}
          >
            Criar Minha Primeira Meta
          </button>
        </div>
      ) : (
        <div className={styles.groupsContainer}>
          {taskGroups.map((group) => (
            <div key={group.tarefaId} className={styles.taskGroupCard}>
              <div className={styles.groupHeader}>
                <div className={styles.groupTitleWrapper}>
                  <span className={styles.taskName}>{group.tarefaNome}</span>
                  {group.tarefaStatus && (
                    <Badge type="status" value={group.tarefaStatus} />
                  )}
                </div>

                <div className={styles.groupProgressWrapper}>
                  <div className={styles.progressBarTrack}>
                    <div
                      className={styles.progressBarFill}
                      style={{ width: `${group.percentual}%` }}
                    />
                  </div>
                  <span className={styles.progressPercentage}>{group.percentual}%</span>
                </div>
              </div>

              <div className={styles.goalsList}>
                {group.metas.map((meta) => (
                  <div key={meta.id} className={styles.goalItem}>
                    <div className={styles.goalLeft}>
                      <input
                        type="checkbox"
                        checked={meta.concluida}
                        onChange={() => handleToggleConcluida(meta)}
                        className={styles.checkbox}
                        title={
                          meta.concluida
                            ? 'Clique para marcar como pendente'
                            : 'Clique para concluir meta'
                        }
                      />
                      <span
                        className={`${styles.goalName} ${
                          meta.concluida ? styles.goalNameCompleted : ''
                        }`}
                      >
                        {meta.nome}
                      </span>
                    </div>

                    <div className={styles.goalRight}>
                      {meta.dataFechamento && (
                        <span className={styles.dateLimit}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          Limite: {new Date(meta.dataFechamento).toLocaleDateString('pt-BR')}
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteMeta(meta.id)}
                        className={styles.deleteBtn}
                        title="Excluir meta"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Criação de Meta */}
      <GoalCreateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={carregarMetas}
      />
    </div>
  );
}
