'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Header from '@/app/Components/Header/header';
import { Badge } from '@/components/common/Badge/Badge';
import {
  DetalhesTarefaDTO,
  ConsultaTicketReporteDTO,
  ConsultaSugestaoDTO,
} from '@/types/api';
import { tarefaService } from '@/services/tarefaService';
import { respostaService } from '@/services/respostaService';
import { ticketService } from '@/services/ticketService';
import { sugestaoService } from '@/services/sugestaoService';
import { anexoService } from '@/services/anexoService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { SuggestionModal } from '@/components/tasks/SuggestionModal/SuggestionModal';
import { ReportTicketModal } from '@/components/tasks/ReportTicketModal/ReportTicketModal';
import { AttachmentGallery } from '@/components/tasks/AttachmentGallery/AttachmentGallery';
import {
  PaperclipIcon,
  FileTextIcon,
  AlertCircleIcon,
  AlertTriangleIcon,
  LightbulbIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from '@/components/common/Icons/Icons';
import styles from './page.module.css';

export default function DetalhesTarefaPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const { usuario } = useAuth();

  const idParam = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const tarefaId = idParam ? Number(idParam) : null;

  const [tarefa, setTarefa] = useState<DetalhesTarefaDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [uploadingResposta, setUploadingResposta] = useState(false);
  const [removendoAnexoId, setRemovendoAnexoId] = useState<number | null>(null);

  // Abas de navegação
  const [activeTab, setActiveTab] = useState<'detalhes' | 'sugestoes' | 'tickets'>('detalhes');
  const [tickets, setTickets] = useState<ConsultaTicketReporteDTO[]>([]);
  const [sugestoes, setSugestoes] = useState<ConsultaSugestaoDTO[]>([]);

  // Submodais
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const obterAbaDaUrl = useCallback((): 'detalhes' | 'sugestoes' | 'tickets' | null => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const tabParam = (params.get('aba') || params.get('tab') || '').toLowerCase().trim();
    if (tabParam === 'sugestoes') return 'sugestoes';
    if (tabParam === 'tickets') return 'tickets';
    if (tabParam === 'detalhes') return 'detalhes';
    return null;
  }, []);

  const trocarAba = useCallback((tab: 'detalhes' | 'sugestoes' | 'tickets') => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('aba', tab);
      url.searchParams.delete('tab');
      window.history.pushState({}, '', url.toString());
    }
  }, []);

  useEffect(() => {
    const sincronizarAba = () => {
      const abaUrl = obterAbaDaUrl();
      if (abaUrl) {
        setActiveTab(abaUrl);
      }
    };

    sincronizarAba();
    window.addEventListener('popstate', sincronizarAba);
    return () => {
      window.removeEventListener('popstate', sincronizarAba);
    };
  }, [obterAbaDaUrl]);

  const carregarTicketsESugestoes = useCallback(async () => {
    if (!tarefaId || isNaN(tarefaId)) return;
    try {
      const [ticketsData, sugestoesData] = await Promise.all([
        ticketService.listarTicketsDaTarefa(tarefaId).catch(() => []),
        sugestaoService.listarSugestoesDaTarefa(tarefaId).catch(() => []),
      ]);
      setTickets(ticketsData || []);
      setSugestoes(sugestoesData || []);
    } catch {
      // Ignora erro
    }
  }, [tarefaId]);

  const handleSugestaoCriada = async () => {
    await carregarTicketsESugestoes();
    trocarAba('sugestoes');
  };

  const handleTicketCriado = async () => {
    await carregarTicketsESugestoes();
    trocarAba('tickets');
  };

  const recarregarTarefa = async () => {
    if (!tarefaId) return;
    try {
      const dados = await tarefaService.obterPorId(tarefaId);
      setTarefa(dados);
    } catch {
      // Ignora erro em revalidação de fundo
    }
  };

  const handleUploadResposta = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !tarefa) return;
    const files = Array.from(e.target.files);

    try {
      setUploadingResposta(true);
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('Anexos', file);
      });

      await respostaService.criarResposta(tarefa.id, formData);
      showToast(
        files.length > 1
          ? `${files.length} arquivos anexados à sua resposta com sucesso!`
          : 'Arquivo anexado à sua resposta com sucesso!',
        'success'
      );

      await recarregarTarefa();
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message, 'error');
      } else {
        showToast('Falha ao anexar arquivo à resposta.', 'error');
      }
    } finally {
      setUploadingResposta(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoverAnexo = async (anexoId: number) => {
    if (isConcluida) {
      showToast('Não é possível remover arquivos de uma tarefa finalizada.', 'error');
      return;
    }

    try {
      setRemovendoAnexoId(anexoId);
      await anexoService.excluirAnexo(anexoId);
      showToast('Arquivo anexado removido com sucesso!', 'success');
      await recarregarTarefa();
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message, 'error');
      } else {
        showToast('Falha ao remover arquivo anexado.', 'error');
      }
    } finally {
      setRemovendoAnexoId(null);
    }
  };

  useEffect(() => {
    let isMounted = true;

    if (!tarefaId || isNaN(tarefaId)) {
      setLoading(false);
      return;
    }

    Promise.all([
      tarefaService.obterPorId(tarefaId),
      ticketService.listarTicketsDaTarefa(tarefaId).catch(() => []),
      sugestaoService.listarSugestoesDaTarefa(tarefaId).catch(() => []),
    ])
      .then(([dadosTarefa, dadosTickets, dadosSugestoes]) => {
        if (isMounted) {
          setTarefa(dadosTarefa);
          setTickets(dadosTickets || []);
          setSugestoes(dadosSugestoes || []);
        }
      })
      .catch((err) => {
        if (isMounted) {
          showToast(err.message || 'Erro ao carregar detalhes da tarefa', 'error');
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [tarefaId, showToast]);

  const handleConcluir = async () => {
    if (!tarefa) return;
    try {
      setCompleting(true);
      await tarefaService.concluirTarefa(tarefa.id);
      showToast('Tarefa marcada como finalizada com sucesso!', 'success');
      await recarregarTarefa();
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message, 'error');
      } else {
        showToast('Falha ao finalizar tarefa', 'error');
      }
    } finally {
      setCompleting(false);
    }
  };

  const handleCancelarEntrega = async () => {
    if (!tarefa) return;
    try {
      setCanceling(true);
      await tarefaService.cancelarConclusaoTarefa(tarefa.id);
      showToast('Entrega cancelada! A tarefa voltou a ficar pendente.', 'info');
      await recarregarTarefa();
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message, 'error');
      } else {
        showToast('Falha ao cancelar entrega da tarefa', 'error');
      }
    } finally {
      setCanceling(false);
    }
  };

  const getAvatarUrl = (url?: string | null) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return url.startsWith('/') ? url : `/${url}`;
  };

  const formatarData = (isoString?: string | null) => {
    if (!isoString) return 'Sem prazo definido';
    const data = new Date(isoString);
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Remove menções textuais de sugestão aprovada/aceita (o push já notifica o responsável)
  const obterDescricaoLimpa = (descricao?: string | null) => {
    if (!descricao) return '';
    return descricao
      .replace(/(?:^|\r?\n)*\[Sugest[aã]o\s*#?\d*\s*(?:Aprovada|Aceita)[^\]]*\]:?[\s\S]*/gi, '')
      .trim();
  };
  // Anexos vinculados à resposta do responsável
  const respostasDoResponsavel = tarefa?.respostas?.filter(
    (r) => !usuario?.id || r.usuarioId === usuario.id
  ) || [];

  const isMultiResponsavel = (tarefa?.responsaveis?.length ?? 0) > 1;
  const isConcluida = isMultiResponsavel
    ? respostasDoResponsavel.length > 0
    : tarefa?.status === 'Concluida';

  const isVencida = () => {
    if (!tarefa?.dataVencimento) return false;
    return new Date(tarefa.dataVencimento) < new Date() && !isConcluida;
  };
  const anexosResposta = (respostasDoResponsavel.length > 0 ? respostasDoResponsavel : (tarefa?.respostas || []))
    .flatMap((r) => r.anexos || []);
  const respostaAvaliada = respostasDoResponsavel.find(
    (r) => r.nota !== null && r.nota !== undefined
  );

  return (
    <>
      <Header titulo="Detalhes da Tarefa" />

      <main className={styles.container}>
        <button
          type="button"
          onClick={() => router.push('/minhas-tarefas')}
          className={styles.backBtn}
        >
          ← Voltar para Minhas Tarefas
        </button>

        {loading ? (
          <div className={styles.loadingWrapper}>Carregando detalhes da tarefa...</div>
        ) : !tarefa ? (
          <div className={styles.loadingWrapper}>
            Tarefa não encontrada ou você não tem permissão para acessá-la.
          </div>
        ) : (
          <>
            {/* Abas Superiores */}
            {(sugestoes.length > 0 || tickets.length > 0 || activeTab !== 'detalhes') && (
              <div className={styles.tabsHeader}>
                <button
                  type="button"
                  onClick={() => trocarAba('detalhes')}
                  className={`${styles.tabBtn} ${activeTab === 'detalhes' ? styles.tabBtnActive : ''}`}
                >
                  <FileTextIcon size={16} />
                  Detalhes da Tarefa
                </button>

                <button
                  type="button"
                  onClick={() => trocarAba('sugestoes')}
                  className={`${styles.tabBtn} ${activeTab === 'sugestoes' ? styles.tabBtnActive : ''}`}
                >
                  <LightbulbIcon size={16} />
                  Sugestões de Alteração
                  {sugestoes.length > 0 && <span className={styles.tabCount}>{sugestoes.length}</span>}
                </button>

                <button
                  type="button"
                  onClick={() => trocarAba('tickets')}
                  className={`${styles.tabBtn} ${activeTab === 'tickets' ? styles.tabBtnActive : ''}`}
                >
                  <AlertTriangleIcon size={16} />
                  Tickets de Reporte
                  {tickets.length > 0 && <span className={styles.tabCount}>{tickets.length}</span>}
                </button>
              </div>
            )}

            {/* ABA 1: DETALHES DA TAREFA */}
            {activeTab === 'detalhes' && (
              <>
                {/* Container Principal da Tarefa */}
                <div className={styles.detailsCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.titleArea}>
                      <h1 className={styles.taskTitle}>{tarefa.titulo}</h1>
                      <div className={styles.badgesRow}>
                        <Badge type="prioridade" value={tarefa.prioridade} />
                        {tarefa.pontuacao !== null && tarefa.pontuacao !== undefined && (
                          <span style={{ fontSize: '13px', color: 'var(--cortex-purple)', fontWeight: 600 }}>
                            {tarefa.pontuacao} pts
                          </span>
                        )}
                      </div>
                    </div>

                    <div className={styles.headerActions}>
                      <button
                        type="button"
                        className={styles.btnDanger}
                        disabled={isConcluida}
                        onClick={() => setShowReport(true)}
                        title={isConcluida ? 'Não é possível reportar problema em uma tarefa finalizada' : undefined}
                      >
                        Reportar problema
                      </button>
                      <button
                        type="button"
                        className={styles.btnSecondary}
                        disabled={isConcluida}
                        onClick={() => setShowSuggestion(true)}
                        title={isConcluida ? 'Não é possível sugerir alteração em uma tarefa finalizada' : undefined}
                      >
                        Sugerir alteração
                      </button>
                      {isConcluida ? (
                        <button
                          type="button"
                          className={styles.btnCancelDelivery}
                          disabled={canceling}
                          onClick={handleCancelarEntrega}
                        >
                          {canceling ? 'Cancelando...' : 'Cancelar entrega'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={styles.btnPrimary}
                          disabled={completing}
                          onClick={handleConcluir}
                        >
                          {completing ? 'Concluindo...' : 'Finalizar entrega'}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className={styles.metaGrid}>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Atribuído por</span>
                      <span className={styles.metaValue}>
                        {tarefa.criador?.nome || 'Sistema / Equipe'}
                      </span>
                    </div>

                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Prazo de Entrega</span>
                      <span
                        className={styles.metaValue}
                        style={isVencida() ? { color: '#ef4444', fontWeight: 600 } : undefined}
                        suppressHydrationWarning
                      >
                        {formatarData(tarefa.dataVencimento)}
                      </span>
                    </div>

                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>ID da Tarefa</span>
                      <span className={styles.metaValue}>
                        #{tarefa.id}
                      </span>
                    </div>

                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Status Atual</span>
                      <span className={styles.metaValue}>
                        {tarefa.status}
                      </span>
                    </div>
                  </div>

                  <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Instruções & Descrição</h2>
                    <div className={styles.descriptionBox}>
                      {obterDescricaoLimpa(tarefa.descricao) || 'Nenhuma instrução adicional informada para esta tarefa.'}
                    </div>
                  </div>

                  {/* Anexos da Tarefa disponibilizados pelo criador (Sem o botão de anexar do responsável) */}
                  <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                      Anexos da Tarefa ({tarefa.anexos?.length || 0})
                    </h2>
                    {tarefa.anexos && tarefa.anexos.length > 0 ? (
                      <AttachmentGallery anexos={tarefa.anexos} />
                    ) : (
                      <div className={styles.emptyAttachments}>
                        Nenhum arquivo de instrução anexado à tarefa.
                      </div>
                    )}
                  </div>
                </div>

                {/* Container Exclusivo de Resposta / Entrega do Responsável */}
                <div className={styles.responseCard}>
                  <div className={styles.responseHeader}>
                    <div className={styles.responseTitleArea}>
                      <h2 className={styles.responseTitle}>
                        Sua Resposta
                      </h2>
                      <span className={styles.responseSubtitle}>
                        Anexe aqui os arquivos de resposta para entregar a tarefa.
                      </span>
                      {respostaAvaliada && (
                        <div style={{ marginTop: '8px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            backgroundColor: 'var(--cortex-green-badge-bg, #D4EDDA)',
                            color: 'var(--cortex-green-badge-text, #155724)',
                            fontWeight: 600,
                            fontSize: '13px'
                          }}>
                            Avaliação da entrega: {respostaAvaliada.nota} / {tarefa.pontuacao !== null && tarefa.pontuacao !== undefined ? `${tarefa.pontuacao} pts` : '100 pts'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        multiple
                        style={{ display: 'none' }}
                        onChange={handleUploadResposta}
                        disabled={isConcluida || uploadingResposta}
                      />
                      <button
                        type="button"
                        className={styles.btnSecondary}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isConcluida || uploadingResposta}
                        title={
                          isConcluida
                            ? 'Não é possível anexar arquivos a uma tarefa finalizada. Cancele a entrega para adicionar novos arquivos.'
                            : undefined
                        }
                      >
                        <PaperclipIcon size={16} />
                        {uploadingResposta ? 'Enviando resposta...' : 'Anexar arquivo'}
                      </button>
                    </div>
                  </div>

                  {anexosResposta.length > 0 ? (
                    <AttachmentGallery
                      anexos={anexosResposta}
                      podeRemover={!isConcluida}
                      onRemoverAnexo={handleRemoverAnexo}
                      removendoId={removendoAnexoId}
                    />
                  ) : (
                    <div className={styles.emptyAttachments}>
                      {isConcluida
                        ? 'Você finalizou esta tarefa sem anexar arquivos.'
                        : 'Nenhum arquivo anexado à sua resposta ainda. Use o botão \u201cAnexar arquivo\u201d acima para enviar sua entrega.'}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ABA 2: SUGESTÕES DE ALTERAÇÃO */}
            {activeTab === 'sugestoes' && (
              <div className={styles.ticketsContainersWrapper}>
                <div className={styles.detailsCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.titleArea}>
                      <h2 className={styles.sectionTitle} style={{ fontSize: '18px', margin: 0 }}>
                        Sugestões de Alteração ({sugestoes.length})
                      </h2>
                      <span style={{ fontSize: '13px', color: 'var(--cortex-gray-text)' }}>
                        Propostas de ajuste de prazo, escopo ou prioridade submetidas ao criador da tarefa.
                      </span>
                    </div>
                  </div>

                  {sugestoes.length > 0 ? (
                    <div className={styles.ticketsList}>
                      {sugestoes.map((sug) => {
                        const autorNome = sug.usuario?.nome || usuario?.nome || 'Você';
                        const autorFoto = sug.usuario?.fotoPerfil?.urlCaminho || usuario?.fotoPerfil?.urlCaminho;

                        return (
                          <div key={sug.id} className={styles.itemCard}>
                            <div className={styles.itemHeader}>
                              <div className={styles.authorBlock}>
                                {autorFoto && getAvatarUrl(autorFoto) ? (
                                  <Image
                                    src={getAvatarUrl(autorFoto)}
                                    alt={autorNome}
                                    width={32}
                                    height={32}
                                    className={styles.avatar}
                                    unoptimized
                                  />
                                ) : (
                                  <div className={styles.avatar}>
                                    {autorNome.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div className={styles.authorMeta}>
                                  <span className={styles.authorName}>{autorNome}</span>
                                  <span className={styles.itemDate} suppressHydrationWarning>• {formatarData(sug.dataCriacao)}</span>
                                </div>
                              </div>

                              {sug.status === 'Aprovada' ? (
                                <span className={`${styles.statusTag} ${styles.tagFechado}`}>Aprovada</span>
                              ) : sug.status === 'Rejeitada' ? (
                                <span className={`${styles.statusTag} ${styles.tagRejeitado}`}>Recusada</span>
                              ) : (
                                <span className={`${styles.statusTag} ${styles.tagAberto}`}>Pendente</span>
                              )}
                            </div>

                            <div className={styles.itemDescription}>
                              {sug.descricao}
                            </div>

                            
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className={styles.emptyBox}>
                      Nenhuma sugestão de alteração submetida para esta tarefa.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ABA 3: TICKETS DE REPORTE */}
            {activeTab === 'tickets' && (
              <div className={styles.ticketsContainersWrapper}>
                <div className={styles.detailsCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.titleArea}>
                      <h2 className={styles.sectionTitle} style={{ fontSize: '18px', margin: 0 }}>
                        Tickets de Reporte ({tickets.length})
                      </h2>
                      <span style={{ fontSize: '13px', color: 'var(--cortex-gray-text)' }}>
                        Problemas e impedimentos reportados aos gestores e administradores da equipe.
                      </span>
                    </div>
                  </div>

                  {tickets.length > 0 ? (
                    <div className={styles.ticketsList}>
                      {tickets.map((ticket) => {
                        const autorNome = ticket.usuario?.nome || usuario?.nome || 'Você';
                        const autorFoto = ticket.usuario?.fotoPerfil?.urlCaminho || usuario?.fotoPerfil?.urlCaminho;
                        const isAberto = ticket.ativo;

                        return (
                          <div key={ticket.id} className={styles.itemCard}>
                            <div className={styles.itemHeader}>
                              <div className={styles.authorBlock}>
                                {autorFoto && getAvatarUrl(autorFoto) ? (
                                  <Image
                                    src={getAvatarUrl(autorFoto)}
                                    alt={autorNome}
                                    width={32}
                                    height={32}
                                    className={styles.avatar}
                                    unoptimized
                                  />
                                ) : (
                                  <div className={styles.avatar}>
                                    {autorNome.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div className={styles.authorMeta}>
                                  <span className={styles.authorName}>{autorNome}</span>
                                  <span className={styles.itemDate} suppressHydrationWarning>• {formatarData(ticket.dataCriacao)}</span>
                                </div>
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

                            
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className={styles.emptyBox}>
                      Nenhum ticket de reporte registrado para esta tarefa.
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Submodal de Sugestão de Alteração */}
      {tarefa && (
        <SuggestionModal
          isOpen={showSuggestion}
          onClose={() => setShowSuggestion(false)}
          tarefaId={tarefa.id}
          tarefaTitulo={tarefa.titulo}
          criadorId={tarefa.criadorId}
          onSuccess={handleSugestaoCriada}
        />
      )}

      {/* Submodal de Ticket de Reporte */}
      {tarefa && (
        <ReportTicketModal
          isOpen={showReport}
          onClose={() => setShowReport(false)}
          tarefaId={tarefa.id}
          tarefaTitulo={tarefa.titulo}
          criadorId={tarefa.criadorId}
          onSuccess={handleTicketCriado}
        />
      )}
    </>
  );
}
