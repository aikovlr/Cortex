'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/app/Components/Header/header';
import { Badge } from '@/components/common/Badge/Badge';
import { DetalhesTarefaDTO } from '@/types/api';
import { tarefaService } from '@/services/tarefaService';
import { respostaService } from '@/services/respostaService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { SuggestionModal } from '@/components/tasks/SuggestionModal/SuggestionModal';
import { ReportTicketModal } from '@/components/tasks/ReportTicketModal/ReportTicketModal';
import { AttachmentGallery } from '@/components/tasks/AttachmentGallery/AttachmentGallery';
import { PaperclipIcon } from '@/components/common/Icons/Icons';
import styles from './page.module.css';

export default function DetalhesTarefaPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const { usuario } = useAuth();

  const idParam = params?.id;
  const tarefaId = idParam ? Number(idParam) : null;

  const [tarefa, setTarefa] = useState<DetalhesTarefaDTO | null>(null);
  const [loading, setLoading] = useState(() => !tarefaId || isNaN(tarefaId) ? false : true);
  const [completing, setCompleting] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [uploadingResposta, setUploadingResposta] = useState(false);

  // Submodais
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  useEffect(() => {
    let isMounted = true;

    if (!tarefaId || isNaN(tarefaId)) {
      return;
    }

    tarefaService
      .obterPorId(tarefaId)
      .then((dados) => {
        if (isMounted) {
          setTarefa(dados);
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

  const isVencida = () => {
    if (!tarefa?.dataVencimento) return false;
    return new Date(tarefa.dataVencimento) < new Date() && tarefa.status !== 'Concluida';
  };

  const isConcluida = tarefa?.status === 'Concluida';

  // Anexos vinculados à resposta do responsável
  const respostasDoResponsavel = tarefa?.respostas?.filter(
    (r) => !usuario?.id || r.usuarioId === usuario.id
  ) || [];
  const anexosResposta = (respostasDoResponsavel.length > 0 ? respostasDoResponsavel : (tarefa?.respostas || []))
    .flatMap((r) => r.anexos || []);

  return (
    <>
      <Header titulo="Detalhes da Tarefa" subtitulo="Workspace / Cortex" />

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
                  >
                    {formatarData(tarefa.dataVencimento)}
                    {isVencida() && ' (Atrasada)'}
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
                  {tarefa.descricao || 'Nenhuma instrução adicional informada para esta tarefa.'}
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
                <AttachmentGallery anexos={anexosResposta} />
              ) : (
                <div className={styles.emptyAttachments}>
                  Nenhum arquivo anexado à sua resposta ainda. Use o botão &ldquo;Anexar arquivo&rdquo; acima para enviar sua entrega.
                </div>
              )}
            </div>
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
        />
      )}

      {/* Submodal de Ticket de Reporte */}
      {tarefa && (
        <ReportTicketModal
          isOpen={showReport}
          onClose={() => setShowReport(false)}
          tarefaId={tarefa.id}
          tarefaTitulo={tarefa.titulo}
        />
      )}
    </>
  );
}
