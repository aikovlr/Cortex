'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal/Modal';
import { Input } from '@/components/common/Input/Input';
import { Button } from '@/components/common/Button/Button';
import { metaService } from '@/services/metaService';
import { tarefaService } from '@/services/tarefaService';
import { ConsultaTarefaDTO } from '@/types/api';
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
  const { showToast } = useToast();

  const [nome, setNome] = useState('');
  const [tarefaId, setTarefaId] = useState<number | ''>(tarefaIdPredefinida || '');
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
        const res = await tarefaService.listarTarefas();
        if (isMounted) {
          setTarefas(res);
          if (!tarefaIdPredefinida && res.length > 0) {
            setTarefaId(res[0].id);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim()) {
      showToast('Por favor, informe o nome da meta.', 'error');
      return;
    }

    // RN07: Seleção de Tarefa vinculada obrigatória
    if (!tarefaId) {
      showToast('A meta deve estar vinculada a uma tarefa válida (RN07).', 'error');
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
        tarefaId: Number(tarefaId),
        dataFechamento: dataFechamento ? new Date(dataFechamento).toISOString() : undefined,
      });

      showToast('Meta criada com sucesso!', 'success');
      setNome('');
      setDataFechamento('');
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
            disabled={submitting || !nome.trim() || !tarefaId}
          >
            {submitting ? 'Salvando...' : 'Criar Meta'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          label="Nome da Meta"
          placeholder="Ex: Entregar módulo de pagamentos"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />

        <div className={styles.field}>
          <label className={styles.label}>
            Tarefa Vinculada <span className={styles.required}>*</span>
          </label>
          <select
            className={styles.select}
            value={tarefaId}
            onChange={(e) => setTarefaId(Number(e.target.value))}
            disabled={loadingTarefas || submitting || !!tarefaIdPredefinida}
            required
          >
            {tarefas.length === 0 ? (
              <option value="">
                {loadingTarefas ? 'Carregando tarefas...' : 'Nenhuma tarefa disponível'}
              </option>
            ) : (
              tarefas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.titulo} ({t.status})
                </option>
              ))
            )}
          </select>
          <span className={styles.helpText}>
            Regra RN07: Toda meta deve obrigatoriamente estar associada a uma tarefa existente.
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
