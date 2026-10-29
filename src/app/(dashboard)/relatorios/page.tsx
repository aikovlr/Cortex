'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Header from '@/app/Components/Header/header';
import { relatorioService, FiltroRelatorioQuery } from '@/services/relatorioService';
import { equipeService } from '@/services/equipeService';
import { usuarioService } from '@/services/usuarioService';
import {
  RelatorioTarefasDTO,
  RelatorioEquipeDTO,
  ConsultaEquipeDTO,
  ConsultaUsuarioDTO,
} from '@/types/api';
import { Badge } from '@/components/common/Badge/Badge';
import { Modal } from '@/components/common/Modal/Modal';
import { Button } from '@/components/common/Button/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import styles from './page.module.css';

type ReportView = 'personal' | 'created' | 'team';

export default function RelatoriosPage() {
  const { usuario } = useAuth();
  const { showToast } = useToast();

  const [view, setView] = useState<ReportView>('personal');
  const [loading, setLoading] = useState(true);

  // Filtros
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroPrioridade, setFiltroPrioridade] = useState('');
  const [filtroResponsavelId, setFiltroResponsavelId] = useState<number | ''>('');

  // Usuários para o filtro de responsável
  const [todosUsuarios, setTodosUsuarios] = useState<ConsultaUsuarioDTO[]>([]);

  // Dados do Relatório de Tarefas (Responsável ou Criadas)
  const [relatorioTarefas, setRelatorioTarefas] = useState<RelatorioTarefasDTO | null>(null);

  // Dados do Relatório de Equipe (RN10)
  const [equipes, setEquipes] = useState<ConsultaEquipeDTO[]>([]);
  const [equipeSelecionadaId, setEquipeSelecionadaId] = useState<number | ''>('');
  const [relatorioEquipe, setRelatorioEquipe] = useState<RelatorioEquipeDTO | null>(null);

  // Opções para a Exportação em PDF (Gráficos de Colunas e Seções)
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfOptComparativo, setPdfOptComparativo] = useState(true);
  const [pdfOptConcluidas, setPdfOptConcluidas] = useState(true);
  const [pdfOptPendentes, setPdfOptPendentes] = useState(true);
  const [pdfOptAtrasadas, setPdfOptAtrasadas] = useState(true);
  const [pdfOptKpis, setPdfOptKpis] = useState(true);
  const [pdfOptTabelaMembros, setPdfOptTabelaMembros] = useState(true);
  const [pdfOptTabelaTarefas, setPdfOptTabelaTarefas] = useState(true);

  // Equipes onde o usuário logado é Dono ou Administrador
  const equipesOndeEhAdminOuDono = useMemo(() => {
    if (!usuario) return [];
    return equipes.filter((eq) =>
      eq.membros?.some(
        (m) => m.usuarioId === usuario.id && (m.cargo === 'Dono' || m.cargo === 'Admin')
      )
    );
  }, [equipes, usuario]);

  // Carrega lista de equipes e lista geral de usuários
  useEffect(() => {
    let isMounted = true;

    Promise.all([
      equipeService.listarMinhasEquipes().catch(() => []),
      usuarioService.listarUsuarios().catch(() => []),
    ]).then(([minhasEquipes, usuariosCadastrados]) => {
      if (!isMounted) return;
      setEquipes(minhasEquipes);
      setTodosUsuarios(usuariosCadastrados);

      // Define equipe padrão para relatórios de equipe (apenas equipes onde é Dono/Admin)
      const adminEquipes = minhasEquipes.filter((eq) =>
        eq.membros?.some(
          (m) => m.usuarioId === usuario?.id && (m.cargo === 'Dono' || m.cargo === 'Admin')
        )
      );

      if (adminEquipes.length > 0) {
        setEquipeSelecionadaId(adminEquipes[0].id);
      } else if (minhasEquipes.length > 0) {
        setEquipeSelecionadaId(minhasEquipes[0].id);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [usuario]);

  // Busca dados de relatório de acordo com a visualização ativa e filtros
  const carregarRelatorio = useCallback(async () => {
    const filtro: FiltroRelatorioQuery = {};
    if (dataInicio) filtro.dataInicio = new Date(dataInicio).toISOString();
    if (dataFim) filtro.dataFim = new Date(dataFim).toISOString();
    if (filtroStatus) filtro.status = filtroStatus;
    if (filtroPrioridade) filtro.prioridade = filtroPrioridade;
    if (filtroResponsavelId) filtro.responsavelId = Number(filtroResponsavelId);

    try {
      setLoading(true);

      if (view === 'personal') {
        const dados = await relatorioService.obterRelatorioTarefas({
          ...filtro,
          responsavelId: usuario?.id,
        });
        setRelatorioTarefas(dados);
      } else if (view === 'created') {
        const dados = await relatorioService.obterRelatorioTarefas({
          ...filtro,
          criadorId: usuario?.id,
        });
        setRelatorioTarefas(dados);
      } else if (view === 'team') {
        if (!equipeSelecionadaId) {
          setRelatorioEquipe(null);
          return;
        }

        // Verifica se é admin/dono desta equipe
        const ehPermitido = equipesOndeEhAdminOuDono.some(
          (eq) => eq.id === Number(equipeSelecionadaId)
        );

        if (!ehPermitido) {
          setRelatorioEquipe(null);
          return;
        }

        const dados = await relatorioService.obterRelatorioEquipe(
          Number(equipeSelecionadaId),
          filtro
        );
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
  }, [
    view,
    equipeSelecionadaId,
    dataInicio,
    dataFim,
    filtroStatus,
    filtroPrioridade,
    filtroResponsavelId,
    usuario,
    equipesOndeEhAdminOuDono,
    showToast,
  ]);

  // Carrega ao mudar a view ou equipe selecionada
  useEffect(() => {
    let isMounted = true;
    const filtro: FiltroRelatorioQuery = {};
    if (dataInicio) filtro.dataInicio = new Date(dataInicio).toISOString();
    if (dataFim) filtro.dataFim = new Date(dataFim).toISOString();
    if (filtroStatus) filtro.status = filtroStatus;
    if (filtroPrioridade) filtro.prioridade = filtroPrioridade;
    if (filtroResponsavelId) filtro.responsavelId = Number(filtroResponsavelId);

    async function buscar() {
      try {
        setLoading(true);
        if (view === 'personal') {
          const dados = await relatorioService.obterRelatorioTarefas({
            ...filtro,
            responsavelId: usuario?.id,
          });
          if (isMounted) setRelatorioTarefas(dados);
        } else if (view === 'created') {
          const dados = await relatorioService.obterRelatorioTarefas({
            ...filtro,
            criadorId: usuario?.id,
          });
          if (isMounted) setRelatorioTarefas(dados);
        } else if (view === 'team') {
          if (!equipeSelecionadaId) {
            if (isMounted) setRelatorioEquipe(null);
            return;
          }
          const ehPermitido = equipesOndeEhAdminOuDono.some(
            (eq) => eq.id === Number(equipeSelecionadaId)
          );
          if (!ehPermitido) {
            if (isMounted) setRelatorioEquipe(null);
            return;
          }
          const dados = await relatorioService.obterRelatorioEquipe(
            Number(equipeSelecionadaId),
            filtro
          );
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

    buscar();

    return () => {
      isMounted = false;
    };
  }, [
    view,
    equipeSelecionadaId,
    dataInicio,
    dataFim,
    filtroStatus,
    filtroPrioridade,
    filtroResponsavelId,
    usuario,
    equipesOndeEhAdminOuDono,
    showToast,
  ]);

  const handleLimparFiltros = () => {
    setDataInicio('');
    setDataFim('');
    setFiltroStatus('');
    setFiltroPrioridade('');
    setFiltroResponsavelId('');
  };

  // Determina as opções de responsáveis disponíveis para o filtro
  const responsaveisOpcoes = useMemo(() => {
    if (view === 'team' && equipeSelecionadaId) {
      const equipeAtual = equipes.find((eq) => eq.id === Number(equipeSelecionadaId));
      if (equipeAtual?.membros && equipeAtual.membros.length > 0) {
        return equipeAtual.membros
          .map((m) => m.usuario)
          .filter((u): u is ConsultaUsuarioDTO => u !== null && u !== undefined);
      }
    }
    return todosUsuarios;
  }, [view, equipeSelecionadaId, equipes, todosUsuarios]);

  // Métricas ativas
  const metricas = view === 'team' ? relatorioEquipe?.metricasGerais : relatorioTarefas;

  const equipeSelecionada = equipes.find((eq) => eq.id === Number(equipeSelecionadaId));
  const usuarioEhAdminOuDonoDaEquipeSelecionada = equipesOndeEhAdminOuDono.some(
    (eq) => eq.id === Number(equipeSelecionadaId)
  );

  // Função para gerar e exportar relatório da equipe em PDF com Gráficos de Colunas
  const handleExportarPdf = () => {
    if (!relatorioEquipe || !metricas) {
      showToast('Nenhum dado disponível para exportação.', 'info');
      return;
    }

    const equipeNome = relatorioEquipe.equipeNome;
    const geradoEmFormatado = new Date().toLocaleString('pt-BR');
    const solicitanteNome = usuario?.nome || 'Administrador';
    const membros = relatorioEquipe.desempenhoMembros || [];
    const tarefas = metricas.tarefas || [];

    // Cálculo das escalas máximas para os gráficos de colunas
    const maxConcluidas = Math.max(...membros.map((m) => m.concluidas), 1);
    const maxPendentes = Math.max(...membros.map((m) => m.pendentes), 1);
    const maxAtrasadas = Math.max(...membros.map((m) => m.atrasadas), 1);
    const maxGeral = Math.max(
      ...membros.map((m) => Math.max(m.concluidas, m.pendentes, m.atrasadas)),
      1
    );

    // Constrói o HTML para impressão/PDF com gráficos de colunas verticais
    const printContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>Relatório Analítico de Desempenho - ${equipeNome}</title>
        <style>
          @page {
            size: A4;
            margin: 14mm 12mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #1f2937;
            background: #ffffff;
            margin: 0;
            padding: 0;
            font-size: 12px;
            line-height: 1.4;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #7c3aed;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }
          .brand-title {
            font-size: 20px;
            font-weight: 800;
            color: #7c3aed;
            margin: 0;
            letter-spacing: -0.02em;
          }
          .report-subtitle {
            font-size: 12px;
            color: #6b7280;
            margin-top: 4px;
          }
          .meta-info {
            text-align: right;
            font-size: 11px;
            color: #4b5563;
          }
          .meta-info strong {
            color: #111827;
          }
          .filters-summary {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 8px 12px;
            margin-bottom: 16px;
            font-size: 11px;
            display: flex;
            gap: 16px;
            flex-wrap: wrap;
          }
          .kpi-row {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 10px;
            margin-bottom: 20px;
            break-inside: avoid;
          }
          .kpi-card {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 10px;
            text-align: center;
            background-color: #ffffff;
          }
          .kpi-val {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 2px;
            color: #111827;
          }
          .kpi-lbl {
            font-size: 10px;
            color: #6b7280;
            font-weight: 600;
            text-transform: uppercase;
          }
          .section-title {
            font-size: 14px;
            font-weight: 700;
            color: #111827;
            border-left: 4px solid #7c3aed;
            padding-left: 8px;
            margin: 22px 0 12px 0;
            break-after: avoid;
          }

          /* Estrutura de Gráfico de Colunas */
          .column-chart-box {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 16px 18px 12px 18px;
            margin-bottom: 20px;
            background-color: #ffffff;
            break-inside: avoid;
          }
          .column-chart-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid #f3f4f6;
          }
          .column-chart-title {
            font-size: 13px;
            font-weight: 700;
            color: #111827;
          }
          .chart-legend {
            display: flex;
            gap: 14px;
            font-size: 11px;
          }
          .legend-pill {
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .legend-dot {
            width: 10px;
            height: 10px;
            border-radius: 2px;
          }
          .column-plot-wrapper {
            display: flex;
            gap: 10px;
            height: 170px;
            margin-top: 8px;
          }
          .column-y-axis {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            font-size: 10px;
            color: #9ca3af;
            padding-bottom: 24px;
            text-align: right;
            width: 24px;
            font-weight: 600;
          }
          .column-plot-area {
            flex: 1;
            display: flex;
            align-items: flex-end;
            justify-content: space-around;
            border-bottom: 2px solid #6b7280;
            border-left: 1px solid #e5e7eb;
            padding-bottom: 2px;
            gap: 12px;
            background: repeating-linear-gradient(
              to top,
              transparent,
              transparent 29px,
              #f9fafb 30px,
              #f9fafb 30px
            );
          }
          .column-bar-item {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            height: 100%;
            max-width: 70px;
          }
          .column-pillar-wrapper {
            flex: 1;
            width: 100%;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            align-items: center;
            position: relative;
          }
          .column-val-text {
            font-size: 10px;
            font-weight: 700;
            margin-bottom: 4px;
          }
          .column-val-zero {
            font-size: 10px;
            color: #9ca3af;
            margin-bottom: 4px;
          }
          .column-pillar {
            width: 28px;
            border-radius: 4px 4px 0 0;
            min-height: 2px;
          }
          .column-member-label {
            height: 22px;
            font-size: 10px;
            color: #374151;
            font-weight: 600;
            text-align: center;
            margin-top: 6px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            width: 100%;
          }

          /* Colunas Agrupadas (Comparativo Lado a Lado) */
          .grouped-bars-wrapper {
            flex: 1;
            width: 100%;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            gap: 4px;
          }
          .single-pillar-group {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-end;
            height: 100%;
          }
          .single-pillar-group .pillar-num {
            font-size: 9px;
            font-weight: 700;
            margin-bottom: 2px;
          }
          .single-pillar-group .single-pillar {
            width: 14px;
            border-radius: 3px 3px 0 0;
            min-height: 2px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 11px;
            break-inside: avoid;
          }
          th {
            background-color: #f3f4f6;
            color: #374151;
            font-weight: 700;
            text-align: left;
            padding: 7px 10px;
            border-bottom: 1px solid #d1d5db;
          }
          td {
            padding: 7px 10px;
            border-bottom: 1px solid #e5e7eb;
            color: #1f2937;
          }
          tr:nth-child(even) td {
            background-color: #f9fafb;
          }
          .badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 9px;
            font-weight: 600;
          }
          .badge-dono { background: #fef3c7; color: #b45309; }
          .badge-admin { background: #ede9fe; color: #6d28d9; }
          .badge-membro { background: #f3f4f6; color: #4b5563; }
          .footer {
            margin-top: 24px;
            padding-top: 8px;
            border-top: 1px solid #e5e7eb;
            font-size: 10px;
            color: #9ca3af;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="brand-title">CORTEX</h1>
            <div class="report-subtitle">Relatório Analítico de Desempenho de Equipe</div>
          </div>
          <div class="meta-info">
            <div>Equipe: <strong>${equipeNome}</strong></div>
            <div>Emitido por: <strong>${solicitanteNome}</strong></div>
            <div>Data de Emissão: <strong>${geradoEmFormatado}</strong></div>
          </div>
        </div>

        <div class="filters-summary">
          <div><strong>Período:</strong> ${dataInicio ? new Date(dataInicio).toLocaleDateString('pt-BR') : 'Início'} até ${dataFim ? new Date(dataFim).toLocaleDateString('pt-BR') : 'Hoje'}</div>
          <div><strong>Status:</strong> ${filtroStatus || 'Todos'}</div>
          <div><strong>Prioridade:</strong> ${filtroPrioridade || 'Todas'}</div>
          <div><strong>Integrantes Analisados:</strong> ${membros.length}</div>
        </div>

        ${
          pdfOptKpis
            ? `
          <div class="kpi-row">
            <div class="kpi-card">
              <div class="kpi-val">${metricas.totalTarefas}</div>
              <div class="kpi-lbl">Total de Tarefas</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-val" style="color: #10b981;">${metricas.concluidas}</div>
              <div class="kpi-lbl">Concluídas</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-val" style="color: #f59e0b;">${metricas.pendentes}</div>
              <div class="kpi-lbl">Pendentes</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-val" style="color: #ef4444;">${metricas.atrasadas}</div>
              <div class="kpi-lbl">Atrasadas</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-val" style="color: #7c3aed;">${metricas.taxaConclusaoPercentual}%</div>
              <div class="kpi-lbl">Taxa de Conclusão</div>
            </div>
          </div>
        `
            : ''
        }

        ${/* Gráfico de Colunas Agrupadas: Comparativo Geral */
          pdfOptComparativo
            ? `
          <div class="column-chart-box">
            <div class="column-chart-header">
              <span class="column-chart-title">Gráfico de Colunas: Desempenho Comparativo por Integrante</span>
              <div class="chart-legend">
                <span class="legend-pill"><span class="legend-dot" style="background: #10b981;"></span> Concluídas</span>
                <span class="legend-pill"><span class="legend-dot" style="background: #f59e0b;"></span> Pendentes</span>
                <span class="legend-pill"><span class="legend-dot" style="background: #ef4444;"></span> Atrasadas</span>
              </div>
            </div>
            <div class="column-plot-wrapper">
              <div class="column-y-axis">
                <span>${maxGeral}</span>
                <span>${Math.round(maxGeral / 2)}</span>
                <span>0</span>
              </div>
              <div class="column-plot-area">
                ${
                  membros.length === 0
                    ? '<div style="color: #9ca3af; font-size: 11px; align-self: center;">Nenhum membro registrado.</div>'
                    : membros
                        .map((m) => {
                          const hConcluidas = maxGeral > 0 ? (m.concluidas / maxGeral) * 100 : 0;
                          const hPendentes = maxGeral > 0 ? (m.pendentes / maxGeral) * 100 : 0;
                          const hAtrasadas = maxGeral > 0 ? (m.atrasadas / maxGeral) * 100 : 0;
                          return `
                      <div class="column-bar-item" style="max-width: 80px;">
                        <div class="grouped-bars-wrapper">
                          <div class="single-pillar-group">
                            <span class="pillar-num" style="color: #10b981;">${m.concluidas}</span>
                            <div class="single-pillar" style="height: ${hConcluidas}%; background-color: #10b981;"></div>
                          </div>
                          <div class="single-pillar-group">
                            <span class="pillar-num" style="color: #f59e0b;">${m.pendentes}</span>
                            <div class="single-pillar" style="height: ${hPendentes}%; background-color: #f59e0b;"></div>
                          </div>
                          <div class="single-pillar-group">
                            <span class="pillar-num" style="color: #ef4444;">${m.atrasadas}</span>
                            <div class="single-pillar" style="height: ${hAtrasadas}%; background-color: #ef4444;"></div>
                          </div>
                        </div>
                        <div class="column-member-label" title="${m.nome}">${m.nome}</div>
                      </div>
                    `;
                        })
                        .join('')
                }
              </div>
            </div>
          </div>
        `
            : ''}

        ${/* Gráfico de Colunas: Tarefas Concluídas */
          pdfOptConcluidas
            ? `
          <div class="column-chart-box">
            <div class="column-chart-header">
              <span class="column-chart-title">Gráfico de Colunas: Tarefas Concluídas por Membro</span>
              <span style="font-size: 11px; font-weight: 700; color: #10b981;">Total de Concluídas: ${metricas.concluidas}</span>
            </div>
            <div class="column-plot-wrapper">
              <div class="column-y-axis">
                <span>${maxConcluidas}</span>
                <span>${Math.round(maxConcluidas / 2)}</span>
                <span>0</span>
              </div>
              <div class="column-plot-area">
                ${
                  membros.length === 0
                    ? '<div style="color: #9ca3af; font-size: 11px; align-self: center;">Nenhum membro registrado.</div>'
                    : membros
                        .map((m) => {
                          const height = maxConcluidas > 0 ? (m.concluidas / maxConcluidas) * 100 : 0;
                          return `
                      <div class="column-bar-item">
                        <div class="column-pillar-wrapper">
                          <span class="${m.concluidas > 0 ? 'column-val-text' : 'column-val-zero'}" style="color: #10b981;">${m.concluidas}</span>
                          <div class="column-pillar" style="height: ${height}%; background-color: #10b981;"></div>
                        </div>
                        <div class="column-member-label" title="${m.nome}">${m.nome}</div>
                      </div>
                    `;
                        })
                        .join('')
                }
              </div>
            </div>
          </div>
        `
            : ''}

        ${/* Gráfico de Colunas: Tarefas Pendentes */
          pdfOptPendentes
            ? `
          <div class="column-chart-box">
            <div class="column-chart-header">
              <span class="column-chart-title">Gráfico de Colunas: Tarefas Pendentes por Membro</span>
              <span style="font-size: 11px; font-weight: 700; color: #f59e0b;">Total de Pendentes: ${metricas.pendentes}</span>
            </div>
            <div class="column-plot-wrapper">
              <div class="column-y-axis">
                <span>${maxPendentes}</span>
                <span>${Math.round(maxPendentes / 2)}</span>
                <span>0</span>
              </div>
              <div class="column-plot-area">
                ${
                  membros.length === 0
                    ? '<div style="color: #9ca3af; font-size: 11px; align-self: center;">Nenhum membro registrado.</div>'
                    : membros
                        .map((m) => {
                          const height = maxPendentes > 0 ? (m.pendentes / maxPendentes) * 100 : 0;
                          return `
                      <div class="column-bar-item">
                        <div class="column-pillar-wrapper">
                          <span class="${m.pendentes > 0 ? 'column-val-text' : 'column-val-zero'}" style="color: #f59e0b;">${m.pendentes}</span>
                          <div class="column-pillar" style="height: ${height}%; background-color: #f59e0b;"></div>
                        </div>
                        <div class="column-member-label" title="${m.nome}">${m.nome}</div>
                      </div>
                    `;
                        })
                        .join('')
                }
              </div>
            </div>
          </div>
        `
            : ''}

        ${/* Gráfico de Colunas: Tarefas Atrasadas */
          pdfOptAtrasadas
            ? `
          <div class="column-chart-box">
            <div class="column-chart-header">
              <span class="column-chart-title">Gráfico de Colunas: Tarefas Atrasadas por Membro</span>
              <span style="font-size: 11px; font-weight: 700; color: #ef4444;">Total de Atrasadas: ${metricas.atrasadas}</span>
            </div>
            <div class="column-plot-wrapper">
              <div class="column-y-axis">
                <span>${maxAtrasadas}</span>
                <span>${Math.round(maxAtrasadas / 2)}</span>
                <span>0</span>
              </div>
              <div class="column-plot-area">
                ${
                  membros.length === 0
                    ? '<div style="color: #9ca3af; font-size: 11px; align-self: center;">Nenhum membro registrado.</div>'
                    : membros
                        .map((m) => {
                          const height = maxAtrasadas > 0 ? (m.atrasadas / maxAtrasadas) * 100 : 0;
                          return `
                      <div class="column-bar-item">
                        <div class="column-pillar-wrapper">
                          <span class="${m.atrasadas > 0 ? 'column-val-text' : 'column-val-zero'}" style="color: #ef4444;">${m.atrasadas}</span>
                          <div class="column-pillar" style="height: ${height}%; background-color: #ef4444;"></div>
                        </div>
                        <div class="column-member-label" title="${m.nome}">${m.nome}</div>
                      </div>
                    `;
                        })
                        .join('')
                }
              </div>
            </div>
          </div>
        `
            : ''}

        ${
          pdfOptTabelaMembros
            ? `
          <h2 class="section-title">Desempenho Individual por Integrante (RN10)</h2>
          <table>
            <thead>
              <tr>
                <th>Integrante</th>
                <th>Cargo</th>
                <th style="text-align: center;">Atribuídas</th>
                <th style="text-align: center;">Concluídas</th>
                <th style="text-align: center;">Pendentes</th>
                <th style="text-align: center;">Atrasadas</th>
                <th style="text-align: right;">Taxa Conclusão</th>
              </tr>
            </thead>
            <tbody>
              ${
                membros.length === 0
                  ? '<tr><td colspan="7" style="text-align: center;">Nenhum membro registrado.</td></tr>'
                  : membros
                      .map((m) => {
                        const badgeCls =
                          m.cargo === 'Dono'
                            ? 'badge-dono'
                            : m.cargo === 'Admin'
                            ? 'badge-admin'
                            : 'badge-membro';
                        return `
                    <tr>
                      <td><strong>${m.nome}</strong><br/><span style="color: #6b7280; font-size: 10px;">${m.email}</span></td>
                      <td><span class="badge ${badgeCls}">${m.cargo}</span></td>
                      <td style="text-align: center;">${m.totalAtribuidas}</td>
                      <td style="text-align: center; color: #10b981; font-weight: 600;">${m.concluidas}</td>
                      <td style="text-align: center; color: #f59e0b;">${m.pendentes}</td>
                      <td style="text-align: center; color: #ef4444; font-weight: 600;">${m.atrasadas}</td>
                      <td style="text-align: right; font-weight: 700;">${m.taxaConclusaoPercentual}%</td>
                    </tr>
                  `;
                      })
                      .join('')
              }
            </tbody>
          </table>
        `
            : ''
        }

        ${
          pdfOptTabelaTarefas
            ? `
          <h2 class="section-title">Lista Detalhada de Tarefas da Equipe</h2>
          <table>
            <thead>
              <tr>
                <th>Título da Tarefa</th>
                <th>Data de Criação</th>
                <th>Vencimento</th>
                <th>Status</th>
                <th>Prioridade</th>
              </tr>
            </thead>
            <tbody>
              ${
                tarefas.length === 0
                  ? '<tr><td colspan="5" style="text-align: center;">Nenhuma tarefa encontrada para o filtro.</td></tr>'
                  : tarefas
                      .map(
                        (t) => `
                    <tr>
                      <td><strong>${t.titulo}</strong></td>
                      <td style="color: #6b7280;">${t.dataCriacao ? new Date(t.dataCriacao).toLocaleDateString('pt-BR') : '-'}</td>
                      <td>${new Date(t.dataVencimento).toLocaleDateString('pt-BR')}</td>
                      <td>${t.status}</td>
                      <td>${t.prioridade}</td>
                    </tr>
                  `
                      )
                      .join('')
              }
            </tbody>
          </table>
        `
            : ''
        }

        <div class="footer">
          Cortex Platform &copy; 2026 — Documento gerado automaticamente para fins de gestão analítica e auditoria de equipe.
        </div>
      </body>
      </html>
    `;

    // Cria um iframe invisível para acionar a impressão/salvar em PDF com qualidade nativa
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';

    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow?.document;
    if (frameDoc) {
      frameDoc.open();
      frameDoc.write(printContent);
      frameDoc.close();

      setTimeout(() => {
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(printFrame);
        }, 1500);
      }, 350);

      setIsPdfModalOpen(false);
      showToast('Janela de impressão/PDF gerada com sucesso!', 'success');
    } else {
      showToast('Falha ao instanciar gerador de impressão.', 'error');
    }
  };

  return (
    <>
      <Header titulo="Relatórios" subtitulo="Workspace / Cortex" />
      <main className={styles.container}>
        {/* Barra de Seleção de Relatório (Responsável vs Criador vs Equipe) */}
        <div className={styles.topBar}>
          <div className={styles.tabsHeader}>
            <button
              type="button"
              onClick={() => {
                setView('personal');
                setFiltroResponsavelId('');
              }}
              className={`${styles.tabBtn} ${view === 'personal' ? styles.tabBtnActive : ''}`}
            >
              Tarefas Onde Sou Responsável
            </button>
            <button
              type="button"
              onClick={() => {
                setView('created');
                setFiltroResponsavelId('');
              }}
              className={`${styles.tabBtn} ${view === 'created' ? styles.tabBtnActive : ''}`}
            >
              Tarefas Criadas por Mim
            </button>
            <button
              type="button"
              onClick={() => {
                setView('team');
                setFiltroResponsavelId('');
              }}
              className={`${styles.tabBtn} ${view === 'team' ? styles.tabBtnActive : ''}`}
            >
              Desempenho por Equipe
            </button>
          </div>

          {/* Controles do modo equipe: Filtro de equipe e Botão de Exportar PDF */}
          {view === 'team' && usuarioEhAdminOuDonoDaEquipeSelecionada && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {equipesOndeEhAdminOuDono.length > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Filtrar por Equipe:
                  </span>
                  <select
                    value={equipeSelecionadaId}
                    onChange={(e) => setEquipeSelecionadaId(Number(e.target.value))}
                    className={styles.filterInput}
                    style={{ minWidth: '180px' }}
                  >
                    {equipesOndeEhAdminOuDono.map((eq) => (
                      <option key={eq.id} value={eq.id}>
                        {eq.nome}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsPdfModalOpen(true)}
                className={styles.exportPdfBtn}
                title="Exportar relatório da equipe em PDF"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                Exportar PDF
              </button>
            </div>
          )}
        </div>

        {/* Barra de Filtros: Status, Prioridade, Responsável, Período */}
        <div className={styles.filtersBar}>
          {/* Filtro de Status */}
          <div className={styles.filterField}>
            <label className={styles.filterLabel}>Status</label>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className={styles.filterInput}
            >
              <option value="">Todos os status</option>
              <option value="Pendente">Pendente</option>
              <option value="Atrasada">Atrasada</option>
              <option value="Concluida">Concluída</option>
            </select>
          </div>

          {/* Filtro de Prioridade */}
          <div className={styles.filterField}>
            <label className={styles.filterLabel}>Prioridade</label>
            <select
              value={filtroPrioridade}
              onChange={(e) => setFiltroPrioridade(e.target.value)}
              className={styles.filterInput}
            >
              <option value="">Todas as prioridades</option>
              <option value="Baixa">Baixa</option>
              <option value="Media">Média</option>
              <option value="Alta">Alta</option>
              <option value="Urgente">Urgente</option>
            </select>
          </div>

          {/* Filtro de Responsável */}
          <div className={styles.filterField}>
            <label className={styles.filterLabel}>Responsável</label>
            {view === 'personal' ? (
              <input
                type="text"
                disabled
                value={usuario?.nome ? `${usuario.nome} (Você)` : 'Você'}
                className={`${styles.filterInput} ${styles.filterInputDisabled}`}
                title="Na aba de tarefas onde você é responsável, o filtro é fixo em você."
              />
            ) : (
              <select
                value={filtroResponsavelId}
                onChange={(e) =>
                  setFiltroResponsavelId(e.target.value ? Number(e.target.value) : '')
                }
                className={styles.filterInput}
              >
                <option value="">Todos os responsáveis</option>
                {responsaveisOpcoes.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome} ({u.email})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Filtro Data Início */}
          <div className={styles.filterField}>
            <label className={styles.filterLabel}>Data Início</label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className={styles.filterInput}
            />
          </div>

          {/* Filtro Data Fim */}
          <div className={styles.filterField}>
            <label className={styles.filterLabel}>Data Fim</label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className={styles.filterInput}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={carregarRelatorio}
              className={styles.filterBtn}
            >
              Aplicar Filtros
            </button>
            {(dataInicio || dataFim || filtroStatus || filtroPrioridade || filtroResponsavelId) && (
              <button
                type="button"
                onClick={handleLimparFiltros}
                className={styles.clearFilterBtn}
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Verificação de Permissão no Modo Equipe */}
        {view === 'team' && !usuarioEhAdminOuDonoDaEquipeSelecionada ? (
          <div className={styles.nonAdminNotice}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--cortex-red-danger)" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <strong style={{ fontSize: '15px', color: 'var(--text-primary)' }}>
              Relatório consolidado restrito
            </strong>
            <span>
              {equipeSelecionada
                ? `Você participa da equipe "${equipeSelecionada.nome}" como Membro.`
                : 'Você não possui permissão de Dono ou Administrador nesta equipe.'}
              <br />
              Conforme a regra de negócio (RN10), relatórios analíticos de equipe são exclusivos para Donos e Administradores.
            </span>
          </div>
        ) : loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--cortex-gray-text)' }}>
            Processando dados e métricas analíticas...
          </div>
        ) : !metricas ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--cortex-gray-text)' }}>
            Nenhum dado encontrado para os filtros informados.
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

            {/* Gráficos Gerais de Distribuição */}
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
                  <h3 className={styles.tableTitle}>
                    Desempenho Individual por Membro — {relatorioEquipe.equipeNome} (RN10)
                  </h3>
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
                            Nenhum membro com tarefas atribuídas nesta equipe para os filtros selecionados.
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

            {/* TABELA DE TAREFAS DETALHADAS (Com Data de Criação das Tarefas) */}
            {metricas.tarefas && (
              <div className={styles.tableContainer}>
                <div className={styles.tableHeaderSection}>
                  <h3 className={styles.tableTitle}>
                    {view === 'personal'
                      ? 'Tarefas Onde Sou Responsável'
                      : view === 'created'
                      ? 'Tarefas Criadas por Mim (Atribuídas)'
                      : `Tarefas da Equipe (${relatorioEquipe?.equipeNome || 'Consolidado'})`}
                  </h3>
                  <span style={{ fontSize: '13px', color: 'var(--cortex-gray-text)' }}>
                    Total: {metricas.tarefas.length} tarefas
                  </span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th className={styles.th}>Título da Tarefa</th>
                        <th className={styles.th}>Data de Criação</th>
                        <th className={styles.th}>Vencimento</th>
                        <th className={styles.th}>Status</th>
                        <th className={styles.th}>Prioridade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metricas.tarefas.length === 0 ? (
                        <tr>
                          <td colSpan={5} className={styles.td} style={{ textAlign: 'center' }}>
                            Nenhuma tarefa registrada para os filtros selecionados.
                          </td>
                        </tr>
                      ) : (
                        metricas.tarefas.map((t) => (
                          <tr key={t.id} className={styles.tr}>
                            <td className={styles.td} style={{ fontWeight: 600 }}>
                              {t.titulo}
                            </td>
                            <td className={styles.td} style={{ color: 'var(--text-secondary)' }}>
                              {t.dataCriacao
                                ? new Date(t.dataCriacao).toLocaleDateString('pt-BR')
                                : '-'}
                            </td>
                            <td className={styles.td}>
                              {new Date(t.dataVencimento).toLocaleDateString('pt-BR')}
                            </td>
                            <td className={styles.td}>
                              <Badge type="status" value={t.status} />
                            </td>
                            <td className={styles.td}>
                              <Badge type="prioridade" value={t.prioridade} />
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
      </main>

      {/* Modal de Configuração e Exportação de Relatório em PDF com Gráficos de Colunas */}
      {relatorioEquipe && (
        <Modal
          isOpen={isPdfModalOpen}
          onClose={() => setIsPdfModalOpen(false)}
          title="Exportar Relatório em PDF"
          maxWidth="580px"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setIsPdfModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleExportarPdf}
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9V2h12v7" />
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                    <path d="M6 14h12v8H6z" />
                  </svg>
                }
              >
                Gerar e Imprimir PDF
              </Button>
            </>
          }
        >
          <p className={styles.modalDescription}>
            Selecione quais <strong>gráficos de colunas</strong> e seções analíticas deseja incluir no documento PDF da equipe <strong>{relatorioEquipe.equipeNome}</strong>:
          </p>

          <div className={styles.optionsGroup}>
            <span className={styles.optionsGroupTitle}>Gráficos de Colunas (Desempenho dos Membros)</span>

            {/* Opção Gráfico de Colunas Agrupadas */}
            <label className={`${styles.checkboxCard} ${pdfOptComparativo ? styles.checkboxCardActive : ''}`}>
              <input
                type="checkbox"
                checked={pdfOptComparativo}
                onChange={(e) => setPdfOptComparativo(e.target.checked)}
                className={styles.checkboxInput}
              />
              <div className={styles.checkboxInfo}>
                <span className={styles.checkboxTitle}>Gráfico de Colunas Comparativo Geral</span>
                <span className={styles.checkboxDesc}>Colunas verticais agrupadas (concluídas em verde, pendentes em amarelo e atrasadas em vermelho lado a lado).</span>
              </div>
            </label>

            {/* Opção Gráfico Colunas Concluídas */}
            <label className={`${styles.checkboxCard} ${pdfOptConcluidas ? styles.checkboxCardActive : ''}`}>
              <input
                type="checkbox"
                checked={pdfOptConcluidas}
                onChange={(e) => setPdfOptConcluidas(e.target.checked)}
                className={styles.checkboxInput}
              />
              <div className={styles.checkboxInfo}>
                <span className={styles.checkboxTitle}>Gráfico de Colunas: Tarefas Concluídas por Membro</span>
                <span className={styles.checkboxDesc}>Colunas verticais em verde com a quantidade exata de tarefas finalizadas por cada integrante.</span>
              </div>
            </label>

            {/* Opção Gráfico Colunas Pendentes */}
            <label className={`${styles.checkboxCard} ${pdfOptPendentes ? styles.checkboxCardActive : ''}`}>
              <input
                type="checkbox"
                checked={pdfOptPendentes}
                onChange={(e) => setPdfOptPendentes(e.target.checked)}
                className={styles.checkboxInput}
              />
              <div className={styles.checkboxInfo}>
                <span className={styles.checkboxTitle}>Gráfico de Colunas: Tarefas Pendentes por Membro</span>
                <span className={styles.checkboxDesc}>Colunas verticais em amarelo mostrando o volume de tarefas em andamento.</span>
              </div>
            </label>

            {/* Opção Gráfico Colunas Atrasadas */}
            <label className={`${styles.checkboxCard} ${pdfOptAtrasadas ? styles.checkboxCardActive : ''}`}>
              <input
                type="checkbox"
                checked={pdfOptAtrasadas}
                onChange={(e) => setPdfOptAtrasadas(e.target.checked)}
                className={styles.checkboxInput}
              />
              <div className={styles.checkboxInfo}>
                <span className={styles.checkboxTitle}>Gráfico de Colunas: Tarefas Atrasadas por Membro</span>
                <span className={styles.checkboxDesc}>Colunas verticais em vermelho destacando tarefas vencidas não concluídas.</span>
              </div>
            </label>
          </div>

          <div className={styles.optionsGroup}>
            <span className={styles.optionsGroupTitle}>Tabelas e Indicadores do Relatório</span>

            {/* Opção KPIs */}
            <label className={`${styles.checkboxCard} ${pdfOptKpis ? styles.checkboxCardActive : ''}`}>
              <input
                type="checkbox"
                checked={pdfOptKpis}
                onChange={(e) => setPdfOptKpis(e.target.checked)}
                className={styles.checkboxInput}
              />
              <div className={styles.checkboxInfo}>
                <span className={styles.checkboxTitle}>Painel de Indicadores Gerais (KPIs)</span>
                <span className={styles.checkboxDesc}>Total, concluídas, pendentes, atrasadas e taxa de conclusão geral da equipe.</span>
              </div>
            </label>

            {/* Opção Tabela Membros */}
            <label className={`${styles.checkboxCard} ${pdfOptTabelaMembros ? styles.checkboxCardActive : ''}`}>
              <input
                type="checkbox"
                checked={pdfOptTabelaMembros}
                onChange={(e) => setPdfOptTabelaMembros(e.target.checked)}
                className={styles.checkboxInput}
              />
              <div className={styles.checkboxInfo}>
                <span className={styles.checkboxTitle}>Tabela Individual por Integrante (RN10)</span>
                <span className={styles.checkboxDesc}>Membros com seus respectivos cargos, quantidades de tarefas e taxa percentual.</span>
              </div>
            </label>

            {/* Opção Tabela Tarefas */}
            <label className={`${styles.checkboxCard} ${pdfOptTabelaTarefas ? styles.checkboxCardActive : ''}`}>
              <input
                type="checkbox"
                checked={pdfOptTabelaTarefas}
                onChange={(e) => setPdfOptTabelaTarefas(e.target.checked)}
                className={styles.checkboxInput}
              />
              <div className={styles.checkboxInfo}>
                <span className={styles.checkboxTitle}>Lista Detalhada de Tarefas da Equipe</span>
                <span className={styles.checkboxDesc}>Tabela completa com título, data de criação, vencimento, status e prioridade.</span>
              </div>
            </label>
          </div>
        </Modal>
      )}
    </>
  );
}
