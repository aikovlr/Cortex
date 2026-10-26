'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal/Modal';
import { Input } from '@/components/common/Input/Input';
import { Button } from '@/components/common/Button/Button';
import { equipeService } from '@/services/equipeService';
import { useToast } from '@/contexts/ToastContext';
import styles from './TeamCreateModal.module.css';

interface TeamCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (novaEquipe?: import('@/types/api').ConsultaEquipeDTO) => void;
}

export const TeamCreateModal: React.FC<TeamCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [nome, setNome] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      showToast('Por favor, informe o nome da equipe.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const novaEquipe = await equipeService.criarEquipe({ nome: nome.trim() });
      showToast('Equipe criada com sucesso!', 'success');
      setNome('');
      onSuccess(novaEquipe);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message, 'error');
      } else {
        showToast('Falha ao criar equipe.', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Criar equipe"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
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
          label="Nome da equipe *"
          required
          placeholder="Ex: Engenharia de Software, Design, Marketing..."
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
      </form>
    </Modal>
  );
};
