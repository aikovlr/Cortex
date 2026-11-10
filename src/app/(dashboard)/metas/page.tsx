'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Header from '@/app/Components/Header/header';
import { metaService } from '@/services/metaService';
import { equipeService } from '@/services/equipeService';
import { ConsultaMetaDTO, ConsultaTarefaDTO } from '@/types/api';
import { Badge } from '@/components/common/Badge/Badge';
import { SearchBar } from '@/components/common/SearchBar/SearchBar';
import {
  CalendarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowUpDownIcon,
  UsersIcon,
  UserIcon,
  PlusIcon,
} from '@/components/common/Icons/Icons';
import { GoalCreateModal } from '@/components/goals/GoalCreateModal/GoalCreateModal';
import { GoalEditModal } from '@/components/goals/GoalEditModal/GoalEditModal';
import { AssignTeamGoalModal } from '@/components/teams/AssignTeamGoalModal/AssignTeamGoalModal';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import styles from './page.module.css';

export type CriterioOrdenacao = 'status' | 'prazo' | 'nome' | 'progresso' | 'recentes' | 'manual';
export type DirecaoOrdenacao = 'asc' | 'desc';

export default function MetasPage() {
  const { usuario } = useAuth();
  const { showToast } = useToast();

  const [metas, setMetas] = useState<ConsultaMetaDTO[]>([]);
  const [activeTab, setActiveTab] = useState<'pessoais' | 'equipes'>('pessoais');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [criterioOrdenacao, setCriterioOrdenacao] = useState<CriterioOrdenacao>('status');
  const [direcaoOrdenacao, setDirecaoOrdenacao] = useState<DirecaoOrdenacao>('asc');
  const [customOrderIds, setCustomOrderIds] = useState<number[]>([]);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const [collapsedGoalIds, setCollapsedGoalIds] = useState<number[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignTeamGoalOpen, setIsAssignTeamGoalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMeta, setEditingMeta] = useState<ConsultaMetaDTO | null>(null);

  const toggleGoalCollapse = (id: number) => {
    setCollapsedGoalIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Carrega preferências de ordenação salvas no localStorage e query param de aba
  useEffect(() => {
    const sincronizarAba = () => {
      try {
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const tabParam = (params.get('aba') || params.get('tab') || '').toLowerCase().trim();
          if (tabParam === 'equipes') {
            setActiveTab('equipes');
          } else if (tabParam === 'pessoais') {
            setActiveTab('pessoais');
          }
        }
      } catch {}
    };

    sincronizarAba();
    window.addEventListener('popstate', sincronizarAba);

    try {
      const savedCriterio = localStorage.getItem('cortex_metas_criterio') as CriterioOrdenacao | null;
      if (
        savedCriterio &&
        ['status', 'prazo', 'nome', 'progresso', 'recentes', 'manual'].includes(savedCriterio)
      ) {
        setCriterioOrdenacao(savedCriterio);
      }

      const savedDirecao = localStorage.getItem('cortex_metas_direcao') as DirecaoOrdenacao | null;
      if (savedDirecao && ['asc', 'desc'].includes(savedDirecao)) {
        setDirecaoOrdenacao(savedDirecao);
      }

      const savedOrder = localStorage.getItem('cortex_metas_ordem_ids');
      if (savedOrder) {
        const parsed = JSON.parse(savedOrder);
        if (Array.isArray(parsed)) {
          setCustomOrderIds(parsed);
        }
      }
    } catch {
      // Ignora falhas de leitura do localStorage
    }
  }, []);

  const carregarMetas = useCallback(async () => {
    try {
      setLoading(true);
      const [metasPessoais, equipes] = await Promise.all([
        metaService.listar().catch(() => []),
        equipeService.listarMinhasEquipes().catch(() => []),
      ]);

      const metasEquipesList = await Promise.all(
        equipes.map((eq) => metaService.listarPorEquipe(eq.id).catch(() => []))
      );

      const mapMetas = new Map<number, ConsultaMetaDTO>();
      for (const m of metasPessoais) {
        mapMetas.set(m.id, m);
      }
      for (const lista of metasEquipesList) {
        for (const m of lista) {
          if (!mapMetas.has(m.id)) {
            mapMetas.set(m.id, m);
          } else {
            const existente = mapMetas.get(m.id)!;
            if ((!existente.equipes || existente.equipes.length === 0) && m.equipes) {
              existente.equipes = m.equipes;
            }
          }
        }
      }

      setMetas(Array.from(mapMetas.values()));
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
        const [metasPessoais, equipes] = await Promise.all([
          metaService.listar().catch(() => []),
          equipeService.listarMinhasEquipes().catch(() => []),
        ]);

        const metasEquipesList = await Promise.all(
          equipes.map((eq) => metaService.listarPorEquipe(eq.id).catch(() => []))
        );

        if (isMounted) {
          const mapMetas = new Map<number, ConsultaMetaDTO>();
          for (const m of metasPessoais) {
            mapMetas.set(m.id, m);
          }
          for (const lista of metasEquipesList) {
            for (const m of lista) {
              if (!mapMetas.has(m.id)) {
                mapMetas.set(m.id, m);
              } else {
                const existente = mapMetas.get(m.id)!;
                if ((!existente.equipes || existente.equipes.length === 0) && m.equipes) {
                  existente.equipes = m.equipes;
                }
              }
            }
          }
          setMetas(Array.from(mapMetas.values()));
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

  // Sincroniza a ordem manual com os IDs das metas atuais
  useEffect(() => {
    if (metas.length === 0) return;
    setCustomOrderIds((prev) => {
      const metaIds = metas.map((m) => m.id);
      const mantidos = prev.filter((id) => metaIds.includes(id));
      const novos = metaIds.filter((id) => !mantidos.includes(id));
      const unificados = [...mantidos, ...novos];
      return unificados;
    });
  }, [metas]);

  // Alteração de critério de ordenação
  const handleCriterioChange = (novoCriterio: CriterioOrdenacao) => {
    setCriterioOrdenacao(novoCriterio);
    try {
      localStorage.setItem('cortex_metas_criterio', novoCriterio);
    } catch {
      // Ignora
    }
  };

  // Alterna direção asc/desc
  const alternarDirecao = () => {
    setDirecaoOrdenacao((prev) => {
      const proxima: DirecaoOrdenacao = prev === 'asc' ? 'desc' : 'asc';
      try {
        localStorage.setItem('cortex_metas_direcao', proxima);
      } catch {
        // Ignora
      }
      return proxima;
    });
  };

  // Exclusão de meta (Apenas o criador da meta pode excluir)
  const handleDeleteMeta = async (id: number) => {
    const meta = metas.find((m) => m.id === id);
    if (meta && usuario?.id && meta.usuarioId !== usuario.id && meta.usuario?.id !== usuario.id) {
      showToast('Apenas o criador da meta possui permissão para excluí-la.', 'error');
      return;
    }

    if (!confirm('Deseja realmente excluir esta meta?')) return;

    try {
      await metaService.deletar(id);
      showToast('Meta removida com sucesso.', 'success');
      setMetas((prev) => prev.filter((m) => m.id !== id));
      setCustomOrderIds((prev) => {
        const atualizados = prev.filter((mId) => mId !== id);
        try {
          localStorage.setItem('cortex_metas_ordem_ids', JSON.stringify(atualizados));
        } catch {
          // Ignora
        }
        return atualizados;
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message, 'error');
      } else {
        showToast('Falha ao excluir meta.', 'error');
      }
    }
  };

  // Edição de meta (Apenas o criador da meta pode editar)
  const handleEditMeta = (meta: ConsultaMetaDTO) => {
    if (usuario?.id && meta.usuarioId !== usuario.id && meta.usuario?.id !== usuario.id) {
      showToast('Apenas o criador da meta possui permissão para editá-la.', 'error');
      return;
    }
    setEditingMeta(meta);
    setIsEditModalOpen(true);
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

  // Determina o status da meta: Concluida, Atrasada ou Pendente (apenas data de fechamento da meta define atraso)
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

      return 'Pendente';
    },
    [isMetaConcluida]
  );

  const metasPessoais = useMemo(
    () => metas.filter((m) => !m.equipes || m.equipes.length === 0),
    [metas]
  );

  const metasEquipes = useMemo(
    () => metas.filter((m) => m.equipes && m.equipes.length > 0),
    [metas]
  );

  // Filtragem por busca e ordenação
  const metasFiltradas = useMemo(() => {
    const baseTab = activeTab === 'pessoais' ? metasPessoais : metasEquipes;
    let filtradas = baseTab;
    if (searchTerm.trim()) {
      const termo = searchTerm.toLowerCase();
      filtradas = baseTab.filter((m) => {
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
      let diff = 0;

      switch (criterioOrdenacao) {
        case 'status': {
          const statusA = getMetaStatus(a);
          const statusB = getMetaStatus(b);
          const pesoA = PRIORIDADE_STATUS[statusA] ?? 99;
          const pesoB = PRIORIDADE_STATUS[statusB] ?? 99;
          diff = pesoA - pesoB;
          break;
        }

        case 'prazo': {
          const timeA = a.dataFechamento ? new Date(a.dataFechamento).getTime() : Infinity;
          const timeB = b.dataFechamento ? new Date(b.dataFechamento).getTime() : Infinity;
          diff = timeA - timeB;
          break;
        }

        case 'nome': {
          diff = a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' });
          break;
        }

        case 'progresso': {
          const progA = getProgressoMeta(a);
          const progB = getProgressoMeta(b);
          diff = progA - progB;
          break;
        }

        case 'recentes': {
          diff = a.id - b.id;
          break;
        }

        case 'manual': {
          const idxA = customOrderIds.indexOf(a.id);
          const idxB = customOrderIds.indexOf(b.id);
          const posA = idxA !== -1 ? idxA : 99999;
          const posB = idxB !== -1 ? idxB : 99999;
          diff = posA - posB;
          break;
        }

        default:
          diff = 0;
      }

      if (diff !== 0) {
        return direcaoOrdenacao === 'asc' ? diff : -diff;
      }

      return a.id - b.id;
    });
  }, [
    activeTab,
    metasPessoais,
    metasEquipes,
    searchTerm,
    criterioOrdenacao,
    direcaoOrdenacao,
    customOrderIds,
    getTarefasDaMeta,
    getMetaStatus,
    getProgressoMeta,
  ]);

  // Move uma meta para cima ou para baixo
  const moverMeta = (id: number, direcao: 'up' | 'down') => {
    const indexAtual = metasFiltradas.findIndex((m) => m.id === id);
    if (indexAtual === -1) return;

    const targetIndex = direcao === 'up' ? indexAtual - 1 : indexAtual + 1;
    if (targetIndex < 0 || targetIndex >= metasFiltradas.length) return;

    const targetId = metasFiltradas[targetIndex].id;

    // Base para reordenação
    const baseIds = customOrderIds.length > 0 ? [...customOrderIds] : metas.map((m) => m.id);
    const idxA = baseIds.indexOf(id);
    const idxB = baseIds.indexOf(targetId);

    let novaOrdem = [...baseIds];
    if (idxA !== -1 && idxB !== -1) {
      novaOrdem[idxA] = targetId;
      novaOrdem[idxB] = id;
    } else {
      const idsAtuais = metasFiltradas.map((m) => m.id);
      idsAtuais[indexAtual] = targetId;
      idsAtuais[targetIndex] = id;
      novaOrdem = idsAtuais;
    }

    setCustomOrderIds(novaOrdem);
    try {
      localStorage.setItem('cortex_metas_ordem_ids', JSON.stringify(novaOrdem));
    } catch {
      // Ignora
    }

    if (criterioOrdenacao !== 'manual') {
      setCriterioOrdenacao('manual');
      setDirecaoOrdenacao('asc');
      try {
        localStorage.setItem('cortex_metas_criterio', 'manual');
        localStorage.setItem('cortex_metas_direcao', 'asc');
      } catch {
        // Ignora
      }
      showToast('Ordem alterada para Personalizada.', 'info');
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, id: number) => {
    e.dataTransfer.setData('text/plain', String(id));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverId !== id) {
      setDragOverId(id);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    const sourceId = Number(e.dataTransfer.getData('text/plain')) || draggedId;
    setDraggedId(null);
    setDragOverId(null);

    if (!sourceId || sourceId === targetId) return;

    const baseIds = customOrderIds.length > 0 ? [...customOrderIds] : metas.map((m) => m.id);
    const novaOrdem = [...baseIds];

    const sourceIdx = novaOrdem.indexOf(sourceId);
    const targetIdx = novaOrdem.indexOf(targetId);

    if (sourceIdx !== -1 && targetIdx !== -1) {
      novaOrdem.splice(sourceIdx, 1);
      novaOrdem.splice(targetIdx, 0, sourceId);
    }

    setCustomOrderIds(novaOrdem);
    try {
      localStorage.setItem('cortex_metas_ordem_ids', JSON.stringify(novaOrdem));
    } catch {
      // Ignora
    }

    if (criterioOrdenacao !== 'manual') {
      setCriterioOrdenacao('manual');
      setDirecaoOrdenacao('asc');
      try {
        localStorage.setItem('cortex_metas_criterio', 'manual');
        localStorage.setItem('cortex_metas_direcao', 'asc');
      } catch {
        // Ignora
      }
      showToast('Ordem alterada para Personalizada.', 'info');
    }
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  // Rótulo amigável para o botão de direção
  const labelDirecao = useMemo(() => {
    if (criterioOrdenacao === 'nome') {
      return direcaoOrdenacao === 'asc' ? 'A → Z' : 'Z → A';
    }
    if (criterioOrdenacao === 'progresso') {
      return direcaoOrdenacao === 'asc' ? 'Menor %' : 'Maior %';
    }
    if (criterioOrdenacao === 'prazo') {
      return direcaoOrdenacao === 'asc' ? 'Mais próximas' : 'Mais distantes';
    }
    if (criterioOrdenacao === 'recentes') {
      return direcaoOrdenacao === 'asc' ? 'Mais antigas' : 'Mais recentes';
    }
    return direcaoOrdenacao === 'asc' ? 'Crescente' : 'Decrescente';
  }, [criterioOrdenacao, direcaoOrdenacao]);

  const handleTabChange = (tab: 'pessoais' | 'equipes') => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('aba', tab);
      url.searchParams.delete('tab');
      window.history.pushState({}, '', url.toString());
    }
  };

  return (
    <>
      <Header titulo="Metas" />
      <main id="conteudo-principal" className={styles.container}>
        {/* Abas: Minhas Metas vs Metas de Equipe */}
        <div className={styles.tabsHeader}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'pessoais' ? styles.tabBtnActive : ''}`}
            onClick={() => handleTabChange('pessoais')}
          >
            <UserIcon size={16} />
            <span>Minhas Metas</span>
            <span className={styles.tabBadge}>{metasPessoais.length}</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'equipes' ? styles.tabBtnActive : ''}`}
            onClick={() => handleTabChange('equipes')}
          >
            <UsersIcon size={16} />
            <span>Metas de Equipe</span>
            <span className={styles.tabBadge}>{metasEquipes.length}</span>
          </button>
        </div>

        {/* Barra de Ações Superior Padronizada com Filtro e Ordenação */}
        <div className={styles.topBar}>
          <div className={styles.filtersWrapper}>
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Buscar por meta ou tarefa vinculada..."
              maxWidth={360}
              className={styles.searchBarFlex}
            />

            <div className={styles.sortContainer}>
              <label htmlFor="meta-sort-select" className={styles.sortLabel}>
                Ordenar:
              </label>
              <div className={styles.selectWrapper}>
                <select
                  id="meta-sort-select"
                  value={criterioOrdenacao}
                  onChange={(e) => handleCriterioChange(e.target.value as CriterioOrdenacao)}
                  className={styles.sortSelect}
                >
                  <option value="status">Status</option>
                  <option value="prazo">Prazo</option>
                  <option value="nome">Nome</option>
                  <option value="progresso">Progresso</option>
                  <option value="recentes">Data de criação</option>
                  <option value="manual">Personalizada (Manual)</option>
                </select>
                <span className={styles.selectChevron}>
                  <ChevronDownIcon size={14} />
                </span>
              </div>

              <button
                type="button"
                onClick={alternarDirecao}
                className={styles.directionBtn}
                title={direcaoOrdenacao === 'asc' ? 'Ordem crescente' : 'Ordem decrescente'}
                aria-label={
                  direcaoOrdenacao === 'asc'
                    ? 'Mudar para ordem decrescente'
                    : 'Mudar para ordem crescente'
                }
              >
                <ArrowUpDownIcon size={14} />
                <span className={styles.directionText}>{labelDirecao}</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (activeTab === 'pessoais') {
                setIsModalOpen(true);
              } else {
                setIsAssignTeamGoalOpen(true);
              }
            }}
            className={styles.createBtn}
          >
            <PlusIcon size={18} />
            {activeTab === 'pessoais' ? 'Criar Meta' : 'Criar Meta de Equipe'}
          </button>
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
            <h3 className={styles.emptyTitle}>
              {searchTerm
                ? activeTab === 'pessoais'
                  ? 'Nenhuma meta pessoal encontrada'
                  : 'Nenhuma meta de equipe encontrada'
                : activeTab === 'pessoais'
                ? 'Nenhuma meta pessoal cadastrada'
                : 'Nenhuma meta de equipe cadastrada'}
            </h3>
            <p className={styles.emptyText}>
              {searchTerm
                ? 'Tente buscar com outros termos.'
                : activeTab === 'pessoais'
                ? 'Crie metas e vincule uma ou mais tarefas para acompanhar seu progresso e atingir objetivos estratégicos.'
                : 'Crie metas colaborativas atribuídas às suas equipes para gerenciar objetivos coletivos.'}
            </p>
            <button
              type="button"
              onClick={() => {
                if (activeTab === 'pessoais') {
                  setIsModalOpen(true);
                } else {
                  setIsAssignTeamGoalOpen(true);
                }
              }}
              className={styles.createBtn}
              style={{ marginTop: '12px' }}
            >
              <PlusIcon size={16} />
              {activeTab === 'pessoais' ? 'Criar Minha Primeira Meta' : 'Criar Primeira Meta de Equipe'}
            </button>
          </div>
        ) : (
          <div className={styles.groupsContainer}>
            {metasFiltradas.map((meta, index) => {
              const tarefas = getTarefasDaMeta(meta);
              const progresso = getProgressoMeta(meta);
              const status = getMetaStatus(meta);
              const concluida = status === 'Concluida';
              const isDraggingThis = draggedId === meta.id;
              const isDragOverThis = dragOverId === meta.id;
              const isCollapsed = collapsedGoalIds.includes(meta.id);
              const ehCriadorDaMeta = Boolean(
                usuario?.id && (meta.usuarioId === usuario.id || meta.usuario?.id === usuario.id)
              );

              return (
                <div
                  key={meta.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, meta.id)}
                  onDragOver={(e) => handleDragOver(e, meta.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, meta.id)}
                  onDragEnd={handleDragEnd}
                  className={`${styles.taskGroupCard} ${isDraggingThis ? styles.cardDragging : ''} ${
                    isDragOverThis ? styles.cardDragOver : ''
                  }`}
                >
                  <div
                    className={`${styles.groupHeader} ${isCollapsed ? styles.groupHeaderCollapsed : ''}`}
                    onClick={() => toggleGoalCollapse(meta.id)}
                    role="button"
                    tabIndex={0}
                    aria-expanded={!isCollapsed}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleGoalCollapse(meta.id);
                      }
                    }}
                  >
                    <div className={styles.groupTitleWrapper}>
                      <span
                        className={styles.dragHandle}
                        title="Arraste para reordenar"
                        aria-label="Arraste para reordenar"
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="8" cy="6" r="2" />
                          <circle cx="16" cy="6" r="2" />
                          <circle cx="8" cy="12" r="2" />
                          <circle cx="16" cy="12" r="2" />
                          <circle cx="8" cy="18" r="2" />
                          <circle cx="16" cy="18" r="2" />
                        </svg>
                      </span>

                      <span className={`${styles.taskName} ${concluida ? styles.goalNameCompleted : ''}`}>
                        {meta.nome}
                      </span>
                      <Badge
                        type="status"
                        value={status}
                      />
                      {meta.equipes && meta.equipes.length > 0 && (
                        <span
                          className={styles.teamBadge}
                          title={`Equipe: ${meta.equipes.map((e) => e.nome).join(', ')}`}
                        >
                          <UsersIcon size={12} />
                          {meta.equipes.map((e) => e.nome).join(', ')}
                        </span>
                      )}
                      {meta.dataFechamento && (
                        <span className={styles.dateLimit} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }} suppressHydrationWarning>
                          <CalendarIcon size={13} /> Prazo: {new Date(meta.dataFechamento).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>

                    <div className={styles.groupRightActionsWrapper}>
                      <div className={styles.groupProgressWrapper}>
                        <div className={styles.progressBarTrack}>
                          <div
                            className={styles.progressBarFill}
                            style={{ width: `${progresso}%` }}
                          />
                        </div>
                        <span className={styles.progressPercentage}>{progresso}%</span>
                      </div>

                      <div className={styles.cardActions}>
                        {/* Botões para definir / mover ordem */}
                        <div className={styles.reorderActions}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              moverMeta(meta.id, 'up');
                            }}
                            disabled={index === 0}
                            className={styles.reorderBtn}
                            title="Mover meta para cima"
                            aria-label={`Mover meta ${meta.nome} para cima`}
                          >
                            <ChevronUpIcon size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              moverMeta(meta.id, 'down');
                            }}
                            disabled={index === metasFiltradas.length - 1}
                            className={styles.reorderBtn}
                            title="Mover meta para baixo"
                            aria-label={`Mover meta ${meta.nome} para baixo`}
                          >
                            <ChevronDownIcon size={14} />
                          </button>
                        </div>

                        {ehCriadorDaMeta && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditMeta(meta);
                              }}
                              className={styles.editBtn}
                              title="Editar meta"
                              aria-label="Editar meta"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteMeta(meta.id);
                              }}
                              className={styles.deleteBtn}
                              title="Excluir meta"
                              aria-label="Excluir meta"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleGoalCollapse(meta.id);
                          }}
                          className={styles.collapseToggleBtn}
                          title={isCollapsed ? 'Expandir tarefas da meta' : 'Recolher tarefas da meta'}
                          aria-label={isCollapsed ? `Expandir meta ${meta.nome}` : `Recolher meta ${meta.nome}`}
                          aria-expanded={!isCollapsed}
                        >
                          <ChevronDownIcon
                            size={14}
                            className={`${styles.collapseIcon} ${!isCollapsed ? styles.collapseIconRotated : ''}`}
                          />
                          <span>{isCollapsed ? 'Expandir' : 'Recolher'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {!isCollapsed && (
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
                  )}
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

      {/* Modal de Atribuição de Meta à Equipe */}
      <AssignTeamGoalModal
        isOpen={isAssignTeamGoalOpen}
        onClose={() => setIsAssignTeamGoalOpen(false)}
        onSuccess={carregarMetas}
      />

      {/* Modal de Edição de Meta */}
      <GoalEditModal
        isOpen={isEditModalOpen}
        meta={editingMeta}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingMeta(null);
        }}
        onSuccess={carregarMetas}
      />
    </>
  );
}