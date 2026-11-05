'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal/Modal';
import { Input } from '@/components/common/Input/Input';
import { Button } from '@/components/common/Button/Button';
import { Badge } from '@/components/common/Badge/Badge';
import { metaService } from '@/services/metaService';
import { tarefaService } from '@/services/tarefaService';
import { ConsultaMetaDTO, ConsultaTarefaDTO, ConsultaMembroEquipeDTO } from '@/types/api';
import { useToast } from '@/contexts/ToastContext';
import styles from './AssignTeamGoalModal.module.css';

interface AssignTeamGoalModalProps {
  equipeId: number;
  equipeNome: string;
  membros: ConsultaMembroEquipeDTO[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AssignTeamGoalModal: React.FC<AssignTeamGoalModalProps> = ({
  equipeId,
  equipeNome,
  membros,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();

  const [mode, setMode] = useState<'link' | 'create'>('link');

  // Modo: Vincular Meta Existente
  const [metasDisponiveis, setMetasDisponiveis] = useState<ConsultaMetaDTO[]>([]);
  const [selectedMetaId, setSelectedMetaId] = useState<number | ''>('');
  const [loadingMetas, setLoadingMetas] = useState(false);

  // Modo: Criar Nova Meta de Equipe
  const [nome, setNome] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);
  const [selectedMembroId, setSelectedMembroId] = useState<number | ''>('');
  const [dataFechamento, setDataFechamento] = useState('');
  const [tarefas, setTarefas] = useState<ConsultaTarefaDTO[]>([]);
  const [loadingTarefas, setLoadingTarefas] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Data máxima para 12 meses (RN15)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1);
  const maxDateString = maxDate.toISOString().split('T')[0];
  const minDateString = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    async function carregarDados() {
      // 1. Carrega metas do usuário para verificar as que ainda não estão vinculadas à equipe
      try {
        setLoadingMetas(true);
        const todasMetas = await metaService.listar();
        if (isMounted) {
          // Filtra apenas metas que ainda não foram vinculadas a esta equipe
          const disponiveis = todasMetas.filter(
            (m) => !m.equipes?.some((eq) => eq.id === equipeId)
          );
          setMetasDisponiveis(disponiveis);
          if (disponiveis.length > 0) {
            setSelectedMetaId(disponiveis[0].id);
          } else {
            setSelectedMetaId('');
            // Se não houver metas existentes para vincular, muda para a aba de criação
            setMode('create');
          }
        }
      } catch {
        // Silencia falha
      } finally {
        if (isMounted) {
          setLoadingMetas(false);
        }
      }

      // 2. Carrega tarefas disponíveis
      try {
        setLoadingTarefas(true);
        const resTarefas = await tarefaService.listarTarefas();
        if (isMounted) {
          setTarefas(resTarefas);
          if (resTarefas.length > 0 && selectedTaskIds.length === 0) {
            setSelectedTaskIds([resTarefas[0].id]);
          }
        }
      } catch {
        // Silencia falha
      } finally {
        if (isMounted) {
          setLoadingTarefas(false);
        }
      }
    }

    carregarDados();

    return () => {
      isMounted = false;
    };
  }, [isOpen, equipeId]);

  const toggleTask = (id: number) => {
    setSelectedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((tId) => tId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedTaskIds.length === tarefas.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(tarefas.map((t) => t.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'link') {
      if (!selectedMetaId) {
        showToast('Por favor, selecione uma meta para vincular.', 'error');
        return;
      }

      try {
        setSubmitting(true);
        await metaService.atribuirEquipe(Number(selectedMetaId), equipeId);
        showToast(`Meta atribuída à equipe "${equipeNome}" com sucesso!`, 'success');
        onSuccess();
        onClose();
      } catch (err: unknown) {
        if (err instanceof Error) {
          showToast(err.message, 'error');
        } else {
          showToast('Falha ao atribuir meta à equipe.', 'error');
        }
      } finally {
        setSubmitting(false);
      }
    } else {
      // Criar nova meta diretamente para a equipe
      if (!nome.trim()) {
        showToast('Informe o nome da meta.', 'error');
        return;
      }

      if (selectedTaskIds.length === 0) {
        showToast('Selecione pelo menos uma tarefa para vincular à meta.', 'error');
        return;
      }

      if (dataFechamento) {
        const selected = new Date(dataFechamento);
        const limit = new Date();
        limit.setFullYear(limit.getFullYear() + 1);

        if (selected > limit) {
          showToast('A data limite da meta não pode exceder 12 meses.', 'error');
          return;
        }
      }

      try {
        setSubmitting(true);
        await metaService.criar({
          nome: nome.trim(),
          tarefaIds: selectedTaskIds,
          dataFechamento: dataFechamento ? new Date(dataFechamento).toISOString() : undefined,
          equipeId,
          usuarioId: selectedMembroId ? Number(selectedMembroId) : undefined,
        });

        showToast(`Nova meta criada e atribuída à equipe "${equipeNome}"!`, 'success');
        setNome('');
        setSelectedTaskIds([]);
        setDataFechamento('');
        setSelectedMembroId('');
        onSuccess();
        onClose();
      } catch (err: unknown) {
        if (err instanceof Error) {
          showToast(err.message, 'error');
        } else {
          showToast('Falha ao criar meta de equipe.', 'error');
        }
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Atribuir Meta à Equipe: ${equipeNome}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={
              submitting ||
              (mode === 'link' && !selectedMetaId) ||
              (mode === 'create' && (!nome.trim() || selectedTaskIds.length === 0))
            }
          >
            {submitting ? 'Salvando...' : mode === 'link' ? 'Atribuir à Equipe' : 'Criar e Atribuir'}
          </Button>
        </>
      }
    >
      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tabBtn} ${mode === 'link' ? styles.tabBtnActive : ''}`}
          onClick={() => setMode('link')}
        >
          Vincular Meta Existente
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${mode === 'create' ? styles.tabBtnActive : ''}`}
          onClick={() => setMode('create')}
        >
          Criar Nova Meta de Equipe
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {mode === 'link' ? (
          <>
            <div className={styles.field}>
              <label htmlFor="select-meta-link" className={styles.label}>
                Selecione a Meta <span className={styles.required}>*</span>
              </label>

              {loadingMetas ? (
                <div className={styles.emptyListNotice}>Carregando suas metas...</div>
              ) : metasDisponiveis.length === 0 ? (
                <div className={styles.emptyListNotice}>
                  Todas as suas metas já estão vinculadas a esta equipe ou você ainda não possui metas.
                  <br />
                  <button
                    type="button"
                    className={styles.toggleAllBtn}
                    onClick={() => setMode('create')}
                    style={{ marginTop: '8px' }}
                  >
                    Criar uma nova meta para esta equipe →
                  </button>
                </div>
              ) : (
                <select
                  id="select-meta-link"
                  className={styles.select}
                  value={selectedMetaId}
                  onChange={(e) => setSelectedMetaId(e.target.value ? Number(e.target.value) : '')}
                  required
                >
                  {metasDisponiveis.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nome} {m.dataFechamento ? `(Prazo: ${new Date(m.dataFechamento).toLocaleDateString('pt-BR')})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className={styles.noticeBox}>
              <p>
                Ao atribuir esta meta à equipe <strong>{equipeNome}</strong>, ela será compartilhada com todos os integrantes da equipe e passará a constar no painel de Metas de cada membro.
              </p>
            </div>
          </>
        ) : (
          <>
            <Input
              label="Nome da Meta da Equipe *"
              placeholder="Ex: Entregar sprint de integração"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              autoFocus
            />

            {/* Atribuição opcional a membro específico */}
            <div className={styles.field}>
              <label htmlFor="select-membro-resp" className={styles.label}>
                Atribuir Responsável (Opcional)
              </label>
              <select
                id="select-membro-resp"
                className={styles.select}
                value={selectedMembroId}
                onChange={(e) => setSelectedMembroId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">Toda a Equipe (Todos os Integrantes)</option>
                {membros.map((m) => (
                  <option key={m.id} value={m.usuarioId}>
                    {m.usuario?.nome || 'Membro'} ({m.cargo})
                  </option>
                ))}
              </select>
              <span className={styles.helperText}>
                A meta será atribuída a toda a equipe ou ao integrante selecionado, ficando visível no painel de Metas de todos os membros da equipe.
              </span>
            </div>

            {/* Seleção de Tarefas Vinculadas */}
            <div className={styles.field}>
              <div className={styles.tasksHeader}>
                <label className={styles.label}>
                  Tarefas Vinculadas ({selectedTaskIds.length} selecionada{selectedTaskIds.length !== 1 ? 's' : ''}) <span className={styles.required}>*</span>
                </label>
                {tarefas.length > 1 && (
                  <button
                    type="button"
                    className={styles.toggleAllBtn}
                    onClick={toggleSelectAll}
                  >
                    {selectedTaskIds.length === tarefas.length ? 'Desmarcar todas' : 'Selecionar todas'}
                  </button>
                )}
              </div>

              {loadingTarefas ? (
                <div className={styles.emptyListNotice}>Carregando tarefas...</div>
              ) : tarefas.length === 0 ? (
                <div className={styles.emptyListNotice}>
                  Nenhuma tarefa encontrada. Crie ao menos uma tarefa antes de gerar a meta.
                </div>
              ) : (
                <div className={styles.tasksList}>
                  {tarefas.map((t) => {
                    const isSelected = selectedTaskIds.includes(t.id);
                    return (
                      <div
                        key={t.id}
                        className={`${styles.taskItem} ${isSelected ? styles.taskItemActive : ''}`}
                        onClick={() => toggleTask(t.id)}
                      >
                        <input
                          type="checkbox"
                          className={styles.checkbox}
                          checked={isSelected}
                          onChange={() => {}}
                          aria-label={`Selecionar tarefa ${t.titulo}`}
                        />
                        <span className={styles.taskTitle}>{t.titulo}</span>
                        {t.status && <Badge type="status" value={t.status} />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Data Limite */}
            <Input
              type="date"
              label="Data Limite / Prazo (Opcional)"
              value={dataFechamento}
              onChange={(e) => setDataFechamento(e.target.value)}
              min={minDateString}
              max={maxDateString}
            />
          </>
        )}
      </form>
    </Modal>
  );
};
