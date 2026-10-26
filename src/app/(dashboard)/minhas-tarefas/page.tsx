'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/Components/Header/header';
import { Badge } from '@/components/common/Badge/Badge';
import { TaskCreateModal } from '@/components/tasks/TaskCreateModal/TaskCreateModal';
import { ConsultaTarefaDTO, StatusTarefa, Prioridade } from '@/types/api';
import { tarefaService } from '@/services/tarefaService';
import { useAuth } from '@/contexts/AuthContext';
import styles from './page.module.css';

export default function MinhasTarefasPage() {
  const router = useRouter();
  const { usuario } = useAuth();

  const [tarefas, setTarefas] = useState<ConsultaTarefaDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>('todas');

  // Modais
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const recarregar = useCallback(() => {
    if (!usuario) return;
    setLoading(true);
    tarefaService
      .listarTarefas({
        responsavelId: usuario.id,
        termoBusca: termoBusca.trim() || undefined,
        status: filtroStatus !== 'todos' ? (filtroStatus as StatusTarefa) : undefined,
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
  }, [usuario, termoBusca, filtroStatus, filtroPrioridade]);

  useEffect(() => {
    let isMounted = true;
    if (!usuario) return;

    tarefaService
      .listarTarefas({
        responsavelId: usuario.id,
        termoBusca: termoBusca.trim() || undefined,
        status: filtroStatus !== 'todos' ? (filtroStatus as StatusTarefa) : undefined,
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
  }, [usuario, termoBusca, filtroStatus, filtroPrioridade]);

  const formatarData = (isoDate: string) => {
    const data = new Date(isoDate);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const isVencida = (isoDate: string, status: string) => {
    if (status === 'Concluida') return false;
    return new Date(isoDate) < new Date();
  };

  return (
    <>
      <Header titulo="Minhas tarefas" subtitulo="Workspace / Cortex" />

      <main className={styles.container}>
        {/* Barra de Ferramentas: Busca + Filtros + Botão Adicionar */}
        <div className={styles.toolbar}>
          <div className={styles.searchFilters}>
            <div className={styles.searchInputWrapper}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                type="text"
                placeholder="Pesquisar tarefa..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="todos">Todos os status</option>
              <option value="Pendente">Pendente</option>
              <option value="Atrasada">Atrasada</option>
              <option value="Concluida">Concluída</option>
            </select>

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

          <button
            type="button"
            className={styles.addButton}
            onClick={() => setIsCreateOpen(true)}
            title="Criar nova tarefa"
            aria-label="Criar nova tarefa"
          >
            +
          </button>
        </div>

        {/* Tabela de Tarefas no Padrão do Charter */}
        <div className={styles.tableCard}>
          {loading ? (
            <div className={styles.emptyState}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
              <p>Carregando suas tarefas...</p>
            </div>
          ) : tarefas.length === 0 ? (
            <div className={styles.emptyState}>
              <div style={{ fontSize: '36px' }}>📋</div>
              <h3 className={styles.emptyTitle}>Nenhuma tarefa encontrada</h3>
              <p className={styles.emptySubtitle}>
                Você não possui tarefas atribuídas no momento ou nenhuma corresponde aos filtros aplicados.
              </p>
              <button
                type="button"
                className={styles.createFirstBtn}
                onClick={() => setIsCreateOpen(true)}
              >
                + Criar primeira tarefa
              </button>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Tarefa</th>
                  <th className={styles.th}>Vencimento</th>
                  <th className={styles.th}>Status</th>
                  <th className={styles.th}>Prioridade</th>
                </tr>
              </thead>
              <tbody>
                {tarefas.map((tarefa) => {
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
                          {tarefa.descricao && (
                            <span className={styles.taskDesc}>{tarefa.descricao}</span>
                          )}
                        </div>
                      </td>

                      <td className={styles.td}>
                        <span
                          className={`${styles.dueDateCol} ${
                            vencida ? styles.dueDateOverdue : ''
                          }`}
                        >
                          {formatarData(tarefa.dataVencimento)}
                          {vencida && ' (Atrasada)'}
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
