'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal/Modal';
import { Input } from '@/components/common/Input/Input';
import { Select } from '@/components/common/Select/Select';
import { Button } from '@/components/common/Button/Button';
import { Badge } from '@/components/common/Badge/Badge';
import { Prioridade, ConsultaSugestaoDTO } from '@/types/api';
import { tarefaService } from '@/services/tarefaService';
import { sugestaoService } from '@/services/sugestaoService';
import { useToast } from '@/contexts/ToastContext';
import { PaperclipIcon, FileTextIcon, UserIcon } from '@/components/common/Icons/Icons';
import styles from './TaskEditModal.module.css';

interface TaskEditModalProps {
  tarefaId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const TaskEditModal: React.FC<TaskEditModalProps> = ({
  tarefaId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();

  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [pontuacao, setPontuacao] = useState<number | ''>('');
  const [prioridade, setPrioridade] = useState<Prioridade>('Media');
  const [novosAnexos, setNovosAnexos] = useState<File[]>([]);
  const [sugestoes, setSugestoes] = useState<ConsultaSugestaoDTO[]>([]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (isOpen && tarefaId) {
      // Carrega detalhes da tarefa
      tarefaService
        .obterPorId(tarefaId)
        .then((dados) => {
          if (isMounted) {
            setTitulo(dados.titulo);
            setDescricao(dados.descricao || '');
            if (dados.dataVencimento) {
              const dt = new Date(dados.dataVencimento);
              const formatted = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
                .toISOString()
                .slice(0, 16);
              setDataVencimento(formatted);
            }
            setPontuacao(dados.pontuacao !== null && dados.pontuacao !== undefined ? dados.pontuacao : '');
            setPrioridade(dados.prioridade);
            setLoading(false);
          }
        })
        .catch((err) => {
          if (isMounted) {
            showToast(err.message || 'Erro ao carregar tarefa', 'error');
            setLoading(false);
            onClose();
          }
        });

      // Carrega sugestões enviadas por colaboradores (RF004)
      sugestaoService
        .listarSugestoesDaTarefa(tarefaId)
        .then((lista) => {
          if (isMounted) {
            setSugestoes(lista);
          }
        })
        .catch(() => {});
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, tarefaId, showToast, onClose]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNovosAnexos((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tarefaId || !titulo || !dataVencimento) {
      showToast('Preencha os campos obrigatórios (*)', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('Titulo', titulo);
      formData.append('Descricao', descricao);
      formData.append('DataVencimento', new Date(dataVencimento).toISOString());
      if (pontuacao !== '') formData.append('Pontuacao', pontuacao.toString());
      formData.append('Prioridade', prioridade);

      novosAnexos.forEach((f) => formData.append('Anexos', f));

      await tarefaService.atualizarTarefa(tarefaId, formData);
      showToast('Tarefa atualizada com sucesso!', 'success');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message, 'error');
      } else {
        showToast('Falha ao atualizar tarefa', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleExcluir = async () => {
    if (!tarefaId) return;
    const confirmou = window.confirm('Tem certeza de que deseja excluir permanentemente esta tarefa?');
    if (!confirmou) return;

    try {
      setDeleting(true);
      await tarefaService.excluirTarefa(tarefaId);
      showToast('Tarefa excluída com sucesso.', 'success');
      onSuccess();
      onClose();
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

  const handleAprovarSugestao = async (sugestaoId: number) => {
    try {
      await sugestaoService.aprovarSugestao(sugestaoId);
      showToast('Sugestão aprovada!', 'success');
      setSugestoes((prev) =>
        prev.map((s) => (s.id === sugestaoId ? { ...s, status: 'Aprovada' } : s))
      );
    } catch (err: unknown) {
      if (err instanceof Error) showToast(err.message, 'error');
    }
  };

  const handleRejeitarSugestao = async (sugestaoId: number) => {
    try {
      await sugestaoService.rejeitarSugestao(sugestaoId);
      showToast('Sugestão rejeitada.', 'info');
      setSugestoes((prev) =>
        prev.map((s) => (s.id === sugestaoId ? { ...s, status: 'Rejeitada' } : s))
      );
    } catch (err: unknown) {
      if (err instanceof Error) showToast(err.message, 'error');
    }
  };

  if (!isOpen || !tarefaId) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar tarefa"
      maxWidth="680px"
      footer={
        <div className={styles.footerActions}>
          <button
            type="button"
            className={styles.deleteBtn}
            onClick={handleExcluir}
            disabled={deleting || submitting}
          >
            {deleting ? 'Excluindo...' : 'Excluir tarefa'}
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="secondary" onClick={onClose} disabled={submitting}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSalvar} loading={submitting}>
              Salvar alterações
            </Button>
          </div>
        </div>
      }
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--cortex-gray-text)' }}>
          Carregando dados da tarefa...
        </div>
      ) : (
        <form onSubmit={handleSalvar} className={styles.form}>
          <Input
            label="Título da tarefa *"
            required
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />

          <div className={styles.textareaWrapper}>
            <label className={styles.textareaLabel}>Descrição</label>
            <textarea
              className={styles.textarea}
              placeholder="Instruções ou descrição da tarefa..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>

          <div className={styles.row}>
            <Input
              label="Data de vencimento *"
              type="datetime-local"
              required
              value={dataVencimento}
              onChange={(e) => setDataVencimento(e.target.value)}
            />

            <Input
              label="Pontuação"
              type="number"
              min="0"
              value={pontuacao}
              onChange={(e) => setPontuacao(e.target.value ? Number(e.target.value) : '')}
            />
          </div>

          <div className={styles.row}>
            <Select
              label="Prioridade *"
              value={prioridade}
              onChange={(e) => setPrioridade(e.target.value as Prioridade)}
              options={[
                { value: 'Baixa', label: 'Baixa' },
                { value: 'Media', label: 'Média' },
                { value: 'Alta', label: 'Alta' },
                { value: 'Urgente', label: 'Urgente' },
              ]}
            />
          </div>

          <div className={styles.uploadWrapper}>
            <label className={styles.textareaLabel}>Adicionar novos anexos</label>
            <label className={styles.uploadButton} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <PaperclipIcon size={16} />
              <span>Selecionar arquivos</span>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </label>
            {novosAnexos.length > 0 && (
              <div className={styles.existingFiles}>
                {novosAnexos.map((f, i) => (
                  <span key={i} className={styles.fileTag} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <FileTextIcon size={14} />
                    <span>{f.name}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Seção de Sugestões de Alteração (RF004 / RN14) */}
          <div className={styles.sectionDivider} />

          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              Sugestões Recebidas dos Responsáveis ({sugestoes.length})
            </h3>
          </div>

          {sugestoes.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--cortex-gray-text)' }}>
              Nenhuma sugestão de alteração foi enviada para esta tarefa.
            </p>
          ) : (
            <div className={styles.suggestionsList}>
              {sugestoes.map((sug) => (
                <div key={sug.id} className={styles.suggestionCard}>
                  <div className={styles.suggestionHeader}>
                    <span className={styles.suggestionAuthor} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <UserIcon size={14} />
                      <span>{sug.usuario?.nome || 'Responsável'}</span>
                    </span>
                    <Badge type="status" value={sug.status} />
                  </div>

                  <p className={styles.suggestionDesc}>{sug.descricao}</p>

                  {sug.status === 'Pendente' && (
                    <div className={styles.suggestionActions}>
                      <button
                        type="button"
                        className={styles.rejectBtn}
                        onClick={() => handleRejeitarSugestao(sug.id)}
                      >
                        Recusar
                      </button>
                      <button
                        type="button"
                        className={styles.approveBtn}
                        onClick={() => handleAprovarSugestao(sug.id)}
                      >
                        Aprovar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </form>
      )}
    </Modal>
  );
};
