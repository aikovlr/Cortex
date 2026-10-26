'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/app/Components/Header/header';
import { TaskEditModal } from '@/components/tasks/TaskEditModal/TaskEditModal';
import { SearchBar } from '@/components/common/SearchBar/SearchBar';
import { EmptyState } from '@/components/common/EmptyState/EmptyState';
import { FileTextIcon, SpinnerIcon } from '@/components/common/Icons/Icons';
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
        {/* Barra de Pesquisa Padronizada */}
        <div className={styles.toolbar}>
          <SearchBar
            value={termoBusca}
            onChange={setTermoBusca}
            placeholder="Pesquisar tarefa criada..."
            maxWidth={480}
          />
        </div>

        {/* Tabela de Tarefas Criadas / Atribuídas (Charter 6.2) */}
        <div className={styles.tableCard}>
          {loading ? (
            <EmptyState
              icon={<SpinnerIcon size={32} color="var(--cortex-purple)" />}
              title="Carregando tarefas atribuídas..."
              description="Aguarde um momento enquanto carregamos as tarefas."
            />
          ) : tarefas.length === 0 ? (
            <EmptyState
              icon={<FileTextIcon size={32} color="var(--cortex-purple)" />}
              title="Nenhuma tarefa atribuída"
              description="Você ainda não criou nem atribuiu nenhuma tarefa a membros ou equipes."
            />
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
