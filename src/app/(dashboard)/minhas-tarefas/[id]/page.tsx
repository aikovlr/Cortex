'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/app/Components/Header/header';
import { Badge } from '@/components/common/Badge/Badge';
import { DetalhesTarefaDTO } from '@/types/api';
import { tarefaService } from '@/services/tarefaService';
import { useToast } from '@/contexts/ToastContext';
import { SuggestionModal } from '@/components/tasks/SuggestionModal/SuggestionModal';
import { ReportTicketModal } from '@/components/tasks/ReportTicketModal/ReportTicketModal';
import { UserIcon, PaperclipIcon } from '@/components/common/Icons/Icons';
import styles from './page.module.css';

export default function DetalhesTarefaPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();

  const idParam = params?.id;
  const tarefaId = idParam ? Number(idParam) : null;

  const [tarefa, setTarefa] = useState<DetalhesTarefaDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  // Submodais
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (!tarefaId || isNaN(tarefaId)) {
      setLoading(false);
      return;
    }

    setLoading(true);
    tarefaService
      .obterPorId(tarefaId)
      .then((dados) => {
        if (isMounted) {
          setTarefa(dados);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          showToast(err.message || 'Erro ao carregar detalhes da tarefa', 'error');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [tarefaId, showToast]);

  const recarregarTarefa = async () => {
    if (!tarefaId) return;
    try {
      const dados = await tarefaService.obterPorId(tarefaId);
      setTarefa(dados);
    } catch {
      // Ignora erro em revalidação
    }
  };

  const handleConcluir = async () => {
    if (!tarefa) return;
    try {
      setCompleting(true);
      await tarefaService.concluirTarefa(tarefa.id);
      showToast('Tarefa concluída com sucesso!', 'success');
      recarregarTarefa();
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message, 'error');
      } else {
        showToast('Falha ao concluir tarefa', 'error');
      }
    } finally {
      setCompleting(false);
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
                    <span style={{ fontSize: '13px', color: 'var(--cortex-purple)', fontWeight: 600 }}>
                      ⭐ {tarefa.pontuacao} pts
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.headerActions}>
                <button
                  type="button"
                  className={styles.btnDanger}
                  onClick={() => setShowReport(true)}
                >
                  Reportar problema
                </button>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setShowSuggestion(true)}
                >
                  Sugerir alteração
                </button>
                {tarefa.status !== 'Concluida' && (
                  <button
                    type="button"
                    className={styles.btnPrimary}
                    disabled={completing}
                    onClick={handleConcluir}
                  >
                    {completing ? 'Concluindo...' : 'Finalizar tarefa'}
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

            {tarefa.responsaveis && tarefa.responsaveis.length > 0 && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  Membros Responsáveis ({tarefa.responsaveis.length})
                </h2>
                <div className={styles.attachmentsList}>
                  {tarefa.responsaveis.map((resp) => (
                    <div key={resp.id} className={styles.attachmentCard} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <UserIcon size={16} color="var(--cortex-purple)" />
                      <span>{resp.usuario?.nome || `Usuário #${resp.usuarioId}`}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tarefa.anexos && tarefa.anexos.length > 0 && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Anexos ({tarefa.anexos.length})</h2>
                <div className={styles.attachmentsList}>
                  {tarefa.anexos.map((anexo) => (
                    <a
                      key={anexo.id}
                      href={anexo.urlCaminho}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.attachmentCard}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <PaperclipIcon size={16} color="var(--cortex-purple)" />
                      <span>{anexo.nomeOriginal}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
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
