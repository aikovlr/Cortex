'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '@/components/common/Modal/Modal';
import { Input } from '@/components/common/Input/Input';
import { Button } from '@/components/common/Button/Button';
import { Combobox } from '@/components/common/Combobox/Combobox';
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
  const [tarefaSelecionadaId, setTarefaSelecionadaId] = useState<number | ''>('');
  const [dataFechamento, setDataFechamento] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [tarefas, setTarefas] = useState<ConsultaTarefaDTO[]>([]);
  const [loadingTarefas, setLoadingTarefas] = useState(false);

  // Calcula a data máxima permitida: 12 meses a partir de hoje (RN15)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1);
  const maxDateString = maxDate.toISOString().split('T')[0];

  // Data mínima: hoje
  const minDateString = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!isOpen) {
      setNome('');
      setDataFechamento('');
      setSelectedTaskIds(tarefaIdPredefinida ? [tarefaIdPredefinida] : []);
      setTarefaSelecionadaId('');
      return;
    }

    let isMounted = true;

    async function carregar() {
      if (tarefasDisponiveis && tarefasDisponiveis.length > 0) {
        if (isMounted) {
          const pendentes = tarefasDisponiveis.filter((t) => {
            if (t.status !== 'Pendente') return false;
            if (t.dataVencimento) {
              const dataVenc = new Date(t.dataVencimento);
              if (dataVenc < new Date()) return false;
            }
            return true;
          });
          setTarefas(pendentes);
          if (tarefaIdPredefinida && pendentes.some((t) => t.id === tarefaIdPredefinida)) {
            setSelectedTaskIds([tarefaIdPredefinida]);
          }
        }
        return;
      }

      try {
        setLoadingTarefas(true);
        // Exibir somente tarefas nas quais o usuário autenticado é responsável e com status Pendente
        const res = await tarefaService.listarTarefas({
          responsavelId: usuario?.id,
          status: 'Pendente',
        });
        if (isMounted) {
          const pendentes = res.filter((t) => {
            if (t.status !== 'Pendente') return false;
            if (t.dataVencimento) {
              const dataVenc = new Date(t.dataVencimento);
              if (dataVenc < new Date()) return false;
            }
            return true;
          });
          setTarefas(pendentes);
          if (tarefaIdPredefinida && pendentes.some((t) => t.id === tarefaIdPredefinida)) {
            setSelectedTaskIds([tarefaIdPredefinida]);
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
  }, [isOpen, tarefaIdPredefinida, tarefasDisponiveis, usuario?.id]);

  // Opções para o Combobox: tarefas pendentes que ainda não foram adicionadas
  const opcoesCombobox = useMemo(() => {
    const jaAdicionadas = new Set(selectedTaskIds);
    return tarefas
      .filter((t) => !jaAdicionadas.has(t.id))
      .map((t) => ({
        value: t.id,
        label: t.titulo,
        sublabel: t.dataVencimento
          ? `Prazo: ${new Date(t.dataVencimento).toLocaleDateString('pt-BR')}`
          : undefined,
      }));
  }, [tarefas, selectedTaskIds]);

  // Lista de tarefas adicionadas para exibição no card com botão de remoção
  const tarefasAdicionadas = useMemo(() => {
    return selectedTaskIds
      .map((id) => tarefas.find((t) => t.id === id))
      .filter((t): t is ConsultaTarefaDTO => Boolean(t));
  }, [tarefas, selectedTaskIds]);

  const handleAdicionarTarefa = () => {
    if (!tarefaSelecionadaId) return;
    const id = Number(tarefaSelecionadaId);
    if (!selectedTaskIds.includes(id)) {
      setSelectedTaskIds((prev) => [...prev, id]);
    }
    setTarefaSelecionadaId('');
  };

  const handleRemoverTarefa = (id: number) => {
    setSelectedTaskIds((prev) => prev.filter((tId) => tId !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      await metaService.criar({
        nome: nome.trim(),
        tarefaIds: selectedTaskIds,
        dataFechamento: dataFechamento ? new Date(dataFechamento).toISOString() : undefined,
      });

      showToast('Meta criada com sucesso!', 'success');
      setNome('');
      setDataFechamento('');
      setSelectedTaskIds([]);
      setTarefaSelecionadaId('');
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
              Tarefas Vinculadas ({selectedTaskIds.length} adicionada{selectedTaskIds.length !== 1 ? 's' : ''}) <span className={styles.required}>*</span>
            </label>
          </div>

          <div className={styles.addTarefaBox}>
            <div className={styles.addTarefaRow}>
              <Combobox
                value={tarefaSelecionadaId}
                onChange={(val) => setTarefaSelecionadaId(val !== '' ? Number(val) : '')}
                placeholder={
                  loadingTarefas
                    ? 'Carregando tarefas...'
                    : opcoesCombobox.length === 0
                    ? 'Nenhuma tarefa pendente disponível'
                    : 'Selecione uma tarefa pendente...'
                }
                searchPlaceholder="Buscar tarefa por título..."
                clearable
                disabled={loadingTarefas || (opcoesCombobox.length === 0 && !tarefaSelecionadaId)}
                options={opcoesCombobox}
                className={styles.comboboxWrapper}
              />

              <button
                type="button"
                className={styles.addBtn}
                disabled={!tarefaSelecionadaId}
                onClick={handleAdicionarTarefa}
              >
                + Adicionar Tarefa
              </button>
            </div>

            {tarefasAdicionadas.length > 0 ? (
              <div className={styles.selectedTasksList}>
                {tarefasAdicionadas.map((t) => (
                  <div key={t.id} className={styles.selectedTaskCard}>
                    <div className={styles.selectedTaskInfo}>
                      <span className={styles.selectedTaskTitle}>{t.titulo}</span>
                      <div className={styles.selectedTaskMeta}>
                        <span className={styles.statusBadgePendente}>Pendente</span>
                        {t.dataVencimento && (
                          <span className={styles.taskPrazo}>
                            Prazo: {new Date(t.dataVencimento).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={() => handleRemoverTarefa(t.id)}
                      title={`Remover tarefa ${t.titulo}`}
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyNotice}>
                {loadingTarefas
                  ? 'Carregando tarefas pendentes...'
                  : 'Nenhuma tarefa vinculada. Selecione uma tarefa pendente no combobox acima e clique em "+ Adicionar Tarefa".'}
              </div>
            )}
          </div>

          <span className={styles.helpText}>
            Toda meta deve obrigatoriamente estar associada a pelo menos uma tarefa pendente existente. Você pode vincular múltiplas tarefas.
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
            A data limite de conclusão não pode exceder 12 meses a partir de hoje.
          </span>
        </div>
      </form>
    </Modal>
  );
};
