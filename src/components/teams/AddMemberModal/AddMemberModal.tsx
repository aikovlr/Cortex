'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal/Modal';
import { Select } from '@/components/common/Select/Select';
import { Button } from '@/components/common/Button/Button';
import { equipeService } from '@/services/equipeService';
import { usuarioService } from '@/services/usuarioService';
import { ConsultaUsuarioDTO } from '@/types/api';
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
  const [usuarios, setUsuarios] = useState<ConsultaUsuarioDTO[]>([]);
  const [usuarioId, setUsuarioId] = useState<number | ''>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (isOpen) {
      usuarioService
        .listarUsuarios()
        .then((dados) => {
          if (isMounted) setUsuarios(dados);
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioId) {
      showToast('Selecione um usuário para adicionar.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await equipeService.adicionarMembro(
        equipeId,
        Number(usuarioId),
        isAdmin ? 'Admin' : 'Membro'
      );
      showToast('Membro adicionado com sucesso à equipe!', 'success');
      setUsuarioId('');
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
        <Select
          label="Email / Nome do Usuário *"
          required
          value={usuarioId}
          onChange={(e) => setUsuarioId(e.target.value ? Number(e.target.value) : '')}
          options={[
            { value: '', label: 'Selecione o usuário...' },
            ...usuarios.map((u) => ({ value: u.id, label: `${u.nome} — ${u.email}` })),
          ]}
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
