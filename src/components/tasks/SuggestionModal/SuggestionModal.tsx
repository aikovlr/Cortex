'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal/Modal';
import { Button } from '@/components/common/Button/Button';
import { sugestaoService } from '@/services/sugestaoService';
import { useToast } from '@/contexts/ToastContext';

interface SuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tarefaId: number;
  tarefaTitulo: string;
  onSuccess?: () => void;
}

export const SuggestionModal: React.FC<SuggestionModalProps> = ({
  isOpen,
  onClose,
  tarefaId,
  tarefaTitulo,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [descricao, setDescricao] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) {
      showToast('Por favor, descreva sua sugestão.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await sugestaoService.submeterSugestao(tarefaId, descricao.trim());
      showToast('Sugestão enviada com sucesso para o criador da tarefa!', 'success');
      setDescricao('');
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message, 'error');
      } else {
        showToast('Falha ao enviar sugestão.', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sugerir alteração"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting}>
            Enviar Sugestão
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <p style={{ fontSize: '13px', color: 'var(--cortex-gray-text)', lineHeight: '1.4' }}>
          Envie uma proposta de ajuste de prazo, escopo ou prioridade para <strong>{tarefaTitulo}</strong>. O criador da tarefa poderá aprovar ou recusar sua solicitação.
        </p>

        <textarea
          style={{
            width: '100%',
            minHeight: '110px',
            backgroundColor: 'var(--cortex-dark-input)',
            border: '1px solid var(--cortex-border)',
            borderRadius: '8px',
            padding: '12px',
            color: 'var(--cortex-white)',
            fontSize: '14px',
            outline: 'none',
            resize: 'vertical',
          }}
          placeholder="Ex: Sugiro prorrogar a data de entrega em 2 dias para testes adicionais..."
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          required
        />
      </form>
    </Modal>
  );
};
