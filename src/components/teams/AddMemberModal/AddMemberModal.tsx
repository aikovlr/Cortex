'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal/Modal';
import { Input } from '@/components/common/Input/Input';
import { Button } from '@/components/common/Button/Button';
import { equipeService } from '@/services/equipeService';
import { useToast } from '@/contexts/ToastContext';
import styles from './AddMemberModal.module.css';

interface AddMemberModalProps {
  equipeId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  equipeId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailLimpo = email.trim();
    if (!emailLimpo) {
      showToast('Digite o e-mail do usuário para adicionar.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await equipeService.adicionarMembro(equipeId, {
        email: emailLimpo,
        cargo: isAdmin ? 'Admin' : 'Membro',
      });
      showToast('Membro adicionado com sucesso à equipe!', 'success');
      setEmail('');
      setIsAdmin(false);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message, 'error');
      } else {
        showToast('Falha ao adicionar membro.', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Adicionar membro"
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
          label="E-mail do usuário *"
          type="email"
          placeholder="exemplo@cortex.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
        />

        <label className={styles.checkboxWrapper}>
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={isAdmin}
            onChange={(e) => setIsAdmin(e.target.checked)}
          />
          <span className={styles.checkboxLabel}>Adicionar como administrador?</span>
        </label>
      </form>
    </Modal>
  );
};
