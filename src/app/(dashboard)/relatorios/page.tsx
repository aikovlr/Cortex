'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { relatorioService, FiltroRelatorioQuery } from '@/services/relatorioService';
import { equipeService } from '@/services/equipeService';
import {
  RelatorioTarefasDTO,
  RelatorioEquipeDTO,
  ConsultaEquipeDTO,
} from '@/types/api';
import { Badge } from '@/components/common/Badge/Badge';
import { useToast } from '@/contexts/ToastContext';
import styles from './page.module.css';

type ReportView = 'personal' | 'team';

export default function RelatoriosPage() {
  const { showToast } = useToast();

  const [view, setView] = useState<ReportView>('personal');
  const [loading, setLoading] = useState(true);

  // Filtros
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  // Dados do Relatório Pessoal (RN09)
  const [relatorioPessoal, setRelatorioPessoal] = useState<RelatorioTarefasDTO | null>(null);

  // Dados do Relatório de Equipe (RN10)
  const [equipes, setEquipes] = useState<ConsultaEquipeDTO[]>([]);
  const [equipeSelecionadaId, setEquipeSelecionadaId] = useState<number | ''>('');
  const [relatorioEquipe, setRelatorioEquipe] = useState<RelatorioEquipeDTO | null>(null);

  // Carrega lista de equipes para seleção no relatório de equipe
  useEffect(() => {
    let isMounted = true;
    equipeService
      .listarMinhasEquipes()
      .then((res) => {
        if (!isMounted) return;
        setEquipes(res);
        if (res.length > 0) {
          setEquipeSelecionadaId(res[0].id);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  // Busca dados de relatório de acordo com a visualização ativa
  const carregarRelatorio = useCallback(async () => {
    const filtro: FiltroRelatorioQuery = {};
    if (dataInicio) filtro.dataInicio = new Date(dataInicio).toISOString();
    if (dataFim) filtro.dataFim = new Date(dataFim).toISOString();

    try {
      setLoading(true);

      if (view === 'personal') {
        const dados = await relatorioService.obterRelatorioTarefas(filtro);
        setRelatorioPessoal(dados);
      } else if (view === 'team' && equipeSelecionadaId) {
        const dados = await relatorioService.obterRelatorioEquipe(Number(equipeSelecionadaId), filtro);
        setRelatorioEquipe(dados);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message, 'error');
      } else {
        showToast('Falha ao gerar relatório analítico.', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [view, equipeSelecionadaId, dataInicio, dataFim, showToast]);

  useEffect(() => {
    let isMounted = true;
    async function inicializar() {
      const filtro: FiltroRelatorioQuery = {};
      if (dataInicio) filtro.dataInicio = new Date(dataInicio).toISOString();
      if (dataFim) filtro.dataFim = new Date(dataFim).toISOString();

      try {
        setLoading(true);
        if (view === 'personal') {
          const dados = await relatorioService.obterRelatorioTarefas(filtro);
          if (isMounted) setRelatorioPessoal(dados);
        } else if (view === 'team' && equipeSelecionadaId) {
          const dados = await relatorioService.obterRelatorioEquipe(Number(equipeSelecionadaId), filtro);
          if (isMounted) setRelatorioEquipe(dados);
        }
      } catch (err: unknown) {
        if (isMounted) {
          if (err instanceof Error) {
            showToast(err.message, 'error');
          } else {
            showToast('Falha ao carregar relatório.', 'error');
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    inicializar();

    return () => {
      isMounted = false;
    };
  }, [view, equipeSelecionadaId, dataInicio, dataFim, showToast]);

  // Métricas ativas
  const metricas = view === 'personal' ? relatorioPessoal : relatorioEquipe?.metricasGerais;

  return (
    <div className={styles.container}>
      {/* Barra de Seleção de Relatório (Pessoal vs Equipe) */}
      <div className={styles.topBar}>
        <div className={styles.viewSelector}>
          <button
            type="button"
            onClick={() => setView('personal')}
            className={`${styles.viewBtn} ${view === 'personal' ? styles.viewBtnActive : ''}`}
          >
            Meu Desempenho (Individual)
          </button>
          <button
            type="button"
            onClick={() => setView('team')}
            className={`${styles.viewBtn} ${view === 'team' ? styles.viewBtnActive : ''}`}
          >
            Desempenho por Equipe
          </button>
        </div>

        {view === 'team' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--cortex-gray-text)' }}>Equipe:</span>
            <select
              value={equipeSelecionadaId}
              onChange={(e) => setEquipeSelecionadaId(Number(e.target.value))}
              className={styles.filterInput}
              style={{ minWidth: '180px' }}
            >
              {equipes.length === 0 ? (
                <option value="">Nenhuma equipe encontrada</option>
              ) : (
                equipes.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.nome}
                  </option>
                ))
              )}
            </select>
          </div>
        )}
      </div>

      {/* Barra de Filtros por Período */}
      <div className={styles.filtersBar}>
        <div className={styles.filterField}>
          <label className={styles.filterLabel}>Data Início</label>
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className={styles.filterInput}
          />
        </div>

        <div className={styles.filterField}>
          <label className={styles.filterLabel}>Data Fim</label>
          <input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            className={styles.filterInput}
          />
        </div>

        <button
          type="button"
          onClick={carregarRelatorio}
          className={styles.filterBtn}
        >
          Aplicar Filtros
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--cortex-gray-text)' }}>
          Processando dados e métricas analíticas...
        </div>
      ) : !metricas ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--cortex-gray-text)' }}>
          Nenhum dado encontrado para o período informado.
        </div>
      ) : (
        <>
          {/* Painel de Indicadores / KPIs */}
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiValue}>{metricas.totalTarefas}</span>
                <span className={styles.kpiLabel}>Total de Tarefas</span>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon} style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiValue}>{metricas.concluidas}</span>
                <span className={styles.kpiLabel}>Tarefas Concluídas</span>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon} style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiValue}>{metricas.pendentes}</span>
                <span className={styles.kpiLabel}>Tarefas Pendentes</span>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon} style={{ background: 'rgba(214, 49, 49, 0.12)', color: 'var(--cortex-red-danger)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiValue}>{metricas.atrasadas}</span>
                <span className={styles.kpiLabel}>Tarefas Atrasadas</span>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon} style={{ background: 'rgba(123, 79, 201, 0.12)', color: 'var(--cortex-purple)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiValue}>{metricas.taxaConclusaoPercentual}%</span>
                <span className={styles.kpiLabel}>Taxa de Conclusão</span>
              </div>
            </div>
          </div>

          {/* Gráficos / Distribuições */}
          <div className={styles.distributionGrid}>
            <div className={styles.distCard}>
              <h3 className={styles.distTitle}>Distribuição por Prioridade</h3>
              <div className={styles.distList}>
                {Object.entries(metricas.porPrioridade || {}).map(([prioridade, qtd]) => {
                  const percent = metricas.totalTarefas > 0 ? (qtd / metricas.totalTarefas) * 100 : 0;
                  return (
                    <div key={prioridade} className={styles.distRow}>
                      <div className={styles.distHeader}>
                        <span>{prioridade}</span>
                        <span className={styles.distCount}>{qtd} ({percent.toFixed(0)}%)</span>
                      </div>
                      <div className={styles.distBarTrack}>
                        <div className={styles.distBarFill} style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={styles.distCard}>
              <h3 className={styles.distTitle}>Distribuição por Status</h3>
              <div className={styles.distList}>
                {Object.entries(metricas.porStatus || {}).map(([status, qtd]) => {
                  const percent = metricas.totalTarefas > 0 ? (qtd / metricas.totalTarefas) * 100 : 0;
                  return (
                    <div key={status} className={styles.distRow}>
                      <div className={styles.distHeader}>
                        <span>{status}</span>
                        <span className={styles.distCount}>{qtd} ({percent.toFixed(0)}%)</span>
                      </div>
                      <div className={styles.distBarTrack}>
                        <div
                          className={styles.distBarFill}
                          style={{
                            width: `${percent}%`,
                            background:
                              status.toLowerCase().includes('concl')
                                ? '#10b981'
                                : status.toLowerCase().includes('atras')
                                ? 'var(--cortex-red-danger)'
                                : '#f59e0b',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* TABELA DE MEMBROS (Modo Equipe - RN10) */}
          {view === 'team' && relatorioEquipe?.desempenhoMembros && (
            <div className={styles.tableContainer}>
              <div className={styles.tableHeaderSection}>
                <h3 className={styles.tableTitle}>Desempenho Individual por Membro (RN10)</h3>
                <span style={{ fontSize: '13px', color: 'var(--cortex-gray-text)' }}>
                  Total de Integrantes: {relatorioEquipe.totalMembros}
                </span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.th}>Membro</th>
                      <th className={styles.th}>Cargo</th>
                      <th className={styles.th}>Atribuídas</th>
                      <th className={styles.th}>Concluídas</th>
                      <th className={styles.th}>Pendentes</th>
                      <th className={styles.th}>Atrasadas</th>
                      <th className={styles.th}>Taxa de Conclusão</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatorioEquipe.desempenhoMembros.length === 0 ? (
                      <tr>
                        <td colSpan={7} className={styles.td} style={{ textAlign: 'center' }}>
                          Nenhum membro com tarefas atribuídas nesta equipe.
                        </td>
                      </tr>
                    ) : (
                      relatorioEquipe.desempenhoMembros.map((m) => (
                        <tr key={m.usuarioId} className={styles.tr}>
                          <td className={styles.td}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: 600 }}>{m.nome}</span>
                              <span style={{ fontSize: '11px', color: 'var(--cortex-gray-text)' }}>
                                {m.email}
                              </span>
                            </div>
                          </td>
                          <td className={styles.td}>
                            <Badge type="cargo" value={m.cargo} />
                          </td>
                          <td className={styles.td}>{m.totalAtribuidas}</td>
                          <td className={styles.td} style={{ color: '#10b981', fontWeight: 600 }}>
                            {m.concluidas}
                          </td>
                          <td className={styles.td} style={{ color: '#f59e0b' }}>
                            {m.pendentes}
                          </td>
                          <td className={styles.td} style={{ color: 'var(--cortex-red-danger)' }}>
                            {m.atrasadas}
                          </td>
                          <td className={styles.td}>
                            <div className={styles.progressSmall}>
                              <div className={styles.progressSmallTrack}>
                                <div
                                  className={styles.progressSmallFill}
                                  style={{ width: `${m.taxaConclusaoPercentual}%` }}
                                />
                              </div>
                              <span style={{ fontWeight: 600, fontSize: '12px' }}>
                                {m.taxaConclusaoPercentual}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TABELA DE TAREFAS DETALHADAS (Modo Pessoal - RN09) */}
          {view === 'personal' && metricas.tarefas && (
            <div className={styles.tableContainer}>
              <div className={styles.tableHeaderSection}>
                <h3 className={styles.tableTitle}>Tarefas no Período</h3>
                <span style={{ fontSize: '13px', color: 'var(--cortex-gray-text)' }}>
                  Total: {metricas.tarefas.length} tarefas
                </span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.th}>Título da Tarefa</th>
                      <th className={styles.th}>Status</th>
                      <th className={styles.th}>Prioridade</th>
                      <th className={styles.th}>Vencimento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metricas.tarefas.length === 0 ? (
                      <tr>
                        <td colSpan={4} className={styles.td} style={{ textAlign: 'center' }}>
                          Nenhuma tarefa registrada para o período selecionado.
                        </td>
                      </tr>
                    ) : (
                      metricas.tarefas.map((t) => (
                        <tr key={t.id} className={styles.tr}>
                          <td className={styles.td} style={{ fontWeight: 600 }}>
                            {t.titulo}
                          </td>
                          <td className={styles.td}>
                            <Badge type="status" value={t.status} />
                          </td>
                          <td className={styles.td}>
                            <Badge type="prioridade" value={t.prioridade} />
                          </td>
                          <td className={styles.td}>
                            {new Date(t.dataVencimento).toLocaleDateString('pt-BR')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
