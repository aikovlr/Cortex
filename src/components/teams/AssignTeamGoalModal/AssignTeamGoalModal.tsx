'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '@/components/common/Modal/Modal';
import { Input } from '@/components/common/Input/Input';
import { Button } from '@/components/common/Button/Button';
import { metaService } from '@/services/metaService';
import { tarefaService } from '@/services/tarefaService';
import { equipeService } from '@/services/equipeService';
import {
  ConsultaTarefaDTO,
  ConsultaMembroEquipeDTO,
  ConsultaEquipeDTO,
} from '@/types/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import styles from './AssignTeamGoalModal.module.css';

interface AssignTeamGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  equipeId?: number;
  equipeNome?: string;
  membros?: ConsultaMembroEquipeDTO[];
}

export const AssignTeamGoalModal: React.FC<AssignTeamGoalModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  equipeId,
  equipeNome,
  membros,
}) => {
  const { usuario } = useAuth();
  const { showToast } = useToast();

  const [equipes, setEquipes] = useState<ConsultaEquipeDTO[]>([]);
  const [loadingEquipes, setLoadingEquipes] = useState(false);
  const [selectedEquipeId, setSelectedEquipeId] = useState<number | ''>(equipeId || '');

  const [membrosEquipe, setMembrosEquipe] = useState<ConsultaMembroEquipeDTO[]>(membros || []);
  const [loadingMembros, setLoadingMembros] = useState(false);

  const [nome, setNome] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);
  const [atribuicaoModo, setAtribuicaoModo] = useState<'equipe' | 'membros'>('equipe');
  const [selectedMembroIds, setSelectedMembroIds] = useState<number[]>([]);
  const [dataFechamento, setDataFechamento] = useState('');
  const [tarefas, setTarefas] = useState<ConsultaTarefaDTO[]>([]);
  const [loadingTarefas, setLoadingTarefas] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // O XP de meta de equipe deve iniciar em 0 e a cada tarefa vinculada, a recompensa deve ser aumentada em 5
  const xpRecompensa = selectedTaskIds.length * 5;

  // Data máxima para 12 meses (RN15)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1);
  const maxDateString = maxDate.toISOString().split('T')[0];
  const minDateString = new Date().toISOString().split('T')[0];

  // Filtra equipes onde o usuário tem cargo igual ou superior a Admin (Dono ou Admin)
  const equipesGerenciaveis = useMemo(() => {
    if (!usuario) return [];
    return equipes.filter((eq) =>
      eq.membros?.some(
        (m) => m.usuarioId === usuario.id && (m.cargo === 'Dono' || m.cargo === 'Admin')
      )
    );
  }, [equipes, usuario]);

  // Carregar equipes caso equipeId não seja informado via props
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    if (equipeId) {
      setSelectedEquipeId(equipeId);
      if (membros && membros.length > 0) {
        setMembrosEquipe(membros);
      }
    } else {
      setLoadingEquipes(true);
      equipeService
        .listarMinhasEquipes()
        .then((eqs) => {
          if (!isMounted) return;
          setEquipes(eqs);
          const gerenciaveis = eqs.filter((eq) =>
            eq.membros?.some(
              (m) => m.usuarioId === usuario?.id && (m.cargo === 'Dono' || m.cargo === 'Admin')
            )
          );
          if (gerenciaveis.length > 0) {
            setSelectedEquipeId(gerenciaveis[0].id);
          } else {
            setSelectedEquipeId('');
          }
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted) setLoadingEquipes(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, equipeId, membros, usuario?.id]);

  // Carregar membros da equipe selecionada quando selectedEquipeId mudar
  useEffect(() => {
    if (!isOpen || !selectedEquipeId) return;

    if (equipeId && selectedEquipeId === equipeId && membros && membros.length > 0) {
      setMembrosEquipe(membros);
      return;
    }

    let isMounted = true;
    setLoadingMembros(true);
    equipeService
      .listarMembros(Number(selectedEquipeId))
      .then((mems) => {
        if (isMounted) setMembrosEquipe(mems);
      })
      .catch(() => {
        if (isMounted) setMembrosEquipe([]);
      })
      .finally(() => {
        if (isMounted) setLoadingMembros(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedEquipeId, equipeId, membros]);

  // Carregar tarefas disponíveis
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoadingTarefas(true);

    tarefaService
      .listarTarefas()
      .then((res) => {
        if (isMounted) {
          setTarefas(res);
          if (res.length > 0 && selectedTaskIds.length === 0) {
            setSelectedTaskIds([res[0].id]);
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoadingTarefas(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const toggleTask = (id: number) => {
    setSelectedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((tId) => tId !== id) : [...prev, id]
    );
  };

  const toggleSelectAllTasks = () => {
    if (selectedTaskIds.length === tarefas.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(tarefas.map((t) => t.id));
    }
  };

  const toggleMember = (usuarioId: number) => {
    setSelectedMembroIds((prev) =>
      prev.includes(usuarioId)
        ? prev.filter((id) => id !== usuarioId)
        : [...prev, usuarioId]
    );
  };

  const toggleSelectAllMembers = () => {
    if (selectedMembroIds.length === membrosEquipe.length) {
      setSelectedMembroIds([]);
    } else {
      setSelectedMembroIds(membrosEquipe.map((m) => m.usuarioId));
    }
  };

  const currentEquipeNome = useMemo(() => {
    if (equipeNome) return equipeNome;
    const encontrada = equipes.find((e) => e.id === selectedEquipeId);
    return encontrada?.nome || '';
  }, [equipeNome, equipes, selectedEquipeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const targetEquipeId = selectedEquipeId || equipeId;
    if (!targetEquipeId) {
      showToast('Por favor, selecione uma equipe de destino.', 'error');
      return;
    }

    if (!nome.trim()) {
      showToast('Informe o nome da meta.', 'error');
      return;
    }

    if (selectedTaskIds.length === 0) {
      showToast('Selecione pelo menos uma tarefa para vincular à meta.', 'error');
      return;
    }

    if (atribuicaoModo === 'membros' && selectedMembroIds.length === 0) {
      showToast('Selecione pelo menos um membro responsável ou opte por atribuir a toda a equipe.', 'error');
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

      if (atribuicaoModo === 'equipe' || selectedMembroIds.length === 0) {
        await metaService.criar({
          nome: nome.trim(),
          tarefaIds: selectedTaskIds,
          dataFechamento: dataFechamento ? new Date(dataFechamento).toISOString() : undefined,
          equipeId: Number(targetEquipeId),
          xpRecompensa: Number(xpRecompensa) || 0,
        });
      } else {
        // Atribui individualmente aos membros selecionados vinculando à equipe
        await Promise.all(
          selectedMembroIds.map((uId) =>
            metaService.criar({
              nome: nome.trim(),
              tarefaIds: selectedTaskIds,
              dataFechamento: dataFechamento ? new Date(dataFechamento).toISOString() : undefined,
              equipeId: Number(targetEquipeId),
              usuarioId: uId,
              xpRecompensa: Number(xpRecompensa) || 0,
            })
          )
        );
      }

      showToast(
        currentEquipeNome
          ? `Meta criada e atribuída com sucesso na equipe "${currentEquipeNome}" (+${xpRecompensa} XP de recompensa)!`
          : `Meta de equipe criada e atribuída com sucesso (+${xpRecompensa} XP de recompensa)!`,
        'success'
      );

      setNome('');
      setSelectedTaskIds([]);
      setDataFechamento('');
      setSelectedMembroIds([]);
      setAtribuicaoModo('equipe');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message, 'error');
      } else {
        showToast('Falha ao criar e atribuir meta à equipe.', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={currentEquipeNome ? `Atribuir Meta à Equipe: ${currentEquipeNome}` : 'Atribuir Meta à Equipe'}
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
              !selectedEquipeId ||
              !nome.trim() ||
              selectedTaskIds.length === 0 ||
              (atribuicaoModo === 'membros' && selectedMembroIds.length === 0) ||
              (!equipeId && equipesGerenciaveis.length === 0)
            }
          >
            {submitting ? 'Salvando...' : 'Criar e Atribuir à Equipe'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Seletor de Equipe caso aberta fora do contexto de uma equipe específica */}
        {!equipeId && (
          <div className={styles.field}>
            <label htmlFor="select-equipe-destino" className={styles.label}>
              Equipe de Destino <span className={styles.required}>*</span>
            </label>
            {loadingEquipes ? (
              <div className={styles.emptyListNotice}>Carregando suas equipes...</div>
            ) : equipesGerenciaveis.length === 0 ? (
              <div className={styles.emptyListNotice}>
                Você não possui cargo de Administrador ou Dono em nenhuma equipe para atribuir metas.
              </div>
            ) : (
              <select
                id="select-equipe-destino"
                className={styles.select}
                value={selectedEquipeId}
                onChange={(e) => setSelectedEquipeId(e.target.value ? Number(e.target.value) : '')}
                required
              >
                {equipesGerenciaveis.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.nome}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Nome da Meta */}
        <Input
          label="Nome da Meta da Equipe *"
          placeholder="Ex: Entregar sprint de integração"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
          autoFocus
        />

        {/* Atribuição de Responsabilidade: Toda a Equipe ou Membros Específicos */}
        <div className={styles.field}>
          <label className={styles.label}>Atribuir a</label>
          <div className={styles.radioGroup}>
            <label className={styles.radioOption}>
              <input
                type="radio"
                name="atribuicaoModo"
                value="equipe"
                className={styles.radioInput}
                checked={atribuicaoModo === 'equipe'}
                onChange={() => {
                  setAtribuicaoModo('equipe');
                  setSelectedMembroIds([]);
                }}
              />
              <span>Toda a equipe ({membrosEquipe.length} integrantes)</span>
            </label>
            <label className={styles.radioOption}>
              <input
                type="radio"
                name="atribuicaoModo"
                value="membros"
                className={styles.radioInput}
                checked={atribuicaoModo === 'membros'}
                onChange={() => setAtribuicaoModo('membros')}
              />
              <span>Membros específicos</span>
            </label>
          </div>

          {atribuicaoModo === 'membros' && (
            <div style={{ marginTop: '8px' }}>
              <div className={styles.selectionHeader}>
                <span className={styles.helpText}>
                  Selecione um ou mais integrantes ({selectedMembroIds.length} selecionado{selectedMembroIds.length !== 1 ? 's' : ''}):
                </span>
                {membrosEquipe.length > 1 && (
                  <button
                    type="button"
                    className={styles.toggleAllBtn}
                    onClick={toggleSelectAllMembers}
                  >
                    {selectedMembroIds.length === membrosEquipe.length ? 'Desmarcar todos' : 'Selecionar todos'}
                  </button>
                )}
              </div>

              {loadingMembros ? (
                <div className={styles.emptyListNotice}>Carregando membros da equipe...</div>
              ) : membrosEquipe.length === 0 ? (
                <div className={styles.emptyListNotice}>Nenhum membro encontrado na equipe.</div>
              ) : (
                <div className={styles.listContainer}>
                  {membrosEquipe.map((m) => {
                    const isSelected = selectedMembroIds.includes(m.usuarioId);
                    return (
                      <div
                        key={m.id}
                        className={`${styles.listItem} ${isSelected ? styles.listItemSelected : ''}`}
                        onClick={() => toggleMember(m.usuarioId)}
                      >
                        <input
                          type="checkbox"
                          className={styles.checkbox}
                          checked={isSelected}
                          onChange={() => {}}
                          aria-label={`Selecionar ${m.usuario?.nome || 'Membro'}`}
                        />
                        <div className={styles.itemInfo}>
                          <span className={styles.itemTitle}>{m.usuario?.nome || 'Membro'}</span>
                          <span className={styles.itemBadge}>{m.cargo}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          <span className={styles.helpText}>
            {atribuicaoModo === 'equipe'
              ? 'A meta será compartilhada coletivamente com todos os integrantes da equipe.'
              : 'A meta será criada e vinculada a cada integrante selecionado dentro do contexto da equipe.'}
          </span>
        </div>

        {/* Seleção de Tarefas Vinculadas */}
        <div className={styles.field}>
          <div className={styles.selectionHeader}>
            <label className={styles.label}>
              Tarefas Vinculadas ({selectedTaskIds.length} selecionada{selectedTaskIds.length !== 1 ? 's' : ''}) <span className={styles.required}>*</span>
            </label>
            {tarefas.length > 1 && (
              <button
                type="button"
                className={styles.toggleAllBtn}
                onClick={toggleSelectAllTasks}
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
            <div className={styles.listContainer}>
              {tarefas.map((t) => {
                const isSelected = selectedTaskIds.includes(t.id);
                return (
                  <div
                    key={t.id}
                    className={`${styles.listItem} ${isSelected ? styles.listItemSelected : ''}`}
                    onClick={() => toggleTask(t.id)}
                  >
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={isSelected}
                      onChange={() => {}}
                      aria-label={`Selecionar tarefa ${t.titulo}`}
                    />
                    <div className={styles.itemInfo}>
                      <span className={styles.itemTitle}>{t.titulo}</span>
                      {t.status && <span className={styles.itemBadge}>{t.status}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Data Limite */}
        <div className={styles.field}>
          <label className={styles.label}>Data Limite / Prazo (Opcional)</label>
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

        {/* Recompensa de Gamificação (XP) */}
        <div className={styles.field}>
          <label className={styles.label}>
            Recompensa de Experiência (XP da Meta)
          </label>
          <div className={styles.xpCalculadoBadge}>
            <span>+{selectedTaskIds.length * 5} XP</span>
          </div>
          <span className={styles.helpText}>
            O XP de meta de equipe inicia em 0 e cada tarefa vinculada adiciona +5 XP à recompensa ({selectedTaskIds.length} tarefa{selectedTaskIds.length === 1 ? '' : 's'} vinculada{selectedTaskIds.length === 1 ? '' : 's'} = +{selectedTaskIds.length * 5} XP ao concluir).
          </span>
        </div>
      </form>
    </Modal>
  );
};
