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
  const [filtroResponsaveisIds, setFiltroResponsaveisIds] = useState<number[]>([]);
  const [isResponsavelDropdownOpen, setIsResponsavelDropdownOpen] = useState(false);
  const [buscaResponsavel, setBuscaResponsavel] = useState('');
  const responsavelDropdownRef = React.useRef<HTMLDivElement>(null);

  // Fecha o dropdown de responsáveis ao clicar fora ou pressionar ESC
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        responsavelDropdownRef.current &&
        !responsavelDropdownRef.current.contains(event.target as Node)
      ) {
        setIsResponsavelDropdownOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsResponsavelDropdownOpen(false);
      }
    }

    if (isResponsavelDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isResponsavelDropdownOpen]);

  // Usuários para o filtro de responsável
  const [todosUsuarios, setTodosUsuarios] = useState<ConsultaUsuarioDTO[]>([]);

  // Dados do Relatório de Tarefas (Responsável ou Criadas)
  const [relatorioTarefas, setRelatorioTarefas] = useState<RelatorioTarefasDTO | null>(null);

  // Dados do Relatório de Equipe (RN10)
  const [equipes, setEquipes] = useState<ConsultaEquipeDTO[]>([]);
  const [equipeSelecionadaId, setEquipeSelecionadaId] = useState<number | ''>('');
  const [relatorioEquipe, setRelatorioEquipe] = useState<RelatorioEquipeDTO | null>(null);

  // Opções para a Exportação em PDF (Refletindo o que está presente na página)
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfOptPizza, setPdfOptPizza] = useState(true);
  const [pdfOptTorre, setPdfOptTorre] = useState(true);
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

  // Filtros aplicados no relatório ativo (atualizados somente via 'Aplicar Filtros' ou 'Limpar')
  const [filtrosAplicados, setFiltrosAplicados] = useState<{
    dataInicio: string;
    dataFim: string;
    status: string;
    prioridade: string;
    responsaveisIds: number[];
  }>({
    dataInicio: '',
    dataFim: '',
    status: '',
    prioridade: '',
    responsaveisIds: [],
  });

  // Busca dados de relatório de acordo com a visualização ativa e os filtros informados
  const carregarRelatorio = useCallback(
    async (
      filtrosParaUsar: {
        dataInicio: string;
        dataFim: string;
        status: string;
        prioridade: string;
        responsaveisIds: number[];
      },
      viewAlvo = view,
      equipeIdAlvo = equipeSelecionadaId
    ) => {
      const filtro: FiltroRelatorioQuery = {};
      if (filtrosParaUsar.dataInicio) filtro.dataInicio = new Date(filtrosParaUsar.dataInicio).toISOString();
      if (filtrosParaUsar.dataFim) filtro.dataFim = new Date(filtrosParaUsar.dataFim).toISOString();
      if (filtrosParaUsar.status) filtro.status = filtrosParaUsar.status;
      if (filtrosParaUsar.prioridade) filtro.prioridade = filtrosParaUsar.prioridade;
      if (filtrosParaUsar.responsaveisIds.length > 0) {
        filtro.responsaveisIds = filtrosParaUsar.responsaveisIds;
        if (filtrosParaUsar.responsaveisIds.length === 1) {
          filtro.responsavelId = filtrosParaUsar.responsaveisIds[0];
        }
      }

      try {
        setLoading(true);

        if (viewAlvo === 'personal') {
          const dados = await relatorioService.obterRelatorioTarefas({
            ...filtro,
            responsavelId: usuario?.id,
            responsaveisIds: usuario?.id ? [usuario.id] : undefined,
          });
          setRelatorioTarefas(dados);
        } else if (viewAlvo === 'created') {
          const dados = await relatorioService.obterRelatorioTarefas({
            ...filtro,
            criadorId: usuario?.id,
          });
          setRelatorioTarefas(dados);
        } else if (viewAlvo === 'team') {
          if (!equipeIdAlvo) {
            setRelatorioEquipe(null);
            return;
          }

          // Verifica se é admin/dono desta equipe
          const ehPermitido = equipesOndeEhAdminOuDono.some(
            (eq) => eq.id === Number(equipeIdAlvo)
          );

          if (!ehPermitido) {
            setRelatorioEquipe(null);
            return;
          }

          const dados = await relatorioService.obterRelatorioEquipe(
            Number(equipeIdAlvo),
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
    },
    [view, equipeSelecionadaId, usuario, equipesOndeEhAdminOuDono, showToast]
  );

  // Referência estável para carregarRelatorio para que os efeitos não entrem em loop
  const carregarRelatorioRef = React.useRef(carregarRelatorio);
  useEffect(() => {
    carregarRelatorioRef.current = carregarRelatorio;
  }, [carregarRelatorio]);

  // Carrega lista de equipes, lista geral de usuários e executa a carga inicial do relatório (apenas 1 vez quando o usuário logar)
  useEffect(() => {
    if (!usuario?.id) return;
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
          (m) => m.usuarioId === usuario.id && (m.cargo === 'Dono' || m.cargo === 'Admin')
        )
      );

      let equipePadraoId: number | '' = '';
      if (adminEquipes.length > 0) {
        equipePadraoId = adminEquipes[0].id;
        setEquipeSelecionadaId(equipePadraoId);
      } else if (minhasEquipes.length > 0) {
        equipePadraoId = minhasEquipes[0].id;
        setEquipeSelecionadaId(equipePadraoId);
      }

      // Executa a busca inicial sem filtros apenas uma vez na montagem
      carregarRelatorioRef.current(
        { dataInicio: '', dataFim: '', status: '', prioridade: '', responsaveisIds: [] },
        'personal',
        equipePadraoId
      );
    });

    return () => {
      isMounted = false;
    };
  }, [usuario?.id]);

  // Aplica os filtros apenas quando o usuário clicar explicitamente em "Aplicar Filtros"
  const handleAplicarFiltros = () => {
    const novosFiltros = {
      dataInicio,
      dataFim,
      status: filtroStatus,
      prioridade: filtroPrioridade,
      responsaveisIds: filtroResponsaveisIds,
    };
    setFiltrosAplicados(novosFiltros);
    carregarRelatorio(novosFiltros, view, equipeSelecionadaId);
  };

  // Limpa todos os filtros (rascunho e aplicados) e recarrega o relatório
  const handleLimparFiltros = () => {
    setDataInicio('');
    setDataFim('');
    setFiltroStatus('');
    setFiltroPrioridade('');
    setFiltroResponsaveisIds([]);
    setBuscaResponsavel('');
    const filtrosVazios = {
      dataInicio: '',
      dataFim: '',
      status: '',
      prioridade: '',
      responsaveisIds: [],
    };
    setFiltrosAplicados(filtrosVazios);
    carregarRelatorio(filtrosVazios, view, equipeSelecionadaId);
  };

  // Ao alternar entre as abas (Responsável, Criador, Equipe), reinicia filtros
  const handleTrocarView = (novaView: ReportView) => {
    setView(novaView);
    setDataInicio('');
    setDataFim('');
    setFiltroStatus('');
    setFiltroPrioridade('');
    setFiltroResponsaveisIds([]);
    setBuscaResponsavel('');
    const filtrosVazios = {
      dataInicio: '',
      dataFim: '',
      status: '',
      prioridade: '',
      responsaveisIds: [],
    };
    setFiltrosAplicados(filtrosVazios);
    carregarRelatorio(filtrosVazios, novaView, equipeSelecionadaId);
  };

  // Ao alternar a equipe selecionada no modo equipe, reinicia filtros
  const handleTrocarEquipe = (novaEquipeId: number) => {
    setEquipeSelecionadaId(novaEquipeId);
    setDataInicio('');
    setDataFim('');
    setFiltroStatus('');
    setFiltroPrioridade('');
    setFiltroResponsaveisIds([]);
    setBuscaResponsavel('');
    const filtrosVazios = {
      dataInicio: '',
      dataFim: '',
      status: '',
      prioridade: '',
      responsaveisIds: [],
    };
    setFiltrosAplicados(filtrosVazios);
    carregarRelatorio(filtrosVazios, view, novaEquipeId);
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

  // Filtra as opções de responsáveis pelo texto de busca no dropdown
  const responsaveisFiltradosParaSelecao = useMemo(() => {
    if (!buscaResponsavel.trim()) return responsaveisOpcoes;
    const buscaLower = buscaResponsavel.toLowerCase();
    return responsaveisOpcoes.filter(
      (u) =>
        u.nome?.toLowerCase().includes(buscaLower) ||
        u.email?.toLowerCase().includes(buscaLower)
    );
  }, [responsaveisOpcoes, buscaResponsavel]);

  const toggleResponsavel = (id: number) => {
    setFiltroResponsaveisIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selecionarTodosResponsaveis = () => {
    setFiltroResponsaveisIds(responsaveisOpcoes.map((u) => u.id));
  };

  const limparSelecaoResponsaveis = () => {
    setFiltroResponsaveisIds([]);
  };

  const responsavelTriggerLabel = useMemo(() => {
    if (filtroResponsaveisIds.length === 0) {
      return 'Todos os responsáveis';
    }
    if (filtroResponsaveisIds.length === 1) {
      const resp = responsaveisOpcoes.find((u) => u.id === filtroResponsaveisIds[0]);
      return resp ? resp.nome : '1 selecionado';
    }
    return `${filtroResponsaveisIds.length} responsáveis selecionados`;
  }, [filtroResponsaveisIds, responsaveisOpcoes]);

  // Membros exibidos na tabela de desempenho individual (tela) - baseia-se nos filtros aplicados
  const membrosExibidos = useMemo(() => {
    if (!relatorioEquipe?.desempenhoMembros) return [];
    if (filtrosAplicados.responsaveisIds.length === 0) return relatorioEquipe.desempenhoMembros;
    return relatorioEquipe.desempenhoMembros.filter((m) =>
      filtrosAplicados.responsaveisIds.includes(m.usuarioId)
    );
  }, [relatorioEquipe, filtrosAplicados.responsaveisIds]);

  // Métricas ativas
  const metricas = view === 'team' ? relatorioEquipe?.metricasGerais : relatorioTarefas;

  const equipeSelecionada = equipes.find((eq) => eq.id === Number(equipeSelecionadaId));
  const usuarioEhAdminOuDonoDaEquipeSelecionada = equipesOndeEhAdminOuDono.some(
    (eq) => eq.id === Number(equipeSelecionadaId)
  );

  // Membros para o gráfico de torres de desempenho (lado a lado na tela)
  const membrosGraficoTorres = useMemo(() => {
    if (view === 'team') {
      return membrosExibidos;
    }
    if (usuario && metricas) {
      return [
        {
          usuarioId: usuario.id,
          nome: usuario.nome || 'Você',
          email: usuario.email || '',
          cargo: view === 'created' ? 'Criador' : 'Responsável',
          totalAtribuidas: metricas.totalTarefas,
          concluidas: metricas.concluidas,
          pendentes: metricas.pendentes,
          atrasadas: metricas.atrasadas,
          taxaConclusaoPercentual: metricas.taxaConclusaoPercentual,
        },
      ];
    }
    return [];
  }, [view, membrosExibidos, usuario, metricas]);

  // Escala máxima para as torres de desempenho
  const maxTorresGeral = useMemo(() => {
    if (!membrosGraficoTorres || membrosGraficoTorres.length === 0) return 1;
    return Math.max(
      ...membrosGraficoTorres.map((m) => Math.max(m.concluidas, m.pendentes, m.atrasadas)),
      1
    );
  }, [membrosGraficoTorres]);

  // Segmentos para o Gráfico de Pizza só com borda externa fina (Donut Chart)
  const donutSlices = useMemo(() => {
    if (!metricas) return [];
    const total = metricas.totalTarefas;
    const r = 68;
    const circ = 2 * Math.PI * r;

    const data = [
      { id: 'concluidas', label: 'Concluídas', count: metricas.concluidas, color: '#10b981' },
      { id: 'pendentes', label: 'Pendentes', count: metricas.pendentes, color: '#f59e0b' },
      { id: 'atrasadas', label: 'Atrasadas', count: metricas.atrasadas, color: '#ef4444' },
    ];

    if (total <= 0) {
      return [];
    }

    let accumulatedOffset = 0;
    return data.map((item) => {
      const sliceLength = (item.count / total) * circ;
      const offset = accumulatedOffset;
      accumulatedOffset += sliceLength;
      const percent = (item.count / total) * 100;
      return {
        ...item,
        length: sliceLength,
        offset,
        percent,
      };
    });
  }, [metricas]);

  // Função para gerar e exportar relatório em PDF com o que está presente na página
  const handleExportarPdf = () => {
    if (!metricas) {
      showToast('Nenhum dado disponível para exportação.', 'info');
      return;
    }

    const equipeNome = relatorioEquipe?.equipeNome || 'Equipe';
    const geradoEmFormatado = new Date().toLocaleString('pt-BR');
    const solicitanteNome = usuario?.nome || 'Administrador';

    const tituloDoc =
      view === 'team'
        ? `Relatório Analítico de Desempenho — ${equipeNome}`
        : view === 'created'
        ? 'Relatório Analítico — Tarefas Criadas por Mim'
        : 'Relatório Analítico — Tarefas Onde Sou Responsável';

    const subtituloDoc =
      view === 'team'
        ? `Equipe: ${equipeNome}`
        : view === 'created'
        ? 'Visão: Tarefas Criadas por Mim'
        : 'Visão: Tarefas Onde Sou Responsável';

    // Membros para o gráfico de torres e tabela de responsáveis
    const membrosPdf =
      view === 'team'
        ? (relatorioEquipe?.desempenhoMembros || []).filter(
            (m) =>
              filtrosAplicados.responsaveisIds.length === 0 ||
              filtrosAplicados.responsaveisIds.includes(m.usuarioId)
          )
        : usuario && metricas
        ? [
            {
              usuarioId: usuario.id,
              nome: usuario.nome || 'Você',
              email: usuario.email || '',
              cargo: view === 'created' ? 'Criador' : 'Responsável',
              totalAtribuidas: metricas.totalTarefas,
              concluidas: metricas.concluidas,
              pendentes: metricas.pendentes,
              atrasadas: metricas.atrasadas,
              taxaConclusaoPercentual: metricas.taxaConclusaoPercentual,
            },
          ]
        : [];

    const tarefas = metricas.tarefas || [];

    const nomesResponsaveis =
      filtrosAplicados.responsaveisIds.length > 0
        ? responsaveisOpcoes
            .filter((u) => filtrosAplicados.responsaveisIds.includes(u.id))
            .map((u) => u.nome)
            .join(', ') || 'Filtrados'
        : 'Todos';

    // Escala máxima para o gráfico de torres
    const maxTorresPdf = Math.max(
      ...membrosPdf.map((m) => Math.max(m.concluidas || 0, m.pendentes || 0, m.atrasadas || 0)),
      1
    );

    // Segmentos SVG do gráfico de pizza para o PDF (borda externa fina)
    const circPdf = 2 * Math.PI * 68;
    let offsetPdf = 0;
    const slicesPdf = [
      { label: 'Concluídas', count: metricas.concluidas, color: '#10b981' },
      { label: 'Pendentes', count: metricas.pendentes, color: '#f59e0b' },
      { label: 'Atrasadas', count: metricas.atrasadas, color: '#ef4444' },
    ];

    const donutSvgSegmentsPdf =
      metricas.totalTarefas > 0
        ? slicesPdf
            .filter((s) => s.count > 0)
            .map((s) => {
              const len = (s.count / metricas.totalTarefas) * circPdf;
              const curOffset = offsetPdf;
              offsetPdf += len;
              return `<circle cx="95" cy="95" r="68" fill="none" stroke="${s.color}" stroke-width="8" stroke-dasharray="${len} ${circPdf - len}" stroke-dashoffset="${-curOffset}" transform="rotate(-90 95 95)" />`;
            })
            .join('')
        : '';

    // Constrói o HTML para impressão/PDF refletindo o que está presente na página
    const printContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>${tituloDoc}</title>
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
          .section-title {
            font-size: 14px;
            font-weight: 700;
            color: #111827;
            border-left: 4px solid #7c3aed;
            padding-left: 8px;
            margin: 22px 0 12px 0;
            break-after: avoid;
          }

          /* Gráficos em linhas separadas (nunca na mesma linha) */
          .chart-box {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 16px 18px 14px 18px;
            margin-bottom: 22px;
            background-color: #ffffff;
            break-inside: avoid;
            page-break-inside: avoid;
            width: 100%;
            display: block;
            box-sizing: border-box;
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

          /* Colunas Agrupadas (Comparativo de Torres) */
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
            <div class="report-subtitle">${subtituloDoc}</div>
          </div>
          <div class="meta-info">
            ${view === 'team' ? `<div>Equipe: <strong>${equipeNome}</strong></div>` : ''}
            <div>Emitido por: <strong>${solicitanteNome}</strong></div>
            <div>Data de Emissão: <strong>${geradoEmFormatado}</strong></div>
          </div>
        </div>

        <div class="filters-summary">
          <div><strong>Período:</strong> ${filtrosAplicados.dataInicio ? new Date(filtrosAplicados.dataInicio).toLocaleDateString('pt-BR') : 'Início'} até ${filtrosAplicados.dataFim ? new Date(filtrosAplicados.dataFim).toLocaleDateString('pt-BR') : 'Hoje'}</div>
          <div><strong>Status:</strong> ${filtrosAplicados.status || 'Todos'}</div>
          <div><strong>Prioridade:</strong> ${filtrosAplicados.prioridade || 'Todas'}</div>
          <div><strong>Responsáveis:</strong> ${nomesResponsaveis}</div>
          ${view === 'team' ? `<div><strong>Responsáveis Analisados:</strong> ${membrosPdf.length}</div>` : ''}
        </div>

        ${/* 1. Gráfico de Pizza com borda externa fina (em sua própria linha) */
          pdfOptPizza
            ? `
          <div class="chart-box">
            <div class="column-chart-header">
              <span class="column-chart-title">Distribuição de Tarefas por Status</span>
              <div class="chart-legend">
                <span class="legend-pill"><span class="legend-dot" style="background: #10b981;"></span> Concluídas (${metricas.concluidas})</span>
                <span class="legend-pill"><span class="legend-dot" style="background: #f59e0b;"></span> Pendentes (${metricas.pendentes})</span>
                <span class="legend-pill"><span class="legend-dot" style="background: #ef4444;"></span> Atrasadas (${metricas.atrasadas})</span>
              </div>
            </div>
            <div style="display: flex; justify-content: center; align-items: center; padding: 14px 0;">
              <svg width="190" height="190" viewBox="0 0 190 190" style="display: block; margin: 0 auto;">
                <circle cx="95" cy="95" r="68" fill="none" stroke="#e5e7eb" stroke-width="8" />
                ${donutSvgSegmentsPdf}
                <text x="95" y="90" text-anchor="middle" font-size="28" font-weight="700" fill="#111827">${metricas.totalTarefas}</text>
                <text x="95" y="106" text-anchor="middle" font-size="9" font-weight="600" fill="#6b7280" letter-spacing="0.5">TOTAL DE TAREFAS</text>
              </svg>
            </div>
            <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #f3f4f6; font-size: 11px; color: #6b7280;">
              * Taxa de Conclusão: <strong style="color: #111827;">${metricas.taxaConclusaoPercentual}%</strong> (${metricas.concluidas} de ${metricas.totalTarefas} tarefas concluídas)
            </div>
          </div>
        `
            : ''}

        ${/* 2. Gráfico de Torres de Desempenho por Responsável (em linha separada, nunca na mesma linha da pizza, e oculto se for a aba onde sou responsável) */
          view !== 'personal' && pdfOptTorre
            ? `
          <div class="chart-box">
            <div class="column-chart-header">
              <span class="column-chart-title">
                ${view === 'team' ? 'Desempenho Comparativo por Responsável' : 'Desempenho por Responsável'}
              </span>
              <div class="chart-legend">
                <span class="legend-pill"><span class="legend-dot" style="background: #10b981;"></span> Concluídas</span>
                <span class="legend-pill"><span class="legend-dot" style="background: #f59e0b;"></span> Pendentes</span>
                <span class="legend-pill"><span class="legend-dot" style="background: #ef4444;"></span> Atrasadas</span>
              </div>
            </div>
            <div class="column-plot-wrapper">
              <div class="column-y-axis">
                <span>${maxTorresPdf}</span>
                <span>${Math.round(maxTorresPdf / 2)}</span>
                <span>0</span>
              </div>
              <div class="column-plot-area">
                ${
                  membrosPdf.length === 0
                    ? '<div style="color: #9ca3af; font-size: 11px; align-self: center;">Nenhum responsável registrado.</div>'
                    : membrosPdf
                        .map((m) => {
                          const hConcluidas = maxTorresPdf > 0 ? (m.concluidas / maxTorresPdf) * 100 : 0;
                          const hPendentes = maxTorresPdf > 0 ? (m.pendentes / maxTorresPdf) * 100 : 0;
                          const hAtrasadas = maxTorresPdf > 0 ? (m.atrasadas / maxTorresPdf) * 100 : 0;
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

        ${/* 3. Tabela de Desempenho Individual por Responsável (presente no modo equipe) */
          view === 'team' && pdfOptTabelaMembros
            ? `
          <h2 class="section-title">Desempenho Individual por Responsável</h2>
          <table>
            <thead>
              <tr>
                <th>Responsável</th>
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
                membrosPdf.length === 0
                  ? '<tr><td colspan="7" style="text-align: center;">Nenhum responsável registrado.</td></tr>'
                  : membrosPdf
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
            : ''}

        ${/* 4. Lista Detalhada de Tarefas */
          pdfOptTabelaTarefas
            ? `
          <h2 class="section-title">Lista Detalhada de Tarefas</h2>
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
            : ''}

        <div class="footer">
          Cortex Platform &copy; 2026 — Documento gerado automaticamente para fins de gestão analítica e auditoria.
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
              onClick={() => handleTrocarView('personal')}
              className={`${styles.tabBtn} ${view === 'personal' ? styles.tabBtnActive : ''}`}
            >
              Tarefas Onde Sou Responsável
            </button>
            <button
              type="button"
              onClick={() => handleTrocarView('created')}
              className={`${styles.tabBtn} ${view === 'created' ? styles.tabBtnActive : ''}`}
            >
              Tarefas Criadas por Mim
            </button>
            <button
              type="button"
              onClick={() => handleTrocarView('team')}
              className={`${styles.tabBtn} ${view === 'team' ? styles.tabBtnActive : ''}`}
            >
              Desempenho por Equipe
            </button>
          </div>

          {/* Controles do modo equipe: Filtro de equipe e Botão de Exportar PDF */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {view === 'team' && usuarioEhAdminOuDonoDaEquipeSelecionada && equipesOndeEhAdminOuDono.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Filtrar por Equipe:
                </span>
                <select
                  value={equipeSelecionadaId}
                  onChange={(e) => handleTrocarEquipe(Number(e.target.value))}
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

            {(view !== 'team' || usuarioEhAdminOuDonoDaEquipeSelecionada) && (
              <button
                type="button"
                onClick={() => setIsPdfModalOpen(true)}
                className={styles.exportPdfBtn}
                title="Exportar relatório em PDF"
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
            )}
          </div>
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

          {/* Filtro de Responsável (Suporta seleção de múltiplos responsáveis) */}
          <div className={styles.filterField}>
            <label className={styles.filterLabel}>
              Responsável {filtroResponsaveisIds.length > 0 && `(${filtroResponsaveisIds.length})`}
            </label>
            {view === 'personal' ? (
              <input
                type="text"
                disabled
                value={usuario?.nome ? `${usuario.nome} (Você)` : 'Você'}
                className={`${styles.filterInput} ${styles.filterInputDisabled}`}
                title="Na aba de tarefas onde você é responsável, o filtro é fixo em você."
              />
            ) : (
              <div className={styles.multiSelectWrapper} ref={responsavelDropdownRef}>
                <div
                  className={`${styles.multiSelectTrigger} ${
                    isResponsavelDropdownOpen ? styles.multiSelectTriggerActive : ''
                  }`}
                  onClick={() => setIsResponsavelDropdownOpen((prev) => !prev)}
                  tabIndex={0}
                  role="button"
                  aria-haspopup="listbox"
                  aria-expanded={isResponsavelDropdownOpen}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setIsResponsavelDropdownOpen((prev) => !prev);
                    }
                  }}
                >
                  <div className={styles.multiSelectTriggerContent}>
                    <span
                      className={
                        filtroResponsaveisIds.length === 0
                          ? styles.multiSelectPlaceholder
                          : styles.multiSelectValueText
                      }
                      title={responsavelTriggerLabel}
                    >
                      {responsavelTriggerLabel}
                    </span>
                    {filtroResponsaveisIds.length > 1 && (
                      <span className={styles.multiSelectCountBadge}>
                        {filtroResponsaveisIds.length}
                      </span>
                    )}
                  </div>

                  <div className={styles.multiSelectIcons}>
                    {filtroResponsaveisIds.length > 0 && (
                      <button
                        type="button"
                        className={styles.multiSelectClearBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          limparSelecaoResponsaveis();
                        }}
                        title="Limpar seleção de responsáveis"
                        aria-label="Limpar responsáveis selecionados"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      style={{
                        transform: isResponsavelDropdownOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s ease',
                      }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>

                {isResponsavelDropdownOpen && (
                  <div className={styles.multiSelectDropdown} role="listbox">
                    {responsaveisOpcoes.length > 4 && (
                      <input
                        type="text"
                        placeholder="Buscar responsável..."
                        value={buscaResponsavel}
                        onChange={(e) => setBuscaResponsavel(e.target.value)}
                        className={styles.multiSelectSearchInput}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}

                    <div className={styles.multiSelectActions}>
                      <button
                        type="button"
                        className={styles.multiSelectActionLink}
                        onClick={selecionarTodosResponsaveis}
                      >
                        Selecionar todos
                      </button>
                      {filtroResponsaveisIds.length > 0 && (
                        <button
                          type="button"
                          className={styles.multiSelectActionLink}
                          onClick={limparSelecaoResponsaveis}
                        >
                          Limpar seleção
                        </button>
                      )}
                    </div>

                    <div className={styles.multiSelectOptionsList}>
                      {responsaveisFiltradosParaSelecao.length === 0 ? (
                        <div style={{ padding: '8px', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                          Nenhum responsável encontrado.
                        </div>
                      ) : (
                        responsaveisFiltradosParaSelecao.map((u) => {
                          const isSelected = filtroResponsaveisIds.includes(u.id);
                          return (
                            <label
                              key={u.id}
                              className={`${styles.multiSelectOption} ${
                                isSelected ? styles.multiSelectOptionActive : ''
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleResponsavel(u.id)}
                                className={styles.multiSelectCheckbox}
                              />
                              <div className={styles.multiSelectOptionText}>
                                <span className={styles.multiSelectOptionName}>{u.nome}</span>
                                {u.email && (
                                  <span className={styles.multiSelectOptionEmail}>{u.email}</span>
                                )}
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
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
              onClick={handleAplicarFiltros}
              className={styles.filterBtn}
            >
              Aplicar Filtros
            </button>
            {(dataInicio ||
              dataFim ||
              filtroStatus ||
              filtroPrioridade ||
              filtroResponsaveisIds.length > 0 ||
              filtrosAplicados.dataInicio ||
              filtrosAplicados.dataFim ||
              filtrosAplicados.status ||
              filtrosAplicados.prioridade ||
              filtrosAplicados.responsaveisIds.length > 0) && (
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
              Relatórios analíticos de equipe são exclusivos para Donos e Administradores.
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
            {/* Seção dos Gráficos Lado a Lado: Pizza (Donut Borda Externa Fina) + Torres de Desempenho */}
            <div className={`${styles.chartsGrid} ${view === 'personal' ? styles.chartsGridSingle : ''}`}>
              {/* Gráfico 1: Pizza só com borda externa contendo o número de tarefas e total central */}
              <div className={styles.chartCard}>
                <div className={styles.chartCardHeader}>
                  <h3 className={styles.chartCardTitle}>Distribuição de Tarefas por Status</h3>
                  <div className={styles.chartHeaderLegend}>
                    <span className={styles.legendPill}>
                      <span className={styles.legendDot} style={{ backgroundColor: '#10b981' }} />
                      Concluídas ({metricas.concluidas})
                    </span>
                    <span className={styles.legendPill}>
                      <span className={styles.legendDot} style={{ backgroundColor: '#f59e0b' }} />
                      Pendentes ({metricas.pendentes})
                    </span>
                    <span className={styles.legendPill}>
                      <span className={styles.legendDot} style={{ backgroundColor: '#ef4444' }} />
                      Atrasadas ({metricas.atrasadas})
                    </span>
                  </div>
                </div>

                <div className={styles.donutBodyCentered}>
                  <div className={styles.donutChartWrapper}>
                    <svg
                      width="190"
                      height="190"
                      viewBox="0 0 190 190"
                      className={styles.donutSvg}
                      aria-label="Gráfico de pizza com borda externa fina do número de tarefas por status"
                    >
                      {/* Borda externa fina de trilho base (fundo sutil) */}
                      <circle
                        cx="95"
                        cy="95"
                        r="68"
                        fill="none"
                        stroke="var(--border-input)"
                        strokeWidth="8"
                        opacity="0.35"
                      />
                      {/* Segmentos coloridos da borda externa fina */}
                      {donutSlices.map((slice) => {
                        if (slice.count === 0) return null;
                        return (
                          <circle
                            key={slice.id}
                            cx="95"
                            cy="95"
                            r="68"
                            fill="none"
                            stroke={slice.color}
                            strokeWidth="8"
                            strokeDasharray={`${slice.length} ${2 * Math.PI * 68 - slice.length}`}
                            strokeDashoffset={-slice.offset}
                            transform="rotate(-90 95 95)"
                            className={styles.donutSlice}
                          >
                            <title>{`${slice.label}: ${slice.count} tarefas (${slice.percent.toFixed(1)}%)`}</title>
                          </circle>
                        );
                      })}
                    </svg>

                    {/* Texto interno com o Total de Tarefas */}
                    <div className={styles.donutCenter}>
                      <span className={styles.donutCenterNumber}>{metricas.totalTarefas}</span>
                      <span className={styles.donutCenterLabel}>Total de Tarefas</span>
                    </div>
                  </div>
                </div>

                {/* Nota de rodapé: Taxa de Conclusão */}
                <div className={styles.chartFooter}>
                  <span className={styles.footerNoteText}>
                    * Taxa de Conclusão: <strong>{metricas.taxaConclusaoPercentual}%</strong> ({metricas.concluidas} de {metricas.totalTarefas} tarefas concluídas)
                  </span>
                </div>
              </div>

              {/* Gráfico 2: Gráfico de Torre de Desempenho (exibido apenas nas outras abas, exceto "Tarefas Onde Sou Responsável") */}
              {view !== 'personal' && (
                <div className={styles.chartCard}>
                  <div className={styles.chartCardHeader}>
                    <h3 className={styles.chartCardTitle}>
                      {view === 'team'
                        ? 'Desempenho Comparativo por Responsável'
                        : 'Desempenho por Responsável'}
                    </h3>
                    <div className={styles.chartHeaderLegend}>
                      <span className={styles.legendPill}>
                        <span className={styles.legendDot} style={{ backgroundColor: '#10b981' }} />
                        Concluídas
                      </span>
                      <span className={styles.legendPill}>
                        <span className={styles.legendDot} style={{ backgroundColor: '#f59e0b' }} />
                        Pendentes
                      </span>
                      <span className={styles.legendPill}>
                        <span className={styles.legendDot} style={{ backgroundColor: '#ef4444' }} />
                        Atrasadas
                      </span>
                    </div>
                  </div>

                  <div className={styles.towerPlotWrapper}>
                    <div className={styles.towerYAxis}>
                      <span>{maxTorresGeral}</span>
                      <span>{Math.round(maxTorresGeral / 2)}</span>
                      <span>0</span>
                    </div>
                    <div className={styles.towerPlotArea}>
                      {membrosGraficoTorres.length === 0 ? (
                        <div className={styles.towerEmpty}>
                          {view === 'team'
                            ? 'Nenhum responsável registrado para o filtro aplicado.'
                            : 'Nenhum dado registrado para exibição no gráfico.'}
                        </div>
                      ) : (
                        membrosGraficoTorres.map((m) => {
                          const hConcluidas = maxTorresGeral > 0 ? (m.concluidas / maxTorresGeral) * 100 : 0;
                          const hPendentes = maxTorresGeral > 0 ? (m.pendentes / maxTorresGeral) * 100 : 0;
                          const hAtrasadas = maxTorresGeral > 0 ? (m.atrasadas / maxTorresGeral) * 100 : 0;
                          return (
                            <div key={m.usuarioId} className={styles.towerBarItem} style={{ maxWidth: '85px' }}>
                              <div className={styles.groupedBarsWrapper}>
                                <div className={styles.singlePillarGroup}>
                                  <span className={styles.pillarNum} style={{ color: '#10b981' }}>{m.concluidas}</span>
                                  <div
                                    className={styles.singlePillar}
                                    style={{ height: `${hConcluidas}%`, backgroundColor: '#10b981' }}
                                    title={`${m.nome} - Concluídas: ${m.concluidas}`}
                                  />
                                </div>
                                <div className={styles.singlePillarGroup}>
                                  <span className={styles.pillarNum} style={{ color: '#f59e0b' }}>{m.pendentes}</span>
                                  <div
                                    className={styles.singlePillar}
                                    style={{ height: `${hPendentes}%`, backgroundColor: '#f59e0b' }}
                                    title={`${m.nome} - Pendentes: ${m.pendentes}`}
                                  />
                                </div>
                                <div className={styles.singlePillarGroup}>
                                  <span className={styles.pillarNum} style={{ color: '#ef4444' }}>{m.atrasadas}</span>
                                  <div
                                    className={styles.singlePillar}
                                    style={{ height: `${hAtrasadas}%`, backgroundColor: '#ef4444' }}
                                    title={`${m.nome} - Atrasadas: ${m.atrasadas}`}
                                  />
                                </div>
                              </div>
                              <div className={styles.towerMemberLabel} title={m.nome}>{m.nome}</div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* TABELA DE MEMBROS (Modo Equipe - RN10) */}
            {view === 'team' && relatorioEquipe?.desempenhoMembros && (
              <div className={styles.tableContainer}>
                <div className={styles.tableHeaderSection}>
                  <h3 className={styles.tableTitle}>
                    Desempenho Individual por Membro — {relatorioEquipe.equipeNome}
                  </h3>
                  <span style={{ fontSize: '13px', color: 'var(--cortex-gray-text)' }}>
                    Total de Responsáveis: {membrosExibidos.length}
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
                      {membrosExibidos.length === 0 ? (
                        <tr>
                          <td colSpan={7} className={styles.td} style={{ textAlign: 'center' }}>
                            Nenhum membro com tarefas atribuídas nesta equipe para os filtros selecionados.
                          </td>
                        </tr>
                      ) : (
                        membrosExibidos.map((m) => (
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

      {/* Modal de Configuração e Exportação de Relatório em PDF com o que está presente na página */}
      {metricas && (
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
            Selecione quais seções e gráficos presentes na página deseja incluir no documento PDF:
          </p>

          <div className={styles.optionsGroup}>
            <span className={styles.optionsGroupTitle}>Gráficos do Relatório</span>

            {/* Opção Gráfico de Pizza */}
            <label className={`${styles.checkboxCard} ${pdfOptPizza ? styles.checkboxCardActive : ''}`}>
              <input
                type="checkbox"
                checked={pdfOptPizza}
                onChange={(e) => setPdfOptPizza(e.target.checked)}
                className={styles.checkboxInput}
              />
              <div className={styles.checkboxInfo}>
                <span className={styles.checkboxTitle}>Gráfico de Pizza: Distribuição de Tarefas por Status</span>
                <span className={styles.checkboxDesc}>Borda externa fina com o total de tarefas no centro e nota de rodapé com taxa de conclusão.</span>
              </div>
            </label>

            {/* Opção Gráfico de Torres (exibido apenas quando presente na página: view !== 'personal') */}
            {view !== 'personal' && (
              <label className={`${styles.checkboxCard} ${pdfOptTorre ? styles.checkboxCardActive : ''}`}>
                <input
                  type="checkbox"
                  checked={pdfOptTorre}
                  onChange={(e) => setPdfOptTorre(e.target.checked)}
                  className={styles.checkboxInput}
                />
                <div className={styles.checkboxInfo}>
                  <span className={styles.checkboxTitle}>Gráfico de Torres: Desempenho por Responsável</span>
                  <span className={styles.checkboxDesc}>Colunas verticais comparativas (concluídas, pendentes e atrasadas).</span>
                </div>
              </label>
            )}
          </div>

          <div className={styles.optionsGroup}>
            <span className={styles.optionsGroupTitle}>Tabelas Analíticas</span>

            {/* Opção Tabela Membros (somente se view === 'team') */}
            {view === 'team' && (
              <label className={`${styles.checkboxCard} ${pdfOptTabelaMembros ? styles.checkboxCardActive : ''}`}>
                <input
                  type="checkbox"
                  checked={pdfOptTabelaMembros}
                  onChange={(e) => setPdfOptTabelaMembros(e.target.checked)}
                  className={styles.checkboxInput}
                />
                <div className={styles.checkboxInfo}>
                  <span className={styles.checkboxTitle}>Tabela Individual por Responsável</span>
                  <span className={styles.checkboxDesc}>Lista detalhada de membros com seus respectivos cargos, quantidades de tarefas e taxa percentual.</span>
                </div>
              </label>
            )}

            {/* Opção Tabela Tarefas */}
            <label className={`${styles.checkboxCard} ${pdfOptTabelaTarefas ? styles.checkboxCardActive : ''}`}>
              <input
                type="checkbox"
                checked={pdfOptTabelaTarefas}
                onChange={(e) => setPdfOptTabelaTarefas(e.target.checked)}
                className={styles.checkboxInput}
              />
              <div className={styles.checkboxInfo}>
                <span className={styles.checkboxTitle}>Lista Detalhada de Tarefas</span>
                <span className={styles.checkboxDesc}>Tabela completa com título, data de criação, vencimento, status e prioridade.</span>
              </div>
            </label>
          </div>
        </Modal>
      )}
    </>
  );
}
