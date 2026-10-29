'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Header from '@/app/Components/Header/header';
import { metaService } from '@/services/metaService';
import { ConsultaMetaDTO, ConsultaTarefaDTO } from '@/types/api';
import { Badge } from '@/components/common/Badge/Badge';
import { SearchBar } from '@/components/common/SearchBar/SearchBar';
import { CalendarIcon } from '@/components/common/Icons/Icons';
import { GoalCreateModal } from '@/components/goals/GoalCreateModal/GoalCreateModal';
import { useToast } from '@/contexts/ToastContext';
import styles from './page.module.css';

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

  // Extrai as tarefas vinculadas a uma meta
  const getTarefasDaMeta = useCallback((meta: ConsultaMetaDTO): ConsultaTarefaDTO[] => {
    if (meta.tarefas && meta.tarefas.length > 0) return meta.tarefas;
    if (meta.tarefa) return [meta.tarefa as ConsultaTarefaDTO];
    return [];
  }, []);

  // Calcula o percentual de conclusão da meta com base nas suas tarefas
  const getProgressoMeta = useCallback((meta: ConsultaMetaDTO) => {
    const tarefas = getTarefasDaMeta(meta);
    if (tarefas.length === 0) return meta.concluida ? 100 : 0;
    const concluidas = tarefas.filter((t) => t.status === 'Concluida').length;
    return Math.round((concluidas / tarefas.length) * 100);
  }, [getTarefasDaMeta]);

  const isMetaConcluida = useCallback((meta: ConsultaMetaDTO) => {
    if (meta.concluida) return true;
    const tarefas = getTarefasDaMeta(meta);
    return tarefas.length > 0 && tarefas.every((t) => t.status === 'Concluida');
  }, [getTarefasDaMeta]);

  // Determina o status da meta: Concluida, Atrasada ou Pendente
  const getMetaStatus = useCallback(
    (meta: ConsultaMetaDTO): 'Atrasada' | 'Pendente' | 'Concluida' => {
      if (isMetaConcluida(meta)) {
        return 'Concluida';
      }

      const agora = new Date();

      if (meta.dataFechamento) {
        const dataMeta = new Date(meta.dataFechamento);
        if (meta.dataFechamento.includes('T00:00:00') || !meta.dataFechamento.includes('T')) {
          const datePart = meta.dataFechamento.split('T')[0];
          const [year, month, day] = datePart.split('-').map(Number);
          if (year && month && day) {
            const fim = new Date(year, month - 1, day, 23, 59, 59, 999);
            if (fim < agora) return 'Atrasada';
          } else if (dataMeta < agora) {
            return 'Atrasada';
          }
        } else if (dataMeta < agora) {
          return 'Atrasada';
        }
      }

      const tarefas = getTarefasDaMeta(meta);
      const temTarefaAtrasada = tarefas.some(
        (t) =>
          t.status === 'Atrasada' ||
          (t.status !== 'Concluida' && t.dataVencimento && new Date(t.dataVencimento) < agora)
      );

      if (temTarefaAtrasada) {
        return 'Atrasada';
      }

      return 'Pendente';
    },
    [getTarefasDaMeta, isMetaConcluida]
  );

  // Filtragem por busca e ordenação por status (Atrasada > Pendente > Concluida)
  const metasFiltradas = useMemo(() => {
    let filtradas = metas;
    if (searchTerm.trim()) {
      const termo = searchTerm.toLowerCase();
      filtradas = metas.filter((m) => {
        const matchNome = m.nome.toLowerCase().includes(termo);
        const tarefas = getTarefasDaMeta(m);
        const matchTarefa = tarefas.some((t) => t.titulo.toLowerCase().includes(termo));
        return matchNome || matchTarefa;
      });
    }

    const PRIORIDADE_STATUS: Record<string, number> = {
      Atrasada: 1,
      Pendente: 2,
      Concluida: 3,
    };

    return [...filtradas].sort((a, b) => {
      const statusA = getMetaStatus(a);
      const statusB = getMetaStatus(b);
      const pesoDiff = (PRIORIDADE_STATUS[statusA] ?? 99) - (PRIORIDADE_STATUS[statusB] ?? 99);
      if (pesoDiff !== 0) return pesoDiff;
      return a.id - b.id;
    });
  }, [metas, searchTerm, getTarefasDaMeta, getMetaStatus]);

  // Métricas gerais de gamificação
  const totalMetas = metas.length;
  const metasConcluidas = metas.filter((m) => isMetaConcluida(m)).length;
  const metasPendentes = totalMetas - metasConcluidas;
  const percentualGeral = totalMetas > 0 ? Math.round((metasConcluidas / totalMetas) * 100) : 0;

  return (
    <>
      <Header titulo="Metas" subtitulo="Workspace / Cortex" />
      <main className={styles.container}>
        {/* Barra de Ações Superior Padronizada */}
        <div className={styles.topBar}>
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar por meta ou tarefa vinculada..."
            maxWidth={420}
          />

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

        {/* Conteúdo Principal: Lista de Metas com Tarefas Vinculadas */}
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--cortex-gray-text)' }}>
            Carregando metas e progresso...
          </div>
        ) : metasFiltradas.length === 0 ? (
          <div className={styles.emptyState}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--cortex-gray-text)" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <h3 className={styles.emptyTitle}>Nenhuma meta encontrada</h3>
            <p className={styles.emptyText}>
              Crie metas e vincule uma ou mais tarefas para acompanhar seu progresso e atingir objetivos estratégicos.
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
            {metasFiltradas.map((meta) => {
              const tarefas = getTarefasDaMeta(meta);
              const progresso = getProgressoMeta(meta);
              const status = getMetaStatus(meta);
              const concluida = status === 'Concluida';

              return (
                <div key={meta.id} className={styles.taskGroupCard}>
                  <div className={styles.groupHeader}>
                    <div className={styles.groupTitleWrapper}>
                      <span className={`${styles.taskName} ${concluida ? styles.goalNameCompleted : ''}`}>
                        {meta.nome}
                      </span>
                      <Badge
                        type="status"
                        value={status}
                      />
                      {meta.dataFechamento && (
                        <span className={styles.dateLimit} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }} suppressHydrationWarning>
                          <CalendarIcon size={13} /> Prazo: {new Date(meta.dataFechamento).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div className={styles.groupProgressWrapper}>
                        <div className={styles.progressBarTrack}>
                          <div
                            className={styles.progressBarFill}
                            style={{ width: `${progresso}%` }}
                          />
                        </div>
                        <span className={styles.progressPercentage}>{progresso}%</span>
                      </div>

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

                  <div className={styles.goalsList}>
                    <div style={{ padding: '8px 16px 4px', fontSize: '12px', fontWeight: 600, color: 'var(--cortex-gray-text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Tarefas Vinculadas ({tarefas.length})
                    </div>

                    {tarefas.length === 0 ? (
                      <div style={{ padding: '12px 16px', color: 'var(--cortex-gray-text)', fontSize: '13px' }}>
                        Nenhuma tarefa vinculada a esta meta.
                      </div>
                    ) : (
                      tarefas.map((tarefa) => (
                        <div key={tarefa.id} className={styles.goalItem}>
                          <div className={styles.goalLeft}>
                            <Badge type="status" value={tarefa.status} />
                            <span
                              className={`${styles.goalName} ${
                                tarefa.status === 'Concluida' ? styles.goalNameCompleted : ''
                              }`}
                            >
                              {tarefa.titulo}
                            </span>
                          </div>

                          <div className={styles.goalRight}>
                            <Badge type="prioridade" value={tarefa.prioridade} />
                            {tarefa.dataVencimento && (
                              <span className={styles.dateLimit} suppressHydrationWarning>
                                Entrega: {new Date(tarefa.dataVencimento).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal de Criação de Meta */}
      <GoalCreateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={carregarMetas}
      />
    </>
  );
}
