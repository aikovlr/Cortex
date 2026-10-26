'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal/Modal';
import { Input } from '@/components/common/Input/Input';
import { Button } from '@/components/common/Button/Button';
import { metaService } from '@/services/metaService';
import { tarefaService } from '@/services/tarefaService';
import { ConsultaTarefaDTO } from '@/types/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import styles from './GoalCreateModal.module.css';

interface GoalCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tarefaIdPredefinida?: number;
  tarefasDisponiveis?: ConsultaTarefaDTO[];
}

export const GoalCreateModal: React.FC<GoalCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  tarefaIdPredefinida,
  tarefasDisponiveis,
}) => {
  const { usuario } = useAuth();
  const { showToast } = useToast();

  const [nome, setNome] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>(
    tarefaIdPredefinida ? [tarefaIdPredefinida] : []
  );
  const [dataFechamento, setDataFechamento] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [tarefas, setTarefas] = useState<ConsultaTarefaDTO[]>(tarefasDisponiveis || []);
  const [loadingTarefas, setLoadingTarefas] = useState(false);

  // Calcula a data máxima permitida: 12 meses a partir de hoje (RN15)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1);
  const maxDateString = maxDate.toISOString().split('T')[0];

  // Data mínima: hoje
  const minDateString = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    async function carregar() {
      if (tarefasDisponiveis && tarefasDisponiveis.length > 0) {
        if (isMounted) {
          setTarefas(tarefasDisponiveis);
        }
        return;
      }

      try {
        setLoadingTarefas(true);
        // Exibir somente as tarefas nas quais o usuário autenticado é responsável
        const res = await tarefaService.listarTarefas({
          responsavelId: usuario?.id,
        });
        if (isMounted) {
          setTarefas(res);
          if (tarefaIdPredefinida) {
            setSelectedTaskIds([tarefaIdPredefinida]);
          } else if (res.length > 0 && selectedTaskIds.length === 0) {
            setSelectedTaskIds([res[0].id]);
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

    carregar();

    return () => {
      isMounted = false;
    };
  }, [isOpen, tarefaIdPredefinida, tarefasDisponiveis]);

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

    if (!nome.trim()) {
      showToast('Por favor, informe o nome da meta.', 'error');
      return;
    }

    // RN07: Seleção de Tarefa vinculada obrigatória (uma ou mais)
    if (selectedTaskIds.length === 0) {
      showToast('A meta deve estar vinculada a pelo menos uma tarefa válida (RN07).', 'error');
      return;
    }

    // RN15: Validação da data limite de até 12 meses
    if (dataFechamento) {
      const selected = new Date(dataFechamento);
      const limit = new Date();
      limit.setFullYear(limit.getFullYear() + 1);

      if (selected > limit) {
        showToast('A data limite da meta não pode exceder 12 meses (RN15).', 'error');
        return;
      }
    }

    try {
      setSubmitting(true);
      await metaService.criar({
        nome: nome.trim(),
        tarefaIds: selectedTaskIds,
        dataFechamento: dataFechamento ? new Date(dataFechamento).toISOString() : undefined,
      });

      showToast('Meta criada com sucesso!', 'success');
      setNome('');
      setDataFechamento('');
      setSelectedTaskIds([]);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message, 'error');
      } else {
        showToast('Falha ao criar meta.', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Criar Nova Meta"
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
            {submitting ? 'Salvando...' : 'Criar Meta'}
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
                      onChange={() => {}} // tratado no onClick do container
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
            Regra RN07: Toda meta deve obrigatoriamente estar associada a pelo menos uma tarefa existente. Você pode selecionar múltiplas tarefas.
          </span>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Data Limite (opcional)</label>
          <input
            type="date"
            className={styles.dateInput}
            value={dataFechamento}
            min={minDateString}
            max={maxDateString}
            onChange={(e) => setDataFechamento(e.target.value)}
            disabled={submitting}
          />
          <span className={styles.helpText}>
            Regra RN15: A data limite de conclusão não pode exceder 12 meses a partir de hoje.
          </span>
        </div>
      </form>
    </Modal>
  );
};
