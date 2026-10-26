'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal/Modal';
import { Button } from '@/components/common/Button/Button';
import { Badge } from '@/components/common/Badge/Badge';
import { DetalhesTarefaDTO } from '@/types/api';
import { tarefaService } from '@/services/tarefaService';
import { useToast } from '@/contexts/ToastContext';
import { SuggestionModal } from '../SuggestionModal/SuggestionModal';
import { ReportTicketModal } from '../ReportTicketModal/ReportTicketModal';
import styles from './TaskDetailsModal.module.css';

interface TaskDetailsModalProps {
  tarefaId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated: () => void;
}

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  tarefaId,
  isOpen,
  onClose,
  onTaskUpdated,
}) => {
  const { showToast } = useToast();

  const [tarefa, setTarefa] = useState<DetalhesTarefaDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [completing, setCompleting] = useState(false);

  // Submodais
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (isOpen && tarefaId) {
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
            onClose();
          }
        });
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, tarefaId, showToast, onClose]);

  const handleConcluir = async () => {
    if (!tarefa) return;
    try {
      setCompleting(true);
      await tarefaService.concluirTarefa(tarefa.id);
      showToast('Tarefa marcada como concluída com sucesso!', 'success');
      onTaskUpdated();
      onClose();
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

  const formatarData = (isoString?: string) => {
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

  if (!isOpen || !tarefaId) return null;

  return (
    <>
      <Modal
        isOpen={isOpen && !showSuggestion && !showReport}
        onClose={onClose}
        title={tarefa?.titulo || 'Detalhes da Tarefa'}
        maxWidth="640px"
        footer={
          tarefa && (
            <div className={styles.footerActions}>
              <div className={styles.leftActions}>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setShowReport(true)}
                >
                  Reportar tarefa
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSuggestion(true)}
                >
                  Sugerir alteração
                </Button>
              </div>

              <div className={styles.rightActions}>
                {tarefa.status !== 'Concluida' ? (
                  <Button
                    variant="primary"
                    size="sm"
                    loading={completing}
                    onClick={handleConcluir}
                  >
                    Finalizar tarefa
                  </Button>
                ) : (
                  <Badge type="status" value="Concluida" />
                )}
              </div>
            </div>
          )
        }
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--cortex-gray-text)' }}>
            Carregando detalhes...
          </div>
        ) : tarefa ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div className={styles.metaInfo}>
              <div className={styles.metaRow}>
                <span className={styles.creatorText}>
                  Atribuído por: <strong>{tarefa.criador?.nome || 'Sistema / Equipe'}</strong>
                </span>
                <span className={styles.dueDateText}>
                  Vencimento: <strong>{formatarData(tarefa.dataVencimento)}</strong>
                </span>
              </div>

              <div className={styles.metaRow}>
                <div className={styles.badges}>
                  <Badge type="status" value={tarefa.status} />
                  <Badge type="prioridade" value={tarefa.prioridade} />
                  {tarefa.pontuacao !== null && tarefa.pontuacao !== undefined && (
                    <span style={{ fontSize: '12px', color: 'var(--cortex-purple)', fontWeight: 600 }}>
                      ⭐ {tarefa.pontuacao} pts
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Instruções & Descrição</h3>
              <div className={styles.instructionBox}>
                {tarefa.descricao || 'Nenhuma instrução adicional informada.'}
              </div>
            </div>

            {tarefa.anexos && tarefa.anexos.length > 0 && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Anexos ({tarefa.anexos.length})</h3>
                <div className={styles.attachmentsList}>
                  {tarefa.anexos.map((anexo) => (
                    <a
                      key={anexo.id}
                      href={anexo.urlCaminho}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.attachmentItem}
                    >
                      📎 {anexo.nomeOriginal}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      {/* Submodal de Sugestão de Alteração (RF004) */}
      {tarefa && (
        <SuggestionModal
          isOpen={showSuggestion}
          onClose={() => setShowSuggestion(false)}
          tarefaId={tarefa.id}
          tarefaTitulo={tarefa.titulo}
        />
      )}

      {/* Submodal de Ticket de Reporte (RF008) */}
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
};
