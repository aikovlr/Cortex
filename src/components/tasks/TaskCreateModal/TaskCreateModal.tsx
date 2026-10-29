'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal/Modal';
import { Input } from '@/components/common/Input/Input';
import { Select } from '@/components/common/Select/Select';
import { Button } from '@/components/common/Button/Button';
import { Prioridade, ConsultaUsuarioDTO, ConsultaEquipeDTO } from '@/types/api';
import { tarefaService } from '@/services/tarefaService';
import { usuarioService } from '@/services/usuarioService';
import { equipeService } from '@/services/equipeService';
import { useToast } from '@/contexts/ToastContext';
import { PaperclipIcon, XIcon } from '@/components/common/Icons/Icons';
import styles from './TaskCreateModal.module.css';

interface TaskCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
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
}) => {
  const { showToast } = useToast();

  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [dataErro, setDataErro] = useState('');
  const [pontuacao, setPontuacao] = useState<number | ''>('');
  const [prioridade, setPrioridade] = useState<Prioridade>('Media');
  const [tipoAtribuicao, setTipoAtribuicao] = useState<'individual' | 'equipe'>('individual');
  const [responsavelId, setResponsavelId] = useState<number | ''>('');
  const [equipeId, setEquipeId] = useState<number | ''>('');
  const [anexos, setAnexos] = useState<File[]>([]);

  const [usuarios, setUsuarios] = useState<ConsultaUsuarioDTO[]>([]);
  const [equipes, setEquipes] = useState<ConsultaEquipeDTO[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      usuarioService.listarUsuarios().then(setUsuarios).catch(() => {});
      equipeService.listarMinhasEquipes().then(setEquipes).catch(() => {});
    }
  }, [isOpen]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo || !dataVencimento) {
      showToast('Preencha os campos obrigatórios (*)', 'error');
      return;
    }

    if (isPastDateTime(dataVencimento)) {
      setDataErro('A data de entrega não pode ser anterior à data e hora atual.');
      showToast('A data de entrega não pode ser anterior à data e hora atual.', 'error');
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append('Titulo', titulo);
      if (descricao) formData.append('Descricao', descricao);
      formData.append('DataVencimento', new Date(dataVencimento).toISOString());
      if (pontuacao !== '') formData.append('Pontuacao', pontuacao.toString());
      formData.append('Status', 'Pendente');
      formData.append('Prioridade', prioridade);

      anexos.forEach((file) => {
        formData.append('Anexos', file);
      });

      const novaTarefa = await tarefaService.criarTarefa(formData);

      // Atribuição individual ou de equipe
      if (tipoAtribuicao === 'individual' && responsavelId !== '') {
        await tarefaService.atribuirResponsavel(novaTarefa.id, Number(responsavelId));
      } else if (tipoAtribuicao === 'equipe' && equipeId !== '') {
        await tarefaService.atribuirEquipe(novaTarefa.id, Number(equipeId));
      }

      showToast('Tarefa criada com sucesso!', 'success');
      onSuccess();
      onClose();

      // Reset
      setTitulo('');
      setDescricao('');
      setDataVencimento('');
      setDataErro('');
      setPontuacao('');
      setPrioridade('Media');
      setAnexos([]);
      setResponsavelId('');
      setEquipeId('');
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

  const handleModalClose = () => {
    setDataErro('');
    onClose();
  };

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
                  onChange={() => setTipoAtribuicao('individual')}
                />
                Individual
              </label>
              <label className={styles.radioItem}>
                <input
                  type="radio"
                  name="tipoAtribuicao"
                  value="equipe"
                  checked={tipoAtribuicao === 'equipe'}
                  onChange={() => setTipoAtribuicao('equipe')}
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
          <Select
            label="Selecionar responsável"
            value={responsavelId}
            onChange={(e) => setResponsavelId(e.target.value ? Number(e.target.value) : '')}
            options={[
              { value: '', label: 'Selecione um usuário...' },
              ...usuarios.map((u) => ({ value: u.id, label: `${u.nome} (${u.email})` })),
            ]}
          />
        ) : (
          <Select
            label="Selecionar equipe"
            value={equipeId}
            onChange={(e) => setEquipeId(e.target.value ? Number(e.target.value) : '')}
            options={[
              { value: '', label: 'Selecione uma equipe...' },
              ...equipes.map((eq) => ({ value: eq.id, label: eq.nome })),
            ]}
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
