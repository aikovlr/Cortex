'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/Components/Header/header';
import { Badge } from '@/components/common/Badge/Badge';
import { SearchBar } from '@/components/common/SearchBar/SearchBar';
import { EmptyState } from '@/components/common/EmptyState/EmptyState';
import { PlusIcon, ClipboardIcon, SpinnerIcon } from '@/components/common/Icons/Icons';
import { TaskCreateModal } from '@/components/tasks/TaskCreateModal/TaskCreateModal';
import { ConsultaTarefaDTO, Prioridade } from '@/types/api';
import { tarefaService } from '@/services/tarefaService';
import { useAuth } from '@/contexts/AuthContext';
import styles from './page.module.css';

export default function MinhasTarefasPage() {
  const router = useRouter();
  const { usuario } = useAuth();

  const [tarefas, setTarefas] = useState<ConsultaTarefaDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState<'pendentes' | 'concluidas'>('pendentes');
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

  const isVencida = (isoDate: string, status: string) => {
    if (status === 'Concluida') return false;
    return new Date(isoDate) < new Date();
  };

  // Filtragem pelas duas abas
  const totalPendentesEAtrasadas = tarefas.filter((t) => t.status !== 'Concluida').length;
  const totalConcluidas = tarefas.filter((t) => t.status === 'Concluida').length;

  const tarefasPendentes = tarefas.filter((t) => {
    if (t.status === 'Concluida') return false;
    const vencida = isVencida(t.dataVencimento, t.status);
    const statusReal = vencida ? 'Atrasada' : t.status;
    if (filtroStatus === 'Pendente') return statusReal === 'Pendente';
    if (filtroStatus === 'Atrasada') return statusReal === 'Atrasada';
    return true;
  });

  const tarefasConcluidas = tarefas.filter((t) => t.status === 'Concluida');

  const tarefasExibidas = abaAtiva === 'pendentes' ? tarefasPendentes : tarefasConcluidas;

  return (
    <>
      <Header titulo="Minhas tarefas" subtitulo="Workspace / Cortex" />

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
            <SearchBar
              value={termoBusca}
              onChange={setTermoBusca}
              placeholder="Pesquisar tarefa..."
              maxWidth={360}
            />

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

          <button
            type="button"
            className={styles.addButton}
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
                          suppressHydrationWarning
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
