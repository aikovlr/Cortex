'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Modal } from '@/components/common/Modal/Modal';
import { Input } from '@/components/common/Input/Input';
import { Select } from '@/components/common/Select/Select';
import { Combobox } from '@/components/common/Combobox/Combobox';
import { Button } from '@/components/common/Button/Button';
import { Prioridade, ConsultaUsuarioDTO, ConsultaEquipeDTO } from '@/types/api';
import { tarefaService } from '@/services/tarefaService';
import { usuarioService } from '@/services/usuarioService';
import { equipeService } from '@/services/equipeService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { notificarNovoResponsavelTarefa } from '@/contexts/NotificationContext';
import { PaperclipIcon, XIcon } from '@/components/common/Icons/Icons';
import styles from './TaskCreateModal.module.css';

interface TaskCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialEquipeId?: number;
}

const getNowLocalDateTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const isPastDateTime = (dateTimeStr: string) => {
  if (!dateTimeStr) return false;
  const selectedDate = new Date(dateTimeStr);
  const now = new Date();
  const currentMinute = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours(),
    now.getMinutes(),
    0,
    0
  );
  return selectedDate < currentMinute;
};

export const TaskCreateModal: React.FC<TaskCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialEquipeId,
}) => {
  const { showToast } = useToast();
  const { usuario } = useAuth();

  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [dataErro, setDataErro] = useState('');
  const [responsavelErro, setResponsavelErro] = useState('');
  const [equipeErro, setEquipeErro] = useState('');
  const [pontuacao, setPontuacao] = useState<number | ''>('');
  const [prioridade, setPrioridade] = useState<Prioridade>('Media');
  const [tipoAtribuicao, setTipoAtribuicao] = useState<'individual' | 'equipe'>('individual');
  const [responsavelId, setResponsavelId] = useState<number | ''>('');
  const [equipeId, setEquipeId] = useState<number | ''>('');
  const [anexos, setAnexos] = useState<File[]>([]);

  const [usuarios, setUsuarios] = useState<ConsultaUsuarioDTO[]>([]);
  const [equipes, setEquipes] = useState<ConsultaEquipeDTO[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const equipesGerenciaveis = useMemo(() => {
    if (!usuario) return [];
    return equipes.filter((eq) =>
      eq.membros?.some(
        (m) => m.usuarioId === usuario.id && (m.cargo === 'Dono' || m.cargo === 'Admin')
      )
    );
  }, [equipes, usuario]);

  useEffect(() => {
    if (isOpen) {
      usuarioService.listarUsuarios().then(setUsuarios).catch(() => {});
      equipeService.listarMinhasEquipes().then(setEquipes).catch(() => {});
      if (initialEquipeId) {
        setTipoAtribuicao('equipe');
        setEquipeId(initialEquipeId);
      }
    }
  }, [isOpen, initialEquipeId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setAnexos((prev) => [...prev, ...filesArray]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setAnexos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDataVencimentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDataVencimento(value);

    if (value && isPastDateTime(value)) {
      setDataErro('A data de entrega não pode ser anterior à data e hora atual.');
    } else {
      setDataErro('');
    }
  };

  const handleTipoAtribuicaoChange = (tipo: 'individual' | 'equipe') => {
    setTipoAtribuicao(tipo);
    setResponsavelErro('');
    setEquipeErro('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;

    if (!titulo.trim() || !dataVencimento) {
      showToast('Preencha os campos obrigatórios (*)', 'error');
      hasError = true;
    }

    if (isPastDateTime(dataVencimento)) {
      setDataErro('A data de entrega não pode ser anterior à data e hora atual.');
      showToast('A data de entrega não pode ser anterior à data e hora atual.', 'error');
      hasError = true;
    }

    if (tipoAtribuicao === 'individual' && !responsavelId) {
      setResponsavelErro('Selecione um responsável para a tarefa.');
      showToast('Selecione um responsável para a tarefa.', 'error');
      hasError = true;
    }

    if (tipoAtribuicao === 'equipe' && !equipeId) {
      setEquipeErro('Selecione uma equipe para a tarefa.');
      showToast('Selecione uma equipe para a tarefa.', 'error');
      hasError = true;
    }

    if (hasError) return;

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append('Titulo', titulo.trim());
      if (descricao) formData.append('Descricao', descricao);
      formData.append('DataVencimento', new Date(dataVencimento).toISOString());
      if (pontuacao !== '') formData.append('Pontuacao', pontuacao.toString());
      formData.append('Status', 'Pendente');
      formData.append('Prioridade', prioridade);

      anexos.forEach((file) => {
        formData.append('Anexos', file);
      });

      const novaTarefa = await tarefaService.criarTarefa(formData);

      // Atribuição individual ou de equipe com proteção contra tarefa órfã
      try {
        if (tipoAtribuicao === 'individual' && responsavelId !== '') {
          await tarefaService.atribuirResponsavel(novaTarefa.id, Number(responsavelId));
          notificarNovoResponsavelTarefa(Number(responsavelId), novaTarefa.id, titulo.trim(), prioridade);
        } else if (tipoAtribuicao === 'equipe' && equipeId !== '') {
          const membrosAtribuidos = await tarefaService.atribuirEquipe(novaTarefa.id, Number(equipeId));
          if (!membrosAtribuidos || membrosAtribuidos.length === 0) {
            throw new Error('A equipe selecionada não possui membros elegíveis para atribuição.');
          }
          membrosAtribuidos.forEach((m) => {
            if (m.usuarioId) {
              notificarNovoResponsavelTarefa(m.usuarioId, novaTarefa.id, titulo.trim(), prioridade);
            }
          });
        }
      } catch (assignError) {
        // Rollback da tarefa caso a atribuição falhe, garantindo que não fique sem responsável
        try {
          await tarefaService.excluirTarefa(novaTarefa.id);
        } catch {
          // ignora falha de exclusão
        }
        throw assignError;
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('cortex_tarefas_alteradas'));
      }

      showToast('Tarefa criada com sucesso!', 'success');
      onSuccess();
      onClose();

      // Reset
      setTitulo('');
      setDescricao('');
      setDataVencimento('');
      setDataErro('');
      setResponsavelErro('');
      setEquipeErro('');
      setPontuacao('');
      setPrioridade('Media');
      setAnexos([]);
      setResponsavelId('');
      if (initialEquipeId) {
        setTipoAtribuicao('equipe');
        setEquipeId(initialEquipeId);
      } else {
        setTipoAtribuicao('individual');
        setEquipeId('');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message, 'error');
      } else {
        showToast('Falha ao criar tarefa', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleModalClose = useCallback(() => {
    setDataErro('');
    setResponsavelErro('');
    setEquipeErro('');
    if (initialEquipeId) {
      setTipoAtribuicao('equipe');
      setEquipeId(initialEquipeId);
    }
    onClose();
  }, [initialEquipeId, onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title="Criar nova tarefa"
      footer={
        <>
          <Button variant="secondary" onClick={handleModalClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting}>
            Salvar
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          label="Nome da tarefa *"
          required
          autoFocus
          placeholder="Ex: Desenvolver fluxo de login"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />

        <div className={styles.textareaWrapper}>
          <label className={styles.textareaLabel}>Descrição</label>
          <textarea
            className={styles.textarea}
            placeholder="Instruções ou detalhes da tarefa..."
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        </div>

        <div className={styles.row}>
          <Input
            label="Data de entrega *"
            type="datetime-local"
            required
            min={getNowLocalDateTime()}
            value={dataVencimento}
            error={dataErro}
            onChange={handleDataVencimentoChange}
          />

          <Input
            label="Pontuação"
            type="number"
            min="0"
            placeholder="Ex: 10"
            value={pontuacao}
            onChange={(e) => setPontuacao(e.target.value ? Number(e.target.value) : '')}
          />
        </div>

        <div className={styles.row}>
          <div className={styles.radioGroup}>
            <label className={styles.radioLabel}>Atribuir tarefa a *</label>
            <div className={styles.radioOptions}>
              <label className={styles.radioItem}>
                <input
                  type="radio"
                  name="tipoAtribuicao"
                  value="individual"
                  checked={tipoAtribuicao === 'individual'}
                  onChange={() => handleTipoAtribuicaoChange('individual')}
                />
                Individual
              </label>
              <label className={styles.radioItem}>
                <input
                  type="radio"
                  name="tipoAtribuicao"
                  value="equipe"
                  checked={tipoAtribuicao === 'equipe'}
                  onChange={() => handleTipoAtribuicaoChange('equipe')}
                />
                Equipe
              </label>
            </div>
          </div>

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

        {tipoAtribuicao === 'individual' ? (
          <Combobox
            label="Selecionar responsável *"
            required
            value={responsavelId}
            error={responsavelErro}
            placeholder="Selecione um responsável..."
            searchPlaceholder="Buscar por nome ou email..."
            clearable
            onChange={(val) => {
              const numericVal = val !== '' ? Number(val) : '';
              setResponsavelId(numericVal);
              if (numericVal) setResponsavelErro('');
            }}
            options={usuarios.map((u) => ({
              value: u.id,
              label: u.nome,
              sublabel: u.email,
            }))}
          />
        ) : (
          <Combobox
            label="Selecionar equipe *"
            required
            value={equipeId}
            error={equipeErro}
            placeholder="Selecione uma equipe..."
            searchPlaceholder="Buscar equipe..."
            clearable
            onChange={(val) => {
              const numericVal = val !== '' ? Number(val) : '';
              setEquipeId(numericVal);
              if (numericVal) setEquipeErro('');
            }}
            options={equipesGerenciaveis.map((eq) => ({
              value: eq.id,
              label: eq.nome,
            }))}
          />
        )}

        <div className={styles.uploadWrapper}>
          <label className={styles.textareaLabel}>Anexar arquivos</label>
          <label className={styles.uploadButton} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <PaperclipIcon size={16} />
            <span>Escolher arquivos para anexar</span>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </label>

          {anexos.length > 0 && (
            <div className={styles.fileList}>
              {anexos.map((file, idx) => (
                <div key={idx} className={styles.fileTag}>
                  <span>{file.name}</span>
                  <button
                    type="button"
                    className={styles.removeFileBtn}
                    onClick={() => handleRemoveFile(idx)}
                    aria-label="Remover anexo"
                  >
                    <XIcon size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
};
