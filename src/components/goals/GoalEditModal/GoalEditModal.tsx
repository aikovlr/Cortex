'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal/Modal';
import { Input } from '@/components/common/Input/Input';
import { Button } from '@/components/common/Button/Button';
import { metaService } from '@/services/metaService';
import { tarefaService } from '@/services/tarefaService';
import { ConsultaMetaDTO, ConsultaTarefaDTO } from '@/types/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { UsersIcon, ZapIcon } from '@/components/common/Icons/Icons';
import styles from './GoalEditModal.module.css';

interface GoalEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  meta: ConsultaMetaDTO | null;
}

export const GoalEditModal: React.FC<GoalEditModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  meta,
}) => {
  const { usuario } = useAuth();
  const { showToast } = useToast();

  const [nome, setNome] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);
  const [dataFechamento, setDataFechamento] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [tarefas, setTarefas] = useState<ConsultaTarefaDTO[]>([]);
  const [loadingTarefas, setLoadingTarefas] = useState(false);

  // Calcula a data máxima permitida: 12 meses a partir de hoje (RN15)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1);
  const maxDateString = maxDate.toISOString().split('T')[0];

  useEffect(() => {
    if (!isOpen || !meta) return;

    setNome(meta.nome || '');

    if (meta.dataFechamento) {
      const datePart = meta.dataFechamento.split('T')[0];
      setDataFechamento(datePart);
    } else {
      setDataFechamento('');
    }

    const currentTaskIds: number[] = [];
    if (meta.tarefas && meta.tarefas.length > 0) {
      meta.tarefas.forEach((t) => currentTaskIds.push(t.id));
    } else if (meta.tarefa) {
      currentTaskIds.push(meta.tarefa.id);
    } else if (meta.tarefaId) {
      currentTaskIds.push(meta.tarefaId);
    }
    setSelectedTaskIds(currentTaskIds);

    let isMounted = true;

    async function carregarTarefas() {
      try {
        setLoadingTarefas(true);
        const res = await tarefaService.listarTarefas({
          responsavelId: usuario?.id,
        });

        if (isMounted) {
          const todasTarefas = [...res];

          // Garante que todas as tarefas já vinculadas à meta apareçam na lista de opções
          const tarefasDaMeta = meta?.tarefas && meta.tarefas.length > 0
            ? meta.tarefas
            : (meta?.tarefa ? [meta.tarefa as ConsultaTarefaDTO] : []);

          for (const mt of tarefasDaMeta) {
            if (!todasTarefas.some((t) => t.id === mt.id)) {
              todasTarefas.push(mt);
            }
          }

          setTarefas(todasTarefas);
        }
      } catch {
        // Silencia falha de carregamento
      } finally {
        if (isMounted) {
          setLoadingTarefas(false);
        }
      }
    }

    carregarTarefas();

    return () => {
      isMounted = false;
    };
  }, [isOpen, meta, usuario?.id]);

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

    if (!meta) return;

    if (!nome.trim()) {
      showToast('Por favor, informe o nome da meta.', 'error');
      return;
    }

    // RN07: Seleção de Tarefa vinculada obrigatória (uma ou mais)
    if (selectedTaskIds.length === 0) {
      showToast('A meta deve estar vinculada a pelo menos uma tarefa válida.', 'error');
      return;
    }

    // RN15: Validação da data limite de até 12 meses
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
      await metaService.atualizar(meta.id, {
        nome: nome.trim(),
        tarefaIds: selectedTaskIds,
        dataFechamento: dataFechamento ? new Date(dataFechamento).toISOString() : null,
        limparDataFechamento: !dataFechamento,
      });

      showToast('Meta atualizada com sucesso!', 'success');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message, 'error');
      } else {
        showToast('Falha ao atualizar meta.', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Meta"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={submitting || !nome.trim() || selectedTaskIds.length === 0}
          >
            {submitting ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          label="Nome da Meta *"
          placeholder="Ex: Entregar módulo de pagamentos"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
          autoFocus
        />

        {meta?.equipes && meta.equipes.length > 0 && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              backgroundColor: 'rgba(123, 79, 201, 0.12)',
              border: '1px solid rgba(123, 79, 201, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
              color: 'var(--cortex-white)',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <UsersIcon size={14} color="#c4b5fd" />
              <span>Equipe: <strong>{meta.equipes.map((e) => e.nome).join(', ')}</strong></span>
            </span>
            <span
              style={{
                fontWeight: 700,
                color: '#c4b5fd',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <ZapIcon size={14} color="#c4b5fd" />
              <span>+{selectedTaskIds.length * 5} XP</span>
              <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--cortex-gray-text)' }}>
                (5 XP por tarefa vinculada)
              </span>
            </span>
          </div>
        )}

        <div className={styles.field}>
          <div className={styles.selectionHeader}>
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

          <div className={styles.taskListContainer}>
            {loadingTarefas ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--cortex-gray-text)', fontSize: '13px' }}>
                Carregando tarefas disponíveis...
              </div>
            ) : tarefas.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--cortex-gray-text)', fontSize: '13px' }}>
                Nenhuma tarefa disponível para vinculação.
              </div>
            ) : (
              tarefas.map((t) => {
                const isSelected = selectedTaskIds.includes(t.id);
                return (
                  <div
                    key={t.id}
                    className={`${styles.taskItem} ${isSelected ? styles.taskItemSelected : ''}`}
                    onClick={() => toggleTask(t.id)}
                  >
                    <input
                      type="checkbox"
                      className={styles.taskCheckbox}
                      checked={isSelected}
                      onChange={() => {}}
                      aria-label={`Selecionar tarefa ${t.titulo}`}
                    />
                    <div className={styles.taskInfo}>
                      <span className={styles.taskTitle}>{t.titulo}</span>
                      <span className={styles.taskBadge}>{t.status}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <span className={styles.helpText}>
            Toda meta deve obrigatoriamente estar associada a pelo menos uma tarefa existente. Você pode selecionar múltiplas tarefas.
          </span>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Data Limite / Vencimento (opcional)</label>
          <input
            type="date"
            className={styles.dateInput}
            value={dataFechamento}
            max={maxDateString}
            onChange={(e) => setDataFechamento(e.target.value)}
            disabled={submitting}
          />
          <span className={styles.helpText}>
            A data limite de conclusão não pode exceder 12 meses a partir de hoje. Deixe em branco se não desejar prazo.
          </span>
        </div>
      </form>
    </Modal>
  );
};

