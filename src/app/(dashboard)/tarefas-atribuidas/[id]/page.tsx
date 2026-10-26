'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Header from '@/app/Components/Header/header';
import { Badge } from '@/components/common/Badge/Badge';
import {
  DetalhesTarefaDTO,
  ConsultaUsuarioDTO,
  ConsultaEquipeDTO,
  ConsultaSugestaoDTO,
  ConsultaTicketReporteDTO,
  Prioridade,
} from '@/types/api';
import { tarefaService } from '@/services/tarefaService';
import { usuarioService } from '@/services/usuarioService';
import { equipeService } from '@/services/equipeService';
import { sugestaoService } from '@/services/sugestaoService';
import { ticketService } from '@/services/ticketService';
import { useToast } from '@/contexts/ToastContext';
import {
  PaperclipIcon,
  FileTextIcon,
  UserIcon,
  TrashIcon,
  CheckIcon,
  XIcon,
} from '@/components/common/Icons/Icons';
import styles from './page.module.css';

export default function TarefaAtribuidaDetalhesPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();

  const idParam = params?.id;
  const tarefaId = idParam ? Number(idParam) : null;

  const [tarefa, setTarefa] = useState<DetalhesTarefaDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [completing, setCompleting] = useState(false);

  // Campos alteráveis
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [prioridade, setPrioridade] = useState<Prioridade>('Media');
  const [pontuacao, setPontuacao] = useState<number | ''>('');
  const [novosAnexos, setNovosAnexos] = useState<File[]>([]);

  // Gestão de Responsáveis
  const [todosUsuarios, setTodosUsuarios] = useState<ConsultaUsuarioDTO[]>([]);
  const [minhasEquipes, setMinhasEquipes] = useState<ConsultaEquipeDTO[]>([]);
  const [usuarioSelecionadoId, setUsuarioSelecionadoId] = useState<number | ''>('');
  const [equipeSelecionadaId, setEquipeSelecionadaId] = useState<number | ''>('');
  const [adicionandoResp, setAdicionandoResp] = useState(false);
  const [removendoRespId, setRemovendoRespId] = useState<number | null>(null);

  // Abas de Navegação (Estilo Relatórios)
  const [activeTab, setActiveTab] = useState<'detalhes' | 'sugestoes' | 'tickets'>('detalhes');
  const [sugestoes, setSugestoes] = useState<ConsultaSugestaoDTO[]>([]);
  const [tickets, setTickets] = useState<ConsultaTicketReporteDTO[]>([]);
  const [processandoSugestaoId, setProcessandoSugestaoId] = useState<number | null>(null);
  const [processandoTicketId, setProcessandoTicketId] = useState<number | null>(null);


  // Carrega os dados da tarefa
  const carregarTarefa = useCallback(async () => {
    if (!tarefaId || isNaN(tarefaId)) return;
    try {
      const dados = await tarefaService.obterPorId(tarefaId);
      setTarefa(dados);
      setTitulo(dados.titulo);
      setDescricao(dados.descricao || '');
      if (dados.dataVencimento) {
        const dt = new Date(dados.dataVencimento);
        const formatted = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
        setDataVencimento(formatted);
      }
      setPrioridade(dados.prioridade);
      setPontuacao(dados.pontuacao !== null && dados.pontuacao !== undefined ? dados.pontuacao : '');
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message, 'error');
      } else {
        showToast('Erro ao carregar detalhes da tarefa.', 'error');
      }
    }
  }, [tarefaId, showToast]);

  // Carrega lista de sugestões
  const carregarSugestoes = useCallback(async () => {
    if (!tarefaId) return;
    try {
      const lista = await sugestaoService.listarSugestoesDaTarefa(tarefaId);
      setSugestoes(lista || []);
    } catch {
      setSugestoes([]);
    }
  }, [tarefaId]);

  // Carrega lista de tickets
  const carregarTickets = useCallback(async () => {
    if (!tarefaId) return;
    try {
      const lista = await ticketService.listarTicketsDaTarefa(tarefaId);
      setTickets(lista || []);
    } catch {
      setTickets([]);
    }
  }, [tarefaId]);

  // Inicialização
  useEffect(() => {
    let isMounted = true;

    if (!tarefaId || isNaN(tarefaId)) {
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([
      carregarTarefa(),
      carregarSugestoes(),
      carregarTickets(),
      usuarioService.listarUsuarios().then((u) => {
        if (isMounted) setTodosUsuarios(u || []);
      }).catch(() => {}),
      equipeService.listarMinhasEquipes().then((eq) => {
        if (isMounted) setMinhasEquipes(eq || []);
      }).catch(() => {}),
    ]).finally(() => {
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [tarefaId, carregarTarefa, carregarSugestoes, carregarTickets]);

  // Salvar alterações da tarefa
  const handleSalvarTarefa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tarefaId) return;

    if (!titulo.trim()) {
      showToast('O título da tarefa é obrigatório.', 'error');
      return;
    }
    if (!dataVencimento) {
      showToast('A data de vencimento é obrigatória.', 'error');
      return;
    }

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('Titulo', titulo.trim());
      formData.append('Descricao', descricao.trim());
      formData.append('DataVencimento', new Date(dataVencimento).toISOString());
      formData.append('Prioridade', prioridade);
      if (pontuacao !== '') {
        formData.append('Pontuacao', pontuacao.toString());
      }

      novosAnexos.forEach((file) => {
        formData.append('Anexos', file);
      });

      await tarefaService.atualizarTarefa(tarefaId, formData);
      setNovosAnexos([]);
      await carregarTarefa();
      showToast('Tarefa atualizada com sucesso!', 'success');
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message, 'error');
      } else {
        showToast('Falha ao atualizar tarefa.', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  // Concluir tarefa
  const handleConcluirTarefa = async () => {
    if (!tarefaId) return;
    try {
      setCompleting(true);
      await tarefaService.concluirTarefa(tarefaId);
      showToast('Tarefa marcada como concluída!', 'success');
      await carregarTarefa();
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message, 'error');
      } else {
        showToast('Falha ao concluir tarefa.', 'error');
      }
    } finally {
      setCompleting(false);
    }
  };

  // Excluir tarefa
  const handleExcluirTarefa = async () => {
    if (!tarefaId) return;
    const confirmacao = window.confirm('Tem certeza de que deseja excluir permanentemente esta tarefa atribuída?');
    if (!confirmacao) return;

    try {
      setDeleting(true);
      await tarefaService.excluirTarefa(tarefaId);
      showToast('Tarefa excluída com sucesso.', 'success');
      router.push('/tarefas-atribuidas');
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message, 'error');
      } else {
        showToast('Falha ao excluir tarefa.', 'error');
      }
    } finally {
      setDeleting(false);
    }
  };

  // Adicionar responsável individual
  const handleAdicionarResponsavel = async () => {
    if (!tarefaId || !usuarioSelecionadoId) return;

    try {
      setAdicionandoResp(true);
      await tarefaService.atribuirResponsavel(tarefaId, Number(usuarioSelecionadoId));
      setUsuarioSelecionadoId('');
      await carregarTarefa();
      showToast('Responsável adicionado com sucesso!', 'success');
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message, 'error');
      } else {
        showToast('Falha ao atribuir responsável.', 'error');
      }
    } finally {
      setAdicionandoResp(false);
    }
  };

  // Atribuir equipe inteira
  const handleAtribuirEquipe = async () => {
    if (!tarefaId || !equipeSelecionadaId) return;

    try {
      setAdicionandoResp(true);
      await tarefaService.atribuirEquipe(tarefaId, Number(equipeSelecionadaId));
      setEquipeSelecionadaId('');
      await carregarTarefa();
      showToast('Membros da equipe atribuídos com sucesso!', 'success');
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message, 'error');
      } else {
        showToast('Falha ao atribuir equipe.', 'error');
      }
    } finally {
      setAdicionandoResp(false);
    }
  };

  // Remover responsável
  const handleRemoverResponsavel = async (responsavelId: number) => {
    if (!tarefaId) return;
    const confirmou = window.confirm('Deseja desvincular este responsável da tarefa?');
    if (!confirmou) return;

    try {
      setRemovendoRespId(responsavelId);
      await tarefaService.removerResponsavel(tarefaId, responsavelId);
      await carregarTarefa();
      showToast('Responsável removido da tarefa.', 'success');
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message, 'error');
      } else {
        showToast('Falha ao desvincular responsável.', 'error');
      }
    } finally {
      setRemovendoRespId(null);
    }
  };

  // Aprovar sugestão
  const handleAprovarSugestao = async (sugestaoId: number) => {
    try {
      setProcessandoSugestaoId(sugestaoId);
      await sugestaoService.aprovarSugestao(sugestaoId);
      showToast('Sugestão aprovada com sucesso!', 'success');
      await carregarSugestoes();
      await carregarTarefa();
    } catch (err: unknown) {
      if (err instanceof Error) showToast(err.message, 'error');
    } finally {
      setProcessandoSugestaoId(null);
    }
  };

  // Rejeitar sugestão
  const handleRejeitarSugestao = async (sugestaoId: number) => {
    try {
      setProcessandoSugestaoId(sugestaoId);
      await sugestaoService.rejeitarSugestao(sugestaoId);
      showToast('Sugestão recusada.', 'info');
      await carregarSugestoes();
    } catch (err: unknown) {
      if (err instanceof Error) showToast(err.message, 'error');
    } finally {
      setProcessandoSugestaoId(null);
    }
  };

  // Fechar ticket
  const handleFecharTicket = async (ticketId: number) => {
    try {
      setProcessandoTicketId(ticketId);
      await ticketService.fecharTicket(ticketId);
      showToast('Ticket marcado como resolvido!', 'success');
      await carregarTickets();
    } catch (err: unknown) {
      if (err instanceof Error) showToast(err.message, 'error');
    } finally {
      setProcessandoTicketId(null);
    }
  };

  const formatarData = (isoDate?: string | null) => {
    if (!isoDate) return 'Sem data definida';
    const d = new Date(isoDate);
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isVencida = () => {
    if (!tarefa?.dataVencimento) return false;
    return new Date(tarefa.dataVencimento) < new Date() && tarefa.status !== 'Concluida';
  };

  // Usuários disponíveis para adicionar como responsáveis
  const idsResponsaveisAtuais = new Set(tarefa?.responsaveis?.map((r) => r.usuarioId) || []);
  const usuariosDisponiveis = todosUsuarios.filter((u) => !idsResponsaveisAtuais.has(u.id));

  return (
    <>
      <Header titulo="Gerenciar Tarefa Atribuída" subtitulo="Workspace / Cortex" />

      <main className={styles.container}>
        <button
          type="button"
          onClick={() => router.push('/tarefas-atribuidas')}
          className={styles.backBtn}
        >
          ← Voltar para Tarefas Atribuídas
        </button>

        {loading ? (
          <div className={styles.loadingWrapper}>
            Carregando informações da tarefa...
          </div>
        ) : !tarefa ? (
          <div className={styles.loadingWrapper}>
            Tarefa não encontrada ou você não possui permissão para gerenciá-la.
          </div>
        ) : (
          <>
            {/* Abas de Navegação (Estilo Relatórios) */}
            <div className={styles.tabsHeader}>
              <button
                type="button"
                onClick={() => setActiveTab('detalhes')}
                className={`${styles.tabBtn} ${activeTab === 'detalhes' ? styles.tabBtnActive : ''}`}
              >
                <FileTextIcon size={16} />
                Detalhes da Tarefa
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('sugestoes')}
                className={`${styles.tabBtn} ${activeTab === 'sugestoes' ? styles.tabBtnActive : ''}`}
              >
                <FileTextIcon size={16} />
                Sugestões de Alteração
                <span className={styles.tabCount}>{sugestoes.length}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('tickets')}
                className={`${styles.tabBtn} ${activeTab === 'tickets' ? styles.tabBtnActive : ''}`}
              >
                <UserIcon size={16} />
                Tickets de Problema
                <span className={styles.tabCount}>{tickets.length}</span>
              </button>
            </div>

            {/* ABA 1: DETALHES E RESPONSÁVEIS DA TAREFA */}
            {activeTab === 'detalhes' && (
              <>
                {/* CONTAINER 1: DETALHES ALTERÁVEIS DA TAREFA */}
                <div className={styles.detailsCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.titleArea}>
                      <h1 className={styles.taskTitle}>{tarefa.titulo}</h1>
                  <div className={styles.badgesRow}>
                    <Badge
                      type="status"
                      value={isVencida() ? 'Atrasada' : tarefa.status}
                    />
                    <Badge type="prioridade" value={tarefa.prioridade} />
                    {tarefa.pontuacao !== null && tarefa.pontuacao !== undefined && (
                      <span className={styles.ptsBadge}>
                        ⭐ {tarefa.pontuacao} pts
                      </span>
                    )}
                    <span style={{ fontSize: '13px', color: 'var(--cortex-gray-text)' }}>
                      ID #{tarefa.id}
                    </span>
                  </div>
                </div>

                <div className={styles.headerActions}>
                  {tarefa.status !== 'Concluida' && (
                    <button
                      type="button"
                      className={styles.btnComplete}
                      disabled={completing || saving}
                      onClick={handleConcluirTarefa}
                      title="Marcar tarefa como finalizada"
                    >
                      <CheckIcon size={16} />
                      {completing ? 'Concluindo...' : 'Finalizar tarefa'}
                    </button>
                  )}

                  <button
                    type="button"
                    className={styles.btnDelete}
                    disabled={deleting || saving}
                    onClick={handleExcluirTarefa}
                    title="Excluir permanentemente"
                  >
                    <TrashIcon size={16} />
                    {deleting ? 'Excluindo...' : 'Excluir'}
                  </button>

                  <button
                    type="button"
                    className={styles.btnSave}
                    disabled={saving}
                    onClick={handleSalvarTarefa}
                  >
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </div>

              {/* Formulário de Edição */}
              <form onSubmit={handleSalvarTarefa} className={styles.editForm}>
                <div className={styles.field}>
                  <label className={styles.label}>Título da Tarefa *</label>
                  <input
                    type="text"
                    required
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    className={styles.input}
                    placeholder="Nome descritivo da tarefa..."
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Instruções & Descrição</label>
                  <textarea
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    className={styles.textarea}
                    placeholder="Orientações detalhadas para a execução da tarefa..."
                  />
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.field}>
                    <label className={styles.label}>Data de Vencimento *</label>
                    <input
                      type="datetime-local"
                      required
                      value={dataVencimento}
                      onChange={(e) => setDataVencimento(e.target.value)}
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>Prioridade *</label>
                    <select
                      value={prioridade}
                      onChange={(e) => setPrioridade(e.target.value as Prioridade)}
                      className={styles.select}
                    >
                      <option value="Baixa">Baixa</option>
                      <option value="Media">Média</option>
                      <option value="Alta">Alta</option>
                      <option value="Urgente">Urgente</option>
                    </select>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>Pontuação (Gamificação)</label>
                    <input
                      type="number"
                      min="0"
                      value={pontuacao}
                      onChange={(e) => setPontuacao(e.target.value ? Number(e.target.value) : '')}
                      className={styles.input}
                      placeholder="Ex: 50"
                    />
                  </div>
                </div>

                {/* Seção de Anexos */}
                <div className={styles.anexosSection}>
                  <label className={styles.label}>
                    Anexos da Tarefa ({tarefa.anexos?.length || 0})
                  </label>

                  {tarefa.anexos && tarefa.anexos.length > 0 && (
                    <div className={styles.anexosList}>
                      {tarefa.anexos.map((anexo) => (
                        <a
                          key={anexo.id}
                          href={anexo.urlCaminho}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.anexoCard}
                        >
                          <PaperclipIcon size={16} color="var(--cortex-purple)" />
                          <span>{anexo.nomeOriginal}</span>
                        </a>
                      ))}
                    </div>
                  )}

                  <label className={styles.uploadLabelBtn}>
                    <PaperclipIcon size={16} />
                    <span>Adicionar novos anexos</span>
                    <input
                      type="file"
                      multiple
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files) {
                          setNovosAnexos((prev) => [...prev, ...Array.from(e.target.files!)]);
                        }
                      }}
                    />
                  </label>

                  {novosAnexos.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                      {novosAnexos.map((f, i) => (
                        <span key={i} className={styles.fileTag} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <FileTextIcon size={14} />
                          <span>{f.name}</span>
                          <button
                            type="button"
                            onClick={() => setNovosAnexos((prev) => prev.filter((_, idx) => idx !== i))}
                            style={{ background: 'none', border: 'none', color: '#ff8888', cursor: 'pointer', padding: 0 }}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </form>
            </div>

            {/* CONTAINER 2: PESSOAS RESPONSÁVEIS & ALTERAÇÃO DE RESPONSÁVEL */}
            <div className={styles.responsaveisSection}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  Pessoas Responsáveis ({tarefa.responsaveis?.length || 0})
                </h2>
                <p className={styles.sectionSubtitle}>
                  Membros encarregados de realizar a tarefa. Você pode adicionar ou alterar responsáveis a qualquer momento.
                </p>
              </div>

              {tarefa.responsaveis && tarefa.responsaveis.length > 0 ? (
                <div className={styles.responsaveisList}>
                  {tarefa.responsaveis.map((resp) => {
                    const nome = resp.usuario?.nome || `Usuário #${resp.usuarioId}`;
                    const email = resp.usuario?.email || '';
                    const foto = resp.usuario?.fotoPerfil?.urlCaminho;

                    return (
                      <div key={resp.id} className={styles.responsavelCard}>
                        <div className={styles.responsavelInfo}>
                          {foto ? (
                            <Image
                              src={foto}
                              alt={nome}
                              width={40}
                              height={40}
                              className={styles.avatar}
                              unoptimized
                            />
                          ) : (
                            <div className={styles.avatar}>
                              {nome.charAt(0).toUpperCase()}
                            </div>
                          )}

                          <div className={styles.responsavelDetails}>
                            <span className={styles.responsavelName}>{nome}</span>
                            {email && <span className={styles.responsavelEmail}>{email}</span>}
                          </div>
                        </div>

                        <button
                          type="button"
                          className={styles.removeRespBtn}
                          disabled={removendoRespId === resp.id}
                          onClick={() => handleRemoverResponsavel(resp.id)}
                          title="Remover atribuição deste usuário"
                        >
                          {removendoRespId === resp.id ? 'Removendo...' : 'Remover'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={styles.emptyBox}>
                  Nenhum responsável foi atribuído a esta tarefa ainda.
                </div>
              )}

              {/* Caixa de Ação: Adicionar ou Alterar Responsável */}
              <div className={styles.addResponsavelBox}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--cortex-white)' }}>
                  Atribuir novo responsável ou equipe
                </span>

                <div className={styles.addResponsavelRow}>
                  {/* Atribuição Individual */}
                  <select
                    value={usuarioSelecionadoId}
                    onChange={(e) => setUsuarioSelecionadoId(e.target.value ? Number(e.target.value) : '')}
                    className={styles.select}
                    style={{ minWidth: '240px', flex: 1 }}
                  >
                    <option value="">Selecione um usuário...</option>
                    {usuariosDisponiveis.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nome} ({u.email})
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    className={styles.addRespBtn}
                    disabled={!usuarioSelecionadoId || adicionandoResp}
                    onClick={handleAdicionarResponsavel}
                  >
                    + Adicionar Usuário
                  </button>

                  {/* Atribuição por Equipe */}
                  {minhasEquipes.length > 0 && (
                    <>
                      <div style={{ height: '24px', width: '1px', backgroundColor: 'var(--cortex-border)', margin: '0 8px' }} />

                      <select
                        value={equipeSelecionadaId}
                        onChange={(e) => setEquipeSelecionadaId(e.target.value ? Number(e.target.value) : '')}
                        className={styles.select}
                        style={{ minWidth: '200px' }}
                      >
                        <option value="">Selecione uma equipe...</option>
                        {minhasEquipes.map((eq) => (
                          <option key={eq.id} value={eq.id}>
                            {eq.nome}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        className={styles.addRespBtn}
                        disabled={!equipeSelecionadaId || adicionandoResp}
                        onClick={handleAtribuirEquipe}
                      >
                        + Atribuir Equipe Inteira
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        )}


            {/* ABA 2: SUGESTÕES DE ALTERAÇÃO */}
            {activeTab === 'sugestoes' && (
              <div className={styles.detailsCard}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>
                    Sugestões de Alteração ({sugestoes.length})
                  </h2>
                  <p className={styles.sectionSubtitle}>
                    Sugestões enviadas pelos responsáveis desta tarefa para análise e aprovação.
                  </p>
                </div>

                {sugestoes.length === 0 ? (
                  <div className={styles.emptyBox}>
                    Nenhuma sugestão de alteração foi enviada para esta tarefa pelos colaboradores.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {sugestoes.map((sug) => {
                      const autorNome = sug.usuario?.nome || 'Colaborador';
                      const autorFoto = sug.usuario?.fotoPerfil?.urlCaminho;

                      return (
                        <div key={sug.id} className={styles.itemCard}>
                          <div className={styles.itemHeader}>
                            <div className={styles.authorBlock}>
                              {autorFoto ? (
                                <Image
                                  src={autorFoto}
                                  alt={autorNome}
                                  width={32}
                                  height={32}
                                  className={styles.avatar}
                                  unoptimized
                                />
                              ) : (
                                <div className={styles.avatar} style={{ width: '32px', height: '32px', fontSize: '13px' }}>
                                  {autorNome.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <span className={styles.authorName}>{autorNome}</span>
                              <span className={styles.itemDate}>• {formatarData(sug.dataCriacao)}</span>
                            </div>

                            <Badge type="status" value={sug.status} />
                          </div>

                          <div className={styles.itemDescription}>
                            {sug.descricao}
                          </div>

                          {sug.status === 'Pendente' && (
                            <div className={styles.itemActions}>
                              <button
                                type="button"
                                className={styles.rejectBtn}
                                disabled={processandoSugestaoId === sug.id}
                                onClick={() => handleRejeitarSugestao(sug.id)}
                              >
                                Recusar
                              </button>
                              <button
                                type="button"
                                className={styles.approveBtn}
                                disabled={processandoSugestaoId === sug.id}
                                onClick={() => handleAprovarSugestao(sug.id)}
                              >
                                Aprovar Sugestão
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ABA 3: TICKETS DE PROBLEMA */}
            {activeTab === 'tickets' && (
              <div className={styles.detailsCard}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>
                    Tickets de Problema ({tickets.length})
                  </h2>
                  <p className={styles.sectionSubtitle}>
                    Problemas e impedimentos reportados pelos colaboradores encarregados.
                  </p>
                </div>

                {tickets.length === 0 ? (
                  <div className={styles.emptyBox}>
                    Nenhum ticket de problema foi reportado para esta tarefa.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {tickets.map((ticket) => {
                      const autorNome = ticket.usuario?.nome || 'Colaborador';
                      const autorFoto = ticket.usuario?.fotoPerfil?.urlCaminho;
                      const isAberto = ticket.ativo;

                      return (
                        <div key={ticket.id} className={styles.itemCard}>
                          <div className={styles.itemHeader}>
                            <div className={styles.authorBlock}>
                              {autorFoto ? (
                                <Image
                                  src={autorFoto}
                                  alt={autorNome}
                                  width={32}
                                  height={32}
                                  className={styles.avatar}
                                  unoptimized
                                />
                              ) : (
                                <div className={styles.avatar} style={{ width: '32px', height: '32px', fontSize: '13px' }}>
                                  {autorNome.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <span className={styles.authorName}>{autorNome}</span>
                              <span className={styles.itemDate}>• {formatarData(ticket.dataCriacao)}</span>
                            </div>

                            <span
                              className={`${styles.statusTag} ${
                                isAberto ? styles.tagAberto : styles.tagFechado
                              }`}
                            >
                              {isAberto ? 'Aberto' : 'Resolvido'}
                            </span>
                          </div>

                          <div className={`${styles.itemDescription} ${styles.ticketDesc}`}>
                            {ticket.descricao}
                          </div>

                          {isAberto && (
                            <div className={styles.itemActions}>
                              <button
                                type="button"
                                className={styles.resolveBtn}
                                disabled={processandoTicketId === ticket.id}
                                onClick={() => handleFecharTicket(ticket.id)}
                              >
                                Marcar como Resolvido
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
