'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/app/Components/Header/header';
import { TaskEditModal } from '@/components/tasks/TaskEditModal/TaskEditModal';
import { ConsultaTarefaDTO } from '@/types/api';
import { tarefaService } from '@/services/tarefaService';
import { useAuth } from '@/contexts/AuthContext';
import styles from './page.module.css';

export default function TarefasAtribuidasPage() {
  const { usuario } = useAuth();

  const [tarefas, setTarefas] = useState<ConsultaTarefaDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [termoBusca, setTermoBusca] = useState('');

  // Modal de Edição (Charter 6.2.1)
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  const recarregar = useCallback(() => {
    if (!usuario) return;
    setLoading(true);
    tarefaService
      .listarTarefas({
        criadorId: usuario.id,
        termoBusca: termoBusca.trim() || undefined,
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
  }, [usuario, termoBusca]);

  useEffect(() => {
    let isMounted = true;
    if (!usuario) return;

    tarefaService
      .listarTarefas({
        criadorId: usuario.id,
        termoBusca: termoBusca.trim() || undefined,
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
  }, [usuario, termoBusca]);

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
      <Header titulo="Tarefas atribuídas" subtitulo="Workspace / Cortex" />

      <main className={styles.container}>
        {/* Barra de Pesquisa */}
        <div className={styles.toolbar}>
          <div className={styles.searchInputWrapper}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Pesquisar tarefa criada..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        {/* Tabela de Tarefas Criadas / Atribuídas (Charter 6.2) */}
        <div className={styles.tableCard}>
          {loading ? (
            <div className={styles.emptyState}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
              <p>Carregando tarefas atribuídas...</p>
            </div>
          ) : tarefas.length === 0 ? (
            <div className={styles.emptyState}>
              <div style={{ fontSize: '36px' }}>📝</div>
              <h3 className={styles.emptyTitle}>Nenhuma tarefa atribuída</h3>
              <p className={styles.emptySubtitle}>
                Você ainda não criou nem atribuiu nenhuma tarefa a membros ou equipes.
              </p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Tarefa</th>
                  <th className={styles.th}>Vencimento</th>
                  <th className={styles.th}>Responsável</th>
                  <th className={styles.th} style={{ textAlign: 'right' }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {tarefas.map((tarefa) => (
                  <tr key={tarefa.id} className={styles.tr}>
                    <td className={styles.td}>
                      <div className={styles.taskTitleCol}>
                        <span className={styles.taskTitle}>{tarefa.titulo}</span>
                      </div>
                    </td>

                    <td className={styles.td}>
                      <span className={styles.dueDateCol}>
                        {formatarData(tarefa.dataVencimento)}
                      </span>
                    </td>

                    <td className={styles.td}>
                      <span className={styles.responsibleCol}>
                        Atribuído
                      </span>
                    </td>

                    <td className={styles.td} style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className={styles.editButton}
                        onClick={() => setSelectedTaskId(tarefa.id)}
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Modal de Edição de Tarefa (Charter 6.2.1) */}
      <TaskEditModal
        tarefaId={selectedTaskId}
        isOpen={selectedTaskId !== null}
        onClose={() => setSelectedTaskId(null)}
        onSuccess={recarregar}
      />
    </>
  );
}
