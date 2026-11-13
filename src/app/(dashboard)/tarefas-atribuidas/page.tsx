'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/Components/Header/header';
import { Badge } from '@/components/common/Badge/Badge';
import { SearchBar } from '@/components/common/SearchBar/SearchBar';
import { EmptyState } from '@/components/common/EmptyState/EmptyState';
import {
  FileTextIcon,
  SpinnerIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowUpDownIcon,
  CalendarIcon,
} from '@/components/common/Icons/Icons';
import { ConsultaTarefaDTO } from '@/types/api';
import { tarefaService } from '@/services/tarefaService';
import { useAuth } from '@/contexts/AuthContext';
import styles from './page.module.css';

type CampoOrdenacao = 'titulo' | 'vencimento' | 'prioridade' | 'criacao';
type DirecaoOrdenacao = 'asc' | 'desc';

const PESO_PRIORIDADE: Record<string, number> = {
  Baixa: 1,
  Media: 2,
  Alta: 3,
  Urgente: 4,
};

export default function TarefasAtribuidasPage() {
  const router = useRouter();
  const { usuario } = useAuth();

  const [tarefas, setTarefas] = useState<ConsultaTarefaDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [termoBusca, setTermoBusca] = useState('');

  // Ordenação por coluna (padrão: data de criação mais recente)
  const [campoOrdenacao, setCampoOrdenacao] = useState<CampoOrdenacao | null>('criacao');
  const [direcaoOrdenacao, setDirecaoOrdenacao] = useState<DirecaoOrdenacao>('desc');

  const alternarOrdenacao = (campo: CampoOrdenacao) => {
    if (campoOrdenacao === campo) {
      setDirecaoOrdenacao((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setCampoOrdenacao(campo);
      setDirecaoOrdenacao(campo === 'criacao' ? 'desc' : 'asc');
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

  const isVencida = (isoDate: string, status: string) => {
    if (status === 'Concluida') return false;
    return new Date(isoDate) < new Date();
  };

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
    recarregar();
  }, [recarregar]);

  const [highlightedTarefaId, setHighlightedTarefaId] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || tarefas.length === 0) return;

    try {
      const params = new URLSearchParams(window.location.search);
      const targetId = params.get('tarefaId') || params.get('id');
      if (targetId) {
        const numId = Number(targetId);
        const target = tarefas.find((t) => t.id === numId);
        if (target) {
          setHighlightedTarefaId(numId);
          setTimeout(() => {
            const el = document.getElementById(`tarefa-atribuida-row-${numId}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 300);
          const timer = setTimeout(() => setHighlightedTarefaId(null), 8000);
          return () => clearTimeout(timer);
        }
      }
    } catch {}
  }, [tarefas]);

  const formatarData = (isoDate: string) => {
    const data = new Date(isoDate);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const tarefasExibidas = useMemo(() => {
    if (!campoOrdenacao) return tarefas;

    return [...tarefas].sort((a, b) => {
      let diff = 0;

      if (campoOrdenacao === 'vencimento') {
        const timeA = new Date(a.dataVencimento).getTime() || 0;
        const timeB = new Date(b.dataVencimento).getTime() || 0;
        diff = timeA - timeB;
      } else if (campoOrdenacao === 'prioridade') {
        diff = (PESO_PRIORIDADE[a.prioridade] ?? 0) - (PESO_PRIORIDADE[b.prioridade] ?? 0);
      } else if (campoOrdenacao === 'criacao') {
        const timeA = a.dataCriacao ? new Date(a.dataCriacao).getTime() : 0;
        const timeB = b.dataCriacao ? new Date(b.dataCriacao).getTime() : 0;
        diff = timeA - timeB;
      } else if (campoOrdenacao === 'titulo') {
        diff = a.titulo.localeCompare(b.titulo, 'pt-BR');
      }

      if (diff !== 0) {
        return direcaoOrdenacao === 'asc' ? diff : -diff;
      }

      return b.id - a.id;
    });
  }, [tarefas, campoOrdenacao, direcaoOrdenacao]);

  return (
    <>
      <Header titulo="Tarefas atribuídas" />

      <main id="conteudo-principal" className={styles.container}>
        {/* Barra de Pesquisa Padronizada */}
        <div className={styles.toolbar}>
          <SearchBar
            value={termoBusca}
            onChange={setTermoBusca}
            placeholder="Pesquisar tarefa criada..."
            maxWidth={480}
            className={styles.searchBarFlex}
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
          ) : tarefasExibidas.length === 0 ? (
            <EmptyState
              icon={<FileTextIcon size={32} color="var(--cortex-purple)" />}
              title="Nenhuma tarefa atribuída"
              description="Você ainda não criou nem atribuiu nenhuma tarefa a membros ou equipes."
            />
          ) : (
            <>
              <div className={styles.tableResponsive}>
                <table className={styles.table}>
                  <thead>
                  <tr>
                    <th
                      className={`${styles.th} ${styles.thSortable}`}
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
                    </th>

                    <th
                      className={`${styles.th} ${styles.thSortable}`}
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
                    </th>

                    <th
                      className={`${styles.th} ${styles.thSortable}`}
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

                    <th
                      className={`${styles.th} ${styles.thSortable}`}
                      onClick={() => alternarOrdenacao('criacao')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          alternarOrdenacao('criacao');
                        }
                      }}
                      role="columnheader"
                      tabIndex={0}
                      aria-sort={
                        campoOrdenacao === 'criacao'
                          ? direcaoOrdenacao === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                      title="Clique para alternar a ordem por Data de Criação (crescente/decrescente)"
                    >
                      <div className={styles.thContent}>
                        <span>Data de Criação</span>
                        <span className={styles.sortIconContainer}>
                          {renderIconeOrdenacao('criacao')}
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
                        id={`tarefa-atribuida-row-${tarefa.id}`}
                        className={`${styles.tr} ${highlightedTarefaId === tarefa.id ? styles.trHighlighted : ''}`}
                        onClick={() => router.push(`/tarefas-atribuidas/${tarefa.id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td className={styles.td}>
                          <div className={styles.taskTitleCol}>
                            <span className={styles.taskTitle}>{tarefa.titulo}</span>
                          </div>
                        </td>

                        <td className={styles.td}>
                          <span
                            className={`${styles.dueDateCol} ${vencida ? styles.dueDateOverdue : ''}`}
                            suppressHydrationWarning
                          >
                            {formatarData(tarefa.dataVencimento)}
                          </span>
                        </td>

                        <td className={styles.td}>
                          <Badge type="prioridade" value={tarefa.prioridade} />
                        </td>

                        <td className={styles.td}>
                          <span className={styles.createdDateCol} suppressHydrationWarning>
                            {tarefa.dataCriacao ? formatarData(tarefa.dataCriacao) : '-'}
                          </span>
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

                return (
                  <div
                    key={tarefa.id}
                    className={styles.mobileCard}
                    onClick={() => router.push(`/tarefas-atribuidas/${tarefa.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        router.push(`/tarefas-atribuidas/${tarefa.id}`);
                      }
                    }}
                  >
                    <div className={styles.mobileCardHeader}>
                      <span className={styles.mobileCardTitle}>{tarefa.titulo}</span>
                    </div>

                    <div className={styles.mobileCardFooter}>
                      <div className={styles.mobileCardBadges}>
                        <Badge type="prioridade" value={tarefa.prioridade} />
                      </div>

                      <div className={styles.mobileDatesGroup}>
                        <span
                          className={`${styles.mobileDueDate} ${vencida ? styles.dueDateOverdue : ''}`}
                          suppressHydrationWarning
                          title="Data de vencimento"
                        >
                          <CalendarIcon size={12} />
                          {formatarData(tarefa.dataVencimento)}
                        </span>
                        {tarefa.dataCriacao && (
                          <span
                            className={styles.mobileCreatedDate}
                            suppressHydrationWarning
                            title="Data de criação"
                          >
                            Criada: {formatarData(tarefa.dataCriacao)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
          )}
        </div>
      </main>
    </>
  );
}
